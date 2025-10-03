<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800">
    <!-- Header -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Collections</h1>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ collections.length }} collections</span>
      </div>
    </div>

    <!-- Add Collection Button -->
    <div class="flex-shrink-0 p-4">
      <button
        @click="$emit('add-collection')"
        class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200 dark:border-blue-800"
      >
        <PlusIcon class="w-5 h-5 mr-2" />
        Start collection
      </button>
    </div>

    <!-- Collections List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4">
        <div class="space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div v-else-if="collections.length === 0" class="p-8 text-center">
        <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">No collections</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Get started by creating your first collection.</p>
      </div>

      <div v-else class="p-4 space-y-2">
        <button
          v-for="collection in collections"
          :key="collection.id"
          @click="$emit('select-collection', collection)"
          class="w-full flex items-center p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <CircleStackIcon class="w-6 h-6 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">{{ collection.id }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Collection</p>
          </div>
          <ChevronRightIcon class="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, CircleStackIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import type { FirestoreCollectionWithMetadata } from '@/types'

interface Props {
  collections: FirestoreCollectionWithMetadata[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

defineEmits<{
  'select-collection': [collection: FirestoreCollectionWithMetadata]
  'add-collection': []
}>()
</script>
