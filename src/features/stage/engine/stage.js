// Orquestación de la escena: segmentos de scroll → poses del IN, mezcla de temas y trazas.
// Port de initMotion()/initReduced() del mockup, con limpieza completa (compatible con
// StrictMode, que monta, desmonta y vuelve a montar en desarrollo).
import { ScrollTrigger, gsap } from '@/shared/scroll'
import {
  HERO_PIN,
  MOTION_ATTR,
  MOTION_STATE,
  POSES,
  ROOT_CLASS,
  STAGE_HOVER_EVENT,
  selectors,
  setMotionState,
} from '@/shared/stage'
import { clamp01 } from './math'
import { buildPoses, buildReducedPoses } from './poses'
import { clearSurface, createThemeMixer, syncSurfaceFromSections } from './theme'
import { createTraceLayer } from './traces'

// three.js va en su propio chunk: la página se pinta antes de que cargue la escena
const loadScene = () => import('./scene')

const HERO_BACKDROP_AT = 0.2 // el fondo aparece al 20 % del pin del inicio
const LAYOUT_DEBOUNCE = 200

const chapter = (id) => document.querySelector(selectors.chapter(id))
const fontsReady = () => (document.fonts ? document.fonts.ready : Promise.resolve())

/** Avisa cuando cambia el alto de <main> (formularios que se abren, paneles, imágenes). */
function observeMainHeight(onChange) {
  const main = document.querySelector('main')
  if (!main) return { sync: () => {}, stop: () => {} }
  let last = main.scrollHeight
  let timer = 0
  const observer = new ResizeObserver(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const h = main.scrollHeight
      if (h === last) return
      last = h
      onChange()
    }, LAYOUT_DEBOUNCE)
  })
  observer.observe(main)
  return {
    sync: () => {
      last = main.scrollHeight
    },
    stop: () => {
      clearTimeout(timer)
      observer.disconnect()
    },
  }
}

export function startStage({ canvas, traces, mobile, reduced, classes }) {
  const root = document.documentElement
  const cleanups = []
  let disposed = false
  const traceLayer = createTraceLayer(traces, { live: !reduced, classes })
  cleanups.push(() => traceLayer.dispose())

  const setGl = (ok) => root.classList.add(ok ? ROOT_CLASS.gl : ROOT_CLASS.noGl)
  cleanups.push(() => root.classList.remove(ROOT_CLASS.gl, ROOT_CLASS.noGl))

  if (reduced) startReduced()
  else startLive()

  return () => {
    disposed = true
    while (cleanups.length) cleanups.pop()()
  }

  /* ---------- Movimiento reducido: IN estático en el inicio, tema por sección ---------- */
  function startReduced() {
    let scene = null
    const render = () => {
      if (!scene) return
      scene.resize()
      scene.renderOnce()
    }
    const relayout = () => {
      traceLayer.draw()
      render()
    }

    traceLayer.draw()
    syncSurfaceFromSections()
    const onScroll = () => syncSurfaceFromSections()
    window.addEventListener('scroll', onScroll, { passive: true })
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll)
      clearSurface()
    })

    let resizeTimer = 0
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(relayout, LAYOUT_DEBOUNCE)
    }
    window.addEventListener('resize', onResize)
    const heightWatch = observeMainHeight(relayout)
    cleanups.push(() => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      heightWatch.stop()
    })

    fontsReady().then(() => {
      if (!disposed) relayout()
    })

    loadScene()
      .then(({ createScene }) => {
        if (disposed) return
        scene = createScene(canvas, { mobile, reduced: true })
        setMotionState(MOTION_STATE.reduced)
        setGl(!!scene)
        if (!scene) return
        cleanups.push(() => scene.dispose())
        scene.setPoses(buildReducedPoses())
        scene.setState({ from: POSES.hero, to: POSES.hero, t: 0 })
        render()
      })
      .catch((err) => {
        console.warn('[IN] Escena no disponible:', err?.message)
        if (disposed) return
        setGl(false)
        setMotionState(MOTION_STATE.reduced)
      })
  }

  /* ---------- Movimiento completo ---------- */
  function startLive() {
    const triggers = []
    const create = (vars) => {
      const st = ScrollTrigger.create(vars)
      triggers.push(st)
      return st
    }
    cleanups.push(() => triggers.forEach((st) => st.kill()))

    // Avance del pin del inicio: mismo disparador y largo que el pin de la feature hero
    const hero = chapter('inicio')
    const heroST = hero
      ? create({ trigger: hero, start: 'top top', end: `+=${mobile ? HERO_PIN.mobile : HERO_PIN.desktop}%` })
      : null
    const heroP = () => (heroST ? heroST.progress : 0)

    const theme = createThemeMixer({
      getHeroBackdrop: () =>
        heroST && hero.dataset.backdrop
          ? { y: heroST.start + (heroST.end - heroST.start) * HERO_BACKDROP_AT, theme: hero.dataset.backdrop }
          : null,
    })
    cleanups.push(() => theme.dispose())

    /* ---- Segmentos: qué pose y cuánto de transición ---- */
    const seg = (id, start, end) => {
      const el = chapter(id)
      return el ? create({ trigger: el, start, end }) : null
    }
    const ampK = mobile ? 0.5 : 1
    const vh = () => window.innerHeight
    const segments = [
      {
        from: POSES.hero,
        to: POSES.firma,
        t: () => clamp01((heroP() - 0.3) / 0.48),
        amp: () => vh() * 0.38 * ampK,
        spin: 2.4,
        orderKey: 'firma',
      },
      { from: POSES.firma, to: POSES.perfil, st: seg('perfil', 'top 85%', 'top 15%'), amp: () => vh() * 0.08 * ampK, spin: 0.6 },
      {
        from: POSES.perfil,
        to: POSES.visor,
        st: seg('proyectos', 'top 75%', mobile ? 'top 10%' : 'top top'),
        amp: () => vh() * 0.16 * ampK,
        spin: 1.2,
      },
      { from: POSES.visor, to: POSES.stack, st: seg('stack', 'top 85%', 'top 15%'), amp: () => vh() * 0.2 * ampK, spin: 1.4 },
      { from: POSES.stack, to: POSES.path, st: seg('recorrido', 'top 85%', 'top 10%'), amp: () => vh() * 0.18 * ampK, spin: 1.2 },
      { from: POSES.path, to: POSES.contact, st: seg('contacto', 'top 85%', 'top 5%'), amp: () => vh() * 0.24 * ampK, spin: 1.6 },
    ].filter((s) => s.t || s.st)

    function sceneState() {
      for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i]
        const t = s.t ? s.t() : s.st.progress
        if (t <= 0) continue
        if (t >= 1) return { from: s.to, to: s.to, t: 0, amp: 0, spin: 0, orderKey: null }
        return { from: s.from, to: s.to, t, amp: s.amp(), spin: s.spin, orderKey: s.orderKey || null }
      }
      return { from: POSES.hero, to: POSES.hero, t: 0, amp: 0, spin: 0, orderKey: null }
    }
    if (import.meta.env.DEV) {
      window.__sceneState = sceneState
      cleanups.push(() => delete window.__sceneState)
    }

    /* ---- Escena 3D (carga diferida) ---- */
    let scene = null
    let poses = null
    const sceneLoaded = loadScene()
      .then(({ createScene }) => {
        if (disposed) return
        scene = createScene(canvas, { mobile, reduced: false })
        setGl(!!scene)
        if (!scene) return
        cleanups.push(() => {
          scene.dispose()
          scene = null
        })
        poses = buildPoses()
        scene.setPoses(poses)
        scene.resize()
      })
      .catch((err) => {
        console.warn('[IN] three.js no disponible:', err?.message)
        if (!disposed) setGl(false)
      })
    // Listo: escena resuelta (con o sin WebGL), fuentes cargadas y disparadores recalculados
    Promise.all([sceneLoaded, fontsReady()]).then(() =>
      requestAnimationFrame(() => {
        if (disposed) return
        refreshAll()
        if (document.documentElement.getAttribute(MOTION_ATTR) === MOTION_STATE.pending) setMotionState(MOTION_STATE.ready)
      }),
    )
    cleanups.push(() => {
      if (document.documentElement.getAttribute(MOTION_ATTR) === MOTION_STATE.ready) setMotionState(MOTION_STATE.pending)
    })

    // Inclinación del IN con el cursor (solo puntero fino)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const onPointer = (e) => {
        scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
      }
      window.addEventListener('pointermove', onPointer, { passive: true })
      cleanups.push(() => window.removeEventListener('pointermove', onPointer))
    }

    // Un bloque elevado (p. ej. la tecla del stack bajo el cursor)
    const onHover = (e) => {
      const { pose, index } = e.detail || {}
      if (!poses?.[pose] || poses[pose].hover === undefined) return
      poses[pose].hover = index
      scene?.setState({ hoverKey: `${pose}:${index}` })
      scene?.invalidate()
    }
    window.addEventListener(STAGE_HOVER_EVENT, onHover)
    cleanups.push(() => window.removeEventListener(STAGE_HOVER_EVENT, onHover))

    /* ---- Recalcular todo cuando ScrollTrigger recalcula ---- */
    const heightWatch = observeMainHeight(() => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    })
    const onRefresh = () => {
      heightWatch.sync()
      theme.buildStops()
      traceLayer.draw()
      theme.apply(window.scrollY)
      if (scene) {
        scene.resize()
        scene.invalidate()
      }
    }
    ScrollTrigger.addEventListener('refresh', onRefresh)
    cleanups.push(() => {
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      heightWatch.stop()
    })

    /* ---- Bucle: después de Lenis (que tiene prioridad en el ticker) y de ScrollTrigger ---- */
    let lastY = -1
    const tick = () => {
      const y = window.scrollY
      const moved = y !== lastY
      lastY = y
      theme.apply(y)
      const max = root.scrollHeight - window.innerHeight
      traceLayer.setProgress(max > 0 ? y / max : 0)
      if (scene) {
        scene.setState(sceneState())
        if (moved) scene.invalidate()
        scene.frame(performance.now())
      }
    }
    gsap.ticker.add(tick)
    cleanups.push(() => gsap.ticker.remove(tick))

    // Primer cálculo cuando ya montaron todas las secciones (y otra vez con las fuentes)
    const refreshAll = () => {
      if (disposed) return
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    }
    const frame = requestAnimationFrame(refreshAll)
    cleanups.push(() => cancelAnimationFrame(frame))
    fontsReady().then(refreshAll)
  }
}
