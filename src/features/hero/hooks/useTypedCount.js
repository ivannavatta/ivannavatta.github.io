import { useEffect, useState } from 'react'

/**
 * Cuenta cuántos caracteres de `total` se "tipearon".
 * Si `enabled` es false (reduced motion) devuelve el total directamente.
 */
export function useTypedCount(total, { enabled = true, speed = 38, startDelay = 900 } = {}) {
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let interval
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setTyped((current) => {
          if (current >= total) {
            clearInterval(interval)
            return current
          }
          return current + 1
        })
      }, speed)
    }, startDelay)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [enabled, total, speed, startDelay])

  return enabled ? typed : total
}
