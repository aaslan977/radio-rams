import { describe, expect, it } from 'vitest'
import {
  CENTER_RATIO,
  DOT_SIZE,
  GAP,
  centerDotCenters,
  computeRowStep,
  computeStep,
  countDots,
  countRows,
} from './grille'

describe('computeStep: горизонтальный шаг решётки динамика', () => {
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

  it('десктопная ширина 312px даёт 18 точек в ряду', () => {
    expect(countDots(312)).toBe(18)
  })
})

describe('countRows/computeRowStep: гексагональная упаковка по вертикали', () => {
  const pairs: Array<[number, number]> = [
    [64, 64],
    [100, 173],
    [173, 100],
    [240, 512],
    [312, 331],
    [360, 717],
    [1024, 768],
  ]

  it.each(pairs)('при ширине %i и высоте %i число рядов нечётное', (width, height) => {
    expect(countRows(width, height) % 2).toBe(1)
  })

  it.each(pairs)('при ширине %i и высоте %i ряды упираются в оба края', (width, height) => {
    const rowStep = computeRowStep(width, height)
    const rows = countRows(width, height)
    const lastEdge = rowStep * (rows - 1) + DOT_SIZE

    expect(lastEdge).toBeCloseTo(height, 6)
  })

  it('десктопные 312×331 дают 21 ряд', () => {
    // Значение зафиксировано в вёрстке: idealRowStep = stepX·√3/2 ≈ 15.49,
    // растянутый под точную высоту шаг — чуть больше, ~16.15.
    expect(countRows(312, 331)).toBe(21)
  })

  it('на вырожденных размерах не делит на ноль и не даёт NaN', () => {
    for (const height of [0, -10, 1, DOT_SIZE]) {
      const rows = countRows(312, height)
      const step = computeRowStep(312, height)
      expect(Number.isFinite(rows)).toBe(true)
      expect(Number.isFinite(step)).toBe(true)
      expect(rows).toBeGreaterThan(0)
      expect(step).toBeGreaterThan(0)
    }
  })

  it('число рядов не убывает с ростом высоты', () => {
    let prev = 0
    for (const height of [64, 100, 173, 240, 331, 512, 768, 1024]) {
      const rows = countRows(312, height)
      expect(rows).toBeGreaterThanOrEqual(prev)
      prev = rows
    }
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
    const rowStep = computeRowStep(width, height)

    for (const [x, y] of centerDotCenters(width, height)) {
      const iy = (y - DOT_SIZE / 2) / rowStep
      expect(Math.abs(iy - Math.round(iy))).toBeLessThan(1e-9)

      // Чётный ряд стоит на целочисленной сетке stepX, нечётный сдвинут на
      // полшага — та же геометрия, что у пары кружков в SVG-паттерне.
      const row = Math.round(iy)
      const odd = row % 2 === 1
      const ix = (x - DOT_SIZE / 2 - (odd ? stepX / 2 : 0)) / stepX
      expect(Math.abs(ix - Math.round(ix))).toBeLessThan(1e-9)
    }
  })

  it('пятно симметрично относительно центра решётки', () => {
    const width = 312
    const height = 331
    const dots = centerDotCenters(width, height)
    const key = (x: number, y: number) => `${x.toFixed(4)}:${y.toFixed(4)}`
    const set = new Set(dots.map(([x, y]) => key(x, y)))

    // Каждой точке пятна отвечает зеркальная относительно обеих осей —
    // держится на нечётном числе рядов, которое гарантирует countRows.
    for (const [x, y] of dots) {
      expect(set.has(key(width - x, y))).toBe(true)
      expect(set.has(key(x, height - y))).toBe(true)
    }
  })

  it('пятно заметно меньше всей решётки, но не пустое', () => {
    const dots = centerDotCenters(312, 331)
    const total = countDots(312) * countRows(312, 331)

    expect(dots.length).toBeGreaterThan(50)
    expect(dots.length).toBeLessThan(total * 0.6)
  })
})
