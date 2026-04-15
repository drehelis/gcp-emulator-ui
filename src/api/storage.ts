import axios from 'axios'
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
} from '@/types'

const storageClient = axios.create({
  baseURL: import.meta.env.VITE_STORAGE_BASE_URL || '/storage',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const storageApi = {
  async listBuckets(
    options: {
      maxResults?: number
      pageToken?: string
      project?: string
    } = {}
  ): Promise<ListBucketsResponse> {
    const response = await storageClient.get('/storage/v1/b', {
      params: {
        maxResults: options.maxResults || 1000,
        pageToken: options.pageToken,
        project: options.project || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project',
      },
    })

    return {
      kind: response.data.kind || 'storage#buckets',
      items: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
      prefixes: response.data.prefixes,
    }
  },

  async getBucket(
    bucketName: string,
    options: {
      projection?: 'full' | 'noAcl'
      ifMetagenerationMatch?: string
      ifMetagenerationNotMatch?: string
      userProject?: string
    } = {}
  ): Promise<StorageBucket> {
    const response = await storageClient.get(`/storage/v1/b/${encodeURIComponent(bucketName)}`, {
      params: {
        projection: options.projection || 'full',
        ifMetagenerationMatch: options.ifMetagenerationMatch,
        ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
        userProject: options.userProject,
      },
    })

    return response.data
  },

  async createBucket(request: CreateBucketRequest): Promise<StorageBucket> {
    const { name, location, storageClass, iamConfiguration, ...options } = request

    const bucketData: Partial<StorageBucket> = {
      name,
      location: location || 'US',
      storageClass: storageClass || 'STANDARD',
      ...(iamConfiguration && { iamConfiguration }),
    }

    const response = await storageClient.post('/storage/v1/b', bucketData, {
      params: {
        project: options.project || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project',
        predefinedAcl: options.predefinedAcl,
        predefinedDefaultObjectAcl: options.predefinedDefaultObjectAcl,
        projection: options.projection || 'full',
        userProject: options.userProject,
      },
    })

    return response.data
  },

  async deleteBucket(
    bucketName: string,
    options: {
      ifMetagenerationMatch?: string
      ifMetagenerationNotMatch?: string
      userProject?: string
    } = {}
  ): Promise<void> {
    await storageClient.delete(`/storage/v1/b/${encodeURIComponent(bucketName)}`, {
      params: {
        ifMetagenerationMatch: options.ifMetagenerationMatch,
        ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
        userProject: options.userProject,
      },
    })
  },

  async createNotification(
    bucketName: string,
    config: import('@/types').NotificationConfigRequest
  ): Promise<import('@/types').NotificationConfig> {
    const response = await storageClient.post(
      `/storage/v1/b/${encodeURIComponent(bucketName)}/notificationConfigs`,
      config
    )
    return response.data
  },

  async listNotifications(bucketName: string): Promise<import('@/types').NotificationConfig[]> {
    const response = await storageClient.get(
      `/storage/v1/b/${encodeURIComponent(bucketName)}/notificationConfigs`
    )
    return response.data.items || []
  },

  async deleteNotification(bucketName: string, notificationId: string): Promise<void> {
    await storageClient.delete(
      `/storage/v1/b/${encodeURIComponent(bucketName)}/notificationConfigs/${encodeURIComponent(notificationId)}`
    )
  },

  async listObjects(request: ListObjectsRequest): Promise<ListObjectsResponse> {
    const response = await storageClient.get(
      `/storage/v1/b/${encodeURIComponent(request.bucket)}/o`,
      {
        params: {
          delimiter: request.delimiter,
          prefix: request.prefix,
          maxResults: request.maxResults || 1000,
          pageToken: request.pageToken,
          projection: request.projection || 'full',
          versions: request.versions,
          userProject: request.userProject,
        },
      }
    )

    return {
      kind: response.data.kind || 'storage#objects',
      items: response.data.items || [],
      prefixes: response.data.prefixes || [],
      nextPageToken: response.data.nextPageToken,
    }
  },

  async getObject(
    bucket: string,
    objectName: string,
    options: {
      generation?: string
      projection?: 'full' | 'noAcl'
      ifGenerationMatch?: string
      ifGenerationNotMatch?: string
      ifMetagenerationMatch?: string
      ifMetagenerationNotMatch?: string
      userProject?: string
    } = {}
  ): Promise<StorageObject> {
    const response = await storageClient.get(
      `/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}`,
      {
        params: {
          generation: options.generation,
          projection: options.projection || 'full',
          ifGenerationMatch: options.ifGenerationMatch,
          ifGenerationNotMatch: options.ifGenerationNotMatch,
          ifMetagenerationMatch: options.ifMetagenerationMatch,
          ifMetagenerationNotMatch: options.ifMetagenerationNotMatch,
          userProject: options.userProject,
        },
      }
    )

    return response.data
  },

  async uploadObject(
    file: File,
    request: UploadObjectRequest,
    onProgress?: (_progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<StorageObject> {
    try {
      const response = await storageClient.post(
        `/upload/storage/v1/b/${encodeURIComponent(request.bucket)}/o`,
        file,
        {
          headers: {
            'Content-Type': request.contentType || file.type || 'application/octet-stream',
          },
          params: {
            name: request.name,
            uploadType: 'media',
            predefinedAcl: request.predefinedAcl,
            ifGenerationMatch: request.ifGenerationMatch,
            ifGenerationNotMatch: request.ifGenerationNotMatch,
            ifMetagenerationMatch: request.ifMetagenerationMatch,
            ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
            kmsKeyName: request.kmsKeyName,
            userProject: request.userProject,
          },
          onUploadProgress: progressEvent => {
            if (onProgress && progressEvent.total) {
              const loaded = progressEvent.loaded
              const total = progressEvent.total
              const percentage = Math.round((loaded * 100) / total)
              onProgress({ loaded, total, percentage })
            }
          },
        }
      )

      return response.data
    } catch {
      const formData = new FormData()

      const metadata: Partial<StorageObject> = {
        name: request.name,
        contentType: request.contentType || file.type,
        ...(request.contentEncoding && { contentEncoding: request.contentEncoding }),
        ...(request.metadata && { metadata: request.metadata }),
      }

      formData.append('file', file)
      formData.append('metadata', JSON.stringify(metadata))

      const response = await storageClient.post(
        `/upload/storage/v1/b/${encodeURIComponent(request.bucket)}/o`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            uploadType: 'multipart',
            predefinedAcl: request.predefinedAcl,
            ifGenerationMatch: request.ifGenerationMatch,
            ifGenerationNotMatch: request.ifGenerationNotMatch,
            ifMetagenerationMatch: request.ifMetagenerationMatch,
            ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
            kmsKeyName: request.kmsKeyName,
            userProject: request.userProject,
          },
          onUploadProgress: progressEvent => {
            if (onProgress && progressEvent.total) {
              const loaded = progressEvent.loaded
              const total = progressEvent.total
              const percentage = Math.round((loaded * 100) / total)
              onProgress({ loaded, total, percentage })
            }
          },
        }
      )

      return response.data
    }
  },

  async downloadObject(request: DownloadObjectRequest): Promise<Blob> {
    const response = await storageClient.get(
      `/storage/v1/b/${encodeURIComponent(request.bucket)}/o/${encodeURIComponent(request.object)}`,
      {
        params: {
          alt: request.alt || 'media',
          generation: request.generation,
          ifGenerationMatch: request.ifGenerationMatch,
          ifGenerationNotMatch: request.ifGenerationNotMatch,
          ifMetagenerationMatch: request.ifMetagenerationMatch,
          ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
          projection: request.projection,
          userProject: request.userProject,
        },
        responseType: 'blob',
      }
    )

    return response.data
  },

  async deleteObject(request: DeleteObjectRequest): Promise<void> {
    await storageClient.delete(
      `/storage/v1/b/${encodeURIComponent(request.bucket)}/o/${encodeURIComponent(request.object)}`,
      {
        params: {
          generation: request.generation,
          ifGenerationMatch: request.ifGenerationMatch,
          ifGenerationNotMatch: request.ifGenerationNotMatch,
          ifMetagenerationMatch: request.ifMetagenerationMatch,
          ifMetagenerationNotMatch: request.ifMetagenerationNotMatch,
          userProject: request.userProject,
        },
      }
    )
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
    const requestBody: Record<string, any> = {}

    if (options.metadata) {
      requestBody.metadata = options.metadata
    }

    const response = await storageClient.post(
      `/storage/v1/b/${encodeURIComponent(sourceBucket)}/o/${encodeURIComponent(sourceObject)}/copyTo/b/${encodeURIComponent(destinationBucket)}/o/${encodeURIComponent(destinationObject)}`,
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
          userProject: options.userProject,
        },
      }
    )

    return response.data
  },

  getObjectDownloadUrl(bucket: string, objectName: string): string {
    const baseUrl = import.meta.env.VITE_STORAGE_BASE_URL || '/storage'
    return `${baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
  },

  getObjectPreviewUrl(bucket: string, objectName: string): string {
    const baseUrl = import.meta.env.VITE_STORAGE_BASE_URL || '/storage'
    return `${baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
  },

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
    onProgress?: () => void
  ): Promise<StorageObject[]> {
    const uploadPromises = files.map(async file => {
      const request: UploadObjectRequest = {
        ...options,
        bucket,
        name: file.name,
        contentType: file.type,
      }

      return this.uploadObject(file, request, () => {
        if (onProgress) {
          onProgress()
        }
      })
    })

    return Promise.all(uploadPromises)
  },

  async downloadObjectsAsZip(
    bucketName: string,
    objectNames: string[],
    onProgress?: (_progress: { current: number; total: number; currentFile: string }) => void
  ): Promise<Blob> {
    const JSZip = (await import('jszip')).default

    if (objectNames.length === 0) {
      throw new Error('No objects selected for download')
    }

    const zip = new JSZip()

    for (let i = 0; i < objectNames.length; i++) {
      const objectName = objectNames[i]

      if (onProgress && objectName) {
        onProgress({
          current: i + 1,
          total: objectNames.length,
          currentFile: objectName,
        })
      }

      try {
        const blob = await this.downloadObject({
          bucket: bucketName,
          object: objectName || '',
        })

        if (objectName) {
          zip.file(objectName, blob)
        }
      } catch (error) {
        console.warn(`Failed to download object ${objectName}:`, error)
      }
    }

    return await zip.generateAsync({ type: 'blob' })
  },

  async downloadBucketAsZip(
    bucketName: string,
    onProgress?: (_progress: { current: number; total: number; currentFile: string }) => void
  ): Promise<Blob> {
    const objectsResponse = await this.listObjects({ bucket: bucketName, maxResults: 0 })
    const objects = objectsResponse.items || []

    if (objects.length === 0) {
      throw new Error('Bucket is empty or no objects found')
    }

    return await this.downloadObjectsAsZip(
      bucketName,
      objects.map(obj => obj.name),
      onProgress
    )
  },

  async healthCheck(): Promise<boolean> {
    try {
      await storageClient.get('/storage/v1/b', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  },

  async deleteAll(): Promise<void> {
    await storageClient.post('/_internal/delete_all')
  },
}

export default storageApi
