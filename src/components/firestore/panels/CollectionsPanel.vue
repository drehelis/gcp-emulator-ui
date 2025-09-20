<template>
  <div class="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
    <div class="p-4">
      <!-- Database Name -->
      <div class="mb-3">
        <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
          <span>(default)</span>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
      </div>

      <div class="mb-4">
        <button
          @click="$emit('create-collection')"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Start collection
        </button>
      </div>

      <!-- Collections Tree -->
      <div class="space-y-1">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="group"
        >
          <div
            :class="[
              'flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200',
              selectedCollection?.id === collection.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="$emit('select-collection', collection)"
          >
            <ChevronRightIcon
              :class="[
                'w-4 h-4 mr-1 transition-transform duration-200',
                collection.isExpanded ? 'rotate-90' : ''
              ]"
            />
            <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
            <span class="truncate">{{ collection.id }}</span>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="collections.length === 0 && !loading"
          class="text-center py-8"
        >
          <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            No collections found
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, ChevronRightIcon, CircleStackIcon } from '@heroicons/vue/24/outline'
import type { FirestoreCollectionWithMetadata } from '@/types'

interface Props {
  collections: FirestoreCollectionWithMetadata[]
  selectedCollection?: FirestoreCollectionWithMetadata | null
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  'create-collection': []
  'select-collection': [collection: FirestoreCollectionWithMetadata]
}>()
</script>