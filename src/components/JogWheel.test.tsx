import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { JogWheel } from './JogWheel'
import { stations } from '../lib/stations'

// framer-motion инициализирует prefersReducedMotion лениво и один раз на
// процесс (слушает 'change' на уже захваченном matchMedia), поэтому подменить
// window.matchMedia в отдельном тесте бесполезно — переопределяем сам
// useReducedMotion модуля. Префикс mock обязателен: vi.mock поднимается
// над импортами, и только так модуль виден внутри фабрики.
const mockUseReducedMotion = vi.fn(() => false)
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useReducedMotion: () => mockUseReducedMotion() }
})

describe('JogWheel: управление с клавиатуры', () => {
  let onStep: Mock<(delta: number) => void>

  beforeEach(() => {
    onStep = vi.fn<(delta: number) => void>()
  })

  function wheel(activeIndex = 0) {
    render(<JogWheel activeIndex={activeIndex} onStep={onStep} />)
    return screen.getByRole('slider')
  }

  it('доступен с клавиатуры и объявляет текущую станцию', () => {
    const el = wheel(2)

    expect(el).toHaveAttribute('tabindex', '0')
    expect(el).toHaveAttribute('aria-valuenow', '3')
    expect(el).toHaveAttribute('aria-valuemax', String(stations.length))
    expect(el).toHaveAttribute('aria-valuetext', stations[2].name)
  })

  it.each([
    ['ArrowRight', 1],
    ['ArrowUp', 1],
    ['ArrowLeft', -1],
    ['ArrowDown', -1],
  ])('%s переключает станцию на %i', (key, delta) => {
    fireEvent.keyDown(wheel(), { key })

    expect(onStep).toHaveBeenCalledExactlyOnceWith(delta)
  })

  it('не перехватывает посторонние клавиши', () => {
    const el = wheel()
    fireEvent.keyDown(el, { key: 'Tab' })
    fireEvent.keyDown(el, { key: 'a' })

    expect(onStep).not.toHaveBeenCalled()
  })

  it('гасит прокрутку страницы стрелками', () => {
    const el = wheel()
    const prevented = !fireEvent.keyDown(el, { key: 'ArrowDown' })

    expect(prevented).toBe(true)
  })
})

describe('JogWheel: пружина деления при шаге с клавиатуры', () => {
  function wheel() {
    render(<JogWheel activeIndex={0} onStep={() => {}} />)
    return screen.getByRole('slider')
  }

  function angleOf(el: HTMLElement): number {
    const match = (el.style.transform || '').match(/rotate\(([-0-9.]+)deg\)/)
    return match ? parseFloat(match[1]) : 0
  }

  // Пружина крутится на requestAnimationFrame, поэтому опрашиваем реальными
  // кадрами: с фейковыми таймерами framer-motion просто не поедет.
  async function sampleAngles(el: HTMLElement, frames: number): Promise<number[]> {
    const angles: number[] = []
    for (let i = 0; i < frames; i++) {
      await new Promise((resolve) => setTimeout(resolve, 16))
      angles.push(angleOf(el))
    }
    return angles
  }

  it('проскакивает деление и возвращается — иначе поворот выглядел бы телепортом', async () => {
    const el = wheel()

    fireEvent.keyDown(el, { key: 'ArrowRight' })
    const angles = await sampleAngles(el, 25)

    // Заброс за 45° и есть ощущение провала за упор; замер даёт около 4.9°.
    expect(Math.max(...angles)).toBeGreaterThan(45)
  })

  it('серия быстрых нажатий набирает ровно по 45° на нажатие', async () => {
    const el = wheel()

    // Нажатия приходят, пока диск ещё в полёте: так ведёт себя автоповтор при
    // зажатой стрелке. Если считать шаг от текущего угла, а не от цели, за
    // нажатие набегало бы меньше 45° и диск отставал бы от списка станций.
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(el, { key: 'ArrowRight' })
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    const angles = await sampleAngles(el, 35)

    expect(angles[angles.length - 1]).toBeCloseTo(135, 1)
  })
})

describe('JogWheel: угол диска привязан к станции', () => {
  function angleOf(el: HTMLElement): number {
    const match = (el.style.transform || '').match(/rotate\(([-0-9.]+)deg\)/)
    return match ? parseFloat(match[1]) : 0
  }

  async function settle(el: HTMLElement, frames = 35): Promise<number> {
    for (let i = 0; i < frames; i++) {
      await new Promise((resolve) => setTimeout(resolve, 16))
    }
    return angleOf(el)
  }

  it('встаёт на деление своей станции сразу при монтировании', () => {
    render(<JogWheel activeIndex={3} onStep={() => {}} />)

    expect(angleOf(screen.getByRole('slider'))).toBe(3 * 45)
  })

  it('внешняя смена станции доворачивает диск — раньше клик по засечке его не двигал', async () => {
    const { rerender } = render(<JogWheel activeIndex={0} onStep={() => {}} />)
    const el = screen.getByRole('slider')

    rerender(<JogWheel activeIndex={1} onStep={() => {}} />)

    expect(await settle(el)).toBeCloseTo(45, 1)
  })

  it('на стыке кольца идёт коротким путём вперёд, а не откручивается через весь список', async () => {
    const { rerender } = render(<JogWheel activeIndex={7} onStep={() => {}} />)
    const el = screen.getByRole('slider')
    expect(angleOf(el)).toBe(7 * 45)

    rerender(<JogWheel activeIndex={0} onStep={() => {}} />)

    // 315 + 45 = 360, а не 0: путь назад через весь список дал бы именно 0.
    expect(await settle(el)).toBeCloseTo(360, 1)
  })

  it('прыжок через полкольца тоже одним движением', async () => {
    const { rerender } = render(<JogWheel activeIndex={0} onStep={() => {}} />)
    const el = screen.getByRole('slider')

    rerender(<JogWheel activeIndex={4} onStep={() => {}} />)

    expect(await settle(el, 45)).toBeCloseTo(4 * 45, 1)
  })
})

describe('JogWheel: уважает prefers-reduced-motion', () => {
  function angleOf(el: HTMLElement): number {
    const match = (el.style.transform || '').match(/rotate\(([-0-9.]+)deg\)/)
    return match ? parseFloat(match[1]) : 0
  }

  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(true)
  })

  afterEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
  })

  it('шаг клавиатурой встаёт на деление сразу, без переброса за упор', async () => {
    render(<JogWheel activeIndex={0} onStep={() => {}} />)
    const el = screen.getByRole('slider')

    fireEvent.keyDown(el, { key: 'ArrowRight' })
    // Даём шанс кадру анимации отрисоваться, если бы она всё-таки запустилась.
    await new Promise((resolve) => setTimeout(resolve, 32))

    expect(angleOf(el)).toBe(45)
  })

  it('внешняя смена станции доворачивает диск мгновенно', async () => {
    const { rerender } = render(<JogWheel activeIndex={0} onStep={() => {}} />)
    const el = screen.getByRole('slider')

    rerender(<JogWheel activeIndex={3} onStep={() => {}} />)
    await new Promise((resolve) => setTimeout(resolve, 32))

    expect(angleOf(el)).toBe(3 * 45)
  })
})
