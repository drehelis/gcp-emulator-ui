<template>
  <div :class="[
    'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto',
    selectedDocument ? 'w-1/3' : 'w-2/3'
  ]">
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
                @click="$emit('delete-collection')"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
              >
                Delete collection
              </button>
            </div>
          </div>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
      </div>

      <!-- Add Document Button -->
      <div v-if="selectedCollection" class="mb-4">
        <button
          @click="$emit('add-document')"
          class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-3 h-3 mr-1" />
          Add document
        </button>
      </div>

      <!-- Documents List -->
      <div v-if="selectedCollection && documents.length > 0" class="space-y-1">
        <div
          v-for="document in documents"
          :key="document.name"
          :class="[
            'flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
            selectedDocument?.name === document.name
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="$emit('select-document', document)"
        >
          <div class="flex items-center min-w-0 flex-1">
            <DocumentIcon class="w-4 h-4 mr-2 flex-shrink-0" />
            <span class="truncate">{{ getDocumentId(document.name) }}</span>
          </div>
        </div>
      </div>

      <!-- Display subcollections for current document -->
      <div v-if="selectedDocument && subcollections.length > 0" class="mt-3 space-y-1">
        <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
        <div
          v-for="subcollection in subcollections"
          :key="subcollection.id"
          class="group"
        >
          <button
            @click="$emit('navigate-to-subcollection', subcollection)"
            class="flex items-center w-full px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon class="w-4 h-4 mr-1 flex-shrink-0" />
            <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
            <span class="truncate">{{ subcollection.id }}</span>
          </button>
        </div>
      </div>

      <!-- Empty documents state -->
      <div
        v-else-if="selectedCollection && documents.length === 0"
        class="text-center py-8"
      >
        <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          No documents in this collection
        </p>
        <button
          @click="$emit('add-document')"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add your first document
        </button>
      </div>

      <!-- No collection selected placeholder -->
      <div
        v-else-if="!selectedCollection"
        class="text-center py-16"
      >
        <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Select a collection to view its documents
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  PlusIcon,
  DocumentIcon,
  CircleStackIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/vue/24/outline'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

interface Props {
  selectedCollection: FirestoreCollectionWithMetadata | null
  selectedDocument: FirestoreDocument | null
  documents: FirestoreDocument[]
  subcollections: FirestoreCollectionWithMetadata[]
}

interface Emits {
  'add-document': []
  'select-document': [document: FirestoreDocument]
  'navigate-to-subcollection': [subcollection: FirestoreCollectionWithMetadata]
  'delete-collection': []
}

defineProps<Props>()
defineEmits<Emits>()

const showCollectionMenu = ref(false)

const getDocumentId = (documentPath: string): string => {
  const parts = documentPath.split('/')
  return parts[parts.length - 1]
}
</script>