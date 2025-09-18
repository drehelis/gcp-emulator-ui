<template>
  <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ title }}</h3>
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
        {{ helpText }}
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
          :value="documentId"
          @input="$emit('update:documentId', $event.target.value)"
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
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              Add Another Field
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  QuestionMarkCircleIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import DocumentField from './DocumentField.vue'
import type { Field } from '@/composables/useDocumentForm'

interface Props {
  title?: string
  helpText?: string
  documentId: string
  fields: Field[]
}

interface Emits {
  'update:documentId': [value: string]
  'update:fields': [value: Field[]]
  'addField': []
  'updateField': [fieldId: string, updates: Partial<Field>]
  'removeField': [fieldId: string]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Document',
  helpText: 'A collection must contain at least one document. Documents are Firestore\'s unit of storage and contain your data as fields.'
})

const emit = defineEmits<Emits>()

const showDocumentHelp = ref(false)

// Methods
const addField = () => {
  emit('addField')
}

const updateFieldValue = (fieldId: string, updates: Partial<Field>) => {
  emit('updateField', fieldId, updates)
}

const removeField = (fieldId: string) => {
  emit('removeField', fieldId)
}
</script>