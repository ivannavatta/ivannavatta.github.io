import { Monogram } from '@/shared/components/Monogram/Monogram'
import { POSES, announceStageHover, blockProps, chapterProps, poseProps } from '@/shared/stage'
import styles from './Placeholders.module.css'

// TEMPORAL (ronda 0): secciones mínimas con los id, data-chapter, data-theme y los
// bloques del contrato de stage, para probar la escena 3D de punta a punta.
// Cada una se reemplaza por su feature en la ronda que le toca.

const TILE_LAYERS = [
  ['Interfaz', ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript']],
  ['Backend', ['Java', 'Python', 'Node.js y Express']],
  ['Datos', ['SQL', 'MongoDB']],
  ['Herramientas', ['Git', 'GitHub', 'VS Code', 'Figma', 'UML']],
  ['Método', ['Scrum', 'Análisis de sistemas']],
]
// Índice global de cada tecla (orden de documento), para el hover de la escena
const TILE_START = TILE_LAYERS.map((_, i) => TILE_LAYERS.slice(0, i).reduce((n, [, t]) => n + t.length, 0))

const STEPS = [
  { when: 'Jun. 2023 · 38 h', what: 'Desarrollo Web', where: 'Coderhouse', bars: 4 },
  { when: 'Ago. 2023 · 34 h', what: 'JavaScript', where: 'Coderhouse', bars: 3 },
  { when: 'Oct. 2023 · 30 h', what: 'React Js', where: 'Coderhouse · Top 10 del curso', bars: 3, accent: true },
  { when: 'May. 2024 · 94 h', what: 'Programación Backend', where: 'Coderhouse', bars: 9 },
]

export function ChapterPlaceholders() {
  return (
    <>
      <section {...chapterProps('perfil', 'light')} className={styles.perfil} aria-labelledby="perfil-title">
        <div className={styles.grid}>
          <div className={styles.perfilMain}>
            <h2 className={styles.head} id="perfil-title">
              Negocio, datos y código.
            </h2>
            <p className={styles.lead}>
              Estudio cómo la tecnología resuelve problemas de negocio, y programo desde 2023 para poder construir esas
              soluciones yo mismo.
            </p>
            <p className={styles.text}>
              Combino programación, bases de datos, infraestructura tecnológica y gestión de proyectos. Me definen la
              responsabilidad, el pensamiento analítico y las ganas de aprender.
            </p>
          </div>
          <div className={styles.perfilAside}>
            <Monogram pose={POSES.perfil} className={styles.perfilMono} />
          </div>
        </div>
      </section>

      <section {...chapterProps('proyectos', 'dark')} className={styles.work} aria-labelledby="work-title">
        <div className={styles.workPin}>
          <div className={styles.workHead}>
            <h2 className={styles.head} id="work-title">
              Proyectos
            </h2>
            <p className={styles.text}>MyTube · Sistema de transporte · uadeHUB · box9</p>
          </div>
          <div className={styles.workStage} />
          <div className={styles.workBase} {...poseProps(POSES.visor, { layout: 'bricks' })} aria-hidden="true" />
        </div>
      </section>

      <section {...chapterProps('stack', 'dark')} className={styles.stack} aria-labelledby="stack-title">
        <div className={styles.grid}>
          <div className={styles.stackIntro}>
            <h2 className={styles.head} id="stack-title">
              Stack, por capas
            </h2>
          </div>
          <div
            className={styles.stackLayers}
            {...poseProps(POSES.stack)}
            onPointerLeave={() => announceStageHover(POSES.stack, -1)}
          >
            {TILE_LAYERS.map(([name, tiles], layer) => (
              <div className={styles.layer} key={name}>
                <h3 className={styles.layerName}>{name}</h3>
                <ul className={styles.tiles}>
                  {tiles.map((tile, i) => {
                    const index = TILE_START[layer] + i
                    return (
                      <li key={tile}>
                        <button
                          type="button"
                          className={styles.tile}
                          {...blockProps()}
                          onFocus={() => announceStageHover(POSES.stack, index)}
                          onPointerEnter={() => announceStageHover(POSES.stack, index)}
                        >
                          {tile}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section {...chapterProps('recorrido', 'light')} className={styles.path} aria-labelledby="path-title">
        <h2 className={styles.head} id="path-title">
          Recorrido
        </h2>
        <ol className={styles.pathList} {...poseProps(POSES.path)}>
          {STEPS.map((step) => (
            <li className={styles.step} key={step.what}>
              <div className={styles.bars} aria-hidden="true">
                {Array.from({ length: step.bars }, (_, i) => {
                  const accent = step.accent && i === step.bars - 1
                  return <i key={i} className={accent ? styles.barAccent : undefined} {...blockProps({ accent })} />
                })}
              </div>
              <p className={styles.when}>{step.when}</p>
              <h3 className={styles.what}>{step.what}</h3>
              <p className={styles.where}>{step.where}</p>
            </li>
          ))}
          <li className={styles.step}>
            <p className={styles.when}>Mar. 2025 – hoy</p>
            <h3 className={styles.what}>Lic. en Gestión de TI</h3>
            <p className={styles.where}>UADE · Licenciatura en Gestión de la Tecnología de la Información</p>
          </li>
        </ol>
      </section>

      <section {...chapterProps('contacto', 'dark')} className={styles.contact} aria-labelledby="contact-title">
        <div className={styles.contactSay}>
          <h2 className={styles.head} id="contact-title">
            Contacto
          </h2>
          <p className={styles.lead}>Busco una pasantía o mi primer puesto como desarrollador.</p>
          <Monogram pose={POSES.contact} className={styles.contactMono} />
        </div>
        <footer className={styles.foot}>
          <p>Ivan Navatta · Buenos Aires · 2026</p>
          <a href="#inicio">Volver al inicio</a>
        </footer>
      </section>
    </>
  )
}
