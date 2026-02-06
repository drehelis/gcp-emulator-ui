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
  nextPageToken?: string
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
    const path: Array<{ type: 'collection' | 'document'; id: string; name: string }> = []

    for (let i = 0; i <= currentStackIndex.value; i++) {
      const level = navigationStack.value[i]

      // Handle subcollection levels specially
      if (level && level.type === 'subcollection') {
        // Add the subcollection to the breadcrumb
        path.push({
          type: 'collection',
          id: level.collectionId || level.header,
          name: level.collectionId || level.header,
        })

        // If there's a selected document in the subcollection, add it too
        if (level.selectedItem && 'name' in level.selectedItem) {
          const documentId = level.selectedItem.name.split('/').pop() || 'unknown'
          path.push({
            type: 'document',
            id: documentId,
            name: documentId,
          })
        }
      } else if (level && level.selectedItem) {
        if ('id' in level.selectedItem) {
          // Collection
          path.push({
            type: 'collection',
            id: level.selectedItem.id,
            name: level.selectedItem.id,
          })
        } else {
          // Document
          const documentId = level.selectedItem.name.split('/').pop() || 'unknown'
          path.push({
            type: 'document',
            id: documentId,
            name: documentId,
          })
        }
      }
    }

    return path
  })

  // Initialize with root collections
  const initializeWithCollections = (collections: FirestoreCollectionWithMetadata[]) => {
    navigationStack.value = [
      {
        type: 'root',
        items: collections,
        selectedItem: null,
        header: '(default)',
      },
    ]
    currentStackIndex.value = 0
    slideOffset.value = 0
  }

  // Navigate to a collection (next level)
  const navigateToCollection = async (
    collection: FirestoreCollectionWithMetadata,
    documents: FirestoreDocument[]
  ) => {
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
      collectionId: collection.id,
    })

    // Navigate to new level
    currentStackIndex.value++
    slideOffset.value = -100 * currentStackIndex.value
  }

  // Navigate to a document (next level with subcollections)
  const navigateToDocument = async (
    document: FirestoreDocument,
    subcollections: FirestoreCollectionWithMetadata[] = []
  ) => {
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
  const navigateToSubcollection = async (
    subcollection: FirestoreCollectionWithMetadata,
    documents: FirestoreDocument[]
  ) => {
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
      collectionId: subcollection.id,
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
  const loadSubcollections = async (
    documentPath: string
  ): Promise<FirestoreCollectionWithMetadata[]> => {
    try {
      return await firestoreApi.listSubcollections(documentPath)
    } catch (error) {
      console.error('Failed to load subcollections:', error)
      return []
    }
  }

  // Load documents for a subcollection (with pagination support)
  const loadSubcollectionDocuments = async (
    parentPath: string,
    collectionId: string,
    nextPageToken?: string,
    pageSize: number = 30
  ): Promise<{ documents: FirestoreDocument[]; nextPageToken?: string }> => {
    try {
      const response = await firestoreApi.listSubcollectionDocuments(
        parentPath,
        collectionId,
        pageSize,
        nextPageToken
      )
      return {
        documents: response.documents || [],
        nextPageToken: response.nextPageToken,
      }
    } catch (error) {
      console.error('Failed to load subcollection documents:', error)
      return { documents: [] }
    }
  }

  // Navigate to a specific path by parsing path string
  const navigateToPath = async (
    pathString: string,
    firestoreStore: any,
    currentProjectId: string,
    documentSubcollections: any
  ) => {
    // Parse the path string: "/ > collection-1 > doc-id > sub-collection > doc-id2"
    const pathSegments = pathString
      .split('>')
      .map(s => s.trim())
      .filter(s => s && s !== '/')

    if (pathSegments.length === 0) {
      navigateToRoot()
      return
    }

    try {
      // Start from root
      navigateToRoot()

      // Wait a bit for root navigation to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Navigate through the path segments step by step
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i]
        const currentItems = getCurrentItems()

        // Try to find as collection first
        const collection = currentItems.find((item: any) => 'id' in item && item.id === segment)

        if (collection) {
          // Load documents for this collection
          await firestoreStore.loadDocuments(currentProjectId, segment)
          const documents = firestoreStore.getDocumentsByCollection(segment)
          await navigateToCollection(collection, documents || [])

          // Wait a bit for navigation to complete
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          // Try to find as document
          const document = currentItems.find(
            (item: any) =>
              'name' in item &&
              (item.name.includes(segment) || item.name.split('/').pop() === segment)
          )

          if (document) {
            await navigateToDocument(document)

            // Load subcollections for this document
            const subcollectionsResult = await loadSubcollections(document.name)
            const subcollections = subcollectionsResult?.collections || []
            documentSubcollections.value.set(document.name, subcollections)

            // Check if next segment is a subcollection
            if (i + 1 < pathSegments.length) {
              const nextSegment = pathSegments[i + 1]
              const subcollection = subcollections.find(sub => sub.id === nextSegment)

              if (subcollection) {
                // Load documents for this subcollection
                const subcollectionDocsResult = await loadSubcollectionDocuments(
                  document.name,
                  subcollection.id
                )
                await navigateToSubcollection(subcollection, subcollectionDocsResult.documents)

                // Skip the subcollection segment since we handled it
                i += 1
              }
            }

            // Wait a bit for navigation to complete
            await new Promise(resolve => setTimeout(resolve, 100))
          } else {
            console.warn(`Segment "${segment}" not found at current level`)
            break
          }
        }
      }
    } catch (error) {
      console.error('Error navigating to path:', error)
    }
  }

  // Navigate to a subcollection from a specific parent document context
  const navigateToSubcollectionFromDocument = async (
    targetDocumentPath: string,
    subcollection: FirestoreCollectionWithMetadata,
    documents: FirestoreDocument[]
  ) => {
    console.log(
      'navigateToSubcollectionFromDocument - targetDocumentPath:',
      targetDocumentPath,
      'subcollection:',
      subcollection.id
    )

    // First, find the navigation level that contains the target document
    let targetLevelIndex = -1
    for (let i = 0; i < navigationStack.value.length; i++) {
      const level = navigationStack.value[i]
      if (
        level?.selectedItem &&
        'name' in level.selectedItem &&
        level.selectedItem.name === targetDocumentPath
      ) {
        targetLevelIndex = i
        break
      }
    }

    if (targetLevelIndex >= 0) {
      console.log(
        'Found target document at navigation level:',
        targetLevelIndex,
        'navigating there first'
      )
      // Navigate to the parent document level first
      navigateToLevel(targetLevelIndex)

      // Wait a bit for navigation to settle
      await new Promise(resolve => setTimeout(resolve, 50))
    } else {
      console.log(
        'Target document not found in navigation stack, cannot navigate to subcollection from correct context'
      )
      return
    }

    // Now navigate to the subcollection from the correct parent context
    await navigateToSubcollection(subcollection, documents)
  }

  // Handle subcollection deletion navigation update
  const handleSubcollectionDeleted = (
    deletedSubcollectionId: string,
    parentDocumentPath: string
  ) => {
    console.log(
      'handleSubcollectionDeleted - deletedId:',
      deletedSubcollectionId,
      'parentPath:',
      parentDocumentPath
    )

    const currentLevel = navigationStack.value[currentStackIndex.value]

    // Check if we're currently viewing the deleted subcollection
    if (
      currentLevel?.type === 'subcollection' &&
      currentLevel.collectionId === deletedSubcollectionId
    ) {
      console.log('Currently viewing deleted subcollection, navigating back to parent document')

      // Navigate back to the parent document level
      if (currentStackIndex.value > 0) {
        // Remove the deleted subcollection level from the navigation stack
        navigationStack.value.splice(currentStackIndex.value, 1)

        // Navigate back to the parent level
        currentStackIndex.value = currentStackIndex.value - 1
        slideOffset.value = -100 * currentStackIndex.value

        console.log('Navigated back to parent level, new stack index:', currentStackIndex.value)
      }
    } else {
      console.log('Not currently viewing deleted subcollection, navigation state preserved')
    }
  }

  // Handle breadcrumb navigation clicks
  const navigateToBreadcrumbIndex = (index: number) => {
    console.log('Breadcrumb click - index:', index, 'breadcrumbPath:', breadcrumbPath.value)

    // Build a mapping between breadcrumb indices and navigation stack levels
    const breadcrumbToStackMapping: number[] = []

    for (let stackLevel = 0; stackLevel <= currentStackIndex.value; stackLevel++) {
      const level = navigationStack.value[stackLevel]

      if (level && level.type === 'subcollection') {
        // Subcollection adds itself to breadcrumb
        breadcrumbToStackMapping.push(stackLevel)

        // If there's a selected document in the subcollection, it also adds to breadcrumb
        if (level.selectedItem && 'name' in level.selectedItem) {
          breadcrumbToStackMapping.push(stackLevel)
        }
      } else if (level && level.selectedItem) {
        // Regular collection or document adds itself to breadcrumb
        breadcrumbToStackMapping.push(stackLevel)
      }
    }

    console.log('Breadcrumb to stack mapping:', breadcrumbToStackMapping)

    if (index >= breadcrumbToStackMapping.length) {
      console.warn('Invalid breadcrumb index:', index, 'max:', breadcrumbToStackMapping.length - 1)
      return
    }

    const targetStackIndex = breadcrumbToStackMapping[index]
    console.log('Target stack index:', targetStackIndex)

    // If we're already at the target level, we need to clear the selection at that level
    // to show the correct UI state (e.g., hide document editor when clicking collection)
    if (currentStackIndex.value === targetStackIndex) {
      if (navigationStack.value[targetStackIndex]) {
        navigationStack.value[targetStackIndex].selectedItem = null
      }
    }

    // Clear the selection of levels deeper than the target level
    // This ensures we show the correct UI state for the clicked level
    for (let i = targetStackIndex + 1; i < navigationStack.value.length; i++) {
      if (navigationStack.value[i]) {
        navigationStack.value[i].selectedItem = null
      }
    }

    navigateToLevel(targetStackIndex)
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
    loadSubcollectionDocuments,
    navigateToPath,
    navigateToBreadcrumbIndex,
    navigateToSubcollectionFromDocument,
    handleSubcollectionDeleted,
  }
}
