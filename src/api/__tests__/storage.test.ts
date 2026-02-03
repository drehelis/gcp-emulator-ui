import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: { use: vi.fn() }
  }
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockClient)
  }
}))

const mockZip = vi.hoisted(() => ({
  file: vi.fn(),
  generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'], { type: 'application/zip' }))
}))

vi.mock('jszip', () => ({
  default: class {
      constructor() {
          return mockZip
      }
  }
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
            
            expect(mockClient.get).toHaveBeenCalledWith('/storage/v1/b', expect.objectContaining({
                params: expect.objectContaining({ project: 'p1' })
            }))
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
            
            expect(mockClient.post).toHaveBeenCalledWith('/storage/v1/b', 
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
                    params: expect.objectContaining({ uploadType: 'media' })
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
                     params: expect.objectContaining({ uploadType: 'multipart' })
                })
            )
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
    })

    describe('downloadBucketAsZip', () => {
        it('lists objects then zips them', async () => {
             mockClient.get.mockImplementation((url) => {
                 if (String(url).endsWith('/o')) {
                     return { data: { items: [{ name: 'o1' }] } }
                 }
                 return { data: new Blob([]) }
             })
             
             await storageApi.downloadBucketAsZip('b1')
             
             expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('/o'), expect.anything())
             expect(mockZip.file).toHaveBeenCalledTimes(1)
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
})
