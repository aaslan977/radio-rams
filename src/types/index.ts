export interface Station {
  id: string
  name: string
  genre: string
  streamUrl: string
}

export type PlaybackStatus = 'stopped' | 'connecting' | 'playing' | 'error'
