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
    info: vi.fn(),
  }),
}))

// Mock the storage API
vi.mock('@/api/storage', () => ({
  default: {
    listBuckets: vi.fn(),
    getBucket: vi.fn(),
    listObjects: vi.fn(),
    getObjectDownloadUrl: vi.fn(),
    getObjectPreviewUrl: vi.fn(),
  },
}))

describe('useStorageStore Folder Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchObjects assigns fullPath to folders', async () => {
    vi.mocked(storageApi.listObjects).mockResolvedValue({
      items: [],
      prefixes: ['folder1/', 'folder2/'],
    })

    const store = useStorageStore()
    await store.fetchObjects('my-bucket')

    expect(store.objects).toHaveLength(2)
    const folder1 = store.objects.find(o => o.name === 'folder1')
    expect(folder1).toBeDefined()
    expect(folder1?.isFolder).toBe(true)
    expect(folder1?.fullPath).toBe('folder1/')
  })

  it('selectAllObjects includes folders', async () => {
    vi.mocked(storageApi.listObjects).mockResolvedValue({
      items: [
        {
          name: 'file1.txt',
          size: '100',
          contentType: 'text/plain',
          bucket: 'my-bucket',
          storageClass: 'STANDARD',
          timeCreated: '',
          updated: '',
        },
      ],
      prefixes: ['folder1/'],
    })
    vi.mocked(storageApi.getObjectDownloadUrl).mockReturnValue('url')

    const store = useStorageStore()
    await store.fetchObjects('my-bucket')

    store.selectAllObjects()

    expect(store.selectedObjects).toHaveLength(2)
    expect(store.selectedObjects).toContain('file1.txt') // Full path for file in root is name
    expect(store.selectedObjects).toContain('folder1/')
  })
})
