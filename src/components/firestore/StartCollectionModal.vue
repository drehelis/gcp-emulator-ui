<template>
  <BaseModal
    v-model="isOpen"
    title="Start Collection"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Collection Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Collection Configuration</h3>

        <div class="space-y-4">
          <!-- Parent Path -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parent Path
            </label>
            <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm font-mono text-gray-900 dark:text-white">
              {{ props.parentDocumentPath ? props.parentDocumentPath : '/' }}
            </div>
            <p v-if="props.parentDocumentPath" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This subcollection will be created inside the selected document.
            </p>
          </div>

          <!-- Collection ID -->
          <div>
            <label for="collection-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection ID *
            </label>
            <input
              id="collection-id"
              ref="collectionIdInput"
              v-model="collectionId"
              type="text"
              placeholder="Enter collection ID (e.g., users, posts)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': !collectionId.trim() && hasValidationError }"
              @keydown.enter="handleEnterKey"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose an ID that describes the documents you'll add to this collection.
              <a href="https://cloud.google.com/firestore/native/docs/data-model" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Learn more</a>
            </p>
          </div>
        </div>
      </div>

      <!-- Success Notification -->
      <SuccessNotification
        :show="!!saveAndAddAnother.lastSavedId.value"
        :message="saveAndAddAnother.lastSavedId.value ? saveAndAddAnother.getSuccessMessage('collection', saveAndAddAnother.lastSavedId.value) : ''"
        @clear="handleClearFields"
      />

      <!-- First Document Configuration -->
      <DocumentEditor
        title="First Document"
        help-text="A collection must contain at least one document. Documents are Firestore's unit of storage and contain your data as fields."
        :document-id="documentForm.documentId.value"
        :fields="documentForm.fields.value"
        @update:document-id="documentForm.documentId.value = $event"
        @update:fields="documentForm.fields.value = $event"
        @add-field="documentForm.addField"
        @update-field="documentForm.updateFieldValue"
        @remove-field="documentForm.removeField"
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import DocumentEditor from './DocumentEditor.vue'
import SuccessNotification from '@/components/ui/SuccessNotification.vue'
import { useDocumentForm } from '@/composables/useDocumentForm'
import { useSaveAndAddAnother } from '@/composables/useSaveAndAddAnother'

interface Props {
  modelValue: boolean
  projectId: string
  parentDocumentPath?: string
  navigationPath?: Array<{type: 'collection' | 'document', id: string, name: string}>
}

interface Emits {
  'update:modelValue': [value: boolean]
  'created': [collectionId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use document form composable
const documentForm = useDocumentForm()

// Use save and add another composable
const saveAndAddAnother = useSaveAndAddAnother()

// Local form state
const collectionIdInput = ref<HTMLInputElement>()
const collectionId = ref('')
const hasValidationError = ref(false)

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const isFormValid = computed(() => {
  return collectionId.value.trim() !== ''
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleCancel,
    variant: 'secondary'
  },
  {
    label: 'Save & Add Another',
    handler: handleSaveAndAddAnother,
    variant: 'secondary',
    disabled: !isFormValid.value || documentForm.loading.value
  },
  {
    label: 'Save',
    handler: handleSave,
    variant: 'primary',
    disabled: !isFormValid.value,
    loading: documentForm.loading.value
  }
])

// Methods
const resetForm = () => {
  collectionId.value = ''
  documentForm.resetForm()
  hasValidationError.value = false
  saveAndAddAnother.clearNotification()
}

const handleClearFields = () => {
  documentForm.resetForm()
  saveAndAddAnother.clearNotification()
}

const handleSave = async () => {
  hasValidationError.value = true
  if (!isFormValid.value) return

  try {
    documentForm.loading.value = true

    // Import the store dynamically to avoid circular dependency
    const { useFirestoreStore } = await import('@/stores/firestore')
    const firestoreStore = useFirestoreStore()

    const documentFields = documentForm.buildDocumentFields()

    let success
    if (props.parentDocumentPath) {
      // Create subcollection
      success = await firestoreStore.createSubcollection(
        props.parentDocumentPath,
        collectionId.value,
        {
          fields: documentFields
        },
        documentForm.documentId.value || undefined
      )
    } else {
      // Create root-level collection
      success = await firestoreStore.createCollection(
        props.projectId,
        collectionId.value,
        {
          fields: documentFields
        },
        documentForm.documentId.value || undefined
      )
    }

    if (success) {
      emit('created', collectionId.value)
      isOpen.value = false
      resetForm()
    }
  } catch (error) {
    console.error('Failed to create collection:', error)
  } finally {
    documentForm.loading.value = false
  }
}

const handleSaveAndAddAnother = async () => {
  hasValidationError.value = true
  if (!isFormValid.value) return

  try {
    documentForm.loading.value = true

    // Import the store dynamically to avoid circular dependency
    const { useFirestoreStore } = await import('@/stores/firestore')
    const firestoreStore = useFirestoreStore()

    const documentFields = documentForm.buildDocumentFields()

    let success
    if (props.parentDocumentPath) {
      // Create subcollection
      success = await firestoreStore.createSubcollection(
        props.parentDocumentPath,
        collectionId.value,
        {
          fields: documentFields
        },
        documentForm.documentId.value || undefined
      )
    } else {
      // Create root-level collection
      success = await firestoreStore.createCollection(
        props.projectId,
        collectionId.value,
        {
          fields: documentFields
        },
        documentForm.documentId.value || undefined
      )
    }

    if (success) {
      const savedCollectionId = collectionId.value

      // Set the notification for the saved collection
      saveAndAddAnother.setLastSaved(savedCollectionId)

      // Clear collection ID and document ID, but keep field values
      collectionId.value = ''
      documentForm.documentId.value = ''

      // Emit created event but DON'T close the modal
      emit('created', savedCollectionId)
    }
  } catch (error) {
    console.error('Failed to create collection:', error)
  } finally {
    documentForm.loading.value = false
  }
}

const handleClose = () => {
  isOpen.value = false
}

const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

const handleEnterKey = (event: KeyboardEvent) => {
  // Only handle Enter if the form is valid and not currently loading
  if (isFormValid.value && !documentForm.loading.value) {
    event.preventDefault()
    handleSave()
  }
}

// Watch for modelValue prop changes to reset form and focus input
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    resetForm()
    await nextTick()
    collectionIdInput.value?.focus()
  }
})
</script>