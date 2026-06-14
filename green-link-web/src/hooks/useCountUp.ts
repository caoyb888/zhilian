import { useEffect, useState } from 'react'

function parseNumeric(value: string): { num: number; suffix: string } {
  const match = value.match(/^(\d[\d,]*)(.*)$/)
  if (!match) return { num: 0, suffix: value }
  const num = Number(match[1].replace(/,/g, ''))
  return { num: Number.isNaN(num) ? 0 : num, suffix: match[2] }
}

export function useCountUp(value: string, duration = 1500, decimals = 0) {
  const { num: target, suffix } = parseNumeric(value)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let raf = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const easeOutQuart = 1 - (1 - progress) ** 4
      setDisplay(Number((target * easeOutQuart).toFixed(decimals)))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, decimals])

  return { display, suffix }
}
