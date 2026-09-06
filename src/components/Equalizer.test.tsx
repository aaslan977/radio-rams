import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Equalizer } from './Equalizer'

const CSS_WIDTH = 210
const CSS_HEIGHT = 14

let setTransform: ReturnType<typeof vi.fn>
let fillRect: ReturnType<typeof vi.fn>

// jsdom не считает раскладку и не знает ResizeObserver, а getContext('2d')
// отдаёт null — всё, от чего зависит размер канваса, приходится подставить.
function stubLayout() {
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    get: () => CSS_WIDTH,
    configurable: true,
  })
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    get: () => CSS_HEIGHT,
    configurable: true,
  })

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )

  setTransform = vi.fn()
  fillRect = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform,
    fillRect,
    clearRect: vi.fn(),
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D)
}

describe('Equalizer: размер канваса', () => {
  beforeEach(stubLayout)

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientWidth')
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientHeight')
  })

  it.each([1, 2, 3])('заводит буфер под devicePixelRatio %i', (dpr) => {
    vi.stubGlobal('devicePixelRatio', dpr)

    const { container } = render(<Equalizer analyser={null} isPlaying={false} />)
    const canvas = container.querySelector('canvas')

    // До правки здесь были прибитые 280×14 при растягивающем w-full: буфер не
    // совпадал с реальной шириной, а на retina столбики были мыльными.
    expect(canvas?.width).toBe(CSS_WIDTH * dpr)
    expect(canvas?.height).toBe(CSS_HEIGHT * dpr)
  })

  it('масштабирует контекст, чтобы рисовать в CSS-пикселях', () => {
    vi.stubGlobal('devicePixelRatio', 2)

    render(<Equalizer analyser={null} isPlaying={false} />)

    expect(setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0)
  })

  it('без сигнала рисует плоскую линию на всю ширину', () => {
    vi.stubGlobal('devicePixelRatio', 1)

    render(<Equalizer analyser={null} isPlaying={false} />)

    // 28 столбиков минимальной высоты, координаты — в CSS-пикселях.
    expect(fillRect).toHaveBeenCalledTimes(28)
    const lastCall = fillRect.mock.calls.at(-1)
    expect(lastCall?.[1]).toBe(CSS_HEIGHT - 2)
  })
})

describe('Equalizer: декоративный фолбэк при немом анализаторе', () => {
  beforeEach(stubLayout)

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientWidth')
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientHeight')
  })

  // requestAnimationFrame реальным таймером в jsdom не гоняем — кладём
  // колбэки в очередь и прокручиваем их вручную, чтобы за один синхронный
  // тест смоделировать полторы секунды воспроизведения (~90 кадров).
  function stubFrames() {
    const queue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queue.push(cb)
      return queue.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    return {
      flush(times: number) {
        for (let i = 0; i < times; i++) {
          const cb = queue.shift()
          if (!cb) break
          cb(i)
        }
      },
    }
  }

  function fakeAnalyser(fillValue: number): AnalyserNode {
    return {
      frequencyBinCount: 32,
      getByteFrequencyData: (arr: Uint8Array) => arr.fill(fillValue),
    } as unknown as AnalyserNode
  }

  it('на живом сигнале не подменяет данные — высоты столбиков остаются на нуле', () => {
    vi.stubGlobal('devicePixelRatio', 1)
    const frames = stubFrames()

    render(<Equalizer analyser={fakeAnalyser(0)} isPlaying={true} />)
    fillRect.mockClear()
    frames.flush(1)

    // Один немой кадр — ещё не повод считать анализатор сломанным:
    // столбики остаются на минимальной высоте, как и на настоящей тишине.
    const heights = fillRect.mock.calls.map((call) => call[3])
    expect(heights.every((h) => h <= 2)).toBe(true)
  })

  it('после ~1.5с сплошных нулей на активном воспроизведении включает декоративную анимацию', () => {
    vi.stubGlobal('devicePixelRatio', 1)
    const frames = stubFrames()

    render(<Equalizer analyser={fakeAnalyser(0)} isPlaying={true} />)
    frames.flush(150)
    fillRect.mockClear()
    frames.flush(1)

    // Баг Safari/защита от фингерпринтинга в Yandex Browser держат
    // getByteFrequencyData на нуле, а звук при этом играет — эквалайзер не
    // должен застревать плоской линией: столбики должны разъехаться по
    // высоте вместо одинаковой минимальной.
    const heights = fillRect.mock.calls.map((call) => call[3] as number)
    expect(heights.some((h) => h > 2)).toBe(true)
    expect(new Set(heights.map((h) => Math.round(h * 100))).size).toBeGreaterThan(1)
  })
})
