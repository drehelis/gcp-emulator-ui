/**
 * Core Google Cloud Pub/Sub TypeScript definitions
 * Comprehensive type system for the Pub/Sub UI application
 */

// Base entity types
export interface BaseEntity {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  labels?: Record<string, string>
  etag?: string
}

// Project related types
export interface GCPProject extends BaseEntity {
  projectId: string
  displayName?: string
  state: ProjectState
  parent?: string
  createTime: string
  updateTime: string
  deleteTime?: string
  lifecycleState: ProjectLifecycleState
}

export type ProjectState = 'ACTIVE' | 'DELETE_REQUESTED'

export type ProjectLifecycleState =
  | 'LIFECYCLE_STATE_UNSPECIFIED'
  | 'ACTIVE'
  | 'DELETE_REQUESTED'
  | 'DELETE_IN_PROGRESS'

// Topic related types
export interface PubSubTopic extends BaseEntity {
  projectId: string
  fullName: string
  messageStoragePolicy?: MessageStoragePolicy
  kmsKeyName?: string
  schemaSettings?: SchemaSettings
  satisfiesPzs?: boolean
  messageRetentionDuration?: string
  ingestionDataSourceSettings?: IngestionDataSourceSettings
  state?: TopicState
  messageCount?: number
  subscriptionsCount?: number
}

export interface MessageStoragePolicy {
  allowedPersistenceRegions: string[]
}

export interface SchemaSettings {
  schema: string
  encoding: SchemaEncoding
  firstRevisionId?: string
  lastRevisionId?: string
}

export type SchemaEncoding = 'ENCODING_UNSPECIFIED' | 'JSON' | 'BINARY'

export interface IngestionDataSourceSettings {
  awsKinesis?: AwsKinesis
  cloudStorage?: CloudStorageConfig
}

export interface AwsKinesis {
  streamArn: string
  consumerArn: string
  awsRoleArn: string
  gcpServiceAccount: string
  state: IngestionDataSourceState
}

export interface CloudStorageConfig {
  bucket: string
  inputFormat?: InputFormat
  textConfig?: TextConfig
  avroConfig?: AvroConfig
}

export type IngestionDataSourceState =
  | 'STATE_UNSPECIFIED'
  | 'ACTIVE'
  | 'KINESIS_PERMISSION_DENIED'
  | 'PUBLISH_PERMISSION_DENIED'
  | 'STREAM_NOT_FOUND'
  | 'CONSUMER_NOT_FOUND'

export interface InputFormat {
  format: CloudStorageInputFormat
}

export type CloudStorageInputFormat = 'FORMAT_UNSPECIFIED' | 'AVRO' | 'TEXT'

export interface TextConfig {
  delimiter?: string
}

export interface AvroConfig {
  writeMetadata?: boolean
}

export type TopicState = 'ACTIVE' | 'INGESTION_RESOURCE_ERROR'

// Subscription related types
export interface PubSubSubscription extends BaseEntity {
  projectId: string
  topicName: string
  fullName: string
  pushConfig?: PushConfig
  bigqueryConfig?: BigQueryConfig
  cloudStorageConfig?: CloudStorageSubscriptionConfig
  ackDeadlineSeconds: number
  retainAckedMessages: boolean
  messageRetentionDuration: string
  filter?: string
  deadLetterPolicy?: DeadLetterPolicy
  retryPolicy?: RetryPolicy
  detached: boolean
  enableMessageOrdering: boolean
  expirationPolicy?: ExpirationPolicy
  topicMessageRetentionDuration?: string
  state?: SubscriptionState
  enableExactlyOnceDelivery?: boolean
  undeliveredMessageCount?: number
  messageCount?: number
}

export interface PushConfig {
  pushEndpoint: string
  attributes?: Record<string, string>
  oidcToken?: OidcToken
  pubsubWrapper?: PubsubWrapper
  noWrapper?: NoWrapper
}

export interface OidcToken {
  serviceAccountEmail: string
  audience?: string
}

export interface PubsubWrapper {
  // Empty message for Cloud Pub/Sub message wrapping
}

export interface NoWrapper {
  writeMetadata: boolean
}

export interface BigQueryConfig {
  table: string
  useTopicSchema?: boolean
  writeMetadata?: boolean
  dropUnknownFields?: boolean
  serviceAccountEmail?: string
}

export interface CloudStorageSubscriptionConfig {
  bucket: string
  filenamePrefix?: string
  filenameSuffix?: string
  maxDuration?: string
  maxBytes?: number
  state?: CloudStorageConfigState
  outputFormat?: OutputFormat
  serviceAccountEmail?: string
}

export interface OutputFormat {
  textConfig?: TextConfig
  avroConfig?: AvroConfig
}

export type CloudStorageConfigState =
  | 'STATE_UNSPECIFIED'
  | 'ACTIVE'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'

export interface DeadLetterPolicy {
  deadLetterTopic?: string
  maxDeliveryAttempts?: number
}

export interface RetryPolicy {
  minimumBackoff?: string
  maximumBackoff?: string
}

export interface ExpirationPolicy {
  ttl: string
}

export type SubscriptionState = 'STATE_UNSPECIFIED' | 'ACTIVE' | 'RESOURCE_ERROR'

// Message related types
export interface PubSubMessage {
  messageId: string
  data: string | Uint8Array
  attributes: Record<string, string>
  publishTime: Date
  orderingKey?: string
  deliveryAttempt?: number
  ackId?: string
}

export interface PublishRequest {
  topic: string
  messages: PubSubMessage[]
}

export interface PublishResponse {
  messageIds: string[]
}

export interface PullRequest {
  subscription: string
  maxMessages?: number
}

export interface PullResponse {
  receivedMessages: ReceivedMessage[]
}

export interface ReceivedMessage {
  ackId: string
  message: PubSubMessage
  deliveryAttempt: number
}

export interface AcknowledgeRequest {
  subscription: string
  ackIds: string[]
}

export interface ModifyAckDeadlineRequest {
  subscription: string
  ackIds: string[]
  ackDeadlineSeconds: number
}

// Schema related types
export interface Schema extends BaseEntity {
  projectId: string
  type: SchemaType
  definition: string
  revisionId?: string
  revisionCreateTime?: Date
}

export type SchemaType = 'TYPE_UNSPECIFIED' | 'PROTOCOL_BUFFER' | 'AVRO'

export interface ValidateSchemaRequest {
  parent: string
  schema: Schema
}

export interface ValidateSchemaResponse {
  // Empty response indicates successful validation
}

export interface ValidateMessageRequest {
  parent: string
  name?: string
  schema?: Schema
  message: Uint8Array
  encoding: SchemaEncoding
}

export interface ValidateMessageResponse {
  // Empty response indicates successful validation
}

// Snapshot related types
export interface Snapshot extends BaseEntity {
  projectId: string
  topicName: string
  fullName: string
  expireTime?: Date
}

// Metrics and monitoring types
export interface MetricValue {
  timestamp: Date
  value: number
}

export interface TopicMetrics {
  messageCount: MetricValue[]
  messageBytes: MetricValue[]
  publishMessageCount: MetricValue[]
  publishedMessageBytes: MetricValue[]
  publishRequestCount: MetricValue[]
}

export interface SubscriptionMetrics {
  messageCount: MetricValue[]
  oldestUnackedMessageAge: MetricValue[]
  unackedMessageCount: MetricValue[]
  pullMessageCount: MetricValue[]
  pullRequestCount: MetricValue[]
  pushMessageCount: MetricValue[]
  pushRequestCount: MetricValue[]
  deadLetterMessageCount?: MetricValue[]
  retainedAckedMessageCount?: MetricValue[]
  retainedAckedMessageBytes?: MetricValue[]
  streamingPullMessageCount?: MetricValue[]
  streamingPullRequestCount?: MetricValue[]
  deliveryAttemptCount?: MetricValue[]
}

// Search and filtering types
export interface SearchFilters {
  projectId?: string
  namePattern?: string
  labels?: Record<string, string>
  states?: string[]
  dateRange?: DateRange
}

export interface DateRange {
  start: Date
  end: Date
}

export interface SearchResult<T> {
  items: T[]
  totalCount: number
  nextPageToken?: string
}

export interface PaginationOptions {
  pageSize?: number
  pageToken?: string
  orderBy?: string
  filter?: string
}

// Configuration and settings types
export interface AppConfig {
  projectId: string
  refreshInterval: number
  maxMessages: number
  enableRealTimeUpdates: boolean
  theme: 'light' | 'dark' | 'auto'
  language: string
  timeZone: string
}

export interface NotificationSettings {
  enableToasts: boolean
  toastDuration: number
  enableSound: boolean
  enableDesktopNotifications: boolean
}

// Error handling types
export interface ApiError {
  code: number
  message: string
  details?: any[]
  timestamp: Date
  requestId?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Batch operation types
export interface BatchOperation<T> {
  id: string
  type: BatchOperationType
  status: BatchOperationStatus
  items: T[]
  progress: number
  errors: ApiError[]
  createdAt: Date
  completedAt?: Date
}

export type BatchOperationType =
  | 'CREATE_TOPICS'
  | 'DELETE_TOPICS'
  | 'CREATE_SUBSCRIPTIONS'
  | 'DELETE_SUBSCRIPTIONS'
  | 'PUBLISH_MESSAGES'

export type BatchOperationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// Real-time update types
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

export interface RealtimeUpdate {
  entity: 'topic' | 'subscription' | 'message'
  action: 'created' | 'updated' | 'deleted'
  data: any
  timestamp: Date
}

// Export/Import types
export interface ExportConfig {
  includeTopics: boolean
  includeSubscriptions: boolean
  includeSchemas: boolean
  format: 'json' | 'yaml' | 'terraform'
  compression: 'none' | 'gzip' | 'zip'
}

export interface ImportConfig {
  overwriteExisting: boolean
  dryRun: boolean
  validateOnly: boolean
}

export interface ExportResult {
  filename: string
  size: number
  downloadUrl: string
  expiresAt: Date
}

// UI State types
export interface UIState {
  loading: boolean
  error?: ApiError | null
  selectedProject?: GCPProject | null
  selectedTopic?: PubSubTopic | null
  selectedSubscription?: PubSubSubscription | null
  sidebarCollapsed: boolean
  modalStack: string[]
}

// Form types for creating/editing entities
export interface CreateTopicForm {
  name: string
  projectId: string
  labels?: Record<string, string>
  messageStoragePolicy?: {
    allowedPersistenceRegions: string[]
  }
  kmsKeyName?: string
  schemaSettings?: {
    schema: string
    encoding: SchemaEncoding
  }
}

// API Request interface (simpler than form)
export interface CreateTopicRequest {
  name: string
  labels?: Record<string, string>
  messageRetentionDuration?: string
  schemaSettings?: {
    schema: string
    encoding: SchemaEncoding
  }
}

export interface CreateSubscriptionRequest {
  name: string
  topic: string
  ackDeadlineSeconds?: number
  retainAckedMessages?: boolean
  messageRetentionDuration?: string
  enableMessageOrdering?: boolean
  labels?: Record<string, string>
  filter?: string
  pushConfig?: {
    pushEndpoint: string
    attributes?: Record<string, string>
  }
  bigqueryConfig?: {
    table: string
    useTopicSchema?: boolean
    writeMetadata?: boolean
    dropUnknownFields?: boolean
    serviceAccountEmail?: string
  }
  deadLetterPolicy?: {
    deadLetterTopic?: string
    maxDeliveryAttempts?: number
  }
  retryPolicy?: {
    minimumBackoff?: string
    maximumBackoff?: string
  }
}

export interface CreateSubscriptionForm {
  name: string
  projectId: string
  topicName: string
  pushConfig?: {
    pushEndpoint: string
    attributes?: Record<string, string>
    oidcToken?: {
      serviceAccountEmail: string
      audience?: string
    }
  }
  bigqueryConfig?: {
    table: string
    useTopicSchema?: boolean
    writeMetadata?: boolean
    dropUnknownFields?: boolean
  }
  ackDeadlineSeconds: number
  retainAckedMessages: boolean
  messageRetentionDuration: string
  filter?: string
  deadLetterPolicy?: {
    deadLetterTopic?: string
    maxDeliveryAttempts?: number
  }
  retryPolicy?: {
    minimumBackoff?: string
    maximumBackoff?: string
  }
  enableMessageOrdering: boolean
  enableExactlyOnceDelivery: boolean
  labels?: Record<string, string>
}

export interface PublishMessageForm {
  topicName: string
  data: string
  attributes: Record<string, string>
  orderingKey?: string
}

// Analytics and reporting types
export interface AnalyticsData {
  timeRange: DateRange
  topicMetrics: Record<string, TopicMetrics>
  subscriptionMetrics: Record<string, SubscriptionMetrics>
  summary: {
    totalTopics: number
    totalSubscriptions: number
    totalMessages: number
    errorRate: number
  }
}

export interface ReportConfig {
  entities: ('topics' | 'subscriptions' | 'schemas')[]
  metrics: string[]
  timeRange: DateRange
  format: 'pdf' | 'excel' | 'csv'
  includeCharts: boolean
}
