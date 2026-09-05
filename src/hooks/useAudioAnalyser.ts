import { useEffect, useRef, type RefObject } from 'react'

interface AudioGraph {
  context: AudioContext
  source: MediaElementAudioSourceNode
}

// createMediaElementSource может быть вызван только один раз для данного
// <audio>-элемента за всё время его жизни, поэтому граф кэшируется на элементе —
// это также защищает от двойного вызова эффекта в React StrictMode (dev-режим).
const audioGraphs = new WeakMap<HTMLAudioElement, AudioGraph>()

function getAudioGraph(audio: HTMLAudioElement): AudioGraph {
  let graph = audioGraphs.get(audio)
  if (!graph) {
    const context = new AudioContext()
    const source = context.createMediaElementSource(audio)
    graph = { context, source }
    audioGraphs.set(audio, graph)
  }
  return graph
}

export function useAudioAnalyser(audioRef: RefObject<HTMLAudioElement | null>) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const { context, source } = getAudioGraph(audio)
    const analyser = context.createAnalyser()
    analyser.fftSize = 256

    source.connect(analyser)
    analyser.connect(context.destination)

    contextRef.current = context
    analyserRef.current = analyser

    return () => {
      source.disconnect(analyser)
      analyser.disconnect()
    }
  }, [audioRef])

  const resume = () => {
    void contextRef.current?.resume()
  }

  return { analyserRef, resume }
}
