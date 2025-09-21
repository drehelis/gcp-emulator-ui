<template>
  <div class="relative">
    <!-- Database Selector Button -->
    <button
      @click="showDropdown = !showDropdown"
      :disabled="testingDatabase"
      class="flex items-center px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span class="truncate max-w-[120px]">
        {{ selectedDatabase }}
      </span>
      <ChevronDownIcon class="w-4 h-4 ml-2 flex-shrink-0" />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showDropdown"
      class="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[200px] max-w-[300px]"
      @click.stop
    >
      <!-- Header -->
      <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">Select Database</h3>
      </div>

      <!-- Database List -->
      <div class="py-1 max-h-60 overflow-y-auto">
        <button
          v-for="database in availableDatabases"
          :key="database"
          @click="handleSelectDatabase(database)"
          :class="[
            'w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150',
            selectedDatabase === database
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300'
          ]"
        >
          <div class="flex items-center min-w-0 flex-1">
            <span class="truncate">
              {{ database }}
            </span>
          </div>
          <div class="flex items-center space-x-1 flex-shrink-0">
            <CheckIcon v-if="selectedDatabase === database" class="w-4 h-4" />
            <button
              v-if="database !== '(default)'"
              @click.stop="handleRemoveDatabase(database)"
              class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-150"
              title="Remove database"
            >
              <XMarkIcon class="w-3 h-3 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </button>
      </div>

      <!-- Add Database Section -->
      <div class="border-t border-gray-200 dark:border-gray-600 p-3">
        <div class="flex space-x-2">
          <input
            v-model="newDatabaseName"
            @keyup.enter="handleAddDatabase"
            placeholder="Database name..."
            class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="handleAddDatabase"
            :disabled="!newDatabaseName.trim() || testingDatabase"
            class="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors duration-200"
          >
            <ArrowPathIcon v-if="testingDatabase" class="w-3 h-3 animate-spin" />
            <span v-else>Add</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Click outside to close -->
    <div
      v-if="showDropdown"
      class="fixed inset-0 z-40"
      @click="showDropdown = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon, CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

interface Props {
  availableDatabases: string[]
  selectedDatabase: string
  testingDatabase: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'select-database': [databaseId: string]
  'add-database': [databaseId: string]
  'remove-database': [databaseId: string]
}>()

const showDropdown = ref(false)
const newDatabaseName = ref('')

const handleSelectDatabase = (databaseId: string) => {
  emit('select-database', databaseId)
  showDropdown.value = false
}

const handleAddDatabase = async () => {
  const databaseName = newDatabaseName.value.trim()
  if (!databaseName) return

  emit('add-database', databaseName)
  newDatabaseName.value = ''
}

const handleRemoveDatabase = (databaseId: string) => {
  emit('remove-database', databaseId)
}
</script>