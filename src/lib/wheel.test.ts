import { describe, expect, it } from 'vitest'
import { shortestStepDelta, wrapIndex } from './wheel'

describe('shortestStepDelta', () => {
  const COUNT = 8

  it('соседние станции — один шаг в очевидную сторону', () => {
    expect(shortestStepDelta(0, 1, COUNT)).toBe(1)
    expect(shortestStepDelta(3, 2, COUNT)).toBe(-1)
  })

  it('через стык кольца идёт коротким путём, а не через весь список', () => {
    // Главный случай: с последней на первую — +1, иначе диск открутился бы
    // назад на 315° вместо доворота на 45°.
    expect(shortestStepDelta(7, 0, COUNT)).toBe(1)
    expect(shortestStepDelta(0, 7, COUNT)).toBe(-1)
  })

  it('на противоположную станцию идёт вперёд — расстояние одинаковое', () => {
    expect(shortestStepDelta(0, 4, COUNT)).toBe(4)
  })

  it('никогда не даёт больше половины кольца', () => {
    for (let from = 0; from < COUNT; from++) {
      for (let to = 0; to < COUNT; to++) {
        expect(Math.abs(shortestStepDelta(from, to, COUNT))).toBeLessThanOrEqual(COUNT / 2)
      }
    }
  })

  it('на месте — нулевой шаг', () => {
    expect(shortestStepDelta(5, 5, COUNT)).toBe(0)
  })
})

describe('wrapIndex', () => {
  it('заворачивает индекс в границы списка в обе стороны', () => {
    expect(wrapIndex(8, 8)).toBe(0)
    expect(wrapIndex(-1, 8)).toBe(7)
    expect(wrapIndex(3, 8)).toBe(3)
  })
})
