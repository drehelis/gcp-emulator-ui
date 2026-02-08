/**
 * Tests for Topics store
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTopicsStore } from '../topics'
import { useProjectsStore } from '../projects'

// Mock the API
vi.mock('@/api/pubsub', () => ({
  topicsApi: {
    getTopics: vi.fn(),
    getTopic: vi.fn(),
    createTopic: vi.fn(),
    updateTopic: vi.fn(),
    deleteTopic: vi.fn(),
  },
  subscriptionsApi: {
    getSubscriptions: vi.fn(),
    deleteSubscription: vi.fn(),
  },
}))

describe('useTopicsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Setup projects store with a selected project
    const projectsStore = useProjectsStore()
    projectsStore.selectedProject = {
      projectId: 'test-project',
      name: 'Test Project',
      projectNumber: '123456789',
      lifecycleState: 'ACTIVE',
      createTime: new Date().toISOString(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('has correct initial state', () => {
      const store = useTopicsStore()

      expect(store.topics).toEqual([])
      expect(store.selectedTopic).toBeNull()
      expect(store.state.state).toBe('idle')
      expect(store.filters.projectId).toBe('')
    })
  })

  describe('getters', () => {
    it('currentProjectTopics filters by selected project', () => {
      const store = useTopicsStore()
      store.topics = [
        {
          projectId: 'test-project',
          name: 'topic1',
          fullName: 'projects/test-project/topics/topic1',
          id: 'topic1',
          createdAt: new Date(),
          updatedAt: new Date(),
          state: 'ACTIVE',
        },
        {
          projectId: 'other-project',
          name: 'topic2',
          fullName: 'projects/other-project/topics/topic2',
          id: 'topic2',
          createdAt: new Date(),
          updatedAt: new Date(),
          state: 'ACTIVE',
        },
      ] as any

      expect(store.currentProjectTopics).toHaveLength(1)
      expect(store.currentProjectTopics[0].name).toBe('topic1')
    })

    it('filteredTopics applies name filter', () => {
      const store = useTopicsStore()
      store.topics = [
        {
          projectId: 'test-project',
          name: 'alpha',
          fullName: 'projects/test-project/topics/alpha',
          id: 'alpha',
          createdAt: new Date(),
          updatedAt: new Date(),
          state: 'ACTIVE',
        },
        {
          projectId: 'test-project',
          name: 'beta',
          fullName: 'projects/test-project/topics/beta',
          id: 'beta',
          createdAt: new Date(),
          updatedAt: new Date(),
          state: 'ACTIVE',
        },
      ] as any

      store.filters.namePattern = 'alp'
      expect(store.filteredTopics).toHaveLength(1)
      expect(store.filteredTopics[0].name).toBe('alpha')
    })

    it('filteredTopics applies label filter', () => {
      const store = useTopicsStore()
      store.topics = [
        { projectId: 'test-project', name: 't1', fullName: 'p/t/t1', labels: { env: 'prod' } },
        { projectId: 'test-project', name: 't2', fullName: 'p/t/t2', labels: { env: 'dev' } },
      ] as any
      store.filters.labels = { env: 'prod' }
      expect(store.filteredTopics).toHaveLength(1)
      expect(store.filteredTopics[0].name).toBe('t1')
    })

    it('filteredTopics applies state filter', () => {
      const store = useTopicsStore()
      store.topics = [
        { projectId: 'test-project', name: 't1', fullName: 'p/t/t1', state: 'ACTIVE' },
        { projectId: 'test-project', name: 't2', fullName: 'p/t/t2', state: 'DELETED' },
      ] as any
      store.filters.states = ['ACTIVE']
      expect(store.filteredTopics).toHaveLength(1)
      expect(store.filteredTopics[0].name).toBe('t1')
    })

    it('filteredTopics applies date range filter', () => {
      const store = useTopicsStore()
      const now = new Date()
      const old = new Date(now.getTime() - 100000)
      store.topics = [
        { projectId: 'test-project', name: 'old', fullName: 'p/t/old', createdAt: old },
        { projectId: 'test-project', name: 'new', fullName: 'p/t/new', createdAt: now },
      ] as any

      store.filters.dateRange = {
        start: new Date(now.getTime() - 1000),
        end: new Date(now.getTime() + 1000),
      }
      expect(store.filteredTopics).toHaveLength(1)
      expect(store.filteredTopics[0].name).toBe('new')
    })
  })

  describe('fetchTopics', () => {
    it('fetches topics and updates state', async () => {
      const { topicsApi } = await import('@/api/pubsub')
      const mockTopics = [
        {
          name: 'projects/test-project/topics/topic1',
          projectId: 'test-project',
        },
        {
          name: 'projects/test-project/topics/topic2',
          projectId: 'test-project',
        },
      ]
      vi.mocked(topicsApi.getTopics).mockResolvedValue(mockTopics as any)

      const store = useTopicsStore()
      await store.fetchTopics('test-project')

      expect(store.topics).toHaveLength(2)
      expect(store.topics[0].name).toBe('topic1')
      expect(store.state.state).toBe('success')
    })

    it('handles errors', async () => {
      const { topicsApi } = await import('@/api/pubsub')
      vi.mocked(topicsApi.getTopics).mockRejectedValue(new Error('API Error'))

      const store = useTopicsStore()
      await expect(store.fetchTopics('test-project')).rejects.toThrow('API Error')

      expect(store.state.state).toBe('error')
      expect(store.state.error).toBe('API Error')
    })
  })

  describe('createTopic', () => {
    it('creates topic locally (mocked)', async () => {
      const store = useTopicsStore()
      const promise = store.createTopic({
        projectId: 'test-project',
        name: 'new-topic',
        messageStoragePolicy: { allowedPersistenceRegions: [] },
        schemaSettings: { schema: '', encoding: 'JSON' },
      })

      await vi.advanceTimersByTimeAsync(1100) // Advance for the debounce/delay in createTopic

      const newTopic = await promise
      expect(newTopic.name).toBe('new-topic')
      expect(store.topics).toContainEqual(newTopic)
    })

    it('throws if topic exists', async () => {
      const store = useTopicsStore()
      store.topics = [
        {
          projectId: 'test-project',
          name: 'existing',
          fullName: 'projects/test-project/topics/existing',
        },
      ] as any

      await expect(
        store.createTopic({
          projectId: 'test-project',
          name: 'existing',
        })
      ).rejects.toThrow('Topic existing already exists')
    })
  })

  describe('deleteTopic', () => {
    it('deletes topic and related subscriptions', async () => {
      const { topicsApi, subscriptionsApi } = await import('@/api/pubsub')

      vi.mocked(subscriptionsApi.getSubscriptions).mockResolvedValue([
        {
          name: 'projects/test-project/subscriptions/sub1',
          topic: 'projects/test-project/topics/topic1',
        },
        {
          name: 'projects/test-project/subscriptions/sub2',
          topic: 'projects/test-project/topics/other-topic',
        },
      ] as any)

      vi.mocked(subscriptionsApi.deleteSubscription).mockResolvedValue()
      vi.mocked(topicsApi.deleteTopic).mockResolvedValue()

      const store = useTopicsStore()
      store.topics = [
        {
          projectId: 'test-project',
          name: 'topic1',
          fullName: 'projects/test-project/topics/topic1',
        },
      ] as any

      await store.deleteTopic('topic1')

      // Should delete related subscription
      expect(subscriptionsApi.deleteSubscription).toHaveBeenCalledWith('test-project', 'sub1')
      // Should delete topic
      expect(topicsApi.deleteTopic).toHaveBeenCalledWith('test-project', 'topic1')
      // Should update state
      expect(store.topics).toHaveLength(0)
    })
  })

  describe('batch operations', () => {
    it('createBatchTopics runs and completes', async () => {
      const store = useTopicsStore()
      const batchId = await store.createBatchTopics([{ projectId: 'test-project', name: 'topic1' }])

      let op = store.getBatchOperation(batchId)
      expect(op?.status).toBe('PENDING')

      // Advance initial delay (1000ms)
      await vi.advanceTimersByTimeAsync(1100)

      // Advance operation delay (1000ms per topic)
      await vi.advanceTimersByTimeAsync(1100)

      op = store.getBatchOperation(batchId)
      expect(op?.status).toBe('COMPLETED')
      expect(store.topics).toHaveLength(1)
    })

    it('deleteBatchTopics runs and completes', async () => {
      const { topicsApi } = await import('@/api/pubsub')
      vi.mocked(topicsApi.deleteTopic).mockResolvedValue()

      const store = useTopicsStore()
      const batchId = await store.deleteBatchTopics(['topic1'])

      // Initial delay (1000ms) + operation execution (fast)
      await vi.advanceTimersByTimeAsync(1500)

      const op = store.getBatchOperation(batchId)
      expect(op?.status).toBe('COMPLETED')
      expect(topicsApi.deleteTopic).toHaveBeenCalledWith('test-project', 'topic1')
    })
  })

  describe('UI actions', () => {
    it('selects and deselects topic', () => {
      const store = useTopicsStore()
      const topic = { name: 't1', projectId: 'p1', fullName: 'projects/p1/topics/t1' } as any

      store.selectTopic(topic)
      expect(store.selectedTopic).toEqual(topic)

      store.clearSelectedTopic()
      expect(store.selectedTopic).toBeNull()
    })

    it('manages filters', () => {
      const store = useTopicsStore()

      store.updateFilters({ namePattern: 'test' })
      expect(store.filters.namePattern).toBe('test')

      store.clearFilters()
      expect(store.filters.namePattern).toBe('')
    })

    it('manages pagination', () => {
      const store = useTopicsStore()
      store.updatePagination({ pageSize: 100 })
      expect(store.pagination.pageSize).toBe(100)
    })

    it('resets state', () => {
      const store = useTopicsStore()
      store.topics = [{ name: 't1' }] as any
      store.filters.namePattern = 'dirty'

      store.reset()

      expect(store.topics).toEqual([])
      expect(store.filters.namePattern).toBe('')
    })

    it('clearProjectData removes specific project data', () => {
      const store = useTopicsStore()
      store.topics = [
        { projectId: 'p1', name: 't1', fullName: 'projects/p1/topics/t1' },
        { projectId: 'p2', name: 't2', fullName: 'projects/p2/topics/t2' },
      ] as any

      // Populate cache with p1 and p2 data
      store.topicCache.set('projects/p1/topics/t1', {} as any)
      store.topicCache.set('projects/p2/topics/t2', {} as any)

      // Set selection to p1
      store.selectedTopic = { projectId: 'p1' } as any

      store.clearProjectData('p1')

      expect(store.topics).toHaveLength(1)
      expect(store.topics[0].projectId).toBe('p2')

      // Verify cache cleared for p1 but kept for p2
      expect(store.topicCache.has('projects/p1/topics/t1')).toBe(false)
      expect(store.topicCache.has('projects/p2/topics/t2')).toBe(true)

      // Verify selection cleared
      expect(store.selectedTopic).toBeNull()
    })
  })
  describe('fetchTopic', () => {
    it('returns cached topic if available', async () => {
      const store = useTopicsStore()
      const topic = { name: 't1', projectId: 'p1', fullName: 'projects/p1/topics/t1' }
      store.topicCache.set('projects/p1/topics/t1', topic as any)

      const result = await store.fetchTopic('t1', 'p1')
      expect(result).toEqual(topic)
    })
  })

  describe('updateTopic errors', () => {
    it('throws if topic not found', async () => {
      const store = useTopicsStore()
      await expect(store.updateTopic('missing', {}, 'test-project')).rejects.toThrow(
        'Topic missing not found'
      )
    })
  })

  describe('deleteTopic partial failure', () => {
    it('continues if subscription deletion fails', async () => {
      const { topicsApi, subscriptionsApi } = await import('@/api/pubsub')
      vi.mocked(subscriptionsApi.getSubscriptions).mockResolvedValue([
        { name: 'projects/p1/subscriptions/sub1', topic: 'projects/p1/topics/t1' },
      ] as any)
      vi.mocked(subscriptionsApi.deleteSubscription).mockRejectedValue(new Error('Sub fail'))
      vi.mocked(topicsApi.deleteTopic).mockResolvedValue()

      const store = useTopicsStore()
      store.topics = [{ projectId: 'p1', name: 't1', fullName: 'projects/p1/topics/t1' }] as any

      await store.deleteTopic('t1', 'p1')

      expect(topicsApi.deleteTopic).toHaveBeenCalled()
      expect(store.topics).toHaveLength(0)
    })
  })

  describe('clearCache', () => {
    it('clears all caches', () => {
      const store = useTopicsStore()
      store.topicCache.set('k', {} as any)

      store.clearCache()

      expect(store.topicCache.size).toBe(0)
    })
  })

  describe('additional getters', () => {
    it('topicStats aggregates correctly', () => {
      const store = useTopicsStore()
      store.topics = [
        {
          projectId: 'test-project',
          state: 'ACTIVE',
          messageCount: 10,
          subscriptionsCount: 2,
          schemaSettings: {},
          kmsKeyName: 'key',
        },
        {
          projectId: 'test-project',
          state: 'DELETED',
          messageCount: 5,
          subscriptionsCount: 0,
        },
      ] as any

      const stats = store.topicStats
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(1)
      expect(stats.withSchema).toBe(1)
      expect(stats.withKms).toBe(1)
      expect(stats.totalMessages).toBe(15)
      expect(stats.totalSubscriptions).toBe(2)
    })

    it('activeBatchOperations returns pending and running ops', () => {
      const store = useTopicsStore()
      store.batchOperations.set('1', { status: 'PENDING' } as any)
      store.batchOperations.set('2', { status: 'RUNNING' } as any)
      store.batchOperations.set('3', { status: 'COMPLETED' } as any)

      expect(store.activeBatchOperations).toHaveLength(2)
    })
  })

  describe('fetchTopics name parsing', () => {
    it('parses short name from full name', async () => {
      const { topicsApi } = await import('@/api/pubsub')
      vi.mocked(topicsApi.getTopics).mockResolvedValue([
        {
          name: 'projects/p1/topics/my-topic',
          projectId: 'p1',
        },
      ] as any)

      const store = useTopicsStore()
      await store.fetchTopics('p1')

      expect(store.topics[0].name).toBe('my-topic')
    })
  })
})
