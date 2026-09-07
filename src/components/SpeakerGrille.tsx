import { useLayoutEffect, useRef, useState } from 'react'
import { DOT_SIZE, centerDotCenters, computeRowStep, computeStep } from '../lib/grille'

interface Size {
  width: number
  height: number
}

export function SpeakerGrille() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = svgRef.current
    if (!el) return

    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stepX = computeStep(size.width)
  const rowStep = computeRowStep(size.width, size.height)
  const centerDots = centerDotCenters(size.width, size.height)

  return (
    <div className="divider-b min-h-0 flex-1 px-6 py-6 sm:flex-none">
      <svg ref={svgRef} className="block h-full w-full sm:h-[331px]" aria-hidden="true">
        <defs>
          {/* Вся решётка — по-прежнему один паттерн: сотни отдельных элементов
              на всю панель когда-то давали мерцание и нечёткость. Тёмными
              рисуются только точки центрального пятна, их полторы сотни.

              Гексагональная упаковка (как на иконке приложения), а не
              квадратная миллиметровка: тайл вдвое выше шага между рядами и
              содержит два кружка — чётный ряд по своему центру, нечётный тем
              же способом, но сдвинутый на полшага вправо. Оба кружка целиком
              внутри тайла — обрезки на стыке соседних тайлов не нужны. */}
          <pattern id="grille-dots" patternUnits="userSpaceOnUse" width={stepX} height={rowStep * 2}>
            {/* opacity поверх --color-ink-soft, а не отдельный ещё более
                светлый токен: decorative-точки решётки должны быть тусклее
                текста/декора, использующего тот же ink-soft в остальном UI,
                но не заводить под это специфику одну переменную в @theme. */}
            <circle
              cx={DOT_SIZE / 2}
              cy={DOT_SIZE / 2}
              r={DOT_SIZE / 2}
              className="fill-ink-soft"
              opacity={0.35}
            />
            <circle
              cx={DOT_SIZE / 2 + stepX / 2}
              cy={rowStep + DOT_SIZE / 2}
              r={DOT_SIZE / 2}
              className="fill-ink-soft"
              opacity={0.35}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grille-dots)" />
        {centerDots.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={DOT_SIZE / 2} className="fill-ink" />
        ))}
      </svg>
    </div>
  )
}
