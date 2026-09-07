import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { buildLogBinRanges } from '../lib/spectrum'

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

// Safari отдаёт нули из getByteFrequencyData для живых стримов (давний баг
// движка: https://developer.apple.com/forums/thread/56362), а в Yandex
// Browser Web Audio API зашумлён защитой от аудио-фингерпринтинга — в обоих
// случаях звук играет нормально, а анализатор молчит. Столько подряд немых
// кадров (~1.5с при 60fps) считаем достаточным, чтобы решить: реальных
// данных не будет, и подменить их декоративной анимацией — иначе эквалайзер
// выглядит сломанным на играющей станции.
const SILENT_FRAMES_BEFORE_FALLBACK = 90

// Не случайный шум по кадрам (при ATTACK=0.6 он дёргался бы), а гладкая
// сумма синусоид со своим сдвигом фазы и скоростью на каждый столбик —
// движение похоже на музыку, но не привязано к реальному сигналу.
function syntheticTarget(index: number, time: number): number {
  const phase = index * 0.7
  const speed = 0.0016 + (index % 5) * 0.0004
  const base = 0.4 + 0.28 * Math.sin(time * speed + phase)
  const flicker = 0.18 * Math.sin(time * speed * 3.1 + phase * 1.7)
  return Math.max(0, Math.min(1, base + flicker))
}

export function Equalizer({ analyser, isPlaying }: EqualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heightsRef = useRef<Float32Array>(new Float32Array(NUM_BARS))
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Размер канваса раньше был прибит константами (280×14) при растягивающем
  // w-full: буфер не совпадал с реальной шириной и масштабировался браузером,
  // а на экранах с devicePixelRatio > 1 столбики к тому же были мыльными.
  // Меряем фактический размер и заводим буфер под плотность пикселей.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const update = () => setSize({ width: canvas.clientWidth, height: canvas.clientHeight })
    update()

    const observer = new ResizeObserver(update)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = size
    if (width <= 0 || height <= 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Смена width/height сбрасывает состояние контекста, поэтому трансформация
    // ставится после неё. Дальше рисуем в CSS-пикселях.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

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
    let silentFrames = 0
    let usingFallback = false

    // Ловушка при отладке: в скрытой или фоновой вкладке браузер вообще не
    // вызывает requestAnimationFrame, поэтому эквалайзер замирает на последнем
    // кадре при исправно играющем звуке. Так же ведёт себя и пружина диска.
    // Это не сломанный анализатор и не мёртвый контекст — прежде чем чинить,
    // проверь document.hidden: при true цикл просто не крутится.
    const draw = () => {
      frameId = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(data)

      let total = 0
      for (let i = 0; i < data.length; i++) total += data[i]

      if (total > 0) {
        silentFrames = 0
        usingFallback = false
      } else {
        silentFrames += 1
        if (silentFrames > SILENT_FRAMES_BEFORE_FALLBACK) usingFallback = true
      }

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < NUM_BARS; i++) {
        let target: number
        if (usingFallback) {
          target = syntheticTarget(i, performance.now())
        } else {
          const [lo, hi] = bandRanges[i]
          let sum = 0
          for (let bin = lo; bin < hi; bin++) sum += data[bin]
          target = sum / (hi - lo) / 255
        }

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
  }, [analyser, isPlaying, size])

  return <canvas ref={canvasRef} className="h-4 w-full" />
}
