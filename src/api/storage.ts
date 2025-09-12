/**
 * Cloud Storage API client for fake-gcs-server integration
 * Provides comprehensive storage management functionality
 */

import axios, { type AxiosInstance } from 'axios'
import type {
  StorageBucket,
  StorageObject,
  ListBucketsResponse,
  ListObjectsResponse,
  CreateBucketRequest,
  UploadObjectRequest,
  DownloadObjectRequest,
  ListObjectsRequest,
  DeleteObjectRequest,
  UploadProgress
} from '@/types'

// Create storage-specific axios instance - same pattern as PubSub
const storageClient = axios.create({
  baseURL: '/storage',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const getApi = () => storageClient

// Bucket Management
export const storageApi = {
  async listBuckets(options: {
    maxResults?: number
    pageToken?: string
    project?: string
  } = {}): Promise<ListBucketsResponse> {
    const api = getApi()
    const response = await api.get('/v1/b', {
      params: {
        maxResults: options.maxResults || 1000,
        pageToken: options.pageToken,
        project: options.project || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project'
      }
    })

    return {
      kind: response.data.kind || 'storage#buckets',
      items: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
      prefixes: response.data.prefixes
    }
  },

  async getBucket(bucketName: string, options: {
    projection?: 'full' | 'noAcl'
    ifMetagenerationMatch?: string
    ifMetagenerationNotMatch?: string
    userProject?: string
  } = {}): Promise<StorageBucket> {
    const api = getApi()
    const response = await api.get(`/v1/b/${encodeURIComponent(bucketName)}`, {
      params: {
        projection: options.projection || 'full',
        ifMetagenerationMatch: options.ifMetagenerationMatch,
        ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
        userProject: options.userProject
      }
    })

    return response.data
  },

  async createBucket(request: CreateBucketRequest): Promise<StorageBucket> {
    const api = getApi()
    const { name, location, storageClass, iamConfiguration, ...options } = request

    const bucketData: Partial<StorageBucket> = {
      name,
      location: location || 'US',
      storageClass: storageClass || 'STANDARD',
      iamConfiguration: iamConfiguration
    }

    const response = await api.post('/v1/b', bucketData, {
      params: {
        project: options.project || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project',
        predefinedAcl: options.predefinedAcl,
        predefinedDefaultObjectAcl: options.predefinedDefaultObjectAcl,
        projection: options.projection || 'full',
        userProject: options.userProject
      }
    })

    return response.data
  },

  async deleteBucket(bucketName: string, options: {
    ifMetagenerationMatch?: string
    ifMetagenerationNotMatch?: string
    userProject?: string
  } = {}): Promise<void> {
    const api = getApi()
    await api.delete(`/b/${encodeURIComponent(bucketName)}`, {
      params: {
        ifMetagenerationMatch: options.ifMetagenerationMatch,
        ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
        userProject: options.userProject
      }
    })
  },

  // Object Management
  async listObjects(request: ListObjectsRequest): Promise<ListObjectsResponse> {
    const api = getApi()
    const response = await api.get(`/b/${encodeURIComponent(request.bucket)}/o`, {
      params: {
        delimiter: request.delimiter,
        prefix: request.prefix,
        maxResults: request.maxResults || 1000,
        pageToken: request.pageToken,
        projection: request.projection || 'full',
        versions: request.versions,
        userProject: request.userProject
      }
    })

    return {
      kind: response.data.kind || 'storage#objects',
      items: response.data.items || [],
      prefixes: response.data.prefixes || [],
      nextPageToken: response.data.nextPageToken
    }
  },

  async getObject(bucket: string, objectName: string, options: {
    generation?: string
    projection?: 'full' | 'noAcl'
    ifGenerationMatch?: string
    ifGenerationNotMatch?: string
    ifMetagenerationMatch?: string
    ifMetagenerationNotMatch?: string
    userProject?: string
  } = {}): Promise<StorageObject> {
    const api = getApi()
    const response = await api.get(`/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}`, {
      params: {
        generation: options.generation,
        projection: options.projection || 'full',
        ifGenerationMatch: options.ifGenerationMatch,
        ifGenerationNotMatch: options.ifGenerationNotMatch,
        ifMetagenerationMatch: options.ifMetagenerationMatch,
        ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
        userProject: options.userProject
      }
    })

    return response.data
  },

  async uploadObject(
    file: File,
    request: UploadObjectRequest,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageObject> {
    const api = getApi()
    const formData = new FormData()

    // Add metadata
    const metadata: Partial<StorageObject> = {
      name: request.name,
      contentType: request.contentType || file.type,
      contentEncoding: request.contentEncoding,
      metadata: request.metadata
    }

    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    const response = await api.post(
      `/b/${encodeURIComponent(request.bucket)}/o`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          uploadType: request.uploadType || 'multipart',
          predefinedAcl: request.predefinedAcl,
          ifGenerationMatch: request.ifGenerationMatch,
          ifGenerationNotMatch: request.ifGenerationNotMatch,
          ifMetagenerationMatch: request.ifMetagenerationMatch,
          ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
          kmsKeyName: request.kmsKeyName,
          userProject: request.userProject
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
              file,
              status: progressEvent.loaded === progressEvent.total ? 'completed' : 'uploading'
            }
            onProgress(progress)
          }
        }
      }
    )

    return response.data
  },

  async downloadObject(request: DownloadObjectRequest): Promise<Blob> {
    const api = getApi()
    const response = await api.get(`/b/${encodeURIComponent(request.bucket)}/o/${encodeURIComponent(request.object)}`, {
      params: {
        alt: request.alt || 'media',
        generation: request.generation,
        ifGenerationMatch: request.ifGenerationMatch,
        ifGenerationNotMatch: request.ifGenerationNotMatch,
        ifMetagenerationMatch: request.ifMetagenerationMatch,
        ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
        projection: request.projection,
        userProject: request.userProject
      },
      responseType: 'blob'
    })

    return response.data
  },

  async deleteObject(request: DeleteObjectRequest): Promise<void> {
    const api = getApi()
    await api.delete(`/b/${encodeURIComponent(request.bucket)}/o/${encodeURIComponent(request.object)}`, {
      params: {
        generation: request.generation,
        ifGenerationMatch: request.ifGenerationMatch,
        ifGenerationNotMatch: request.ifGenerationNotMatch,
        ifMetagenerationMatch: request.ifMetagenerationMatch,
        ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
        userProject: request.userProject
      }
    })
  },

  async copyObject(
    sourceBucket: string,
    sourceObject: string,
    destinationBucket: string,
    destinationObject: string,
    options: {
      ifGenerationMatch?: string
      ifGenerationNotMatch?: string
      ifMetagenerationMatch?: string
      ifMetagenerationNotMatch?: string
      ifSourceGenerationMatch?: string
      ifSourceGenerationNotMatch?: string
      ifSourceMetagenerationMatch?: string
      ifSourceMetagenerationNotMatch?: string
      projection?: 'full' | 'noAcl'
      sourceGeneration?: string
      userProject?: string
      metadata?: Record<string, string>
    } = {}
  ): Promise<StorageObject> {
    const api = getApi()
    const requestBody: any = {}

    if (options.metadata) {
      requestBody.metadata = options.metadata
    }

    const response = await api.post(
      `/b/${encodeURIComponent(sourceBucket)}/o/${encodeURIComponent(sourceObject)}/copyTo/b/${encodeURIComponent(destinationBucket)}/o/${encodeURIComponent(destinationObject)}`,
      requestBody,
      {
        params: {
          ifGenerationMatch: options.ifGenerationMatch,
          ifGenerationNotMatch: options.ifGenerationNotMatch,
          ifMetagenerationMatch: options.ifMetagenerationMatch,
          ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
          ifSourceGenerationMatch: options.ifSourceGenerationMatch,
          ifSourceGenerationNotMatch: options.ifSourceGenerationNotMatch,
          ifSourceMetagenerationMatch: options.ifSourceMetagenerationMatch,
          ifSourceMetagenerationNotMatch: options.ifSourceMetagenerationNotMatch,
          projection: options.projection || 'full',
          sourceGeneration: options.sourceGeneration,
          userProject: options.userProject
        }
      }
    )

    return response.data
  },

  // Utility methods
  getObjectDownloadUrl(bucket: string, objectName: string): string {
    return `/storage/download/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
  },

  getObjectPreviewUrl(bucket: string, objectName: string): string {
    return `/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
  },

  // Batch operations
  async deleteMultipleObjects(bucket: string, objectNames: string[]): Promise<void> {
    const deletePromises = objectNames.map(objectName =>
      this.deleteObject({ bucket, object: objectName })
    )

    await Promise.all(deletePromises)
  },

  async uploadMultipleFiles(
    files: File[],
    bucket: string,
    options: Omit<UploadObjectRequest, 'bucket' | 'name'> = {},
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<StorageObject[]> {
    const progressMap = new Map<string, UploadProgress>()

    const uploadPromises = files.map(async (file, index) => {
      const request: UploadObjectRequest = {
        ...options,
        bucket,
        name: file.name,
        contentType: file.type
      }

      return this.uploadObject(file, request, (progress) => {
        progressMap.set(file.name, progress)
        if (onProgress) {
          onProgress(Array.from(progressMap.values()))
        }
      })
    })

    return Promise.all(uploadPromises)
  },

  // Health check for fake-gcs-server
  async healthCheck(): Promise<boolean> {
    try {
      const api = getApi()
      await api.get('/storage/', { timeout: 5000 })
      return true
    } catch (error) {
      console.warn('Storage emulator health check failed:', error)
      return false
    }
  }
}

export default storageApi