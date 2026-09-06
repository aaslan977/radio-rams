import { create } from 'zustand'
import type { PlaybackStatus } from '../types'
import { stations } from '../lib/stations'

const STORAGE_KEY = 'radio-state-v1'

interface PersistedState {
  stationIndex: number
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { stationIndex: 0 }
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const stationIndex =
      typeof parsed.stationIndex === 'number' && parsed.stationIndex >= 0 && parsed.stationIndex < stations.length
        ? parsed.stationIndex
        : 0
    return { stationIndex }
  } catch {
    return { stationIndex: 0 }
  }
}

// Один оборот диска даёт десятки шагов подряд, а setItem синхронный — писать
// на каждый детент значит десятки блокирующих записей во время жеста. Пачка
// схлопывается в одну запись: первый вызов заводит таймер, последующие только
// обновляют то, что будет записано.
const PERSIST_DELAY_MS = 400
let persistTimer: ReturnType<typeof setTimeout> | null = null
let pending: PersistedState | null = null

function writeNow(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем
  }
}

export function flushPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (!pending) return
  const state = pending
  pending = null
  writeNow(state)
}

function persist(state: PersistedState) {
  pending = state
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    flushPersist()
  }, PERSIST_DELAY_MS)
}

// Без досрочного сброса закрытая сразу после переключения вкладка потеряла бы
// выбор. pagehide и уход в hidden — единственные события, на которые можно
// рассчитывать на мобильных: beforeunload там сплошь и рядом не приходит.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPersist)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPersist()
  })
}

interface PlayerState {
  stationIndex: number
  status: PlaybackStatus
  setStationIndex: (index: number) => void
  stepStation: (delta: number) => void
  setStatus: (status: PlaybackStatus) => void
}

const persisted = loadPersisted()

export const usePlayerStore = create<PlayerState>((set, get) => ({
  stationIndex: persisted.stationIndex,
  status: 'stopped',
  setStationIndex: (index) => {
    const stationIndex = ((index % stations.length) + stations.length) % stations.length
    persist({ stationIndex })
    set({ stationIndex })
  },
  stepStation: (delta) => {
    get().setStationIndex(get().stationIndex + delta)
  },
  setStatus: (status) => set({ status }),
}))
