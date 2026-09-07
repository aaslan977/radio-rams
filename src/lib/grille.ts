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
//
// Шаг между точками ВНУТРИ ряда — горизонтальный, общий для всех рядов.
// Вертикальный шаг между рядами вычисляют countRows/computeRowStep ниже:
// решётка гексагональная (см. иконку приложения), а не квадратная миллиметровка.
export function computeStep(size: number): number {
  if (size <= 0) return DOT_SIZE + GAP
  const count = Math.max(1, Math.floor((size + GAP) / (DOT_SIZE + GAP)))
  return count > 1 ? (size - DOT_SIZE) / (count - 1) : size
}

// Сколько целых точек укладывается в ряд при таком шаге. Нужно и самой
// computeStep, и тестам, которые проверяют, что точки не обрезаются.
export function countDots(size: number): number {
  if (size <= 0) return 1
  return Math.max(1, Math.floor((size + GAP) / (DOT_SIZE + GAP)))
}

// Соотношение шага между рядами к шагу между точками в ряду — геометрия
// правильной гексагональной упаковки (высота равностороннего треугольника со
// стороной 1): даёт точке в соседнем ряду то же расстояние до неё, что и у
// соседей в её собственном ряду, а не растянутые по вертикали овалы.
const HEX_ROW_RATIO = Math.sqrt(3) / 2

// Число рядов обязано быть нечётным. Тёмное пятно симметрично относительно
// обеих осей (см. тест "пятно симметрично"), а чётные ряды сдвинуты
// относительно нечётных на полшага — при зеркалировании по вертикали ряд r
// отражается в ряд (rows-1-r), и его чётность (а с ней и офсет) совпадает с
// исходной только когда rows-1 чётно, то есть rows нечётно.
export function countRows(width: number, height: number): number {
  if (height <= 0) return 1
  const idealRowStep = computeStep(width) * HEX_ROW_RATIO
  let count = Math.max(1, Math.floor((height - DOT_SIZE) / idealRowStep) + 1)
  if (count % 2 === 0) count -= 1
  return Math.max(1, count)
}

// Растягивает идеальный гекс-шаг под фактическую высоту тем же приёмом, что
// computeStep для горизонтали — точки первого и последнего ряда стоят строго
// по краям, ни один ряд не обрезан.
export function computeRowStep(width: number, height: number): number {
  if (height <= 0) return computeStep(width) * HEX_ROW_RATIO
  const count = countRows(width, height)
  return count > 1 ? (height - DOT_SIZE) / (count - 1) : height
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
  const rowStep = computeRowStep(width, height)
  const rows = countRows(width, height)
  const cols = countDots(width)
  const radius = Math.min(width, height) * CENTER_RATIO
  const cx = width / 2
  const cy = height / 2

  const dots: Array<[number, number]> = []
  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1
    // Нечётный ряд сдвинут на полшага и от этого короче на одну точку —
    // иначе последняя точка вылезла бы за правый край контейнера.
    const colCount = odd ? cols - 1 : cols
    const y = r * rowStep + DOT_SIZE / 2

    for (let i = 0; i < colCount; i++) {
      // Та же геометрия, что у SVG-паттерна серых точек: тёмные ложатся ровно
      // поверх серых, а не рядом с ними.
      const x = i * stepX + DOT_SIZE / 2 + (odd ? stepX / 2 : 0)
      if (Math.hypot(x - cx, y - cy) <= radius) dots.push([x, y])
    }
  }
  return dots
}
