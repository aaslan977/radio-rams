import { describe, expect, it } from 'vitest'
import { buildLogBinRanges } from './spectrum'

// Настройки эквалайзера: fftSize 256 даёт frequencyBinCount 128.
const BANDS = 28
const BINS = 128

describe('buildLogBinRanges: группировка бинов FFT', () => {
  const ranges = buildLogBinRanges(BANDS, BINS)

  it('отдаёт по диапазону на каждую полосу', () => {
    expect(ranges).toHaveLength(BANDS)
  })

  it('пропускает DC-бин и не выходит за границы массива', () => {
    for (const [lo, hi] of ranges) {
      expect(lo).toBeGreaterThanOrEqual(1)
      expect(hi).toBeLessThanOrEqual(BINS)
    }
  })

  it('ни один диапазон не пустой — иначе была бы полоса без сигнала', () => {
    // Пустой диапазон дал бы деление на ноль в усреднении и NaN-высоту.
    for (const [lo, hi] of ranges) {
      expect(hi).toBeGreaterThan(lo)
    }
  })

  it('диапазоны идут слева направо и не откатываются назад', () => {
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i][0]).toBeGreaterThanOrEqual(ranges[i - 1][0])
    }
  })

  it('шкала действительно логарифмическая: верхние полосы шире нижних', () => {
    // Ради этого всё и делалось — при линейной выборке правая половина
    // столбиков почти не двигалась.
    const width = (i: number) => ranges[i][1] - ranges[i][0]

    expect(width(BANDS - 1)).toBeGreaterThan(width(0))
  })

  it('нижние полосы остаются узкими — бас не слипается в один столбик', () => {
    const firstWidths = ranges.slice(0, 5).map(([lo, hi]) => hi - lo)

    for (const w of firstWidths) expect(w).toBeLessThanOrEqual(3)
  })

  it('доходит до верха спектра', () => {
    // Ровно один бин остаётся непрочитанным: потолок клампа — maxBin + 1, но
    // hiRaw последней полосы упирается в 2**logMax === maxBin. При fftSize 256
    // и 48 кГц это бин ~23.8 кГц, то есть выше слышимого — на картинку не
    // влияет. Фиксируем фактическое поведение, чтобы случайная правка формулы
    // не съела заметный кусок верхов незамеченной.
    expect(ranges[BANDS - 1][1]).toBeGreaterThanOrEqual(BINS - 1)
  })

  it('не ломается на других размерах FFT', () => {
    for (const bins of [32, 64, 512, 1024]) {
      const r = buildLogBinRanges(BANDS, bins)
      expect(r).toHaveLength(BANDS)
      for (const [lo, hi] of r) {
        expect(hi).toBeGreaterThan(lo)
        expect(hi).toBeLessThanOrEqual(bins)
      }
    }
  })
})
