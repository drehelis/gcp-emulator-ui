/**
 * Tests for Cloud Storage store
 * GCS bucket and object management state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStorageStore } from '../storage'
import storageApi from '@/api/storage'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}))

// Mock the storage API
vi.mock('@/api/storage', () => ({
  default: {
    listBuckets: vi.fn(),
    getBucket: vi.fn(),
    createBucket: vi.fn(),
    deleteBucket: vi.fn(),
    listObjects: vi.fn(),
    uploadObject: vi.fn(),
    downloadObject: vi.fn(),
    deleteMultipleObjects: vi.fn(),
    getObjectDownloadUrl: vi.fn(),
    getObjectPreviewUrl: vi.fn()
  }
}))

describe('useStorageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty buckets initially', () => {
      const store = useStorageStore()
      expect(store.buckets).toEqual([])
    })

    it('has no current bucket initially', () => {
      const store = useStorageStore()
      expect(store.currentBucket).toBeNull()
      expect(store.hasCurrentBucket).toBe(false)
    })

    it('has empty objects initially', () => {
      const store = useStorageStore()
      expect(store.objects).toEqual([])
    })

    it('has default view mode of list', () => {
      const store = useStorageStore()
      expect(store.viewMode).toBe('list')
    })

    it('loads view mode from localStorage if available', () => {
      localStorage.setItem('storage-view-mode', 'grid')
      const store = useStorageStore()
      expect(store.viewMode).toBe('grid')
    })

    it('has default sort by name ascending', () => {
      const store = useStorageStore()
      expect(store.sortBy).toBe('name')
      expect(store.sortOrder).toBe('asc')
    })

    it('has no loading state initially', () => {
      const store = useStorageStore()
      expect(store.isLoading).toBe(false)
    })

    it('has no error initially', () => {
      const store = useStorageStore()
      expect(store.hasError).toBe(false)
    })
  })

  describe('setViewMode', () => {
    it('sets view mode to grid', () => {
      const store = useStorageStore()
      store.setViewMode('grid')
      expect(store.viewMode).toBe('grid')
    })

    it('sets view mode to list', () => {
      const store = useStorageStore()
      store.setViewMode('grid')
      store.setViewMode('list')
      expect(store.viewMode).toBe('list')
    })

    it('persists view mode to localStorage', () => {
      const store = useStorageStore()
      store.setViewMode('grid')
      expect(localStorage.getItem('storage-view-mode')).toBe('grid')
    })
  })

  describe('setSortBy', () => {
    it('changes sort field', () => {
      const store = useStorageStore()
      store.setSortBy('size')
      expect(store.sortBy).toBe('size')
    })

    it('toggles order when clicking same field', () => {
      const store = useStorageStore()
      expect(store.sortOrder).toBe('asc')
      
      store.setSortBy('name') // Same field
      expect(store.sortOrder).toBe('desc')
      
      store.setSortBy('name') // Same field again
      expect(store.sortOrder).toBe('asc')
    })

    it('resets to ascending when changing fields', () => {
      const store = useStorageStore()
      store.setSortBy('name') // Already name, toggles to desc
      expect(store.sortOrder).toBe('desc')
      
      store.setSortBy('size') // Different field, resets to asc
      expect(store.sortOrder).toBe('asc')
    })
  })

  describe('selectObject', () => {
    it('adds object to selection', () => {
      const store = useStorageStore()
      store.selectObject('file1.txt')
      expect(store.selectedObjects).toContain('file1.txt')
    })

    it('removes object from selection when already selected', () => {
      const store = useStorageStore()
      store.selectObject('file1.txt')
      store.selectObject('file1.txt')
      expect(store.selectedObjects).not.toContain('file1.txt')
    })

    it('supports multiple selections', () => {
      const store = useStorageStore()
      store.selectObject('file1.txt')
      store.selectObject('file2.txt')
      expect(store.selectedObjects).toHaveLength(2)
    })
  })

  describe('clearSelection', () => {
    it('clears all selected objects', () => {
      const store = useStorageStore()
      store.selectObject('file1.txt')
      store.selectObject('file2.txt')
      
      store.clearSelection()
      expect(store.selectedObjects).toHaveLength(0)
    })
  })

  describe('clearCurrentPath', () => {
    it('clears current path and breadcrumbs', () => {
      const store = useStorageStore()
      // Simulate state
      store.selectObject('file.txt')
      
      store.clearCurrentPath()
      
      expect(store.currentPath).toBe('')
      expect(store.breadcrumbs).toHaveLength(0)
      expect(store.selectedObjects).toHaveLength(0)
    })
  })

  describe('reset', () => {
    it('resets entire store state', () => {
      const store = useStorageStore()
      
      // Verify reset clears state
      store.reset()
      
      expect(store.buckets).toEqual([])
      expect(store.currentBucket).toBeNull()
      expect(store.objects).toEqual([])
      expect(store.currentPath).toBe('')
      expect(store.breadcrumbs).toHaveLength(0)
      expect(store.selectedObjects).toHaveLength(0)
      expect(store.hasError).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('isLoading reflects any loading state', () => {
      const store = useStorageStore()
      expect(store.isLoading).toBe(false)
      
      // Note: loading states are internal, this tests the computed property exists
      expect(typeof store.isLoading).toBe('boolean')
    })

    it('hasCurrentBucket reflects current bucket presence', () => {
      const store = useStorageStore()
      expect(store.hasCurrentBucket).toBe(false)
    })
  })

  describe('settings', () => {
    it('has default storage settings', () => {
      const store = useStorageStore()
      
      expect(store.settings.defaultStorageClass).toBe('STANDARD')
      expect(store.settings.enableVersioning).toBe(false)
      expect(store.settings.enableCors).toBe(false)
    })
  })

  describe('pagination', () => {
    it('has default pagination state', () => {
      const store = useStorageStore()
      
      expect(store.pagination.hasMore).toBe(false)
      expect(store.pagination.nextPageToken).toBeUndefined()
    })
  })

  describe('fetchBuckets', () => {
    it('populates buckets from API', async () => {
      vi.mocked(storageApi.listBuckets).mockResolvedValue({
        items: [
          { name: 'bucket1', selfLink: '', timeCreated: '', updated: '' },
          { name: 'bucket2', selfLink: '', timeCreated: '', updated: '' }
        ]
      })

      const store = useStorageStore()
      await store.fetchBuckets()
      
      expect(store.buckets).toHaveLength(2)
      expect(store.buckets[0].name).toBe('bucket1')
    })

    it('handles empty response', async () => {
      vi.mocked(storageApi.listBuckets).mockResolvedValue({})

      const store = useStorageStore()
      await store.fetchBuckets()
      
      expect(store.buckets).toEqual([])
    })

    it('sets error state on failure', async () => {
      vi.mocked(storageApi.listBuckets).mockRejectedValue(new Error('API error'))

      const store = useStorageStore()
      await store.fetchBuckets()
      
      expect(store.hasError).toBe(true)
    })
  })

  describe('fetchBucket', () => {
    it('sets current bucket from API', async () => {
      const mockBucket = { name: 'my-bucket', selfLink: '', timeCreated: '', updated: '' }
      vi.mocked(storageApi.getBucket).mockResolvedValue(mockBucket)

      const store = useStorageStore()
      await store.fetchBucket('my-bucket')
      
      expect(store.currentBucket).toEqual(mockBucket)
      expect(store.hasCurrentBucket).toBe(true)
    })

    it('adds bucket to list if not exists', async () => {
      const mockBucket = { name: 'new-bucket', selfLink: '', timeCreated: '', updated: '' }
      vi.mocked(storageApi.getBucket).mockResolvedValue(mockBucket)

      const store = useStorageStore()
      await store.fetchBucket('new-bucket')
      
      expect(store.buckets).toContainEqual(mockBucket)
    })

  })

  describe('createBucket', () => {
    it('creates bucket and adds to list', async () => {
      const mockBucket = { name: 'new-bucket', selfLink: '', timeCreated: '', updated: '' }
      vi.mocked(storageApi.createBucket).mockResolvedValue(mockBucket)

      const store = useStorageStore()
      await store.createBucket({ name: 'new-bucket' })
      
      expect(store.buckets).toContainEqual(mockBucket)
      expect(store.currentBucket).toEqual(mockBucket)
    })

    it('throws on API error', async () => {
      vi.mocked(storageApi.createBucket).mockRejectedValue(new Error('Creation failed'))

      const store = useStorageStore()
      
      await expect(store.createBucket({ name: 'fail-bucket' }))
        .rejects.toThrow()
    })
  })

  describe('uploadProgress', () => {
    it('is empty initially', () => {
      const store = useStorageStore()
      expect(store.uploadProgress).toEqual([])
    })
  })

  describe('bucketStatistics', () => {
    it('is null initially', () => {
      const store = useStorageStore()
      expect(store.bucketStatistics).toBeNull()
    })
  })

  describe('loading states', () => {
    it('exposes individual loading states', () => {
      const store = useStorageStore()
      
      expect(store.loading.buckets).toBe(false)
      expect(store.loading.objects).toBe(false)
      expect(store.loading.upload).toBe(false)
      expect(store.loading.download).toBe(false)
      expect(store.loading.delete).toBe(false)
      expect(store.loading.create).toBe(false)
    })
  })

  describe('state management', () => {
    it('tracks base state', () => {
      const store = useStorageStore()
      
      expect(store.state.state).toBe('idle')
      expect(store.state.error).toBeNull()
    })
  })

  describe('deleteBucket', () => {
    it('removes bucket from list on success', async () => {
      const mockBucket = { name: 'bucket-to-delete', selfLink: '', timeCreated: '', updated: '' }
      
      vi.mocked(storageApi.createBucket).mockResolvedValue(mockBucket)
      vi.mocked(storageApi.listObjects).mockResolvedValue({ items: [], prefixes: [] })
      vi.mocked(storageApi.deleteMultipleObjects).mockResolvedValue({ success: [], errors: [] })
      vi.mocked(storageApi.deleteBucket).mockResolvedValue()

      const store = useStorageStore()
      await store.createBucket({ name: 'bucket-to-delete' })
      expect(store.buckets).toHaveLength(1)
      
      await store.deleteBucket('bucket-to-delete')
      expect(store.buckets).toHaveLength(0)
    })
  })

  describe('fetchBuckets error handling', () => {
    it('handles API error gracefully', async () => {
      vi.mocked(storageApi.listBuckets).mockRejectedValue(new Error('Network error'))

      const store = useStorageStore()
      await store.fetchBuckets()
      
      expect(store.hasError).toBe(true)
    })
  })

  describe('fetchBucket details', () => {
    it('fetches single bucket and sets as current', async () => {
      const mockBucket = { name: 'my-bucket', selfLink: '', timeCreated: '', updated: '' }
      vi.mocked(storageApi.getBucket).mockResolvedValue(mockBucket)
      vi.mocked(storageApi.listObjects).mockResolvedValue({ items: [], prefixes: [] })

      const store = useStorageStore()
      await store.fetchBucket('my-bucket')
      
      expect(store.currentBucket?.name).toBe('my-bucket')
    })
  })

  describe('currentPath', () => {
    it('is empty initially', () => {
      const store = useStorageStore()
      expect(store.currentPath).toBe('')
    })
  })

  describe('breadcrumbs', () => {
    it('is empty initially', () => {
      const store = useStorageStore()
      expect(store.breadcrumbs).toEqual([])
    })
  })

  describe('pagination', () => {
    it('has default pagination state', () => {
      const store = useStorageStore()
      expect(store.pagination.hasMore).toBe(false)
      expect(store.pagination.nextPageToken).toBeUndefined()
    })
  })

  describe('isLoading computed', () => {
    it('returns false by default', () => {
      const store = useStorageStore()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('currentProjectId computed', () => {
    it('returns projects store selectedProjectId', () => {
      const store = useStorageStore()
      // currentProjectId depends on projectsStore
      expect(store.currentProjectId).toBeNull()
    })
  })
})

