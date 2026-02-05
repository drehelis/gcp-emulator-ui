/**
 * Tests for Pub/Sub API client
 * Topics, subscriptions, schemas, and project management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the API client module
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockPatch = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/api/client', () => ({
  getApiClient: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete
  }),
  createLongRunningRequest: () => ({
    post: mockPost
  })
}))

describe('Pub/Sub API', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('projectsApi', () => {
    it('gets projects from localStorage', async () => {
      localStorage.setItem('pubsub-projects', JSON.stringify(['project1', 'project2']))
      mockGet.mockResolvedValue({ data: { topics: [] } })

      const { projectsApi } = await import('@/api/pubsub')
      const projects = await projectsApi.getProjects()
      
      expect(projects).toContain('project1')
      expect(projects).toContain('project2')
    })

    it('returns empty array when no projects stored', async () => {
      const { projectsApi } = await import('@/api/pubsub')
      const projects = await projectsApi.getProjects()
      
      expect(projects).toEqual([])
    })

    it('attaches new project', async () => {
      const { projectsApi } = await import('@/api/pubsub')
      await projectsApi.attachProject('new-project')
      
      const stored = JSON.parse(localStorage.getItem('pubsub-projects') || '[]')
      expect(stored).toContain('new-project')
    })

    it('does not duplicate existing project', async () => {
      localStorage.setItem('pubsub-projects', JSON.stringify(['existing']))
      
      const { projectsApi } = await import('@/api/pubsub')
      await projectsApi.attachProject('existing')
      
      const stored = JSON.parse(localStorage.getItem('pubsub-projects') || '[]')
      expect(stored).toEqual(['existing'])
    })

    it('removes project', async () => {
      localStorage.setItem('pubsub-projects', JSON.stringify(['project1', 'project2']))
      
      const { projectsApi } = await import('@/api/pubsub')
      await projectsApi.removeProject('project1')
      
      const stored = JSON.parse(localStorage.getItem('pubsub-projects') || '[]')
      expect(stored).toEqual(['project2'])
    })

    it('discovers projects by testing common patterns', async () => {
      mockGet
        .mockResolvedValueOnce({ data: { topics: [] } }) // test-project works
        .mockRejectedValueOnce(new Error('Not found')) // demo-project fails
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))

      const { projectsApi } = await import('@/api/pubsub')
      const discovered = await projectsApi.discoverProjects()
      
      expect(discovered).toContain('test-project')
    })
  })

  describe('topicsApi', () => {
    it('gets topics for project', async () => {
      mockGet.mockResolvedValue({ 
        data: { topics: [{ name: 'topic1' }, { name: 'topic2' }] } 
      })

      const { topicsApi } = await import('@/api/pubsub')
      const topics = await topicsApi.getTopics('my-project')
      
      expect(topics).toHaveLength(2)
      expect(mockGet).toHaveBeenCalledWith('/v1/projects/my-project/topics')
    })

    it('returns empty array when no topics', async () => {
      mockGet.mockResolvedValue({ data: {} })

      const { topicsApi } = await import('@/api/pubsub')
      const topics = await topicsApi.getTopics('my-project')
      
      expect(topics).toEqual([])
    })

    it('gets single topic', async () => {
      mockGet.mockResolvedValue({ data: { name: 'projects/p/topics/t' } })

      const { topicsApi } = await import('@/api/pubsub')
      const topic = await topicsApi.getTopic('my-project', 'my-topic')
      
      expect(topic.name).toBe('projects/p/topics/t')
    })

    it('creates topic with PUT request', async () => {
      mockPut.mockResolvedValue({ data: {} })

      const { topicsApi } = await import('@/api/pubsub')
      const topic = await topicsApi.createTopic('my-project', { name: 'new-topic' })
      
      expect(mockPut).toHaveBeenCalledWith(
        '/v1/projects/my-project/topics/new-topic',
        {}
      )
      expect(topic.name).toBe('projects/my-project/topics/new-topic')
    })

    it('deletes topic', async () => {
      mockDelete.mockResolvedValue({})

      const { topicsApi } = await import('@/api/pubsub')
      await topicsApi.deleteTopic('my-project', 'my-topic')
      
      expect(mockDelete).toHaveBeenCalledWith('/v1/projects/my-project/topics/my-topic')
    })

    it('publishes messages', async () => {
      mockPost.mockResolvedValue({ data: { messageIds: ['123'] } })

      const { topicsApi } = await import('@/api/pubsub')
      const response = await topicsApi.publishMessages('my-project', 'my-topic', {
        messages: [{ data: 'SGVsbG8=' }]
      })
      
      expect(response.messageIds).toContain('123')
    })

    it('publishes single message', async () => {
      mockPost.mockResolvedValue({ data: { messageIds: ['456'] } })

      const { topicsApi } = await import('@/api/pubsub')
      const response = await topicsApi.publishMessage('my-project', 'my-topic', {
        data: 'SGVsbG8=',
        attributes: { key: 'value' }
      })
      
      expect(response.messageIds).toContain('456')
    })

    it('updates topic (simulated)', async () => {
      const { topicsApi } = await import('@/api/pubsub')
      const topic = await topicsApi.updateTopic('my-project', 'my-topic', {
        labels: { env: 'test' }
      })
      
      expect(topic.labels).toEqual({ env: 'test' })
      expect(topic.name).toBe('projects/my-project/topics/my-topic')
    })
  })

  describe('subscriptionsApi', () => {
    it('gets subscriptions for project', async () => {
      mockGet.mockResolvedValue({ 
        data: { subscriptions: [{ name: 'sub1' }] } 
      })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const subs = await subscriptionsApi.getSubscriptions('my-project')
      
      expect(subs).toHaveLength(1)
    })

    it('handles array response format', async () => {
      mockGet.mockResolvedValue({ 
        data: [{ name: 'sub1' }] 
      })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const subs = await subscriptionsApi.getSubscriptions('my-project')
      
      expect(subs).toHaveLength(1)
    })

    it('returns empty array for no subscriptions', async () => {
      mockGet.mockResolvedValue({ data: {} })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const subs = await subscriptionsApi.getSubscriptions('my-project')
      
      expect(subs).toEqual([])
    })

    it('gets subscriptions by topic', async () => {
      mockGet.mockResolvedValue({ 
        data: { subscriptions: [{ name: 'sub1' }] } 
      })

      const { subscriptionsApi } = await import('@/api/pubsub')
      await subscriptionsApi.getSubscriptionsByTopic('my-project', 'my-topic')
      
      expect(mockGet).toHaveBeenCalledWith('/v1/projects/my-project/topics/my-topic/subscriptions')
    })

    it('creates subscription with full topic path', async () => {
      mockPut.mockResolvedValue({ data: {} })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const sub = await subscriptionsApi.createSubscription('my-project', {
        name: 'my-sub',
        topic: 'my-topic'
      })
      
      expect(mockPut).toHaveBeenCalled()
      expect(sub.name).toBe('projects/my-project/subscriptions/my-sub')
    })

    it('deletes subscription', async () => {
      mockDelete.mockResolvedValue({})

      const { subscriptionsApi } = await import('@/api/pubsub')
      await subscriptionsApi.deleteSubscription('my-project', 'my-sub')
      
      expect(mockDelete).toHaveBeenCalledWith('/v1/projects/my-project/subscriptions/my-sub')
    })

    it('acknowledges messages', async () => {
      mockPost.mockResolvedValue({})

      const { subscriptionsApi } = await import('@/api/pubsub')
      await subscriptionsApi.acknowledgeMessages('my-project', 'my-sub', ['ack1', 'ack2'])
      
      expect(mockPost).toHaveBeenCalledWith(
        '/v1/projects/my-project/subscriptions/my-sub:acknowledge',
        { ackIds: ['ack1', 'ack2'] }
      )
    })

    it('creates subscription with filter expression', async () => {
      mockPut.mockResolvedValue({ data: {} })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const sub = await subscriptionsApi.createSubscription('my-project', {
        name: 'filtered-sub',
        topic: 'my-topic',
        filter: 'attributes.region = "us-west"'
      })
      
      expect(mockPut).toHaveBeenCalled()
      const callArgs = mockPut.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('filter', 'attributes.region = "us-west"')
      expect(sub.filter).toBe('attributes.region = "us-west"')
    })

    it('creates subscription with complex filter expression', async () => {
      mockPut.mockResolvedValue({ data: {} })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const complexFilter = 'attributes.region = "us-west" AND attributes.priority = "high"'
      const sub = await subscriptionsApi.createSubscription('my-project', {
        name: 'complex-filtered-sub',
        topic: 'my-topic',
        filter: complexFilter
      })
      
      expect(mockPut).toHaveBeenCalled()
      const callArgs = mockPut.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('filter', complexFilter)
      expect(sub.filter).toBe(complexFilter)
    })

    it('creates subscription without filter when not provided', async () => {
      mockPut.mockResolvedValue({ data: {} })

      const { subscriptionsApi } = await import('@/api/pubsub')
      await subscriptionsApi.createSubscription('my-project', {
        name: 'no-filter-sub',
        topic: 'my-topic'
      })
      
      expect(mockPut).toHaveBeenCalled()
      const callArgs = mockPut.mock.calls[0]
      expect(callArgs[1]).not.toHaveProperty('filter')
    })

    it('preserves filter from emulator response when present', async () => {
      mockPut.mockResolvedValue({ 
        data: { 
          filter: 'attributes.environment = "production"' 
        } 
      })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const sub = await subscriptionsApi.createSubscription('my-project', {
        name: 'emulator-filter-sub',
        topic: 'my-topic'
      })
      
      expect(sub.filter).toBe('attributes.environment = "production"')
    })

    it('request filter overrides emulator response filter', async () => {
      mockPut.mockResolvedValue({ 
        data: { 
          filter: 'attributes.old = "value"' 
        } 
      })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const sub = await subscriptionsApi.createSubscription('my-project', {
        name: 'override-filter-sub',
        topic: 'my-topic',
        filter: 'attributes.new = "value"'
      })
      
      expect(sub.filter).toBe('attributes.new = "value"')
    })

    it('creates subscription with filter and other config', async () => {
      mockPut.mockResolvedValue({ data: {} })

      const { subscriptionsApi } = await import('@/api/pubsub')
      const sub = await subscriptionsApi.createSubscription('my-project', {
        name: 'full-config-sub',
        topic: 'my-topic',
        filter: 'attributes.type = "order"',
        ackDeadlineSeconds: 30,
        enableMessageOrdering: true,
        pushConfig: {
          pushEndpoint: 'https://example.com/webhook'
        }
      })
      
      expect(mockPut).toHaveBeenCalled()
      const callArgs = mockPut.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('filter', 'attributes.type = "order"')
      expect(callArgs[1]).toHaveProperty('ackDeadlineSeconds', 30)
      expect(callArgs[1]).toHaveProperty('enableMessageOrdering', true)
      expect(sub.filter).toBe('attributes.type = "order"')
      expect(sub.ackDeadlineSeconds).toBe(30)
    })
  })

  describe('schemasApi', () => {
    it('gets schemas for project', async () => {
      mockGet.mockResolvedValue({ 
        data: { schemas: [{ name: 'schema1' }] } 
      })

      const { schemasApi } = await import('@/api/pubsub')
      const schemas = await schemasApi.getSchemas('my-project')
      
      expect(schemas).toHaveLength(1)
    })

    it('returns empty array when no schemas', async () => {
      mockGet.mockResolvedValue({ data: {} })

      const { schemasApi } = await import('@/api/pubsub')
      const schemas = await schemasApi.getSchemas('my-project')
      
      expect(schemas).toEqual([])
    })

    it('creates schema', async () => {
      mockPost.mockResolvedValue({ data: { name: 'new-schema' } })

      const { schemasApi } = await import('@/api/pubsub')
      const schema = await schemasApi.createSchema('my-project', {
        name: 'my-schema',
        type: 'AVRO',
        definition: '{}'
      })
      
      expect(schema.name).toBe('new-schema')
    })

    it('deletes schema', async () => {
      mockDelete.mockResolvedValue({})

      const { schemasApi } = await import('@/api/pubsub')
      await schemasApi.deleteSchema('my-project', 'my-schema')
      
      expect(mockDelete).toHaveBeenCalledWith('/v1/projects/my-project/schemas/my-schema')
    })

    it('validates message against schema', async () => {
      mockPost.mockResolvedValue({ data: { valid: true } })

      const { schemasApi } = await import('@/api/pubsub')
      const result = await schemasApi.validateMessage('my-project', 'my-schema', { data: 'test' })
      
      expect(result.valid).toBe(true)
    })
  })

  describe('healthApi', () => {
    it('returns health status', async () => {
      mockGet.mockResolvedValue({})

      const { healthApi } = await import('@/api/pubsub')
      const status = await healthApi.getHealthStatus()
      
      expect(status.status).toBe('healthy')
    })

    it('gets system info', async () => {
      mockGet.mockResolvedValue({ data: { version: '1.0' } })

      const { healthApi } = await import('@/api/pubsub')
      const info = await healthApi.getSystemInfo()
      
      expect(info.version).toBe('1.0')
    })
  })

  describe('monitoringApi', () => {
    it('gets dashboard metrics', async () => {
      mockGet.mockResolvedValue({ data: { messageCount: 100 } })

      const { monitoringApi } = await import('@/api/pubsub')
      const metrics = await monitoringApi.getDashboardMetrics('my-project')
      
      expect(metrics.messageCount).toBe(100)
    })

    it('gets topic metrics with filters', async () => {
      mockGet.mockResolvedValue({ data: {} })

      const { monitoringApi } = await import('@/api/pubsub')
      await monitoringApi.getTopicMetrics('my-project', 'my-topic', '1h')
      
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('topic=my-topic')
      )
    })

    it('gets subscription metrics with filters', async () => {
      mockGet.mockResolvedValue({ data: {} })

      const { monitoringApi } = await import('@/api/pubsub')
      await monitoringApi.getSubscriptionMetrics('my-project', 'my-sub', '24h')
      
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('subscription=my-sub')
      )
    })
  })

  describe('configApi', () => {
    it('sets current host', async () => {
      mockPost.mockResolvedValue({})

      const { configApi } = await import('@/api/pubsub')
      await configApi.setCurrentHost('localhost:8085')
      
      expect(mockPost).toHaveBeenCalledWith('/v1/config/host', { host: 'localhost:8085' })
    })

    it('gets current host', async () => {
      mockGet.mockResolvedValue({ data: { host: 'localhost:8085' } })

      const { configApi } = await import('@/api/pubsub')
      const result = await configApi.getCurrentHost()
      
      expect(result.host).toBe('localhost:8085')
    })
  })

  describe('bulkApi', () => {
    it('bulk creates topics', async () => {
      mockPost.mockResolvedValue({ data: { results: [], errors: [] } })

      const { bulkApi } = await import('@/api/pubsub')
      const result = await bulkApi.bulkCreateTopics('my-project', [
        { name: 'topic1' },
        { name: 'topic2' }
      ])
      
      expect(result.results).toBeDefined()
      expect(result.errors).toBeDefined()
    })

    it('bulk deletes topics', async () => {
      mockPost.mockResolvedValue({ data: { success: ['topic1'], errors: [] } })

      const { bulkApi } = await import('@/api/pubsub')
      const result = await bulkApi.bulkDeleteTopics('my-project', ['topic1', 'topic2'])
      
      expect(result.success).toContain('topic1')
    })

    it('bulk creates subscriptions', async () => {
      mockPost.mockResolvedValue({ data: { results: [], errors: [] } })

      const { bulkApi } = await import('@/api/pubsub')
      const result = await bulkApi.bulkCreateSubscriptions('my-project', [
        { name: 'sub1', topic: 'topic1' }
      ])
      
      expect(result.results).toBeDefined()
    })

    it('bulk deletes subscriptions', async () => {
      mockPost.mockResolvedValue({ data: { success: [], errors: [] } })

      const { bulkApi } = await import('@/api/pubsub')
      const result = await bulkApi.bulkDeleteSubscriptions('my-project', ['sub1'])
      
      expect(result.success).toBeDefined()
    })
  })
})
