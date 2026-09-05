import { useEffect, useRef } from 'react'

interface EqualizerProps {
  analyser: AnalyserNode | null
  isPlaying: boolean
}

const NUM_BARS = 28
// Асимметричное сглаживание, как у настоящего VU-метра: столбик быстро
// подскакивает на пике и медленно спадает — без этого высота дёргается
// каждый кадр вслед за сырыми данными FFT.
const ATTACK = 0.6
const RELEASE = 0.12
// Доля высоты, начиная с которой столбик считается "пиковым" и подсвечивается акцентом.
const PEAK_THRESHOLD = 0.72

// Бины FFT линейны по частоте, а музыкальная энергия — нет: почти вся сила
// сосредоточена в первых нескольких бинах, и через линейную выборку правая
// половina столбиков остаётся почти неподвижной. Группируем бины по
// логарифмической шкале, чтобы бас, середина и верха были одинаково заметны.
function buildLogBinRanges(bandCount: number, binCount: number): Array<[number, number]> {
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

export function Equalizer({ analyser, isPlaying }: EqualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heightsRef = useRef<Float32Array>(new Float32Array(NUM_BARS))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    const barWidth = width / NUM_BARS
    // Приглушённее токена --color-ink-soft — на этой маленькой высоте
    // столбики не должны спорить по контрасту с названием станции.
    const baseColor = 'rgba(138, 138, 138, 0.55)'

    // Пустое состояние — плоская линия-нуль вместо замершего кадра с музыки
    // или полностью пустого канваса: эквалайзер всегда на месте, просто без сигнала.
    const drawIdle = () => {
      heightsRef.current.fill(0)
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = baseColor
      for (let i = 0; i < NUM_BARS; i++) {
        ctx.fillRect(i * barWidth, height - 2, barWidth - 2, 2)
      }
    }

    if (!isPlaying || !analyser) {
      drawIdle()
      return
    }

    const data = new Uint8Array(analyser.frequencyBinCount)
    const bandRanges = buildLogBinRanges(NUM_BARS, analyser.frequencyBinCount)
    const heights = heightsRef.current
    const rootStyle = getComputedStyle(document.documentElement)
    const peakColor = rootStyle.getPropertyValue('--color-accent').trim() || '#ff611a'
    let frameId = 0

    const draw = () => {
      frameId = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(data)

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < NUM_BARS; i++) {
        const [lo, hi] = bandRanges[i]
        let sum = 0
        for (let bin = lo; bin < hi; bin++) sum += data[bin]
        const target = sum / (hi - lo) / 255

        const rate = target > heights[i] ? ATTACK : RELEASE
        heights[i] += (target - heights[i]) * rate

        const barHeight = Math.max(heights[i] * height, 2)
        ctx.fillStyle = heights[i] > PEAK_THRESHOLD ? peakColor : baseColor
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight)
      }
    }

    draw()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [analyser, isPlaying])

  return <canvas ref={canvasRef} width={280} height={14} className="h-3.5 w-full" />
}
