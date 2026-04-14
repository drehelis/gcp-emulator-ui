import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRecursiveNavigation } from '../useRecursiveNavigation'
import firestoreApi from '@/api/firestore'

// Mock firestoreApi
vi.mock('@/api/firestore', () => ({
  default: {
    listSubcollections: vi.fn(),
    listSubcollectionDocuments: vi.fn(),
  },
}))

describe('useRecursiveNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('should initialize with root collections', () => {
    const { initializeWithCollections, navigationStack, currentStackIndex } =
      useRecursiveNavigation()
    const mockCollections = [{ id: 'col1', name: 'col1' } as any]

    initializeWithCollections(mockCollections)

    expect(navigationStack.value).toHaveLength(1)
    expect(navigationStack.value[0].items).toEqual(mockCollections)
    expect(currentStackIndex.value).toBe(0)
  })

  it('should navigate to collection and update stack', async () => {
    const { initializeWithCollections, navigateToCollection, navigationStack, currentStackIndex } =
      useRecursiveNavigation()
    initializeWithCollections([{ id: 'col1' } as any])

    const mockDocs = [{ name: 'doc1' } as any]
    await navigateToCollection({ id: 'col1' } as any, mockDocs)

    expect(navigationStack.value).toHaveLength(2)
    expect(currentStackIndex.value).toBe(1)
    expect(navigationStack.value[1].items).toEqual(mockDocs)
    expect(navigationStack.value[0].selectedItem).toEqual({ id: 'col1' })
  })

  it('should navigate back using navigateBack', () => {
    const { initializeWithCollections, navigateToCollection, navigateBack, currentStackIndex } =
      useRecursiveNavigation()
    initializeWithCollections([{ id: 'col1' } as any])
    navigateToCollection({ id: 'col1' } as any, [])

    expect(currentStackIndex.value).toBe(1)
    navigateBack()
    expect(currentStackIndex.value).toBe(0)
  })

  describe('navigateToPath', () => {
    it('should navigate step-by-step through a path string', async () => {
      const { initializeWithCollections, navigateToPath, breadcrumbPath } = useRecursiveNavigation()

      const mockStore = {
        loadDocuments: vi.fn().mockResolvedValue({}),
        getDocumentsByCollection: vi
          .fn()
          .mockReturnValue([{ name: 'projects/p/databases/d/documents/c1/doc1' }]),
      }

      const collections = [{ id: 'c1', name: 'c1' } as any]
      initializeWithCollections(collections)

      const documentSubcollections = { value: new Map() }
      ;(firestoreApi.listSubcollections as any).mockResolvedValueOnce({
        collections: [{ id: 'sub1', name: 'sub1' }],
      })
      ;(firestoreApi.listSubcollectionDocuments as any).mockResolvedValueOnce({
        documents: [{ name: 'projects/p/databases/d/documents/c1/doc1/sub1/sd1' }],
      })

      const path = '/ > c1 > doc1 > sub1'
      const promise = navigateToPath(path, mockStore, 'p1', documentSubcollections)

      // We need to advance timers several times as there are multiple setTimeouts in a loop
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(100)
      }
      await promise

      expect(breadcrumbPath.value).toContainEqual(
        expect.objectContaining({ id: 'c1', type: 'collection' })
      )
      expect(breadcrumbPath.value).toContainEqual(
        expect.objectContaining({ id: 'doc1', type: 'document' })
      )
      expect(breadcrumbPath.value).toContainEqual(
        expect.objectContaining({ id: 'sub1', type: 'collection' })
      )
    })

    it('should handle non-existent segments gracefully', async () => {
      const { initializeWithCollections, navigateToPath } = useRecursiveNavigation()
      initializeWithCollections([{ id: 'c1' } as any])

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const promise = navigateToPath('/ > unknown', {}, 'p1', { value: new Map() })
      await vi.advanceTimersByTimeAsync(100)
      await promise

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Segment "unknown" not found')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('navigateToBreadcrumbIndex', () => {
    it('should navigate to correct level when clicking breadcrumb', async () => {
      const nav = useRecursiveNavigation()
      nav.initializeWithCollections([{ id: 'c1' } as any])
      const doc = { name: 'p/d/c1/d1' } as any
      await nav.navigateToCollection({ id: 'c1' } as any, [doc])
      nav.selectItem(doc)
      await nav.navigateToSubcollection({ id: 'sub1' } as any, [])

      expect(nav.currentStackIndex.value).toBe(2)

      // Breadcrumb index 0 is 'c1' (from root level selection)
      nav.navigateToBreadcrumbIndex(0)
      expect(nav.currentStackIndex.value).toBe(0)
      // Level 0 selection should still be 'c1' because we were not already at level 0
      expect(nav.navigationStack.value[0].selectedItem).toEqual({ id: 'c1' })
    })

    it('should ignore out of bounds breadcrumb index', () => {
      const nav = useRecursiveNavigation()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      nav.navigateToBreadcrumbIndex(99)
      expect(consoleSpy).toHaveBeenCalledWith('Invalid breadcrumb index:', 99, 'max:', -1)
      consoleSpy.mockRestore()
    })
  })

  describe('handleSubcollectionDeleted', () => {
    it('should navigate back if current subcollection is deleted', async () => {
      const nav = useRecursiveNavigation()
      nav.initializeWithCollections([{ id: 'c1' } as any])
      const doc = { name: 'p/d/c1/d1' } as any
      await nav.navigateToCollection({ id: 'c1' } as any, [doc])
      nav.selectItem(doc)
      await nav.navigateToSubcollection({ id: 'sub1' } as any, [])

      expect(nav.currentStackIndex.value).toBe(2)

      nav.handleSubcollectionDeleted('sub1', 'p/d/c1/d1')

      expect(nav.currentStackIndex.value).toBe(1)
      expect(nav.navigationStack.value).toHaveLength(2)
    })

    it('should preserve state if a different subcollection is deleted', async () => {
      const nav = useRecursiveNavigation()
      nav.initializeWithCollections([{ id: 'c1' } as any])
      await nav.navigateToCollection({ id: 'c1' } as any, [])

      nav.handleSubcollectionDeleted('other', 'path')
      expect(nav.currentStackIndex.value).toBe(1)
    })
  })

  describe('navigateToSubcollectionFromDocument', () => {
    it('should find parent document and navigate to subcollection', async () => {
      const nav = useRecursiveNavigation()
      nav.initializeWithCollections([{ id: 'c1' } as any])
      const doc = { name: 'p/d/c1/d1' } as any
      await nav.navigateToCollection({ id: 'c1' } as any, [doc])
      nav.selectItem(doc)

      const promise = nav.navigateToSubcollectionFromDocument(
        'p/d/c1/d1',
        { id: 'sub1' } as any,
        []
      )
      await vi.advanceTimersByTimeAsync(50)
      await promise

      expect(nav.currentStackIndex.value).toBe(2)
      expect(nav.navigationStack.value[2].header).toBe('sub1')
    })

    it('should fail if parent document not in stack', async () => {
      const nav = useRecursiveNavigation()
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await nav.navigateToSubcollectionFromDocument('unknown', { id: 's1' } as any, [])
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Target document not found'))
      consoleSpy.mockRestore()
    })
  })

  describe('error handling in loads', () => {
    it('loadSubcollections should handle api error', async () => {
      const nav = useRecursiveNavigation()
      ;(firestoreApi.listSubcollections as any).mockRejectedValue(new Error('fail'))
      const result = await nav.loadSubcollections('path')
      expect(result).toEqual([])
    })

    it('loadSubcollectionDocuments should handle api error', async () => {
      const nav = useRecursiveNavigation()
      ;(firestoreApi.listSubcollectionDocuments as any).mockRejectedValue(new Error('fail'))
      const result = await nav.loadSubcollectionDocuments('p', 'c')
      expect(result.documents).toEqual([])
    })
  })
})
