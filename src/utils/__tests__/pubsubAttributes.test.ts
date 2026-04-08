import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePreconfiguredMessageAttributes } from '../pubsubAttributes'
import { createPinia, setActivePinia } from 'pinia'

// Mock config store
vi.mock('@/stores/config', () => ({
  useConfigStore: vi.fn(() => ({
    pubsubPreConfiguredAttributes: {
      attr1: 'val1',
      '  attr2  ': ' val2 ',
      invalid: 123,
      '': 'empty key',
    },
  })),
}))

import { useConfigStore } from '@/stores/config'

describe('pubsubAttributes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('usePreconfiguredMessageAttributes', () => {
    it('converts object to validated and trimmed attributes', () => {
      const attributes = usePreconfiguredMessageAttributes()

      expect(attributes.value).toEqual([
        { key: 'attr1', value: 'val1' },
        { key: 'attr2', value: 'val2' },
      ])
    })

    it('returns empty array if store returns null or invalid type', () => {
      ;(useConfigStore as any).mockReturnValue({
        pubsubPreConfiguredAttributes: null,
      })

      const attributes = usePreconfiguredMessageAttributes()
      expect(attributes.value).toEqual([])
      ;(useConfigStore as any).mockReturnValue({
        pubsubPreConfiguredAttributes: ['not an object'],
      })
      expect(attributes.value).toEqual([])
    })

    it('handles unexpected errors gracefully', () => {
      // Create a scenario where an error occurs during processing
      // We can force an error by making Object.entries throw
      const originalEntries = Object.entries
      Object.entries = vi.fn().mockImplementation(() => {
        throw new Error('critical failure')
      })

      try {
        const attributes = usePreconfiguredMessageAttributes()
        expect(attributes.value).toEqual([])
      } finally {
        Object.entries = originalEntries
      }
    })
  })
})
