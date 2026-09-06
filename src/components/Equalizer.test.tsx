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
