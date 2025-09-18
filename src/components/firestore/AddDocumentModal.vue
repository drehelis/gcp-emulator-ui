<template>
  <BaseModal
    v-model="isOpen"
    title="Add Document"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Collection Information -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Collection Information</h3>

        <div class="space-y-4">
          <!-- Collection Path -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection Path
            </label>
            <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm font-mono text-gray-900 dark:text-white">
              {{ collectionPath }}
            </div>
          </div>
        </div>
      </div>

      <!-- Document Editor -->
      <DocumentEditor
        title="New Document"
        help-text="Create a new document to add to this collection. Documents are Firestore's unit of storage and contain your data as fields."
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
import { useDocumentForm } from '@/composables/useDocumentForm'

interface Props {
  modelValue: boolean
  projectId: string
  collectionId: string
}

interface Emits {
  'update:modelValue': [value: boolean]
  'created': [documentId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use document form composable
const documentForm = useDocumentForm()

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const collectionPath = computed(() => {
  return `projects/${props.projectId}/databases/(default)/documents/${props.collectionId}`
})

const isFormValid = computed(() => {
  // No specific validation required - empty documents are allowed
  return true
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
  documentForm.resetForm()
}

const handleSave = async () => {
  try {
    documentForm.loading.value = true

    // Import the store dynamically to avoid circular dependency
    const { useFirestoreStore } = await import('@/stores/firestore')
    const firestoreStore = useFirestoreStore()

    const documentFields = documentForm.buildDocumentFields()

    // Create document in existing collection
    const success = await firestoreStore.createDocument(
      props.projectId,
      props.collectionId,
      {
        fields: documentFields
      },
      documentForm.documentId.value || undefined
    )

    if (success) {
      const finalDocumentId = documentForm.documentId.value || success.name.split('/').pop() || 'unknown'
      emit('created', finalDocumentId)
      isOpen.value = false
      resetForm()
    }
  } catch (error) {
    console.error('Failed to create document:', error)
  } finally {
    documentForm.loading.value = false
  }
}

const handleSaveAndAddAnother = async () => {
  await handleSave()
  // If save was successful, the modal will be closed and then reopened
  // This would be handled by the parent component
}

const handleClose = () => {
  isOpen.value = false
}

const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

// Watch for modelValue prop changes to reset form
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    resetForm()
    await nextTick()
  }
})
</script>