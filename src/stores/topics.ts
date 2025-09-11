/**
 * Topics store
 * Manages Pub/Sub topics state, CRUD operations, and metrics
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PubSubTopic,
  TopicMetrics,
  CreateTopicForm,
  SearchFilters,
  PaginationOptions,
  BaseStoreState,
  BatchOperation
} from '@/types'
import { useProjectsStore } from './projects'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'

export const useTopicsStore = defineStore('topics', () => {
  const projectsStore = useProjectsStore()

  // State
  const state = ref<BaseStoreState>({
    state: 'idle',
    error: null,
    lastUpdated: null
  })

  const topics = ref<PubSubTopic[]>([])
  const selectedTopic = ref<PubSubTopic | null>(null)
  const topicMetrics = ref<Map<string, TopicMetrics>>(new Map())

  const filters = ref<SearchFilters>({
    projectId: '',
    namePattern: '',
    labels: {},
    states: [],
    dateRange: undefined
  })

  const pagination = ref<PaginationOptions>({
    pageSize: 50,
    pageToken: undefined,
    orderBy: 'name',
    filter: ''
  })

  const batchOperations = ref<Map<string, BatchOperation<any>>>(new Map())
  const realtimeUpdates = ref<boolean>(true)

  // Cache
  const topicCache = ref<Map<string, PubSubTopic>>(new Map())

  // Getters
  const currentProjectTopics = computed(() => {
    if (!projectsStore.selectedProject) return []
    return topics.value.filter(topic => topic.projectId === projectsStore.selectedProject!.projectId)
  })

  const filteredTopics = computed(() => {
    let filtered = [...currentProjectTopics.value]

    // Apply name filter
    if (filters.value.namePattern) {
      const pattern = filters.value.namePattern.toLowerCase()
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(pattern) ||
        topic.fullName.toLowerCase().includes(pattern)
      )
    }

    // Apply label filters
    if (filters.value.labels && Object.keys(filters.value.labels).length > 0) {
      filtered = filtered.filter(topic => {
        if (!topic.labels) return false
        return Object.entries(filters.value.labels!).every(([key, value]) =>
          topic.labels![key] === value
        )
      })
    }

    // Apply state filter
    if (filters.value.states && filters.value.states.length > 0) {
      filtered = filtered.filter(topic =>
        topic.state && filters.value.states!.includes(topic.state)
      )
    }

    // Apply date range filter
    if (filters.value.dateRange) {
      filtered = filtered.filter(topic => {
        const createdAt = new Date(topic.createdAt)
        return createdAt >= filters.value.dateRange!.start &&
          createdAt <= filters.value.dateRange!.end
      })
    }

    return filtered
  })

  const topicStats = computed(() => ({
    total: currentProjectTopics.value.length,
    active: currentProjectTopics.value.filter(t => t.state === 'ACTIVE').length,
    withSchema: currentProjectTopics.value.filter(t => t.schemaSettings).length,
    withKms: currentProjectTopics.value.filter(t => t.kmsKeyName).length,
    totalMessages: currentProjectTopics.value.reduce((sum, t) => sum + (t.messageCount || 0), 0),
    totalSubscriptions: currentProjectTopics.value.reduce((sum, t) => sum + (t.subscriptionsCount || 0), 0)
  }))

  const isLoading = computed(() => state.value.state === 'loading')
  const hasError = computed(() => state.value.state === 'error')

  const activeBatchOperations = computed(() =>
    Array.from(batchOperations.value.values()).filter(op =>
      op.status === 'PENDING' || op.status === 'RUNNING'
    )
  )

  // Actions
  async function fetchTopics(projectId?: string, options: Partial<PaginationOptions> = {}) {
    try {
      state.value.state = 'loading'
      state.value.error = null

      const targetProjectId = projectId || projectsStore.selectedProject?.projectId
      if (!targetProjectId) {
        throw new Error('No project selected')
      }

      // Merge pagination options
      Object.assign(pagination.value, options)

      // Use real API call
      const apiTopics = await topicsApi.getTopics(targetProjectId)
      
      // Transform API topics to ensure they have the correct projectId
      const transformedTopics: PubSubTopic[] = apiTopics.map(topic => {
        // Ensure projectId is set correctly
        const projectId = topic.projectId || targetProjectId
        
        // Extract topic name from full name if needed
        let topicName = topic.name
        if (topic.name && topic.name.includes('/topics/')) {
          topicName = topic.name.split('/topics/')[1]
        }
        
        return {
          ...topic,
          projectId,
          name: topicName,
          fullName: topic.name || `projects/${projectId}/topics/${topicName}`,
          id: topic.id || `${projectId}-${topicName}`,
          createdAt: topic.createdAt || new Date(),
          updatedAt: topic.updatedAt || new Date(),
          state: topic.state || 'ACTIVE',
          messageCount: topic.messageCount || 0,
          subscriptionsCount: topic.subscriptionsCount || 0
        }
      })

      // Update topics for this project
      topics.value = topics.value.filter(t => t.projectId !== targetProjectId)
      topics.value.push(...transformedTopics)

      // Update cache
      transformedTopics.forEach(topic => {
        topicCache.value.set(topic.fullName, topic)
      })

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function fetchTopic(topicName: string, projectId?: string): Promise<PubSubTopic | null> {
    try {
      const targetProjectId = projectId || projectsStore.selectedProject?.projectId
      if (!targetProjectId) {
        throw new Error('No project selected')
      }

      const fullName = topicName.startsWith('projects/')
        ? topicName
        : `projects/${targetProjectId}/topics/${topicName}`

      // Check cache first
      if (topicCache.value.has(fullName)) {
        return topicCache.value.get(fullName)!
      }

      state.value.state = 'loading'
      state.value.error = null

      // TODO: Replace with actual API call
      const mockTopic: PubSubTopic = {
        id: `${targetProjectId}-${topicName}`,
        name: topicName,
        fullName,
        projectId: targetProjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        labels: {},
        state: 'ACTIVE',
        messageCount: Math.floor(Math.random() * 10000),
        subscriptionsCount: Math.floor(Math.random() * 10)
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400))

      // Update cache
      topicCache.value.set(fullName, mockTopic)

      // Update topics list
      const existingIndex = topics.value.findIndex(t => t.fullName === fullName)
      if (existingIndex === -1) {
        topics.value.push(mockTopic)
      } else {
        topics.value[existingIndex] = mockTopic
      }

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return mockTopic

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function createTopic(topicData: CreateTopicForm): Promise<PubSubTopic> {
    try {
      state.value.state = 'loading'
      state.value.error = null

      const fullName = `projects/${topicData.projectId}/topics/${topicData.name}`

      // Check if topic already exists
      if (topics.value.some(t => t.fullName === fullName)) {
        throw new Error(`Topic ${topicData.name} already exists`)
      }

      // TODO: Replace with actual API call
      const newTopic: PubSubTopic = {
        id: `${topicData.projectId}-${topicData.name}-${Date.now()}`,
        name: topicData.name,
        fullName,
        projectId: topicData.projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        labels: topicData.labels || {},
        messageStoragePolicy: topicData.messageStoragePolicy,
        kmsKeyName: topicData.kmsKeyName,
        schemaSettings: topicData.schemaSettings,
        state: 'ACTIVE',
        messageCount: 0,
        subscriptionsCount: 0
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Add to state
      topics.value.push(newTopic)
      topicCache.value.set(fullName, newTopic)

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return newTopic

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function updateTopic(topicName: string, updates: Partial<PubSubTopic>, projectId?: string): Promise<PubSubTopic> {
    try {
      const targetProjectId = projectId || projectsStore.selectedProject?.projectId
      if (!targetProjectId) {
        throw new Error('No project selected')
      }

      const fullName = topicName.startsWith('projects/')
        ? topicName
        : `projects/${targetProjectId}/topics/${topicName}`

      state.value.state = 'loading'
      state.value.error = null

      // Find existing topic
      const existingIndex = topics.value.findIndex(t => t.fullName === fullName)
      if (existingIndex === -1) {
        throw new Error(`Topic ${topicName} not found`)
      }

      // TODO: Replace with actual API call
      const updatedTopic: PubSubTopic = {
        ...topics.value[existingIndex],
        ...updates,
        updatedAt: new Date()
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600))

      // Update state
      topics.value[existingIndex] = updatedTopic
      topicCache.value.set(fullName, updatedTopic)

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return updatedTopic

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function deleteTopic(topicName: string, projectId?: string): Promise<void> {
    try {
      const targetProjectId = projectId || projectsStore.selectedProject?.projectId
      if (!targetProjectId) {
        throw new Error('No project selected')
      }

      const fullName = topicName.startsWith('projects/')
        ? topicName
        : `projects/${targetProjectId}/topics/${topicName}`

      state.value.state = 'loading'
      state.value.error = null

      // First, delete all related subscriptions
      const simpleName = topicName.replace(/^projects\/[^/]+\/topics\//, '')
      try {
        // Get all subscriptions first, then filter by topic
        // This is more reliable than using getSubscriptionsByTopic which might not work in emulator
        const allSubscriptions = await subscriptionsApi.getSubscriptions(targetProjectId)
        const relatedSubscriptions = allSubscriptions.filter(subscription => {
          // Check both topic and topicName properties since API might return either format
          const subTopicName = subscription.topicName || (subscription as any).topic?.replace(/^projects\/[^/]+\/topics\//, '')
          const subTopicFullName = subscription.topicName || (subscription as any).topic

          return subTopicName === simpleName ||
            subTopicFullName === `projects/${targetProjectId}/topics/${simpleName}` ||
            (subscription as any).topic === `projects/${targetProjectId}/topics/${simpleName}`
        })

        // Also find and delete orphaned subscriptions that have "_deleted-topic_" as their topic
        // This handles cases where emulator sets topic to "_deleted-topic_" instead of cascading delete
        const orphanedSubscriptions = allSubscriptions.filter(subscription => {
          const subTopic = (subscription as any).topic || subscription.topicName
          return subTopic === '_deleted-topic_'
        })

        const allSubscriptionsToDelete = [...relatedSubscriptions, ...orphanedSubscriptions]
        const uniqueSubscriptionsToDelete = allSubscriptionsToDelete.filter((sub, index, arr) =>
          index === arr.findIndex(s => s.name === sub.name)
        )

        for (const subscription of uniqueSubscriptionsToDelete) {
          const subName = subscription.name.replace(/^projects\/[^/]+\/subscriptions\//, '')
          try {
            await subscriptionsApi.deleteSubscription(targetProjectId, subName)
          } catch (subError) {
            console.warn(`Failed to delete subscription ${subName}:`, subError)
            // Continue deleting other subscriptions even if one fails
          }
        }
      } catch (error) {
        console.warn('Failed to delete related subscriptions:', error)
        // Continue with topic deletion even if subscription deletion fails
      }

      // Then delete the topic
      await topicsApi.deleteTopic(targetProjectId, simpleName)

      // Remove from state
      const index = topics.value.findIndex(t => t.fullName === fullName)
      if (index > -1) {
        topics.value.splice(index, 1)
      }

      topicCache.value.delete(fullName)
      topicMetrics.value.delete(fullName)

      // Clear selection if deleted topic was selected
      if (selectedTopic.value?.fullName === fullName) {
        selectedTopic.value = null
      }

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function fetchTopicMetrics(topicName: string, projectId?: string, timeRange?: { start: Date; end: Date }): Promise<TopicMetrics> {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) {
      throw new Error('No project selected')
    }

    const fullName = topicName.startsWith('projects/')
      ? topicName
      : `projects/${targetProjectId}/topics/${topicName}`

    // TODO: Replace with actual API call
    const mockMetrics: TopicMetrics = {
      messageCount: generateMockMetrics(50, timeRange),
      messageBytes: generateMockMetrics(1024, timeRange),
      publishMessageCount: generateMockMetrics(30, timeRange),
      publishedMessageBytes: generateMockMetrics(512, timeRange),
      publishRequestCount: generateMockMetrics(20, timeRange)
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    topicMetrics.value.set(fullName, mockMetrics)

    return mockMetrics
  }

  async function createBatchTopics(topics: CreateTopicForm[]): Promise<string> {
    const batchId = `batch-create-topics-${Date.now()}`

    const operation: BatchOperation<CreateTopicForm> = {
      id: batchId,
      type: 'CREATE_TOPICS',
      status: 'PENDING',
      items: topics,
      progress: 0,
      errors: [],
      createdAt: new Date()
    }

    batchOperations.value.set(batchId, operation)

    // Simulate batch processing
    setTimeout(async () => {
      operation.status = 'RUNNING'

      for (let i = 0; i < topics.length; i++) {
        try {
          await createTopic(topics[i])
          operation.progress = ((i + 1) / topics.length) * 100
        } catch (error) {
          operation.errors.push({
            code: 500,
            message: (error as Error).message,
            details: [topics[i]],
            timestamp: new Date()
          })
        }
      }

      operation.status = operation.errors.length > 0 ? 'FAILED' : 'COMPLETED'
      operation.completedAt = new Date()
    }, 1000)

    return batchId
  }

  async function deleteBatchTopics(topicNames: string[], projectId?: string): Promise<string> {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) {
      throw new Error('No project selected')
    }

    const batchId = `batch-delete-topics-${Date.now()}`

    const operation: BatchOperation<string> = {
      id: batchId,
      type: 'DELETE_TOPICS',
      status: 'PENDING',
      items: topicNames,
      progress: 0,
      errors: [],
      createdAt: new Date()
    }

    batchOperations.value.set(batchId, operation)

    // Simulate batch processing
    setTimeout(async () => {
      operation.status = 'RUNNING'

      for (let i = 0; i < topicNames.length; i++) {
        try {
          await deleteTopic(topicNames[i], targetProjectId)
          operation.progress = ((i + 1) / topicNames.length) * 100
        } catch (error) {
          operation.errors.push({
            code: 500,
            message: (error as Error).message,
            details: [topicNames[i]],
            timestamp: new Date()
          })
        }
      }

      operation.status = operation.errors.length > 0 ? 'FAILED' : 'COMPLETED'
      operation.completedAt = new Date()
    }, 1000)

    return batchId
  }

  function selectTopic(topic: PubSubTopic) {
    selectedTopic.value = topic

    // Fetch metrics for selected topic
    if (realtimeUpdates.value) {
      fetchTopicMetrics(topic.name, topic.projectId)
    }
  }

  function clearSelectedTopic() {
    selectedTopic.value = null
  }

  function updateFilters(newFilters: Partial<SearchFilters>) {
    Object.assign(filters.value, newFilters)
  }

  function clearFilters() {
    filters.value = {
      projectId: '',
      namePattern: '',
      labels: {},
      states: [],
      dateRange: undefined
    }
  }

  function updatePagination(options: Partial<PaginationOptions>) {
    Object.assign(pagination.value, options)
  }

  function toggleRealtimeUpdates() {
    realtimeUpdates.value = !realtimeUpdates.value
  }

  function getBatchOperation(batchId: string) {
    return batchOperations.value.get(batchId)
  }

  function clearBatchOperation(batchId: string) {
    batchOperations.value.delete(batchId)
  }

  function clearAllBatchOperations() {
    batchOperations.value.clear()
  }

  function getTopicByName(topicName: string, projectId?: string): PubSubTopic | undefined {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) return undefined

    const fullName = topicName.startsWith('projects/')
      ? topicName
      : `projects/${targetProjectId}/topics/${topicName}`

    return topics.value.find(t => t.fullName === fullName)
  }

  function getTopicMetrics(topicName: string, projectId?: string): TopicMetrics | undefined {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) return undefined

    const fullName = topicName.startsWith('projects/')
      ? topicName
      : `projects/${targetProjectId}/topics/${topicName}`

    return topicMetrics.value.get(fullName)
  }

  function clearCache() {
    topicCache.value.clear()
    topicMetrics.value.clear()
  }

  function clearProjectData(projectId: string) {
    // Remove topics for specific project
    topics.value = topics.value.filter(topic => topic.projectId !== projectId)

    // Clear cache entries for this project
    for (const [key] of topicCache.value) {
      if (key.includes(`projects/${projectId}/`)) {
        topicCache.value.delete(key)
      }
    }

    // Clear metrics for this project
    for (const [key] of topicMetrics.value) {
      if (key.includes(`projects/${projectId}/`)) {
        topicMetrics.value.delete(key)
      }
    }

    // Clear selection if it belongs to this project
    if (selectedTopic.value?.projectId === projectId) {
      selectedTopic.value = null
    }

    // Reset error state
    state.value.error = null
  }

  function reset() {
    topics.value = []
    selectedTopic.value = null
    topicMetrics.value.clear()
    filters.value = {
      projectId: '',
      namePattern: '',
      labels: {},
      states: [],
      dateRange: undefined
    }
    pagination.value = {
      pageSize: 50,
      pageToken: undefined,
      orderBy: 'name',
      filter: ''
    }
    batchOperations.value.clear()
    topicCache.value.clear()
    state.value = {
      state: 'idle',
      error: null,
      lastUpdated: null
    }
  }

  // Helper function to generate mock metrics data
  function generateMockMetrics(scale: number, timeRange?: { start: Date; end: Date }): Array<{ timestamp: Date; value: number }> {
    const now = new Date()
    const start = timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
    const end = timeRange?.end || now
    const points = 50
    const interval = (end.getTime() - start.getTime()) / points

    const metrics = []
    for (let i = 0; i <= points; i++) {
      const timestamp = new Date(start.getTime() + (i * interval))
      const baseValue = Math.floor(Math.random() * scale)
      const variation = Math.sin(i * 0.1) * (scale * 0.3) // Add some wave pattern
      const value = Math.max(0, baseValue + variation)

      metrics.push({ timestamp, value })
    }

    return metrics
  }

  return {
    // State
    state,
    topics,
    selectedTopic,
    topicMetrics,
    filters,
    pagination,
    batchOperations,
    realtimeUpdates,

    // Getters
    currentProjectTopics,
    filteredTopics,
    topicStats,
    isLoading,
    hasError,
    activeBatchOperations,

    // Actions
    fetchTopics,
    fetchTopic,
    createTopic,
    updateTopic,
    deleteTopic,
    fetchTopicMetrics,
    createBatchTopics,
    deleteBatchTopics,
    selectTopic,
    clearSelectedTopic,
    updateFilters,
    clearFilters,
    updatePagination,
    toggleRealtimeUpdates,
    getBatchOperation,
    clearBatchOperation,
    clearAllBatchOperations,
    getTopicByName,
    getTopicMetrics,
    clearCache,
    clearProjectData,
    reset
  }
})