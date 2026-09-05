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

function persist(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем
  }
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
