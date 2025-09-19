<template>
  <!-- Subcollection Level (Level 1) -->
  <div class="flex-shrink-0 w-full flex">
    <!-- Parent Document Panel (left pane) -->
    <div class="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div class="p-4">
        <!-- Parent Document Header -->
        <div class="mb-3">
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
            <span class="text-gray-900 dark:text-white">{{ selectedDocument ? getDocumentId(selectedDocument.name) : 'Parent Document' }}</span>
          </div>
          <div class="border-b border-gray-200 dark:border-gray-600"></div>
        </div>

        <!-- Start Collection Button -->
        <div v-if="selectedDocument" class="mb-4">
          <button
            @click="$emit('start-subcollection')"
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-3 h-3 mr-1" />
            Start collection
          </button>
        </div>

        <!-- Display subcollections for current parent document -->
        <div v-if="selectedDocument && subcollections.length > 0" class="mt-3 space-y-1">
          <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
          <div
            v-for="subcollection in subcollections"
            :key="subcollection.id"
            class="group"
          >
            <button
              @click="$emit('navigate-to-subcollection', subcollection)"
              :class="[
                'flex items-center w-full px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200',
                selectedSubcollection?.id === subcollection.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              <ChevronRightIcon class="w-4 h-4 mr-1 flex-shrink-0" />
              <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="truncate">{{ subcollection.id }}</span>
            </button>
          </div>
        </div>

        <!-- Add Field Button -->
        <div v-if="selectedSubcollectionDocument" class="mb-4">
          <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
          <button
            @click="$emit('add-field')"
            class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-3 h-3 mr-1" />
            Add field
          </button>
        </div>

        <!-- Subcollection Document Fields -->
        <div v-if="selectedSubcollectionDocument" class="space-y-1">
          <!-- Fields would be displayed here -->
        </div>

        <!-- No subcollection selected state -->
        <div v-if="!selectedSubcollection" class="text-center py-16">
          <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Subcollection details will be shown here
          </p>
        </div>
      </div>
    </div>

    <!-- Subcollection Documents (middle pane) -->
    <div class="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div class="p-4">
        <div class="mb-3">
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
            <span class="text-gray-900 dark:text-white">{{ selectedSubcollection ? selectedSubcollection.id : 'Select a subcollection' }}</span>
          </div>
          <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
        </div>

        <!-- Add Document Button -->
        <div v-if="selectedSubcollection" class="mb-4">
          <button
            @click="$emit('add-document')"
            class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-3 h-3 mr-1" />
            Add document
          </button>
        </div>

        <!-- Subcollection Documents List -->
        <div v-if="selectedSubcollection && subcollectionDocuments.length > 0" class="space-y-1">
          <div
            v-for="document in subcollectionDocuments"
            :key="document.name"
            :class="[
              'flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
              selectedSubcollectionDocument?.name === document.name
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="$emit('select-subcollection-document', document)"
          >
            <span class="truncate">{{ getDocumentId(document.name) }}</span>
          </div>
        </div>

        <!-- Empty subcollection documents state -->
        <div
          v-else-if="selectedSubcollection && subcollectionDocuments.length === 0"
          class="text-center py-8"
        >
          <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No documents in this subcollection
          </p>
          <button
            @click="$emit('add-document')"
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Add your first document
          </button>
        </div>

        <!-- No subcollection selected placeholder -->
        <div
          v-else
          class="text-center py-16"
        >
          <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Select a subcollection to view its documents
          </p>
        </div>
      </div>
    </div>

    <!-- Subcollection Document Editor (3rd pane) -->
    <div class="w-1/3 bg-white dark:bg-gray-800 overflow-y-auto">
      <div class="p-4">
        <!-- Subcollection Document Header -->
        <div class="mb-3">
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
            <span class="text-gray-900 dark:text-white">{{ selectedSubcollectionDocument ? getDocumentId(selectedSubcollectionDocument.name) : 'Select a document' }}</span>
          </div>
          <div class="border-b border-gray-200 dark:border-gray-600"></div>
        </div>

        <!-- Start Collection Button -->
        <div v-if="selectedSubcollectionDocument" class="mb-4">
          <button
            @click="$emit('start-subcollection')"
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-3 h-3 mr-1" />
            Start collection
          </button>
        </div>

        <!-- Add Field Button -->
        <div v-if="selectedSubcollectionDocument" class="mb-4">
          <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
          <button
            @click="$emit('add-field')"
            class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-3 h-3 mr-1" />
            Add field
          </button>
        </div>

        <!-- Subcollection Document Fields -->
        <div v-if="selectedSubcollectionDocument" class="space-y-1">
          <RecursiveFieldViewer
            v-if="selectedSubcollectionDocument.fields"
            :fields="selectedSubcollectionDocument.fields"
            :expandedMapFields="expandedMapFields"
            @toggle-map-field="$emit('toggle-map-field', $event)"
            @edit-field="$emit('edit-field', $event)"
            @delete-field="$emit('delete-field', $event)"
          />
        </div>

        <!-- No subcollection document selected state -->
        <div
          v-else
          class="text-center py-16"
        >
          <PencilIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Select a subcollection document to view its fields
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Set } from 'vue'
import {
  PlusIcon,
  DocumentIcon,
  CircleStackIcon,
  ChevronRightIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import RecursiveFieldViewer from './RecursiveFieldViewer.vue'

interface Props {
  selectedDocument: FirestoreDocument | null
  selectedSubcollection: FirestoreCollectionWithMetadata | null
  selectedSubcollectionDocument: FirestoreDocument | null
  subcollections: FirestoreCollectionWithMetadata[]
  subcollectionDocuments: FirestoreDocument[]
  expandedMapFields: Set<string>
}

interface Emits {
  'start-subcollection': []
  'navigate-to-subcollection': [subcollection: FirestoreCollectionWithMetadata]
  'add-document': []
  'select-subcollection-document': [document: FirestoreDocument]
  'add-field': []
  'toggle-map-field': [fieldName: string]
  'edit-field': [fieldName: string, value: any]
  'delete-field': [fieldName: string]
}

defineProps<Props>()
defineEmits<Emits>()

const getDocumentId = (documentPath: string): string => {
  const parts = documentPath.split('/')
  return parts[parts.length - 1]
}
</script>