/**
 * Datastore API client for Datastore emulator integration
 */

import axios from 'axios'
import type {
  DatastoreEntity,
  DatastoreKey,
  LookupRequest,
  LookupResponse,
  RunQueryRequest,
  RunQueryResponse,
  CommitRequest,
  CommitResponse,
  BeginTransactionRequest,
  BeginTransactionResponse,
  RollbackRequest,
  AllocateIdsRequest,
  AllocateIdsResponse,
  ListKindsResponse,
  ListNamespacesResponse,
} from '@/types'

const datastoreClient = axios.create({
  baseURL: import.meta.env.VITE_DATASTORE_BASE_URL || '/datastore',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const datastoreApi = {
  // Lookup entities by keys
  async lookup(request: LookupRequest): Promise<LookupResponse> {
    const response = await datastoreClient.post('/v1/projects/{projectId}:lookup', request)
    return response.data
  },

  // Run a query
  async runQuery(projectId: string, request: RunQueryRequest): Promise<RunQueryResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)
    return response.data
  },

  // Commit mutations (insert, update, upsert, delete)
  async commit(projectId: string, request: CommitRequest): Promise<CommitResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return response.data
  },

  // Begin a transaction
  async beginTransaction(projectId: string, request: BeginTransactionRequest): Promise<BeginTransactionResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:beginTransaction`, request)
    return response.data
  },

  // Rollback a transaction
  async rollback(projectId: string, request: RollbackRequest): Promise<void> {
    await datastoreClient.post(`/v1/projects/${projectId}:rollback`, request)
  },

  // Allocate IDs
  async allocateIds(projectId: string, request: AllocateIdsRequest): Promise<AllocateIdsResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:allocateIds`, request)
    return response.data
  },

  // List all kinds (entity types) in a project
  async listKinds(projectId: string, namespaceId?: string): Promise<string[]> {
    try {
      // Query for __kind__ entities which contain all kinds
      const request: RunQueryRequest = {
        partitionId: {
          projectId,
          namespaceId: namespaceId || ''
        },
        query: {
          kind: [{ name: '__kind__' }]
        }
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      // Extract kind names from the results
      const kinds = new Set<string>()
      if (response.data.batch?.entityResults) {
        response.data.batch.entityResults.forEach((result: any) => {
          const entity = result.entity
          if (entity?.key?.path?.[0]?.name) {
            kinds.add(entity.key.path[0].name)
          }
        })
      }

      return Array.from(kinds).sort()
    } catch (error) {
      console.warn('Failed to list kinds:', error)
      return []
    }
  },

  // List all databases in a project
  async listDatabases(projectId: string): Promise<string[]> {
    try {
      // For emulator, we typically have the default database (empty string ID)
      // In production, you'd query the Admin API
      // The default database has database ID of empty string ""
      // which maps to projects/{project}/databases/ in the API
      return ['']
    } catch (error) {
      console.warn('Failed to list databases:', error)
      return ['']
    }
  },

  // List all namespaces in a project
  async listNamespaces(projectId: string, databaseId?: string): Promise<string[]> {
    try {
      // Query for __namespace__ entities which contain all namespaces
      const request: RunQueryRequest = {
        partitionId: {
          projectId
        },
        query: {
          kind: [{ name: '__namespace__' }]
        }
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      // Extract namespace names from the results
      const namespaces = new Set<string>()
      namespaces.add('') // Default namespace always exists

      if (response.data.batch?.entityResults) {
        response.data.batch.entityResults.forEach((result: any) => {
          const entity = result.entity
          if (entity?.key?.path?.[0]?.name) {
            namespaces.add(entity.key.path[0].name)
          }
        })
      }

      return Array.from(namespaces).sort()
    } catch (error) {
      console.warn('Failed to list namespaces:', error)
      return ['']
    }
  },

  // Get entities by kind
  async getEntitiesByKind(
    projectId: string,
    kind: string,
    namespaceId?: string,
    limit?: number,
    offset?: number
  ): Promise<DatastoreEntity[]> {
    try {
      const request: RunQueryRequest = {
        partitionId: {
          projectId,
          namespaceId: namespaceId || ''
        },
        query: {
          kind: [{ name: kind }],
          limit,
          offset
        }
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      if (response.data.batch?.entityResults) {
        return response.data.batch.entityResults.map((result: any) => result.entity)
      }

      return []
    } catch (error) {
      console.error('Failed to get entities by kind:', error)
      return []
    }
  },

  // Get a single entity by key
  async getEntity(projectId: string, key: DatastoreKey): Promise<DatastoreEntity | null> {
    try {
      const request: LookupRequest = {
        keys: [key]
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:lookup`, request)

      if (response.data.found && response.data.found.length > 0) {
        return response.data.found[0].entity
      }

      return null
    } catch (error) {
      console.error('Failed to get entity:', error)
      return null
    }
  },

  // Create an entity
  async createEntity(projectId: string, entity: DatastoreEntity): Promise<DatastoreEntity> {
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          insert: entity
        }
      ]
    }

    const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)

    // Return the entity with the generated key if applicable
    if (response.data.mutationResults?.[0]?.key) {
      return {
        ...entity,
        key: response.data.mutationResults[0].key
      }
    }

    return entity
  },

  // Update an entity
  async updateEntity(projectId: string, entity: DatastoreEntity): Promise<DatastoreEntity> {
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          update: entity
        }
      ]
    }

    await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return entity
  },

  // Upsert an entity (insert or update)
  async upsertEntity(projectId: string, entity: DatastoreEntity): Promise<DatastoreEntity> {
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          upsert: entity
        }
      ]
    }

    await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return entity
  },

  // Delete an entity
  async deleteEntity(projectId: string, key: DatastoreKey): Promise<void> {
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          delete: key
        }
      ]
    }

    await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
  },

  // Delete all entities of a kind
  async deleteKind(projectId: string, kind: string, namespaceId?: string): Promise<void> {
    try {
      // Get all entities of this kind
      const entities = await this.getEntitiesByKind(projectId, kind, namespaceId)

      if (entities.length === 0) {
        return
      }

      // Delete all entities in batches
      const batchSize = 500 // Datastore limit
      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize)
        const request: CommitRequest = {
          mode: 'NON_TRANSACTIONAL',
          mutations: batch.map(entity => ({
            delete: entity.key
          }))
        }

        await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
      }
    } catch (error) {
      console.error('Failed to delete kind:', error)
      throw error
    }
  },

  // Health check
  async healthCheck(projectId?: string): Promise<boolean> {
    try {
      const project = projectId || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project'

      // Try to list kinds as a health check
      await this.listKinds(project)
      return true
    } catch {
      return false
    }
  },

  // Export entities
  async exportEntities(projectId: string, outputUrlPrefix: string, kinds?: string[], namespaceIds?: string[]): Promise<any> {
    const request = {
      outputUrlPrefix,
      entityFilter: {
        kinds,
        namespaceIds
      }
    }

    const response = await datastoreClient.post(`/v1/projects/${projectId}:export`, request)
    return response.data
  },

  // Import entities
  async importEntities(projectId: string, inputUrl: string, kinds?: string[], namespaceIds?: string[]): Promise<any> {
    const request = {
      inputUrl,
      entityFilter: {
        kinds,
        namespaceIds
      }
    }

    const response = await datastoreClient.post(`/v1/projects/${projectId}:import`, request)
    return response.data
  },

  // Helper to create a key
  createKey(projectId: string, kind: string, id?: string | number, namespaceId?: string): DatastoreKey {
    return {
      partitionId: {
        projectId,
        namespaceId: namespaceId || ''
      },
      path: [
        {
          kind,
          ...(typeof id === 'string' ? { name: id } : { id: id?.toString() })
        }
      ]
    }
  },

  // Helper to extract ID from key
  getKeyId(key: DatastoreKey): string {
    const lastElement = key.path[key.path.length - 1]
    return lastElement.name || lastElement.id || ''
  },

  // Helper to extract kind from key
  getKeyKind(key: DatastoreKey): string {
    const lastElement = key.path[key.path.length - 1]
    return lastElement.kind
  }
}

export default datastoreApi
