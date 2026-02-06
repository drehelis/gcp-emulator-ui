/**
 * Google Cloud Storage types for fake-gcs-server integration
 */

export interface StorageBucket {
  id?: string
  selfLink?: string
  name: string
  projectNumber?: string
  metageneration?: string
  location?: string
  storageClass?: string
  etag?: string
  defaultEventBasedHold?: boolean
  retentionPolicy?: {
    retentionPeriod?: string
    effectiveTime?: string
    isLocked?: boolean
  }
  timeCreated?: string
  updated?: string
  defaultObjectAcl?: Array<{
    kind?: string
    id?: string
    selfLink?: string
    bucket?: string
    entity?: string
    role?: string
    etag?: string
  }>
  acl?: Array<{
    kind?: string
    id?: string
    selfLink?: string
    bucket?: string
    entity?: string
    role?: string
    etag?: string
  }>
  lifecycle?: {
    rule?: Array<{
      action?: {
        type?: string
        storageClass?: string
      }
      condition?: {
        age?: number
        createdBefore?: string
        customTimeBefore?: string
        daysSinceCustomTime?: number
        daysSinceNoncurrentTime?: number
        isLive?: boolean
        matchesPattern?: string
        matchesPrefix?: string[]
        matchesStorageClass?: string[]
        matchesSuffix?: string[]
        noncurrentTimeBefore?: string
        numNewerVersions?: number
      }
    }>
  }
  cors?: Array<{
    origin?: string[]
    method?: string[]
    responseHeader?: string[]
    maxAgeSeconds?: number
  }>
  website?: {
    mainPageSuffix?: string
    notFoundPage?: string
  }
  versioning?: {
    enabled?: boolean
  }
  logging?: {
    logBucket?: string
    logObjectPrefix?: string
  }
  encryption?: {
    defaultKmsKeyName?: string
  }
  billing?: {
    requesterPays?: boolean
  }
  iamConfiguration?: {
    uniformBucketLevelAccess?: {
      enabled?: boolean
      lockedTime?: string
    }
    publicAccessPrevention?: 'enforced' | 'inherited'
  }
  labels?: Record<string, string>
}

export interface StorageObject {
  kind?: string
  id?: string
  selfLink?: string
  mediaLink?: string
  name: string
  bucket: string
  generation?: string
  metageneration?: string
  contentType?: string
  storageClass?: string
  size?: string
  md5Hash?: string
  crc32c?: string
  etag?: string
  timeCreated?: string
  updated?: string
  timeDeleted?: string
  temporaryHold?: boolean
  eventBasedHold?: boolean
  retentionExpirationTime?: string
  metadata?: Record<string, string>
  acl?: Array<{
    kind?: string
    id?: string
    selfLink?: string
    bucket?: string
    object?: string
    generation?: string
    entity?: string
    role?: string
    etag?: string
  }>
  owner?: {
    entity?: string
    entityId?: string
  }
  customTime?: string
  componentCount?: number
  contentEncoding?: string
  contentDisposition?: string
  contentLanguage?: string
  cacheControl?: string
}

export interface ListBucketsResponse {
  kind?: string
  nextPageToken?: string
  items?: StorageBucket[]
  prefixes?: string[]
}

export interface ListObjectsResponse {
  kind?: string
  nextPageToken?: string
  prefixes?: string[]
  items?: StorageObject[]
}

export interface StorageError {
  error: {
    code: number
    message: string
    errors?: Array<{
      message: string
      domain: string
      reason: string
      location?: string
      locationType?: string
    }>
  }
}

// Request/Response types for specific operations
export interface CreateBucketRequest {
  name: string
  location?: string
  storageClass?: string
  iamConfiguration?: {
    uniformBucketLevelAccess?: {
      enabled?: boolean
    }
    publicAccessPrevention?: 'enforced' | 'inherited'
  }
  project?: string
  predefinedAcl?: string
  predefinedDefaultObjectAcl?: string
  projection?: 'full' | 'noAcl'
  userProject?: string
}

export interface UploadObjectRequest {
  bucket: string
  name: string
  uploadType?: 'media' | 'multipart' | 'resumable'
  contentType?: string
  contentEncoding?: string
  metadata?: Record<string, string>
  predefinedAcl?: string
  ifGenerationMatch?: string
  ifGenerationNotMatch?: string
  ifMetagenerationMatch?: string
  ifMetagenerationNotMatch?: string
  kmsKeyName?: string
  userProject?: string
}

export interface DownloadObjectRequest {
  bucket: string
  object: string
  generation?: string
  ifGenerationMatch?: string
  ifGenerationNotMatch?: string
  ifMetagenerationMatch?: string
  ifMetagenerationNotMatch?: string
  projection?: 'full' | 'noAcl'
  userProject?: string
  alt?: 'media' | 'json'
}

export interface ListObjectsRequest {
  bucket: string
  delimiter?: string
  prefix?: string
  maxResults?: number
  pageToken?: string
  projection?: 'full' | 'noAcl'
  versions?: boolean
  userProject?: string
}

export interface DeleteObjectRequest {
  bucket: string
  object: string
  generation?: string
  ifGenerationMatch?: string
  ifGenerationNotMatch?: string
  ifMetagenerationMatch?: string
  ifMetagenerationNotMatch?: string
  userProject?: string
}

// UI-specific types
export interface StorageObjectWithPreview extends StorageObject {
  isFolder?: boolean
  preview?: string
  thumbnailUrl?: string
  downloadUrl?: string
  fullPath?: string // Original full path for API operations
}

export interface BucketStatistics {
  objectCount: number
  totalSize: number
  lastModified?: string
  averageObjectSize: number
  storageClasses: Record<string, number>
  contentTypes: Record<string, number>
}

export interface ObjectBreadcrumb {
  name: string
  path: string
  isLast: boolean
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface StorageSettings {
  defaultStorageClass: string
  enableVersioning: boolean
  retentionPolicyDays?: number
  enableCors: boolean
  corsOrigins: string[]
  enableWebsite: boolean
  websiteMainPage?: string
  websiteErrorPage?: string
}

// Store state types
export interface StorageState {
  buckets: StorageBucket[]
  currentBucket: StorageBucket | null
  objects: StorageObjectWithPreview[]
  currentPath: string
  breadcrumbs: ObjectBreadcrumb[]
  bucketStatistics: BucketStatistics | null
  uploadProgress: UploadProgress[]
  loading: {
    buckets: boolean
    objects: boolean
    upload: boolean
    download: boolean
    delete: boolean
    create: boolean
  }
  error: string | null
  pagination: {
    hasMore: boolean
    nextPageToken?: string
  }
  settings: StorageSettings
  selectedObjects: string[]
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'size' | 'modified'
  sortOrder: 'asc' | 'desc'
}
