/**
 * Tests for features store
 * Emulator capability detection and feature flags
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFeatureStore } from '../features'

describe('useFeatureStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has storageNotifications enabled by default', () => {
      const store = useFeatureStore()
      expect(store.storageNotifications).toBe(true)
    })
  })

  describe('disableStorageNotifications', () => {
    it('disables storageNotifications', () => {
      const store = useFeatureStore()
      store.disableStorageNotifications()
      expect(store.storageNotifications).toBe(false)
    })

    it('logs a warning when disabling for the first time', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useFeatureStore()
      store.disableStorageNotifications()
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('notifications'))
    })

    it('is idempotent: only warns once when called multiple times', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useFeatureStore()
      store.disableStorageNotifications()
      store.disableStorageNotifications()
      store.disableStorageNotifications()
      expect(warnSpy).toHaveBeenCalledOnce()
    })

    it('stays false after being disabled multiple times', () => {
      const store = useFeatureStore()
      store.disableStorageNotifications()
      store.disableStorageNotifications()
      expect(store.storageNotifications).toBe(false)
    })
  })

  describe('storageNotifications computed', () => {
    it('is reactive to flag changes', () => {
      const store = useFeatureStore()
      expect(store.storageNotifications).toBe(true)
      store.disableStorageNotifications()
      expect(store.storageNotifications).toBe(false)
    })
  })
})
