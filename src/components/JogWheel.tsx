import { useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useTactileSound } from '../hooks/useTactileSound'

interface JogWheelProps {
  onStep: (delta: number) => void
}

const STEP_DEG = 45

function normalizeAngleDelta(delta: number): number {
  let d = delta % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

export function JogWheel({ onStep }: JogWheelProps) {
  const { play } = useTactileSound()
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

  const bind = useDrag(({ xy: [x, y], first, last }) => {
    if (first) {
      play('click')
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
      play('wheelDetent')
      accumulatedRef.current -= STEP_DEG
    }
    while (accumulatedRef.current <= -STEP_DEG) {
      onStep(-1)
      play('wheelDetent')
      accumulatedRef.current += STEP_DEG
    }

    if (last) play('release')
  })

  return (
    <div
      ref={containerRef}
      {...bind()}
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
