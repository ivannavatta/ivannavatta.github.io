import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useScroll } from '@/shared/scroll'
import { MOBILE_QUERY } from '@/shared/stage'
import { startStage } from '../engine/stage'
import styles from './Stage.module.css'

const TRACE_CLASSES = { net: styles.net, pad: styles.pad, route: styles.route, node: styles.node }

/**
 * La escena que acompaña toda la página: el IN 3D (canvas), las trazas de circuito de
 * fondo con la ruta del margen y la mezcla de tema por capítulo. Es decorativa: el canvas
 * y las trazas quedan fuera del árbol de accesibilidad.
 *
 * Se monta después de <main>: lee las secciones a través del contrato de src/shared/stage.
 * Al cruzar el corte mobile se rearma (en mobile cada slot es un bloque; en escritorio, cuatro).
 */
export function Stage() {
  const canvasRef = useRef(null)
  const tracesRef = useRef(null)
  const { reduced } = useScroll()
  const mobile = useMediaQuery(MOBILE_QUERY)

  useEffect(() => {
    if (!canvasRef.current || !tracesRef.current) return undefined
    return startStage({
      canvas: canvasRef.current,
      traces: tracesRef.current,
      mobile,
      reduced,
      classes: TRACE_CLASSES,
    })
  }, [mobile, reduced])

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <svg ref={tracesRef} className={styles.traces} aria-hidden="true" focusable="false" />
    </>
  )
}
