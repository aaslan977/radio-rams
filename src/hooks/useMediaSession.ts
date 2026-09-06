import { useEffect, useRef } from 'react'
import type { PlaybackStatus, Station } from '../types'

interface MediaSessionOptions {
  station: Station
  status: PlaybackStatus
  onPlay: () => void
  onPause: () => void
  onStep: (delta: number) => void
}

// Иконка одна на все станции: логотипов станций у нас нет, и добавлять их
// пришлось бы с той же проверкой прав, что и сами потоки (бриф, раздел 4).
const ARTWORK: MediaImage[] = [
  { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
]

// "connecting" отдаём системе как playing: пользователь уже нажал play, и
// кнопка на экране блокировки должна сразу стать паузой, а не моргать туда-сюда,
// пока подключается поток. Это ровно та же логика, что у вдавленной кнопки в UI.
const PLAYBACK_STATE: Record<PlaybackStatus, MediaSessionPlaybackState> = {
  stopped: 'paused',
  connecting: 'playing',
  playing: 'playing',
  error: 'paused',
}

const ACTIONS = ['play', 'pause', 'stop', 'previoustrack', 'nexttrack'] as const

// На незнакомое действие setActionHandler бросает TypeError. Для нас это не
// ошибка, а «система такого не умеет» — молча пропускаем.
function setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // действие не поддерживается этим браузером
  }
}

// Отдаёт станцию и состояние воспроизведения системе: экран блокировки, шторка
// уведомлений, кнопки на наушниках. Без этого установленное PWA выглядит для
// ОС безымянной вкладкой со звуком.
export function useMediaSession({ station, status, onPlay, onPause, onStep }: MediaSessionOptions) {
  // Обработчики регистрируются один раз, а вызывать обязаны всегда свежие
  // замыкания: иначе «следующая» с наушников считала бы станцию, выбранную на
  // момент монтирования, и переключала бы всегда от неё.
  const handlersRef = useRef({ onPlay, onPause, onStep })
  useEffect(() => {
    handlersRef.current = { onPlay, onPause, onStep }
  })

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    setActionHandler('play', () => handlersRef.current.onPlay())
    setActionHandler('pause', () => handlersRef.current.onPause())
    // Останова у приёмника нет — для живого потока это та же пауза.
    setActionHandler('stop', () => handlersRef.current.onPause())
    setActionHandler('previoustrack', () => handlersRef.current.onStep(-1))
    setActionHandler('nexttrack', () => handlersRef.current.onStep(1))
    // seekbackward/seekforward/seekto и setPositionState сознательно не трогаем:
    // живой поток не перематывается, а зарегистрированное действие нарисовало бы
    // в системном плеере бесполезный ползунок перемотки.

    return () => {
      for (const action of ACTIONS) setActionHandler(action, null)
    }
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: station.genre,
      album: 'Radio',
      artwork: ARTWORK,
    })
  }, [station.name, station.genre])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = PLAYBACK_STATE[status]
  }, [status])
}
