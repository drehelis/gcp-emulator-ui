import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useRecursiveNavigation } from '../useRecursiveNavigation'

// Mock firestore api
vi.mock('@/api/firestore', () => ({
  default: {
    listSubcollections: vi.fn(),
    listSubcollectionDocuments: vi.fn(),
  },
}))

import firestoreApi from '@/api/firestore'

describe('useRecursiveNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty stack', () => {
    const { navigationStack, currentStackIndex } = useRecursiveNavigation()
    expect(navigationStack.value).toEqual([])
    expect(currentStackIndex.value).toBe(0)
  })

  it('initializeWithCollections sets root level', () => {
    const { navigationStack, initializeWithCollections } = useRecursiveNavigation()
    const mockCollections = [{ id: 'col1' } as any]
    initializeWithCollections(mockCollections)

    expect(navigationStack.value).toHaveLength(1)
    expect(navigationStack.value[0].type).toBe('root')
    expect(navigationStack.value[0].items).toEqual(mockCollections)
  })

  describe('navigation flows', () => {
    it('navigates from collection to document to subcollection', async () => {
      const {
        initializeWithCollections,
        navigateToCollection,
        navigateToDocument,
        navigateToSubcollection,
        navigationStack,
        currentStackIndex,
        breadcrumbPath,
      } = useRecursiveNavigation()

      // 1. Root
      const col1 = { id: 'col1' } as any
      initializeWithCollections([col1])

      // 2. Click collection -> navigate to docs
      const doc1 = { name: 'projects/p/databases/d/documents/col1/doc1' } as any
      await navigateToCollection(col1, [doc1])

      expect(currentStackIndex.value).toBe(1)
      expect(navigationStack.value[0].selectedItem).toEqual(col1)
      expect(navigationStack.value[1].items).toEqual([doc1])

      // 3. Click document
      await navigateToDocument(doc1, [{ id: 'subcol1' } as any])
      expect(navigationStack.value[1].selectedItem).toEqual(doc1)

      // 4. Click subcollection
      const subDoc1 = { name: 'projects/p/databases/d/documents/col1/doc1/subcol1/sdoc1' } as any
      await navigateToSubcollection({ id: 'subcol1' } as any, [subDoc1])

      expect(currentStackIndex.value).toBe(2)
      expect(navigationStack.value[2].type).toBe('subcollection')
      expect(navigationStack.value[2].items).toEqual([subDoc1])

      // Check breadcrumbs
      expect(breadcrumbPath.value).toEqual([
        { type: 'collection', id: 'col1', name: 'col1' },
        { type: 'document', id: 'doc1', name: 'doc1' },
        { type: 'collection', id: 'subcol1', name: 'subcol1' },
      ])
    })

    it('navigates back one level', () => {
      const { initializeWithCollections, navigateToCollection, navigateBack, currentStackIndex } =
        useRecursiveNavigation()
      initializeWithCollections([{ id: 'c1' } as any])
      navigateToCollection({ id: 'c1' } as any, [])

      expect(currentStackIndex.value).toBe(1)
      navigateBack()
      expect(currentStackIndex.value).toBe(0)
    })

    it('navigates to root', () => {
      const {
        initializeWithCollections,
        navigateToCollection,
        navigateToRoot,
        navigationStack,
        currentStackIndex,
      } = useRecursiveNavigation()
      initializeWithCollections([{ id: 'c1' } as any])
      navigateToCollection({ id: 'c1' } as any, [])

      navigateToRoot()
      expect(currentStackIndex.value).toBe(0)
      expect(navigationStack.value[0].selectedItem).toBeNull()
    })
  })

  describe('data loading', () => {
    it('loadSubcollections calls API', async () => {
      const { loadSubcollections } = useRecursiveNavigation()
      const mockResult = { collections: [{ id: 'sub' }] }
      ;(firestoreApi.listSubcollections as any).mockResolvedValue(mockResult)

      const result = await loadSubcollections('path/to/doc')
      expect(firestoreApi.listSubcollections).toHaveBeenCalledWith('path/to/doc')
      expect(result).toBe(mockResult)
    })

    it('loadSubcollectionDocuments calls API', async () => {
      const { loadSubcollectionDocuments } = useRecursiveNavigation()
      const mockResponse = { documents: [{ name: 'd1' }], nextPageToken: 'tk' }
      ;(firestoreApi.listSubcollectionDocuments as any).mockResolvedValue(mockResponse)

      const result = await loadSubcollectionDocuments('parent', 'sub', 'token', 50)
      expect(firestoreApi.listSubcollectionDocuments).toHaveBeenCalledWith(
        'parent',
        'sub',
        50,
        'token'
      )
      expect(result.documents).toHaveLength(1)
      expect(result.nextPageToken).toBe('tk')
    })
  })

  describe('Path Navigation', () => {
    it('navigateToPath parses and navigates step-by-step', async () => {
      const { initializeWithCollections, navigateToPath } = useRecursiveNavigation()
      initializeWithCollections([{ id: 'col1' } as any])

      const firestoreStore = {
        loadDocuments: vi.fn().mockResolvedValue([]),
        getDocumentsByCollection: vi.fn().mockReturnValue([]),
      }
      const documentSubcollections = ref(new Map())

      await navigateToPath('/ > col1', firestoreStore as any, 'proj-id', documentSubcollections)

      expect(firestoreStore.loadDocuments).toHaveBeenCalledWith('proj-id', 'col1')
    })
  })

  describe('Breadcrumb Index Navigation', () => {
    it('navigateToBreadcrumbIndex jumps to specific stack level', async () => {
      const {
        initializeWithCollections,
        navigateToCollection,
        navigateToBreadcrumbIndex,
        currentStackIndex,
        navigationStack,
      } = useRecursiveNavigation()

      initializeWithCollections([{ id: 'c1' } as any])
      await navigateToCollection({ id: 'c1' } as any, [{ name: 'd1' } as any])

      expect(currentStackIndex.value).toBe(1)

      navigateToBreadcrumbIndex(0)
      expect(currentStackIndex.value).toBe(0)
      // The implementation preserves target level selection if not clicking already-active level
      expect(navigationStack.value[0].selectedItem).toEqual({ id: 'c1' })
    })
  })
})
