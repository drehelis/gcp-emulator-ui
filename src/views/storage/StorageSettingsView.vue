<template>
  <div class="space-y-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Storage Settings
            </h2>
            <div class="flex items-center space-x-3">
              <!-- Invisible placeholder to match header height with other pages -->
              <div class="h-9 w-20"></div>
            </div>
          </div>
        </div>
      </div>

    <!-- Settings Content -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4">
        <div class="space-y-6">
          <!-- View Mode Setting -->
          <div>
            <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4">
              Default View Mode
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose how objects are displayed in buckets by default.
            </p>

            <div class="flex items-center space-x-4">
              <!-- List Mode (Default) -->
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="selectedViewMode"
                  type="radio"
                  value="list"
                  class="sr-only"
                />
                <div
                  class="relative flex items-center justify-center w-20 h-16 border-2 rounded-lg transition-all duration-200"
                  :class="selectedViewMode === 'list'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
                >
                  <!-- List Icon -->
                  <ListBulletIcon
                    class="w-8 h-8"
                    :class="selectedViewMode === 'list'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'"
                  />
                  <!-- Selected indicator -->
                  <div
                    v-if="selectedViewMode === 'list'"
                    class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"
                  >
                    <CheckIcon class="w-3 h-3 text-white" />
                  </div>
                </div>
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">List</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Show files in table</p>
                </div>
              </label>

              <!-- Grid Mode -->
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="selectedViewMode"
                  type="radio"
                  value="grid"
                  class="sr-only"
                />
                <div
                  class="relative flex items-center justify-center w-20 h-16 border-2 rounded-lg transition-all duration-200"
                  :class="selectedViewMode === 'grid'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
                >
                  <!-- Grid Icon -->
                  <Squares2X2Icon
                    class="w-8 h-8"
                    :class="selectedViewMode === 'grid'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'"
                  />
                  <!-- Selected indicator -->
                  <div
                    v-if="selectedViewMode === 'grid'"
                    class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"
                  >
                    <CheckIcon class="w-3 h-3 text-white" />
                  </div>
                </div>
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Grid</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Show files as cards</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="saveSettings"
              :disabled="!hasChanges"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <CheckIcon class="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Squares2X2Icon,
  ListBulletIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const storageStore = useStorageStore()
const appStore = useAppStore()

// Local state
const selectedViewMode = ref<'grid' | 'list'>('list')

// Computed
const hasChanges = computed(() => {
  return selectedViewMode.value !== storageStore.viewMode
})

// Methods
function saveSettings(): void {
  try {
    storageStore.setViewMode(selectedViewMode.value)

    appStore.showToast({
      type: 'success',
      title: 'Settings Saved',
      message: `View mode set to ${selectedViewMode.value}`
    })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    appStore.showToast({
      type: 'error',
      title: 'Error Saving Settings',
      message: error.message || 'Failed to save settings'
    })
  }
}

// Lifecycle
onMounted(() => {
  selectedViewMode.value = storageStore.viewMode
})
</script>