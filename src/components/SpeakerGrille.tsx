import { useLayoutEffect, useRef, useState } from 'react'
import { DOT_SIZE, centerDotCenters, computeStep } from '../lib/grille'

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
  const stepY = computeStep(size.height)
  const centerDots = centerDotCenters(size.width, size.height)

  return (
    <div className="divider-b min-h-0 flex-1 p-5 sm:flex-none">
      <svg ref={svgRef} className="block h-full w-full sm:h-[331px]" aria-hidden="true">
        <defs>
          {/* Вся решётка — по-прежнему один паттерн: сотни отдельных элементов
              на всю панель когда-то давали мерцание и нечёткость. Тёмными
              рисуются только точки центрального пятна, их полторы сотни. */}
          <pattern id="grille-dots" patternUnits="userSpaceOnUse" width={stepX} height={stepY}>
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
