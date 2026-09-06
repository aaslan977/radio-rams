import { describe, expect, it } from 'vitest'
import { CENTER_RATIO, DOT_SIZE, GAP, centerDotCenters, computeStep, countDots } from './grille'

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

describe('centerDotCenters', () => {
  it('на нулевом размере не возвращает точек', () => {
    expect(centerDotCenters(0, 0)).toEqual([])
    expect(centerDotCenters(-10, 100)).toEqual([])
  })

  it('берёт только точки, чей ЦЕНТР попал в круг — иначе они резались бы пополам', () => {
    const width = 312
    const height = 331
    const radius = Math.min(width, height) * CENTER_RATIO
    const cx = width / 2
    const cy = height / 2

    for (const [x, y] of centerDotCenters(width, height)) {
      expect(Math.hypot(x - cx, y - cy)).toBeLessThanOrEqual(radius)
    }
  })

  it('координаты совпадают с узлами того же паттерна, что рисует серые точки', () => {
    const width = 312
    const height = 331
    const stepX = computeStep(width)
    const stepY = computeStep(height)

    for (const [x, y] of centerDotCenters(width, height)) {
      // Смещение на половину диаметра — то же, что у circle внутри pattern.
      const ix = (x - DOT_SIZE / 2) / stepX
      const iy = (y - DOT_SIZE / 2) / stepY
      expect(Math.abs(ix - Math.round(ix))).toBeLessThan(1e-9)
      expect(Math.abs(iy - Math.round(iy))).toBeLessThan(1e-9)
    }
  })

  it('пятно симметрично относительно центра решётки', () => {
    const width = 312
    const height = 331
    const dots = centerDotCenters(width, height)
    const key = (x: number, y: number) => `${x.toFixed(4)}:${y.toFixed(4)}`
    const set = new Set(dots.map(([x, y]) => key(x, y)))

    // Каждой точке пятна отвечает зеркальная относительно обеих осей.
    for (const [x, y] of dots) {
      expect(set.has(key(width - x, y))).toBe(true)
      expect(set.has(key(x, height - y))).toBe(true)
    }
  })

  it('пятно заметно меньше всей решётки, но не пустое', () => {
    const dots = centerDotCenters(312, 331)
    const total = countDots(312) * countDots(331)

    expect(dots.length).toBeGreaterThan(50)
    expect(dots.length).toBeLessThan(total * 0.6)
  })
})
