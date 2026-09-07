import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { useDrag } from '@use-gesture/react'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { useTiks } from '@rexa-developer/tiks/react'
import { UI_SOUND } from '../lib/sound'
import { stations } from '../lib/stations'
import { shortestStepDelta, wrapIndex } from '../lib/wheel'
import { vibrate } from '../lib/haptics'

interface JogWheelProps {
  activeIndex: number
  onStep: (delta: number) => void
}

const STEP_DEG = 45

// Недодемпфированная пружина (damping ниже критического): диск проскакивает
// деление на пару градусов и притягивается обратно — как будто провалился за
// упор, а не остановился ровно там, где сказали.
//
// Только для клавиатуры. При драге кольцо обязано следовать за указателем 1:1,
// и пружина там спорила бы с пальцем — ощущение щелчка деления в этом случае
// даёт не движение, а звук и вибрация, ровно как у настоящего колеса: вал
// жёстко связан с пальцем, деление слышно и осязаемо, но не видно.
const DETENT_SPRING = { type: 'spring', stiffness: 300, damping: 20 } as const

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
  const tiks = useTiks(UI_SOUND)
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  // Угол диска — производная от выбранной станции, а не свободная величина:
  // 45° на станцию, поэтому кружок-индикатор всегда стоит на своём делении и
  // проходит одинаковое расстояние при любом способе переключения. Раньше
  // rotation жил сам по себе, и клик по засечке не двигал диск вовсе.
  const rotation = useMotionValue(activeIndex * STEP_DEG)
  const lastPointerAngleRef = useRef(0)
  const accumulatedRef = useRef(0)
  const draggingRef = useRef(false)
  // Непрерывный угол деления, к которому диск обязан прийти. Именно непрерывный,
  // а не activeIndex * 45: на стыке кольца (последняя станция → первая) счёт от
  // индекса открутил бы диск назад через весь список.
  const rotationTargetRef = useRef(activeIndex * STEP_DEG)
  // Станция, которую диск уже отработал. Нужна, чтобы отличить своё
  // переключение от внешнего (клик по засечке) и не считать шаг дважды.
  const settledIndexRef = useRef(activeIndex)

  // Событие 'change' на стартовое значение не приходит, поэтому первый угол
  // пишем руками: иначе диск с восстановленной из localStorage станцией
  // рисовался бы на нуле и прыгнул бы на своё деление только при первом шаге.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (el) el.style.transform = `rotate(${rotation.get()}deg)`
  }, [rotation])

  useMotionValueEvent(rotation, 'change', (latest) => {
    const el = containerRef.current
    if (el) el.style.transform = `rotate(${latest}deg)`
  })

  // При «уменьшении движения» в системе диск встаёт на деление сразу — та же
  // настройка, которую уже уважает звук (см. UI_SOUND в lib/sound.ts).
  const settle = (target: number) => {
    if (shouldReduceMotion) rotation.set(target)
    else animate(rotation, target, DETENT_SPRING)
  }

  // Собственный шаг диска: сдвигаем цель и сразу помечаем станцию отработанной,
  // иначе эффект ниже принял бы её за внешнюю смену и добавил поворот второй раз.
  const stepBy = (delta: number) => {
    rotationTargetRef.current += delta * STEP_DEG
    settledIndexRef.current = wrapIndex(settledIndexRef.current + delta, stations.length)
    onStep(delta)
  }

  // Станцию сменили не диском (засечки, восстановление из localStorage) —
  // доводим кольцо до её деления кратчайшей дугой.
  useEffect(() => {
    if (settledIndexRef.current === activeIndex) return
    const delta = shortestStepDelta(settledIndexRef.current, activeIndex, stations.length)
    settledIndexRef.current = activeIndex
    rotationTargetRef.current += delta * STEP_DEG
    settle(rotationTargetRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, rotation])

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
      draggingRef.current = true
      lastPointerAngleRef.current = pointerAngle(x, y)
      // Не обнуляем, а берём фактический недокрут: жест может начаться, пока
      // предыдущая доводка ещё летит, и обнуление потеряло бы этот остаток.
      accumulatedRef.current = rotation.get() - rotationTargetRef.current
      return
    }

    if (last) {
      draggingRef.current = false
      // Палец отпущен — кольцо доводится пружиной до ближайшего деления.
      // Недокрут меньше 45°, поэтому доводка всегда короткая.
      accumulatedRef.current = 0
      settle(rotationTargetRef.current)
      return
    }

    const currentAngle = pointerAngle(x, y)
    const rawDelta = normalizeAngleDelta(currentAngle - lastPointerAngleRef.current)
    lastPointerAngleRef.current = currentAngle

    // Во время жеста кольцо идёт за пальцем 1:1 — пружина здесь спорила бы
    // с прямым управлением и читалась бы как лаг.
    rotation.set(rotation.get() + rawDelta)
    accumulatedRef.current += rawDelta

    while (accumulatedRef.current >= STEP_DEG) {
      stepBy(1)
      tiks.click()
      vibrate(8)
      accumulatedRef.current -= STEP_DEG
    }
    while (accumulatedRef.current <= -STEP_DEG) {
      stepBy(-1)
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
    stepBy(delta)
    tiks.click()
    vibrate(8)
    settle(rotationTargetRef.current)
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
          // cream-dark (контраст 1.08:1 к лицевой части) гнездо индикатора
          // делал почти невидимым — cream-shadow того же кольца ручки даёт
          // 1.28:1, не вводя нового цвета.
          background: 'var(--color-cream-shadow)',
        }}
      />
    </div>
  )
}
