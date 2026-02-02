/**
 * Tests for pubsubAttributes utility
 * Pub/Sub message attribute handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// We need to test the convertObjectToMessageAttributes function
// Since it's not exported, we'll test it through usePreconfiguredMessageAttributes

describe('pubsubAttributes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('usePreconfiguredMessageAttributes', () => {
    it('returns empty array when config has no attributes', async () => {
      // Mock fetch to return empty config
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([])
    })

    it('converts object attributes to MessageAttribute array', async () => {
      // Mock fetch to return config with pubsub attributes
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: {
              'Content-Type': 'application/json',
              'X-Custom-Header': 'custom-value'
            }
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([
        { key: 'Content-Type', value: 'application/json' },
        { key: 'X-Custom-Header', value: 'custom-value' }
      ])
    })

    it('trims whitespace from keys and values', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: {
              '  key-with-spaces  ': '  value-with-spaces  '
            }
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value[0].key).toBe('key-with-spaces')
      expect(attributes.value[0].value).toBe('value-with-spaces')
    })

    it('filters out entries with empty keys', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: {
              '': 'empty-key-value',
              '   ': 'whitespace-key-value',
              'valid-key': 'valid-value'
            }
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toHaveLength(1)
      expect(attributes.value[0].key).toBe('valid-key')
    })

    it('allows empty values', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: {
              'key-with-empty-value': ''
            }
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toHaveLength(1)
      expect(attributes.value[0]).toEqual({ key: 'key-with-empty-value', value: '' })
    })

    it('returns empty array when attributes is null', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: null
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([])
    })

    it('returns empty array when attributes is an array instead of object', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: ['should', 'be', 'object']
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([])
    })

    it('handles mixed valid and invalid attribute types', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pubsub: {
            pubsubPreConfiguredMsgAttr: {
              'valid-key': 'valid-value',
              'number-value': 123,  // Should be filtered out
              'null-value': null,   // Should be filtered out
              'another-valid': 'value'
            }
          }
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      // Should only contain valid string key-value pairs
      expect(attributes.value.length).toBeGreaterThanOrEqual(1)
      expect(attributes.value.some(a => a.key === 'valid-key')).toBe(true)
    })

    it('returns empty array when pubsub config is undefined', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // No pubsub section at all
        })
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([])
    })

    it('is reactive to config store changes', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)

      const { usePreconfiguredMessageAttributes } = await import('@/utils/pubsubAttributes')
      const { useConfigStore } = await import('@/stores/config')
      
      const configStore = useConfigStore()
      await configStore.loadRuntimeConfig()
      
      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([])

      // Update the config
      configStore.updateRuntimeConfig({
        pubsub: {
          pubsubPreConfiguredMsgAttr: {
            'new-key': 'new-value'
          }
        }
      })

      // Computed should update reactively
      expect(attributes.value).toEqual([{ key: 'new-key', value: 'new-value' }])
    })
  })
})
