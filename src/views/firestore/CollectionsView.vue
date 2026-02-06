<template>
  <div class="h-full bg-gray-50 dark:bg-gray-900 theme-transition-bg flex flex-col">
    <!-- Loading indicator for path navigation -->
    <Transition
      enter-active-class="transition"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isNavigatingToPath"
        class="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center space-x-3 theme-transition-colors"
        >
          <div
            class="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"
          ></div>
          <p class="text-sm text-gray-700 dark:text-gray-300">Navigating to document...</p>
        </div>
      </div>
    </Transition>

    <!-- Page Header -->
    <PageHeader
      :collections-count="collections.length"
      :loading="firestoreStore.loading"
      :available-databases="firestoreStore.availableDatabases"
      :selected-database="firestoreStore.selectedDatabase"
      :testing-database="firestoreStore.testingDatabase"
      @refresh="refreshCollections"
      @database-change="handleDatabaseChange"
      @add-database="handleAddDatabase"
      @remove-database="handleRemoveDatabase"
    />

    <!-- Desktop Breadcrumb Navigator -->
    <div class="hidden lg:block">
      <NavigationBreadcrumb
        :navigation-path="navigation.breadcrumbPath.value"
        :selected-collection="null"
        :selected-document="null"
        :selected-subcollection-document="null"
        :is-in-subcollection-mode="!navigation.isAtRoot.value"
        @navigate-to-root="navigation.navigateToRoot"
        @navigate-to-collection="() => {}"
        @navigate-to-segment="navigation.navigateToBreadcrumbIndex"
        @navigate-to-path="handleNavigateToPath"
      />
    </div>

    <!-- Mobile Navigation Header -->
    <div
      class="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 theme-transition-colors"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <!-- Back Button -->
          <button
            v-if="mobileNavigationStack.length > 1"
            @click="handleMobileBack()"
            class="inline-flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]"
          >
            <ChevronLeftIcon class="w-5 h-5" />
          </button>

          <!-- Current Level Title -->
          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ mobileCurrentLevel.title }}
            </span>
            <span
              v-if="mobileCurrentLevel.subtitle"
              class="text-xs text-gray-500 dark:text-gray-400 truncate"
            >
              {{ mobileCurrentLevel.subtitle }}
            </span>
          </div>
        </div>

        <!-- Navigation Level Indicator -->
        <div class="flex items-center space-x-1">
          <div
            v-for="(_, index) in mobileNavigationStack"
            :key="index"
            :class="[
              'w-2 h-2 rounded-full transition-colors',
              index === mobileNavigationStack.length - 1
                ? 'bg-blue-500'
                : 'bg-gray-300 dark:bg-gray-600',
            ]"
          ></div>
        </div>
      </div>
    </div>

    <!-- Desktop: Sliding Layout -->
    <div class="hidden lg:block flex-1">
      <SlidingContainer :slide-offset="navigation.slideOffset.value">
        <!-- Render each navigation level -->
        <div
          v-for="(level, levelIndex) in navigation.navigationStack.value"
          :key="`level-${levelIndex}`"
          class="flex-shrink-0 w-full flex h-full"
        >
          <!-- Column 1: Previous level items, collections, or document editor for deep navigation -->
          <DocumentEditor
            v-if="deepNavigation.shouldShowDocumentEditorInColumnOne(levelIndex)"
            :selected-document="deepNavigation.getColumnOneDocument(levelIndex)"
            :subcollections="deepNavigation.getColumnOneSubcollections(levelIndex)"
            :selected-subcollection="deepNavigation.getColumnOneSelectedSubcollection(levelIndex)"
            :expanded-fields="expandedMapFields"
            :column-mode="true"
            @start-subcollection="handleStartSubcollection('column-one')"
            @navigate-to-subcollection="handleNavigateToSubcollection(levelIndex, $event)"
            @add-field="handleColumnOneFieldOperations.addField"
            @toggle-field="toggleMapField"
            @edit-field="handleColumnOneFieldOperations.editField"
            @delete-field="handleColumnOneFieldOperations.deleteField"
            @add-to-map="modalManager.openAddToMapModal"
            @add-to-array="modalManager.openAddToArrayModal"
            @clone-document="handleCloneDocument"
            @delete-all-fields="modalManager.openDeleteAllFieldsModal"
            @delete-document="handleDeleteDocument"
          />
          <ColumnOne
            v-else
            :header="getColumnOneHeader(levelIndex)"
            :items="getColumnOneItems(levelIndex)"
            :selected-item="getColumnOneSelectedItem(levelIndex)"
            :show-add-button="getColumnOneShowAddButton(levelIndex)"
            :add-button-text="getColumnOneAddButtonText(levelIndex)"
            :empty-state-text="getColumnOneEmptyStateText(levelIndex)"
            :loading="firestoreStore.loading"
            :show-right-border="levelIndex === 0 && !level.selectedItem"
            :next-page-token="getColumnOneNextPageToken(levelIndex)"
            @add-item="handleColumnOneAddItem(levelIndex)"
            @select-item="handleColumnOneSelectItem(levelIndex, $event)"
            @load-more="handleColumnOneLoadMore(levelIndex)"
          />

          <!-- At root level with no collection selected: show merged columns 2+3 as empty state -->
          <div
            v-if="levelIndex === 0 && !level.selectedItem"
            class="w-2/3 h-full bg-white dark:bg-gray-800"
          ></div>

          <!-- Normal 3-column layout for deeper levels or when collection is selected -->
          <template v-else>
            <!-- Column 2: Current level items -->
            <ColumnTwo
              :header="level.header"
              :items="level.items"
              :selected-item="level.selectedItem"
              :next-page-token="level.nextPageToken"
              :show-add-button="getColumnTwoShowAddButton(levelIndex)"
              :add-button-text="getColumnTwoAddButtonText(levelIndex)"
              :empty-state-text="getColumnTwoEmptyStateText(levelIndex)"
              :show-selection-prompt="false"
              :show-collection-menu="getColumnTwoShowCollectionMenu(levelIndex)"
              :loading="firestoreStore.loading"
              @add-item="handleColumnTwoAddItem(levelIndex)"
              @select-item="handleColumnTwoSelectItem(levelIndex, $event)"
              @delete-collection="() => handleColumnTwoDeleteCollection(levelIndex)"
              @load-more="handleLoadMore(levelIndex)"
            />

            <!-- Column 3: Document Editor or empty state -->
            <DocumentEditor
              v-if="getColumnThreeDocument(levelIndex)"
              :selected-document="getColumnThreeDocument(levelIndex)"
              :subcollections="getColumnThreeSubcollections(levelIndex)"
              :selected-subcollection="getColumnThreeSelectedSubcollection(levelIndex)"
              :expanded-fields="expandedMapFields"
              :column-mode="true"
              @start-subcollection="handleStartSubcollection('column-three')"
              @navigate-to-subcollection="handleNavigateToSubcollection(levelIndex, $event)"
              @add-field="handleColumnThreeFieldOperations.addField"
              @toggle-field="toggleMapField"
              @edit-field="handleColumnThreeFieldOperations.editField"
              @delete-field="handleColumnThreeFieldOperations.deleteField"
              @add-to-map="modalManager.openAddToMapModal"
              @add-to-array="modalManager.openAddToArrayModal"
              @clone-document="handleCloneDocument"
              @delete-all-fields="modalManager.openDeleteAllFieldsModal"
              @delete-document="handleDeleteDocument"
            />

            <!-- Column 3: Empty state when no document selected -->
            <div v-else class="w-1/3 h-full bg-white dark:bg-gray-800"></div>
          </template>
        </div>
      </SlidingContainer>
    </div>

    <!-- Mobile: Single Column Navigation -->
    <div class="lg:hidden flex-1 bg-white dark:bg-gray-800">
      <!-- Show Collections List (Root Level) -->
      <div v-if="mobileCurrentLevel.view === 'collections'" class="h-full">
        <MobileCollectionsList
          :collections="collections"
          :loading="firestoreStore.loading"
          @select-collection="handleMobileSelectCollection"
          @add-collection="handleColumnOneAddItem(0)"
        />
      </div>

      <!-- Show Documents in Collection -->
      <div v-else-if="mobileCurrentLevel.view === 'documents'" class="h-full">
        <MobileDocumentsList
          :collection-id="mobileCurrentLevel.collection?.id || ''"
          :documents="getCurrentLevelDocuments()"
          :document-subcollections="documentSubcollections"
          :loading="firestoreStore.loading"
          @select-document="handleMobileSelectDocument"
          @add-document="handleMobileAddDocument"
          @back="handleMobileBack"
        />
      </div>

      <!-- Show Document Editor -->
      <div v-else-if="mobileCurrentLevel.view === 'document'" class="h-full">
        <MobileDocumentEditor
          :selected-document="mobileCurrentLevel.document"
          :subcollections="getMobileDocumentSubcollections()"
          :expanded-fields="expandedMapFields"
          @add-field="handleMobileAddField"
          @edit-field="handleMobileEditField"
          @delete-field="handleMobileDeleteField"
          @start-subcollection="handleMobileStartSubcollection"
          @navigate-to-subcollection="handleMobileNavigateToSubcollection"
          @back="handleMobileBack"
          @toggle-field="toggleMapField"
          @add-to-map="modalManager.openAddToMapModal"
          @add-to-array="modalManager.openAddToArrayModal"
          @clone-document="handleCloneDocument"
          @delete-all-fields="modalManager.openDeleteAllFieldsModal"
          @delete-document="handleDeleteDocument"
        />
      </div>

      <!-- Show Subcollection Documents -->
      <div v-else-if="mobileCurrentLevel.view === 'subcollection'" class="h-full">
        <MobileSubcollectionDocuments
          :subcollection="mobileCurrentLevel.subcollection"
          :documents="getMobileSubcollectionDocuments()"
          :document-subcollections="documentSubcollections"
          :loading="firestoreStore.loading"
          @select-document="handleMobileSelectSubcollectionDocument"
          @add-document="handleMobileAddSubcollectionDocument"
          @back="handleMobileBack"
        />
      </div>
    </div>

    <!-- Modals -->
    <StartCollectionModal
      v-model="modalManager.showCreateCollectionModal.value"
      :project-id="currentProjectId"
      :parent-document-path="modalManager.subcollectionPath.value"
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
      :details="{
        title: 'What will happen:',
        description:
          'The collection and all its documents will be permanently deleted. This action cannot be undone.',
      }"
      @confirm="confirmDeleteCollection"
      @cancel="modalManager.closeDeleteCollectionModal"
    />

    <ConfirmationModal
      v-model="modalManager.showDeleteDocumentModal.value"
      title="Delete Document"
      :message="`Are you sure you want to delete document '${modalManager.documentToDelete.value ? getDocumentId(modalManager.documentToDelete.value.name) : ''}'?`"
      confirm-label="Delete Document"
      :is-loading="modalManager.isDeletingDocument.value"
      :details="{
        title: 'What will happen:',
        description: 'The document will be permanently deleted. This action cannot be undone.',
      }"
      @confirm="confirmDeleteDocument"
      @cancel="modalManager.closeDeleteDocumentModal"
    />

    <ConfirmationModal
      v-model="modalManager.showDeleteAllFieldsModal.value"
      title="Delete All Fields"
      :message="`Are you sure you want to delete all fields from document '${getSelectedDocumentId()}'?`"
      confirm-label="Delete All Fields"
      :is-loading="modalManager.isDeletingAllFields.value"
      :details="{
        title: 'What will happen:',
        description:
          'All fields in the document will be deleted, leaving an empty document. This action cannot be undone.',
      }"
      @confirm="confirmDeleteAllFields"
      @cancel="modalManager.closeDeleteAllFieldsModal"
    />

    <ConfirmationModal
      v-model="modalManager.showDeleteFieldModal.value"
      title="Delete Field"
      :message="`Are you sure you want to delete field '${modalManager.fieldToDelete.value?.displayName || ''}'?`"
      confirm-label="Delete Field"
      :is-loading="modalManager.isDeletingField.value"
      :details="{
        title: 'What will happen:',
        description:
          'The field will be permanently removed from this document. This action cannot be undone.',
      }"
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
import { ChevronLeftIcon } from '@heroicons/vue/24/outline'

// Store and API
import { useFirestoreStore } from '@/stores/firestore'
import { firestoreApi } from '@/api/firestore'
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

// Mobile Components
import MobileCollectionsList from '@/components/firestore/mobile/MobileCollectionsList.vue'
import MobileDocumentsList from '@/components/firestore/mobile/MobileDocumentsList.vue'
import MobileDocumentEditor from '@/components/firestore/mobile/MobileDocumentEditor.vue'
import MobileSubcollectionDocuments from '@/components/firestore/mobile/MobileSubcollectionDocuments.vue'

// Composables
import { useFieldOperations } from '@/composables/useFieldOperations'
import { useRecursiveNavigation, type NavigationItem } from '@/composables/useRecursiveNavigation'
import { useModalManager } from '@/composables/useModalManager'
import { useDeepNavigation } from '@/composables/useDeepNavigation'
import { useDocumentForm } from '@/composables/useDocumentForm'
import { useColumnFieldOperations } from '@/composables/useColumnFieldOperations'

// Utils
import { useDocumentUtils } from '@/composables/useDocumentUtils'
import { useFirestoreFields } from '@/composables/useFirestoreFields'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Composables
const { expandedMapFields, toggleMapField, clearExpandedFields } = useFieldOperations()

const navigation = useRecursiveNavigation()
const modalManager = useModalManager()
const { buildFirestoreValue } = useDocumentForm()
const { getDocumentId } = useDocumentUtils()
const { getFieldType, getEditableValue } = useFirestoreFields()

// Local state for caching subcollections
const documentSubcollections = ref<Map<string, FirestoreCollectionWithMetadata[]>>(new Map())
const deepNavigation = useDeepNavigation(navigation.navigationStack, documentSubcollections)

// Loading state for path navigation from search
const isNavigatingToPath = ref(false)

// Mobile navigation state - enhanced for deep navigation
type MobileView = 'collections' | 'documents' | 'document' | 'subcollection'
interface MobileNavigationLevel {
  view: MobileView
  collection?: FirestoreCollectionWithMetadata
  document?: FirestoreDocument
  subcollection?: FirestoreCollectionWithMetadata
  parentDocumentPath?: string
  documents?: FirestoreDocument[] // Store documents for this level
  title: string
  subtitle?: string
}

const mobileNavigationStack = ref<MobileNavigationLevel[]>([
  {
    view: 'collections',
    title: 'Collections',
    subtitle: '',
  },
])

const mobileCurrentLevel = computed(() => {
  return mobileNavigationStack.value[mobileNavigationStack.value.length - 1]
})

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)
const collections = computed(() => firestoreStore.collections)

// Database change handler
const handleDatabaseChange = async (databaseId: string) => {
  firestoreStore.setSelectedDatabase(databaseId)
  // Clear current data
  firestoreStore.clearData()
  navigation.clearNavigation()
  clearExpandedFields()
  documentSubcollections.value.clear()
  resetMobileNavigation()

  // Reload collections for the new database
  await refreshCollections()
}

// Add database handler
const handleAddDatabase = async (databaseId: string) => {
  const success = await firestoreStore.addDatabase(currentProjectId.value, databaseId)
  if (success) {
    console.info(`Successfully added database: ${databaseId}`)
  } else {
    console.warn(`Database '${databaseId}' not found or not accessible`)
  }
}

// Remove database handler
const handleRemoveDatabase = (databaseId: string) => {
  firestoreStore.removeDatabase(databaseId)
}

// Helper functions for column configuration
const getColumnOneHeader = (levelIndex: number): string => {
  if (levelIndex === 0) return firestoreStore.selectedDatabase
  if (levelIndex === 1) return firestoreStore.selectedDatabase // Column 1 still shows collections from root

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
  return levelIndex === 0 || levelIndex === 1 ? 'Start collection' : 'Add document'
}

const getColumnOneEmptyStateText = (levelIndex: number): string => {
  return levelIndex === 0
    ? 'No collections found. Create your first collection to get started.'
    : 'No items in the previous level.'
}

const getColumnOneNextPageToken = (levelIndex: number): string | undefined => {
  if (levelIndex === 0) return firestoreStore.collectionsNextPageToken

  const prevLevel = navigation.navigationStack.value[levelIndex - 1]
  return prevLevel?.nextPageToken
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

  // Show collection menu when we're viewing a collection's documents or subcollections
  return level?.type === 'collection' || level?.type === 'subcollection'
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
    const subcollectionsResponse = documentSubcollections.value.get(selectedDocument.name)

    // Handle both array format (legacy) and response object format
    if (Array.isArray(subcollectionsResponse)) {
      return subcollectionsResponse
    } else if (
      subcollectionsResponse?.collections &&
      Array.isArray(subcollectionsResponse.collections)
    ) {
      return subcollectionsResponse.collections
    }

    return []
  }
  return []
}

const getColumnThreeSelectedSubcollection = (
  levelIndex: number
): FirestoreCollectionWithMetadata | null => {
  // Check if there's a next level in the navigation stack that's a subcollection
  const nextLevel = navigation.navigationStack.value[levelIndex + 1]
  if (nextLevel && nextLevel.type === 'subcollection') {
    // Find the subcollection that matches the next level's collectionId
    const subcollections = getColumnThreeSubcollections(levelIndex)
    return subcollections.find(sub => sub.id === nextLevel.collectionId) || null
  }
  return null
}

// Mobile navigation functions
const pushMobileLevel = (level: MobileNavigationLevel) => {
  mobileNavigationStack.value.push(level)
}

const popMobileLevel = () => {
  if (mobileNavigationStack.value.length > 1) {
    mobileNavigationStack.value.pop()
  }
}

const resetMobileNavigation = () => {
  mobileNavigationStack.value = [
    {
      view: 'collections',
      title: 'Collections',
      subtitle: '',
    },
  ]
}

// Mobile event handlers
const handleMobileSelectCollection = async (collection: FirestoreCollectionWithMetadata) => {
  // Load documents for the collection
  await loadDocumentsForCollection(collection.id)
  const documents = firestoreStore.getDocumentsByCollection(collection.id)

  // Preload subcollections for all documents to show accurate counts
  await Promise.all(
    documents.map(async document => {
      if (!documentSubcollections.value.has(document.name)) {
        const subcollectionsResponse = await navigation.loadSubcollections(document.name)
        const subcollections = subcollectionsResponse || []
        documentSubcollections.value.set(document.name, subcollections)
      }
    })
  )

  pushMobileLevel({
    view: 'documents',
    collection,
    documents,
    title: collection.id,
    subtitle: `${documents.length} documents`,
  })
}

const handleMobileSelectDocument = async (document: FirestoreDocument) => {
  // Load subcollections for the document
  const subcollectionsResponse = await navigation.loadSubcollections(document.name)
  const subcollections = subcollectionsResponse || []
  documentSubcollections.value.set(document.name, subcollections)

  const fieldsCount = Object.keys(document.fields || {}).length
  pushMobileLevel({
    view: 'document',
    document,
    title: getDocumentId(document.name),
    subtitle: `${fieldsCount} fields, ${subcollections.length} subcollections`,
  })
}

const handleMobileSelectSubcollectionDocument = async (document: FirestoreDocument) => {
  // Load subcollections for the document
  const subcollectionsResponse = await navigation.loadSubcollections(document.name)
  const subcollections = subcollectionsResponse || []
  documentSubcollections.value.set(document.name, subcollections)

  const fieldsCount = Object.keys(document.fields || {}).length
  pushMobileLevel({
    view: 'document',
    document,
    title: getDocumentId(document.name),
    subtitle: `${fieldsCount} fields, ${subcollections.length} subcollections`,
  })
}

const handleMobileBack = () => {
  popMobileLevel()
}

const handleMobileAddDocument = () => {
  const currentLevel = mobileCurrentLevel.value
  if (currentLevel.collection) {
    modalManager.openAddDocumentModal()
  }
}

const handleMobileAddSubcollectionDocument = () => {
  const currentLevel = mobileCurrentLevel.value
  if (currentLevel.subcollection && currentLevel.parentDocumentPath) {
    modalManager.openAddSubcollectionDocumentModal(currentLevel.parentDocumentPath)
  }
}

const handleMobileAddField = () => {
  const currentLevel = mobileCurrentLevel.value
  if (currentLevel.document) {
    // Set the mobile context for field operations
    activeFieldOperationContext.value = {
      document: currentLevel.document,
      column: 'mobile',
    }
    modalManager.openAddFieldModal({
      document: currentLevel.document,
      column: 'mobile',
    })
  }
}

const handleMobileEditField = (data: { path: string; fieldName: string; fieldValue: any }) => {
  modalManager.openEditFieldModal({
    path: data.path,
    fieldName: data.fieldName,
    fieldValue: data.fieldValue,
    fieldType: getFieldType(data.fieldValue),
    editableValue: getEditableValue(data.fieldValue),
  })
}

const handleMobileDeleteField = (data: any) => {
  modalManager.openDeleteFieldModal(data)
}

const handleMobileStartSubcollection = () => {
  const currentLevel = mobileCurrentLevel.value
  if (currentLevel.document) {
    modalManager.subcollectionPath.value = currentLevel.document.name
    modalManager.isAddingToSubcollection.value = true
    modalManager.openCreateCollectionModal()
  }
}

const handleMobileNavigateToSubcollection = async (
  subcollection: FirestoreCollectionWithMetadata
) => {
  const currentLevel = mobileCurrentLevel.value
  if (!currentLevel.document) return

  // Load subcollection documents - use the full document path as parent
  const parentDocumentPath = currentLevel.document.name
  const subcollectionResult = await navigation.loadSubcollectionDocuments(
    parentDocumentPath,
    subcollection.id
  )
  const documents = subcollectionResult.documents || []

  // Preload subcollections for all subcollection documents to show accurate counts
  await Promise.all(
    documents.map(async document => {
      if (!documentSubcollections.value.has(document.name)) {
        const subcollectionsResponse = await navigation.loadSubcollections(document.name)
        const subcollections = subcollectionsResponse || []
        documentSubcollections.value.set(document.name, subcollections)
      }
    })
  )

  pushMobileLevel({
    view: 'subcollection',
    subcollection,
    parentDocumentPath,
    documents,
    title: subcollection.id,
    subtitle: `${documents.length} documents`,
  })
}

// Helper functions for mobile views
const getCurrentLevelDocuments = (): FirestoreDocument[] => {
  const currentLevel = mobileCurrentLevel.value

  // Return documents stored in the current mobile navigation level
  return currentLevel.documents || []
}

const getMobileDocumentSubcollections = (): FirestoreCollectionWithMetadata[] => {
  const currentLevel = mobileCurrentLevel.value
  if (!currentLevel.document) return []

  const subcollectionsResponse = documentSubcollections.value.get(currentLevel.document.name)
  return Array.isArray(subcollectionsResponse)
    ? subcollectionsResponse
    : subcollectionsResponse?.collections || []
}

const getMobileSubcollectionDocuments = (): FirestoreDocument[] => {
  return getCurrentLevelDocuments()
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
    if (
      'id' in item &&
      navigation.navigationStack.value[0]?.selectedItem &&
      'id' in navigation.navigationStack.value[0].selectedItem &&
      navigation.navigationStack.value[0].selectedItem.id === item.id
    ) {
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
      // Selected a collection - navigate to it
      const documents = await loadDocumentsForCollection(item.id)
      await navigation.navigateToCollection(item, documents)

      // Update nextPageToken for the new level
      const currentLevel = navigation.navigationStack.value[navigation.currentStackIndex.value]
      const collection = collections.value.find(c => c.id === item.id)
      if (currentLevel && collection) {
        currentLevel.nextPageToken = collection.nextPageToken
      }

      // If there are documents, auto-select the first one
      if (documents.length > 0) {
        const firstDocument = documents[0]
        navigation.selectItem(firstDocument)

        // Load subcollections for the first document
        const subcollectionsResponse = await navigation.loadSubcollections(firstDocument.name)
        const subcollections = subcollectionsResponse || []
        documentSubcollections.value.set(firstDocument.name, subcollections)
      }
    }
  }
  // For other levels, this shouldn't normally happen since Column 1 shows previous level items
}

const handleColumnOneLoadMore = async (levelIndex: number) => {
  if (levelIndex === 0) {
    // Root collections pagination
    const token = firestoreStore.collectionsNextPageToken
    if (token) {
      await firestoreStore.loadCollections(currentProjectId.value, token)

      // Update navigation stack root items because the store replaces the array reference
      if (navigation.navigationStack.value.length > 0) {
        navigation.navigationStack.value[0].items = collections.value
      }
    }
    return
  }

  // Delegate to standard load more handler for the previous level
  await handleLoadMore(levelIndex - 1)
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
    // Check if we're already at the next level with this collection
    const nextLevel = navigation.navigationStack.value[levelIndex + 1]
    const isAlreadyAtThisCollection =
      nextLevel &&
      nextLevel.collectionId === item.id &&
      navigation.currentStackIndex.value === levelIndex + 1

    // Only navigate if we're not already at this collection
    if (!isAlreadyAtThisCollection) {
      // Selected a collection - navigate to it
      const documents = await loadDocumentsForCollection(item.id)
      await navigation.navigateToCollection(item, documents)

      // Update nextPageToken for the new level
      const currentLevel = navigation.navigationStack.value[navigation.currentStackIndex.value]
      const collection = collections.value.find(c => c.id === item.id)
      if (currentLevel && collection) {
        currentLevel.nextPageToken = collection.nextPageToken
      }
    }
  } else {
    // Selected a document - load its subcollections and cache them
    const subcollectionsResponse = await navigation.loadSubcollections(item.name)

    // Cache just the collections array for this document
    const subcollections = subcollectionsResponse || []
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
      console.log('Deleting collection:', previousLevel.selectedItem)
      modalManager.openDeleteCollectionModal(
        previousLevel.selectedItem as FirestoreCollectionWithMetadata
      )
    }
  } else if (level?.type === 'subcollection') {
    // For subcollection level, we want to delete the subcollection itself (not the selected document)
    // The subcollection info is in the level header and collectionId
    const subcollectionToDelete: FirestoreCollectionWithMetadata = {
      id: level.collectionId || level.header,
      path: level.parentPath
        ? `${level.parentPath}/${level.collectionId || level.header}`
        : level.header,
    }

    console.log('Deleting subcollection from level info:', subcollectionToDelete)
    modalManager.openDeleteCollectionModal(subcollectionToDelete)
  }
}

const handleStartSubcollection = (column: string) => {
  console.log('handleStartSubcollection - column:', column)
  console.log('handleStartSubcollection - currentStackIndex:', navigation.currentStackIndex.value)

  let targetDocument: FirestoreDocument | null = null

  // Determine which column's document to target based on the column identifier
  if (column === 'column-one') {
    // First column: use getColumnOneDocument logic
    targetDocument = deepNavigation.getColumnOneDocument(navigation.currentStackIndex.value)
    console.log('First column - targetDocument:', targetDocument?.name)
  } else if (column === 'column-three') {
    // Third column: use getColumnThreeDocument logic
    targetDocument = getColumnThreeDocument(navigation.currentStackIndex.value)
    console.log('Third column - targetDocument:', targetDocument?.name)
  }

  if (targetDocument) {
    // Set the subcollection context to the specific document from the clicked column
    modalManager.subcollectionPath.value = targetDocument.name
    modalManager.isAddingToSubcollection.value = true
    console.log('Setting subcollection path to:', targetDocument.name)
  } else {
    console.log('No target document found for column:', column)
  }
  modalManager.openCreateCollectionModal()
}

const handleNavigateToSubcollection = async (
  levelIndex: number,
  subcollection: FirestoreCollectionWithMetadata
) => {
  // Check if we're already at this subcollection level
  const currentLevel = navigation.navigationStack.value[navigation.currentStackIndex.value]
  const isAlreadyAtThisSubcollection =
    currentLevel &&
    currentLevel.type === 'subcollection' &&
    currentLevel.collectionId === subcollection.id

  // Only navigate if we're not already at this subcollection
  if (!isAlreadyAtThisSubcollection) {
    // Extract parent document path from subcollection path
    // subcollection.path is like: "projects/.../documents/collection-1/doc-id/subcollection-id"
    // We need to remove the last part (subcollection-id) to get the parent document path
    const parentDocumentPath = subcollection.path.split('/').slice(0, -1).join('/')

    const result = await navigation.loadSubcollectionDocuments(parentDocumentPath, subcollection.id)

    const documents = result.documents || []

    await navigation.navigateToSubcollectionFromDocument(
      parentDocumentPath,
      subcollection,
      documents
    )

    // Update nextPageToken for the new level
    const currentLevel = navigation.navigationStack.value[navigation.currentStackIndex.value]
    if (currentLevel && currentLevel.type === 'subcollection') {
      currentLevel.nextPageToken = result.nextPageToken
    }

    // Auto-select the first document if any exist in the subcollection
    if (documents.length > 0) {
      const firstDocument = documents[0]
      navigation.selectItem(firstDocument)

      // Load subcollections for the first document in the subcollection
      const nestedSubcollectionsResponse = await navigation.loadSubcollections(firstDocument.name)
      const nestedSubcollections = nestedSubcollectionsResponse || []
      documentSubcollections.value.set(firstDocument.name, nestedSubcollections)
    }
  }
}

// Path-based navigation handler
const handleNavigateToPath = async (pathString: string) => {
  isNavigatingToPath.value = true
  try {
    await navigation.navigateToPath(
      pathString,
      firestoreStore,
      currentProjectId.value,
      documentSubcollections
    )
  } finally {
    isNavigatingToPath.value = false
  }
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
  // Capture current state before reload
  const isAtRoot = navigation.isAtRoot.value && !navigation.currentLevel.value?.selectedItem

  // 1. Update root level collections
  const currentCollectionsCount = Math.max(collections.value.length, 30) // Ensure at least 30
  await firestoreStore.loadCollections(currentProjectId.value, undefined, currentCollectionsCount)

  if (isAtRoot) {
    navigation.initializeWithCollections(collections.value)
  } else {
    // Preserve state: Update stack items in-place

    // 1. Update root level collections
    if (navigation.navigationStack.value.length > 0) {
      navigation.navigationStack.value[0].items = collections.value

      // Update selected item reference in root level
      const currentSelected = navigation.navigationStack.value[0].selectedItem
      if (currentSelected && 'id' in currentSelected) {
        const newSelected = collections.value.find(c => c.id === currentSelected.id)
        if (newSelected) {
          navigation.navigationStack.value[0].selectedItem = newSelected
        }
      }
    }

    // 2. Refresh documents for active levels
    for (let i = 1; i <= navigation.currentStackIndex.value; i++) {
      const level = navigation.navigationStack.value[i]

      if (level.type === 'collection' && level.collectionId) {
        // Preserve "all items loaded" state - if no token before, user had loaded everything
        const hadAllItemsLoaded = !level.nextPageToken
        const previousItemCount = level.items.length

        // Refresh collection documents - maintain count
        const currentCount = Math.max(level.items.length, 30) // Ensure at least 30
        await firestoreStore.loadDocuments(
          currentProjectId.value,
          level.collectionId,
          undefined,
          currentCount
        )
        const documents = firestoreStore.getDocumentsByCollection(level.collectionId)
        level.items = documents

        // Update nextPageToken - but preserve "all loaded" state if applicable
        const collection = collections.value.find(c => c.id === level.collectionId)
        if (collection) {
          // If user had loaded all items and we got the same or fewer items back,
          // keep nextPageToken as undefined to preserve the "all loaded" state
          if (hadAllItemsLoaded && documents.length <= previousItemCount) {
            level.nextPageToken = undefined
          } else {
            level.nextPageToken = collection.nextPageToken
          }
        }

        // Update selected document reference
        if (level.selectedItem && 'name' in level.selectedItem) {
          const docName = level.selectedItem.name
          const newDoc = documents.find(d => d.name === docName)
          if (newDoc) {
            level.selectedItem = newDoc
          }
        }
      } else if (level.type === 'subcollection' && level.parentPath && level.collectionId) {
        // Preserve "all items loaded" state - if no token before, user had loaded everything
        const hadAllItemsLoaded = !level.nextPageToken
        const previousItemCount = level.items.length

        // Refresh subcollection documents - maintain count
        const currentCount = Math.max(level.items.length, 30)
        const result = await navigation.loadSubcollectionDocuments(
          level.parentPath,
          level.collectionId,
          undefined,
          currentCount
        )
        level.items = result.documents

        // If user had loaded all items and we got the same or fewer items back,
        // keep nextPageToken as undefined to preserve the "all loaded" state
        if (hadAllItemsLoaded && result.documents.length <= previousItemCount) {
          level.nextPageToken = undefined
        } else {
          level.nextPageToken = result.nextPageToken
        }

        // Update selected document reference
        if (level.selectedItem && 'name' in level.selectedItem) {
          const docName = level.selectedItem.name
          const newDoc = result.documents.find(d => d.name === docName)
          if (newDoc) {
            level.selectedItem = newDoc
          }
        }
      }
    }
  }
}

const initializeData = async () => {
  // Load collections for the selected database
  await refreshCollections()
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
    editableValue: getEditableValue(data.fieldValue),
  })
}

// Pagination handler
// Helper to deduplicate and merge documents
const mergeUniqueDocuments = (
  existing: FirestoreDocument[],
  incoming: FirestoreDocument[]
): FirestoreDocument[] => {
  const docsMap = new Map()
  existing.forEach(doc => docsMap.set(doc.name, doc))
  incoming.forEach(doc => docsMap.set(doc.name, doc))
  return Array.from(docsMap.values())
}

// Pagination handler
const handleLoadMore = async (levelIndex: number) => {
  const level = navigation.navigationStack.value[levelIndex]
  if (!level || !level.nextPageToken) return

  if (level.type === 'collection' && level.collectionId) {
    // Load more document for collection
    await firestoreStore.loadDocuments(
      currentProjectId.value,
      level.collectionId,
      level.nextPageToken
    )

    // Update items and nextPageToken from store
    const collection = collections.value.find(c => c.id === level.collectionId)
    if (collection) {
      // Get all documents from store. Store deduplication might be loose, so we enforce it here for view
      // Since store returns all docs, we treat them as "incoming" and merge with empty "existing"
      // or effectively just dedupe the store list itself.
      const allDocs = firestoreStore.getDocumentsByCollection(level.collectionId)
      level.items = mergeUniqueDocuments([], allDocs)

      level.nextPageToken = collection.nextPageToken
    }
  } else if (level.type === 'subcollection' && level.parentPath && level.collectionId) {
    // Load more documents for subcollection
    const result = await navigation.loadSubcollectionDocuments(
      level.parentPath,
      level.collectionId,
      level.nextPageToken
    )

    // Update items and nextPageToken
    const existingItems = level.items as FirestoreDocument[]
    const newItems = result.documents || []

    level.items = mergeUniqueDocuments(existingItems, newItems)
    level.nextPageToken = result.nextPageToken
  }
}

// Confirmation handlers (simplified versions - implement full logic as needed)
const confirmDeleteCollection = async () => {
  if (!modalManager.collectionToDelete.value) return

  try {
    modalManager.isDeletingCollection.value = true
    const collectionToDelete = modalManager.collectionToDelete.value
    console.log('Deleting collection:', collectionToDelete)

    // Check if this is a subcollection or root collection
    // Subcollections have paths like: "projects/.../documents/collection-1/doc-id/sub-collection-1"
    // Root collections have paths like: "projects/.../documents/collection-1"
    const isSubcollection =
      collectionToDelete.path &&
      collectionToDelete.path.includes('/documents/') &&
      collectionToDelete.path.split('/documents/')[1].includes('/')

    if (isSubcollection) {
      // This is a subcollection - extract parent path and collection ID
      const pathParts = collectionToDelete.path.split('/')
      const collectionId = pathParts.pop() // Last part is the collection ID
      const parentPath = pathParts.join('/') // Everything before is the parent path

      console.log('Deleting subcollection:', collectionId, 'from parent:', parentPath)

      // For subcollections, we need to call the API with the correct parent path
      // The parent path includes '/documents/' but the API expects the database path
      // Extract the database path (everything before '/documents/')
      const databasePath = parentPath.split('/documents/')[0]
      const documentPath = parentPath.split('/documents/')[1]

      console.log('Database path:', databasePath)
      console.log('Document path:', documentPath)
      console.log('Collection ID:', collectionId)

      // For subcollections, we need to use a different approach
      // The existing deleteCollection API is designed for root collections
      // For subcollections, we need to get documents from the subcollection and delete them

      const subcollectionPath = `${databasePath}/documents/${documentPath}/${collectionId}`
      console.log('Deleting subcollection at path:', subcollectionPath)

      // Get all documents in the subcollection
      // Use the full parentPath (includes projects/.../databases/.../documents/...)
      // because listSubcollectionDocuments expects the complete document path
      const response = await firestoreApi.listSubcollectionDocuments(parentPath, collectionId)
      const documents = response.documents || []

      console.log('Found', documents.length, 'documents to delete in subcollection')

      // Delete each document individually
      const deletePromises = documents.map((doc: any) => firestoreApi.deleteDocument(doc.name))

      await Promise.all(deletePromises)
      console.log('Successfully deleted all documents in subcollection')

      // For subcollections, refresh the parent document's subcollections
      // The parentPath is already the correct document path
      console.log('Refreshing subcollections for parent document:', parentPath)

      // Handle navigation update for the deleted subcollection
      navigation.handleSubcollectionDeleted(collectionToDelete.id, parentPath)

      // Reload subcollections for the parent document
      const subcollectionsResponse = await navigation.loadSubcollections(parentPath)
      const subcollections = Array.isArray(subcollectionsResponse)
        ? subcollectionsResponse
        : subcollectionsResponse?.collections || []
      documentSubcollections.value.set(parentPath, subcollections)
    } else {
      // This is a root collection
      await firestoreStore.deleteCollection(currentProjectId.value, collectionToDelete.id)

      // Navigate back if we deleted a currently selected collection
      const currentLevel = navigation.currentLevel.value
      if (
        currentLevel?.selectedItem &&
        'id' in currentLevel.selectedItem &&
        currentLevel.selectedItem.id === collectionToDelete.id
      ) {
        navigation.navigateToRoot()
      }

      // Refresh root collections
      await refreshCollections()
    }
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
    if (
      currentLevel?.selectedItem &&
      'name' in currentLevel.selectedItem &&
      currentLevel.selectedItem.name === documentPath
    ) {
      // Clear the selection to show empty third column
      navigation.selectItem(null as any)

      // Refresh the documents in the current collection/subcollection
      if (collectionId) {
        if (currentLevel.type === 'subcollection' && currentLevel.parentPath) {
          // For subcollections, reload the subcollection documents
          const subcollectionDocsResult = await navigation.loadSubcollectionDocuments(
            currentLevel.parentPath,
            collectionId
          )
          // Update the current level items properly
          const currentNavLevel =
            navigation.navigationStack.value[navigation.currentStackIndex.value]
          if (currentNavLevel) {
            currentNavLevel.items = subcollectionDocsResult.documents || []
          }
        } else {
          // For regular collections, reload the collection documents
          await firestoreStore.loadDocuments(currentProjectId.value, collectionId)
          const refreshedDocuments = firestoreStore.getDocumentsByCollection(collectionId)
          // Update the current level items properly
          const currentNavLevel =
            navigation.navigationStack.value[navigation.currentStackIndex.value]
          if (currentNavLevel) {
            currentNavLevel.items = refreshedDocuments
          }
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
    await firestoreStore.updateDocument(currentProjectId.value, collectionId, documentId, {
      fields: {},
    })

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

  console.log(
    'confirmDeleteField - activeFieldOperationContext:',
    activeFieldOperationContext.value
  )
  const currentDoc = activeFieldOperationContext.value.document
  console.log('confirmDeleteField - currentDoc:', currentDoc?.name, 'path:', currentDoc?.path)
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
    console.log('Delete Field - documentPath:', documentPath)
    const pathSegments = documentPath.split('/')
    console.log('Delete Field - pathSegments:', pathSegments)

    // For subcollections, we need to build the full collection path
    // Path format: projects/{project}/databases/{db}/documents/{collection}/{doc}/{subcollection}/{subdoc}
    const documentsIndex = pathSegments.indexOf('documents')
    const collectionPathSegments = pathSegments.slice(documentsIndex + 1, -1) // Everything after 'documents' except the last segment (doc ID)
    const fullCollectionPath = collectionPathSegments.join('/')
    const documentId = pathSegments[pathSegments.length - 1]

    console.log('Delete Field - fullCollectionPath:', fullCollectionPath, 'documentId:', documentId)

    await firestoreStore.updateDocument(currentProjectId.value, fullCollectionPath, documentId, {
      fields: updatedFields,
    })

    // Refresh the specific collection's documents without resetting navigation
    await firestoreStore.loadDocuments(currentProjectId.value, fullCollectionPath)

    // Update the navigation stack with the refreshed document data
    const refreshedDocuments = firestoreStore.getDocumentsByCollection(fullCollectionPath)
    const refreshedDocument = refreshedDocuments.find(doc => getDocumentId(doc.name) === documentId)

    if (refreshedDocument) {
      // Update the navigation stack to reflect the updated document data
      // We need to find which level in the navigation stack contains this document and update it
      const column = activeFieldOperationContext.value.column
      console.log(
        'Delete Field - Refreshing document in',
        column,
        '- document:',
        refreshedDocument.name
      )

      // Update ALL navigation levels that might contain this document
      const currentStackIndex = navigation.currentStackIndex.value
      let documentUpdated = false

      for (let i = 0; i <= currentStackIndex; i++) {
        const level = navigation.navigationStack.value[i]

        // Update selectedItem if it matches
        if (
          level?.selectedItem &&
          'name' in level.selectedItem &&
          level.selectedItem.name === refreshedDocument.name
        ) {
          level.selectedItem = refreshedDocument
          console.log(
            'Delete Field - Updated selectedItem in navigation level',
            i,
            'with refreshed document data'
          )
          documentUpdated = true
        }

        // Update items list if it contains this document
        if (level?.items) {
          for (let j = 0; j < level.items.length; j++) {
            const item = level.items[j]
            if ('name' in item && item.name === refreshedDocument.name) {
              level.items[j] = refreshedDocument
              console.log('Delete Field - Updated item', j, 'in navigation level', i, 'items list')
              documentUpdated = true
            }
          }
        }
      }

      if (column === 'column-three' && !documentUpdated) {
        // Column 3 document was updated but not found in navigation stack - use selectItem as fallback
        navigation.selectItem(refreshedDocument)
        console.log('Delete Field - Used selectItem fallback for Column 3 document')
      }
    }
  } catch (error) {
    console.error('Failed to delete field:', error)
  } finally {
    modalManager.isDeletingField.value = false
    modalManager.closeDeleteFieldModal()
  }
}

const handleCollectionCreated = async (collectionId: string) => {
  // Only refresh collections if we're at the root level (creating a root collection)
  // If we're not at root, we're creating a subcollection and shouldn't reset navigation
  if (navigation.isAtRoot.value) {
    await refreshCollections()
  }

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
  } else {
    // Handle subcollection creation - we're not at root, so this is a subcollection
    // Use the document path that was set when creating the subcollection
    const targetDocumentPath = modalManager.subcollectionPath.value

    if (targetDocumentPath) {
      // Reload subcollections for the target document (not the currently selected one)
      const subcollectionsResponse = await navigation.loadSubcollections(targetDocumentPath)
      const subcollections = Array.isArray(subcollectionsResponse)
        ? subcollectionsResponse
        : subcollectionsResponse?.collections || []
      documentSubcollections.value.set(targetDocumentPath, subcollections)

      // Find the newly created subcollection and navigate to it
      const newSubcollection = subcollections.find(sc => sc.id === collectionId)
      if (newSubcollection) {
        const subcollectionResult = await navigation.loadSubcollectionDocuments(
          targetDocumentPath,
          collectionId
        )
        const documents = subcollectionResult.documents || []
        await navigation.navigateToSubcollectionFromDocument(
          targetDocumentPath,
          newSubcollection,
          documents
        )

        // Auto-select the first document if any exist
        if (documents.length > 0) {
          const firstDocument = documents[0]
          navigation.selectItem(firstDocument)

          // Load subcollections for the first document of the subcollection
          const nestedSubcollectionsResponse = await navigation.loadSubcollections(
            firstDocument.name
          )
          const nestedSubcollections = nestedSubcollectionsResponse || []
          documentSubcollections.value.set(firstDocument.name, nestedSubcollections)
        }
      }
    }
  }
}

const handleDocumentCreated = async (documentId: string) => {
  // Refresh the current level to show the new document (Desktop navigation)
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
        const subcollectionsResponse = await navigation.loadSubcollections(newDocument.name)
        const subcollections = subcollectionsResponse || []
        documentSubcollections.value.set(newDocument.name, subcollections)
      }
    } else if (currentLevel.type === 'subcollection') {
      // Refresh subcollection documents
      const subcollectionResult = await navigation.loadSubcollectionDocuments(
        currentLevel.parentPath || '',
        currentLevel.collectionId || ''
      )
      const documents = subcollectionResult.documents || []
      currentLevel.items = documents

      // Auto-select the new document
      const newDocument = documents.find(doc => getDocumentId(doc.name) === documentId)
      if (newDocument) {
        navigation.selectItem(newDocument)
      }
    }
  }

  // Update mobile navigation if we're in documents or subcollection view
  const mobileLevel = mobileCurrentLevel.value
  if (mobileLevel.view === 'documents' && mobileLevel.collection) {
    await loadDocumentsForCollection(mobileLevel.collection.id)
    // Update the current level with new documents
    mobileLevel.documents = firestoreStore.getDocumentsByCollection(mobileLevel.collection.id)
    mobileLevel.subtitle = `${mobileLevel.documents.length} documents`
  } else if (
    mobileLevel.view === 'subcollection' &&
    mobileLevel.subcollection &&
    mobileLevel.parentDocumentPath
  ) {
    const subcollectionResult = await navigation.loadSubcollectionDocuments(
      mobileLevel.parentDocumentPath,
      mobileLevel.subcollection.id
    )
    const documents = subcollectionResult.documents || []
    // Update the current level with new documents
    mobileLevel.documents = documents
    mobileLevel.subtitle = `${documents.length} documents`
  }
}

// Column field operations (after functions are defined)
const {
  activeFieldOperationContext,
  handleColumnOneFieldOperations,
  handleColumnThreeFieldOperations,
} = useColumnFieldOperations(
  modalManager,
  deepNavigation,
  getColumnThreeDocument,
  handleEditField,
  navigation.currentStackIndex
)

const handleFieldModalSave = async (data: any) => {
  console.log(
    'handleFieldModalSave - activeFieldOperationContext:',
    activeFieldOperationContext.value
  )
  const currentDoc = activeFieldOperationContext.value.document
  console.log('handleFieldModalSave - currentDoc:', currentDoc?.name, 'path:', currentDoc?.path)
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

    // For subcollections, we need to build the full collection path
    // Path format: projects/{project}/databases/{db}/documents/{collection}/{doc}/{subcollection}/{subdoc}
    const documentsIndex = pathSegments.indexOf('documents')
    const collectionPathSegments = pathSegments.slice(documentsIndex + 1, -1) // Everything after 'documents' except the last segment (doc ID)
    const fullCollectionPath = collectionPathSegments.join('/')
    const documentId = pathSegments[pathSegments.length - 1]

    await firestoreStore.updateDocument(currentProjectId.value, fullCollectionPath, documentId, {
      fields: updatedFields,
    })

    // Refresh the specific collection's documents without resetting navigation
    await firestoreStore.loadDocuments(currentProjectId.value, fullCollectionPath)

    // Update the navigation stack with the refreshed document data
    const refreshedDocuments = firestoreStore.getDocumentsByCollection(fullCollectionPath)
    const refreshedDocument = refreshedDocuments.find(doc => getDocumentId(doc.name) === documentId)

    if (refreshedDocument) {
      // Update the navigation stack to reflect the updated document data
      // We need to find which level in the navigation stack contains this document and update it
      const column = activeFieldOperationContext.value.column
      console.log('Refreshing document in', column, '- document:', refreshedDocument.name)

      // Update ALL navigation levels that might contain this document
      const currentStackIndex = navigation.currentStackIndex.value
      let documentUpdated = false

      for (let i = 0; i <= currentStackIndex; i++) {
        const level = navigation.navigationStack.value[i]

        // Update selectedItem if it matches
        if (
          level?.selectedItem &&
          'name' in level.selectedItem &&
          level.selectedItem.name === refreshedDocument.name
        ) {
          level.selectedItem = refreshedDocument
          console.log('Updated selectedItem in navigation level', i, 'with refreshed document data')
          documentUpdated = true
        }

        // Update items list if it contains this document
        if (level?.items) {
          for (let j = 0; j < level.items.length; j++) {
            const item = level.items[j]
            if ('name' in item && item.name === refreshedDocument.name) {
              level.items[j] = refreshedDocument
              console.log('Updated item', j, 'in navigation level', i, 'items list')
              documentUpdated = true
            }
          }
        }
      }

      if (column === 'column-three' && !documentUpdated) {
        // Column 3 document was updated but not found in navigation stack - use selectItem as fallback
        navigation.selectItem(refreshedDocument)
        console.log('Used selectItem fallback for Column 3 document')
      }
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
watch(
  currentProjectId,
  async (newProjectId, oldProjectId) => {
    if (newProjectId !== oldProjectId && oldProjectId) {
      firestoreStore.clearData()
      navigation.clearNavigation()
      clearExpandedFields()
      documentSubcollections.value.clear()
      resetMobileNavigation()

      if (newProjectId) {
        await initializeData()
      }
    }
  },
  { immediate: false }
)

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown)

  await initializeData()

  // Check if we need to navigate to a specific path from search results
  const navigateToPath = window.history.state?.navigateToPath
  if (navigateToPath) {
    await handleNavigateToPath(navigateToPath)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
