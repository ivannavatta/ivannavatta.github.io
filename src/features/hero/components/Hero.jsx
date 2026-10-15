import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { lazy, Suspense, useRef } from 'react'
import { FiArrowDown, FiArrowUpRight, FiDownload, FiMapPin } from 'react-icons/fi'
import { EASE_OUT } from '@/shared/animations/variants'
import { Button } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useMediaQuery, usePrefersReducedMotion, useSmoothScroll, useYearsCoding } from '@/shared/hooks'
import { useTranslation } from '@/shared/i18n'
import { useTypewriter } from '../hooks/useTypewriter'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import styles from '../Hero.module.css'

// El 3D se carga aparte para que el texto aparezca de inmediato
const Scene3D = lazy(() => import('./Scene3D'))

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE_OUT } },
}

const letter = {
  hidden: { opacity: 0, y: '100%', rotateX: -80 },
  visible: { opacity: 1, y: '0%', rotateX: 0, transition: { duration: 0.9, ease: EASE_OUT } },
}

function AnimatedWord({ text, className = '' }) {
  return (
    <motion.span
      className={`${styles.word} ${className}`}
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
    >
      {[...text].map((char, index) => (
        <motion.span key={`${char}-${index}`} className={styles.letter} variants={letter}>
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}

export function Hero({ ready = true }) {
  const { t, localize } = useTranslation({ es, en })
  const { scrollTo } = useSmoothScroll()
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useMediaQuery('(max-width: 900px)')
  const years = useYearsCoding()
  const typed = useTypewriter(t.roles, { paused: reducedMotion })

  const sectionRef = useRef(null)
  const sceneInView = useInView(sectionRef, { margin: '0px 0px -10% 0px' })
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 0.75])
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0])

  const go = (id) => (event) => {
    event.preventDefault()
    scrollTo(`#${id}`)
  }

  return (
    <section id="home" ref={sectionRef} className={styles.hero}>
      <motion.div
        className={styles.scene}
        style={reducedMotion ? undefined : { scale: sceneScale, opacity: sceneOpacity }}
      >
        <motion.div
          className={styles.sceneInner}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={ready ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 1.6, ease: EASE_OUT }}
        >
          <div className={styles.sceneGlow} aria-hidden="true" />
          <Suspense fallback={null}>
            <Scene3D active={sceneInView} animated={!reducedMotion} ready={ready} isMobile={isMobile} />
          </Suspense>
        </motion.div>
      </motion.div>

      <motion.div
        className={`container ${styles.content}`}
        style={reducedMotion ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          className={styles.text}
          variants={container}
          initial="hidden"
          animate={ready ? 'visible' : 'hidden'}
        >
          {profile.availableForWork && (
            <motion.p className={styles.badge} variants={item}>
              <span className={styles.pulse} aria-hidden="true" />
              {t.available}
            </motion.p>
          )}

          <motion.p className={styles.greeting} variants={item}>
            {t.greeting}
          </motion.p>

          <motion.h1 className={styles.name} variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
            <AnimatedWord text={profile.firstName} />
            <AnimatedWord text={profile.lastName} className="gradient-text" />
          </motion.h1>

          <motion.p className={styles.role} variants={item} aria-label={t.roles.join(', ')}>
            <span className={styles.prompt} aria-hidden="true">
              &gt;_
            </span>
            <span aria-hidden="true">{typed}</span>
            <span className={styles.caret} aria-hidden="true" />
          </motion.p>

          <motion.p className={styles.description} variants={item}>
            {t.descriptionStart} <strong>{localize(profile.degree)}</strong> ({profile.university}). {t.descriptionEnd}
          </motion.p>

          <motion.div className={styles.ctas} variants={item}>
            <Button href="#projects" onClick={go('projects')} icon={<FiArrowUpRight />}>
              {t.ctaProjects}
            </Button>
            <Button href="#contact" onClick={go('contact')} variant="ghost">
              {t.ctaContact}
            </Button>
            {profile.cvUrl && (
              <Button
                href={profile.cvUrl}
                download={`${profile.fullName.replace(' ', '-')}-CV.pdf`}
                variant="ghost"
                icon={<FiDownload />}
                magnetic={false}
              >
                {t.ctaCv}
              </Button>
            )}
          </motion.div>

          <motion.ul className={styles.meta} variants={item}>
            <li>
              <strong className="gradient-text">{years}+</strong> {t.yearsCoding}
            </li>
            <li>
              <FiMapPin aria-hidden="true" /> {localize(profile.location)}
            </li>
          </motion.ul>
        </motion.div>
      </motion.div>

      <motion.a
        href="#about"
        className={styles.scrollHint}
        onClick={go('about')}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: 1.4, duration: 0.8 }}
        aria-label={t.scroll}
      >
        <span className={styles.mouse}>
          <span className={styles.wheel} />
        </span>
        <span className={styles.scrollText}>
          {t.scroll} <FiArrowDown />
        </span>
      </motion.a>
    </section>
  )
}
