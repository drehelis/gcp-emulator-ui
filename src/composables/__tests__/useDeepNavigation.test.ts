import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useDeepNavigation } from '../useDeepNavigation'

describe('useDeepNavigation', () => {
  it('getColumnOneDocument returns null for level 0', () => {
    const navigationStack = ref([])
    const documentSubcollections = ref(new Map())
    const { getColumnOneDocument } = useDeepNavigation(navigationStack, documentSubcollections)

    expect(getColumnOneDocument(0)).toBeNull()
  })

  it('getColumnOneDocument returns parent document for level > 0', () => {
    const parentDoc = { id: 'doc1', name: 'projects/p1/databases/d1/documents/c1/doc1' }
    const navigationStack = ref([
      { selectedItem: parentDoc, type: 'collection' },
      { type: 'subcollection' },
    ])
    const documentSubcollections = ref(new Map())
    const { getColumnOneDocument } = useDeepNavigation(navigationStack, documentSubcollections)

    expect(getColumnOneDocument(1)).toEqual(parentDoc)
  })

  it('shouldShowDocumentEditorInColumnOne returns true when in subcollection level', () => {
    const parentDoc = { id: 'doc1', name: 'path/doc1' }
    const navigationStack = ref([
      { selectedItem: parentDoc, type: 'collection' },
      { type: 'subcollection' },
    ])
    const documentSubcollections = ref(new Map())
    const { shouldShowDocumentEditorInColumnOne } = useDeepNavigation(
      navigationStack,
      documentSubcollections
    )

    expect(shouldShowDocumentEditorInColumnOne(1)).toBe(true)
  })

  it('getColumnOneSubcollections returns subcollections for active document', () => {
    const parentDoc = { id: 'doc1', name: 'path/doc1' }
    const subcollections = [{ id: 'sub1', name: 'sub1', path: 'path/doc1/sub1' }]
    const navigationStack = ref([
      { selectedItem: parentDoc, type: 'collection' },
      { type: 'subcollection' },
    ])
    const documentSubcollections = ref(new Map([['path/doc1', subcollections]]))
    const { getColumnOneSubcollections } = useDeepNavigation(
      navigationStack,
      documentSubcollections
    )

    expect(getColumnOneSubcollections(1)).toEqual(subcollections)
  })

  it('getColumnOneSelectedSubcollection returns subcollection metadata', () => {
    const navigationStack = ref([
      {},
      { type: 'subcollection', header: 'sub1', collectionId: 'sub1', parentPath: 'path/doc1' },
    ])
    const documentSubcollections = ref(new Map())
    const { getColumnOneSelectedSubcollection } = useDeepNavigation(
      navigationStack,
      documentSubcollections
    )

    expect(getColumnOneSelectedSubcollection(1)).toEqual({
      id: 'sub1',
      name: 'sub1',
      path: 'path/doc1/sub1',
    })
  })
})
