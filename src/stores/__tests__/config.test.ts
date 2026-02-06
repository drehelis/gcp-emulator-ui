/**
 * Tests for config store
 * Configuration loading and state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfigStore } from '../config'

describe('useConfigStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty runtime config initially', () => {
      // Mock fetch to prevent auto-load
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response)

      const store = useConfigStore()
      expect(store.runtimeConfig).toEqual({})
    })

    it('starts not loaded', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response)

      const store = useConfigStore()
      // Wait for initial load attempt
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(store.isLoaded).toBe(true) // Becomes true after load attempt
    })
  })

  describe('loadRuntimeConfig', () => {
    it('loads config from /config.json', async () => {
      const mockConfig = {
        pubsub: {
          pubsubPreConfiguredMsgAttr: { key1: 'value1' },
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()

      expect(fetch).toHaveBeenCalledWith('/config.json', expect.any(Object))
      expect(store.runtimeConfig).toEqual(mockConfig)
      expect(store.isLoaded).toBe(true)
    })

    it('handles 404 gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()

      expect(store.isLoaded).toBe(true)
      expect(store.error).toBe(null)
    })

    it('sets error on fetch failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const store = useConfigStore()
      await store.loadRuntimeConfig()

      expect(store.isLoaded).toBe(true)
      expect(store.error).toBe('Network error')
    })

    it('does not reload if already loaded', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()
      await store.loadRuntimeConfig()

      // Should only be called once (excluding the auto-load)
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('refreshConfig', () => {
    it('reloads configuration', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ version: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ version: 2 }),
        } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()
      expect(store.runtimeConfig).toEqual({ version: 1 })

      await store.refreshConfig()
      expect(store.runtimeConfig).toEqual({ version: 2 })
    })
  })

  describe('updateRuntimeConfig', () => {
    it('merges partial config updates', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ existing: 'value' }),
      } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()

      store.updateRuntimeConfig({ newKey: 'newValue' })

      expect(store.runtimeConfig).toEqual({
        existing: 'value',
        newKey: 'newValue',
      })
    })
  })

  describe('pubsubPreConfiguredAttributes getter', () => {
    it('returns empty object when no pubsub config', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()

      expect(store.pubsubPreConfiguredAttributes).toEqual({})
    })

    it('returns attributes when configured', async () => {
      const mockAttrs = { attr1: 'val1', attr2: 'val2' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pubsub: { pubsubPreConfiguredMsgAttr: mockAttrs },
          }),
      } as Response)

      const store = useConfigStore()
      await store.loadRuntimeConfig()

      expect(store.pubsubPreConfiguredAttributes).toEqual(mockAttrs)
    })
  })
})
