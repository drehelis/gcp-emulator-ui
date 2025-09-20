import { ref, computed } from 'vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import firestoreApi from '@/api/firestore'

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
    slideOffset.value = -100 // Slide to show Level 2 (subcollection layout)
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

  const loadSubcollectionDocuments = async (subcollectionPath: string) => {
    try {
      // Extract collection ID from path (last part after the last slash)
      const pathParts = subcollectionPath.split('/')
      const collectionId = pathParts[pathParts.length - 1]
      // For subcollections, we need to construct the parent path differently
      // The subcollectionPath is like: projects/x/databases/(default)/documents/collection-1/doc-id/subcollection-id
      // We need to remove the subcollection-id and call the API with: projects/x/databases/(default)/documents/collection-1/doc-id
      const parentDocumentPath = pathParts.slice(0, -1).join('/')

      // Use the dedicated API method for subcollection documents
      const response = await firestoreApi.listSubcollectionDocuments(parentDocumentPath, collectionId)
      subcollectionDocuments.value = response.documents

      // Auto-select the first document
      if (subcollectionDocuments.value.length > 0) {
        selectedSubcollectionDocument.value = subcollectionDocuments.value[0]
      } else {
        selectedSubcollectionDocument.value = null
      }
    } catch (error) {
      console.error('Failed to load subcollection documents:', error)
      subcollectionDocuments.value = []
      selectedSubcollectionDocument.value = null
    }
  }

  const selectSubcollectionDocument = (document: FirestoreDocument) => {
    selectedSubcollectionDocument.value = document
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

    // Load documents for the subcollection
    await loadSubcollectionDocuments(subcollection.path)

    // Slide the layout to show subcollection level - middle and right panes slide left together
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
    loadSubcollectionDocuments,
    selectSubcollectionDocument,
    getDocumentId,
    clearData
  }
}