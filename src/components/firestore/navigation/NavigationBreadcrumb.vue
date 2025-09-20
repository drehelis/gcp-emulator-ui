<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-2">
    <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
      <button @click="$emit('navigate-to-root')" class="text-blue-600 dark:text-blue-400 hover:underline">/</button>

      <!-- Show navigation path for subcollections -->
      <template v-if="isInSubcollectionMode">
        <template v-for="(segment, index) in navigationPath" :key="`${segment.type}-${segment.id}-${index}`">
          <ChevronRightIcon class="w-3 h-3 mx-1" />
          <button
            @click="$emit('navigate-to-segment', index)"
            class="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ segment.name }}
          </button>
        </template>
        <!-- Show current subcollection document if selected -->
        <template v-if="selectedSubcollectionDocument">
          <ChevronRightIcon class="w-3 h-3 mx-1" />
          <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ getDocumentId(selectedSubcollectionDocument.name) }}</span>
        </template>
      </template>

      <!-- Show current selection for root mode -->
      <template v-else>
        <template v-if="selectedCollection">
          <ChevronRightIcon class="w-3 h-3 mx-1" />
          <button
            @click="$emit('navigate-to-collection')"
            class="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ selectedCollection.id }}
          </button>
        </template>
        <template v-if="selectedDocument">
          <ChevronRightIcon class="w-3 h-3 mx-1" />
          <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ getDocumentId(selectedDocument.name) }}</span>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
import { getDocumentId } from '@/utils/firestoreHelpers'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

export interface NavigationSegment {
  type: 'collection' | 'document'
  id: string
  name: string
}

interface Props {
  navigationPath: NavigationSegment[]
  selectedCollection?: FirestoreCollectionWithMetadata | null
  selectedDocument?: FirestoreDocument | null
  selectedSubcollectionDocument?: FirestoreDocument | null
  isInSubcollectionMode: boolean
}

defineProps<Props>()

defineEmits<{
  'navigate-to-root': []
  'navigate-to-collection': []
  'navigate-to-segment': [index: number]
}>()
</script>