<template>
  <div
    v-if="selectedDocument"
    class="w-full lg:w-1/3 h-full bg-white dark:bg-gray-800 overflow-y-auto"
  >
    <div class="p-3 sm:p-4">
      <!-- Document Header -->
      <div class="mb-3">
        <div
          class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3"
        >
          <span class="text-gray-900 dark:text-white">{{
            getDocumentId(selectedDocument.name)
          }}</span>
          <div class="relative" data-document-menu>
            <button
              @click="showDocumentMenu = !showDocumentMenu"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] sm:p-0 sm:min-h-0 sm:min-w-0 sm:hover:bg-transparent sm:dark:hover:bg-transparent"
            >
              <EllipsisVerticalIcon class="w-5 h-5 sm:w-3 sm:h-3" />
            </button>
            <!-- Dropdown Menu -->
            <div
              v-if="showDocumentMenu"
              class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[160px]"
              @click.stop
            >
              <button
                @click="handleCloneDocument"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
              >
                Clone document
              </button>
              <button
                @click="handleDeleteAllFields"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
              >
                Clear all fields
              </button>
              <button
                @click="handleDeleteDocument"
                class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
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
          @click="$emit('start-subcollection')"
          class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto justify-center sm:justify-start"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Start collection
        </button>

        <!-- Display subcollections for current document -->
        <div v-if="subcollections.length > 0" class="mt-3 space-y-1">
          <div v-for="subcollection in subcollections" :key="subcollection.id" class="group">
            <button
              @click="$emit('navigate-to-subcollection', subcollection)"
              :class="[
                'flex items-center w-full px-2 py-2 sm:py-1.5 text-sm rounded-md cursor-pointer transition-colors min-h-[44px] sm:min-h-0',
                selectedSubcollection?.id === subcollection.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
              ]"
            >
              <ChevronRightIcon class="w-4 h-4 mr-1 flex-shrink-0" />
              <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="truncate">{{ subcollection.id }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add Field Button -->
      <div class="mb-4">
        <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
        <button
          @click="$emit('add-field')"
          class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto justify-center sm:justify-start"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add field
        </button>
      </div>

      <!-- Document Fields -->
      <FieldList
        v-if="selectedDocument.fields"
        :fields="selectedDocument.fields"
        :expanded-fields="expandedFields"
        @toggle-field="$emit('toggle-field', $event)"
        @edit-field="$emit('edit-field', $event)"
        @delete-field="$emit('delete-field', $event)"
        @add-to-map="$emit('add-to-map', $event)"
        @add-to-array="$emit('add-to-array', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  PlusIcon,
  EllipsisVerticalIcon,
  ChevronRightIcon,
  CircleStackIcon,
} from '@heroicons/vue/24/outline'
import { useDocumentUtils } from '@/composables/useDocumentUtils'
import FieldList from '@/components/firestore/fields/FieldList.vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

interface Props {
  selectedDocument?: FirestoreDocument | null
  subcollections?: FirestoreCollectionWithMetadata[]
  selectedSubcollection?: FirestoreCollectionWithMetadata | null
  expandedFields?: Set<string>
}

withDefaults(defineProps<Props>(), {
  subcollections: () => [],
  expandedFields: () => new Set(),
})

const { getDocumentId } = useDocumentUtils()

const emit = defineEmits<{
  'start-subcollection': []
  'navigate-to-subcollection': [subcollection: FirestoreCollectionWithMetadata]
  'add-field': []
  'toggle-field': [fieldName: string]
  'edit-field': [data: any]
  'delete-field': [data: any]
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
