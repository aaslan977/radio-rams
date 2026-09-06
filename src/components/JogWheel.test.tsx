import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { JogWheel } from './JogWheel'
import { stations } from '../lib/stations'

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
