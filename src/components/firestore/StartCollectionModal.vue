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
              /
            </div>
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
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose an ID that describes the documents you'll add to this collection.
              <a href="https://cloud.google.com/firestore/native/docs/data-model" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Learn more</a>
            </p>
          </div>
        </div>
      </div>

      <!-- First Document Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">First Document</h3>
          <button
            @click="showDocumentHelp = !showDocumentHelp"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <QuestionMarkCircleIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Help Popup -->
        <div
          v-if="showDocumentHelp"
          class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
        >
          <p class="text-sm text-blue-800 dark:text-blue-200">
            A collection must contain at least one document. Documents are Firestore's unit of storage and contain your data as fields.
          </p>
        </div>

        <div class="space-y-4">
          <!-- Document ID -->
          <div>
            <label for="document-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document ID
            </label>
            <input
              id="document-id"
              v-model="documentId"
              type="text"
              placeholder="Auto-generated (customize if needed)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty for auto-generation or provide a custom ID.
            </p>
          </div>

          <!-- Document Fields -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document Fields
            </label>

            <!-- Fields Table -->
            <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <!-- Table Header -->
              <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div class="grid grid-cols-12 gap-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  <div class="col-span-4">Field Name</div>
                  <div class="col-span-2">Type</div>
                  <div class="col-span-5">Value</div>
                  <div class="col-span-1"></div>
                </div>
              </div>

              <!-- Fields List -->
              <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                <DocumentField
                  v-for="field in fields"
                  :key="field.id"
                  :field="field"
                  @update="updateFieldValue"
                  @delete="removeField"
                />
              </div>

              <!-- Add Field Button -->
              <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  @click="addField"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon class="w-4 h-4 mr-2" />
                  Add Another Field
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import {
  QuestionMarkCircleIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import DocumentField from './DocumentField.vue'

interface Field {
  id: string
  name: string
  type: string
  value: any
}

interface Props {
  modelValue: boolean
  projectId: string
}

interface Emits {
  'update:modelValue': [value: boolean]
  'created': [collectionId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const collectionIdInput = ref<HTMLInputElement>()
const collectionId = ref('')
const documentId = ref('')
const fields = ref<Field[]>([])
const loading = ref(false)
const showDocumentHelp = ref(false)
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
    disabled: !isFormValid.value || loading.value
  },
  {
    label: 'Save',
    handler: handleSave,
    variant: 'primary',
    disabled: !isFormValid.value,
    loading: loading.value
  }
])

// Methods
const generateFieldId = () => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const addField = () => {
  fields.value.push({
    id: generateFieldId(),
    name: '',
    type: 'string',
    value: ''
  })
}

const updateFieldValue = (fieldId: string, updates: Partial<Field>) => {
  const field = fields.value.find(f => f.id === fieldId)
  if (field) {
    Object.assign(field, updates)
  }
}

const removeField = (fieldId: string) => {
  const index = fields.value.findIndex(f => f.id === fieldId)
  if (index > -1) {
    fields.value.splice(index, 1)

    // Ensure there's always at least one field
    if (fields.value.length === 0) {
      fields.value.push({
        id: generateFieldId(),
        name: '',
        type: 'string',
        value: ''
      })
    }
  }
}

const buildFirestoreValue = (value: any): any => {
  if (value === null || value === undefined) {
    return { nullValue: null }
  }

  if (typeof value === 'string') {
    return { stringValue: value }
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value }
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value }
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(item => buildFirestoreValue(item))
      }
    }
  }

  if (typeof value === 'object') {
    const fields: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      fields[key] = buildFirestoreValue(val)
    }
    return { mapValue: { fields } }
  }

  return { stringValue: String(value) }
}

const resetForm = () => {
  collectionId.value = ''
  documentId.value = ''
  fields.value = [{
    id: generateFieldId(),
    name: '',
    type: 'string',
    value: ''
  }]
  loading.value = false
  hasValidationError.value = false
  showDocumentHelp.value = false
}

const handleSave = async () => {
  hasValidationError.value = true
  if (!isFormValid.value) return

  try {
    loading.value = true

    // Import the store dynamically to avoid circular dependency
    const { useFirestoreStore } = await import('@/stores/firestore')
    const firestoreStore = useFirestoreStore()

    const documentFields: Record<string, any> = {}
    for (const field of fields.value) {
      if (field.name.trim()) {
        documentFields[field.name] = buildFirestoreValue(field.value)
      }
    }

    // If no fields have names, create an empty document
    if (Object.keys(documentFields).length === 0) {
      // Firestore requires at least some content, so we'll create a timestamp field
      documentFields['created_at'] = buildFirestoreValue(new Date().toISOString())
    }

    // Create collection with first document
    const success = await firestoreStore.createCollection(
      props.projectId,
      collectionId.value,
      {
        fields: documentFields
      },
      documentId.value || undefined
    )

    if (success) {
      emit('created', collectionId.value)
      isOpen.value = false
      resetForm()
    }
  } catch (error) {
    console.error('Failed to create collection:', error)
  } finally {
    loading.value = false
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

// Watch for modelValue prop changes to reset form and focus input
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    resetForm()
    await nextTick()
    collectionIdInput.value?.focus()
  }
})
</script>