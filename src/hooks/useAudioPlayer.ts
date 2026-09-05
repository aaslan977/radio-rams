import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { stations } from '../lib/stations'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const wantsPlaybackRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stationIndex = usePlayerStore((s) => s.stationIndex)
  const setStatus = usePlayerStore((s) => s.setStatus)

  const station = stations[stationIndex]

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }

  const attemptPlay = () => {
    const audio = audioRef.current
    if (!audio) return
    setStatus('connecting')
    audio.play().catch(() => {
      // autoplay/policy rejection — обработает событие 'error' или просто останется connecting
    })
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlaying = () => {
      retryCountRef.current = 0
      setStatus('playing')
    }
    const handleWaiting = () => {
      if (wantsPlaybackRef.current) setStatus('connecting')
    }
    const handleError = () => {
      if (!wantsPlaybackRef.current) return
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1
        setStatus('connecting')
        clearRetryTimeout()
        retryTimeoutRef.current = setTimeout(() => {
          const el = audioRef.current
          if (!el || !wantsPlaybackRef.current) return
          el.load()
          attemptPlay()
        }, RETRY_DELAY_MS)
      } else {
        // Ретраи исчерпаны — намерение играть снимаем вместе со статусом.
        // Иначе кнопка показана выключенной (isActive для 'error' — false),
        // а wantsPlaybackRef остаётся true, и первый клик уходит в ветку
        // паузы: пользователю пришлось бы жать play дважды.
        wantsPlaybackRef.current = false
        retryCountRef.current = 0
        audio.pause()
        setStatus('error')
      }
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('stalled', handleWaiting)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('stalled', handleWaiting)
      audio.removeEventListener('error', handleError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // при смене станции — если играли, перезапускаем на новой станции
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = station.streamUrl
    retryCountRef.current = 0
    clearRetryTimeout()
    if (wantsPlaybackRef.current) {
      audio.load()
      attemptPlay()
    } else if (usePlayerStore.getState().status === 'error') {
      // «NO SIGNAL» относился к прежней станции — на новой дисплей должен
      // снова показывать её название, а не тянуть ошибку за собой.
      setStatus('stopped')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station.streamUrl])

  useEffect(() => clearRetryTimeout, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (wantsPlaybackRef.current) {
      wantsPlaybackRef.current = false
      clearRetryTimeout()
      retryCountRef.current = 0
      audio.pause()
      setStatus('stopped')
    } else {
      wantsPlaybackRef.current = true
      if (!audio.src) audio.src = station.streamUrl
      attemptPlay()
    }
  }

  return { audioRef, togglePlay }
}
