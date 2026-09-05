import { describe, expect, it } from 'vitest'
import { usePlayerStore } from './playerStore'
import { stations } from '../lib/stations'

describe('playerStore station index wrap-around', () => {
  it('wraps forward past the last station back to the first', () => {
    usePlayerStore.getState().setStationIndex(stations.length - 1)
    usePlayerStore.getState().stepStation(1)
    expect(usePlayerStore.getState().stationIndex).toBe(0)
  })

  it('wraps backward before the first station to the last', () => {
    usePlayerStore.getState().setStationIndex(0)
    usePlayerStore.getState().stepStation(-1)
    expect(usePlayerStore.getState().stationIndex).toBe(stations.length - 1)
  })

  it('setStationIndex normalizes out-of-range values', () => {
    usePlayerStore.getState().setStationIndex(stations.length + 1)
    expect(usePlayerStore.getState().stationIndex).toBe(1)
  })
})
