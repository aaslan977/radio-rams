import { DeviceShell } from './components/DeviceShell'
import { PlayButton } from './components/PlayButton'
import { Display } from './components/Display'
import { SpeakerGrille } from './components/SpeakerGrille'
import { StationTicks } from './components/StationTicks'
import { JogWheel } from './components/JogWheel'
import { usePlayerStore } from './store/playerStore'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useAudioAnalyser } from './hooks/useAudioAnalyser'
import { stations } from './lib/stations'

function App() {
  const stationIndex = usePlayerStore((s) => s.stationIndex)
  const status = usePlayerStore((s) => s.status)
  const setStationIndex = usePlayerStore((s) => s.setStationIndex)
  const stepStation = usePlayerStore((s) => s.stepStation)

  const { audioRef, togglePlay } = useAudioPlayer()
  const { analyserRef, resume } = useAudioAnalyser(audioRef)

  const isPlaying = status === 'playing'
  const isActive = status === 'playing' || status === 'connecting'

  const handleTogglePlay = () => {
    resume()
    togglePlay()
  }

  return (
    <DeviceShell>
      <div className="divider-b flex h-24">
        <PlayButton active={isActive} onToggle={handleTogglePlay} />
        <Display
          stationName={stations[stationIndex].name}
          status={status}
          analyser={analyserRef.current}
          isPlaying={isPlaying}
        />
      </div>

      <SpeakerGrille />

      <StationTicks activeIndex={stationIndex} onSelect={setStationIndex} />

      <div className="flex justify-center px-[36px] pt-[6px] pb-[36px]">
        <JogWheel activeIndex={stationIndex} onStep={stepStation} />
      </div>

      <audio ref={audioRef} crossOrigin="anonymous" preload="none" />
    </DeviceShell>
  )
}

export default App
