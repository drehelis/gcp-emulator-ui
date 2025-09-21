<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="py-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-2">
                <h1 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                  Collections ({{ collectionsCount }})
                </h1>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Database Selector -->
            <DatabaseSelector
              :available-databases="availableDatabases"
              :selected-database="selectedDatabase"
              :testing-database="testingDatabase"
              @select-database="$emit('database-change', $event)"
              @add-database="$emit('add-database', $event)"
              @remove-database="$emit('remove-database', $event)"
            />

            <button
              @click="$emit('refresh')"
              :disabled="loading"
              class="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ArrowPathIcon
                :class="['w-4 h-4', loading ? 'animate-spin' : '', 'sm:mr-2']"
              />
              <span class="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import DatabaseSelector from '@/components/firestore/DatabaseSelector.vue'

interface Props {
  collectionsCount: number
  loading?: boolean
  availableDatabases?: string[]
  selectedDatabase?: string
  testingDatabase?: boolean
}

withDefaults(defineProps<Props>(), {
  availableDatabases: () => ['(default)'],
  selectedDatabase: '(default)',
  testingDatabase: false
})

defineEmits<{
  refresh: []
  'database-change': [databaseId: string]
  'add-database': [databaseId: string]
  'remove-database': [databaseId: string]
}>()
</script>