/**
 * Tests for useFirestoreStorage composable
 * Firestore localStorage management utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFirestoreStorage } from '../useFirestoreStorage'

describe('useFirestoreStorage', () => {
  const storage = useFirestoreStorage()

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadDatabasesFromStorage', () => {
    it('returns default database when nothing stored', () => {
      const databases = storage.loadDatabasesFromStorage()
      expect(databases).toEqual(['(default)'])
    })

    it('loads stored databases', () => {
      localStorage.setItem('firestore-databases', JSON.stringify(['(default)', 'my-db']))
      const databases = storage.loadDatabasesFromStorage()
      expect(databases).toEqual(['(default)', 'my-db'])
    })

    it('returns default on parse error', () => {
      localStorage.setItem('firestore-databases', 'invalid-json')
      const databases = storage.loadDatabasesFromStorage()
      expect(databases).toEqual(['(default)'])
    })
  })

  describe('saveDatabasesToStorage', () => {
    it('saves databases to localStorage', () => {
      storage.saveDatabasesToStorage(['(default)', 'prod-db', 'test-db'])
      const stored = localStorage.getItem('firestore-databases')
      expect(JSON.parse(stored!)).toEqual(['(default)', 'prod-db', 'test-db'])
    })
  })

  describe('loadSelectedDatabaseFromStorage', () => {
    it('returns default when nothing stored', () => {
      const selected = storage.loadSelectedDatabaseFromStorage()
      expect(selected).toBe('(default)')
    })

    it('loads stored selected database', () => {
      localStorage.setItem('firestore-selected-database', 'my-db')
      const selected = storage.loadSelectedDatabaseFromStorage()
      expect(selected).toBe('my-db')
    })
  })

  describe('saveSelectedDatabaseToStorage', () => {
    it('saves selected database to localStorage', () => {
      storage.saveSelectedDatabaseToStorage('prod-db')
      const stored = localStorage.getItem('firestore-selected-database')
      expect(stored).toBe('prod-db')
    })
  })

  describe('addDatabaseToStorage', () => {
    it('adds new database to list', () => {
      const result = storage.addDatabaseToStorage('new-db')
      expect(result).toContain('new-db')
      expect(result).toContain('(default)')
    })

    it('does not add duplicate database', () => {
      storage.saveDatabasesToStorage(['(default)', 'existing-db'])
      const result = storage.addDatabaseToStorage('existing-db')
      expect(result.filter(db => db === 'existing-db')).toHaveLength(1)
    })

    it('sorts databases with (default) first', () => {
      const result = storage.addDatabaseToStorage('alpha-db')
      expect(result[0]).toBe('(default)')
    })

    it('sorts remaining databases alphabetically', () => {
      storage.saveDatabasesToStorage(['(default)'])
      storage.addDatabaseToStorage('zebra-db')
      const result = storage.addDatabaseToStorage('alpha-db')

      expect(result[0]).toBe('(default)')
      expect(result[1]).toBe('alpha-db')
      expect(result[2]).toBe('zebra-db')
    })
  })

  describe('removeDatabaseFromStorage', () => {
    it('removes database from list', () => {
      storage.saveDatabasesToStorage(['(default)', 'to-remove', 'to-keep'])
      const result = storage.removeDatabaseFromStorage('to-remove')
      expect(result).toEqual(['(default)', 'to-keep'])
    })

    it('cannot remove (default) database', () => {
      storage.saveDatabasesToStorage(['(default)', 'other-db'])
      const result = storage.removeDatabaseFromStorage('(default)')
      expect(result).toContain('(default)')
    })

    it('switches to default if removed db was selected', () => {
      storage.saveDatabasesToStorage(['(default)', 'selected-db'])
      storage.saveSelectedDatabaseToStorage('selected-db')

      storage.removeDatabaseFromStorage('selected-db')

      const selected = storage.loadSelectedDatabaseFromStorage()
      expect(selected).toBe('(default)')
    })
  })

  describe('clearFirestoreStorage', () => {
    it('clears all firestore storage data', () => {
      storage.saveDatabasesToStorage(['(default)', 'db1', 'db2'])
      storage.saveSelectedDatabaseToStorage('db1')

      storage.clearFirestoreStorage()

      expect(localStorage.getItem('firestore-databases')).toBeNull()
      expect(localStorage.getItem('firestore-selected-database')).toBeNull()
    })
  })

  describe('getFirestoreStorageData', () => {
    it('returns all storage data', () => {
      storage.saveDatabasesToStorage(['(default)', 'my-db'])
      storage.saveSelectedDatabaseToStorage('my-db')

      const data = storage.getFirestoreStorageData()

      expect(data.databases).toEqual(['(default)', 'my-db'])
      expect(data.selectedDatabase).toBe('my-db')
    })
  })

  describe('isStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(storage.isStorageAvailable()).toBe(true)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('exposes storage key constants', () => {
      expect(storage.STORAGE_KEY_DATABASES).toBe('firestore-databases')
      expect(storage.STORAGE_KEY_SELECTED_DB).toBe('firestore-selected-database')
    })
  })
})
