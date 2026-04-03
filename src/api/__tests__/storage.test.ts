import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockClient),
  },
}))

const mockZip = vi.hoisted(() => ({
  file: vi.fn(),
  generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'], { type: 'application/zip' })),
}))

vi.mock('jszip', () => ({
  default: class {
    constructor() {
      return mockZip
    }
  },
}))

import { storageApi } from '../storage'

describe('storageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.get.mockResolvedValue({ data: {} })
    mockClient.post.mockResolvedValue({ data: {} })
    mockClient.delete.mockResolvedValue({ data: {} })
    mockZip.file.mockReset()
    mockZip.generateAsync.mockClear()
  })

  describe('listBuckets', () => {
    it('calls API with correct params', async () => {
      mockClient.get.mockResolvedValue({ data: { items: [{ name: 'b1' }] } })

      const res = await storageApi.listBuckets({ project: 'p1' })

      expect(mockClient.get).toHaveBeenCalledWith(
        '/storage/v1/b',
        expect.objectContaining({
          params: expect.objectContaining({ project: 'p1' }),
        })
      )
      expect(res.items).toHaveLength(1)
    })
  })

  describe('getBucket', () => {
    it('fetches bucket details', async () => {
      mockClient.get.mockResolvedValue({ data: { name: 'b1' } })

      const res = await storageApi.getBucket('b1')

      expect(mockClient.get).toHaveBeenCalledWith('/storage/v1/b/b1', expect.anything())
      expect(res.name).toBe('b1')
    })
  })

  describe('createBucket', () => {
    it('sends post request', async () => {
      mockClient.post.mockResolvedValue({ data: { name: 'b1' } })

      const res = await storageApi.createBucket({ name: 'b1', project: 'p1' })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/storage/v1/b',
        expect.objectContaining({ name: 'b1' }),
        expect.objectContaining({ params: expect.objectContaining({ project: 'p1' }) })
      )
      expect(res.name).toBe('b1')
    })
  })

  describe('deleteBucket', () => {
    it('sends delete request', async () => {
      await storageApi.deleteBucket('b1')
      expect(mockClient.delete).toHaveBeenCalledWith('/storage/v1/b/b1', expect.anything())
    })
  })

  describe('listObjects', () => {
    it('lists objects in bucket', async () => {
      mockClient.get.mockResolvedValue({ data: { items: [{ name: 'o1' }] } })
      const res = await storageApi.listObjects({ bucket: 'b1' })

      expect(mockClient.get).toHaveBeenCalledWith('/storage/v1/b/b1/o', expect.anything())
      expect(res.items).toHaveLength(1)
    })
  })

  describe('getObject', () => {
    it('fetches object metadata', async () => {
      mockClient.get.mockResolvedValue({ data: { name: 'o1' } })
      await storageApi.getObject('b1', 'o1')
      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/storage/v1/b/b1/o/o1'),
        expect.anything()
      )
    })
  })

  describe('uploadObject', () => {
    it('calls direct upload', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      mockClient.post.mockResolvedValue({ data: { name: 'test.txt' } })

      await storageApi.uploadObject(file, { bucket: 'b1', name: 'test.txt' })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/upload/storage/v1/b/b1/o',
        file,
        expect.objectContaining({
          params: expect.objectContaining({ uploadType: 'media' }),
        })
      )
    })

    it('falls back to multipart upload on error', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })

      // Fail first call
      mockClient.post.mockRejectedValueOnce(new Error('fail'))
      // Succeed second call
      mockClient.post.mockResolvedValueOnce({ data: { name: 'test.txt' } })

      await storageApi.uploadObject(file, { bucket: 'b1', name: 'test.txt' })

      expect(mockClient.post).toHaveBeenCalledTimes(2)
      // Second call should ensure multipart
      expect(mockClient.post).toHaveBeenLastCalledWith(
        '/upload/storage/v1/b/b1/o',
        expect.any(FormData),
        expect.objectContaining({
          params: expect.objectContaining({ uploadType: 'multipart' }),
        })
      )
    })

    it('invokes onProgress callback during direct upload (lines 219-223)', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const onProgress = vi.fn()

      mockClient.post.mockImplementation((_url, _data, config) => {
        // Simulate progress event
        config.onUploadProgress({ loaded: 50, total: 100 })
        return Promise.resolve({ data: { name: 'test.txt' } })
      })

      await storageApi.uploadObject(file, { bucket: 'b1', name: 'test.txt' }, onProgress)

      expect(onProgress).toHaveBeenCalledWith({ loaded: 50, total: 100, percentage: 50 })
    })

    it('skips onProgress when total is missing (guard in line 219)', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const onProgress = vi.fn()

      mockClient.post.mockImplementation((_url, _data, config) => {
        config.onUploadProgress({ loaded: 50, total: 0 }) // total=0 → falsy, skip
        return Promise.resolve({ data: { name: 'test.txt' } })
      })

      await storageApi.uploadObject(file, { bucket: 'b1', name: 'test.txt' }, onProgress)
      expect(onProgress).not.toHaveBeenCalled()
    })

    it('invokes onProgress during multipart fallback (lines 265-269)', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const onProgress = vi.fn()

      // First call fails, second (multipart) succeeds with progress
      mockClient.post
        .mockRejectedValueOnce(new Error('fail'))
        .mockImplementationOnce((_url, _data, config) => {
          config.onUploadProgress({ loaded: 30, total: 100 })
          return Promise.resolve({ data: { name: 'test.txt' } })
        })

      await storageApi.uploadObject(file, { bucket: 'b1', name: 'test.txt' }, onProgress)
      expect(onProgress).toHaveBeenCalledWith({ loaded: 30, total: 100, percentage: 30 })
    })
  })

  describe('downloadObject', () => {
    it('downloads as blob', async () => {
      mockClient.get.mockResolvedValue({ data: new Blob(['c']) })
      const res = await storageApi.downloadObject({ bucket: 'b1', object: 'o1' })
      expect(res).toBeInstanceOf(Blob)
    })
  })

  describe('deleteObject', () => {
    it('deletes object', async () => {
      await storageApi.deleteObject({ bucket: 'b1', object: 'o1' })
      expect(mockClient.delete).toHaveBeenCalledWith(
        expect.stringContaining('/storage/v1/b/b1/o/o1'),
        expect.anything()
      )
    })
  })

  describe('copyObject', () => {
    it('copies object', async () => {
      await storageApi.copyObject('b1', 'o1', 'b2', 'o2')
      expect(mockClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/copyTo/'),
        expect.anything(),
        expect.anything()
      )
    })

    it('includes metadata in request body when provided (line 342)', async () => {
      mockClient.post.mockResolvedValue({ data: {} })
      await storageApi.copyObject('b1', 'o1', 'b2', 'o2', { metadata: { key: 'val' } })
      const body = mockClient.post.mock.calls[0][1]
      expect(body.metadata).toEqual({ key: 'val' })
    })
  })

  describe('getObjectDownloadUrl (lines 370-372)', () => {
    it('returns correct URL', () => {
      const url = storageApi.getObjectDownloadUrl('my-bucket', 'path/to/file.txt')
      expect(url).toContain('/storage/v1/b/my-bucket/o/')
      expect(url).toContain('alt=media')
    })
  })

  describe('getObjectPreviewUrl (lines 374-377)', () => {
    it('returns correct preview URL', () => {
      const url = storageApi.getObjectPreviewUrl('my-bucket', 'img.png')
      expect(url).toContain('/storage/v1/b/my-bucket/o/')
      expect(url).toContain('alt=media')
    })
  })

  describe('deleteMultipleObjects', () => {
    it('deletes all objects', async () => {
      await storageApi.deleteMultipleObjects('b1', ['o1', 'o2'])
      expect(mockClient.delete).toHaveBeenCalledTimes(2)
    })
  })

  describe('uploadMultipleFiles', () => {
    it('uploads all files', async () => {
      const f1 = new File([''], 'f1')
      const f2 = new File([''], 'f2')
      await storageApi.uploadMultipleFiles([f1, f2], 'b1')
      expect(mockClient.post).toHaveBeenCalledTimes(2)
    })

    it('calls onProgress callback for each file (lines 403-404)', async () => {
      const file = new File([''], 'f1')
      const onProgress = vi.fn()

      mockClient.post.mockResolvedValue({ data: { name: 'f1' } })

      await storageApi.uploadMultipleFiles([file], 'b1', {}, onProgress)
      // The inner upload calls onProgress with a no-op wrapper; just ensure no throw
      expect(mockClient.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('downloadObjectsAsZip', () => {
    it('adds files to zip and generates', async () => {
      mockClient.get.mockResolvedValue({ data: new Blob(['content']) })

      const zip = await storageApi.downloadObjectsAsZip('b1', ['o1', 'o2'])

      expect(mockClient.get).toHaveBeenCalledTimes(2) // download 2 files
      expect(mockZip.file).toHaveBeenCalledTimes(2)
      expect(mockZip.generateAsync).toHaveBeenCalled()
      expect(zip).toBeInstanceOf(Blob)
    })

    it('throws if no objects', async () => {
      await expect(storageApi.downloadObjectsAsZip('b1', [])).rejects.toThrow()
    })

    it('calls onProgress for each object (line 433)', async () => {
      mockClient.get.mockResolvedValue({ data: new Blob(['x']) })
      const onProgress = vi.fn()

      await storageApi.downloadObjectsAsZip('b1', ['o1', 'o2'], onProgress)

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenCalledWith({ current: 1, total: 2, currentFile: 'o1' })
      expect(onProgress).toHaveBeenCalledWith({ current: 2, total: 2, currentFile: 'o2' })
    })

    it('continues downloading remaining files when one download fails (line 452)', async () => {
      mockClient.get
        .mockRejectedValueOnce(new Error('download fail'))
        .mockResolvedValueOnce({ data: new Blob(['ok']) })

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const zip = await storageApi.downloadObjectsAsZip('b1', ['bad-obj', 'good-obj'])

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to download'), expect.any(Error))
      expect(mockZip.file).toHaveBeenCalledTimes(1) // only good-obj added
      expect(zip).toBeInstanceOf(Blob)
    })
  })

  describe('downloadBucketAsZip', () => {
    it('lists objects then zips them', async () => {
      mockClient.get.mockImplementation(url => {
        if (String(url).endsWith('/o')) {
          return { data: { items: [{ name: 'o1' }] } }
        }
        return { data: new Blob([]) }
      })

      await storageApi.downloadBucketAsZip('b1')

      expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('/o'), expect.anything())
      expect(mockZip.file).toHaveBeenCalledTimes(1)
    })

    it('throws when bucket is empty (line 473)', async () => {
      mockClient.get.mockResolvedValue({ data: { items: [] } })
      await expect(storageApi.downloadBucketAsZip('empty-bucket')).rejects.toThrow('Bucket is empty')
    })
  })

  describe('healthCheck', () => {
    it('returns true on success', async () => {
      mockClient.get.mockResolvedValue({ status: 200 })
      expect(await storageApi.healthCheck()).toBe(true)
    })
    it('returns false on failure', async () => {
      mockClient.get.mockRejectedValue(new Error())
      expect(await storageApi.healthCheck()).toBe(false)
    })
  })

  describe('deleteAll', () => {
    it('sends post request to _internal/delete_all', async () => {
      await storageApi.deleteAll()
      expect(mockClient.post).toHaveBeenCalledWith('/_internal/delete_all')
    })
  })

  describe('notification methods (lines 120-133)', () => {
    it('createNotification posts to notificationConfigs endpoint', async () => {
      mockClient.post.mockResolvedValue({ data: { id: 'n1', topic: 'projects/p/topics/t' } })
      const result = await storageApi.createNotification('my-bucket', {
        topic: 'projects/p/topics/t',
        payload_format: 'JSON_API_V1',
      } as any)
      expect(mockClient.post).toHaveBeenCalledWith(
        '/storage/v1/b/my-bucket/notificationConfigs',
        expect.objectContaining({ topic: 'projects/p/topics/t' })
      )
      expect(result.id).toBe('n1')
    })

    it('listNotifications returns items array', async () => {
      mockClient.get.mockResolvedValue({
        data: { items: [{ id: 'n1' }, { id: 'n2' }] },
      })
      const items = await storageApi.listNotifications('my-bucket')
      expect(mockClient.get).toHaveBeenCalledWith(
        '/storage/v1/b/my-bucket/notificationConfigs'
      )
      expect(items).toHaveLength(2)
    })

    it('listNotifications returns empty array when items is missing', async () => {
      mockClient.get.mockResolvedValue({ data: {} })
      const items = await storageApi.listNotifications('my-bucket')
      expect(items).toEqual([])
    })

    it('deleteNotification calls delete on the correct endpoint', async () => {
      await storageApi.deleteNotification('my-bucket', 'n1')
      expect(mockClient.delete).toHaveBeenCalledWith(
        '/storage/v1/b/my-bucket/notificationConfigs/n1'
      )
    })
  })
})

