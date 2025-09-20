import { nextTick } from 'vue'
import { useFirestoreStore } from '@/stores/firestore'
import { useFieldNavigation } from './useFieldNavigation'
import { getDocumentId } from '@/utils/firestoreHelpers'
import { createFirestoreValue } from '@/utils/fieldUtils'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

export const useFirestoreActions = (
  currentProjectId: () => string,
  selectedCollection: () => FirestoreCollectionWithMetadata | null,
  selectedDocument: () => FirestoreDocument | null,
  documents: () => FirestoreDocument[],
  onDocumentSelect: (_doc: FirestoreDocument) => void,
  onExpandedFieldsRestore: (_fields: Set<string>) => void,
  onDocumentSubcollectionsLoad: (_doc: FirestoreDocument) => Promise<void>
) => {
  const firestoreStore = useFirestoreStore()
  const { navigateToFieldPath, navigateToParentPath } = useFieldNavigation()

  // Collection actions
  const deleteCollection = async (collection: FirestoreCollectionWithMetadata) => {
    await firestoreStore.deleteCollection(currentProjectId(), collection.id)
    await firestoreStore.loadCollections(currentProjectId())
  }

  const createCollection = async (collectionId: string) => {
    if (selectedDocument() && selectedCollection()) {
      await onDocumentSubcollectionsLoad(selectedDocument()!)
    } else {
      await firestoreStore.loadCollections(currentProjectId())
      const newCollection = firestoreStore.collections.find(c => c.id === collectionId)
      if (newCollection) {
        await firestoreStore.loadDocuments(currentProjectId(), newCollection.id)
        await nextTick()
        const docs = firestoreStore.getDocumentsByCollection(newCollection.id)
        if (docs.length > 0) {
          onDocumentSelect(docs[0])
        }
      }
    }
  }

  // Document actions
  const deleteDocument = async (document: FirestoreDocument) => {
    if (!selectedCollection()) return
    const documentPath = document.name
    await firestoreStore.deleteDocument(documentPath, selectedCollection()!.id)
  }

  const createDocument = async (documentId: string) => {
    if (!selectedCollection()) return
    await firestoreStore.loadDocuments(currentProjectId(), selectedCollection()!.id)
    await nextTick()
    const docs = documents()
    const newDocument = docs.find(doc => getDocumentId(doc.name) === documentId)
    if (newDocument) {
      onDocumentSelect(newDocument)
    }
  }

  const deleteAllFields = async () => {
    if (!selectedDocument() || !selectedCollection()) return

    const documentPath = selectedDocument()!.name
    const documentId = getDocumentId(documentPath)

    await firestoreStore.deleteDocument(documentPath, selectedCollection()!.id)
    await firestoreStore.createDocument(
      currentProjectId(),
      selectedCollection()!.id,
      { fields: {} },
      documentId
    )

    await firestoreStore.loadDocuments(currentProjectId(), selectedCollection()!.id)
    const documents = firestoreStore.getDocumentsByCollection(selectedCollection()!.id)
    const recreatedDoc = documents.find(doc => getDocumentId(doc.name) === documentId)
    if (recreatedDoc) {
      onDocumentSelect(recreatedDoc)
    }
  }

  // Field actions
  const deleteField = async (fieldPath: string, expandedFields: Set<string>) => {
    if (!selectedDocument() || !selectedCollection()) return

    const updatedFields = { ...selectedDocument()!.fields }

    try {
      if (fieldPath.includes('.') || fieldPath.includes('[')) {
        const { parent, lastPart } = navigateToParentPath(updatedFields, fieldPath)

        if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
          const index = parseInt(lastPart.substring(1, lastPart.length - 1))
          if (parent.arrayValue?.values) {
            parent.arrayValue.values.splice(index, 1)
          }
        } else {
          if (parent.mapValue?.fields) {
            delete parent.mapValue.fields[lastPart]
          }
        }
      } else {
        delete updatedFields[fieldPath]
      }
    } catch (navigationError) {
      throw new Error(`Failed to navigate to field for deletion: ${navigationError.message}`)
    }

    await firestoreStore.updateDocument(
      currentProjectId(),
      selectedCollection()!.id,
      getDocumentId(selectedDocument()!.name),
      { fields: updatedFields }
    )

    const expandedFieldsCopy = new Set(expandedFields)
    await firestoreStore.loadDocuments(currentProjectId(), selectedCollection()!.id)

    const docs = documents()
    const currentDocId = getDocumentId(selectedDocument()!.name)
    const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
    if (foundDoc) {
      onDocumentSelect(foundDoc)
      onExpandedFieldsRestore(expandedFieldsCopy)
    }
  }

  const saveField = async (data: {
    fieldName: string
    fieldType: string
    fieldValue: any
    fieldPath?: string
    isNewField?: boolean
    parentPath?: string
  }, mode: 'add' | 'edit', expandedFields: Set<string>) => {
    if (!selectedDocument() || !selectedCollection()) return

    try {
      if (mode === 'add') {
        const firestoreValue = createFirestoreValue(data.fieldType, data.fieldValue)
        const updatedFields = { ...selectedDocument()!.fields }

        if (data.parentPath) {
          if (data.fieldPath?.includes('[new]')) {
            const arrayContainer = navigateToFieldPath(updatedFields, data.parentPath)
            if (arrayContainer?.arrayValue?.values) {
              const newArray = JSON.parse(JSON.stringify(arrayContainer))
              newArray.arrayValue.values.push(firestoreValue)
              const { parent, lastPart } = navigateToParentPath(updatedFields, data.parentPath)

              if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
                const index = parseInt(lastPart.substring(1, lastPart.length - 1))
                if (parent.arrayValue?.values) {
                  parent.arrayValue.values[index] = newArray
                }
              } else {
                if (parent.mapValue?.fields) {
                  parent.mapValue.fields[lastPart] = newArray
                } else if (parent[lastPart]) {
                  parent[lastPart] = newArray
                }
              }
            }
          } else {
            const targetMap = navigateToFieldPath(updatedFields, data.parentPath)
            if (targetMap?.mapValue) {
              if (!targetMap.mapValue.fields) {
                targetMap.mapValue.fields = {}
              }
              targetMap.mapValue.fields[data.fieldName] = firestoreValue
            }
          }
        } else {
          updatedFields[data.fieldName] = firestoreValue
        }

        await firestoreStore.updateDocument(
          currentProjectId(),
          selectedCollection()!.id,
          getDocumentId(selectedDocument()!.name),
          { fields: updatedFields }
        )
      } else {
        const firestoreValue = createFirestoreValue(data.fieldType, data.fieldValue)
        const updatedFields = { ...selectedDocument()!.fields }
        const fieldPath = data.fieldPath!

        if (fieldPath.includes('.') || fieldPath.includes('[')) {
          const { parent, lastPart } = navigateToParentPath(updatedFields, fieldPath)

          if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
            const index = parseInt(lastPart.substring(1, lastPart.length - 1))
            if (parent.arrayValue?.values) {
              parent.arrayValue.values[index] = firestoreValue
            }
          } else {
            if (parent.mapValue?.fields) {
              parent.mapValue.fields[lastPart] = firestoreValue
            }
          }
        } else {
          updatedFields[fieldPath] = firestoreValue
        }

        await firestoreStore.updateDocument(
          currentProjectId(),
          selectedCollection()!.id,
          getDocumentId(selectedDocument()!.name),
          { fields: updatedFields }
        )
      }

      const expandedFieldsCopy = new Set(expandedFields)
      if (mode === 'add' && data.parentPath) {
        expandedFieldsCopy.add(data.parentPath)
      }

      await firestoreStore.loadDocuments(currentProjectId(), selectedCollection()!.id)
      const docs = documents()
      const currentDocId = getDocumentId(selectedDocument()!.name)
      const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
      if (foundDoc) {
        onDocumentSelect(foundDoc)
        onExpandedFieldsRestore(expandedFieldsCopy)
      }
    } catch (error) {
      console.error('Failed to save field:', error)
      throw error
    }
  }

  return {
    deleteCollection,
    createCollection,
    deleteDocument,
    createDocument,
    deleteAllFields,
    deleteField,
    saveField
  }
}