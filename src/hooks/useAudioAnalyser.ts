import { useEffect, useRef, useState, type RefObject } from 'react'

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
  // Анализатор в состоянии, а не в ref: ref, проставленный из эффекта, не
  // вызывает ре-рендер, поэтому потребитель получал бы null до тех пор, пока
  // дерево не перерисуется по какой-нибудь посторонней причине. Эквалайзер
  // оживал только потому, что клик по play попутно менял статус в сторе.
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  // Контекст остаётся в ref: он нужен только обработчику клика, не рендеру.
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const { context, source } = getAudioGraph(audio)
    const node = context.createAnalyser()
    node.fftSize = 256

    // source -> destination напрямую, а анализатор подключен параллельно, а не
    // последовательно в цепи к выходу: в Safari/iOS сериальная цепь
    // source -> analyser -> destination нередко даёт звук, но
    // getByteFrequencyData стабильно отдаёт нули (известная особенность
    // WebKit для потокового <audio>). Параллельное подключение не зависит от
    // этого — и заодно звук больше не пропадает, если создание analyser-узла
    // почему-то не удалось.
    source.connect(context.destination)
    source.connect(node)

    contextRef.current = context
    setAnalyser(node)

    // Выход <audio> идёт через граф, поэтому при неработающем контексте
    // элемент «играет», событие playing приходит, статус становится playing —
    // а звука нет. Контекст засыпает не только до первого жеста: на iOS его
    // усыпляет входящий звонок или сворачивание приложения, и сам он больше не
    // просыпается. Признак «звук сейчас нужен» берём у самого элемента — при
    // усыплённом контексте он остаётся не на паузе.
    const resumeIfNeeded = () => {
      if (audio.paused) return
      if (context.state === 'running' || context.state === 'closed') return
      void context.resume()
    }

    // statechange ловит усыпление в момент, когда вкладка ещё активна;
    // visibilitychange — возвращение со свёрнутого экрана, где statechange мог
    // прийти, пока обработчики уже не выполнялись.
    context.addEventListener('statechange', resumeIfNeeded)
    document.addEventListener('visibilitychange', resumeIfNeeded)

    return () => {
      context.removeEventListener('statechange', resumeIfNeeded)
      document.removeEventListener('visibilitychange', resumeIfNeeded)
      source.disconnect(node)
      source.disconnect(context.destination)
      node.disconnect()
      setAnalyser(null)
    }
  }, [audioRef])

  const resume = () => {
    void contextRef.current?.resume()
  }

  return { analyser, resume }
}
