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
  TransactionOptions,
  RollbackRequest,
  AllocateIdsRequest,
  AllocateIdsResponse,
} from '@/types/datastore'

const datastoreClient = axios.create({
  baseURL: import.meta.env.VITE_DATASTORE_BASE_URL || '/datastore',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const fileServerClient = axios.create({
  baseURL: import.meta.env.VITE_FILE_SERVER_BASE_URL || '/fs',
  timeout: 300000, // 5 minutes for large files
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

export function normalizeId(id?: string): string {
  if (!id || id === '(default)') return ''
  return id
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
  async lookup(projectId: string, request: LookupRequest): Promise<LookupResponse> {
    const dbId = normalizeId(request.databaseId || request.keys[0]?.partitionId?.databaseId)
    if (dbId) {
      request.databaseId = dbId
      request.keys.forEach(key => {
        if (key.partitionId) key.partitionId.databaseId = dbId
      })
    } else {
      delete request.databaseId
      request.keys.forEach(key => {
        if (key.partitionId) delete key.partitionId.databaseId
      })
    }
    const response = await datastoreClient.post(`/v1/projects/${projectId}:lookup`, request)
    return response.data
  },

  // Run a query
  async runQuery(projectId: string, request: RunQueryRequest): Promise<RunQueryResponse> {
    const dbId = normalizeId(request.databaseId || request.partitionId?.databaseId)
    if (dbId) {
      request.databaseId = dbId
      if (request.partitionId) {
        request.partitionId.databaseId = dbId
      }
    } else {
      delete request.databaseId
      if (request.partitionId) {
        delete request.partitionId.databaseId
      }
    }
    const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)
    return response.data
  },

  // Run an aggregation query
  async runAggregationQuery(
    projectId: string,
    request: RunAggregationQueryRequest
  ): Promise<RunAggregationQueryResponse> {
    const dbId = normalizeId(request.databaseId || request.partitionId?.databaseId)
    if (dbId) {
      request.databaseId = dbId
      if (request.partitionId) {
        request.partitionId.databaseId = dbId
      }
    } else {
      delete request.databaseId
      if (request.partitionId) {
        delete request.partitionId.databaseId
      }
    }
    const response = await datastoreClient.post(
      `/v1/projects/${projectId}:runAggregationQuery`,
      request
    )
    return response.data
  },

  // Commit mutations (insert, update, upsert, delete)
  async commit(projectId: string, request: CommitRequest): Promise<CommitResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return response.data
  },

  // Begin a transaction
  async beginTransaction(
    projectId: string,
    options?: TransactionOptions,
    databaseId?: string
  ): Promise<string> {
    const dbId = normalizeId(databaseId)
    const request: BeginTransactionRequest = {
      ...(options ? { transactionOptions: options } : {}),
      ...(dbId ? { databaseId: dbId } : {}),
    }

    const response = await datastoreClient.post(
      `/v1/projects/${projectId}:beginTransaction`,
      request
    )
    return response.data.transaction
  },

  // Rollback a transaction
  async rollback(projectId: string, transaction: string, databaseId?: string): Promise<void> {
    const dbId = normalizeId(databaseId)
    const request: RollbackRequest = {
      transaction,
      ...(dbId ? { databaseId: dbId } : {}),
    }
    await datastoreClient.post(`/v1/projects/${projectId}:rollback`, request)
  },

  // Allocate IDs
  async allocateIds(projectId: string, request: AllocateIdsRequest): Promise<AllocateIdsResponse> {
    const dbId = normalizeId(request.databaseId)
    if (dbId) {
      request.databaseId = dbId
      request.keys.forEach(key => {
        if (key.partitionId) key.partitionId.databaseId = dbId
      })
    } else {
      delete request.databaseId
      request.keys.forEach(key => {
        if (key.partitionId) delete key.partitionId.databaseId
      })
    }
    const response = await datastoreClient.post(`/v1/projects/${projectId}:allocateIds`, request)
    return response.data
  },

  // List all kinds (entity types) in a project
  async listKinds(projectId: string, namespaceId?: string, databaseId?: string): Promise<string[]> {
    try {
      const normalizedNamespace = normalizeId(namespaceId)
      const normalizedDatabase = normalizeId(databaseId)

      // Check cache first
      const cacheKey = `kinds:${projectId}:${normalizedNamespace}:${normalizedDatabase}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        console.log('[Datastore API] Returning cached kinds')
        return cached
      }

      console.log(`[Datastore API] Listing kinds for:`, {
        projectId,
        namespaceId: normalizedNamespace,
        databaseId: normalizedDatabase,
      })

      // NOTE: The __kind__ meta-entities don't contain databaseId in their partition,
      // so we need to query actual entity kinds to discover which kinds exist in a database.
      // First, get all kind names from __kind__
      const partitionId: any = { projectId }
      if (normalizedNamespace) partitionId.namespaceId = normalizedNamespace
      if (normalizedDatabase) partitionId.databaseId = normalizedDatabase

      const request: RunQueryRequest = {
        partitionId,
        query: {
          kind: [{ name: '__kind__' }],
        },
      }
      if (normalizedDatabase) request.databaseId = normalizedDatabase

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

      const result = allKindNames.sort()

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
      const normalizedNamespace = normalizeId(namespaceId)
      // Check cache first
      const cacheKey = `databases:${projectId}:${normalizedNamespace}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        return cached
      }

      console.log(
        '[Datastore API] Listing databases for namespace:',
        normalizedNamespace || '(default)'
      )

      // Query multiple kinds to discover databases from partition IDs
      const databases = new Set<string>()

      // 1. Discovery via "Leakage": Get kind names and query default DB
      const allKindNames = await this.listKinds(projectId, namespaceId, undefined)

      // Query actual kinds to discover database IDs from their result keys
      const kindsToProbe = allKindNames.slice(0, 3)

      const probePromises = kindsToProbe.map(async kindName => {
        try {
          const request: RunQueryRequest = {
            partitionId: { projectId, namespaceId: normalizedNamespace, databaseId: '' },
            query: { kind: [{ name: kindName }], limit: 10 },
          }
          const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

          const results: string[] = []
          if (response.data.batch?.entityResults) {
            response.data.batch.entityResults.forEach((res: any) => {
              const dbId = res.entity?.key?.partitionId?.databaseId || ''
              results.push(dbId)
            })
          }
          return results
        } catch {
          return []
        }
      })

      const probeResults = await Promise.all(probePromises)
      probeResults.flat().forEach(db => databases.add(db))

      // Always include the default database
      databases.add('')

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
      const normalizedDatabase = normalizeId(databaseId)

      // Check cache first
      const cacheKey = `namespaces:${projectId}:${normalizedDatabase}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        console.log('[Datastore API] Returning cached namespaces')
        return cached
      }
      // Query for __namespace__ entities which contain all namespaces
      const partitionId: any = {
        projectId,
        databaseId: normalizedDatabase,
      }

      const request: RunQueryRequest = {
        partitionId,
        databaseId: normalizedDatabase,
        query: {
          kind: [{ name: '__namespace__' }],
        },
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
  ): Promise<{ entities: DatastoreEntity[]; endCursor?: string; hasMore: boolean }> {
    try {
      const normalizedNamespace = normalizeId(namespaceId)
      const normalizedDatabase = normalizeId(databaseId)

      const partitionId: any = {
        projectId,
        namespaceId: normalizedNamespace,
        databaseId: normalizedDatabase,
      }

      // Determine if we're using cursor (string) or offset (number) pagination
      const cursor = typeof cursorOrOffset === 'string' ? cursorOrOffset : undefined
      const offset = typeof cursorOrOffset === 'number' ? cursorOrOffset : undefined

      const query: any = {
        kind: [{ name: kind }],
        limit,
      }

      if (offset !== undefined) {
        query.offset = offset
      } else if (cursor) {
        query.startCursor = cursor
      }

      const request: RunQueryRequest = {
        partitionId,
        query,
        databaseId: normalizedDatabase,
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      if (response.data.batch?.entityResults) {
        const entities = response.data.batch.entityResults.map((result: any) => result.entity)
        const endCursor = response.data.batch.endCursor
        const moreResults = response.data.batch.moreResults

        // Check if there are more results
        const hasMore =
          moreResults === 'MORE_RESULTS_AFTER_LIMIT' ||
          moreResults === 'MORE_RESULTS_AFTER_CURSOR' ||
          moreResults === 'NOT_FINISHED'

        return {
          entities,
          endCursor,
          hasMore,
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
        keys: [key],
        databaseId: key.partitionId?.databaseId || '',
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
    if (entity.key.partitionId) {
      const db = normalizeId(entity.key.partitionId.databaseId)
      if (db) {
        entity.key.partitionId.databaseId = db
      } else {
        delete entity.key.partitionId.databaseId
      }
    }
    const dbId = normalizeId(entity.key.partitionId?.databaseId)
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          insert: entity,
        },
      ],
      ...(dbId ? { databaseId: dbId } : {}),
    }

    const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)

    // Invalidate caches since we created an entity
    clearCache(projectId)

    // Return the entity with the generated key if applicable
    if (response.data.mutationResults?.[0]?.key) {
      return {
        ...entity,
        key: response.data.mutationResults[0].key,
      }
    }

    return entity
  },

  // Update an entity
  async updateEntity(projectId: string, entity: DatastoreEntity): Promise<DatastoreEntity> {
    if (entity.key.partitionId) {
      const db = normalizeId(entity.key.partitionId.databaseId)
      if (db) {
        entity.key.partitionId.databaseId = db
      } else {
        delete entity.key.partitionId.databaseId
      }
    }
    const dbId = normalizeId(entity.key.partitionId?.databaseId)
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          update: entity,
        },
      ],
      ...(dbId ? { databaseId: dbId } : {}),
    }

    await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return entity
  },

  // Upsert an entity (insert or update)
  async upsertEntity(projectId: string, entity: DatastoreEntity): Promise<DatastoreEntity> {
    if (entity.key.partitionId) {
      const db = normalizeId(entity.key.partitionId.databaseId)
      if (db) {
        entity.key.partitionId.databaseId = db
      } else {
        delete entity.key.partitionId.databaseId
      }
    }
    const dbId = normalizeId(entity.key.partitionId?.databaseId)
    const request: CommitRequest = {
      mode: 'NON_TRANSACTIONAL',
      mutations: [
        {
          upsert: entity,
        },
      ],
      ...(dbId ? { databaseId: dbId } : {}),
    }

    await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return entity
  },

  // Delete an entity
  async deleteEntity(projectId: string, key: DatastoreKey): Promise<void> {
    try {
      if (key.partitionId) {
        const db = normalizeId(key.partitionId.databaseId)
        if (db) {
          key.partitionId.databaseId = db
        } else {
          delete key.partitionId.databaseId
        }
      }
      const dbId = normalizeId(key.partitionId?.databaseId)
      const request: CommitRequest = {
        mode: 'NON_TRANSACTIONAL',
        mutations: [
          {
            delete: key,
          },
        ],
        ...(dbId ? { databaseId: dbId } : {}),
      }

      const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
      console.log('[Datastore API] Delete successful:', response.data)

      clearCache(projectId)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message
      console.error('[Datastore API] Delete failed:', errorMsg)
      throw new Error(`Failed to delete entity: ${errorMsg}`, { cause: error })
    }
  },

  // Delete all entities of a kind
  async deleteKind(
    projectId: string,
    kind: string,
    namespaceId?: string,
    databaseId?: string
  ): Promise<void> {
    try {
      // Get all entities of this kind
      const entities = await this.getEntitiesByKind(
        projectId,
        kind,
        namespaceId,
        undefined,
        undefined,
        databaseId
      )

      const entitiesList = entities.entities

      if (entitiesList.length === 0) {
        return
      }

      // Delete all entities in batches
      const batchSize = 500 // Datastore limit
      for (let i = 0; i < entitiesList.length; i += batchSize) {
        const batch = entitiesList.slice(i, i + batchSize)
        const request: CommitRequest = {
          mode: 'NON_TRANSACTIONAL',
          databaseId: databaseId || '',
          mutations: batch.map(entity => ({
            delete: entity.key,
          })),
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
  async exportEntities(
    projectId: string,
    exportDirectory: string,
    databaseId?: string
  ): Promise<any> {
    // Build full database path
    const dbId = normalizeId(databaseId) || '(default)'
    const databasePath = `projects/${projectId}/databases/${dbId}`

    const request = {
      database: databasePath,
      export_directory: exportDirectory,
    }

    const response = await datastoreClient.post(
      `/emulator/v1/projects/${projectId}:export`,
      request
    )
    return response.data
  },

  // Import entities (Datastore emulator API)
  async importEntities(
    projectId: string,
    metadataFilePath: string,
    databaseId?: string
  ): Promise<any> {
    // Build full database path
    const dbId = normalizeId(databaseId) || '(default)'
    const databasePath = `projects/${projectId}/databases/${dbId}`

    const request = {
      database: databasePath,
      export_directory: metadataFilePath,
    }

    const response = await datastoreClient.post(
      `/emulator/v1/projects/${projectId}:import`,
      request
    )

    // Clear cache after import to ensure fresh data is loaded
    clearCache(projectId)

    return response.data
  },

  // Export entities as JSON (query all entities and return as JSON)
  async exportEntitiesAsJson(
    projectId: string,
    namespaceId?: string,
    databaseId?: string
  ): Promise<any> {
    const normalizedDatabase = normalizeId(databaseId)
    try {
      // Step 1: Get all namespaces (or use the specified one)
      const namespacesToExport: string[] = []
      if (namespaceId !== undefined) {
        // Export only the specified namespace
        namespacesToExport.push(namespaceId)
      } else {
        // Export ALL namespaces
        const allNamespaces = await this.listNamespaces(projectId, normalizedDatabase)
        namespacesToExport.push(...allNamespaces)
      }

      const exportData: any = {
        projectId,
        exportDate: new Date().toISOString(),
        namespaces: [],
      }

      // Step 2: For each namespace, get all kinds and their entities
      for (const namespace of namespacesToExport) {
        const namespaceData: any = {
          namespaceId: namespace,
          kinds: [],
        }

        // Get all kinds in this namespace
        const kinds = await this.listKinds(projectId, namespace, normalizedDatabase)

        // For each kind, get all entities
        for (const kind of kinds) {
          const partitionId: any = {
            projectId,
            namespaceId: namespace || '',
            databaseId: normalizedDatabase,
          }
          if (!partitionId.databaseId) delete partitionId.databaseId

          const request: RunQueryRequest = {
            partitionId,
            databaseId: normalizedDatabase,
            query: {
              kind: [{ name: kind }],
              limit: 10000, // Large limit to get all entities
            },
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
            entities,
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
  createKey(
    projectId: string,
    kind: string,
    id?: string | number,
    namespaceId?: string,
    databaseId?: string
  ): DatastoreKey {
    return {
      partitionId: {
        projectId,
        namespaceId: namespaceId || '',
        databaseId: normalizeId(databaseId),
      },
      path: [
        {
          kind,
          ...(typeof id === 'string'
            ? { name: id }
            : id !== undefined
              ? { id: id.toString() }
              : {}),
        },
      ],
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
  },

  // File operations for import/export via miniserve
  async createDirectory(path: string): Promise<void> {
    const formData = new FormData()

    // Extract parent path and directory name
    const lastSlashIndex = path.lastIndexOf('/')
    let parentPath = '/'
    let dirName = path

    if (lastSlashIndex !== -1) {
      parentPath = path.substring(0, lastSlashIndex) || '/'
      dirName = path.substring(lastSlashIndex + 1)
    }

    formData.append('mkdir', dirName)

    await fileServerClient.post(`/upload?path=${encodeURIComponent(parentPath)}`, formData)
  },

  async uploadFile(file: File, targetPath?: string): Promise<void> {
    const formData = new FormData()

    let uploadPath = '/'
    let filename = file.name

    // If targetPath is provided, split into directory and filename
    if (targetPath) {
      const lastSlashIndex = targetPath.lastIndexOf('/')
      if (lastSlashIndex !== -1) {
        uploadPath = targetPath.substring(0, lastSlashIndex) || '/'
        filename = targetPath.substring(lastSlashIndex + 1)
      } else {
        filename = targetPath
      }
    }

    // Create a new File with just the filename (no directory path)
    const fileToUpload = new File([file], filename, { type: file.type })
    formData.append('path', fileToUpload)

    await fileServerClient.post(`/upload?path=${encodeURIComponent(uploadPath)}`, formData)
  },

  async uploadFiles(files: File[], basePath: string = '/'): Promise<void> {
    // Step 1: Collect all unique directory paths
    const directories = new Set<string>()

    for (const file of files) {
      // Skip .DS_Store and other hidden system files
      if (file.name === '.DS_Store' || file.name.startsWith('._')) {
        continue
      }

      const relativePath = file.webkitRelativePath || file.name
      const fullPath = basePath === '/' ? relativePath : `${basePath}/${relativePath}`

      // Extract all parent directories
      const parts = fullPath.split('/')
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/')
        if (dirPath) {
          directories.add(dirPath)
        }
      }
    }

    // Step 2: Create directories in order (parent before child)
    const sortedDirs = Array.from(directories).sort()
    for (const dir of sortedDirs) {
      try {
        await this.createDirectory(dir)
      } catch (error) {
        // Directory might already exist, continue
        console.warn(`Failed to create directory ${dir}:`, error)
      }
    }

    // Step 3: Upload files
    for (const file of files) {
      // Skip .DS_Store and other hidden system files
      if (file.name === '.DS_Store' || file.name.startsWith('._')) {
        continue
      }

      const relativePath = file.webkitRelativePath || file.name
      const fullPath = basePath === '/' ? relativePath : `${basePath}/${relativePath}`
      await this.uploadFile(file, fullPath)
    }
  },

  async downloadFile(filename: string): Promise<Blob> {
    const response = await fileServerClient.get(`/${filename}`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default datastoreApi
