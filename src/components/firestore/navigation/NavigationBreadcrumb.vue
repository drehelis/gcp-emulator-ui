<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-2">
    <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
      <!-- Edit mode -->
      <template v-if="isEditing">
        <div class="flex items-center gap-2 w-full">
          <input
            v-model="editablePath"
            @keydown.enter="saveEditedPath"
            @keydown.escape="cancelEditing"
            class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter path like: / > collection > document"
            ref="editInput"
          />
          <button
            @click="saveEditedPath"
            class="text-green-600 hover:text-green-700 p-1"
            title="Save path"
          >
            <CheckIcon class="w-3 h-3" />
          </button>
          <button
            @click="cancelEditing"
            class="text-gray-400 hover:text-gray-600 p-1"
            title="Cancel"
          >
            ×
          </button>
        </div>
      </template>

      <!-- Normal navigation mode -->
      <template v-else>
        <div class="flex items-center gap-1">
          <button
            @click="copyPathToClipboard"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded"
            :class="{ 'text-green-500': copySuccess }"
            title="Copy full path to clipboard"
          >
            <ClipboardDocumentIcon v-if="!copySuccess" class="w-3 h-3" />
            <CheckIcon v-else class="w-3 h-3" />
          </button>
          <button @click="$emit('navigate-to-root')" class="text-blue-600 dark:text-blue-400 hover:underline">/</button>
        </div>

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

        <!-- Edit icon at the end -->
        <button
          @click="startEditing"
          class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded"
          title="Edit path"
        >
          <PencilIcon class="w-3 h-3" />
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ChevronRightIcon, ClipboardDocumentIcon, CheckIcon, PencilIcon } from '@heroicons/vue/24/outline'
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

const props = defineProps<Props>()

const $emit = defineEmits<{
  'navigate-to-root': []
  'navigate-to-collection': []
  'navigate-to-segment': [index: number]
  'navigate-to-path': [path: string]
}>()

// Copy functionality
const copySuccess = ref(false)

// Edit functionality
const isEditing = ref(false)
const editablePath = ref('')
const editInput = ref<HTMLInputElement | null>(null)

// Build the full path string
const fullPath = computed(() => {
  if (props.isInSubcollectionMode) {
    // For subcollection mode, use the navigation path
    const pathSegments = props.navigationPath.map(segment => segment.name)
    if (pathSegments.length > 0) {
      return `/ > ${  pathSegments.join(' > ')}`
    }
  } else {
    // For root mode, build from selected items
    const segments: string[] = []
    if (props.selectedCollection) {
      segments.push(props.selectedCollection.id)
    }
    if (props.selectedDocument) {
      segments.push(getDocumentId(props.selectedDocument.name))
    }
    if (segments.length > 0) {
      return `/ > ${  segments.join(' > ')}`
    }
  }

  return '/'
})

const copyPathToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(fullPath.value)
    copySuccess.value = true
    console.log('Copied path to clipboard:', fullPath.value)

    // Reset success state after 2 seconds
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy path to clipboard:', error)
  }
}

const startEditing = async () => {
  editablePath.value = fullPath.value
  isEditing.value = true
  await nextTick()
  editInput.value?.focus()
  editInput.value?.select()
}

const cancelEditing = () => {
  isEditing.value = false
  editablePath.value = ''
}

const saveEditedPath = () => {
  if (editablePath.value.trim()) {
    $emit('navigate-to-path', editablePath.value.trim())
  }
  isEditing.value = false
}
</script>