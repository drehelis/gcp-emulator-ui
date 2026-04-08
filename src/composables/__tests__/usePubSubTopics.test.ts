import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePubSubTopics } from '../usePubSubTopics'
import { createPinia, setActivePinia } from 'pinia'
import { topicsApi } from '@/api/pubsub'

// Mock dependencies
vi.mock('@/api/pubsub', () => ({
  topicsApi: {
    getTopics: vi.fn(),
  },
}))

// Mock feature store
vi.mock('@/stores/features', () => ({
  useFeatureStore: vi.fn(() => ({
    storageNotifications: true,
  })),
}))

import { useFeatureStore } from '@/stores/features'

describe('usePubSubTopics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    ;(useFeatureStore as any).mockReturnValue({
      storageNotifications: true,
    })
  })

  it('should initialize with default values', () => {
    const { availableTopics, isLoadingTopics } = usePubSubTopics()
    expect(availableTopics.value).toEqual([])
    expect(isLoadingTopics.value).toBe(false)
  })

  it('fetchTopics should skip when storageNotifications is disabled', async () => {
    ;(useFeatureStore as any).mockReturnValue({
      storageNotifications: false,
    })

    const { fetchTopics } = usePubSubTopics()
    await fetchTopics('test-project')

    expect(topicsApi.getTopics).not.toHaveBeenCalled()
  })

  it('fetchTopics should fetch topics when enabled', async () => {
    const mockTopics = [{ name: 'topic1' }]
    ;(topicsApi.getTopics as any).mockResolvedValue(mockTopics)

    const { fetchTopics, availableTopics, isLoadingTopics } = usePubSubTopics()

    const promise = fetchTopics('test-project')
    expect(isLoadingTopics.value).toBe(true)

    await promise

    expect(topicsApi.getTopics).toHaveBeenCalledWith('test-project')
    expect(availableTopics.value).toEqual(mockTopics)
    expect(isLoadingTopics.value).toBe(false)
  })

  it('fetchTopics should handle errors', async () => {
    ;(topicsApi.getTopics as any).mockRejectedValue(new Error('API error'))

    const { fetchTopics, availableTopics, isLoadingTopics } = usePubSubTopics()

    await fetchTopics('test-project')

    expect(availableTopics.value).toEqual([])
    expect(isLoadingTopics.value).toBe(false)
  })

  it('fetchTopics should skip when projectId is invalid', async () => {
    const { fetchTopics } = usePubSubTopics()

    await fetchTopics(null)
    await fetchTopics(undefined)
    await fetchTopics('Unknown')

    expect(topicsApi.getTopics).not.toHaveBeenCalled()
  })
})
