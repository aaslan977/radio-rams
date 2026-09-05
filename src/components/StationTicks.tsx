import { stations } from '../lib/stations'

interface StationTicksProps {
  activeIndex: number
  onSelect: (index: number) => void
}

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
          className="h-1 w-1 rounded-full bg-ink transition-opacity"
          style={{ opacity: i === activeIndex ? 0.9 : 0.3 }}
        />
      ))}
    </div>
  )
}
