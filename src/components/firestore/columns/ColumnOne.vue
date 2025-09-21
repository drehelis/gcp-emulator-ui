<template>
  <div class="w-1/3 h-full bg-white dark:bg-gray-800 overflow-y-auto">
    <div class="p-4">
      <!-- Header -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
          <span class="text-gray-900 dark:text-white">{{ header }}</span>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-600"></div>
      </div>

      <!-- Add Button -->
      <div v-if="showAddButton" class="mb-4">
        <button
          @click="$emit('add-item')"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          {{ addButtonText }}
        </button>
      </div>

      <!-- Items List -->
      <div v-if="items.length > 0" class="space-y-1">
        <div
          v-for="item in items"
          :key="getItemKey(item)"
          :class="[
            'flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
            selectedItem && getItemKey(selectedItem) === getItemKey(item)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="$emit('select-item', item)"
        >
          <component :is="getItemIcon(item)" class="w-4 h-4 mr-2 flex-shrink-0" />
          <span class="truncate">{{ getItemDisplayName(item) }}</span>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, CircleStackIcon } from '@heroicons/vue/24/outline'
import type { NavigationItem } from '@/composables/useRecursiveNavigation'

interface Props {
  header: string
  items: NavigationItem[]
  selectedItem: NavigationItem | null
  showAddButton: boolean
  addButtonText: string
  emptyStateText: string
  emptyStateIcon?: any
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  emptyStateIcon: CircleStackIcon,
  loading: false
})

defineEmits<{
  'add-item': []
  'select-item': [item: NavigationItem]
}>()

// Utility functions
const getItemKey = (item: NavigationItem): string => {
  if ('id' in item) {
    return `collection-${item.id}`
  } else {
    return `document-${item.name}`
  }
}

const getItemDisplayName = (item: NavigationItem): string => {
  if ('id' in item) {
    return item.id
  } else {
    // Extract document ID from full path
    return item.name.split('/').pop() || 'Unknown'
  }
}

const getItemIcon = (item: NavigationItem) => {
  if ('id' in item) {
    return CircleStackIcon // Collection
  } else {
    return null // No icon for documents
  }
}
</script>