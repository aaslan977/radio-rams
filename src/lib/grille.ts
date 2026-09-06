export const DOT_SIZE = 8
export const GAP = 9

// Раньше CSS grid (`auto-fill` + `justify-between`) сам подбирал, сколько
// целых точек влезает по ширине/высоте, и растягивал зазоры так, чтобы
// первая и последняя точка стояли строго по краям — ни одна не обрезалась.
// У SVG-паттерна нет аналога auto-fill, поэтому шаг сетки пересчитывается
// вручную под фактический размер контейнера тем же способом.
//
// Ключевое свойство: при изменении размера растёт число точек, а не их
// диаметр — DOT_SIZE остаётся постоянным, подстраивается только зазор.
export function computeStep(size: number): number {
  if (size <= 0) return DOT_SIZE + GAP
  const count = Math.max(1, Math.floor((size + GAP) / (DOT_SIZE + GAP)))
  return count > 1 ? (size - DOT_SIZE) / (count - 1) : size
}

// Сколько целых точек укладывается в размер при таком шаге. Нужно и самой
// computeStep, и тестам, которые проверяют, что точки не обрезаются.
export function countDots(size: number): number {
  if (size <= 0) return 1
  return Math.max(1, Math.floor((size + GAP) / (DOT_SIZE + GAP)))
}
