<template>
  <div v-if="selectedDocument" class="w-1/3 bg-white dark:bg-gray-800 overflow-y-auto">
    <div class="p-4">
      <!-- Document Header -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
          <span class="text-gray-900 dark:text-white">{{ getDocumentId(selectedDocument.name) }}</span>
          <div class="relative" data-document-menu>
            <button
              @click="showDocumentMenu = !showDocumentMenu"
              class="p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <EllipsisVerticalIcon class="w-3 h-3" />
            </button>
            <!-- Dropdown Menu -->
            <div
              v-if="showDocumentMenu"
              class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[160px]"
              @click.stop
            >
              <button
                @click="$emit('add-similar-document')"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
              >
                Add similar document
              </button>
              <button
                @click="$emit('delete-all-fields')"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
              >
                Delete all fields
              </button>
              <button
                @click="$emit('delete-document')"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-red-700 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
              >
                Delete document
              </button>
            </div>
          </div>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-600"></div>
      </div>

      <!-- Start Collection Button -->
      <div class="mb-4">
        <button
          @click="$emit('start-collection')"
          class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-3 h-3 mr-1" />
          Start collection
        </button>
      </div>

      <!-- Add Field Button -->
      <div class="mb-4">
        <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
        <button
          @click="$emit('add-field')"
          class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-3 h-3 mr-1" />
          Add field
        </button>
      </div>

      <!-- Document Fields -->
      <div class="space-y-1">
        <RecursiveFieldViewer
          v-if="selectedDocument.fields"
          :fields="selectedDocument.fields"
          :expandedMapFields="expandedMapFields"
          @toggle-map-field="$emit('toggle-map-field', $event)"
          @edit-field="$emit('edit-field', $event)"
          @delete-field="$emit('delete-field', $event)"
        />
      </div>

      <!-- Empty document state -->
      <div
        v-if="!selectedDocument.fields || Object.keys(selectedDocument.fields).length === 0"
        class="text-center py-8"
      >
        <PencilIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This document has no fields
        </p>
        <button
          @click="$emit('add-field')"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add your first field
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Set } from 'vue'
import {
  PlusIcon,
  PencilIcon,
  EllipsisVerticalIcon
} from '@heroicons/vue/24/outline'
import type { FirestoreDocument } from '@/types'
import RecursiveFieldViewer from './RecursiveFieldViewer.vue'

interface Props {
  selectedDocument: FirestoreDocument | null
  expandedMapFields: Set<string>
}

interface Emits {
  'start-collection': []
  'add-field': []
  'add-similar-document': []
  'delete-all-fields': []
  'delete-document': []
  'toggle-map-field': [fieldName: string]
  'edit-field': [fieldName: string, value: any]
  'delete-field': [fieldName: string]
}

defineProps<Props>()
defineEmits<Emits>()

const showDocumentMenu = ref(false)

const getDocumentId = (documentPath: string): string => {
  const parts = documentPath.split('/')
  return parts[parts.length - 1]
}
</script>