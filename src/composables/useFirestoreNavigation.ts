import { ref, computed } from 'vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

export function useFirestoreNavigation() {
  // Navigation state
  const slideOffset = ref(0)
  const navigationPath = ref<Array<{type: 'collection' | 'document', id: string, name: string}>>([])

  // Selected items
  const selectedCollection = ref<FirestoreCollectionWithMetadata | null>(null)
  const selectedDocument = ref<FirestoreDocument | null>(null)
  const selectedSubcollection = ref<FirestoreCollectionWithMetadata | null>(null)
  const selectedSubcollectionDocument = ref<FirestoreDocument | null>(null)

  // Subcollection data
  const currentSubcollections = ref<FirestoreCollectionWithMetadata[]>([])
  const subcollectionDocuments = ref<FirestoreDocument[]>([])
  const documentSubcollections = ref<Map<string, FirestoreCollectionWithMetadata[]>>(new Map())

  // Computed
  const isInSubcollectionMode = computed(() => slideOffset.value !== 0)

  const currentDocumentPath = computed(() => {
    if (!selectedDocument.value) return null
    return selectedDocument.value.name
  })

  const currentDocumentSubcollections = computed(() => {
    if (!currentDocumentPath.value) return []
    return documentSubcollections.value.get(currentDocumentPath.value) || []
  })

  // Navigation functions
  const slideToSubcollectionLevel = () => {
    slideOffset.value = -100 // Slide one full width to the left (in percentage)
  }

  const slideToRootLevel = () => {
    slideOffset.value = 0
  }

  const navigateToRoot = () => {
    navigationPath.value = []
    currentSubcollections.value = []
    selectedSubcollection.value = null
    selectedSubcollectionDocument.value = null
    subcollectionDocuments.value = []
    // Clear collection and document selections to make middle and right panes blank
    selectedCollection.value = null
    selectedDocument.value = null
    slideToRootLevel()
  }

  const navigateToCollection = () => {
    // Clear document selection to show only collection (2 panes)
    selectedDocument.value = null
    // Clear subcollection state
    navigationPath.value = []
    currentSubcollections.value = []
    selectedSubcollection.value = null
    selectedSubcollectionDocument.value = null
    subcollectionDocuments.value = []
    slideToRootLevel()
  }

  const navigateToSubcollection = async (subcollection: FirestoreCollectionWithMetadata) => {
    // Update navigation path to include the subcollection
    if (selectedCollection.value && selectedDocument.value) {
      navigationPath.value = [
        { type: 'collection', id: selectedCollection.value.id, name: selectedCollection.value.id },
        { type: 'document', id: getDocumentId(selectedDocument.value.name), name: getDocumentId(selectedDocument.value.name) },
        { type: 'collection', id: subcollection.id, name: subcollection.id }
      ]
    }

    // Set up the subcollection navigation
    selectedSubcollection.value = subcollection
    currentSubcollections.value = [subcollection]

    // Trigger slide to subcollection view
    slideToSubcollectionLevel()
  }

  // Helper functions
  const getDocumentId = (documentPath: string): string => {
    const parts = documentPath.split('/')
    return parts[parts.length - 1]
  }

  const clearData = () => {
    selectedCollection.value = null
    selectedDocument.value = null
    selectedSubcollection.value = null
    selectedSubcollectionDocument.value = null
    currentSubcollections.value = []
    subcollectionDocuments.value = []
    documentSubcollections.value.clear()
    navigationPath.value = []
    slideOffset.value = 0
  }

  return {
    // State
    slideOffset,
    navigationPath,
    selectedCollection,
    selectedDocument,
    selectedSubcollection,
    selectedSubcollectionDocument,
    currentSubcollections,
    subcollectionDocuments,
    documentSubcollections,

    // Computed
    isInSubcollectionMode,
    currentDocumentPath,
    currentDocumentSubcollections,

    // Methods
    slideToSubcollectionLevel,
    slideToRootLevel,
    navigateToRoot,
    navigateToCollection,
    navigateToSubcollection,
    getDocumentId,
    clearData
  }
}