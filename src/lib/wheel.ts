// Станции замкнуты в кольцо, поэтому «на сколько шагов повернуть диск» — не
// просто разница индексов: с последней станции на первую ближе на один шаг
// вперёд, а не на семь назад. Возвращает шаг со знаком по кратчайшей дуге.
//
// Нужно для внешней смены станции (клик по засечке): диск обязан доехать до
// новой станции коротким путём, а не откручиваться через весь список.
export function shortestStepDelta(from: number, to: number, count: number): number {
  if (count <= 0) return 0
  const forward = (((to - from) % count) + count) % count
  // Ровно половина кольца — расстояние одинаковое в обе стороны; берём вперёд,
  // чтобы поведение было предсказуемым, а не зависело от знака разности.
  return forward > count / 2 ? forward - count : forward
}

export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}
