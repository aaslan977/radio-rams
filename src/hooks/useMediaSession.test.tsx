import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaSession } from './useMediaSession'
import { stations } from '../lib/stations'
import type { PlaybackStatus } from '../types'

// jsdom не знает ни navigator.mediaSession, ни MediaMetadata — подставляем
// ровно ту поверхность API, которой пользуется хук.
let handlers: Map<string, (() => void) | null>
let session: { metadata: unknown; playbackState: string; setActionHandler: ReturnType<typeof vi.fn> }

function stubMediaSession() {
  handlers = new Map()
  session = {
    metadata: null,
    playbackState: 'none',
    setActionHandler: vi.fn((action: string, handler: (() => void) | null) => {
      handlers.set(action, handler)
    }),
  }
  Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true })
  vi.stubGlobal(
    'MediaMetadata',
    class {
      constructor(init: Record<string, unknown>) {
        Object.assign(this, init)
      }
    },
  )
}

function renderSession(status: PlaybackStatus = 'stopped', stationIndex = 0) {
  const onPlay = vi.fn()
  const onPause = vi.fn()
  const onStep = vi.fn()
  const view = renderHook(
    (props: { status: PlaybackStatus; stationIndex: number }) =>
      useMediaSession({
        station: stations[props.stationIndex],
        status: props.status,
        onPlay,
        onPause,
        onStep,
      }),
    { initialProps: { status, stationIndex } },
  )
  return { ...view, onPlay, onPause, onStep }
}

describe('useMediaSession', () => {
  beforeEach(stubMediaSession)

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'mediaSession')
  })

  it('отдаёт системе название и жанр текущей станции', () => {
    renderSession('playing', 1)

    expect(session.metadata).toMatchObject({
      title: stations[1].name,
      artist: stations[1].genre,
    })
  })

  it('обновляет метаданные при переключении станции', () => {
    const { rerender } = renderSession('playing', 0)

    rerender({ status: 'playing', stationIndex: 2 })

    expect(session.metadata).toMatchObject({ title: stations[2].name })
  })

  it.each<[PlaybackStatus, string]>([
    ['stopped', 'paused'],
    // Нажали play — кнопка в системном плеере обязана сразу стать паузой,
    // не дожидаясь, пока подключится поток.
    ['connecting', 'playing'],
    ['playing', 'playing'],
    ['error', 'paused'],
  ])('статус %s отражается как %s', (status, expected) => {
    renderSession(status)

    expect(session.playbackState).toBe(expected)
  })

  it('связывает системные кнопки с обработчиками плеера', () => {
    const { onPlay, onPause, onStep } = renderSession()

    handlers.get('play')?.()
    handlers.get('pause')?.()
    handlers.get('nexttrack')?.()
    handlers.get('previoustrack')?.()

    expect(onPlay).toHaveBeenCalledOnce()
    expect(onPause).toHaveBeenCalledOnce()
    expect(onStep).toHaveBeenNthCalledWith(1, 1)
    expect(onStep).toHaveBeenNthCalledWith(2, -1)
  })

  it('системная кнопка зовёт свежий обработчик, а не замыкание с монтирования', () => {
    // App пересоздаёт обработчики каждый рендер, и они замыкают текущую
    // станцию. Зарегистрируй мы их однажды напрямую — «следующая» с наушников
    // отсчитывала бы от станции, выбранной при монтировании.
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ onStep }: { onStep: (delta: number) => void }) =>
      useMediaSession({
        station: stations[0],
        status: 'playing',
        onPlay: () => {},
        onPause: () => {},
        onStep,
      }),
    { initialProps: { onStep: first } },
    )

    rerender({ onStep: second })
    handlers.get('nexttrack')?.()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(1)
  })

  it('останов для живого потока — та же пауза', () => {
    const { onPause } = renderSession('playing')

    handlers.get('stop')?.()

    expect(onPause).toHaveBeenCalledOnce()
  })

  it('не регистрирует перемотку: живой поток не перематывается', () => {
    renderSession('playing')

    const registered = [...handlers.entries()].filter(([, handler]) => handler !== null).map(([action]) => action)
    expect(registered).not.toContain('seekto')
    expect(registered).not.toContain('seekforward')
    expect(registered).not.toContain('seekbackward')
  })

  it('снимает обработчики при размонтировании', () => {
    const { unmount } = renderSession('playing')

    unmount()

    expect([...handlers.values()].every((handler) => handler === null)).toBe(true)
  })

  it('переживает браузер без Media Session', () => {
    Reflect.deleteProperty(navigator, 'mediaSession')

    expect(() => renderSession('playing')).not.toThrow()
  })
})
