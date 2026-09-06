import { Equalizer } from './Equalizer'
import { TextScramble } from './TextScramble'
import type { PlaybackStatus } from '../types'

interface DisplayProps {
  stationName: string
  status: PlaybackStatus
  analyser: AnalyserNode | null
  isPlaying: boolean
}

// Статус "connecting" осознанно не подписывается — см. brief.md, раздел 5.
// Обрыв связи ("error") внешне ничем не отличается от тишины, поэтому это
// единственное переходное состояние, которое подписано на дисплее.
const STATUS_LABELS: Partial<Record<PlaybackStatus, string>> = {
  error: 'No signal',
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
