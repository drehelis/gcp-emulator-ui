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
  RunAggregationQueryRequest,
  RunAggregationQueryResponse,
  CommitRequest,
  CommitResponse,
  BeginTransactionRequest,
  BeginTransactionResponse,
  RollbackRequest,
  AllocateIdsRequest,
  AllocateIdsResponse,
} from '@/types'

const datastoreClient = axios.create({
  baseURL: import.meta.env.VITE_DATASTORE_BASE_URL || '/datastore',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Simple in-memory cache for expensive list operations
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const CACHE_TTL = 30000 // 30 seconds TTL

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  const age = Date.now() - entry.timestamp
  if (age > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }

  Array.from(cache.keys())
    .filter(key => key.includes(pattern))
    .forEach(key => cache.delete(key))
}

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

  // Run an aggregation query
  async runAggregationQuery(projectId: string, request: RunAggregationQueryRequest): Promise<RunAggregationQueryResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:runAggregationQuery`, request)
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
  async listKinds(projectId: string, namespaceId?: string, databaseId?: string): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `kinds:${projectId}:${namespaceId || ''}:${databaseId || ''}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        console.log('[Datastore API] Returning cached kinds')
        return cached
      }

      console.log('[Datastore API] Listing kinds for:', { projectId, namespaceId: namespaceId || '(default)', databaseId: databaseId || '(default)' })

      const kinds = new Set<string>()

      // NOTE: The __kind__ meta-entities don't contain databaseId in their partition,
      // so we need to query actual entity kinds to discover which kinds exist in a database.
      // First, get all kind names from __kind__
      const partitionId: any = {
        projectId,
        namespaceId: namespaceId || ''
      }

      const request: RunQueryRequest = {
        partitionId,
        query: {
          kind: [{ name: '__kind__' }]
        }
      }

      console.log('[Datastore API] Querying __kind__ to get all kind names...')
      const kindResponse = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      const allKindNames: string[] = []
      if (kindResponse.data.batch?.entityResults) {
        kindResponse.data.batch.entityResults.forEach((result: any) => {
          const kindName = result.entity?.key?.path?.[0]?.name
          if (kindName) {
            allKindNames.push(kindName)
          }
        })
      }

      console.log(`[Datastore API] Found ${allKindNames.length} total kinds:`, allKindNames)

      // If no database filter, return all kinds
      if (databaseId === undefined) {
        return allKindNames.sort()
      }

      // If database filter is specified, query each kind to check which database it belongs to
      // OPTIMIZATION: Parallelize queries instead of serial loop
      console.log(`[Datastore API] Filtering kinds by database: ${databaseId}`)

      const kindCheckPromises = allKindNames.map(async (kindName) => {
        try {
          // Query just 1 entity from this kind to check its database
          const entityRequest: RunQueryRequest = {
            partitionId,
            query: {
              kind: [{ name: kindName }],
              limit: 1
            }
          }

          const entityResponse = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, entityRequest)

          if (entityResponse.data.batch?.entityResults?.[0]) {
            const entity = entityResponse.data.batch.entityResults[0].entity
            const entityDb = entity?.key?.partitionId?.databaseId || ''

            console.log(`[Datastore API] Kind ${kindName} has database: "${entityDb}"`)

            if (entityDb === databaseId) {
              return kindName
            }
          }
          return null
        } catch (err) {
          console.warn(`[Datastore API] Failed to query kind ${kindName}:`, err)
          return null
        }
      })

      // Wait for all queries to complete in parallel
      const results = await Promise.all(kindCheckPromises)
      results.forEach(kindName => {
        if (kindName) kinds.add(kindName)
      })

      const result = Array.from(kinds).sort()
      console.log('[Datastore API] Discovered kinds in database:', result)

      // Cache the result
      setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('[Datastore API] Failed to list kinds:', error)
      return []
    }
  },

  // List all databases in a project for a specific namespace
  async listDatabases(projectId: string, namespaceId?: string): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `databases:${projectId}:${namespaceId || ''}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        console.log('[Datastore API] Returning cached databases')
        return cached
      }

      console.log('[Datastore API] Listing databases for namespace:', namespaceId || '(default)')

      // Query multiple kinds to discover databases from partition IDs
      const databases = new Set<string>()

      // OPTIMIZATION: Get actual kind names first (not special meta-kinds)
      // Meta-kinds (__kind__, __namespace__, __property__) don't contain databaseId
      // Call listKinds WITHOUT databaseId filter to get all kinds in namespace
      const allKindNames = await this.listKinds(projectId, namespaceId, undefined)
      console.log('[Datastore API] Found kinds for database discovery:', allKindNames)

      if (allKindNames.length === 0) {
        console.log('[Datastore API] No kinds found, returning default database')
        return ['']
      }

      // Query a sample of actual kinds to discover databases (limit to first 3 for performance)
      const kindsToQuery = allKindNames.slice(0, 3)

      const partitionId: any = { projectId }
      if (namespaceId !== undefined) {
        partitionId.namespaceId = namespaceId
      }

      // OPTIMIZATION: Parallelize queries instead of serial loop
      const queryPromises = kindsToQuery.map(async (kindName) => {
        try {
          const request: RunQueryRequest = {
            partitionId,
            query: {
              kind: [{ name: kindName }],
              limit: 10 // Only need a few entities to discover database
            }
          }

          console.log(`[Datastore API] Querying ${kindName} for databases...`)
          const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

          const foundDatabases: string[] = []
          // Extract database IDs from entity partition IDs
          if (response.data.batch?.entityResults) {
            console.log(`[Datastore API] Found ${response.data.batch.entityResults.length} results for ${kindName}`)
            response.data.batch.entityResults.forEach((result: any) => {
              const resultNamespace = result.entity?.key?.partitionId?.namespaceId || ''
              const databaseId = result.entity?.key?.partitionId?.databaseId

              console.log(`[Datastore API] Entity in ${kindName}:`, {
                namespace: resultNamespace,
                databaseId
              })

              // Only include if namespace matches (or if no namespace filter)
              if (namespaceId === undefined || resultNamespace === namespaceId) {
                // Add database (including empty string for default database)
                foundDatabases.push(databaseId !== undefined ? databaseId : '')
              }
            })
          }
          return foundDatabases
        } catch (err) {
          console.warn(`[Datastore API] Failed to query ${kindName}:`, err)
          return []
        }
      })

      // Wait for all queries in parallel
      const allResults = await Promise.all(queryPromises)
      allResults.flat().forEach(db => databases.add(db))

      // Always ensure we have at least the default database
      if (databases.size === 0) {
        databases.add('')
      }

      const result = Array.from(databases).sort()
      console.log('[Datastore API] Discovered databases:', result)

      // Cache the result
      setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('[Datastore API] Failed to list databases:', error)
      return ['']
    }
  },

  // List all namespaces in a project
  async listNamespaces(projectId: string, databaseId?: string): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `namespaces:${projectId}:${databaseId || ''}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        console.log('[Datastore API] Returning cached namespaces')
        return cached
      }
      // Query for __namespace__ entities which contain all namespaces
      // NOTE: Datastore emulator doesn't support databaseId in query partitionId
      const partitionId: any = { projectId }

      const request: RunQueryRequest = {
        partitionId,
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
          const entityDb = entity?.key?.partitionId?.databaseId || ''
          const namespaceName = entity?.key?.path?.[0]?.name

          // Filter by database if specified
          if (databaseId !== undefined) {
            if (entityDb === databaseId && namespaceName) {
              namespaces.add(namespaceName)
            }
          } else {
            // No filter, add all namespaces
            if (namespaceName) {
              namespaces.add(namespaceName)
            }
          }
        })
      }

      const result = Array.from(namespaces).sort()

      // Cache the result
      setCache(cacheKey, result)

      return result
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
    cursorOrOffset?: string | number,
    databaseId?: string
  ): Promise<{ entities: DatastoreEntity[], endCursor?: string, hasMore: boolean }> {
    try {
      const partitionId: any = {
        projectId,
        namespaceId: namespaceId || ''
      }

      // NOTE: Datastore emulator doesn't support databaseId in partitionId
      // We must filter results client-side when database is specified
      const needsFiltering = databaseId !== undefined

      // Determine if we're using cursor (string) or offset (number) pagination
      const cursor = typeof cursorOrOffset === 'string' ? cursorOrOffset : undefined
      const offset = typeof cursorOrOffset === 'number' ? cursorOrOffset : undefined

      // When filtering by database, use offset-based pagination and fetch more to compensate
      const queryLimit = needsFiltering && limit ? Math.min(limit * 3, 5000) : limit

      const query: any = {
        kind: [{ name: kind }],
        limit: queryLimit
      }

      // Use cursor for normal queries, offset when filtering by database
      if (needsFiltering && offset !== undefined) {
        query.offset = offset
      } else if (!needsFiltering && cursor) {
        query.startCursor = cursor
      }

      const request: RunQueryRequest = {
        partitionId,
        query
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      if (response.data.batch?.entityResults) {
        const entities = response.data.batch.entityResults.map((result: any) => result.entity)
        const endCursor = response.data.batch.endCursor
        const moreResults = response.data.batch.moreResults

        // Check if there are more results
        const hasMore = moreResults === 'MORE_RESULTS_AFTER_LIMIT' ||
          moreResults === 'MORE_RESULTS_AFTER_CURSOR' ||
          moreResults === 'NOT_FINISHED'

        // Filter by database if needed
        if (needsFiltering) {
          const filtered = entities.filter((entity: DatastoreEntity) => {
            const entityDb = entity.key?.partitionId?.databaseId || ''
            return entityDb === databaseId
          })
          // Apply limit after filtering
          const limitedEntities = limit ? filtered.slice(0, limit) : filtered

          // Don't return cursor when filtering (can't use it anyway)
          // Estimate if there are more results based on whether we got enough filtered results
          return {
            entities: limitedEntities,
            endCursor: undefined,
            hasMore: hasMore && limitedEntities.length >= (limit || 0)
          }
        }

        return {
          entities,
          endCursor,
          hasMore
        }
      }

      return { entities: [], hasMore: false }
    } catch (error) {
      console.error('Failed to get entities by kind:', error)
      return { entities: [], hasMore: false }
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

    // Invalidate caches since we created an entity
    clearCache(projectId)

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
    const databaseId = key.partitionId.databaseId

    // Block delete operations on named databases with a clear error message
    if (databaseId && databaseId !== '' && databaseId !== '(default)') {
      throw new Error(
        `Delete operations are not supported for entities in named database "${databaseId}". ` +
        `This is a known limitation of the Datastore emulator. `
      )
    }

    // For default database entities, strip databaseId from key
    const cleanKey: DatastoreKey = {
      partitionId: {
        projectId: key.partitionId.projectId,
        namespaceId: key.partitionId.namespaceId
      },
      path: key.path
    }

    try {
      const request: CommitRequest = {
        mode: 'NON_TRANSACTIONAL',
        mutations: [
          {
            delete: cleanKey
          }
        ]
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
      console.log('[Datastore API] Delete successful:', response.data)

      clearCache(projectId)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message
      console.error('[Datastore API] Delete failed:', errorMsg)
      throw new Error(`Failed to delete entity: ${errorMsg}`)
    }
  },

  // Delete all entities of a kind
  async deleteKind(projectId: string, kind: string, namespaceId?: string, databaseId?: string): Promise<void> {
    try {
      // Get all entities of this kind
      const entities = await this.getEntitiesByKind(projectId, kind, namespaceId, undefined, undefined, databaseId)

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

      // Invalidate caches since we deleted entities
      clearCache(projectId)
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

  // Export entities (Datastore emulator API)
  async exportEntities(projectId: string, exportDirectory: string): Promise<any> {
    // Build full database path with trailing slash
    const databasePath = `projects/${projectId}/databases/`

    const request = {
      database: databasePath,
      export_directory: exportDirectory
    }

    const response = await datastoreClient.post(`/emulator/v1/projects/${projectId}:export`, request)
    return response.data
  },

  // Import entities (Datastore emulator API)
  async importEntities(projectId: string, metadataFilePath: string): Promise<any> {
    // Build full database path with trailing slash
    const databasePath = `projects/${projectId}/databases/`

    const request = {
      database: databasePath,
      export_directory: metadataFilePath
    }

    const response = await datastoreClient.post(`/emulator/v1/projects/${projectId}:import`, request)

    // Clear cache after import to ensure fresh data is loaded
    clearCache(projectId)

    return response.data
  },

  // Export entities as JSON (query all entities and return as JSON)
  async exportEntitiesAsJson(projectId: string, namespaceId?: string): Promise<any> {
    try {
      // Step 1: Get all namespaces (or use the specified one)
      const namespacesToExport: string[] = []
      if (namespaceId !== undefined) {
        // Export only the specified namespace
        namespacesToExport.push(namespaceId)
      } else {
        // Export ALL namespaces
        const allNamespaces = await this.listNamespaces(projectId)
        namespacesToExport.push(...allNamespaces)
      }

      const exportData: any = {
        projectId,
        exportDate: new Date().toISOString(),
        namespaces: []
      }

      // Step 2: For each namespace, get all kinds and their entities
      for (const namespace of namespacesToExport) {
        const namespaceData: any = {
          namespaceId: namespace,
          kinds: []
        }

        // Get all kinds in this namespace
        const kinds = await this.listKinds(projectId, namespace)

        // For each kind, get all entities
        for (const kind of kinds) {
          const partitionId: any = {
            projectId,
            namespaceId: namespace || ''
          }

          const request: RunQueryRequest = {
            partitionId,
            query: {
              kind: [{ name: kind }],
              limit: 10000  // Large limit to get all entities
            }
          }

          const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

          const entities: DatastoreEntity[] = []
          if (response.data.batch?.entityResults) {
            response.data.batch.entityResults.forEach((result: any) => {
              entities.push(result.entity)
            })
          }

          namespaceData.kinds.push({
            kind,
            count: entities.length,
            entities
          })
        }

        exportData.namespaces.push(namespaceData)
      }

      return exportData
    } catch (error) {
      console.error('[Datastore API] Failed to export entities as JSON:', error)
      throw error
    }
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
  },

  // Cache management
  clearCache(pattern?: string): void {
    clearCache(pattern)
  }
}

export default datastoreApi
