import { Monogram } from '@/shared/components/Monogram/Monogram'
import { POSES, blockProps, chapterProps, poseProps } from '@/shared/stage'
import styles from './Placeholders.module.css'

// TEMPORAL (ronda 0): secciones mínimas con los id, data-chapter, data-theme y los
// bloques del contrato de stage, para probar la escena 3D de punta a punta.
// Cada una se reemplaza por su feature en la ronda que le toca.

const STEPS = [
  { when: 'Jun. 2023 · 38 h', what: 'Desarrollo Web', where: 'Coderhouse', bars: 4 },
  { when: 'Ago. 2023 · 34 h', what: 'JavaScript', where: 'Coderhouse', bars: 3 },
  { when: 'Oct. 2023 · 30 h', what: 'React Js', where: 'Coderhouse · Top 10 del curso', bars: 3, accent: true },
  { when: 'May. 2024 · 94 h', what: 'Programación Backend', where: 'Coderhouse', bars: 9 },
]

export function ChapterPlaceholders() {
  return (
    <>
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
