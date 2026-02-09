/**
 * Storage store
 * Manages Cloud Storage buckets, objects, and operations state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  StorageBucket,
  StorageObject,
  StorageObjectWithPreview,
  BucketStatistics,
  ObjectBreadcrumb,
  UploadProgress,
  StorageSettings,
  CreateBucketRequest,
  UploadObjectRequest,
  ListObjectsRequest,
  BaseStoreState,
} from '@/types'
import { useProjectsStore } from './projects'
import { useAppStore } from './app'
import storageApi from '@/api/storage'
import { getStorageErrorMessage } from '@/utils/errorMessages'

export const useStorageStore = defineStore('storage', () => {
  const projectsStore = useProjectsStore()
  const appStore = useAppStore()

  // Base state
  const state = ref<BaseStoreState>({
    state: 'idle',
    error: null,
    lastUpdated: null,
  })

  // Core data
  const buckets = ref<StorageBucket[]>([])
  const currentBucket = ref<StorageBucket | null>(null)
  const objects = ref<StorageObjectWithPreview[]>([])
  const currentPath = ref<string>('')
  const breadcrumbs = ref<ObjectBreadcrumb[]>([])

  // Statistics and metadata
  const bucketStatistics = ref<BucketStatistics | null>(null)
  const uploadProgress = ref<UploadProgress[]>([])

  // Loading states
  const loading = ref({
    buckets: false,
    objects: false,
    upload: false,
    download: false,
    delete: false,
    create: false,
  })

  // UI state
  const selectedObjects = ref<string[]>([])
  const viewMode = ref<'grid' | 'list'>(
    ((): 'grid' | 'list' => {
      const saved = localStorage.getItem('storage-view-mode')
      return saved === 'grid' || saved === 'list' ? saved : 'list'
    })()
  )
  const sortBy = ref<'name' | 'size' | 'modified'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  // Pagination
  const pagination = ref({
    hasMore: false,
    nextPageToken: undefined as string | undefined,
  })

  // Settings
  const settings = ref<StorageSettings>({
    defaultStorageClass: 'STANDARD',
    enableVersioning: false,
    retentionPolicyDays: undefined,
    enableCors: false,
    corsOrigins: [],
    enableWebsite: false,
    websiteMainPage: undefined,
    websiteErrorPage: undefined,
  })

  // Computed properties
  const hasCurrentBucket = computed(() => currentBucket.value !== null)

  const sortedObjects = computed(() => {
    if (!objects.value) return []

    const sorted = [...objects.value].sort((a, b) => {
      let aValue: any = a[sortBy.value]
      let bValue: any = b[sortBy.value]

      // Handle special cases
      if (sortBy.value === 'size') {
        aValue = parseInt(a.size || '0')
        bValue = parseInt(b.size || '0')
      } else if (sortBy.value === 'modified') {
        aValue = new Date(a.updated || a.timeCreated || 0)
        bValue = new Date(b.updated || b.timeCreated || 0)
      } else if (sortBy.value === 'name') {
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
      }

      if (sortOrder.value === 'desc') {
        return bValue > aValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })

    // Always show folders first
    return sorted.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return 0
    })
  })

  const filteredObjects = computed(() => {
    return sortedObjects.value
  })

  const isLoading = computed(() => {
    return Object.values(loading.value).some(l => l)
  })

  const hasError = computed(() => state.value.error !== null)

  const currentProjectId = computed(() => {
    return projectsStore.selectedProjectId
  })

  // Actions
  async function fetchBuckets(refresh = false): Promise<void> {
    if (loading.value.buckets && !refresh) return

    try {
      loading.value.buckets = true
      state.value.error = null

      const response = await storageApi.listBuckets({
        project: currentProjectId.value || undefined,
      })

      buckets.value = response.items || []
      state.value.state = 'success'
      state.value.lastUpdated = new Date()
    } catch (error: any) {
      console.error('Error fetching buckets:', error)
      state.value.error = error.message || 'Failed to fetch buckets'
      state.value.state = 'error'

      appStore.showToast({
        type: 'error',
        title: 'Error Loading Buckets',
        message: error.message || 'Failed to fetch buckets',
      })
    } finally {
      loading.value.buckets = false
    }
  }

  async function fetchBucket(bucketName: string): Promise<void> {
    try {
      loading.value.buckets = true
      state.value.error = null

      const bucket = await storageApi.getBucket(bucketName)
      currentBucket.value = bucket

      // Update bucket in list if it exists
      const index = buckets.value.findIndex(b => b.name === bucketName)
      if (index !== -1) {
        buckets.value[index] = bucket
      } else {
        buckets.value.push(bucket)
      }
    } catch (error: any) {
      console.error('Error fetching bucket:', error)
      state.value.error = error.message || 'Failed to fetch bucket'

      appStore.showToast({
        type: 'error',
        title: 'Error Loading Bucket',
        message: error.message || 'Failed to fetch bucket details',
      })
    } finally {
      loading.value.buckets = false
    }
  }

  async function createBucket(request: CreateBucketRequest, silent = false): Promise<void> {
    try {
      loading.value.create = true
      state.value.error = null

      const bucket = await storageApi.createBucket(request)
      buckets.value.push(bucket)
      currentBucket.value = bucket

      if (!silent) {
        appStore.showToast({
          type: 'success',
          title: 'Bucket Created',
          message: `Bucket "${bucket.name}" created successfully`,
        })
      }
    } catch (error: any) {
      console.error('Error creating bucket:', error)
      const meaningfulMessage = getStorageErrorMessage(error, 'create bucket')
      state.value.error = meaningfulMessage

      if (!silent) {
        appStore.showToast({
          type: 'error',
          title: 'Error Creating Bucket',
          message: meaningfulMessage,
        })
      }
      throw error
    } finally {
      loading.value.create = false
    }
  }

  async function deleteBucket(bucketName: string): Promise<void> {
    try {
      loading.value.delete = true
      state.value.error = null

      // First, get all objects in the bucket and delete them
      const allObjects: string[] = []
      let pageToken: string | undefined = undefined

      // Fetch all objects in the bucket (handle pagination)
      do {
        const response = await storageApi.listObjects({
          bucket: bucketName,
          maxResults: 1000,
          pageToken,
        })

        if (response.items && response.items.length > 0) {
          // Get object names, excluding folders
          const objectNames = response.items
            .filter(obj => !obj.name.endsWith('/'))
            .map(obj => obj.name)
          allObjects.push(...objectNames)
        }

        pageToken = response.nextPageToken
      } while (pageToken)

      // Delete all objects if any exist
      if (allObjects.length > 0) {
        await storageApi.deleteMultipleObjects(bucketName, allObjects)
      }

      // Now delete the empty bucket
      await storageApi.deleteBucket(bucketName)

      // Remove from local state
      buckets.value = buckets.value.filter(b => b.name !== bucketName)
      if (currentBucket.value?.name === bucketName) {
        currentBucket.value = null
        objects.value = []
        currentPath.value = ''
        breadcrumbs.value = []
      }

      appStore.showToast({
        type: 'success',
        title: 'Bucket Deleted',
        message: `Bucket "${bucketName}" and all its contents deleted successfully`,
      })
    } catch (error: any) {
      console.error('Error deleting bucket:', error)
      state.value.error = error.message || 'Failed to delete bucket'

      appStore.showToast({
        type: 'error',
        title: 'Error Deleting Bucket',
        message: error.message || 'Failed to delete bucket',
      })
      throw error
    } finally {
      loading.value.delete = false
    }
  }

  async function fetchObjects(
    bucketName: string,
    prefix: string = '',
    refresh = false
  ): Promise<void> {
    if (loading.value.objects && !refresh) return

    try {
      loading.value.objects = true
      state.value.error = null

      const request: ListObjectsRequest = {
        bucket: bucketName,
        prefix,
        delimiter: '/',
        maxResults: 1000,
        ...(pagination.value.nextPageToken && { pageToken: pagination.value.nextPageToken }),
      }

      const response = await storageApi.listObjects(request)

      // Process objects and add preview info
      const processedObjects: StorageObjectWithPreview[] = []

      // Add folders (prefixes)
      if (response.prefixes) {
        for (const prefix of response.prefixes) {
          // Remove trailing slash from prefix
          const cleanPrefix = prefix.replace(/\/$/, '')

          // Extract only the folder name (not the full path)
          // If we're at prefix "5/" and get "5/service/", we want just "service"
          const folderName = cleanPrefix.substring(request.prefix?.length || 0)

          processedObjects.push({
            name: folderName,
            fullPath: prefix,
            bucket: bucketName,
            isFolder: true,
            size: '0',
            contentType: 'folder',
          })
        }
      }

      // Add files
      if (response.items) {
        for (const item of response.items) {
          // Extract only the filename (not the full path) for display
          const fileName = item.name.substring(request.prefix?.length || 0)

          const preview = getObjectPreview(item)
          processedObjects.push({
            ...item,
            name: fileName, // Use relative filename for display
            fullPath: item.name, // Keep full path for API operations
            isFolder: false,
            downloadUrl: storageApi.getObjectDownloadUrl(bucketName, item.name),
            ...(preview && { preview }),
          })
        }
      }

      if (refresh) {
        objects.value = processedObjects
      } else {
        objects.value.push(...processedObjects)
      }

      currentPath.value = prefix
      updateBreadcrumbs(prefix)

      // Update pagination
      pagination.value.hasMore = !!response.nextPageToken
      pagination.value.nextPageToken = response.nextPageToken

      // Calculate statistics
      calculateBucketStatistics()

      state.value.state = 'success'
      state.value.lastUpdated = new Date()
    } catch (error: any) {
      console.error('Error fetching objects:', error)
      state.value.error = error.message || 'Failed to fetch objects'
      state.value.state = 'error'

      appStore.showToast({
        type: 'error',
        title: 'Error Loading Objects',
        message: error.message || 'Failed to fetch objects',
      })
    } finally {
      loading.value.objects = false
    }
  }

  async function uploadFiles(
    files: File[],
    bucketName: string,
    prefix: string = '',
    silent: boolean = false
  ): Promise<void> {
    try {
      loading.value.upload = true
      state.value.error = null

      // Initialize progress tracking
      uploadProgress.value = files.map(file => ({
        loaded: 0,
        total: file.size,
        percentage: 0,
        file,
        status: 'pending',
      }))

      const uploadPromises = files.map(async (file, index) => {
        const objectName = prefix ? `${prefix}${file.name}` : file.name
        const request: UploadObjectRequest = {
          bucket: bucketName,
          name: objectName,
          contentType: file.type,
        }

        try {
          if (uploadProgress.value[index]) {
            uploadProgress.value[index].status = 'uploading'
          }

          const result = await storageApi.uploadObject(file, request, progress => {
            if (uploadProgress.value[index]) {
              uploadProgress.value[index] = { ...progress, status: 'uploading' }
            }
          })

          if (uploadProgress.value[index]) {
            uploadProgress.value[index].status = 'completed'
          }
          return result
        } catch (error: any) {
          if (uploadProgress.value[index]) {
            uploadProgress.value[index].status = 'error'
            uploadProgress.value[index].error = error.message
          }
          throw error
        }
      })

      await Promise.all(uploadPromises)

      // Refresh objects list
      await fetchObjects(bucketName, prefix, true)

      if (!silent) {
        appStore.showToast({
          type: 'success',
          title: 'Upload Complete',
          message: `Successfully uploaded ${files.length} file${files.length === 1 ? '' : 's'}`,
        })
      }
    } catch (error: any) {
      console.error('Error uploading files:', error)
      state.value.error = error.message || 'Failed to upload files'

      if (!silent) {
        appStore.showToast({
          type: 'error',
          title: 'Upload Error',
          message: error.message || 'Failed to upload files',
        })
      }
      throw error
    } finally {
      loading.value.upload = false
      // Clear progress after a delay
      setTimeout(() => {
        uploadProgress.value = []
      }, 3000)
    }
  }

  async function downloadObject(bucketName: string, objectName: string): Promise<void> {
    try {
      loading.value.download = true
      state.value.error = null

      const blob = await storageApi.downloadObject({
        bucket: bucketName,
        object: objectName,
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = objectName.split('/').pop() || objectName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      appStore.showToast({
        type: 'success',
        title: 'Download Complete',
        message: `Downloaded "${objectName}"`,
      })
    } catch (error: any) {
      console.error('Error downloading object:', error)
      state.value.error = error.message || 'Failed to download object'

      appStore.showToast({
        type: 'error',
        title: 'Download Error',
        message: error.message || 'Failed to download object',
      })
      throw error
    } finally {
      loading.value.download = false
    }
  }

  async function deleteObjects(bucketName: string, objectNames: string[]): Promise<void> {
    try {
      loading.value.delete = true
      state.value.error = null

      // 1. Identify objects from the current list
      const objectsToDelete = objects.value.filter(obj => {
        const identifier = obj.fullPath || obj.name
        return objectNames.includes(identifier) || objectNames.includes(obj.name)
      })

      // 2. Collect all actual object paths to delete (handling folders recursively)
      const allPathsToDelete: string[] = []

      for (const obj of objectsToDelete) {
        if (obj.isFolder) {
          // For folders, we must list and delete all contents
          // The folder itself might be a 0-byte object, which will be returned in the list if it exists
          const prefix = obj.fullPath || obj.name
          let pageToken: string | undefined = undefined

          do {
            const response = await storageApi.listObjects({
              bucket: bucketName,
              prefix: prefix,
              // No delimiter means recursive listing
              maxResults: 1000,
              pageToken,
            })

            if (response.items) {
              const paths = response.items.map(item => item.name)
              allPathsToDelete.push(...paths)
            }

            pageToken = response.nextPageToken
          } while (pageToken)
        } else {
          // For regular files, just add the path
          allPathsToDelete.push(obj.fullPath || obj.name)
        }
      }

      // Remove duplicates
      const uniquePathsToDelete = [...new Set(allPathsToDelete)]

      if (uniquePathsToDelete.length > 0) {
        await storageApi.deleteMultipleObjects(bucketName, uniquePathsToDelete)
      }

      // Remove from local state
      objects.value = objects.value.filter(obj => {
        const identifier = obj.fullPath || obj.name
        return !objectNames.includes(identifier) && !objectNames.includes(obj.name)
      })
      selectedObjects.value = []

      // Check if we need to navigate up after deleting the last file in a folder
      const remainingFiles = objects.value.filter(obj => !obj.isFolder)
      if (remainingFiles.length === 0 && currentPath.value) {
        // Navigate to parent directory
        const pathParts = currentPath.value.split('/').filter(part => part)
        const parentPath = pathParts.length > 1 ? `${pathParts.slice(0, -1).join('/')}/` : ''

        // Fetch parent directory contents
        if (currentBucket.value) {
          await fetchObjects(currentBucket.value.name, parentPath, true)
        }
      }

      appStore.showToast({
        type: 'success',
        title: 'Objects Deleted',
        message: `Successfully deleted ${objectNames.length} objects`,
      })
    } catch (error: any) {
      console.error('Error deleting objects:', error)
      state.value.error = error.message || 'Failed to delete objects'

      appStore.showToast({
        type: 'error',
        title: 'Delete Error',
        message: error.message || 'Failed to delete objects',
      })
      throw error
    } finally {
      loading.value.delete = false
    }
  }

  // Helper functions
  function updateBreadcrumbs(path: string): void {
    breadcrumbs.value = []

    if (!path) return

    const parts = path.split('/').filter(part => part)
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part) {
        currentPath += `${part}/`
        breadcrumbs.value.push({
          name: part,
          path: currentPath,
          isLast: i === parts.length - 1,
        })
      }
    }
  }

  function getObjectPreview(obj: StorageObject): string | undefined {
    if (!obj.contentType) return undefined

    if (obj.contentType.startsWith('image/')) {
      return storageApi.getObjectPreviewUrl(obj.bucket, obj.name)
    }

    return undefined
  }

  function calculateBucketStatistics(): void {
    if (!objects.value.length) {
      bucketStatistics.value = null
      return
    }

    const stats: BucketStatistics = {
      objectCount: objects.value.filter(obj => !obj.isFolder).length,
      totalSize: 0,
      averageObjectSize: 0,
      storageClasses: {},
      contentTypes: {},
    }

    let lastModified: Date | undefined

    for (const obj of objects.value) {
      if (obj.isFolder) continue

      const size = parseInt(obj.size || '0')
      stats.totalSize += size

      // Storage class
      const storageClass = obj.storageClass || 'STANDARD'
      stats.storageClasses[storageClass] = (stats.storageClasses[storageClass] || 0) + 1

      // Content type
      const contentType = obj.contentType || 'unknown'
      stats.contentTypes[contentType] = (stats.contentTypes[contentType] || 0) + 1

      // Last modified
      const modified = obj.updated || obj.timeCreated
      if (modified) {
        const modifiedDate = new Date(modified)
        if (!lastModified || modifiedDate > lastModified) {
          lastModified = modifiedDate
        }
      }
    }

    stats.averageObjectSize = stats.objectCount > 0 ? stats.totalSize / stats.objectCount : 0
    if (lastModified) {
      stats.lastModified = lastModified.toISOString()
    }

    bucketStatistics.value = stats
  }

  // UI actions
  function setSortBy(field: 'name' | 'size' | 'modified'): void {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
  }

  function setViewMode(mode: 'grid' | 'list'): void {
    viewMode.value = mode
    localStorage.setItem('storage-view-mode', mode)
  }

  function selectObject(objectName: string): void {
    const index = selectedObjects.value.indexOf(objectName)
    if (index === -1) {
      selectedObjects.value.push(objectName)
    } else {
      selectedObjects.value.splice(index, 1)
    }
  }

  function selectAllObjects(): void {
    selectedObjects.value = objects.value.map(obj => obj.fullPath || obj.name)
  }

  function clearSelection(): void {
    selectedObjects.value = []
  }

  function clearCurrentPath(): void {
    currentPath.value = ''
    breadcrumbs.value = []
    selectedObjects.value = []
  }

  function reset(): void {
    buckets.value = []
    currentBucket.value = null
    objects.value = []
    currentPath.value = ''
    breadcrumbs.value = []
    bucketStatistics.value = null
    selectedObjects.value = []
    uploadProgress.value = []
    pagination.value = {
      hasMore: false,
      nextPageToken: undefined,
    }
    state.value = {
      state: 'idle',
      error: null,
      lastUpdated: null,
    }
  }

  return {
    // State
    state: computed(() => state.value),
    buckets: computed(() => buckets.value),
    currentBucket: computed(() => currentBucket.value),
    objects: filteredObjects,
    currentPath: computed(() => currentPath.value),
    breadcrumbs: computed(() => breadcrumbs.value),
    bucketStatistics: computed(() => bucketStatistics.value),
    uploadProgress: computed(() => uploadProgress.value),
    loading: computed(() => loading.value),
    selectedObjects: computed(() => selectedObjects.value),
    viewMode: computed(() => viewMode.value),
    sortBy: computed(() => sortBy.value),
    sortOrder: computed(() => sortOrder.value),
    pagination: computed(() => pagination.value),
    settings: computed(() => settings.value),

    // Computed
    hasCurrentBucket,
    isLoading,
    hasError,
    currentProjectId,

    // Actions
    fetchBuckets,
    fetchBucket,
    createBucket,
    deleteBucket,
    fetchObjects,
    uploadFiles,
    downloadObject,
    deleteObjects,
    setSortBy,
    setViewMode,
    selectObject,
    selectAllObjects,
    clearSelection,
    clearCurrentPath,
    reset,
  }
})
