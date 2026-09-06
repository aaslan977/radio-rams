import { describe, expect, it } from 'vitest'
import { DOT_SIZE, GAP, computeStep, countDots } from './grille'

describe('computeStep: шаг сетки решётки динамика', () => {
  const sizes = [64, 100, 173, 240, 331, 360, 512, 1024]

  it.each(sizes)('при размере %i точки упираются в оба края, ни одна не обрезана', (size) => {
    const step = computeStep(size)
    const count = countDots(size)
    // Центр последней точки плюс её радиус не должен вылезти за границу.
    const lastEdge = step * (count - 1) + DOT_SIZE

    expect(lastEdge).toBeCloseTo(size, 6)
  })

  it.each(sizes)('при размере %i зазор между точками не отрицательный', (size) => {
    expect(computeStep(size)).toBeGreaterThanOrEqual(DOT_SIZE)
  })

  it('при росте размера добавляет точки, а не увеличивает их', () => {
    // Правило проекта: диаметр точки постоянный, подстраивается только зазор.
    const small = countDots(200)
    const large = countDots(400)

    expect(large).toBeGreaterThan(small)
  })

  it('число точек не убывает с ростом размера', () => {
    let prev = 0
    for (const size of sizes) {
      const count = countDots(size)
      expect(count).toBeGreaterThanOrEqual(prev)
      prev = count
    }
  })

  it('на вырожденных размерах не делит на ноль и не даёт NaN', () => {
    for (const size of [0, -10, 1, DOT_SIZE]) {
      const step = computeStep(size)
      expect(Number.isFinite(step)).toBe(true)
      expect(step).toBeGreaterThan(0)
    }
  })

  it('до первого замера отдаёт шаг по умолчанию', () => {
    expect(computeStep(0)).toBe(DOT_SIZE + GAP)
  })

  it('десктопная высота 331px даёт ровный шаг 17px', () => {
    // Значение зафиксировано в вёрстке: 20 рядов с шагом ровно DOT_SIZE + GAP.
    expect(computeStep(331)).toBeCloseTo(DOT_SIZE + GAP, 6)
    expect(countDots(331)).toBe(20)
  })
})
