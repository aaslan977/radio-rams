// Бины FFT линейны по частоте, а музыкальная энергия — нет: почти вся сила
// сосредоточена в первых нескольких бинах, и через линейную выборку правая
// половина столбиков остаётся почти неподвижной. Группируем бины по
// логарифмической шкале, чтобы бас, середина и верха были одинаково заметны.
//
// Возвращает для каждой полосы полуинтервал [lo, hi) индексов бинов.
export function buildLogBinRanges(bandCount: number, binCount: number): Array<[number, number]> {
  const minBin = 1 // пропускаем DC-бин (индекс 0)
  const maxBin = binCount - 1
  const logMin = Math.log2(minBin)
  const logMax = Math.log2(maxBin)

  const ranges: Array<[number, number]> = []
  for (let i = 0; i < bandCount; i++) {
    const lo = Math.max(minBin, Math.round(2 ** (logMin + ((logMax - logMin) * i) / bandCount)))
    const hiRaw = Math.round(2 ** (logMin + ((logMax - logMin) * (i + 1)) / bandCount))
    const hi = Math.min(maxBin + 1, Math.max(lo + 1, hiRaw))
    ranges.push([lo, hi])
  }
  return ranges
}
