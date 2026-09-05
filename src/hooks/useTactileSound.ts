export type SoundKey = 'click' | 'release' | 'wheelDetent'

// Сэмплы из Kenney "UI Audio" (CC0) — см. public/sounds/LICENSE.txt
const soundUrls: Partial<Record<SoundKey, string>> = {
  click: '/sounds/click.wav',
  release: '/sounds/release.wav',
  wheelDetent: '/sounds/wheel-detent.wav',
}

const buffers = new Map<string, AudioBuffer>()
let sharedContext: AudioContext | null = null

function getContext(): AudioContext {
  if (!sharedContext) sharedContext = new AudioContext()
  return sharedContext
}

async function loadBuffer(url: string): Promise<AudioBuffer> {
  const cached = buffers.get(url)
  if (cached) return cached
  const context = getContext()
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = await context.decodeAudioData(arrayBuffer)
  buffers.set(url, buffer)
  return buffer
}

export function useTactileSound() {
  const play = (key: SoundKey) => {
    const url = soundUrls[key]
    if (!url) return

    const context = getContext()
    void context.resume()
    void loadBuffer(url).then((buffer) => {
      const source = context.createBufferSource()
      const gain = context.createGain()
      gain.gain.value = 0.5
      source.buffer = buffer
      source.connect(gain)
      gain.connect(context.destination)
      source.start()
    })
  }

  return { play }
}
