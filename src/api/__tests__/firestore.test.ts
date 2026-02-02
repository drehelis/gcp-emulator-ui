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
        document: { fields: {} }
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
        document: { fields: {} }
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
        data: { collectionIds: ['users'], nextPageToken: 'next' } 
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
            { name: `projects/p1/databases/(default)/documents/users/u1/comments/c1` }
          ]
        }
      })
      
      const res = await firestoreApi.listSubcollections(docPath)
      
      expect(mockClient.get).toHaveBeenCalledWith(`/v1/${docPath}/`)
      const ids = res.collections.map(c => c.id).sort()
      expect(ids).toEqual(['comments', 'posts'])
    })
  })
  
  describe('deleteCollection', () => {
      it('fetches and deletes all documents', async () => {
          mockClient.get.mockResolvedValue({
              data: { documents: [{ name: 'doc1' }, { name: 'doc2' }] }
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
})
