import { useEffect } from 'react'
import { render, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioPlayer } from './useAudioPlayer'
import { usePlayerStore } from '../store/playerStore'
import { stations } from '../lib/stations'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

// Хук выдаёт ref, который должен быть заполнен уже к моменту запуска эффектов —
// как в App.tsx, где <audio> рендерится тем же деревом. Поэтому обёртка, а не
// renderHook: с ним ref остался бы null и слушатели не навесились бы.
let audio: HTMLAudioElement | null = null
let togglePlay: () => void = () => {}

function Harness() {
  const { audioRef, togglePlay: toggle } = useAudioPlayer()
  // Пробрасываем наружу в эффекте, а не во время рендера: присваивание внешней
  // переменной прямо в теле компонента — побочный эффект (react(globals)).
  useEffect(() => {
    togglePlay = toggle
  })
  return <audio ref={audioRef} />
}

function mount() {
  const view = render(<Harness />)
  audio = view.container.querySelector('audio')
  return view
}

// Доводит плеер до состояния 'error': MAX_RETRIES неудачных попыток и финальный
// сбой, после которого ретраи исчерпаны.
function exhaustRetries() {
  for (let i = 0; i <= MAX_RETRIES; i++) {
    act(() => {
      audio!.dispatchEvent(new Event('error'))
    })
    act(() => {
      vi.advanceTimersByTime(RETRY_DELAY_MS)
    })
  }
}

describe('useAudioPlayer: восстановление после исчерпанных ретраев', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    usePlayerStore.setState({ stationIndex: 0, status: 'stopped' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('переходит в error после MAX_RETRIES неудачных попыток', () => {
    mount()
    act(() => togglePlay())
    expect(usePlayerStore.getState().status).toBe('connecting')

    exhaustRetries()
    expect(usePlayerStore.getState().status).toBe('error')
  })

  it('после error один клик по play снова запускает поток, а не паузу', () => {
    mount()
    act(() => togglePlay())
    exhaustRetries()

    const play = vi.mocked(HTMLMediaElement.prototype.play)
    play.mockClear()

    act(() => togglePlay())

    // Раньше wantsPlaybackRef оставался true, клик уходил в ветку паузы и
    // давал 'stopped' без единого вызова play — приходилось жать дважды.
    expect(usePlayerStore.getState().status).toBe('connecting')
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('смена станции убирает NO SIGNAL с дисплея', () => {
    mount()
    act(() => togglePlay())
    exhaustRetries()
    expect(usePlayerStore.getState().status).toBe('error')

    act(() => usePlayerStore.getState().stepStation(1))

    expect(usePlayerStore.getState().stationIndex).toBe(1)
    expect(usePlayerStore.getState().status).toBe('stopped')
  })

  it('не запускает воспроизведение само при смене станции после ошибки', () => {
    mount()
    act(() => togglePlay())
    exhaustRetries()

    const play = vi.mocked(HTMLMediaElement.prototype.play)
    play.mockClear()

    act(() => usePlayerStore.getState().setStationIndex(stations.length - 1))

    expect(play).not.toHaveBeenCalled()
  })
})
