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
// набора до итогового текста — читаемо сигнализирует смену станции, не
// перестраивая раскладку (ширина текста не скачет, в отличие от сплит-флэпа).
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
