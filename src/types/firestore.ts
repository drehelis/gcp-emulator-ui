/**
 * Google Cloud Firestore types for Firestore emulator integration
 */

// Core Firestore Document Types
export interface FirestoreDocument {
  name: string
  fields: Record<string, FirestoreValue>
  createTime?: string
  updateTime?: string
}

export interface FirestoreValue {
  nullValue?: null
  booleanValue?: boolean
  integerValue?: string
  doubleValue?: number
  timestampValue?: string
  stringValue?: string
  bytesValue?: string
  referenceValue?: string
  geoPointValue?: {
    latitude: number
    longitude: number
  }
  arrayValue?: {
    values: FirestoreValue[]
  }
  mapValue?: {
    fields: Record<string, FirestoreValue>
  }
}

// Collection Types
export interface FirestoreCollection {
  name: string
  documentCount?: number
  lastModified?: string
}

// Query Types
export interface FirestoreQuery {
  select?: {
    fields: { fieldPath: string }[]
  }
  from: {
    collectionId: string
    allDescendants?: boolean
  }[]
  where?: FirestoreFilter
  orderBy?: {
    field: { fieldPath: string }
    direction: 'ASCENDING' | 'DESCENDING'
  }[]
  startAt?: FirestoreCursor
  endAt?: FirestoreCursor
  offset?: number
  limit?: number
}

export interface FirestoreFilter {
  compositeFilter?: {
    op: 'AND' | 'OR'
    filters: FirestoreFilter[]
  }
  fieldFilter?: {
    field: { fieldPath: string }
    op: 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'EQUAL' | 'NOT_EQUAL' | 'ARRAY_CONTAINS' | 'IN' | 'ARRAY_CONTAINS_ANY' | 'NOT_IN'
    value: FirestoreValue
  }
  unaryFilter?: {
    field: { fieldPath: string }
    op: 'IS_NAN' | 'IS_NULL' | 'IS_NOT_NAN' | 'IS_NOT_NULL'
  }
}

export interface FirestoreCursor {
  values: FirestoreValue[]
  before?: boolean
}

// Request/Response Types
export interface CreateDocumentRequest {
  parent: string
  collectionId: string
  documentId?: string
  document: FirestoreDocument
  mask?: DocumentMask
}

export interface UpdateDocumentRequest {
  name: string
  document: FirestoreDocument
  updateMask?: DocumentMask
  mask?: DocumentMask
  currentDocument?: Precondition
}

export interface DeleteDocumentRequest {
  name: string
  currentDocument?: Precondition
}

export interface QueryRequest {
  parent: string
  structuredQuery?: FirestoreQuery
  transaction?: string
  newTransaction?: TransactionOptions
  readTime?: string
}

export interface BatchRequest {
  database: string
  writes: Write[]
  labels?: Record<string, string>
}

export interface DocumentMask {
  fieldPaths: string[]
}

export interface Precondition {
  exists?: boolean
  updateTime?: string
}

export interface TransactionOptions {
  readOnly?: {
    readTime?: string
  }
  readWrite?: {
    retryTransaction?: string
  }
}

export interface Write {
  update?: FirestoreDocument
  delete?: string
  verify?: string
  transform?: DocumentTransform
  updateMask?: DocumentMask
  updateTransforms?: FieldTransform[]
  currentDocument?: Precondition
}

export interface DocumentTransform {
  document: string
  fieldTransforms: FieldTransform[]
}

export interface FieldTransform {
  fieldPath: string
  setToServerValue?: 'SERVER_VALUE_UNSPECIFIED' | 'REQUEST_TIME'
  increment?: FirestoreValue
  maximum?: FirestoreValue
  minimum?: FirestoreValue
  appendMissingElements?: {
    values: FirestoreValue[]
  }
  removeAllFromArray?: {
    values: FirestoreValue[]
  }
}

// Response Types
export interface ListDocumentsResponse {
  documents: FirestoreDocument[]
  nextPageToken?: string
}

export interface ListCollectionsResponse {
  collections: FirestoreCollection[]
  nextPageToken?: string
}

export interface RunQueryResponse {
  document?: FirestoreDocument
  readTime: string
  skippedResults?: number
  transaction?: string
}

// Transaction Types
export interface Transaction {
  id: string
  readTime?: string
}

export interface BeginTransactionRequest {
  options?: TransactionOptions
}

export interface CommitRequest {
  database: string
  writes: Write[]
  transaction?: string
}

export interface RollbackRequest {
  database: string
  transaction: string
}

// Index Types
export interface FirestoreIndex {
  name: string
  queryScope: 'QUERY_SCOPE_UNSPECIFIED' | 'COLLECTION' | 'COLLECTION_GROUP'
  apiScope?: 'ANY_API' | 'DATASTORE_MODE_API'
  fields: IndexField[]
  state: 'STATE_UNSPECIFIED' | 'CREATING' | 'READY' | 'NEEDS_REPAIR'
}

export interface IndexField {
  fieldPath: string
  order?: 'ORDER_UNSPECIFIED' | 'ASCENDING' | 'DESCENDING'
  arrayConfig?: 'ARRAY_CONFIG_UNSPECIFIED' | 'CONTAINS'
}

// Database Types
export interface FirestoreDatabase {
  name: string
  uid?: string
  createTime?: string
  updateTime?: string
  locationId?: string
  type?: 'DATABASE_TYPE_UNSPECIFIED' | 'FIRESTORE_NATIVE' | 'DATASTORE_MODE'
  concurrencyMode?: 'CONCURRENCY_MODE_UNSPECIFIED' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'OPTIMISTIC_WITH_ENTITY_GROUPS'
  appEngineIntegrationMode?: 'APP_ENGINE_INTEGRATION_MODE_UNSPECIFIED' | 'ENABLED' | 'DISABLED'
  keyPrefix?: string
  etag?: string
}

// Error Types
export interface FirestoreError {
  code: number
  message: string
  details?: any[]
}

// Statistics Types
export interface DocumentStatistics {
  documentCount: number
  collectionCount: number
  totalSize: number
  lastModified: Date
}

export interface CollectionStatistics {
  name: string
  documentCount: number
  totalSize: number
  lastModified: Date
  subcollectionCount?: number
}

// UI Helper Types
export interface FirestoreDocumentWithMetadata extends FirestoreDocument {
  id: string
  collection: string
  path: string
  size?: number
  isExpanded?: boolean
}

export interface FirestoreCollectionWithMetadata extends FirestoreCollection {
  id: string
  path: string
  parentDocument?: string
  statistics?: CollectionStatistics
  isExpanded?: boolean
}

// Query Builder Types
export interface QueryBuilder {
  collection: string
  filters: QueryFilter[]
  orderBy: QueryOrderBy[]
  limit?: number
  offset?: number
  startAfter?: any
  endBefore?: any
}

export interface QueryFilter {
  field: string
  operator: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any'
  value: any
}

export interface QueryOrderBy {
  field: string
  direction: 'asc' | 'desc'
}

// Export/Import Types
export interface ExportRequest {
  name: string
  outputUriPrefix: string
  collectionIds?: string[]
  namespaceIds?: string[]
}

export interface ImportRequest {
  name: string
  inputUriPrefix: string
  collectionIds?: string[]
  namespaceIds?: string[]
}

// Real-time Types
export interface DocumentSnapshot {
  document: FirestoreDocument
  readTime: string
  changeType?: 'ADDED' | 'MODIFIED' | 'REMOVED'
}

export interface DocumentChange {
  type: 'added' | 'modified' | 'removed'
  doc: DocumentSnapshot
  oldIndex?: number
  newIndex?: number
}

// Settings Types
export interface FirestoreSettings {
  projectId: string
  databaseId: string
  host?: string
  ssl?: boolean
  timestampsInSnapshots?: boolean
  cacheSizeBytes?: number
  experimentalForceLongPolling?: boolean
  experimentalAutoDetectLongPolling?: boolean
  useFetchStreams?: boolean
}

// Pagination Types
export interface PaginationOptions {
  pageSize?: number
  pageToken?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  nextPageToken?: string
  hasMore: boolean
  totalCount?: number
}