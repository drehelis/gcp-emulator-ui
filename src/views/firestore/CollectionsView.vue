<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <PageHeader
      :collections-count="collections.length"
      :loading="firestoreStore.loading"
      @refresh="refreshCollections"
    />

    <!-- Breadcrumb Navigator -->
    <NavigationBreadcrumb
      :navigation-path="navigation.breadcrumbPath.value"
      :selected-collection="null"
      :selected-document="null"
      :selected-subcollection-document="null"
      :is-in-subcollection-mode="!navigation.isAtRoot.value"
      @navigate-to-root="navigation.navigateToRoot"
      @navigate-to-collection="() => {}"
      @navigate-to-segment="handleBreadcrumbClick"
    />

    <!-- Sliding Layout -->
    <SlidingContainer :slide-offset="navigation.slideOffset.value">
      <!-- Render each navigation level -->
      <div
        v-for="(level, levelIndex) in navigation.navigationStack.value"
        :key="`level-${levelIndex}`"
        class="flex-shrink-0 w-full flex h-full"
      >
        <!-- Column 1: Previous level items or collections -->
        <ColumnOne
          :header="getColumnOneHeader(levelIndex)"
          :items="getColumnOneItems(levelIndex)"
          :selected-item="getColumnOneSelectedItem(levelIndex)"
          :show-add-button="getColumnOneShowAddButton(levelIndex)"
          :add-button-text="getColumnOneAddButtonText(levelIndex)"
          :empty-state-text="getColumnOneEmptyStateText(levelIndex)"
          :loading="firestoreStore.loading"
          @add-item="handleColumnOneAddItem(levelIndex)"
          @select-item="handleColumnOneSelectItem(levelIndex, $event)"
        />

        <!-- At root level with no collection selected: show merged columns 2+3 as empty state -->
        <div v-if="levelIndex === 0 && !level.selectedItem" class="w-2/3 h-full bg-white dark:bg-gray-800">
        </div>

        <!-- Normal 3-column layout for deeper levels or when collection is selected -->
        <template v-else>
          <!-- Column 2: Current level items -->
          <ColumnTwo
            :header="level.header"
            :items="level.items"
            :selected-item="level.selectedItem"
            :show-add-button="getColumnTwoShowAddButton(levelIndex)"
            :add-button-text="getColumnTwoAddButtonText(levelIndex)"
            :empty-state-text="getColumnTwoEmptyStateText(levelIndex)"
            :show-selection-prompt="false"
            :show-collection-menu="getColumnTwoShowCollectionMenu(levelIndex)"
            :loading="firestoreStore.loading"
            @add-item="handleColumnTwoAddItem(levelIndex)"
            @select-item="handleColumnTwoSelectItem(levelIndex, $event)"
            @delete-collection="handleColumnTwoDeleteCollection(levelIndex)"
          />

          <!-- Column 3: Document Editor or empty state -->
          <DocumentEditor
            v-if="getColumnThreeDocument(levelIndex)"
            :selected-document="getColumnThreeDocument(levelIndex)"
            :subcollections="getColumnThreeSubcollections(levelIndex)"
            :selected-subcollection="getColumnThreeSelectedSubcollection(levelIndex)"
            :expanded-fields="expandedMapFields"
            @start-subcollection="handleStartSubcollection(levelIndex)"
            @navigate-to-subcollection="handleNavigateToSubcollection(levelIndex, $event)"
            @add-field="modalManager.openAddFieldModal"
            @toggle-field="toggleMapField"
            @edit-field="handleEditField"
            @delete-field="modalManager.openDeleteFieldModal"
            @add-to-map="modalManager.openAddToMapModal"
            @add-to-array="modalManager.openAddToArrayModal"
            @clone-document="handleCloneDocument"
            @delete-all-fields="modalManager.openDeleteAllFieldsModal"
            @delete-document="handleDeleteDocument"
          />

          <!-- Column 3: Empty state when no document selected -->
          <div v-else class="w-1/3 h-full bg-white dark:bg-gray-800">
          </div>
        </template>
      </div>
    </SlidingContainer>

    <!-- Modals -->
    <StartCollectionModal
      v-model="modalManager.showCreateCollectionModal.value"
      :project-id="currentProjectId"
      :parent-document-path="getModalParentDocumentPath()"
      @created="handleCollectionCreated"
    />

    <AddDocumentModal
      v-model="modalManager.showAddDocumentModal.value"
      :project-id="currentProjectId"
      :collection-id="getModalCollectionId()"
      :collection-path="getModalCollectionPath()"
      :clone-document="modalManager.cloneDocumentData.value"
      @created="handleDocumentCreated"
      @close="modalManager.closeAddDocumentModal"
    />

    <!-- Confirmation Modals -->
    <ConfirmationModal
      v-model="modalManager.showDeleteCollectionModal.value"
      title="Delete Collection"
      :message="`Are you sure you want to delete collection '${modalManager.collectionToDelete.value?.id || ''}'?`"
      confirm-label="Delete Collection"
      :is-loading="modalManager.isDeletingCollection.value"
      :details="{ title: 'What will happen:', description: 'The collection and all its documents will be permanently deleted. This action cannot be undone.' }"
      @confirm="confirmDeleteCollection"
      @cancel="modalManager.closeDeleteCollectionModal"
    />

    <ConfirmationModal
      v-model="modalManager.showDeleteDocumentModal.value"
      title="Delete Document"
      :message="`Are you sure you want to delete document '${modalManager.documentToDelete.value ? getDocumentId(modalManager.documentToDelete.value.name) : ''}'?`"
      confirm-label="Delete Document"
      :is-loading="modalManager.isDeletingDocument.value"
      :details="{ title: 'What will happen:', description: 'The document will be permanently deleted. This action cannot be undone.' }"
      @confirm="confirmDeleteDocument"
      @cancel="modalManager.closeDeleteDocumentModal"
    />

    <ConfirmationModal
      v-model="modalManager.showDeleteAllFieldsModal.value"
      title="Delete All Fields"
      :message="`Are you sure you want to delete all fields from document '${getSelectedDocumentId()}'?`"
      confirm-label="Delete All Fields"
      :is-loading="modalManager.isDeletingAllFields.value"
      :details="{ title: 'What will happen:', description: 'All fields in the document will be deleted, leaving an empty document. This action cannot be undone.' }"
      @confirm="confirmDeleteAllFields"
      @cancel="modalManager.closeDeleteAllFieldsModal"
    />

    <ConfirmationModal
      v-model="modalManager.showDeleteFieldModal.value"
      title="Delete Field"
      :message="`Are you sure you want to delete field '${modalManager.fieldToDelete.value?.displayName || ''}'?`"
      confirm-label="Delete Field"
      :is-loading="modalManager.isDeletingField.value"
      :details="{ title: 'What will happen:', description: 'The field will be permanently removed from this document. This action cannot be undone.' }"
      @confirm="confirmDeleteField"
      @cancel="modalManager.closeDeleteFieldModal"
    />

    <FieldModal
      v-model="modalManager.showFieldModal.value"
      :mode="modalManager.fieldModalMode.value"
      :initial-field-name="modalManager.fieldModalData.value.fieldName"
      :initial-field-type="modalManager.fieldModalData.value.fieldType"
      :initial-field-value="modalManager.fieldModalData.value.fieldValue"
      :field-path="modalManager.fieldModalData.value.fieldPath"
      :is-new-field="modalManager.fieldModalData.value.isNew"
      :parent-path="modalManager.fieldModalData.value.parentPath"
      @save="handleFieldModalSave"
      @close="modalManager.closeFieldModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// Store and API
import { useFirestoreStore } from '@/stores/firestore'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

// Components
import PageHeader from '@/components/firestore/layout/PageHeader.vue'
import NavigationBreadcrumb from '@/components/firestore/navigation/NavigationBreadcrumb.vue'
import SlidingContainer from '@/components/firestore/navigation/SlidingContainer.vue'
import ColumnOne from '@/components/firestore/columns/ColumnOne.vue'
import ColumnTwo from '@/components/firestore/columns/ColumnTwo.vue'
import DocumentEditor from '@/components/firestore/panels/DocumentEditor.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import FieldModal from '@/components/firestore/FieldModal.vue'
import StartCollectionModal from '@/components/firestore/StartCollectionModal.vue'
import AddDocumentModal from '@/components/firestore/AddDocumentModal.vue'

// Composables
import { useFieldOperations } from '@/composables/useFieldOperations'
import { useRecursiveNavigation, type NavigationItem } from '@/composables/useRecursiveNavigation'
import { useModalManager } from '@/composables/useModalManager'
import { useDocumentForm } from '@/composables/useDocumentForm'

// Utils
import { getDocumentId, getFieldType, getEditableValue } from '@/utils/firestoreHelpers'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Composables
const {
  expandedMapFields,
  toggleMapField,
  clearExpandedFields
} = useFieldOperations()

const navigation = useRecursiveNavigation()
const { navigationStack } = navigation
const modalManager = useModalManager()
const { buildFirestoreValue } = useDocumentForm()

// Local state for caching subcollections
const documentSubcollections = ref<Map<string, FirestoreCollectionWithMetadata[]>>(new Map())

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)
const collections = computed(() => firestoreStore.collections)


// Helper functions for column configuration
const getColumnOneHeader = (levelIndex: number): string => {
  if (levelIndex === 0) return '(default)'
  if (levelIndex === 1) return '(default)' // Column 1 still shows collections from root

  const prevLevel = navigation.navigationStack.value[levelIndex - 1]
  return prevLevel?.selectedItem ? getItemDisplayName(prevLevel.selectedItem) : 'Previous'
}

const getColumnOneItems = (levelIndex: number): NavigationItem[] => {
  if (levelIndex === 0) return collections.value

  const prevLevel = navigation.navigationStack.value[levelIndex - 1]
  return prevLevel?.items || []
}

const getColumnOneSelectedItem = (levelIndex: number): NavigationItem | null => {
  if (levelIndex === 0) return null

  const prevLevel = navigation.navigationStack.value[levelIndex - 1]
  return prevLevel?.selectedItem || null
}

const getColumnOneShowAddButton = (levelIndex: number): boolean => {
  return levelIndex === 0 || levelIndex === 1 // Show "Start collection" when Column 1 shows collections
}

const getColumnOneAddButtonText = (levelIndex: number): string => {
  return (levelIndex === 0 || levelIndex === 1) ? 'Start collection' : 'Add document'
}

const getColumnOneEmptyStateText = (levelIndex: number): string => {
  return levelIndex === 0
    ? 'No collections found. Create your first collection to get started.'
    : 'No items in the previous level.'
}

const getColumnTwoShowAddButton = (levelIndex: number): boolean => {
  const level = navigation.navigationStack.value[levelIndex]
  return level?.type === 'collection' || level?.type === 'subcollection'
}

const getColumnTwoAddButtonText = (_levelIndex: number): string => {
  return 'Add document'
}

const getColumnTwoEmptyStateText = (levelIndex: number): string => {
  const level = navigation.navigationStack.value[levelIndex]
  if (level?.type === 'collection') {
    return 'No documents in this collection'
  } else if (level?.type === 'subcollection') {
    return 'No documents in this subcollection'
  }
  return 'No items found'
}

const getColumnTwoShowCollectionMenu = (levelIndex: number): boolean => {
  const level = navigation.navigationStack.value[levelIndex]
  // Show collection menu when we're viewing a collection's documents
  return level?.type === 'collection'
}

const getColumnThreeDocument = (levelIndex: number): FirestoreDocument | null => {
  const level = navigation.navigationStack.value[levelIndex]
  const selectedItem = level?.selectedItem

  if (selectedItem && 'name' in selectedItem) {
    return selectedItem as FirestoreDocument
  }
  return null
}

const getColumnThreeSubcollections = (levelIndex: number): FirestoreCollectionWithMetadata[] => {
  const level = navigation.navigationStack.value[levelIndex]
  const selectedDocument = level?.selectedItem

  if (selectedDocument && 'name' in selectedDocument) {
    // Get subcollections from document cache in the navigation composable
    // These are loaded when the document is selected
    const subcollections = documentSubcollections.value.get(selectedDocument.name)
    // Ensure we always return an array, even if the cached value is malformed
    return Array.isArray(subcollections) ? subcollections : []
  }
  return []
}

const getColumnThreeSelectedSubcollection = (levelIndex: number): FirestoreCollectionWithMetadata | null => {
  // Check if there's a next level in the navigation stack that's a subcollection
  const nextLevel = navigation.navigationStack.value[levelIndex + 1]
  if (nextLevel && (nextLevel.type === 'subcollection')) {
    // Find the subcollection that matches the next level's collectionId
    const subcollections = getColumnThreeSubcollections(levelIndex)
    return subcollections.find(sub => sub.id === nextLevel.collectionId) || null
  }
  return null
}

// Event handlers
const handleColumnOneAddItem = async (levelIndex: number) => {
  if (levelIndex === 0 || levelIndex === 1) {
    // Root level or collection level - create collection (Column 1 shows collections)
    modalManager.openCreateRootCollectionModal()
  }
}

const handleColumnOneSelectItem = async (levelIndex: number, item: NavigationItem) => {
  if (levelIndex === 0 || levelIndex === 1) {
    // Check if this collection is already selected at the root level
    if ('id' in item && navigation.navigationStack.value[0]?.selectedItem &&
        'id' in navigation.navigationStack.value[0].selectedItem &&
        navigation.navigationStack.value[0].selectedItem.id === item.id) {
      // Already viewing this collection, do nothing
      return
    }

    if ('id' in item) {
      // When switching collections, reset to root and then navigate to the new collection
      if (levelIndex === 1) {
        // Reset the navigation stack to root level first
        navigation.navigateToRoot()
      }

      // Selected a collection - navigate to it
      const documents = await loadDocumentsForCollection(item.id)
      await navigation.navigateToCollection(item, documents)

      // If there are documents, auto-select the first one
      if (documents.length > 0) {
        const firstDocument = documents[0]
        navigation.selectItem(firstDocument)

        // Load subcollections for the first document
        const subcollections = await navigation.loadSubcollections(firstDocument.name)
        documentSubcollections.value.set(firstDocument.name, subcollections)
      }
    }
  }
  // For other levels, this shouldn't normally happen since Column 1 shows previous level items
}

const handleColumnTwoAddItem = async (levelIndex: number) => {
  const level = navigation.navigationStack.value[levelIndex]

  if (level?.type === 'subcollection') {
    // Adding document to subcollection
    modalManager.openAddSubcollectionDocumentModal(getSubcollectionPath(levelIndex))
  } else {
    // Adding document to regular collection
    modalManager.openAddDocumentModal()
  }
}

const handleColumnTwoSelectItem = async (levelIndex: number, item: NavigationItem) => {
  navigation.selectItem(item)

  if ('id' in item) {
    // Selected a collection - navigate to it
    const documents = await loadDocumentsForCollection(item.id)
    await navigation.navigateToCollection(item, documents)
  } else {
    // Selected a document - load its subcollections and cache them
    const subcollections = await navigation.loadSubcollections(item.name)

    // Cache the subcollections for this document
    documentSubcollections.value.set(item.name, subcollections)

    await navigation.navigateToDocument(item, subcollections)
  }
}

const handleColumnTwoDeleteCollection = (levelIndex: number) => {
  const level = navigation.navigationStack.value[levelIndex]

  if (level?.type === 'collection') {
    // For a collection level, we need to get the collection from the previous level's selectedItem
    const previousLevel = navigation.navigationStack.value[levelIndex - 1]
    if (previousLevel?.selectedItem && 'id' in previousLevel.selectedItem) {
      modalManager.openDeleteCollectionModal(previousLevel.selectedItem as FirestoreCollectionWithMetadata)
    }
  }
}

const handleStartSubcollection = (_levelIndex: number) => {
  modalManager.openCreateCollectionModal()
}

const handleNavigateToSubcollection = async (levelIndex: number, subcollection: FirestoreCollectionWithMetadata) => {
  const documents = await navigation.loadSubcollectionDocuments(
    subcollection.path.split('/').slice(0, -1).join('/'),
    subcollection.id
  )
  await navigation.navigateToSubcollection(subcollection, documents)
}

const handleBreadcrumbClick = (index: number) => {
  // Map breadcrumb index to navigation stack index
  // Breadcrumb path only includes selected items, so we need to find the corresponding stack level
  const targetStackIndex = index + 1 // Breadcrumb index 0 = stack index 1, etc.

  // If we're already at the target level, we need to clear the selection at that level
  // to show the correct UI state (e.g., hide document editor when clicking collection)
  if (navigation.currentStackIndex.value === targetStackIndex) {
    if (navigation.navigationStack.value[targetStackIndex]) {
      navigation.navigationStack.value[targetStackIndex].selectedItem = null
    }
  }

  // Clear the selection of levels deeper than the target level
  // This ensures we show the correct UI state for the clicked level
  for (let i = targetStackIndex + 1; i < navigation.navigationStack.value.length; i++) {
    if (navigation.navigationStack.value[i]) {
      navigation.navigationStack.value[i].selectedItem = null
    }
  }

  navigation.navigateToLevel(targetStackIndex)
}

// Utility functions
const getItemDisplayName = (item: NavigationItem): string => {
  if ('id' in item) {
    return item.id
  } else {
    return getDocumentId(item.name)
  }
}

const loadDocumentsForCollection = async (collectionId: string): Promise<FirestoreDocument[]> => {
  await firestoreStore.loadDocuments(currentProjectId.value, collectionId)
  return firestoreStore.getDocumentsByCollection(collectionId)
}

const getSubcollectionPath = (levelIndex: number): string => {
  const level = navigation.navigationStack.value[levelIndex]
  return level?.parentPath ? `${level.parentPath}/${level.collectionId}` : ''
}

// Modal helper functions
const getModalParentDocumentPath = (): string | null => {
  // If we're explicitly creating a root collection, always return null
  if (modalManager.isCreatingRootCollection.value) {
    return null
  }

  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  return currentDoc?.name || null
}

const getModalCollectionId = (): string => {
  const currentLevel = navigation.currentLevel.value
  return currentLevel?.collectionId || ''
}

const getModalCollectionPath = (): string | null => {
  return modalManager.subcollectionPath.value
}

const getSelectedDocumentId = (): string => {
  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  return currentDoc ? getDocumentId(currentDoc.name) : ''
}

// Core methods
const refreshCollections = async () => {
  await firestoreStore.loadCollections(currentProjectId.value)
  navigation.initializeWithCollections(collections.value)
}

// Event handlers (copied from original implementation)
const handleCloneDocument = () => {
  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  if (currentDoc) {
    modalManager.openCloneDocumentModal(currentDoc)
  }
}

const handleDeleteDocument = () => {
  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  if (currentDoc) {
    modalManager.openDeleteDocumentModal(currentDoc)
  }
}

const handleEditField = (data: { path: string; fieldName: string; fieldValue: any }) => {
  modalManager.openEditFieldModal({
    path: data.path,
    fieldName: data.fieldName,
    fieldValue: data.fieldValue,
    fieldType: getFieldType(data.fieldValue),
    editableValue: getEditableValue(data.fieldValue)
  })
}

// Confirmation handlers (simplified versions - implement full logic as needed)
const confirmDeleteCollection = async () => {
  if (!modalManager.collectionToDelete.value) return

  try {
    modalManager.isDeletingCollection.value = true
    await firestoreStore.deleteCollection(currentProjectId.value, modalManager.collectionToDelete.value.id)

    // Navigate back if we deleted a currently selected collection
    const currentLevel = navigation.currentLevel.value
    if (currentLevel?.selectedItem && 'id' in currentLevel.selectedItem &&
        currentLevel.selectedItem.id === modalManager.collectionToDelete.value.id) {
      navigation.navigateToRoot()
    }

    // Refresh collections
    await refreshCollections()
  } catch (error) {
    console.error('Failed to delete collection:', error)
  } finally {
    modalManager.isDeletingCollection.value = false
    modalManager.closeDeleteCollectionModal()
  }
}

const confirmDeleteDocument = async () => {
  if (!modalManager.documentToDelete.value) return

  try {
    modalManager.isDeletingDocument.value = true
    const documentPath = modalManager.documentToDelete.value.name

    // Determine the collection ID for cache update
    let collectionId = ''
    const currentLevel = navigation.currentLevel.value
    if (currentLevel?.type === 'collection') {
      collectionId = currentLevel.collectionId || ''
    } else if (currentLevel?.type === 'subcollection') {
      collectionId = currentLevel.collectionId || ''
    }

    await firestoreStore.deleteDocument(documentPath, collectionId)

    // Clear selection and refresh documents if we deleted the currently selected document
    if (currentLevel?.selectedItem && 'name' in currentLevel.selectedItem &&
        currentLevel.selectedItem.name === documentPath) {
      // Clear the selection to show empty third column
      navigation.selectItem(null as any)

      // Refresh the documents in the current collection
      if (collectionId) {
        await firestoreStore.loadDocuments(currentProjectId.value, collectionId)

        // Update the navigation stack with refreshed documents
        const refreshedDocuments = firestoreStore.getDocumentsByCollection(collectionId)
        if (navigationStack.value[navigation.currentStackIndex.value]) {
          navigationStack.value[navigation.currentStackIndex.value].items = refreshedDocuments
        }
      }
    }

  } catch (error) {
    console.error('Failed to delete document:', error)
  } finally {
    modalManager.isDeletingDocument.value = false
    modalManager.closeDeleteDocumentModal()
  }
}

const confirmDeleteAllFields = async () => {
  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  if (!currentDoc) return

  try {
    modalManager.isDeletingAllFields.value = true
    const documentPath = currentDoc.name
    const documentId = getDocumentId(documentPath)

    // Get collection ID from the document path or current level
    const pathParts = documentPath.split('/')
    const collectionId = pathParts[pathParts.length - 2]

    // Update the document with empty fields (keeping the document in place)
    await firestoreStore.updateDocument(currentProjectId.value, collectionId, documentId, { fields: {} })

    // Refresh the specific collection's documents without resetting navigation
    await firestoreStore.loadDocuments(currentProjectId.value, collectionId)

    // Update the navigation stack with the refreshed document data
    const refreshedDocuments = firestoreStore.getDocumentsByCollection(collectionId)
    const refreshedDocument = refreshedDocuments.find(doc => getDocumentId(doc.name) === documentId)
    if (refreshedDocument) {
      navigation.selectItem(refreshedDocument)
    }

  } catch (error) {
    console.error('Failed to delete all fields:', error)
  } finally {
    modalManager.isDeletingAllFields.value = false
    modalManager.closeDeleteAllFieldsModal()
  }
}

const confirmDeleteField = async () => {
  if (!modalManager.fieldToDelete.value) return

  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  if (!currentDoc) return

  try {
    modalManager.isDeletingField.value = true

    // Create a copy of the document fields
    const updatedFields = { ...currentDoc.fields }
    const fieldPath = modalManager.fieldToDelete.value.path

    // Handle field deletion using path navigation
    const pathParts = fieldPath.split('.')
    let targetObject = updatedFields

    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (targetObject[part]?.mapValue?.fields) {
        targetObject = targetObject[part].mapValue.fields
      }
    }

    // Delete the field
    const fieldToDeleteName = pathParts[pathParts.length - 1]
    delete targetObject[fieldToDeleteName]

    // Update the document
    const documentPath = currentDoc.name
    const pathSegments = documentPath.split('/')
    const collectionId = pathSegments[pathSegments.length - 2]
    const documentId = pathSegments[pathSegments.length - 1]

    await firestoreStore.updateDocument(currentProjectId.value, collectionId, documentId, { fields: updatedFields })

    // Refresh the specific collection's documents without resetting navigation
    await firestoreStore.loadDocuments(currentProjectId.value, collectionId)

    // Update the navigation stack with the refreshed document data
    const refreshedDocuments = firestoreStore.getDocumentsByCollection(collectionId)
    const refreshedDocument = refreshedDocuments.find(doc => getDocumentId(doc.name) === documentId)
    if (refreshedDocument) {
      navigation.selectItem(refreshedDocument)
    }

  } catch (error) {
    console.error('Failed to delete field:', error)
  } finally {
    modalManager.isDeletingField.value = false
    modalManager.closeDeleteFieldModal()
  }
}

const handleCollectionCreated = async (collectionId: string) => {
  await refreshCollections()

  // Navigate to the newly created collection if we're at the root level
  if (navigation.isAtRoot.value) {
    const newCollection = collections.value.find(c => c.id === collectionId)
    if (newCollection) {
      const documents = await loadDocumentsForCollection(collectionId)
      await navigation.navigateToCollection(newCollection, documents)

      // Auto-select the first document if any exist
      if (documents.length > 0) {
        const firstDocument = documents[0]
        navigation.selectItem(firstDocument)

        // Load subcollections for the first document
        const subcollections = await navigation.loadSubcollections(firstDocument.name)
        documentSubcollections.value.set(firstDocument.name, subcollections)
      }
    }
  }
}

const handleDocumentCreated = async (documentId: string) => {
  // Refresh the current level to show the new document
  const currentLevel = navigation.currentLevel.value
  if (currentLevel) {
    if (currentLevel.type === 'collection') {
      // Refresh documents for the current collection
      const documents = await loadDocumentsForCollection(currentLevel.collectionId || '')
      currentLevel.items = documents

      // Auto-select the new document
      const newDocument = documents.find(doc => getDocumentId(doc.name) === documentId)
      if (newDocument) {
        navigation.selectItem(newDocument)
        // Load subcollections for the new document
        const subcollections = await navigation.loadSubcollections(newDocument.name)
        documentSubcollections.value.set(newDocument.name, subcollections)
      }
    } else if (currentLevel.type === 'subcollection') {
      // Refresh subcollection documents
      const documents = await navigation.loadSubcollectionDocuments(
        currentLevel.parentPath || '',
        currentLevel.collectionId || ''
      )
      currentLevel.items = documents

      // Auto-select the new document
      const newDocument = documents.find(doc => getDocumentId(doc.name) === documentId)
      if (newDocument) {
        navigation.selectItem(newDocument)
      }
    }
  }
}

const handleFieldModalSave = async (data: any) => {
  const currentDoc = getColumnThreeDocument(navigation.currentStackIndex.value)
  if (!currentDoc) return

  try {
    // Update the document with the new/modified field
    const updatedFields = { ...currentDoc.fields }

    // Handle field path navigation for nested fields
    const fieldPath = data.fieldPath || data.fieldName
    const pathParts = fieldPath.split('.')
    let targetObject = updatedFields

    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (!targetObject[part]) {
        targetObject[part] = { mapValue: { fields: {} } }
      }
      if (targetObject[part]?.mapValue?.fields) {
        targetObject = targetObject[part].mapValue.fields
      }
    }

    // Set the field value - convert to proper Firestore format
    const fieldName = pathParts[pathParts.length - 1]
    targetObject[fieldName] = buildFirestoreValue(data.fieldValue)

    // Update the document
    const documentPath = currentDoc.name
    const pathSegments = documentPath.split('/')
    const collectionId = pathSegments[pathSegments.length - 2]
    const documentId = pathSegments[pathSegments.length - 1]

    await firestoreStore.updateDocument(currentProjectId.value, collectionId, documentId, { fields: updatedFields })

    // Refresh the specific collection's documents without resetting navigation
    await firestoreStore.loadDocuments(currentProjectId.value, collectionId)

    // Update the navigation stack with the refreshed document data
    const refreshedDocuments = firestoreStore.getDocumentsByCollection(collectionId)
    const refreshedDocument = refreshedDocuments.find(doc => getDocumentId(doc.name) === documentId)
    if (refreshedDocument) {
      navigation.selectItem(refreshedDocument)
    }

  } catch (error) {
    console.error('Failed to save field:', error)
  } finally {
    modalManager.closeFieldModal()
  }
}

// Event handlers
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && modalManager.showFieldModal.value) {
    modalManager.closeFieldModal()
  }
}

// Lifecycle
watch(currentProjectId, async (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId && oldProjectId) {
    firestoreStore.clearData()
    navigation.clearNavigation()
    clearExpandedFields()
    documentSubcollections.value.clear()

    if (newProjectId) {
      await refreshCollections()
    }
  }
}, { immediate: false })

onMounted(async () => {
  await refreshCollections()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>