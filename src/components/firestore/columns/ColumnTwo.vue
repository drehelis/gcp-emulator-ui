<template>
  <div class="w-1/3 h-full bg-white dark:bg-gray-800 border-l border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
    <div class="p-4">
      <!-- Header -->
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
          <span class="text-gray-900 dark:text-white">{{ header }}</span>
          <div v-if="showCollectionMenu" class="relative" data-collection-menu>
            <button
              @click="showCollectionMenuDropdown = !showCollectionMenuDropdown"
              class="p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <EllipsisVerticalIcon class="w-3 h-3" />
            </button>
            <!-- Dropdown Menu -->
            <div
              v-if="showCollectionMenuDropdown"
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
import { ref } from 'vue'
import { PlusIcon, CircleStackIcon, DocumentIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
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
  showSelectionPrompt?: boolean
  selectionPromptTitle?: string
  selectionPromptText?: string
  selectionPromptIcon?: any
  showCollectionMenu?: boolean
}

withDefaults(defineProps<Props>(), {
  emptyStateIcon: DocumentIcon,
  loading: false,
  showSelectionPrompt: false,
  selectionPromptTitle: 'Select an item',
  selectionPromptText: 'Choose an item from the left panel to view its contents',
  selectionPromptIcon: DocumentIcon,
  showCollectionMenu: false
})

const emit = defineEmits<{
  'add-item': []
  'select-item': [item: NavigationItem]
  'delete-collection': []
}>()

const showCollectionMenuDropdown = ref(false)

const handleDeleteCollection = () => {
  showCollectionMenuDropdown.value = false
  emit('delete-collection')
}

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