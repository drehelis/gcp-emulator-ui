<template>
  <div :class="[
    'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto',
    selectedDocument ? 'w-1/3' : 'w-2/3'
  ]">
    <div class="p-4">
      <!-- Collection Header with Breadcrumb Style -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
          <span class="text-gray-900 dark:text-white">{{
            selectedCollection ? selectedCollection.id :
            'Select a collection'
          }}</span>
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
                @click="handleDeleteCollection"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
              >
                Delete collection
              </button>
            </div>
          </div>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
      </div>

      <div class="mb-4">
        <button
          v-if="selectedCollection"
          @click="$emit('add-document')"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add document
        </button>
      </div>

      <!-- Documents List - only collection documents -->
      <div v-if="selectedCollection">
        <div class="space-y-1">
          <div
            v-for="document in documents"
            :key="document.name"
            :class="[
              'flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
              selectedDocument?.name === document.name
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="$emit('select-document', document)"
          >
            <span class="truncate">{{ getDocumentId(document.name) }}</span>
          </div>
        </div>

        <!-- Empty collection state -->
        <div
          v-if="documents.length === 0 && !loading"
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
      </div>

      <!-- No collection selected state -->
      <div
        v-else
        class="text-center py-16"
      >
        <CircleStackIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Select a collection
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Choose a collection from the left panel to view its documents
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusIcon, EllipsisVerticalIcon, DocumentIcon, CircleStackIcon } from '@heroicons/vue/24/outline'
import { getDocumentId } from '@/utils/firestoreHelpers'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

interface Props {
  selectedCollection?: FirestoreCollectionWithMetadata | null
  selectedDocument?: FirestoreDocument | null
  documents: FirestoreDocument[]
  loading?: boolean
}

defineProps<Props>()

const showCollectionMenu = ref(false)

const emit = defineEmits<{
  'add-document': []
  'select-document': [document: FirestoreDocument]
  'delete-collection': []
}>()

const handleDeleteCollection = () => {
  showCollectionMenu.value = false
  emit('delete-collection')
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>