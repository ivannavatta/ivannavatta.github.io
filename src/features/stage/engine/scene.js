// Escena 3D: el monograma IN hecho de bloques (port de scene.js del mockup).
// Cada "pose" es una lista de rectángulos del DOM (slots). Los bloques se alinean con la
// cara frontal sobre esos rectángulos, así la escena y el HTML comparten grilla.
// Render a demanda: solo dibuja si algo cambió (scroll, cursor, hover, inercia).
import {
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshStandardMaterial,
  NoToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  Quaternion,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mulberry32 } from '@/shared/utils/traceNet'
import { clamp01, easeInOut } from './math'
import { RoomEnvironment } from './roomEnvironment'

export const SLOTS = 19
const MAX_DPR = 1.5
const FOV = 22
const DIST = 40


export function createScene(canvas, { mobile = false, reduced = false } = {}) {
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' })
    if (!renderer.getContext()) throw new Error('sin contexto')
  } catch (err) {
    console.info('[IN] WebGL no disponible, se usa el monograma plano.', err?.message)
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  renderer.setClearColor(0x000000, 0)
  // En producción no se consulta el log de cada shader (evita esperas de GPU y el aviso de
  // precisión del compilador D3D en Windows); en desarrollo sí, para ver errores reales.
  renderer.debug.checkShaderErrors = import.meta.env.DEV

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envTarget = pmrem.fromScene(room, 0.04)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 0.5
  pmrem.dispose()
  room.dispose()

  const key = new DirectionalLight(0xffffff, 2.2)
  key.position.set(-3, 5, 9)
  scene.add(key)
  const rim = new DirectionalLight(0xffffff, 0.6)
  rim.position.set(6, -2, 4)
  scene.add(rim)

  const camera = new PerspectiveCamera(FOV, 1, 1, 200)
  camera.position.set(0, 0, DIST)

  const K = mobile ? 1 : 4 // sub-bloques por slot
  const N = SLOTS * K
  const geo = new RoundedBoxGeometry(1, 1, 1, mobile ? 2 : 3, 0.06)
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.48, metalness: 0.02 })
  const mesh = new InstancedMesh(geo, mat, N)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(N * 3), 3)
  mesh.instanceColor.setUsage(DynamicDrawUsage)
  mesh.frustumCulled = false
  scene.add(mesh)

  // Datos aleatorios fijos por bloque: la misma explosión en cada visita
  const rnd = mulberry32(2023)
  const R = Array.from({ length: N }, () => ({
    relief: rnd(),
    order: rnd(),
    dir: new Vector3(rnd() * 2 - 1, rnd() * 2 - 1, 0.35 + rnd() * 0.65).normalize(),
    axis: new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
    spin: 0.5 + rnd() * 0.5,
  }))

  let W = 1
  let H = 1
  let upp = 1
  let dirty = true

  function resize() {
    W = window.innerWidth
    H = window.innerHeight
    if (reduced) H = canvas.clientHeight || H
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    upp = (2 * DIST * Math.tan(MathUtils.degToRad(FOV / 2))) / H
    dirty = true
  }

  // Buffers de pose
  const mkPose = () => ({
    pos: new Float32Array(N * 3),
    scl: new Float32Array(N * 3),
    col: new Float32Array(N * 3),
    cx: 0,
    cy: 0,
    inter: 0,
    visible: true,
  })
  const PA = mkPose()
  const PB = mkPose()
  const tmpColor = new Color()
  const accentColor = new Color()
  const hoverColor = new Color()

  // Elevación suave del bloque en hover (≈150 ms, interrumpible)
  const hv = new Float32Array(SLOTS)
  let hvTarget = -1
  function stepHover(dt) {
    const k = 1 - Math.exp(-dt * 16)
    let moving = false
    for (let s = 0; s < SLOTS; s++) {
      const target = s === hvTarget ? 1 : 0
      const d = target - hv[s]
      if (Math.abs(d) > 0.002) {
        hv[s] += d * k
        moving = true
      } else hv[s] = target
    }
    return moving
  }

  function computePose(desc, out) {
    const rects = desc.slots()
    if (!rects.length) {
      out.visible = false
      return
    }
    const S = rects.length
    const accentSlots = desc.accentSlots ? desc.accentSlots() : []
    tmpColor.set(desc.color)
    accentColor.set(desc.accent || desc.color)
    hoverColor.set(desc.hoverColor || desc.accent || desc.color)
    let sx = 0
    let sy = 0
    let vis = false
    const n = Math.min(S, SLOTS)
    for (let s = 0; s < n; s++) {
      const r = rects[s]
      sx += r.x + r.w / 2
      sy += r.y + r.h / 2
      if (r.y + r.h > -H * 0.25 && r.y < H * 1.25) vis = true
    }
    out.cx = (sx / n - W / 2) * upp
    out.cy = -(sy / n - H / 2) * upp
    out.inter = desc.interactive || 0
    out.visible = vis
    for (let i = 0; i < N; i++) {
      let slot = Math.floor(i / K)
      const sub = i % K
      let behind = false
      if (slot >= S) {
        slot %= S
        behind = true
      }
      const r = rects[slot]
      let { x, y, w, h } = r
      if (desc.mode === 'split' && K === 4) {
        const g = Math.min(w, h) * 0.06
        w = r.w / 2
        h = r.h / 2
        x = r.x + (sub % 2) * w + g / 2
        y = r.y + Math.floor(sub / 2) * h + g / 2
        w -= g
        h -= g
      }
      const d = (desc.depth ? desc.depth(r) : Math.min(r.w, r.h)) * upp
      let z = -d / 2
      if (desc.relief) z += R[i].relief * d * 0.32 * desc.relief
      if (behind) z -= d * 1.05
      const hAmt = desc.hover !== undefined && !behind ? hv[slot] : 0
      if (hAmt) z += d * 0.45 * hAmt
      out.pos[i * 3] = (x + w / 2 - W / 2) * upp
      out.pos[i * 3 + 1] = -(y + h / 2 - H / 2) * upp
      out.pos[i * 3 + 2] = z
      out.scl[i * 3] = Math.max(w * upp, 1e-4)
      out.scl[i * 3 + 1] = Math.max(h * upp, 1e-4)
      out.scl[i * 3 + 2] = Math.max(d, 1e-4)
      const c = accentSlots.includes(slot) ? accentColor : tmpColor
      out.col[i * 3] = c.r + (hoverColor.r - c.r) * hAmt
      out.col[i * 3 + 1] = c.g + (hoverColor.g - c.g) * hAmt
      out.col[i * 3 + 2] = c.b + (hoverColor.b - c.b) * hAmt
    }
  }

  // Estado
  let poses = {}
  let state = { from: 'hero', to: 'hero', t: 0, amp: 0, spin: 0, orderKey: null, hoverKey: -1 }
  const pointer = { tx: 0, ty: 0, x: 0, y: 0 }
  let lastTime = performance.now()
  let clock = 0

  const m4 = new Matrix4()
  const q = new Quaternion()
  const qSpin = new Quaternion()
  const qGroup = new Quaternion()
  const eul = new Euler()
  const v = new Vector3()
  const sV = new Vector3()
  const cV = new Vector3()
  const col = new Color()

  function update(dt) {
    const A = poses[state.from]
    const B = poses[state.to]
    if (!A || !B) return false
    computePose(A, PA)
    if (state.to !== state.from) computePose(B, PB)
    const mixing = state.to !== state.from && state.t > 0
    const P2 = mixing ? PB : PA
    if (!PA.visible && !(mixing && PB.visible)) return false

    // Inercia del cursor
    const k = 1 - Math.exp(-dt * 4.5)
    pointer.x += (pointer.tx - pointer.x) * k
    pointer.y += (pointer.ty - pointer.y) * k
    clock += dt

    const tg = mixing ? state.t : 0
    const eg = easeInOut(tg)
    const inter = PA.inter + (P2.inter - PA.inter) * eg
    const sway = reduced ? 0 : Math.sin(clock * 0.45) * 0.07
    eul.set(pointer.y * 0.32 * inter, (pointer.x * 0.5 + sway) * inter, 0, 'XYZ')
    qGroup.setFromEuler(eul)
    const cx = PA.cx + (P2.cx - PA.cx) * eg
    const cy = PA.cy + (P2.cy - PA.cy) * eg
    cV.set(cx, cy, 0)

    const spread = 0.55
    const ampW = state.amp * upp
    for (let i = 0; i < N; i++) {
      const slot = Math.floor(i / K)
      const ord =
        state.orderKey === 'firma' ? (slot === 13 ? 1 : R[i].order * 0.8) : 0.55 * (slot / (SLOTS - 1)) + 0.45 * R[i].order
      const ti = mixing ? clamp01((tg - ord * spread) / (1 - spread)) : 0
      const e = easeInOut(ti)
      const bump = Math.sin(Math.PI * ti)
      const i3 = i * 3
      v.set(
        PA.pos[i3] + (P2.pos[i3] - PA.pos[i3]) * e,
        PA.pos[i3 + 1] + (P2.pos[i3 + 1] - PA.pos[i3 + 1]) * e,
        PA.pos[i3 + 2] + (P2.pos[i3 + 2] - PA.pos[i3 + 2]) * e,
      )
      if (bump > 0 && ampW > 0) v.addScaledVector(R[i].dir, bump * ampW)
      sV.set(
        PA.scl[i3] + (P2.scl[i3] - PA.scl[i3]) * e,
        PA.scl[i3 + 1] + (P2.scl[i3 + 1] - PA.scl[i3 + 1]) * e,
        PA.scl[i3 + 2] + (P2.scl[i3 + 2] - PA.scl[i3 + 2]) * e,
      )
      qSpin.setFromAxisAngle(R[i].axis, bump * state.spin * R[i].spin)
      // rotación de grupo alrededor del centro
      if (inter > 0.001) {
        v.sub(cV).applyQuaternion(qGroup).add(cV)
        q.copy(qGroup).multiply(qSpin)
      } else {
        q.copy(qSpin)
      }
      m4.compose(v, q, sV)
      mesh.setMatrixAt(i, m4)
      col.setRGB(
        PA.col[i3] + (P2.col[i3] - PA.col[i3]) * e,
        PA.col[i3 + 1] + (P2.col[i3 + 1] - PA.col[i3 + 1]) * e,
        PA.col[i3 + 2] + (P2.col[i3 + 2] - PA.col[i3 + 2]) * e,
      )
      mesh.setColorAt(i, col)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
    return true
  }

  let wasVisible = true
  function frame(now = performance.now()) {
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    if (document.hidden) return
    const settling = Math.abs(pointer.tx - pointer.x) > 1e-4 || Math.abs(pointer.ty - pointer.y) > 1e-4
    const A = poses[state.from]
    const B = poses[state.to]
    const idle = !reduced && ((A && A.interactive) || (B && B.interactive))
    hvTarget = B && B.hover !== undefined ? B.hover : A && A.hover !== undefined ? A.hover : -1
    const hovering = stepHover(dt)
    if (!dirty && !settling && !idle && !hovering) return
    dirty = false
    const vis = update(dt)
    // Fuera de vista no se dibuja; se limpia una vez para no dejar el último cuadro pintado
    if (vis) renderer.render(scene, camera)
    else if (wasVisible) renderer.clear()
    wasVisible = vis
  }

  const onVisibility = () => {
    lastTime = performance.now()
    dirty = true
  }
  document.addEventListener('visibilitychange', onVisibility)

  resize()

  return {
    setPoses(p) {
      poses = p
      dirty = true
    },
    setState(s) {
      if (
        s.from !== state.from ||
        s.to !== state.to ||
        Math.abs((s.t ?? state.t) - state.t) > 1e-5 ||
        (s.hoverKey !== undefined && s.hoverKey !== state.hoverKey)
      )
        dirty = true
      state = { ...state, ...s }
    },
    setPointer(nx, ny) {
      pointer.tx = nx
      pointer.ty = ny
    },
    invalidate() {
      dirty = true
    },
    resize,
    frame,
    renderOnce() {
      dirty = true
      frame(performance.now())
    },
    dispose() {
      document.removeEventListener('visibilitychange', onVisibility)
      scene.remove(mesh)
      mesh.dispose()
      geo.dispose()
      mat.dispose()
      envTarget.dispose()
      scene.environment = null
      renderer.renderLists.dispose()
      renderer.dispose()
    },
  }
}
