import { useLayoutEffect, useRef, useState } from 'react'
import { DOT_SIZE, computeStep } from '../lib/grille'

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
