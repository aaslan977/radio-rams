import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPersist, usePlayerStore } from './playerStore'
import { stations } from '../lib/stations'

const STORAGE_KEY = 'radio-state-v1'

describe('playerStore', () => {
  // Стор — модульный синглтон, и запись идёт в общий localStorage jsdom:
  // без сброса кейсы протекали бы друг в друга через оба канала.
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    usePlayerStore.setState({ stationIndex: 0, status: 'stopped' })
  })

  afterEach(() => {
    flushPersist()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('перебор станций по кругу', () => {
    it('с последней станции шаг вперёд возвращает на первую', () => {
      usePlayerStore.getState().setStationIndex(stations.length - 1)
      usePlayerStore.getState().stepStation(1)

      expect(usePlayerStore.getState().stationIndex).toBe(0)
    })

    it('с первой станции шаг назад уводит на последнюю', () => {
      usePlayerStore.getState().setStationIndex(0)
      usePlayerStore.getState().stepStation(-1)

      expect(usePlayerStore.getState().stationIndex).toBe(stations.length - 1)
    })

    it('приводит индекс за пределами списка к допустимому', () => {
      usePlayerStore.getState().setStationIndex(stations.length + 1)

      expect(usePlayerStore.getState().stationIndex).toBe(1)
    })

    it('приводит большой отрицательный индекс к допустимому', () => {
      usePlayerStore.getState().setStationIndex(-stations.length - 1)

      expect(usePlayerStore.getState().stationIndex).toBe(stations.length - 1)
    })
  })

  describe('сохранение выбранной станции', () => {
    it('схлопывает серию шагов в одну запись', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')

      // Примерно один оборот диска: восемь детентов подряд.
      for (let i = 0; i < 8; i++) usePlayerStore.getState().stepStation(1)
      expect(setItem).not.toHaveBeenCalled()

      vi.runAllTimers()

      expect(setItem).toHaveBeenCalledOnce()
    })

    it('записывает станцию, на которой жест закончился', () => {
      usePlayerStore.getState().setStationIndex(0)
      usePlayerStore.getState().stepStation(1)
      usePlayerStore.getState().stepStation(1)
      vi.runAllTimers()

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ stationIndex: 2 })
    })

    it('досрочно сбрасывает запись, когда вкладку прячут', () => {
      usePlayerStore.getState().setStationIndex(3)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      document.dispatchEvent(new Event('visibilitychange'))

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ stationIndex: 3 })
    })

    it('переживает недоступный localStorage', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      usePlayerStore.getState().setStationIndex(2)

      expect(() => vi.runAllTimers()).not.toThrow()
      expect(usePlayerStore.getState().stationIndex).toBe(2)
    })
  })
})
