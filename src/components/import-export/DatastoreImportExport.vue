<template>
  <div class="space-y-6">
    <!-- Export Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Export Datastore Entities
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Export entities to a directory on the emulator host
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <!-- Current Selection Info -->
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Selection</h4>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Namespace:</strong> {{ currentNamespace || '(default)' }}</p>
              <p><strong>Database:</strong> {{ currentDatabase || '(default)' }}</p>
              <p><strong>Kinds:</strong> {{ kindsCount }} kind{{ kindsCount === 1 ? '' : 's' }}</p>
            </div>
          </div>

          <!-- Export Directory Input -->
          <div>
            <label for="export-directory" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Directory Path
            </label>
            <input
              id="export-directory"
              v-model="exportDirectory"
              type="text"
              placeholder="/tmp/datastore-export"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Absolute path on the emulator host where export files will be created
            </p>
          </div>

          <!-- Export Button -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="handleExportEntities"
              :disabled="isExporting || !exportDirectory.trim() || kindsCount === 0"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExporting" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExporting ? 'Exporting...' : 'Export Entities' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Import Datastore Entities
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Import entities from a previously exported directory on the emulator host
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-6">
          <!-- File Upload Section -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Import Folder
            </label>

            <!-- Drag & Drop Area -->
            <div
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
              class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors"
              :class="isDragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
            >
              <div class="space-y-1 text-center">
                <FolderOpenIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div class="flex text-sm text-gray-600 dark:text-gray-400">
                  <label for="folder-upload" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Select folder</span>
                    <input
                      id="folder-upload"
                      ref="folderInput"
                      type="file"
                      webkitdirectory
                      directory
                      multiple
                      @change="handleFolderSelect"
                      class="sr-only"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Select the folder containing overall_export_metadata
                </p>
              </div>
            </div>
          </div>

          <!-- Selected Files Preview -->
          <div v-if="selectedFiles.length > 0" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <FolderIcon class="h-5 w-5 text-gray-400 mr-2" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ selectedFolderName }}
                </span>
              </div>
              <button
                @click="clearSelection"
                class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-4">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Files:</strong> {{ selectedFiles.length }}</p>
                <p v-if="metadataFile"><strong>Metadata:</strong> {{ metadataFile.name }}</p>
                <p v-if="metadataFilePath"><strong>Path:</strong> <code class="text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">{{ metadataFilePath }}</code></p>
              </div>

              <!-- Info Message -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Important
                    </h3>
                    <div class="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      <p>The selected folder path must be accessible to the emulator container. Mount it using Docker volumes:</p>
                      <code class="block mt-2 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs overflow-x-auto">
                        docker run -v {{ importDirectory }}/:{{ importDirectory }}/ ...
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Import Button -->
          <div class="pt-4">
            <button
              @click="handleImportEntities"
              :disabled="isImporting || !metadataFilePath.trim()"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpTrayIcon v-if="!isImporting" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isImporting ? 'Importing...' : 'Import Entities' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  FolderOpenIcon,
  FolderIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useDatastoreImportExport } from '@/composables/useDatastoreImportExport'
import { useDatastoreStore } from '@/stores/datastore'
import { useServiceConnections } from '@/composables/useServiceConnections'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  projectId: string
}>()

const appStore = useAppStore()
const datastoreStore = useDatastoreStore()
const { checkDatastoreConnection } = useServiceConnections()
const {
  isExporting,
  isImporting,
  loadData,
  exportEntities,
  importEntities
} = useDatastoreImportExport()

// Form state
const exportDirectory = ref('/tmp/datastore-export')
const importDirectory = ref('')
const metadataFilePath = ref('')

// File upload state
const isDragOver = ref(false)
const selectedFiles = ref<File[]>([])
const metadataFile = ref<File | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)

// Computed properties
const currentNamespace = computed(() => datastoreStore.getCurrentNamespace())
const currentDatabase = computed(() => datastoreStore.getCurrentDatabase())
const kindsCount = computed(() => datastoreStore.kinds.length)

const selectedFolderName = computed(() => {
  if (selectedFiles.value.length === 0) return ''
  // Extract folder name from the first file's path
  const firstFile = selectedFiles.value[0]
  const pathParts = firstFile.webkitRelativePath.split('/')
  return pathParts[0] || 'Selected folder'
})

// File handling methods
const handleFolderSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  processFiles(Array.from(files))
}

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false

  const items = e.dataTransfer?.items
  if (!items) return

  const files: File[] = []

  // Process dropped items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        files.push(file)
      }
    }
  }

  if (files.length > 0) {
    processFiles(files)
  }
}

const processFiles = (files: File[]) => {
  selectedFiles.value = files

  // Look for metadata files (can be overall_export_metadata or *.overall_export_metadata)
  const metadata = files.find(f =>
    f.name === 'overall_export_metadata' ||
    f.name.endsWith('.overall_export_metadata')
  )
  metadataFile.value = metadata || null

  if (!metadata) {
    appStore.showToast({
      type: 'warning',
      title: 'Metadata file not found',
      message: 'Could not find export metadata file in the selected folder'
    })
    return
  }

  // Extract the directory and metadata file path
  if (metadata.webkitRelativePath) {
    const relativePath = metadata.webkitRelativePath
    const pathParts = relativePath.split('/')

    // Get the folder name (first part of the path)
    const folderName = pathParts[0]

    // Build the directory path and full metadata file path
    importDirectory.value = `/tmp/${folderName}`
    metadataFilePath.value = `/tmp/${relativePath}`

    appStore.showToast({
      type: 'info',
      title: 'Folder selected',
      message: `Found ${files.length} files. Ready to import.`
    })
  } else {
    // If webkitRelativePath is not available
    appStore.showToast({
      type: 'warning',
      title: 'Files selected',
      message: `Cannot determine file paths. Please enter the metadata file path manually.`
    })
  }
}

const clearSelection = () => {
  selectedFiles.value = []
  metadataFile.value = null
  importDirectory.value = ''
  metadataFilePath.value = ''
  if (folderInput.value) {
    folderInput.value.value = ''
  }
}

const handleExportEntities = async () => {
  if (!exportDirectory.value.trim()) return
  await exportEntities(props.projectId, exportDirectory.value.trim())
}

const handleImportEntities = async () => {
  if (!metadataFilePath.value.trim()) return
  await importEntities(props.projectId, metadataFilePath.value.trim())
}

onMounted(async () => {
  const isConnected = await checkDatastoreConnection()
  if (isConnected) {
    await loadData(props.projectId)
  }
})
</script>
