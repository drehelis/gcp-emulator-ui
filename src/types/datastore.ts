/**
 * Google Cloud Datastore types for Datastore emulator integration
 * Note: Datastore mode API is similar to Firestore but with different terminology
 */

// Core Datastore Entity Types
export interface DatastoreEntity {
  key: DatastoreKey
  properties: Record<string, DatastoreValue>
}

export interface DatastoreKey {
  path: PathElement[]
  partitionId?: PartitionId
}

export interface PathElement {
  kind: string
  id?: string
  name?: string
}

export interface PartitionId {
  projectId: string
  namespaceId?: string
}

export interface DatastoreValue {
  nullValue?: null
  booleanValue?: boolean
  integerValue?: string
  doubleValue?: number
  timestampValue?: string
  stringValue?: string
  blobValue?: string
  entityValue?: DatastoreEntity
  arrayValue?: {
    values: DatastoreValue[]
  }
  keyValue?: DatastoreKey
  geoPointValue?: {
    latitude: number
    longitude: number
  }
  excludeFromIndexes?: boolean
}

// Query Types
export interface DatastoreQuery {
  kind?: {
    name: string
  }[]
  filter?: DatastoreFilter
  order?: PropertyOrder[]
  projection?: Projection[]
  distinctOn?: PropertyReference[]
  startCursor?: string
  endCursor?: string
  offset?: number
  limit?: number
}

export interface DatastoreFilter {
  compositeFilter?: {
    op: 'AND' | 'OR'
    filters: DatastoreFilter[]
  }
  propertyFilter?: {
    property: PropertyReference
    op: 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'EQUAL' | 'HAS_ANCESTOR' | 'IN' | 'NOT_EQUAL' | 'NOT_IN'
    value: DatastoreValue
  }
}

export interface PropertyOrder {
  property: PropertyReference
  direction: 'ASCENDING' | 'DESCENDING'
}

export interface Projection {
  property: PropertyReference
}

export interface PropertyReference {
  name: string
}

// Request/Response Types
export interface LookupRequest {
  keys: DatastoreKey[]
  readOptions?: ReadOptions
}

export interface LookupResponse {
  found: EntityResult[]
  missing: EntityResult[]
  deferred: DatastoreKey[]
}

export interface EntityResult {
  entity: DatastoreEntity
  version?: string
  cursor?: string
}

export interface RunQueryRequest {
  partitionId?: PartitionId
  query?: DatastoreQuery
  gqlQuery?: GqlQuery
  readOptions?: ReadOptions
}

export interface RunQueryResponse {
  batch: QueryResultBatch
  query?: DatastoreQuery
}

export interface QueryResultBatch {
  entityResults: EntityResult[]
  endCursor?: string
  moreResults: 'NOT_FINISHED' | 'MORE_RESULTS_AFTER_LIMIT' | 'MORE_RESULTS_AFTER_CURSOR' | 'NO_MORE_RESULTS'
  skippedResults?: number
  skippedCursor?: string
}

export interface GqlQuery {
  queryString: string
  allowLiterals?: boolean
  namedBindings?: Record<string, GqlQueryParameter>
  positionalBindings?: GqlQueryParameter[]
}

export interface GqlQueryParameter {
  value?: DatastoreValue
  cursor?: string
}

export interface ReadOptions {
  readConsistency?: 'STRONG' | 'EVENTUAL'
  transaction?: string
  readTime?: string
}

// Mutation Types
export interface CommitRequest {
  mode: 'NON_TRANSACTIONAL' | 'TRANSACTIONAL'
  mutations: Mutation[]
  transaction?: string
}

export interface CommitResponse {
  mutationResults: MutationResult[]
  indexUpdates?: number
}

export interface Mutation {
  insert?: DatastoreEntity
  update?: DatastoreEntity
  upsert?: DatastoreEntity
  delete?: DatastoreKey
  baseVersion?: string
}

export interface MutationResult {
  key?: DatastoreKey
  version?: string
  conflictDetected?: boolean
}

// Transaction Types
export interface BeginTransactionRequest {
  transactionOptions?: TransactionOptions
}

export interface BeginTransactionResponse {
  transaction: string
}

export interface TransactionOptions {
  readWrite?: {
    previousTransaction?: string
  }
  readOnly?: {
    readTime?: string
  }
}

export interface RollbackRequest {
  transaction: string
}

// Allocation Types
export interface AllocateIdsRequest {
  keys: DatastoreKey[]
}

export interface AllocateIdsResponse {
  keys: DatastoreKey[]
}

export interface ReserveIdsRequest {
  keys: DatastoreKey[]
  databaseId?: string
}

export interface ReserveIdsResponse {
  // Empty response
}

// Import/Export Types
export interface ExportEntitiesRequest {
  outputUrlPrefix: string
  entityFilter?: EntityFilter
  labels?: Record<string, string>
}

export interface ImportEntitiesRequest {
  inputUrl: string
  entityFilter?: EntityFilter
  labels?: Record<string, string>
}

export interface EntityFilter {
  kinds?: string[]
  namespaceIds?: string[]
}

// Index Types
export interface DatastoreIndex {
  projectId: string
  indexId: string
  kind: string
  ancestor: 'NONE' | 'ALL_ANCESTORS'
  properties: IndexProperty[]
  state: 'CREATING' | 'READY' | 'DELETING' | 'ERROR'
}

export interface IndexProperty {
  name: string
  direction: 'ASCENDING' | 'DESCENDING'
}

// Error Types
export interface DatastoreError {
  code: number
  message: string
  status: string
  details?: any[]
}

// Statistics Types
export interface DatastoreStatistics {
  count: number
  entityCount: number
  bytes: number
}

export interface KindStatistics {
  kind: string
  entityCount: number
  bytes: number
}

export interface NamespaceStatistics {
  namespaceId: string
  entityCount: number
  bytes: number
}

// UI Helper Types
export interface DatastoreEntityWithMetadata extends DatastoreEntity {
  id: string
  kind: string
  namespace?: string
  path: string
  size?: number
  isExpanded?: boolean
}

export interface DatastoreKindWithMetadata {
  name: string
  entityCount: number
  bytes: number
  namespace?: string
  statistics?: KindStatistics
  isExpanded?: boolean
}

export interface DatastoreNamespace {
  name: string
  kinds: string[]
  entityCount: number
  bytes: number
}

// Query Builder Types
export interface DatastoreQueryBuilder {
  kind: string
  namespace?: string
  filters: DatastoreQueryFilter[]
  orderBy: DatastoreQueryOrderBy[]
  limit?: number
  offset?: number
  startCursor?: string
  endCursor?: string
}

export interface DatastoreQueryFilter {
  property: string
  operator: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'not-in' | 'has-ancestor'
  value: any
}

export interface DatastoreQueryOrderBy {
  property: string
  direction: 'asc' | 'desc'
}

// List kinds response
export interface ListKindsResponse {
  kinds: string[]
}

// List namespaces response
export interface ListNamespacesResponse {
  namespaces: string[]
}

// Settings Types
export interface DatastoreSettings {
  projectId: string
  namespaceId?: string
  host?: string
  port?: number
}
