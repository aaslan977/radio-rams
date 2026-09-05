import { Equalizer } from './Equalizer'
import { TextScramble } from './TextScramble'
import type { PlaybackStatus } from '../types'

interface DisplayProps {
  stationName: string
  status: PlaybackStatus
  analyser: AnalyserNode | null
  isPlaying: boolean
}

export function Display({ stationName, status, analyser, isPlaying }: DisplayProps) {
  const label = status === 'error' ? 'No signal' : stationName

  return (
    <div className="flex flex-1 flex-col justify-center gap-2 p-6">
      <TextScramble text={label} className="truncate text-ink" />
      <Equalizer analyser={analyser} isPlaying={isPlaying} />
    </div>
  )
}
