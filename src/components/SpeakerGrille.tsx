import { useLayoutEffect, useRef, useState } from 'react'

const DOT_SIZE = 8
const GAP = 9

interface Size {
  width: number
  height: number
}

// Раньше CSS grid (`auto-fill` + `justify-between`) сам подбирал, сколько
// целых точек влезает по ширине/высоте, и растягивал зазоры так, чтобы
// первая и последняя точка стояли строго по краям — ни одна не обрезалась.
// У SVG-паттерна нет аналога auto-fill, поэтому шаг сетки пересчитывается
// вручную под фактический размер контейнера тем же способом.
function computeStep(size: number): number {
  if (size <= 0) return DOT_SIZE + GAP
  const count = Math.max(1, Math.floor((size + GAP) / (DOT_SIZE + GAP)))
  return count > 1 ? (size - DOT_SIZE) / (count - 1) : size
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

  return (
    <div className="divider-b min-h-0 flex-1 px-6 py-6 sm:flex-none">
      <svg ref={svgRef} className="block h-full w-full sm:h-[331px]" aria-hidden="true">
        <defs>
          <pattern id="grille-dots" patternUnits="userSpaceOnUse" width={stepX} height={stepY}>
            <circle cx={DOT_SIZE / 2} cy={DOT_SIZE / 2} r={DOT_SIZE / 2} className="fill-ink" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grille-dots)" />
      </svg>
    </div>
  )
}
