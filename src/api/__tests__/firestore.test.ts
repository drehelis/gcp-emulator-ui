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

import { firestoreApi } from '../firestore'

describe('firestoreApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default resolve for mock functions to avoid undefined errors in untargeted calls
    mockClient.get.mockResolvedValue({ data: {} })
    mockClient.post.mockResolvedValue({ data: {} })
  })

  // ... tests from previous step ...
  describe('createDocument', () => {
    it('creates document without ID (auto-id)', async () => {
      mockClient.post.mockResolvedValue({ data: { name: 'new-doc' } })

      const res = await firestoreApi.createDocument({
        parent: 'projects/p1/databases/(default)/documents',
        collectionId: 'users',
        document: { fields: {} },
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v1/projects/p1/databases/(default)/documents/documents/users',
        { fields: {} }
      )
      expect(res).toEqual({ name: 'new-doc' })
    })

    it('creates document with ID', async () => {
      mockClient.post.mockResolvedValue({ data: { name: 'doc-1' } })

      await firestoreApi.createDocument({
        parent: 'projects/p1/databases/(default)/documents',
        collectionId: 'users',
        documentId: 'user1',
        document: { fields: {} },
      })

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v1/projects/p1/databases/(default)/documents/documents/users',
        { fields: {} },
        { params: { documentId: 'user1' } }
      )
    })
  })

  describe('listCollections', () => {
    it('listCollections calls correct endpoint', async () => {
      mockClient.post.mockResolvedValue({
        data: { collectionIds: ['users'], nextPageToken: 'next' },
      })

      const res = await firestoreApi.listCollections('projects/p1/databases/(default)')

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v1/projects/p1/databases/(default)/documents:listCollectionIds',
        {}
      )
      expect(res.collections).toHaveLength(1)
      expect(res.collections[0].id).toBe('users')
    })
  })

  describe('listSubcollections', () => {
    it('parses subcollections from document listing', async () => {
      const docPath = 'projects/p1/databases/(default)/documents/users/u1'
      const collectionPath = 'projects/p1/databases/(default)/documents/users/u1/posts'
      mockClient.get.mockResolvedValue({
        data: {
          documents: [
            { name: `${collectionPath}/p1` },
            { name: `${collectionPath}/p2` },
            { name: `projects/p1/databases/(default)/documents/users/u1/comments/c1` },
          ],
        },
      })

      const res = await firestoreApi.listSubcollections(docPath)

      expect(mockClient.get).toHaveBeenCalledWith(`/v1/${docPath}/`)
      const ids = res.collections.map((c: any) => c.id).sort()
      expect(ids).toEqual(['comments', 'posts'])
    })
  })

  describe('deleteCollection', () => {
    it('fetches and deletes all documents', async () => {
      mockClient.get.mockResolvedValue({
        data: { documents: [{ name: 'doc1' }, { name: 'doc2' }] },
      })
      mockClient.delete.mockResolvedValue({})

      await firestoreApi.deleteCollection('parent', 'col')

      expect(mockClient.get).toHaveBeenCalled()
      expect(mockClient.delete).toHaveBeenCalledTimes(2)
      expect(mockClient.delete).toHaveBeenCalledWith('/v1/doc1')
    })
  })

  describe('healthCheck', () => {
    it('returns true on success', async () => {
      mockClient.get.mockResolvedValue({ status: 200 })
      expect(await firestoreApi.healthCheck('p1')).toBe(true)
    })

    it('returns false on failure', async () => {
      mockClient.get.mockRejectedValue(new Error())
      expect(await firestoreApi.healthCheck('p1')).toBe(false)
    })
  })
  describe('createSubcollection', () => {
    it('creates subcollection document', async () => {
      mockClient.post.mockResolvedValue({ data: { name: 'new-sub-doc' } })

      const res = await firestoreApi.createSubcollection(
        'parent/doc',
        'posts',
        { fields: {} },
        'p1'
      )

      expect(mockClient.post).toHaveBeenCalledWith(
        '/v1/parent/doc/posts',
        { fields: {} },
        { params: { documentId: 'p1' } }
      )
      expect(res).toEqual({ name: 'new-sub-doc' })
    })

    it('creates subcollection document with auto ID', async () => {
      mockClient.post.mockResolvedValue({ data: { name: 'auto-sub-doc' } })

      const res = await firestoreApi.createSubcollection('parent/doc', 'posts', { fields: {} })

      expect(mockClient.post).toHaveBeenCalledWith('/v1/parent/doc/posts', { fields: {} })
      expect(res).toEqual({ name: 'auto-sub-doc' })
    })
  })

  describe('listDocuments', () => {
    it('lists documents with pagination', async () => {
      mockClient.get.mockResolvedValue({
        data: { documents: [{ name: 'd1' }], nextPageToken: 'tk1' },
      })

      const res = await firestoreApi.listDocuments('parent', 'col', 10, 'tk0')

      expect(mockClient.get).toHaveBeenCalledWith('/v1/parent/documents/col', {
        params: { pageSize: 10, pageToken: 'tk0' },
      })
      expect(res.documents).toHaveLength(1)
      expect(res.nextPageToken).toBe('tk1')
    })
  })

  describe('updateDocument', () => {
    it('patches document', async () => {
      mockClient.patch.mockResolvedValue({ data: { name: 'updated' } })

      const res = await firestoreApi.updateDocument('path/to/doc', { fields: {} })

      expect(mockClient.patch).toHaveBeenCalledWith('/v1/path/to/doc', { fields: {} })
      expect(res).toEqual({ name: 'updated' })
    })
  })

  describe('deleteDocument', () => {
    it('deletes document', async () => {
      mockClient.delete.mockResolvedValue({})

      const res = await firestoreApi.deleteDocument('path/to/doc')

      expect(mockClient.delete).toHaveBeenCalledWith('/v1/path/to/doc')
      expect(res).toBe(true)
    })
  })

  describe('testDatabase', () => {
    it('returns true on 200', async () => {
      mockClient.get.mockResolvedValue({ status: 200 })
      expect(await firestoreApi.testDatabase('p1', 'd1')).toBe(true)
    })

    it('returns false on error', async () => {
      mockClient.get.mockRejectedValue(new Error())
      expect(await firestoreApi.testDatabase('p1', 'd1')).toBe(false)
    })
  })

  describe('helpers', () => {
    it('getDefaultDatabasePath returns correct path', () => {
      expect(firestoreApi.getDefaultDatabasePath('p1')).toBe('projects/p1/databases/(default)')
    })

    it('getDatabasePath returns correct path', () => {
      expect(firestoreApi.getDatabasePath('p1', 'd1')).toBe('projects/p1/databases/d1')
    })
  })
})
