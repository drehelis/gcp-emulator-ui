import { ref, computed } from 'vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import firestoreApi from '@/api/firestore'

export type NavigationItem = FirestoreCollectionWithMetadata | FirestoreDocument

export interface NavigationLevel {
  type: 'root' | 'collection' | 'subcollection'
  items: NavigationItem[]
  selectedItem: NavigationItem | null
  header: string
  parentPath?: string
  collectionId?: string
}

export function useRecursiveNavigation() {
  // Core navigation state
  const navigationStack = ref<NavigationLevel[]>([])
  const currentStackIndex = ref(0)
  const slideOffset = ref(0)

  // Computed properties
  const currentLevel = computed(() => navigationStack.value[currentStackIndex.value] || null)
  const isAtRoot = computed(() => currentStackIndex.value === 0)
  const canGoBack = computed(() => currentStackIndex.value > 0)
  const canGoForward = computed(() => currentStackIndex.value < navigationStack.value.length - 1)

  // Breadcrumb path computed from navigation stack
  const breadcrumbPath = computed(() => {
    const path: Array<{type: 'collection' | 'document', id: string, name: string}> = []

    for (let i = 0; i <= currentStackIndex.value; i++) {
      const level = navigationStack.value[i]
      if (level && level.selectedItem) {
        if ('id' in level.selectedItem) {
          // Collection
          path.push({
            type: 'collection',
            id: level.selectedItem.id,
            name: level.selectedItem.id
          })
        } else {
          // Document
          const documentId = level.selectedItem.name.split('/').pop() || 'unknown'
          path.push({
            type: 'document',
            id: documentId,
            name: documentId
          })
        }
      }
    }

    return path
  })

  // Initialize with root collections
  const initializeWithCollections = (collections: FirestoreCollectionWithMetadata[]) => {
    navigationStack.value = [{
      type: 'root',
      items: collections,
      selectedItem: null,
      header: '(default)'
    }]
    currentStackIndex.value = 0
    slideOffset.value = 0
  }

  // Navigate to a collection (next level)
  const navigateToCollection = async (collection: FirestoreCollectionWithMetadata, documents: FirestoreDocument[]) => {
    // If we're going forward, remove any levels after current
    if (currentStackIndex.value < navigationStack.value.length - 1) {
      navigationStack.value = navigationStack.value.slice(0, currentStackIndex.value + 1)
    }

    // Update current level selection
    if (navigationStack.value[currentStackIndex.value]) {
      navigationStack.value[currentStackIndex.value].selectedItem = collection
    }

    // Add new level for documents
    navigationStack.value.push({
      type: 'collection',
      items: documents,
      selectedItem: null,
      header: collection.id,
      collectionId: collection.id
    })

    // Navigate to new level
    currentStackIndex.value++
    slideOffset.value = -100 * currentStackIndex.value
  }

  // Navigate to a document (next level with subcollections)
  const navigateToDocument = async (document: FirestoreDocument, subcollections: FirestoreCollectionWithMetadata[] = []) => {
    // Update current level selection
    if (navigationStack.value[currentStackIndex.value]) {
      navigationStack.value[currentStackIndex.value].selectedItem = document
    }

    // If document has subcollections, don't create new level yet
    // Just mark it as selected and let the user choose a subcollection
    if (subcollections.length === 0) {
      return // No subcollections, just select the document
    }
  }

  // Navigate to a subcollection
  const navigateToSubcollection = async (subcollection: FirestoreCollectionWithMetadata, documents: FirestoreDocument[]) => {
    const currentLevel = navigationStack.value[currentStackIndex.value]
    const selectedDocument = currentLevel?.selectedItem as FirestoreDocument

    if (!selectedDocument) return

    // If we're going forward, remove any levels after current
    if (currentStackIndex.value < navigationStack.value.length - 1) {
      navigationStack.value = navigationStack.value.slice(0, currentStackIndex.value + 1)
    }

    // Add new level for subcollection documents
    navigationStack.value.push({
      type: 'subcollection',
      items: documents,
      selectedItem: null,
      header: subcollection.id,
      parentPath: selectedDocument.name,
      collectionId: subcollection.id
    })

    // Navigate to new level
    currentStackIndex.value++
    slideOffset.value = -100 * currentStackIndex.value
  }

  // Navigate back to a specific level
  const navigateToLevel = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < navigationStack.value.length) {
      currentStackIndex.value = targetIndex
      slideOffset.value = -100 * currentStackIndex.value

      // Remove levels after target
      if (targetIndex < navigationStack.value.length - 1) {
        navigationStack.value = navigationStack.value.slice(0, targetIndex + 1)
      }
    }
  }

  // Navigate back one level
  const navigateBack = () => {
    if (canGoBack.value) {
      navigateToLevel(currentStackIndex.value - 1)
    }
  }

  // Navigate to root
  const navigateToRoot = () => {
    // Clear all selections to show only first column
    if (navigationStack.value.length > 0) {
      navigationStack.value[0].selectedItem = null
    }
    navigateToLevel(0)
  }

  // Select an item in the current level
  const selectItem = (item: NavigationItem) => {
    if (navigationStack.value[currentStackIndex.value]) {
      navigationStack.value[currentStackIndex.value].selectedItem = item
    }
  }

  // Get current selected item
  const getCurrentSelectedItem = () => {
    return currentLevel.value?.selectedItem || null
  }

  // Get items for current level
  const getCurrentItems = () => {
    return currentLevel.value?.items || []
  }

  // Get header for current level
  const getCurrentHeader = () => {
    return currentLevel.value?.header || ''
  }

  // Check if an item is selected
  const isItemSelected = (item: NavigationItem) => {
    return currentLevel.value?.selectedItem === item
  }

  // Clear all navigation
  const clearNavigation = () => {
    navigationStack.value = []
    currentStackIndex.value = 0
    slideOffset.value = 0
  }

  // Load subcollections for a document
  const loadSubcollections = async (documentPath: string): Promise<FirestoreCollectionWithMetadata[]> => {
    try {
      return await firestoreApi.listSubcollections(documentPath)
    } catch (error) {
      console.error('Failed to load subcollections:', error)
      return []
    }
  }

  // Load documents for a subcollection
  const loadSubcollectionDocuments = async (parentPath: string, collectionId: string): Promise<FirestoreDocument[]> => {
    try {
      const response = await firestoreApi.listSubcollectionDocuments(parentPath, collectionId)
      return response.documents || []
    } catch (error) {
      console.error('Failed to load subcollection documents:', error)
      return []
    }
  }

  return {
    // State
    navigationStack,
    currentStackIndex,
    slideOffset,

    // Computed
    currentLevel,
    isAtRoot,
    canGoBack,
    canGoForward,
    breadcrumbPath,

    // Methods
    initializeWithCollections,
    navigateToCollection,
    navigateToDocument,
    navigateToSubcollection,
    navigateToLevel,
    navigateBack,
    navigateToRoot,
    selectItem,
    getCurrentSelectedItem,
    getCurrentItems,
    getCurrentHeader,
    isItemSelected,
    clearNavigation,
    loadSubcollections,
    loadSubcollectionDocuments
  }
}