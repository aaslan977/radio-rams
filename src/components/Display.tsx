import { Equalizer } from './Equalizer'
import { TextScramble } from './TextScramble'
import type { PlaybackStatus } from '../types'

interface DisplayProps {
  stationName: string
  status: PlaybackStatus
  analyser: AnalyserNode | null
  isPlaying: boolean
}

// Подключение к живому потоку занимает секунды, а обрыв связи внешне ничем не
// отличается от тишины — поэтому оба переходных состояния подписаны на дисплее
// вместо названия станции (бриф, раздел 5).
const STATUS_LABELS: Partial<Record<PlaybackStatus, string>> = {
  connecting: 'CONNECTING…',
  error: 'NO SIGNAL',
}

export function Display({ stationName, status, analyser, isPlaying }: DisplayProps) {
  const label = STATUS_LABELS[status] ?? stationName

  return (
    <div className="flex flex-1 flex-col justify-center gap-2 p-6">
      <TextScramble text={label} className="truncate text-ink" />
      <Equalizer analyser={analyser} isPlaying={isPlaying} />
    </div>
  )
}
