import axios from 'axios'
import type {
  DatastoreEntity,
  DatastoreKey,
  PartitionId,
  DatastoreQuery,
  EntityResult,
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

  async commit(projectId: string, request: CommitRequest): Promise<CommitResponse> {
    const response = await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    return response.data
  },

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

  async rollback(projectId: string, transaction: string, databaseId?: string): Promise<void> {
    const dbId = normalizeId(databaseId)
    const request: RollbackRequest = {
      transaction,
      ...(dbId ? { databaseId: dbId } : {}),
    }
    await datastoreClient.post(`/v1/projects/${projectId}:rollback`, request)
  },

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

  async listKinds(projectId: string, namespaceId?: string, databaseId?: string): Promise<string[]> {
    try {
      const normalizedNamespace = normalizeId(namespaceId)
      const normalizedDatabase = normalizeId(databaseId)

      const cacheKey = `kinds:${projectId}:${normalizedNamespace}:${normalizedDatabase}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        return cached
      }

      const partitionId: PartitionId = { projectId }
      if (normalizedNamespace) partitionId.namespaceId = normalizedNamespace
      if (normalizedDatabase) partitionId.databaseId = normalizedDatabase

      const request: RunQueryRequest = {
        partitionId,
        query: {
          kind: [{ name: '__kind__' }],
        },
      }
      if (normalizedDatabase) request.databaseId = normalizedDatabase

      const kindResponse = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

      const allKindNames: string[] = []
      if (kindResponse.data.batch?.entityResults) {
        kindResponse.data.batch.entityResults.forEach((result: EntityResult) => {
          const kindName = result.entity?.key?.path?.[0]?.name
          if (kindName) {
            allKindNames.push(kindName)
          }
        })
      }

      const result = allKindNames.sort()
      setCache(cacheKey, result)
      return result
    } catch {
      return []
    }
  },

  async listDatabases(projectId: string, namespaceId?: string): Promise<string[]> {
    try {
      const normalizedNamespace = normalizeId(namespaceId)
      const cacheKey = `databases:${projectId}:${normalizedNamespace}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        return cached
      }

      const databases = new Set<string>()
      const allKindNames = await this.listKinds(projectId, namespaceId, undefined)
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
            response.data.batch.entityResults.forEach((res: EntityResult) => {
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
      databases.add('')

      const result = Array.from(databases).sort()
      setCache(cacheKey, result)
      return result
    } catch {
      return ['']
    }
  },

  async listNamespaces(projectId: string, databaseId?: string): Promise<string[]> {
    try {
      const normalizedDatabase = normalizeId(databaseId)
      const cacheKey = `namespaces:${projectId}:${normalizedDatabase}`
      const cached = getCached<string[]>(cacheKey)
      if (cached) {
        return cached
      }

      const partitionId: PartitionId = {
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

      const namespaces = new Set<string>()
      namespaces.add('') // Default namespace always exists

      const results = (response.data.batch?.entityResults || []) as EntityResult[]
      results.forEach((result: EntityResult) => {
        const entity = result.entity
        const entityDb = entity?.key?.partitionId?.databaseId || ''
        const namespaceName = entity?.key?.path?.[0]?.name

        if (databaseId !== undefined) {
          if (entityDb === databaseId && namespaceName) {
            namespaces.add(namespaceName)
          }
        } else {
          if (namespaceName) {
            namespaces.add(namespaceName)
          }
        }
      })

      const result = Array.from(namespaces).sort()
      setCache(cacheKey, result)
      return result
    } catch {
      return ['']
    }
  },

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

      const partitionId: PartitionId = {
        projectId,
        namespaceId: normalizedNamespace,
        databaseId: normalizedDatabase,
      }

      const cursor = typeof cursorOrOffset === 'string' ? cursorOrOffset : undefined
      const offset = typeof cursorOrOffset === 'number' ? cursorOrOffset : undefined

      const query: DatastoreQuery = {
        kind: [{ name: kind }],
      }

      if (limit !== undefined) {
        query.limit = limit
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
        const entities = response.data.batch.entityResults.map(
          (result: EntityResult) => result.entity
        )
        const endCursor = response.data.batch.endCursor
        const moreResults = response.data.batch.moreResults

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
    } catch {
      return { entities: [], hasMore: false }
    }
  },

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
    } catch {
      return null
    }
  },

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
    clearCache(projectId)

    if (response.data.mutationResults?.[0]?.key) {
      return {
        ...entity,
        key: response.data.mutationResults[0].key,
      }
    }

    return entity
  },

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

  async deleteEntity(projectId: string, key: DatastoreKey): Promise<void> {
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

    await datastoreClient.post(`/v1/projects/${projectId}:commit`, request)
    clearCache(projectId)
  },

  async deleteKind(
    projectId: string,
    kind: string,
    namespaceId?: string,
    databaseId?: string
  ): Promise<void> {
    try {
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

      const batchSize = 500
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
    } catch (error) {
      console.error(`Failed to delete kind ${kind}:`, error)
    }

    clearCache(projectId)
  },

  async healthCheck(projectId?: string): Promise<boolean> {
    try {
      const project = projectId || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project'
      await this.listKinds(project)
      return true
    } catch {
      return false
    }
  },

  async exportEntities(
    projectId: string,
    exportDirectory: string,
    databaseId?: string
  ): Promise<any> {
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

  async importEntities(
    projectId: string,
    metadataFilePath: string,
    databaseId?: string
  ): Promise<any> {
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

    clearCache(projectId)
    return response.data
  },

  async exportEntitiesAsJson(
    projectId: string,
    namespaceId?: string,
    databaseId?: string
  ): Promise<any> {
    const normalizedDatabase = normalizeId(databaseId)
    try {
      const namespacesToExport: string[] = []
      if (namespaceId !== undefined) {
        namespacesToExport.push(namespaceId)
      } else {
        const allNamespaces = await this.listNamespaces(projectId, normalizedDatabase)
        namespacesToExport.push(...allNamespaces)
      }

      const exportData: any = {
        projectId,
        exportDate: new Date().toISOString(),
        namespaces: [],
      }

      for (const namespace of namespacesToExport) {
        const namespaceData: any = {
          namespaceId: namespace,
          kinds: [],
        }

        const kinds = await this.listKinds(projectId, namespace, normalizedDatabase)

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
              limit: 10000,
            },
          }

          const response = await datastoreClient.post(`/v1/projects/${projectId}:runQuery`, request)

          const entities: DatastoreEntity[] = []
          if (response.data.batch?.entityResults) {
            response.data.batch.entityResults.forEach((result: EntityResult) => {
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
    } finally {
      // Done
    }
  },

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

  getKeyId(key: DatastoreKey): string {
    const lastElement = key.path[key.path.length - 1]
    return lastElement.name || lastElement.id || ''
  },

  getKeyKind(key: DatastoreKey): string {
    const lastElement = key.path[key.path.length - 1]
    return lastElement.kind
  },

  clearCache(pattern?: string): void {
    clearCache(pattern)
  },

  async createDirectory(path: string): Promise<void> {
    const formData = new FormData()
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

    if (targetPath) {
      const lastSlashIndex = targetPath.lastIndexOf('/')
      if (lastSlashIndex !== -1) {
        uploadPath = targetPath.substring(0, lastSlashIndex) || '/'
        filename = targetPath.substring(lastSlashIndex + 1)
      } else {
        filename = targetPath
      }
    }

    const fileToUpload = new File([file], filename, { type: file.type })
    formData.append('path', fileToUpload)

    await fileServerClient.post(`/upload?path=${encodeURIComponent(uploadPath)}`, formData)
  },

  async uploadFiles(files: File[], basePath: string = '/'): Promise<void> {
    const directories = new Set<string>()

    for (const file of files) {
      if (file.name === '.DS_Store' || file.name.startsWith('._')) continue

      const relativePath = file.webkitRelativePath || file.name
      const fullPath = basePath === '/' ? relativePath : `${basePath}/${relativePath}`

      const parts = fullPath.split('/')
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/')
        if (dirPath) directories.add(dirPath)
      }
    }

    const sortedDirs = Array.from(directories).sort()
    for (const dir of sortedDirs) {
      try {
        await this.createDirectory(dir)
      } catch (error) {
        console.warn(`Failed to create directory ${dir}:`, error)
      }
    }

    for (const file of files) {
      if (file.name === '.DS_Store' || file.name.startsWith('._')) continue

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
