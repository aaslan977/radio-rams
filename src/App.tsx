import { DeviceShell } from './components/DeviceShell'
import { PlayButton } from './components/PlayButton'
import { Display } from './components/Display'
import { SpeakerGrille } from './components/SpeakerGrille'
import { StationTicks } from './components/StationTicks'
import { JogWheel } from './components/JogWheel'
import { usePlayerStore } from './store/playerStore'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useAudioAnalyser } from './hooks/useAudioAnalyser'
import { useMediaSession } from './hooks/useMediaSession'
import { stations } from './lib/stations'

function App() {
  const stationIndex = usePlayerStore((s) => s.stationIndex)
  const status = usePlayerStore((s) => s.status)
  const setStationIndex = usePlayerStore((s) => s.setStationIndex)
  const stepStation = usePlayerStore((s) => s.stepStation)

  const { audioRef, play, pause, togglePlay } = useAudioPlayer()
  const { analyser, resume } = useAudioAnalyser(audioRef)

  const station = stations[stationIndex]
  const isPlaying = status === 'playing'
  const isActive = status === 'playing' || status === 'connecting'

  // Выход <audio> идёт через AudioContext, и на усыплённом контексте
  // воспроизведение стартует беззвучно — будить его обязан каждый путь запуска,
  // включая кнопку на экране блокировки.
  const handlePlay = () => {
    resume()
    play()
  }

  const handleTogglePlay = () => {
    resume()
    togglePlay()
  }

  useMediaSession({
    station,
    status,
    onPlay: handlePlay,
    onPause: pause,
    onStep: stepStation,
  })

  return (
    <DeviceShell>
      {/* 88px, не стандартные 96 (h-24): ячейка кнопки play — квадрат по
          высоте этого ряда, а зазор от круглой кнопки (40×40) до края
          устройства при 96px давал 28px — здесь ровно 24. */}
      <div className="divider-b flex h-[88px]">
        <PlayButton active={isActive} onToggle={handleTogglePlay} />
        <Display
          stationName={station.name}
          status={status}
          analyser={analyser}
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
