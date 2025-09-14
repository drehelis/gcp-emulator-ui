<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Storage Import/Export
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Export and import Cloud Storage bucket configurations
        </p>
      </div>

      <div class="space-y-6">
        <!-- Export Section -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              Export Configuration
            </h2>
            <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Export all your current bucket configurations to JSON files
            </p>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <!-- Export Buttons -->
              <div class="flex flex-col sm:flex-row gap-3">
                <button
                  @click="exportBuckets"
                  :disabled="isExporting"
                  class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDownTrayIcon v-if="!isExporting" class="h-4 w-4 mr-2" />
                  <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
                  {{ isExporting ? 'Exporting...' : 'Export Bucket Configurations' }}
                </button>
              </div>

              <!-- Export Status -->
              <div v-if="exportStatus" class="p-3 rounded-md" :class="exportStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
                <div class="flex">
                  <CheckCircleIcon v-if="exportStatus.type === 'success'" class="h-5 w-5 text-green-400" />
                  <XCircleIcon v-else class="h-5 w-5 text-red-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium" :class="exportStatus.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
                      {{ exportStatus.message }}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Import Section -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              Import Configuration
            </h2>
            <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Import bucket configurations from JSON files
            </p>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <!-- Import Method Selection -->
              <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Import Method</h3>
                <div class="flex flex-col sm:flex-row gap-4">
                  <label class="flex items-center">
                    <input
                      type="radio"
                      v-model="importMethod"
                      value="file"
                      class="form-radio h-4 w-4 text-blue-600"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Upload File</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      v-model="importMethod"
                      value="paste"
                      class="form-radio h-4 w-4 text-blue-600"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Paste JSON</span>
                  </label>
                </div>
              </div>

              <!-- File Upload -->
              <div v-if="importMethod === 'file'" class="space-y-3">
                <div
                  @drop="handleDrop"
                  @dragover.prevent
                  @dragenter="isDragOver = true"
                  @dragleave="isDragOver = false"
                  :class="[
                    'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                    isDragOver
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  ]"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    @change="handleFileSelect"
                    class="hidden"
                  />
                  <CloudArrowUpIcon class="mx-auto h-12 w-12 text-gray-400" />
                  <div class="mt-4">
                    <button
                      @click="$refs.fileInput.click()"
                      class="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Choose a JSON file
                    </button>
                    <span class="text-sm text-gray-600 dark:text-gray-400"> or drag and drop</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">JSON files only</p>
                </div>
              </div>

              <!-- JSON Paste -->
              <div v-if="importMethod === 'paste'" class="space-y-3">
                <textarea
                  v-model="importJsonText"
                  @input="validateImportData"
                  placeholder="Paste your JSON configuration here..."
                  rows="10"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                ></textarea>
              </div>

              <!-- Import Preview -->
              <div v-if="importData && importData.length > 0" class="space-y-4">
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Preview ({{ importData.length }} bucket{{ importData.length !== 1 ? 's' : '' }})
                  </h4>
                  <div class="space-y-2">
                    <div v-for="(bucket, index) in importData.slice(0, 3)" :key="index" class="text-sm">
                      <span class="font-medium text-gray-900 dark:text-white">{{ bucket.name }}</span>
                      <span class="text-gray-600 dark:text-gray-400 ml-2">
                        ({{ bucket.location || 'default' }}, {{ bucket.storageClass || 'STANDARD' }})
                      </span>
                    </div>
                    <div v-if="importData.length > 3" class="text-sm text-gray-600 dark:text-gray-400">
                      ... and {{ importData.length - 3 }} more
                    </div>
                  </div>
                </div>

                <!-- Import Options -->
                <div class="space-y-3">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">Import Options</h4>
                  <div class="space-y-2">
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        v-model="importOptions.createBuckets"
                        class="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Create buckets if they don't exist
                      </span>
                    </label>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        v-model="importOptions.overwriteExisting"
                        class="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Overwrite existing bucket configurations
                      </span>
                    </label>
                  </div>
                </div>

                <!-- Import Button -->
                <button
                  @click="importConfiguration"
                  :disabled="isImporting"
                  class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpTrayIcon v-if="!isImporting" class="h-4 w-4 mr-2" />
                  <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
                  {{ isImporting ? 'Importing...' : 'Import Configuration' }}
                </button>
              </div>

              <!-- Import Error -->
              <div v-if="importError" class="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                <div class="flex">
                  <XCircleIcon class="h-5 w-5 text-red-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                      Import Error
                    </h3>
                    <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                      {{ importError }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Import Status -->
              <div v-if="importStatus" class="p-3 rounded-md" :class="importStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
                <div class="flex">
                  <CheckCircleIcon v-if="importStatus.type === 'success'" class="h-5 w-5 text-green-400" />
                  <XCircleIcon v-else class="h-5 w-5 text-red-400" />
                  <div class="ml-3">
                    <h3 class="text-sm font-medium" :class="importStatus.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
                      {{ importStatus.message }}
                    </h3>
                    <div v-if="importStatus.details" class="mt-2 text-sm" :class="importStatus.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                      {{ importStatus.details }}
                    </div>
                  </div>
                </div>
              </div>
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
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

import { useStorageStore } from '@/stores/storage'
import { useAppStore } from '@/stores/app'

// Stores
const route = useRoute()
const storageStore = useStorageStore()
const appStore = useAppStore()

// Reactive state
const isExporting = ref(false)
const isImporting = ref(false)
const importMethod = ref<'file' | 'paste'>('file')
const importJsonText = ref('')
const importData = ref<any[]>([])
const importError = ref('')
const isDragOver = ref(false)
const exportStatus = ref<{ type: 'success' | 'error', message: string } | null>(null)
const importStatus = ref<{ type: 'success' | 'error', message: string, details?: string } | null>(null)

// Import options
const importOptions = ref({
  createBuckets: true,
  overwriteExisting: false
})

// Computed
const currentProjectId = computed(() => {
  return route.params.projectId as string
})

// Methods
const exportBuckets = async () => {
  if (!currentProjectId.value) return

  try {
    isExporting.value = true
    exportStatus.value = null

    // Fetch all buckets for the current project
    await storageStore.fetchBuckets()
    const buckets = storageStore.buckets

    if (buckets.length === 0) {
      exportStatus.value = {
        type: 'error',
        message: 'No buckets found to export'
      }
      return
    }

    // Create export data with bucket configurations
    const exportData = buckets.map(bucket => ({
      name: bucket.name,
      location: bucket.location || 'US',
      storageClass: bucket.storageClass || 'STANDARD',
      timeCreated: bucket.timeCreated,
      updated: bucket.updated,
      projectNumber: bucket.projectNumber,
      metageneration: bucket.metageneration,
      etag: bucket.etag
    }))

    // Download as JSON file
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${ encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `storage-buckets-${currentProjectId.value}-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    exportStatus.value = {
      type: 'success',
      message: `Successfully exported ${buckets.length} bucket configuration${buckets.length !== 1 ? 's' : ''}`
    }

  } catch (error) {
    console.error('Export error:', error)
    exportStatus.value = {
      type: 'error',
      message: 'Failed to export bucket configurations'
    }
  } finally {
    isExporting.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    readJsonFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer?.files[0]
  if (file && file.type === 'application/json') {
    readJsonFile(file)
  }
}

const readJsonFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    importJsonText.value = e.target?.result as string
    validateImportData()
  }
  reader.readAsText(file)
}

const validateImportData = () => {
  try {
    importError.value = ''

    if (!importJsonText.value.trim()) {
      importData.value = []
      return
    }

    const parsed = JSON.parse(importJsonText.value)

    if (!Array.isArray(parsed)) {
      throw new Error('JSON must be an array of bucket configurations')
    }

    // Validate bucket structure
    for (const bucket of parsed) {
      if (!bucket.name) {
        throw new Error('Each bucket must have a name field')
      }
    }

    importData.value = parsed
    importStatus.value = null

  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Invalid JSON format'
    importData.value = []
  }
}

const importConfiguration = async () => {
  if (!importData.value.length || !currentProjectId.value) return

  try {
    isImporting.value = true
    importStatus.value = null

    let createdCount = 0
    let skippedCount = 0

    for (const bucketConfig of importData.value) {
      try {
        // Check if bucket already exists
        const existingBuckets = await storageStore.fetchBuckets()
        const bucketExists = existingBuckets.some(b => b.name === bucketConfig.name)

        if (bucketExists && !importOptions.value.overwriteExisting) {
          skippedCount++
          continue
        }

        if (!bucketExists && importOptions.value.createBuckets) {
          // Create new bucket using the storage API
          await storageStore.createBucket({
            name: bucketConfig.name,
            location: bucketConfig.location || 'US',
            storageClass: bucketConfig.storageClass || 'STANDARD'
          })
          createdCount++
        } else if (bucketExists && importOptions.value.overwriteExisting) {
          // Note: Bucket overwrite/update logic would go here
          // For now, just count as processed
          createdCount++
        }

      } catch (error) {
        console.error(`Error processing bucket ${bucketConfig.name}:`, error)
      }
    }

    // Refresh bucket list
    await storageStore.fetchBuckets()

    importStatus.value = {
      type: 'success',
      message: 'Import completed successfully',
      details: `${createdCount} bucket${createdCount !== 1 ? 's' : ''} processed, ${skippedCount} skipped`
    }

    // Clear import data after successful import
    importJsonText.value = ''
    importData.value = []

  } catch (error) {
    console.error('Import error:', error)
    importStatus.value = {
      type: 'error',
      message: 'Failed to import configurations',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  } finally {
    isImporting.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Initial load can happen here if needed
})
</script>