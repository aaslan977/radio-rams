import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TextScramble } from './TextScramble'

// framer-motion инициализирует prefersReducedMotion лениво и один раз на
// процесс (слушает 'change' на уже захваченном matchMedia), поэтому подменить
// window.matchMedia в отдельном тесте бесполезно — переопределяем сам
// useReducedMotion модуля. Префикс mock обязателен: vi.mock поднимается
// над импортами, и только так модуль виден внутри фабрики.
const mockUseReducedMotion = vi.fn(() => false)
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useReducedMotion: () => mockUseReducedMotion() }
})

describe('TextScramble: обычный режим', () => {
  it('меняет текст не мгновенно — на первом кадре ещё видна дошифровка', async () => {
    const { rerender } = render(<TextScramble text="KEXP 90.3 FM" />)
    rerender(<TextScramble text="Radio Swiss Jazz" />)

    // Сразу после смены пропса реальный React-эффект ещё не успел
    // отрисовать ни одного кадра requestAnimationFrame — виден старый текст.
    expect(screen.getByText('KEXP 90.3 FM')).toBeInTheDocument()

    // DURATION_MS=400, но реальный rAF в jsdom идёт медленнее и не совпадает
    // с настенным временем 1:1 и от прогона к прогону — опрашиваем вместо
    // фиксированного ожидания.
    await waitFor(() => expect(screen.getByText('Radio Swiss Jazz')).toBeInTheDocument(), {
      timeout: 3000,
    })
  })
})

describe('TextScramble: уважает prefers-reduced-motion', () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(true)
  })

  afterEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
  })

  it('меняет текст сразу на итоговый, без промежуточных случайных символов', () => {
    const { rerender } = render(<TextScramble text="KEXP 90.3 FM" />)
    rerender(<TextScramble text="Radio Swiss Jazz" />)

    expect(screen.getByText('Radio Swiss Jazz')).toBeInTheDocument()
  })
})
