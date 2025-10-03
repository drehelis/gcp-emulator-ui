<template>
  <div v-if="selectedDocument" class="h-full flex flex-col bg-white dark:bg-gray-800">
    <!-- Header -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-3">
        <button
          @click="$emit('back')"
          class="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon class="w-6 h-6" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ getDocumentId(selectedDocument.name) }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ Object.keys(selectedDocument.fields || {}).length }} fields, {{ subcollections.length }} subcollections
          </p>
        </div>
        <button
          @click="showDocumentMenu = !showDocumentMenu"
          class="inline-flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <EllipsisVerticalIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Document Menu Dropdown -->
      <div
        v-if="showDocumentMenu"
        class="absolute right-4 top-16 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[180px]"
        @click.stop
      >
        <button
          @click="handleCloneDocument"
          class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg"
        >
          Clone document
        </button>
        <button
          @click="handleDeleteAllFields"
          class="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear all fields
        </button>
        <button
          @click="handleDeleteDocument"
          class="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors last:rounded-b-lg"
        >
          Delete document
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Subcollections Section -->
      <div v-if="subcollections.length > 0" class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-gray-900 dark:text-white">Subcollections</h2>
          <button
            @click="$emit('start-subcollection')"
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        <div class="space-y-2">
          <button
            v-for="subcollection in subcollections"
            :key="subcollection.id"
            @click="$emit('navigate-to-subcollection', subcollection)"
            class="w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <CircleStackIcon class="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
            <span class="font-medium text-gray-900 dark:text-white truncate">{{ subcollection.id }}</span>
            <ChevronRightIcon class="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
          </button>
        </div>
      </div>

      <!-- Start Collection Button (when no subcollections) -->
      <div v-else class="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          @click="$emit('start-subcollection')"
          class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200 dark:border-blue-800"
        >
          <PlusIcon class="w-5 h-5 mr-2" />
          Start collection
        </button>
      </div>

      <!-- Fields Section -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-medium text-gray-900 dark:text-white">Fields</h2>
          <button
            @click="$emit('add-field')"
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        <!-- Fields List -->
        <FieldList
          v-if="selectedDocument.fields && Object.keys(selectedDocument.fields).length > 0"
          :fields="selectedDocument.fields"
          :expanded-fields="expandedFields"
          :mobile-mode="true"
          @toggle-field="$emit('toggle-field', $event)"
          @edit-field="$emit('edit-field', $event)"
          @delete-field="$emit('delete-field', $event)"
          @add-to-map="$emit('add-to-map', $event)"
          @add-to-array="$emit('add-to-array', $event)"
        />

        <!-- Empty Fields State -->
        <div v-else class="text-center py-8">
          <div class="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
            <DocumentIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">No fields</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Add your first field to this document.</p>
          <button
            @click="$emit('add-field')"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Add field
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  CircleStackIcon,
  ChevronRightIcon,
  DocumentIcon
} from '@heroicons/vue/24/outline'
import { useDocumentUtils } from '@/composables/useDocumentUtils'
import FieldList from '@/components/firestore/fields/FieldList.vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

interface Props {
  selectedDocument?: FirestoreDocument | null
  subcollections?: FirestoreCollectionWithMetadata[]
  expandedFields?: Set<string>
}

withDefaults(defineProps<Props>(), {
  subcollections: () => [],
  expandedFields: () => new Set()
})

const { getDocumentId } = useDocumentUtils()

const emit = defineEmits<{
  'back': []
  'add-field': []
  'edit-field': [data: any]
  'delete-field': [data: any]
  'start-subcollection': []
  'navigate-to-subcollection': [subcollection: FirestoreCollectionWithMetadata]
  'toggle-field': [fieldName: string]
  'add-to-map': [fieldPath: string]
  'add-to-array': [fieldPath: string]
  'clone-document': []
  'delete-all-fields': []
  'delete-document': []
}>()

const showDocumentMenu = ref(false)

const handleCloneDocument = () => {
  showDocumentMenu.value = false
  emit('clone-document')
}

const handleDeleteAllFields = () => {
  showDocumentMenu.value = false
  emit('delete-all-fields')
}

const handleDeleteDocument = () => {
  showDocumentMenu.value = false
  emit('delete-document')
}
</script>
