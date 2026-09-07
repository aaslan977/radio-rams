import { useEffect, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

interface TextScrambleProps {
  text: string
  className?: string
}

const DURATION_MS = 400

// При смене текста символы слева направо "дошифровываются" из случайного
// набора до итогового текста — читаемо сигнализирует смену станции.
// Раскладка не едет не потому, что ширина строки стабильна во время анимации:
// у случайных символов пропорционального IBM Plex Sans она гуляет на десятки
// пикселей от кадра к кадру (замерено — до ~40% от финальной ширины на
// "Radio Swiss Classic"). Устойчивость даёт `className="truncate"` на самом
// span — фиксированная ширина родителя и overflow hidden, а не стабильность
// самой отрисованной строки.
export function TextScramble({ text, className }: TextScrambleProps) {
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    let frameId = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1)
      const revealCount = Math.floor(progress * text.length)

      let result = ''
      for (let i = 0; i < text.length; i++) {
        result += i < revealCount || text[i] === ' ' ? text[i] : randomChar()
      }
      setDisplay(result)

      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [text])

  return <span className={className}>{display}</span>
}
