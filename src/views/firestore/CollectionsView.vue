<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <!-- Navigation and Title -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <router-link
                :to="`/projects/${currentProjectId}`"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeftIcon class="w-5 h-5" />
              </router-link>

              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <h1 class="text-sm sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    Firestore Database
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

    <!-- Breadcrumb Navigation -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
          <span>/</span>
          <template v-if="selectedCollection">
            <ChevronRightIcon class="w-3 h-3 mx-1" />
            <span class="text-blue-600 dark:text-blue-400">{{ selectedCollection.id }}</span>
          </template>
          <template v-if="selectedDocument">
            <ChevronRightIcon class="w-3 h-3 mx-1" />
            <span class="text-blue-600 dark:text-blue-400">{{ getDocumentId(selectedDocument.name) }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Three Panel Layout -->
    <div class="flex h-screen-header">
      <!-- Left Panel - Collections List -->
      <div class="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div class="p-4">
          <!-- Database Name -->
          <div class="mb-3">
            <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
              <span>(default)</span>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
          </div>

          <div class="mb-4">
            <button
              @click="showCreateCollectionModal = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Start collection
            </button>
          </div>

          <!-- Collections Tree -->
          <div class="space-y-1">
            <div
              v-for="collection in collections"
              :key="collection.id"
              class="group"
            >
              <div
                :class="[
                  'flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200',
                  selectedCollection?.id === collection.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
                @click="selectCollection(collection)"
              >
                <ChevronRightIcon
                  :class="[
                    'w-4 h-4 mr-1 transition-transform duration-200',
                    collection.isExpanded ? 'rotate-90' : ''
                  ]"
                />
                <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
                <span class="truncate">{{ collection.id }}</span>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="collections.length === 0 && !firestoreStore.loading"
              class="text-center py-8"
            >
              <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No collections found
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Center Panel - Documents List -->
      <div class="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div class="p-4">
          <!-- Collection Header with Breadcrumb Style -->
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
              <span class="text-gray-900 dark:text-white">{{ selectedCollection ? selectedCollection.id : 'Select a collection' }}</span>
              <div v-if="selectedCollection" class="relative" data-collection-menu>
                <button
                  @click="showCollectionMenu = !showCollectionMenu"
                  class="p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <EllipsisVerticalIcon class="w-3 h-3" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="showCollectionMenu"
                  class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[160px]"
                  @click.stop
                >
                  <button
                    @click="handleDeleteCollection"
                    class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
                  >
                    Delete collection
                  </button>
                </div>
              </div>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
          </div>

          <div class="mb-4">
            <button
              v-if="selectedCollection"
              @click="showAddDocumentModal = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Add document
            </button>
          </div>

          <!-- Documents List -->
          <div v-if="selectedCollection" class="space-y-1">
            <div
              v-for="document in documents"
              :key="document.name"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
                selectedDocument?.name === document.name
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
              @click="selectDocument(document)"
            >
              <span class="truncate">{{ getDocumentId(document.name) }}</span>
            </div>

            <!-- Empty documents state -->
            <div
              v-if="documents.length === 0 && !firestoreStore.loading"
              class="text-center py-8"
            >
              <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No documents in this collection
              </p>
              <button
                @click="showAddDocumentModal = true"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
              >
                <PlusIcon class="w-4 h-4 mr-2" />
                Add your first document
              </button>
            </div>
          </div>

          <!-- No collection selected state -->
          <div
            v-else
            class="text-center py-16"
          >
            <CircleStackIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a collection
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Choose a collection from the left panel to view its documents
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Document Editor -->
      <div class="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
        <div class="p-4">
          <!-- Document Header -->
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
              <span class="text-gray-900 dark:text-white">{{ selectedDocument ? getDocumentId(selectedDocument.name) : 'Document' }}</span>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600"></div>
          </div>

          <div v-if="selectedCollection" class="mb-4">
            <button
              @click="showCreateCollectionModal = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Start collection
            </button>
          </div>

          <div v-if="selectedDocument" class="mb-4">
            <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
            <button
              @click="showAddFieldModal = true"
              class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Add field
            </button>
          </div>

          <!-- Document Fields -->
          <div v-if="selectedDocument" class="space-y-1">
            <div
              v-for="(value, fieldName) in selectedDocument.fields"
              :key="fieldName"
              class="group flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 px-2 py-1 rounded-md"
            >
              <div class="flex items-center">
                <span class="text-blue-600 dark:text-blue-400 font-mono mr-1">{{ fieldName }}:</span>
                <span class="text-gray-900 dark:text-white font-mono">"{{ formatFieldValue(value) }}"</span>
              </div>
              
              <!-- Hover Actions -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <!-- Type indicator -->
                <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                  {{ getFieldType(value) }}
                </span>
                
                <!-- Edit button -->
                <button
                  @click="handleEditField(fieldName, value)"
                  class="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit field"
                >
                  <PencilIcon class="w-4 h-4" />
                </button>
                
                <!-- Delete button -->
                <button
                  @click="handleDeleteField(fieldName)"
                  class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete field"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- No document selected state -->
          <div
            v-else
            class="text-center py-16"
          >
            <DocumentIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a document
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Choose a document from the center panel to view its fields
            </p>
            <div v-if="selectedCollection" class="mt-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                There's no document in this path yet
              </p>
              <a href="#" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Start Collection Modal -->
    <StartCollectionModal
      v-model="showCreateCollectionModal"
      :project-id="currentProjectId"
      @created="handleCollectionCreated"
    />

    <!-- Delete Confirmation Modal -->
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

    <!-- Add Field Modal -->
    <AddFieldModal
      v-model="showAddFieldModal"
      @add-field="handleAddField"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  CircleStackIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

import { useFirestoreStore } from '@/stores/firestore'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import AddFieldModal from '@/components/modals/AddFieldModal.vue'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Reactive state
const showCreateCollectionModal = ref(false)
const showAddDocumentModal = ref(false)
const showAddFieldModal = ref(false)
const showCollectionMenu = ref(false)
const showDeleteCollectionModal = ref(false)
const isDeletingCollection = ref(false)
const collectionToDelete = ref<FirestoreCollectionWithMetadata | null>(null)
const selectedCollection = ref<FirestoreCollectionWithMetadata | null>(null)
const selectedDocument = ref<FirestoreDocument | null>(null)

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

  // If a collection is currently selected, reload its documents too
  if (selectedCollection.value) {
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)

    // Also reselect the first document if we had one selected
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

  // Auto-select the first document if available
  await nextTick()
  const docs = documents.value
  if (docs.length > 0) {
    selectDocument(docs[0])
  }
}

const selectDocument = (document: FirestoreDocument) => {
  selectedDocument.value = document
}

const handleCollectionCreated = async (collectionId: string) => {
  // Refresh collections list
  await refreshCollections()

  // Auto-select the newly created collection
  const newCollection = collections.value.find(c => c.id === collectionId)
  if (newCollection) {
    await selectCollection(newCollection)

    // Wait for reactivity to update documents
    await nextTick()

    // Auto-select the first document to show its fields
    const docs = documents.value
    if (docs.length > 0) {
      selectDocument(docs[0])
    }
  }
}

const handleAddField = async (field: any) => {
  if (!selectedDocument.value) return

  try {
    // Store the current document name for re-selection
    const currentDocumentName = selectedDocument.value.name

    // Add the field to the document
    await firestoreStore.addFieldToDocument(
      currentProjectId.value,
      selectedCollection.value.id,
      selectedDocument.value.name,
      field
    )

    // Wait for reactivity to update the documents list
    await nextTick()

    // Find and select the updated document from the refreshed list
    const updatedDocument = documents.value.find(doc => doc.name === currentDocumentName)
    if (updatedDocument) {
      selectedDocument.value = updatedDocument
    }
  } catch (error) {
    console.error('Failed to add field:', error)
  }
}

const handleDeleteCollection = () => {
  showCollectionMenu.value = false
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

    // Clear selection if we deleted the currently selected collection
    if (selectedCollection.value?.id === collectionToDelete.value.id) {
      selectedCollection.value = null
      selectedDocument.value = null
    }

    showDeleteCollectionModal.value = false
    collectionToDelete.value = null

    // Refresh collections list
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

// Click outside handler for collection menu
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-collection-menu]')) {
    showCollectionMenu.value = false
  }
}

const getDocumentId = (documentPath: string): string => {
  return documentPath.split('/').pop() || documentPath
}


const formatFieldValue = (value: any): string => {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return value.integerValue
  if (value.booleanValue !== undefined) return value.booleanValue.toString()
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.arrayValue !== undefined) return JSON.stringify(value.arrayValue.values, null, 2)
  if (value.mapValue !== undefined) return JSON.stringify(value.mapValue.fields, null, 2)
  if (value.referenceValue !== undefined) return value.referenceValue
  if (value.geoPointValue !== undefined) return `${value.geoPointValue.latitude}, ${value.geoPointValue.longitude}`
  if (value.bytesValue !== undefined) return value.bytesValue
  if (value.nullValue !== undefined) return 'null'
  return JSON.stringify(value, null, 2)
}

const getFieldType = (value: any): string => {
  if (value.stringValue !== undefined) return 'string'
  if (value.integerValue !== undefined) return 'number'
  if (value.booleanValue !== undefined) return 'boolean'
  if (value.timestampValue !== undefined) return 'timestamp'
  if (value.arrayValue !== undefined) return 'array'
  if (value.mapValue !== undefined) return 'map'
  if (value.referenceValue !== undefined) return 'reference'
  if (value.geoPointValue !== undefined) return 'geopoint'
  if (value.bytesValue !== undefined) return 'bytes'
  if (value.nullValue !== undefined) return 'null'
  return 'unknown'
}

const handleEditField = (fieldName: string, fieldValue: any) => {
  // This will be used to open an edit modal or inline editing
  console.log('Edit field:', fieldName, fieldValue)
  // For now, we can add this functionality later
}

const handleDeleteField = async (fieldName: string) => {
  if (!selectedDocument.value || !selectedCollection.value) return
  
  // Store the current document name for re-selection
  const currentDocumentName = selectedDocument.value.name
  
  // Get the current document data
  const currentData = { ...selectedDocument.value.fields }
  
  // Remove the field
  delete currentData[fieldName]
  
  // Update the document
  try {
    await firestoreStore.updateDocument(
      route.params.projectId as string,
      selectedCollection.value.name,
      getDocumentId(selectedDocument.value.name),
      currentData
    )
    
    // Wait for reactivity to update the documents list
    await nextTick()
    
    // Find and select the updated document from the refreshed list
    const updatedDocument = documents.value.find(doc => doc.name === currentDocumentName)
    if (updatedDocument) {
      selectedDocument.value = updatedDocument
    }
  } catch (error) {
    console.error('Error deleting field:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await refreshCollections()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.h-screen-header {
  height: calc(100vh - 130px); /* Adjust based on header height */
}
</style>