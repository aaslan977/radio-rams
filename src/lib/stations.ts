import type { Station } from '../types'

// Список станций зафиксирован в brief.md (раздел 4) — каждая проверена на
// официальное разрешение стороннего использования и CORS. Все URL на HTTPS.
export const stations: Station[] = [
  {
    id: 'kexp',
    name: 'KEXP 90.3 FM',
    genre: 'Инди/альтернатива',
    streamUrl: 'https://kexp.streamguys1.com/kexp160.aac',
  },
  {
    id: 'wwoz',
    name: 'WWOZ 90.7 FM',
    genre: 'Джаз/блюз/рутс',
    streamUrl: 'https://wwoz-sc.streamguys1.com/wwoz-hi.mp3',
  },
  {
    id: 'radio-swiss-jazz',
    name: 'Radio Swiss Jazz',
    genre: 'Джаз/лаунж',
    streamUrl: 'https://stream.srg-ssr.ch/srgssr/rsj/mp3/128',
  },
  {
    id: 'radio-swiss-classic',
    name: 'Radio Swiss Classic',
    genre: 'Классика',
    streamUrl: 'https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128',
  },
  {
    id: 'radio-swiss-pop',
    name: 'Radio Swiss Pop',
    genre: 'Поп',
    streamUrl: 'https://stream.srg-ssr.ch/srgssr/rsp/mp3/128',
  },
  {
    id: 'knkx',
    name: 'KNKX 88.5 FM',
    genre: 'Новости/джаз',
    streamUrl: 'https://knkx-live-a.edge.audiocdn.com/6284_128k',
  },
  {
    id: 'wfuv',
    name: 'WFUV 90.7 FM',
    genre: 'Альтернатива/рутс',
    streamUrl: 'https://onair.wfuv.org/onair-hi',
  },
  {
    id: 'jazz24',
    name: 'Jazz24',
    genre: 'Джаз',
    streamUrl: 'https://knkx-live-a.edge.audiocdn.com/6285_128k',
  },
]
