import { useEffect, useLayoutEffect, useRef } from 'react'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { stations } from '../lib/stations'
import { vibrate } from '../lib/haptics'

interface StationTicksProps {
  activeIndex: number
  onSelect: (index: number) => void
}

// Точка остаётся 4×4 px, но зона нажатия расширена псевдоэлементом до 28×28
// (WCAG 2.5.8 требует минимум 24×24). Через padding сделать нельзя: кнопки
// разложены justify-between, и рост коробки сдвинул бы сами засечки внутрь —
// псевдоэлемент же на раскладку не влияет.
const TICK_CLASS =
  "relative h-1 w-1 rounded-full bg-ink transition-opacity after:absolute after:-inset-3 after:content-['']"

const INDICATOR_WIDTH = 14
const INDICATOR_HEIGHT = 2
const INDICATOR_TWEEN = { type: 'tween', duration: 0.25, ease: 'easeOut' } as const

export function StationTicks({ activeIndex, onSelect }: StationTicksProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tickRefs = useRef<(HTMLButtonElement | null)[]>([])
  const indicatorRef = useRef<HTMLDivElement>(null)
  // Позиция индикатора считается измерением реальных DOM-узлов (как
  // pointerAngle в JogWheel), а не аналитической формулой по justify-between —
  // устойчиво к будущим правкам паддингов и зазоров ряда.
  const x = useMotionValue(0)
  const shouldReduceMotion = useReducedMotion()
  // ResizeObserver заводится один раз при монтировании (см. эффект ниже) —
  // без ref его коллбэк держал бы activeIndex в замыкании со значения на
  // момент монтирования и после смены станции пересчитывал бы позицию не
  // для той засечки.
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  const measureTarget = (index: number): number | null => {
    const container = containerRef.current
    const tick = tickRefs.current[index]
    if (!container || !tick) return null
    const containerRect = container.getBoundingClientRect()
    const tickRect = tick.getBoundingClientRect()
    return tickRect.left - containerRect.left + tickRect.width / 2 - INDICATOR_WIDTH / 2
  }

  const applyInstant = (target: number) => {
    x.set(target)
    const el = indicatorRef.current
    if (el) el.style.transform = `translateX(${target}px)`
  }

  // Стартовая позиция без анимации — иначе индикатор приезжал бы от нуля
  // при каждом монтировании (тот же приём, что у стартового угла JogWheel).
  useLayoutEffect(() => {
    const target = measureTarget(activeIndex)
    if (target !== null) applyInstant(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMotionValueEvent(x, 'change', (latest) => {
    const el = indicatorRef.current
    if (el) el.style.transform = `translateX(${latest}px)`
  })

  useEffect(() => {
    const target = measureTarget(activeIndex)
    if (target === null) return
    // Та же системная настройка, что уже уважает звук и пружину диска.
    if (shouldReduceMotion) applyInstant(target)
    else animate(x, target, INDICATOR_TWEEN)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, shouldReduceMotion])

  // Пересчёт при изменении ширины ряда (смена брейкпоинта, ресайз окна).
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      const target = measureTarget(activeIndexRef.current)
      if (target !== null) applyInstant(target)
    })
    observer.observe(container)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={containerRef} className="relative flex items-center justify-between px-6 pt-3 pb-3.5">
      {/* Скользит к активной засечке по линии разделителя над рядом — дополняет
          opacity точек, не заменяет её. aria-hidden: состояние уже объявлено
          через aria-current на кнопках ниже. */}
      <div
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: INDICATOR_WIDTH,
          height: INDICATOR_HEIGHT,
          top: -INDICATOR_HEIGHT / 2,
          left: 0,
          background: 'var(--color-accent)',
        }}
      />
      {stations.map((station, i) => (
        <button
          key={station.id}
          ref={(el) => {
            tickRefs.current[i] = el
          }}
          type="button"
          onClick={() => {
            vibrate(8)
            onSelect(i)
          }}
          aria-label={station.name}
          aria-current={i === activeIndex}
          className={TICK_CLASS}
          style={{ opacity: i === activeIndex ? 0.9 : 0.3 }}
        />
      ))}
    </div>
  )
}
