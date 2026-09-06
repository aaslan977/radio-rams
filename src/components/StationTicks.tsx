import { stations } from '../lib/stations'

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

export function StationTicks({ activeIndex, onSelect }: StationTicksProps) {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-3.5">
      {stations.map((station, i) => (
        <button
          key={station.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={station.name}
          aria-current={i === activeIndex}
          className={TICK_CLASS}
          style={{ opacity: i === activeIndex ? 0.9 : 0.3 }}
        />
      ))}
    </div>
  )
}
