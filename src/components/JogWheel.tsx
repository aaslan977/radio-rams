import { useRef, type KeyboardEvent } from 'react'
import { useDrag } from '@use-gesture/react'
import { useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useTiks } from '@rexa-developer/tiks/react'
import { stations } from '../lib/stations'
import { vibrate } from '../lib/haptics'

interface JogWheelProps {
  activeIndex: number
  onStep: (delta: number) => void
}

const STEP_DEG = 45

// Диск — <div> с жестами, клавиатура для него сама собой не работает. Без этих
// клавиш станцию нельзя переключить с клавиатуры вообще: единственный
// альтернативный орган управления — засечки размером с точку.
const KEY_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
}

function normalizeAngleDelta(delta: number): number {
  let d = delta % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

export function JogWheel({ activeIndex, onStep }: JogWheelProps) {
  // Громкость по умолчанию у tiks — 0.3 при диапазоне [0, 1]; поднято до 0.45
  // (примерно +3.5 дБ), потому что на фоне играющей станции щелчок деления
  // терялся.
  //
  // Внимание: громкость у tiks ОБЩАЯ на всё приложение. Экземпляр из useTiks
  // хранит только тему, а звук играет модульный синглтон — setVolume у него
  // один на всех. Амплитуда каждого звука зашита константой в генераторе, темой
  // не регулируется, так что поднять только диск, не трогая кнопку play,
  // библиотека не позволяет: она тоже звучит на +3.5 дБ. PlayButton громкость
  // не передаёт, а init применяет её только когда она задана явно, — поэтому
  // значение отсюда и остаётся действующим. Не добавляй volume в PlayButton:
  // он молча перебьёт это значение.
  const tiks = useTiks({ theme: 'soft', volume: 0.45 })
  const containerRef = useRef<HTMLDivElement>(null)
  const rotation = useMotionValue(0)
  const lastPointerAngleRef = useRef(0)
  const accumulatedRef = useRef(0)

  useMotionValueEvent(rotation, 'change', (latest) => {
    const el = containerRef.current
    if (el) el.style.transform = `rotate(${latest}deg)`
  })

  const pointerAngle = (x: number, y: number): number => {
    const el = containerRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return (Math.atan2(y - cy, x - cx) * 180) / Math.PI
  }

  const bind = useDrag(({ xy: [x, y], first }) => {
    if (first) {
      lastPointerAngleRef.current = pointerAngle(x, y)
      accumulatedRef.current = 0
      return
    }

    const currentAngle = pointerAngle(x, y)
    const rawDelta = normalizeAngleDelta(currentAngle - lastPointerAngleRef.current)
    lastPointerAngleRef.current = currentAngle

    rotation.set(rotation.get() + rawDelta)
    accumulatedRef.current += rawDelta

    while (accumulatedRef.current >= STEP_DEG) {
      onStep(1)
      tiks.click()
      vibrate(8)
      accumulatedRef.current -= STEP_DEG
    }
    while (accumulatedRef.current <= -STEP_DEG) {
      onStep(-1)
      tiks.click()
      vibrate(8)
      accumulatedRef.current += STEP_DEG
    }
  })

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = KEY_STEPS[event.key]
    if (delta === undefined) return
    // Иначе стрелки прокрутят страницу вместо настройки.
    event.preventDefault()
    onStep(delta)
    tiks.click()
    vibrate(8)
    // Доворачиваем диск на тот же шаг, что и мышью — чтобы с клавиатуры
    // управление выглядело так же, а не только меняло станцию.
    rotation.set(rotation.get() + delta * STEP_DEG)
  }

  return (
    <div
      ref={containerRef}
      {...bind()}
      role="slider"
      tabIndex={0}
      aria-label="Настройка станции"
      aria-valuemin={1}
      aria-valuemax={stations.length}
      aria-valuenow={activeIndex + 1}
      aria-valuetext={stations[activeIndex].name}
      onKeyDown={handleKeyDown}
      className="relative aspect-square w-[58.5%] max-w-[240px] touch-none select-none cursor-grab active:cursor-grabbing"
      style={{
        borderRadius: '50%',
        background: 'var(--color-cream-dark)',
        boxShadow: '0 0 0 2px var(--color-cream-shadow), 0 2px 3px rgba(0,0,0,0.18)',
      }}
    >
      <div
        className="absolute rounded-full"
        style={{ inset: '9%', background: 'var(--color-cream)' }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '20%',
          height: '20%',
          top: '14%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-cream-dark)',
        }}
      />
    </div>
  )
}
