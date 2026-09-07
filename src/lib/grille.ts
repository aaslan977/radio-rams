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

// Доля меньшей стороны решётки, которую занимает радиус тёмного пятна.
export const CENTER_RATIO = 0.4

// Тёмное пятно по центру — это область прямого излучения динамика. Точка
// попадает в него целиком или не попадает вовсе: если просто вырезать круг
// поверх решётки, точки на границе режутся пополам и читаются как грязь, а не
// как отверстия. Поэтому решает центр точки, а край пятна получается
// «ступенчатым» из целых точек — ровно так же выглядит настоящая перфорация.
export function centerDotCenters(width: number, height: number): Array<[number, number]> {
  if (width <= 0 || height <= 0) return []

  const stepX = computeStep(width)
  const stepY = computeStep(height)
  const radius = Math.min(width, height) * CENTER_RATIO
  const cx = width / 2
  const cy = height / 2

  const dots: Array<[number, number]> = []
  for (let i = 0; i < countDots(width); i++) {
    for (let j = 0; j < countDots(height); j++) {
      // Та же геометрия, что у SVG-паттерна: точка стоит в углу ячейки со
      // смещением в половину диаметра, поэтому тёмные точки ложатся ровно
      // поверх серых, а не рядом с ними.
      const x = i * stepX + DOT_SIZE / 2
      const y = j * stepY + DOT_SIZE / 2
      if (Math.hypot(x - cx, y - cy) <= radius) dots.push([x, y])
    }
  }
  return dots
}
