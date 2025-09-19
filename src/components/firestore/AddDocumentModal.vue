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

      <!-- Success Notification -->
      <SuccessNotification
        :show="!!saveAndAddAnother.lastSavedId.value"
        :message="saveAndAddAnother.lastSavedId.value ? saveAndAddAnother.getSuccessMessage('document', saveAndAddAnother.lastSavedId.value) : ''"
        @clear="handleClearFields"
      />

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
import { computed, watch, nextTick } from 'vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import type { FirestoreDocument } from '@/types'
import DocumentEditor from './DocumentEditor.vue'
import SuccessNotification from '@/components/ui/SuccessNotification.vue'
import { useDocumentForm } from '@/composables/useDocumentForm'
import { useSaveAndAddAnother } from '@/composables/useSaveAndAddAnother'

interface Props {
  modelValue: boolean
  projectId: string
  collectionId: string
  cloneDocument?: FirestoreDocument | null
}

interface Emits {
  'update:modelValue': [value: boolean]
  'created': [documentId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use document form composable
const documentForm = useDocumentForm()

// Use save and add another composable
const saveAndAddAnother = useSaveAndAddAnother()

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
  saveAndAddAnother.clearNotification()
}

const handleClearFields = () => {
  documentForm.resetForm()
  saveAndAddAnother.clearNotification()
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

      // Set the notification for the saved document
      saveAndAddAnother.setLastSaved(finalDocumentId)

      // Clear only the document ID, keep the field values
      documentForm.documentId.value = ''

      // Emit created event but DON'T close the modal
      emit('created', finalDocumentId)
    }
  } catch (error) {
    console.error('Failed to create document:', error)
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

// Helper function to convert Firestore document fields to form fields
const convertFirestoreFieldsToFormFields = (firestoreFields: any): any[] => {
  const fields: any[] = []

  Object.entries(firestoreFields || {}).forEach(([fieldName, fieldValue]: [string, any]) => {
    // Determine the field type and value from Firestore format
    let type = 'string'
    let value = ''

    if (fieldValue.stringValue !== undefined) {
      type = 'string'
      value = fieldValue.stringValue
    } else if (fieldValue.integerValue !== undefined) {
      type = 'number'
      value = fieldValue.integerValue
    } else if (fieldValue.doubleValue !== undefined) {
      type = 'number'
      value = fieldValue.doubleValue
    } else if (fieldValue.booleanValue !== undefined) {
      type = 'boolean'
      value = fieldValue.booleanValue
    } else if (fieldValue.nullValue !== undefined) {
      type = 'null'
      value = null
    } else if (fieldValue.timestampValue !== undefined) {
      type = 'timestamp'
      value = fieldValue.timestampValue
    } else if (fieldValue.arrayValue !== undefined) {
      type = 'array'
      value = JSON.stringify(fieldValue.arrayValue.values || [])
    } else if (fieldValue.mapValue !== undefined) {
      type = 'map'
      value = JSON.stringify(fieldValue.mapValue.fields || {})
    }

    fields.push({
      id: `field_${Date.now()}_${Math.random()}`,
      name: fieldName,
      type,
      value
    })
  })

  return fields
}

// Watch for modelValue prop changes to reset form or populate from clone
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    if (props.cloneDocument) {
      // Populate form with cloned document data
      documentForm.resetForm()
      documentForm.documentId.value = '' // Clear document ID for new document

      // Convert Firestore fields to form fields format
      const formFields = convertFirestoreFieldsToFormFields(props.cloneDocument.fields)
      documentForm.fields.value = formFields
    } else {
      resetForm()
    }
    await nextTick()
  }
})
</script>