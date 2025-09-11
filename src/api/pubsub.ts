/**
 * PubSub API Service
 * Handles all PubSub-related API calls to the backend service
 */

import { getApiClient } from './client'
import type {
  PubSubTopic as Topic,
  PubSubSubscription as Subscription,
  Schema,
  PublishRequest,
  PublishResponse,
  PullRequest,
  PullResponse,
  CreateTopicRequest,
  CreateSubscriptionRequest,
  CreateSchemaRequest
} from '@/types/pubsub'

const getApi = () => getApiClient()

// Projects API
export const projectsApi = {
  async getProjects(): Promise<string[]> {
    // For Pub/Sub emulator, we manage projects client-side
    const existingProjects = JSON.parse(localStorage.getItem('pubsub-projects') || '[]')

    // Validate that projects still exist in the emulator
    const validProjects: string[] = []
    const api = getApi()

    for (const projectId of existingProjects) {
      try {
        // Check if project exists by trying to list topics (should return {} or topics list)
        await api.get(`/v1/projects/${projectId}/topics`)
        validProjects.push(projectId)
      } catch (error: any) {
        // If we get a 404, the project might not exist anymore
        if (error.response?.status !== 404) {
          // For other errors (network, etc.), keep the project
          validProjects.push(projectId)
        }
        // If 404, we don't add it to validProjects (effectively removing it)
      }
    }

    // Update localStorage with only valid projects
    if (validProjects.length !== existingProjects.length) {
      localStorage.setItem('pubsub-projects', JSON.stringify(validProjects))
    }

    return validProjects
  },

  async attachProject(projectId: string): Promise<void> {
    // Simply store the project without API validation
    // Validation will happen when user actually navigates to Pub/Sub features
    const existingProjects = JSON.parse(localStorage.getItem('pubsub-projects') || '[]')
    if (!existingProjects.includes(projectId)) {
      existingProjects.push(projectId)
      localStorage.setItem('pubsub-projects', JSON.stringify(existingProjects))
    }
  },

  async removeProject(projectId: string): Promise<void> {
    const existingProjects = JSON.parse(localStorage.getItem('pubsub-projects') || '[]')
    const filteredProjects = existingProjects.filter((id: string) => id !== projectId)
    localStorage.setItem('pubsub-projects', JSON.stringify(filteredProjects))
  },

  async discoverProjects(): Promise<string[]> {
    // Try to discover projects by testing common project ID patterns
    // This is a helper method for development
    const commonPatterns = [
      'test-project',
      'demo-project',
      'pubsub-test',
      'my-project',
      'emulator-project'
    ]

    const discoveredProjects: string[] = []
    const api = getApi()

    for (const projectId of commonPatterns) {
      try {
        await api.get(`/v1/projects/${projectId}/topics`)
        discoveredProjects.push(projectId)
      } catch {
        // Project doesn't exist, continue
      }
    }

    return discoveredProjects
  }
}

// Topics API
export const topicsApi = {
  async getTopics(projectId: string): Promise<Topic[]> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/topics`)
    return response.data.topics || []
  },

  async getTopic(projectId: string, topicName: string): Promise<Topic> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/topics/${topicName}`)
    return response.data
  },

  async createTopic(projectId: string, request: CreateTopicRequest): Promise<Topic> {
    const api = getApi()
    // Use PUT with topic name in path, as per Google Cloud Pub/Sub API spec
    const topicName = request.name
    const topicPath = `projects/${projectId}/topics/${topicName}`

    // For the emulator, send an empty body as most topic properties are not supported
    // The topic is created with just the name from the URL path
    const response = await api.put(`/v1/${topicPath}`, {})

    // Enhance the response with the data we sent (emulator response is minimal)
    const enhancedTopic = {
      ...response.data,
      name: topicPath,
      labels: request.labels || {},
      messageRetentionDuration: request.messageRetentionDuration || '7d',
      schemaSettings: request.schemaSettings,
      createdAt: new Date().toISOString(),
      messageCount: 0,
      subscriptionsCount: 0
    }

    return enhancedTopic
  },

  async updateTopic(projectId: string, topicName: string, updateData: Partial<Topic>): Promise<Topic> {
    const topicPath = `projects/${projectId}/topics/${topicName}`

    // For the emulator, we can't actually update topic properties, but we'll simulate it
    // by returning the enhanced topic data with our updates
    const enhancedTopic: Topic = {
      id: `${projectId}-${topicName}-updated`,
      name: topicPath,
      fullName: topicPath,
      projectId,
      createdAt: updateData.createdAt || new Date(),
      updatedAt: new Date(),
      labels: updateData.labels || {},
      messageRetentionDuration: updateData.messageRetentionDuration || '7d',
      messageCount: updateData.messageCount || 0,
      subscriptionsCount: updateData.subscriptionsCount || 0,
      ...(updateData.schemaSettings && { schemaSettings: updateData.schemaSettings })
    }

    return enhancedTopic
  },

  async deleteTopic(projectId: string, topicName: string): Promise<void> {
    const api = getApi()
    await api.delete(`/v1/projects/${projectId}/topics/${topicName}`)
  },

  async publishMessages(projectId: string, topicName: string, request: PublishRequest): Promise<PublishResponse> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/topics/${topicName}:publish`, request)
    return response.data
  },

  async publishMessage(projectId: string, topicName: string, message: { data: string, attributes?: Record<string, string> }): Promise<PublishResponse> {
    const api = getApi()
    const request: PublishRequest = {
      messages: [message]
    }
    const response = await api.post(`/v1/projects/${projectId}/topics/${topicName}:publish`, request)
    return response.data
  },

  async getTopicMetrics(projectId: string, topicName: string): Promise<any> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/topics/${topicName}/metrics`)
    return response.data
  }
}

// Subscriptions API
export const subscriptionsApi = {
  async getSubscriptions(projectId: string): Promise<Subscription[]> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/subscriptions`)

    // Ensure we always return an array
    let subscriptions = []
    if (response.data && Array.isArray(response.data.subscriptions)) {
      subscriptions = response.data.subscriptions
    } else if (response.data && Array.isArray(response.data)) {
      subscriptions = response.data
    }

    return subscriptions
  },

  async getSubscriptionsByTopic(projectId: string, topicName: string): Promise<Subscription[]> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/topics/${topicName}/subscriptions`)
    return response.data.subscriptions || []
  },

  async getSubscription(projectId: string, subscriptionName: string): Promise<Subscription> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/subscriptions/${subscriptionName}`)
    return response.data
  },

  async createSubscription(projectId: string, request: CreateSubscriptionRequest): Promise<Subscription> {
    const api = getApi()
    // Use PUT with subscription name in path, as per Google Cloud Pub/Sub API spec
    const subscriptionName = request.name
    const subscriptionPath = `projects/${projectId}/subscriptions/${subscriptionName}`

    // Remove name from request body as it's in the URL
    const subscriptionData = { ...request }
    delete subscriptionData.name

    const response = await api.put(`/v1/${subscriptionPath}`, subscriptionData)

    // Enhance the response with the data we sent (emulator response is minimal)
    const enhancedSubscription = {
      ...response.data,
      id: `${projectId}-${subscriptionName}-${Date.now()}`,
      name: subscriptionPath,
      fullName: subscriptionPath,
      projectId,
      topicName: request.topic || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ackDeadlineSeconds: request.ackDeadlineSeconds || 60,
      retainAckedMessages: request.retainAckedMessages || false,
      messageRetentionDuration: request.messageRetentionDuration || '604800s',
      enableMessageOrdering: request.enableMessageOrdering || false,
      detached: false,
      labels: request.labels || {},
      pushConfig: request.pushConfig,
      bigqueryConfig: request.bigqueryConfig,
      deadLetterPolicy: request.deadLetterPolicy,
      retryPolicy: request.retryPolicy,
      messageCount: 0,
      undeliveredMessageCount: 0
    }

    return enhancedSubscription
  },

  async updateSubscription(projectId: string, subscriptionName: string, updateData: any): Promise<Subscription> {
    const api = getApi()
    const subscriptionPath = `projects/${projectId}/subscriptions/${subscriptionName}`

    // Try PUT first as emulator might not support PATCH
    try {
      const response = await api.put(`/v1/${subscriptionPath}`, updateData)
      return response.data
    } catch (error: any) {
      // If PUT fails, try PATCH
      if (error.response?.status === 405) {
        const response = await api.patch(`/v1/${subscriptionPath}`, updateData)
        return response.data
      }
      throw error
    }
  },
  async deleteSubscription(projectId: string, subscriptionName: string): Promise<void> {
    const api = getApi()
    await api.delete(`/v1/projects/${projectId}/subscriptions/${subscriptionName}`)
  },

  async pullMessages(projectId: string, subscriptionName: string, request: PullRequest): Promise<PullResponse> {
    // Use long-running request client for pull operations (5 minute timeout)
    const { createLongRunningRequest } = await import('./client')
    const longRunningApi = createLongRunningRequest(300000) // 5 minutes
    const response = await longRunningApi.post(`/v1/projects/${projectId}/subscriptions/${subscriptionName}:pull`, request)
    return response.data
  },

  async acknowledgeMessages(projectId: string, subscriptionName: string, ackIds: string[]): Promise<void> {
    const api = getApi()
    await api.post(`/v1/projects/${projectId}/subscriptions/${subscriptionName}:acknowledge`, {
      ackIds
    })
  },

  async getSubscriptionMetrics(projectId: string, subscriptionName: string): Promise<any> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/subscriptions/${subscriptionName}/metrics`)
    return response.data
  }
}

// Schemas API
export const schemasApi = {
  async getSchemas(projectId: string): Promise<Schema[]> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/schemas`)
    return response.data.schemas || []
  },

  async getSchema(projectId: string, schemaName: string): Promise<Schema> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/schemas/${schemaName}`)
    return response.data
  },

  async createSchema(projectId: string, request: CreateSchemaRequest): Promise<Schema> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/schemas`, request)
    return response.data
  },

  async deleteSchema(projectId: string, schemaName: string): Promise<void> {
    const api = getApi()
    await api.delete(`/v1/projects/${projectId}/schemas/${schemaName}`)
  },

  async validateMessage(projectId: string, schemaName: string, message: any): Promise<{ valid: boolean, errors?: string[] }> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/schemas/${schemaName}:validate`, {
      message
    })
    return response.data
  }
}

// Monitoring & Metrics API
export const monitoringApi = {
  async getDashboardMetrics(projectId: string): Promise<any> {
    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/metrics/dashboard`)
    return response.data
  },

  async getTopicMetrics(projectId: string, topicName?: string, timeRange?: string): Promise<any> {
    const params = new URLSearchParams()
    if (topicName) params.append('topic', topicName)
    if (timeRange) params.append('timeRange', timeRange)

    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/metrics/topics?${params}`)
    return response.data
  },

  async getSubscriptionMetrics(projectId: string, subscriptionName?: string, timeRange?: string): Promise<any> {
    const params = new URLSearchParams()
    if (subscriptionName) params.append('subscription', subscriptionName)
    if (timeRange) params.append('timeRange', timeRange)

    const api = getApi()
    const response = await api.get(`/v1/projects/${projectId}/metrics/subscriptions?${params}`)
    return response.data
  }
}

// Health & Status API
export const healthApi = {
  async getHealthStatus(): Promise<{ status: string, uptime: number }> {
    const api = getApi()
    await api.get('/')
    return { status: 'healthy', uptime: Date.now() }
  },

  async getSystemInfo(): Promise<any> {
    const api = getApi()
    const response = await api.get('/v1/system/info')
    return response.data
  }
}

// Configuration API
export const configApi = {
  async setCurrentHost(host: string): Promise<void> {
    const api = getApi()
    await api.post('/v1/config/host', { host })
  },

  async getCurrentHost(): Promise<{ host: string }> {
    const api = getApi()
    const response = await api.get('/v1/config/host')
    return response.data
  }
}

// Bulk operations API
export const bulkApi = {
  async bulkCreateTopics(projectId: string, topics: CreateTopicRequest[]): Promise<{ results: Topic[], errors: any[] }> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/topics:batchCreate`, { topics })
    return response.data
  },

  async bulkDeleteTopics(projectId: string, topicNames: string[]): Promise<{ success: string[], errors: any[] }> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/topics:batchDelete`, { topicNames })
    return response.data
  },

  async bulkCreateSubscriptions(projectId: string, subscriptions: CreateSubscriptionRequest[]): Promise<{ results: Subscription[], errors: any[] }> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/subscriptions:batchCreate`, { subscriptions })
    return response.data
  },

  async bulkDeleteSubscriptions(projectId: string, subscriptionNames: string[]): Promise<{ success: string[], errors: any[] }> {
    const api = getApi()
    const response = await api.post(`/v1/projects/${projectId}/subscriptions:batchDelete`, { subscriptionNames })
    return response.data
  }
}

// Export all API modules
export const pubsubApi = {
  projects: projectsApi,
  topics: topicsApi,
  subscriptions: subscriptionsApi,
  schemas: schemasApi,
  monitoring: monitoringApi,
  health: healthApi,
  config: configApi,
  bulk: bulkApi
}

export default pubsubApi