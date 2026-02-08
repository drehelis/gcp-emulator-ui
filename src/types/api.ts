/**
 * API related TypeScript definitions
 * Request/Response types and API client configurations
 */

import type { AxiosRequestConfig } from 'axios'

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  errors?: ApiError[]
  metadata?: ResponseMetadata
}

export interface ResponseMetadata {
  timestamp: Date
  requestId: string
  version: string
  pagination?: PaginationMetadata
}

export interface PaginationMetadata {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
  nextPageToken?: string
  previousPageToken?: string
}

export interface ApiError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

// HTTP Client configuration
export interface HttpClientConfig extends AxiosRequestConfig {
  baseURL: string
  timeout: number
  retries: number
  retryDelay: number
  enableLogging: boolean
}

// Request/Response interceptor types
export interface RequestInterceptor {
  onFulfilled?: Function
  onRejected?: Function
}

export interface ResponseInterceptor {
  onFulfilled?: Function
  onRejected?: Function
}

// API endpoint definitions
export interface ApiEndpoints {
  // Projects
  getProjects: string
  getProject: Function

  // Topics
  getTopics: Function
  getTopic: Function
  createTopic: Function
  deleteTopic: Function
  updateTopic: Function

  // Subscriptions
  getSubscriptions: Function
  getSubscription: Function
  createSubscription: Function
  deleteSubscription: Function
  updateSubscription: Function

  // Messages
  publishMessages: Function
  pullMessages: Function
  acknowledgeMessages: Function
  modifyAckDeadline: Function

  // Schemas
  getSchemas: Function
  getSchema: Function
  createSchema: Function
  deleteSchema: Function
  validateSchema: Function
  validateMessage: Function

  // Snapshots
  getSnapshots: Function
  createSnapshot: Function
  deleteSnapshot: Function

  // Admin operations
  getIamPolicy: Function
  setIamPolicy: Function
  testIamPermissions: Function
}

// Query parameters for API requests
export interface QueryParams {
  [key: string]: string | number | boolean | string[] | undefined
}

// Common request options
export interface RequestOptions {
  params?: QueryParams
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

// Batch request types
export interface BatchRequest<T = any> {
  requests: T[]
  options?: {
    continueOnError?: boolean
    maxConcurrency?: number
  }
}

export interface BatchResponse<T = any> {
  results: (T | ApiError)[]
  summary: {
    total: number
    successful: number
    failed: number
  }
}

// WebSocket API types
export interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
}

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  id?: string
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in milliseconds
  maxSize: number
  strategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB'
}

// Rate limiting
export interface RateLimit {
  requests: number
  window: number // Window in milliseconds
}

// Authentication types
export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'oauth2' | 'service-account'
  token?: string
  apiKey?: string
  serviceAccount?: ServiceAccountConfig
}

export interface ServiceAccountConfig {
  projectId: string
  clientEmail: string
  privateKey: string
  privateKeyId: string
}

// Request tracking
export interface RequestTracker {
  id: string
  method: string
  url: string
  startTime: Date
  endTime?: Date
  duration?: number
  status?: number
  error?: ApiError
}

// Feature flags
export interface FeatureFlags {
  enableBatchOperations: boolean
  enableRealtimeUpdates: boolean
  enableSchemaValidation: boolean
  enableDeadLetterQueues: boolean
  maxConcurrentRequests: number
  defaultPageSize: number
}

// API client interface
export interface ApiClient {
  // Core HTTP methods
  get: Function
  post: Function
  put: Function
  patch: Function
  delete: Function

  // Batch operations
  batch: Function

  // Configuration
  configure: Function
  setAuth: Function

  // Request tracking
  getRequestHistory(): RequestTracker[]
  clearRequestHistory(): void
}

// Mock API types for development
export interface MockApiConfig {
  enabled: boolean
  delay: number
  failureRate: number
  dataPath: string
}

// API validation
export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean'
  properties?: Record<string, ValidationSchema>
  items?: ValidationSchema
  required?: string[]
  minimum?: number
  maximum?: number
  pattern?: string
  format?: string
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  version: string
  uptime: number
  checks: {
    database: 'ok' | 'error'
    redis: 'ok' | 'error'
    pubsub: 'ok' | 'error'
    [key: string]: 'ok' | 'error'
  }
}

// API versioning
export interface ApiVersion {
  version: string
  deprecated: boolean
  supportedUntil?: Date
  migrationGuide?: string
}
