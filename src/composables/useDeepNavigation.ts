import type { Ref } from 'vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import type { NavigationLevel } from '@/composables/useRecursiveNavigation'

export function useDeepNavigation(
  navigationStack: Ref<NavigationLevel[]>,
  documentSubcollections: Ref<Map<string, FirestoreCollectionWithMetadata[]>>
) {
  // Check if Column 1 should show DocumentEditor instead of ColumnOne
  const shouldShowDocumentEditorInColumnOne = (levelIndex: number): boolean => {
    // Show DocumentEditor in Column 1 ONLY when:
    // 1. We're in a subcollection navigation (levelIndex > 0)
    // 2. The current level is a subcollection type
    // 3. There's a previous level with a selected document that contains subcollections
    const currentLevel = navigationStack.value[levelIndex]
    return levelIndex > 0 &&
           currentLevel?.type === 'subcollection' &&
           getColumnOneDocument(levelIndex) !== null
  }

  // Get the document that should be shown in Column 1 DocumentEditor
  const getColumnOneDocument = (levelIndex: number): FirestoreDocument | null => {
    // Get the selected document from the previous level (parent document containing subcollections)
    const previousLevel = navigationStack.value[levelIndex - 1]
    if (previousLevel?.selectedItem && 'name' in previousLevel.selectedItem) {
      return previousLevel.selectedItem as FirestoreDocument
    }
    return null
  }

  // Get subcollections for the document shown in Column 1
  const getColumnOneSubcollections = (levelIndex: number): FirestoreCollectionWithMetadata[] => {
    const document = getColumnOneDocument(levelIndex)
    if (!document) return []

    const subcollections = documentSubcollections.value.get(document.name)
    return Array.isArray(subcollections) ? subcollections : (subcollections?.collections || [])
  }

  // Get the currently selected subcollection for Column 1 DocumentEditor
  const getColumnOneSelectedSubcollection = (levelIndex: number): FirestoreCollectionWithMetadata | null => {
    // The selected subcollection is the current level's collection if it's a subcollection
    const currentLevel = navigationStack.value[levelIndex]
    if (currentLevel?.type === 'subcollection') {
      return {
        id: currentLevel.collectionId || currentLevel.header,
        name: currentLevel.header,
        path: `${currentLevel.parentPath}/${currentLevel.collectionId || currentLevel.header}`
      } as FirestoreCollectionWithMetadata
    }
    return null
  }

  return {
    shouldShowDocumentEditorInColumnOne,
    getColumnOneDocument,
    getColumnOneSubcollections,
    getColumnOneSelectedSubcollection
  }
}
