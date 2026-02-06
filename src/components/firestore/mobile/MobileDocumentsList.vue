<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800">
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
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ collectionId }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ documents.length }} documents</p>
        </div>
      </div>
    </div>

    <!-- Add Document Button -->
    <div class="flex-shrink-0 p-4">
      <button
        @click="$emit('add-document')"
        class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200 dark:border-blue-800"
      >
        <PlusIcon class="w-5 h-5 mr-2" />
        Add document
      </button>
    </div>

    <!-- Documents List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4">
        <div class="space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div v-else-if="documents.length === 0" class="p-8 text-center">
        <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">No documents</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Add your first document to this collection.
        </p>
      </div>

      <div v-else class="p-4 space-y-2">
        <button
          v-for="document in documents"
          :key="document.name"
          @click="$emit('select-document', document)"
          class="w-full flex items-center p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ getDocumentId(document.name) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ Object.keys(document.fields || {}).length }} fields •
              {{ getSubcollectionCount(document) }} collections
            </p>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  DocumentIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/vue/24/outline'
import { useDocumentUtils } from '@/composables/useDocumentUtils'
import type { FirestoreDocument } from '@/types'

interface Props {
  collectionId: string
  documents: FirestoreDocument[]
  loading?: boolean
  documentSubcollections?: Map<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  documentSubcollections: () => new Map(),
})

const { getDocumentId } = useDocumentUtils()

defineEmits<{
  'select-document': [document: FirestoreDocument]
  'add-document': []
  back: []
}>()

// Helper function to get subcollection count for a document
const getSubcollectionCount = (document: FirestoreDocument): number => {
  const subcollectionsResponse = props.documentSubcollections?.get(document.name)
  if (Array.isArray(subcollectionsResponse)) {
    return subcollectionsResponse.length
  } else if (
    subcollectionsResponse?.collections &&
    Array.isArray(subcollectionsResponse.collections)
  ) {
    return subcollectionsResponse.collections.length
  }
  return 0
}
</script>
