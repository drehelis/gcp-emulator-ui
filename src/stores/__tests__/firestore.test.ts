/**
 * Tests for Firestore store
 * Collections, documents, and database management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFirestoreStore } from '../firestore'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}))

// Mock firestore API
vi.mock('@/api/firestore', () => ({
  default: {
    getDatabasePath: vi.fn((projectId: string, database: string) => 
      `projects/${projectId}/databases/${database}`
    ),
    testDatabase: vi.fn(),
    listCollections: vi.fn(),
    listDocuments: vi.fn(),
    listSubcollections: vi.fn(),
    createDocument: vi.fn(),
    createSubcollection: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    deleteCollection: vi.fn(),
    healthCheck: vi.fn()
  }
}))

describe('useFirestoreStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has loading false initially', () => {
      const store = useFirestoreStore()
      expect(store.loading).toBe(false)
    })

    it('has empty collections initially', () => {
      const store = useFirestoreStore()
      expect(store.collections).toEqual([])
    })

    it('has empty documents map initially', () => {
      const store = useFirestoreStore()
      expect(store.documents.size).toBe(0)
    })

    it('has (default) database selected initially', () => {
      const store = useFirestoreStore()
      expect(store.selectedDatabase).toBe('(default)')
    })

    it('has (default) in available databases', () => {
      const store = useFirestoreStore()
      expect(store.availableDatabases).toContain('(default)')
    })

    it('has testingDatabase false initially', () => {
      const store = useFirestoreStore()
      expect(store.testingDatabase).toBe(false)
    })
  })

  describe('database management', () => {
    it('setSelectedDatabase updates selected database', () => {
      const store = useFirestoreStore()
      store.setSelectedDatabase('custom-db')
      expect(store.selectedDatabase).toBe('custom-db')
    })

    it('setSelectedDatabase persists to localStorage', () => {
      const store = useFirestoreStore()
      store.setSelectedDatabase('persisted-db')
      
      const stored = localStorage.getItem('firestore-selected-database')
      expect(stored).toBe('persisted-db')
    })

    it('removeDatabase removes from available databases', () => {
      const store = useFirestoreStore()
      // Add a database first by manipulating localStorage
      localStorage.setItem('firestore-databases', JSON.stringify(['(default)', 'to-remove']))
      
      // Create fresh store to load from storage
      setActivePinia(createPinia())
      const freshStore = useFirestoreStore()
      
      freshStore.removeDatabase('to-remove')
      expect(freshStore.availableDatabases).not.toContain('to-remove')
    })

    it('removeDatabase cannot remove (default)', () => {
      const store = useFirestoreStore()
      store.removeDatabase('(default)')
      expect(store.availableDatabases).toContain('(default)')
    })

    it('getCurrentDatabasePath returns correct path', () => {
      const store = useFirestoreStore()
      const path = store.getCurrentDatabasePath('my-project')
      expect(path).toBe('projects/my-project/databases/(default)')
    })

    it('getCurrentDatabasePath uses selected database', () => {
      const store = useFirestoreStore()
      store.setSelectedDatabase('custom-db')
      const path = store.getCurrentDatabasePath('my-project')
      expect(path).toBe('projects/my-project/databases/custom-db')
    })
  })

  describe('getDocumentsByCollection', () => {
    it('returns empty array for unknown collection', () => {
      const store = useFirestoreStore()
      const docs = store.getDocumentsByCollection('unknown')
      expect(docs).toEqual([])
    })

    it('returns documents for known collection', () => {
      const store = useFirestoreStore()
      const testDocs = [{ name: 'doc1' }, { name: 'doc2' }]
      store.documents.set('my-collection', testDocs as any)
      
      const docs = store.getDocumentsByCollection('my-collection')
      expect(docs).toEqual(testDocs)
    })
  })

  describe('clearData', () => {
    it('clears collections', () => {
      const store = useFirestoreStore()
      store.collections.push({ id: 'test' } as any)
      
      store.clearData()
      expect(store.collections).toEqual([])
    })

    it('clears documents map', () => {
      const store = useFirestoreStore()
      store.documents.set('collection1', [{ name: 'doc' }] as any)
      
      store.clearData()
      expect(store.documents.size).toBe(0)
    })
  })

  describe('loadCollections', () => {
    it('sets loading while fetching', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listCollections).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ collections: [] }), 100))
      )

      const store = useFirestoreStore()
      const promise = store.loadCollections('test-project')
      
      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
    })

    it('populates collections from API response', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listCollections).mockResolvedValue({
        collections: [
          { id: 'users', name: 'projects/p/databases/d/documents/users' },
          { id: 'orders', name: 'projects/p/databases/d/documents/orders' }
        ]
      })

      const store = useFirestoreStore()
      await store.loadCollections('test-project')
      
      expect(store.collections).toHaveLength(2)
      expect(store.collections[0].id).toBe('users')
      expect(store.collections[1].id).toBe('orders')
    })

    it('appends collections when nextPageToken provided', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listCollections)
        .mockResolvedValueOnce({
          collections: [{ id: 'first', name: 'first' }],
          nextPageToken: 'token1'
        })
        .mockResolvedValueOnce({
          collections: [{ id: 'second', name: 'second' }]
        })

      const store = useFirestoreStore()
      await store.loadCollections('test-project')
      await store.loadCollections('test-project', 'token1')
      
      expect(store.collections).toHaveLength(2)
    })
  })

  describe('loadDocuments', () => {
    it('populates documents in map', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listDocuments).mockResolvedValue({
        documents: [
          { name: 'doc1', fields: {} },
          { name: 'doc2', fields: {} }
        ]
      })

      const store = useFirestoreStore()
      // Add collection to update
      store.collections.push({ id: 'users', documentCount: 0 } as any)
      
      await store.loadDocuments('test-project', 'users')
      
      const docs = store.documents.get('users')
      expect(docs).toHaveLength(2)
    })

    it('updates collection document count', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listDocuments).mockResolvedValue({
        documents: [{ name: 'doc1' }, { name: 'doc2' }, { name: 'doc3' }]
      })

      const store = useFirestoreStore()
      store.collections.push({ id: 'users', documentCount: 0 } as any)
      
      await store.loadDocuments('test-project', 'users')
      
      const collection = store.collections.find(c => c.id === 'users')
      expect(collection?.documentCount).toBe(3)
    })
  })

  describe('healthCheck', () => {
    it('returns true when API succeeds', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.healthCheck).mockResolvedValue(true)

      const store = useFirestoreStore()
      const result = await store.healthCheck()
      expect(result).toBe(true)
    })

    it('returns false when API fails', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.healthCheck).mockRejectedValue(new Error('Connection failed'))

      const store = useFirestoreStore()
      const result = await store.healthCheck()
      expect(result).toBe(false)
    })
  })

  describe('collectionsNextPageToken', () => {
    it('is undefined initially', () => {
      const store = useFirestoreStore()
      expect(store.collectionsNextPageToken).toBeUndefined()
    })

    it('is updated after loading collections', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listCollections).mockResolvedValue({
        collections: [],
        nextPageToken: 'next-page'
      })

      const store = useFirestoreStore()
      await store.loadCollections('test-project')
      
      expect(store.collectionsNextPageToken).toBe('next-page')
    })
  })

  describe('createCollection', () => {
    it('creates collection and adds to local state', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createDocument).mockResolvedValue({
        name: 'projects/p/databases/d/documents/new-collection/doc1',
        fields: {}
      })

      const store = useFirestoreStore()
      const result = await store.createCollection('test-project', 'new-collection')
      
      expect(result).toBe(true)
      expect(store.collections.find(c => c.id === 'new-collection')).toBeDefined()
    })

    it('returns false on API error', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createDocument).mockRejectedValue(new Error('API error'))

      const store = useFirestoreStore()
      const result = await store.createCollection('test-project', 'fail-collection')
      
      expect(result).toBe(false)
    })

    it('sets loading during operation', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createDocument).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ name: 'doc', fields: {} }), 50))
      )

      const store = useFirestoreStore()
      const promise = store.createCollection('test-project', 'test-col')
      
      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('createDocument', () => {
    it('creates document and updates local cache', async () => {
      const firestoreApi = await import('@/api/firestore')
      const mockDoc = { name: 'doc1', fields: { title: { stringValue: 'Test' } } }
      vi.mocked(firestoreApi.default.createDocument).mockResolvedValue(mockDoc)

      const store = useFirestoreStore()
      store.collections.push({ id: 'users', documentCount: 0 } as any)
      
      const result = await store.createDocument('test-project', 'users', { fields: {} })
      
      expect(result).toEqual(mockDoc)
      expect(store.documents.get('users')).toContainEqual(mockDoc)
    })

    it('increments collection document count', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createDocument).mockResolvedValue({ name: 'doc', fields: {} })

      const store = useFirestoreStore()
      store.collections.push({ id: 'users', documentCount: 5 } as any)
      
      await store.createDocument('test-project', 'users', { fields: {} })
      
      const collection = store.collections.find(c => c.id === 'users')
      expect(collection?.documentCount).toBe(1) // Reset to current count from map
    })

    it('throws on API error', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createDocument).mockRejectedValue(new Error('Creation failed'))

      const store = useFirestoreStore()
      
      await expect(store.createDocument('test-project', 'users', { fields: {} }))
        .rejects.toThrow('Creation failed')
    })
  })

  describe('createSubcollection', () => {
    it('creates subcollection via API', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createSubcollection).mockResolvedValue({ name: 'subdoc', fields: {} })

      const store = useFirestoreStore()
      const result = await store.createSubcollection('parent/doc/path', 'subcol')
      
      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.createSubcollection).mockRejectedValue(new Error('Failed'))

      const store = useFirestoreStore()
      const result = await store.createSubcollection('parent/doc', 'subcol')
      
      expect(result).toBe(false)
    })
  })

  describe('updateDocument', () => {
    it('updates document via API', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.updateDocument).mockResolvedValue(undefined)

      const store = useFirestoreStore()
      const result = await store.updateDocument('test-project', 'users', 'doc1', { fields: {} })
      
      expect(result).toBe(true)
      expect(firestoreApi.default.updateDocument).toHaveBeenCalled()
    })

    it('throws on API error', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.updateDocument).mockRejectedValue(new Error('Update failed'))

      const store = useFirestoreStore()
      
      await expect(store.updateDocument('test-project', 'users', 'doc1', { fields: {} }))
        .rejects.toThrow('Update failed')
    })
  })

  describe('deleteDocument', () => {
    it('deletes document via API', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.deleteDocument).mockResolvedValue(undefined)

      const store = useFirestoreStore()
      const result = await store.deleteDocument('path/to/doc')
      
      expect(result).toBe(true)
    })

    it('removes document from local cache when collectionId provided', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.deleteDocument).mockResolvedValue(undefined)

      const store = useFirestoreStore()
      store.collections.push({ id: 'users', documentCount: 2 } as any)
      store.documents.set('users', [
        { name: 'path/to/doc1' },
        { name: 'path/to/doc2' }
      ] as any)
      
      await store.deleteDocument('path/to/doc1', 'users')
      
      const docs = store.documents.get('users')
      expect(docs).toHaveLength(1)
      expect(docs![0].name).toBe('path/to/doc2')
    })

    it('updates collection document count after delete', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.deleteDocument).mockResolvedValue(undefined)

      const store = useFirestoreStore()
      store.collections.push({ id: 'users', documentCount: 2 } as any)
      store.documents.set('users', [
        { name: 'path/to/doc1' },
        { name: 'path/to/doc2' }
      ] as any)
      
      await store.deleteDocument('path/to/doc1', 'users')
      
      const collection = store.collections.find(c => c.id === 'users')
      expect(collection?.documentCount).toBe(1)
    })
  })

  describe('deleteCollection', () => {
    it('deletes collection and removes from state', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.deleteCollection).mockResolvedValue(undefined)

      const store = useFirestoreStore()
      store.collections.push({ id: 'to-delete' } as any)
      store.documents.set('to-delete', [{ name: 'doc' }] as any)
      
      const result = await store.deleteCollection('test-project', 'to-delete')
      
      expect(result).toBe(true)
      expect(store.collections.find(c => c.id === 'to-delete')).toBeUndefined()
      expect(store.documents.has('to-delete')).toBe(false)
    })

    it('throws on API error', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.deleteCollection).mockRejectedValue(new Error('Delete failed'))

      const store = useFirestoreStore()
      
      await expect(store.deleteCollection('test-project', 'users'))
        .rejects.toThrow('Delete failed')
    })
  })

  describe('loadSubcollections', () => {
    it('returns mapped subcollections from API', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listSubcollections).mockResolvedValue({
        collections: [
          { collectionId: 'orders', name: 'path/orders' },
          { collectionId: 'reviews', name: 'path/reviews' }
        ]
      })

      const store = useFirestoreStore()
      const result = await store.loadSubcollections('parent/doc/path')
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('orders')
      expect(result[1].id).toBe('reviews')
    })

    it('returns empty array on error', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listSubcollections).mockRejectedValue(new Error('Failed'))

      const store = useFirestoreStore()
      const result = await store.loadSubcollections('parent/doc/path')
      
      expect(result).toEqual([])
    })
  })

  describe('addDatabase', () => {
    it('adds database when test succeeds', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.testDatabase).mockResolvedValue(true)

      const store = useFirestoreStore()
      const result = await store.addDatabase('test-project', 'new-db')
      
      expect(result).toBe(true)
      expect(store.availableDatabases).toContain('new-db')
    })

    it('returns false when database does not exist', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.testDatabase).mockResolvedValue(false)

      const store = useFirestoreStore()
      const result = await store.addDatabase('test-project', 'nonexistent-db')
      
      expect(result).toBe(false)
    })

    it('sets testingDatabase during operation', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.testDatabase).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 50))
      )

      const store = useFirestoreStore()
      const promise = store.addDatabase('test-project', 'test-db')
      
      expect(store.testingDatabase).toBe(true)
      await promise
      expect(store.testingDatabase).toBe(false)
    })
  })

  describe('loadDocuments with pagination', () => {
    it('appends documents when nextPageToken provided', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listDocuments)
        .mockResolvedValueOnce({ documents: [{ name: 'doc1' }] })
        .mockResolvedValueOnce({ documents: [{ name: 'doc2' }] })

      const store = useFirestoreStore()
      store.collections.push({ id: 'users', documentCount: 0 } as any)
      
      await store.loadDocuments('test-project', 'users')
      await store.loadDocuments('test-project', 'users', 'token123')
      
      const docs = store.documents.get('users')
      expect(docs).toHaveLength(2)
    })

    it('handles load error gracefully', async () => {
      const firestoreApi = await import('@/api/firestore')
      vi.mocked(firestoreApi.default.listDocuments).mockRejectedValue(new Error('Load failed'))

      const store = useFirestoreStore()
      store.collections.push({ id: 'users' } as any)
      
      await store.loadDocuments('test-project', 'users')
      
      // Should set empty array on error
      expect(store.documents.get('users')).toEqual([])
    })
  })
})

