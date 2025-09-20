<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <!-- Navigation and Title -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <h1 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                    Collections ({{ collections.length }})
                  </h1>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="refreshCollections"
                :disabled="firestoreStore.loading"
                class="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ArrowPathIcon
                  :class="['w-4 h-4', firestoreStore.loading ? 'animate-spin' : '', 'sm:mr-2']"
                />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Breadcrumb Navigator -->
    <NavigationBreadcrumb
      :navigation-path="navigationPath"
      :selected-collection="selectedCollection"
      :selected-document="selectedDocument"
      :selected-subcollection-document="selectedSubcollectionDocument"
      :is-in-subcollection-mode="isInSubcollectionMode"
      @navigate-to-root="navigateToRoot"
      @navigate-to-collection="navigateToCollection"
      @navigate-to-segment="navigateToSegment"
    />

    <!-- Sliding Panel Layout -->
    <SlidingContainer :slide-offset="slideOffset">
      <!-- Root Level (Level 0) -->
      <div class="flex-shrink-0 w-full flex">
        <!-- Collections Panel -->
        <CollectionsPanel
          :collections="collections"
          :selected-collection="selectedCollection"
          :loading="firestoreStore.loading"
          @create-collection="showCreateCollectionModal = true"
          @select-collection="selectCollection"
        />

        <!-- Documents Panel -->
        <DocumentsPanel
          :selected-collection="selectedCollection"
          :selected-document="selectedDocument"
          :documents="documents"
          :loading="firestoreStore.loading"
          @add-document="showAddDocumentModal = true"
          @select-document="selectDocument"
          @delete-collection="handleDeleteCollection"
        />

        <!-- Document Editor -->
        <DocumentEditor
          v-if="selectedDocument"
          :selected-document="selectedDocument"
          :subcollections="currentDocumentSubcollections"
          :expanded-fields="expandedMapFields"
          @start-subcollection="handleStartSubcollection"
          @navigate-to-subcollection="navigateToSubcollection"
          @add-field="handleShowAddFieldModal"
          @toggle-field="toggleMapField"
          @edit-field="handleEditField"
          @delete-field="handleDeleteField"
          @add-to-map="handleAddToMap"
          @add-to-array="handleAddToArray"
          @clone-document="handleAddSimilarDocument"
          @delete-all-fields="handleDeleteAllFields"
          @delete-document="handleDeleteDocument"
        />
      </div>

      <!-- Subcollection Level (Level 1) - Simplified for now -->
      <div class="flex-shrink-0 w-full flex">
        <div class="w-full bg-white dark:bg-gray-800 p-8 text-center">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Subcollection View</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Subcollection navigation will be implemented here</p>
        </div>
      </div>
    </SlidingContainer>

    <!-- Modals -->
    <StartCollectionModal
      v-model="showCreateCollectionModal"
      :project-id="currentProjectId"
      :parent-document-path="currentDocumentPath"
      @created="handleCollectionCreated"
    />

    <AddDocumentModal
      v-model="showAddDocumentModal"
      :project-id="currentProjectId"
      :collection-id="selectedCollection?.id || ''"
      :clone-document="cloneDocumentData"
      @created="handleDocumentCreated"
      @close="cloneDocumentData = null"
    />

    <!-- Confirmation Modals -->
    <ConfirmationModal
      v-model="showDeleteCollectionModal"
      title="Delete Collection"
      :message="`Are you sure you want to delete collection '${collectionToDelete ? collectionToDelete.id : ''}'?`"
      confirm-label="Delete Collection"
      :is-loading="isDeletingCollection"
      :details="{
        title: 'What will happen:',
        description: 'The collection and all its documents will be permanently deleted. This action cannot be undone.'
      }"
      @confirm="confirmDeleteCollection"
      @cancel="cancelDeleteCollection"
    />

    <ConfirmationModal
      v-model="showDeleteDocumentModal"
      title="Delete Document"
      :message="`Are you sure you want to delete document '${documentToDelete ? getDocumentId(documentToDelete.name) : ''}'?`"
      confirm-label="Delete Document"
      :is-loading="isDeletingDocument"
      :details="{
        title: 'What will happen:',
        description: 'The document will be permanently deleted. This action cannot be undone.'
      }"
      @confirm="confirmDeleteDocument"
      @cancel="cancelDeleteDocument"
    />

    <ConfirmationModal
      v-model="showDeleteAllFieldsModal"
      title="Delete All Fields"
      :message="`Are you sure you want to delete all fields from document '${selectedDocument ? getDocumentId(selectedDocument.name) : ''}'?`"
      confirm-label="Delete All Fields"
      :is-loading="isDeletingAllFields"
      :details="{
        title: 'What will happen:',
        description: 'All fields in the document will be deleted, leaving an empty document. This action cannot be undone.'
      }"
      @confirm="confirmDeleteAllFields"
      @cancel="cancelDeleteAllFields"
    />

    <ConfirmationModal
      v-model="showDeleteFieldModal"
      title="Delete Field"
      :message="`Are you sure you want to delete field '${fieldToDelete ? fieldToDelete.displayName : ''}'?`"
      confirm-label="Delete Field"
      :is-loading="isDeletingField"
      :details="{
        title: 'What will happen:',
        description: 'The field will be permanently removed from this document. This action cannot be undone.'
      }"
      @confirm="confirmDeleteField"
      @cancel="cancelDeleteField"
    />

    <FieldModal
      v-model="showFieldModal"
      :mode="fieldModalMode"
      :initial-field-name="fieldModalData.fieldName"
      :initial-field-type="fieldModalData.fieldType"
      :initial-field-value="fieldModalData.fieldValue"
      :field-path="fieldModalData.fieldPath"
      :is-new-field="fieldModalData.isNew"
      :parent-path="fieldModalData.parentPath"
      @save="handleFieldModalSave"
      @close="handleFieldModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

// Store and API
import { useFirestoreStore } from '@/stores/firestore'
import firestoreApi from '@/api/firestore'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

// Components
import NavigationBreadcrumb from '@/components/firestore/navigation/NavigationBreadcrumb.vue'
import SlidingContainer from '@/components/firestore/navigation/SlidingContainer.vue'
import CollectionsPanel from '@/components/firestore/panels/CollectionsPanel.vue'
import DocumentsPanel from '@/components/firestore/panels/DocumentsPanel.vue'
import DocumentEditor from '@/components/firestore/panels/DocumentEditor.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import FieldModal from '@/components/firestore/FieldModal.vue'
import StartCollectionModal from '@/components/firestore/StartCollectionModal.vue'
import AddDocumentModal from '@/components/firestore/AddDocumentModal.vue'

// Composables
import { useFieldNavigation } from '@/composables/useFieldNavigation'
import { useFieldOperations } from '@/composables/useFieldOperations'
import { useFirestoreNavigation } from '@/composables/useFirestoreNavigation'

// Utils
import { getDocumentId } from '@/utils/firestoreHelpers'
import { createFirestoreValue } from '@/utils/fieldUtils'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Composables
const { navigateToFieldPath, navigateToParentPath } = useFieldNavigation()
const {
  expandedMapFields,
  toggleMapField,
  clearExpandedFields,
  restoreExpandedFields,
  formatFieldValue,
  getFieldType,
  getEditableValue
} = useFieldOperations()
const {
  slideOffset,
  navigationPath,
  selectedCollection,
  selectedDocument,
  selectedSubcollection,
  selectedSubcollectionDocument,
  currentSubcollections,
  subcollectionDocuments,
  documentSubcollections,
  isInSubcollectionMode,
  currentDocumentPath,
  currentDocumentSubcollections,
  slideToSubcollectionLevel,
  slideToRootLevel,
  navigateToRoot,
  navigateToCollection,
  navigateToSubcollection,
  clearData
} = useFirestoreNavigation()

// Modal states
const showCreateCollectionModal = ref(false)
const showAddDocumentModal = ref(false)
const cloneDocumentData = ref<FirestoreDocument | null>(null)
const showDeleteCollectionModal = ref(false)
const isDeletingCollection = ref(false)
const collectionToDelete = ref<FirestoreCollectionWithMetadata | null>(null)
const showDeleteDocumentModal = ref(false)
const isDeletingDocument = ref(false)
const documentToDelete = ref<FirestoreDocument | null>(null)
const showDeleteAllFieldsModal = ref(false)
const isDeletingAllFields = ref(false)
const showDeleteFieldModal = ref(false)
const isDeletingField = ref(false)
const fieldToDelete = ref<{ path: string; displayName: string } | null>(null)

// Field modal state
const showFieldModal = ref(false)
const fieldModalMode = ref<'add' | 'edit'>('add')
const fieldModalData = ref({
  fieldName: '',
  fieldType: 'string',
  fieldValue: '',
  fieldPath: '',
  isNew: false,
  parentPath: ''
})

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)
const collections = computed(() => firestoreStore.collections)
const documents = computed(() => {
  if (!selectedCollection.value) return []
  return firestoreStore.getDocumentsByCollection(selectedCollection.value.id)
})

// Methods
const refreshCollections = async () => {
  await firestoreStore.loadCollections(currentProjectId.value)

  if (selectedCollection.value) {
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    await nextTick()
    if (selectedDocument.value) {
      const docs = documents.value
      const currentDocId = getDocumentId(selectedDocument.value.name)
      const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
      if (foundDoc) {
        selectDocument(foundDoc)
      } else if (docs.length > 0) {
        selectDocument(docs[0])
      }
    }
  }
}

const selectCollection = async (collection: FirestoreCollectionWithMetadata) => {
  selectedCollection.value = collection
  selectedDocument.value = null
  await firestoreStore.loadDocuments(currentProjectId.value, collection.id)

  await nextTick()
  const docs = documents.value
  if (docs.length > 0) {
    selectDocument(docs[0])
  }
}

const selectDocument = async (document: FirestoreDocument) => {
  selectedDocument.value = document
  clearExpandedFields()
  await loadDocumentSubcollections(document)
}

const loadDocumentSubcollections = async (document: FirestoreDocument) => {
  if (!currentDocumentPath.value) return

  try {
    const subcollections = await firestoreStore.loadSubcollections(document.name)
    documentSubcollections.value.set(currentDocumentPath.value, subcollections)
  } catch (error) {
    console.error('Failed to load subcollections for document:', error)
    documentSubcollections.value.set(currentDocumentPath.value, [])
  }
}

// Navigation handlers
const navigateToSegment = async (segmentIndex: number) => {
  // Implement segment navigation logic
  console.log('Navigate to segment:', segmentIndex)
}

// Collection handlers
const handleDeleteCollection = () => {
  if (selectedCollection.value) {
    collectionToDelete.value = selectedCollection.value
    showDeleteCollectionModal.value = true
  }
}

const confirmDeleteCollection = async () => {
  if (!collectionToDelete.value) return

  try {
    isDeletingCollection.value = true
    await firestoreStore.deleteCollection(currentProjectId.value, collectionToDelete.value.id)

    if (selectedCollection.value?.id === collectionToDelete.value.id) {
      selectedCollection.value = null
      selectedDocument.value = null
    }

    showDeleteCollectionModal.value = false
    collectionToDelete.value = null
    await refreshCollections()
  } catch (error) {
    console.error('Failed to delete collection:', error)
  } finally {
    isDeletingCollection.value = false
  }
}

const cancelDeleteCollection = () => {
  showDeleteCollectionModal.value = false
  collectionToDelete.value = null
}

// Document handlers
const handleCollectionCreated = async (collectionId: string) => {
  if (selectedDocument.value && selectedCollection.value) {
    // Handle subcollection creation
    await loadDocumentSubcollections(selectedDocument.value)
  } else {
    // Handle root collection creation
    await refreshCollections()
    const newCollection = collections.value.find(c => c.id === collectionId)
    if (newCollection) {
      await selectCollection(newCollection)
      await nextTick()
      const docs = documents.value
      if (docs.length > 0) {
        selectDocument(docs[0])
      }
    }
  }
}

const handleDocumentCreated = async (documentId: string) => {
  if (selectedCollection.value) {
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    await nextTick()
    const docs = documents.value
    const newDocument = docs.find(doc => getDocumentId(doc.name) === documentId)
    if (newDocument) {
      selectDocument(newDocument)
    }
  }
}

const handleStartSubcollection = () => {
  showCreateCollectionModal.value = true
}

const handleAddSimilarDocument = () => {
  if (selectedDocument.value) {
    cloneDocumentData.value = selectedDocument.value
    showAddDocumentModal.value = true
  }
}

const handleDeleteDocument = () => {
  if (selectedDocument.value) {
    documentToDelete.value = selectedDocument.value
    showDeleteDocumentModal.value = true
  }
}

const confirmDeleteDocument = async () => {
  if (!documentToDelete.value || !selectedCollection.value) return

  try {
    isDeletingDocument.value = true
    const documentPath = documentToDelete.value.name
    await firestoreStore.deleteDocument(documentPath, selectedCollection.value.id)

    if (selectedDocument.value?.name === documentToDelete.value.name) {
      selectedDocument.value = null
    }

    showDeleteDocumentModal.value = false
    documentToDelete.value = null
  } catch (error) {
    console.error('Failed to delete document:', error)
  } finally {
    isDeletingDocument.value = false
  }
}

const cancelDeleteDocument = () => {
  showDeleteDocumentModal.value = false
  documentToDelete.value = null
}

const handleDeleteAllFields = () => {
  if (selectedDocument.value) {
    showDeleteAllFieldsModal.value = true
  }
}

const confirmDeleteAllFields = async () => {
  if (!selectedDocument.value || !selectedCollection.value) return

  try {
    isDeletingAllFields.value = true
    const documentPath = selectedDocument.value.name
    const documentId = getDocumentId(documentPath)

    await firestoreStore.deleteDocument(documentPath, selectedCollection.value.id)
    await firestoreStore.createDocument(
      currentProjectId.value,
      selectedCollection.value.id,
      { fields: {} },
      documentId
    )

    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    const documents = firestoreStore.getDocumentsByCollection(selectedCollection.value.id)
    const recreatedDoc = documents.find(doc => getDocumentId(doc.name) === documentId)
    if (recreatedDoc) {
      selectedDocument.value = recreatedDoc
    }

    showDeleteAllFieldsModal.value = false
  } catch (error) {
    console.error('Failed to delete all fields:', error)
  } finally {
    isDeletingAllFields.value = false
  }
}

const cancelDeleteAllFields = () => {
  showDeleteAllFieldsModal.value = false
}

// Field handlers
const handleShowAddFieldModal = () => {
  fieldModalMode.value = 'add'
  fieldModalData.value = {
    fieldName: '',
    fieldType: 'string',
    fieldValue: '',
    fieldPath: '',
    isNew: true,
    parentPath: ''
  }
  showFieldModal.value = true
}

const handleEditField = (data: { path: string; fieldName: string; fieldValue: any }) => {
  fieldModalMode.value = 'edit'
  fieldModalData.value = {
    fieldName: data.fieldName,
    fieldType: getFieldType(data.fieldValue),
    fieldValue: getEditableValue(data.fieldValue),
    fieldPath: data.path,
    isNew: false,
    parentPath: ''
  }
  showFieldModal.value = true
}

const handleDeleteField = (data: { path: string; displayName: string }) => {
  fieldToDelete.value = data
  showDeleteFieldModal.value = true
}

const confirmDeleteField = async () => {
  if (!fieldToDelete.value || !selectedDocument.value || !selectedCollection.value) return

  try {
    isDeletingField.value = true
    const updatedFields = { ...selectedDocument.value.fields }
    const fieldPath = fieldToDelete.value.path

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
      console.error('Navigation error during field deletion:', navigationError)
      throw new Error(`Failed to navigate to field for deletion: ${navigationError.message}`)
    }

    await firestoreStore.updateDocument(
      currentProjectId.value,
      selectedCollection.value.id,
      getDocumentId(selectedDocument.value.name),
      { fields: updatedFields }
    )

    const expandedFieldsCopy = new Set(expandedMapFields.value)
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)

    const docs = documents.value
    const currentDocId = getDocumentId(selectedDocument.value.name)
    const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
    if (foundDoc) {
      selectDocument(foundDoc)
      restoreExpandedFields(expandedFieldsCopy)
    }

    showDeleteFieldModal.value = false
    fieldToDelete.value = null
  } catch (error) {
    console.error('Failed to delete field:', error)
  } finally {
    isDeletingField.value = false
  }
}

const cancelDeleteField = () => {
  showDeleteFieldModal.value = false
  fieldToDelete.value = null
}

const handleAddToMap = (fieldPath: string) => {
  fieldModalMode.value = 'add'
  fieldModalData.value = {
    fieldName: '',
    fieldType: 'string',
    fieldValue: '',
    fieldPath: `${fieldPath}.newField`,
    isNew: true,
    parentPath: fieldPath
  }
  showFieldModal.value = true
}

const handleAddToArray = (fieldPath: string) => {
  fieldModalMode.value = 'add'
  fieldModalData.value = {
    fieldName: '',
    fieldType: 'string',
    fieldValue: '',
    fieldPath: `${fieldPath}[new]`,
    isNew: true,
    parentPath: fieldPath
  }
  showFieldModal.value = true
}

const handleFieldModalSave = async (data: {
  fieldName: string
  fieldType: string
  fieldValue: any
  fieldPath?: string
  isNewField?: boolean
  parentPath?: string
}) => {
  if (!selectedDocument.value || !selectedCollection.value) return

  try {
    if (fieldModalMode.value === 'add') {
      const firestoreValue = createFirestoreValue(data.fieldType, data.fieldValue)
      const updatedFields = { ...selectedDocument.value.fields }

      if (data.parentPath) {
        if (data.fieldPath?.includes('[new]')) {
          try {
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
          } catch (error) {
            throw new Error(`Failed to add item to array at path "${data.parentPath}": ${error.message}`)
          }
        } else {
          try {
            const targetMap = navigateToFieldPath(updatedFields, data.parentPath)
            if (targetMap?.mapValue) {
              if (!targetMap.mapValue.fields) {
                targetMap.mapValue.fields = {}
              }
              targetMap.mapValue.fields[data.fieldName] = firestoreValue
            }
          } catch (error) {
            throw new Error(`Failed to add field to map at path "${data.parentPath}": ${error.message}`)
          }
        }
      } else {
        updatedFields[data.fieldName] = firestoreValue
      }

      await firestoreStore.updateDocument(
        currentProjectId.value,
        selectedCollection.value.id,
        getDocumentId(selectedDocument.value.name),
        { fields: updatedFields }
      )
    } else {
      // Handle edit field
      const firestoreValue = createFirestoreValue(data.fieldType, data.fieldValue)
      const updatedFields = { ...selectedDocument.value.fields }
      const fieldPath = data.fieldPath!

      if (fieldPath.includes('.') || fieldPath.includes('[')) {
        try {
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
        } catch (error) {
          console.error('Error navigating to field path for editing:', error)
          throw error
        }
      } else {
        updatedFields[fieldPath] = firestoreValue
      }

      await firestoreStore.updateDocument(
        currentProjectId.value,
        selectedCollection.value.id,
        getDocumentId(selectedDocument.value.name),
        { fields: updatedFields }
      )
    }

    const expandedFieldsCopy = new Set(expandedMapFields.value)
    if (fieldModalMode.value === 'add' && data.parentPath) {
      expandedFieldsCopy.add(data.parentPath)
    }

    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    const docs = documents.value
    const currentDocId = getDocumentId(selectedDocument.value.name)
    const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
    if (foundDoc) {
      selectDocument(foundDoc)
      restoreExpandedFields(expandedFieldsCopy)
    }

    showFieldModal.value = false
  } catch (error) {
    console.error('Failed to save field:', error)
  }
}

const handleFieldModalClose = () => {
  showFieldModal.value = false
}

// Click outside handler for menus
const handleClickOutside = (event: Event) => {
  // Implement if needed for menu interactions
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showFieldModal.value) {
      showFieldModal.value = false
    }
  }
}

// Watch for project changes
watch(currentProjectId, async (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId && oldProjectId) {
    firestoreStore.clearData()
    clearData()
    clearExpandedFields()

    if (newProjectId) {
      await refreshCollections()
    }
  }
}, { immediate: false })

onMounted(async () => {
  await refreshCollections()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.h-screen-header {
  height: calc(100vh - 130px);
}
</style>