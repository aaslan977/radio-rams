import { useRef } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioAnalyser } from './useAudioAnalyser'

// В jsdom нет Web Audio, поэтому контекст подставляем — заодно это даёт
// контроль над состоянием, которое на реальном устройстве меняет ОС.
class FakeNode {
  connect = vi.fn()
  disconnect = vi.fn()
  fftSize = 0
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []

  state: 'suspended' | 'running' | 'closed' | 'interrupted' = 'suspended'
  destination = new FakeNode()
  private listeners = new Set<() => void>()

  constructor() {
    FakeAudioContext.instances.push(this)
  }

  createAnalyser = () => new FakeNode()
  createMediaElementSource = () => new FakeNode()

  resume = vi.fn(() => {
    this.state = 'running'
    this.emitStateChange()
    return Promise.resolve()
  })

  addEventListener = (type: string, fn: () => void) => {
    if (type === 'statechange') this.listeners.add(fn)
  }
  removeEventListener = (_type: string, fn: () => void) => {
    this.listeners.delete(fn)
  }
  emitStateChange = () => {
    for (const fn of [...this.listeners]) fn()
  }
}

function Harness() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { analyser, resume } = useAudioAnalyser(audioRef)
  return (
    <>
      <audio ref={audioRef} />
      <span data-testid="analyser">{analyser ? 'есть' : 'нет'}</span>
      <button type="button" onClick={resume}>
        resume
      </button>
    </>
  )
}

// jsdom всегда сообщает paused: true — подменяем, чтобы отличать «звук нужен»
// от «пользователь на паузе»; именно по этому признаку хук решает, будить ли
// контекст.
function setPaused(paused: boolean) {
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    get: () => paused,
    configurable: true,
  })
}

function context() {
  const instance = FakeAudioContext.instances.at(-1)
  if (!instance) throw new Error('AudioContext так и не был создан')
  return instance
}

describe('useAudioAnalyser', () => {
  beforeEach(() => {
    FakeAudioContext.instances = []
    vi.stubGlobal('AudioContext', FakeAudioContext)
    setPaused(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(HTMLMediaElement.prototype, 'paused')
  })

  it('отдаёт анализатор сразу после монтирования, без посторонних ре-рендеров', () => {
    render(<Harness />)

    // До правки здесь было бы «нет»: ref, проставленный в эффекте, ре-рендер
    // не вызывает, и эквалайзер получал null, пока что-то не перерисует дерево.
    expect(screen.getByTestId('analyser')).toHaveTextContent('есть')
  })

  it('будит усыплённый контекст при возврате на вкладку, если звук нужен', () => {
    setPaused(false)
    render(<Harness />)
    const ctx = context()
    ctx.resume.mockClear()

    act(() => {
      fireEvent(document, new Event('visibilitychange'))
    })

    expect(ctx.resume).toHaveBeenCalled()
  })

  it('не будит контекст, когда пользователь на паузе', () => {
    setPaused(true)
    render(<Harness />)
    const ctx = context()
    ctx.resume.mockClear()

    act(() => {
      fireEvent(document, new Event('visibilitychange'))
    })

    expect(ctx.resume).not.toHaveBeenCalled()
  })

  it('будит контекст, прерванный системой во время воспроизведения', () => {
    setPaused(false)
    render(<Harness />)
    const ctx = context()
    ctx.resume.mockClear()

    // Так это выглядит на iOS при входящем звонке: контекст уходит в
    // interrupted сам, событие приходит, обратно он не возвращается.
    act(() => {
      ctx.state = 'interrupted'
      ctx.emitStateChange()
    })

    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.state).toBe('running')
  })

  it('не пытается будить закрытый контекст', () => {
    setPaused(false)
    render(<Harness />)
    const ctx = context()
    ctx.resume.mockClear()

    act(() => {
      ctx.state = 'closed'
      ctx.emitStateChange()
    })

    expect(ctx.resume).not.toHaveBeenCalled()
  })

  it('снимает обработчики при размонтировании', () => {
    setPaused(false)
    const view = render(<Harness />)
    const ctx = context()
    view.unmount()
    ctx.resume.mockClear()

    act(() => {
      fireEvent(document, new Event('visibilitychange'))
    })

    expect(ctx.resume).not.toHaveBeenCalled()
  })
})
