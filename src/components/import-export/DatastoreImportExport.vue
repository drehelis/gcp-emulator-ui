<template>
  <div class="space-y-6">
    <!-- Export Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Export Datastore Entities
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Export entities and download via file server
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <!-- Export Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="handleExportEntities"
              :disabled="isExporting"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExporting" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExporting ? 'Exporting...' : 'Export Files' }}
            </button>
            <button
              @click="handleExportAsJson"
              :disabled="isExportingJson"
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExportingJson" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExportingJson ? 'Exporting...' : 'Export as JSON' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Import from Directory
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
              :class="
                isDragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              "
            >
              <div class="space-y-1 text-center">
                <FolderOpenIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div class="flex justify-center text-sm text-gray-600 dark:text-gray-400">
                  <label
                    for="folder-upload"
                    class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
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
          <div
            v-if="selectedFiles.length > 0"
            class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
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
              </div>

              <!-- Info Message -->
              <div
                class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3"
              >
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3 flex-1">
                    <p class="text-sm text-green-700 dark:text-green-300">
                      Files will be uploaded to the emulator and imported automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Import Button -->
          <div class="pt-4">
            <button
              @click="handleImportEntities"
              :disabled="isImporting || selectedFiles.length === 0"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpTrayIcon v-if="!isImporting && !isUploading" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isUploading ? 'Uploading...' : isImporting ? 'Importing...' : 'Upload & Import' }}
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
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useDatastoreImportExport } from '@/composables/useDatastoreImportExport'
import { useServiceConnections } from '@/composables/useServiceConnections'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  projectId: string
}>()

const appStore = useAppStore()
const { checkDatastoreConnection } = useServiceConnections()
const {
  isExporting,
  isExportingJson,
  isImporting,
  isUploading,
  loadData,
  exportEntities,
  exportEntitiesAsJson,
  importEntities,
} = useDatastoreImportExport()

// File upload state
const isDragOver = ref(false)
const selectedFiles = ref<File[]>([])
const metadataFile = ref<File | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)

// Computed properties
const selectedFolderName = computed(() => {
  if (selectedFiles.value.length === 0) return ''
  // Extract folder name from the first file's path
  const firstFile = selectedFiles.value[0]
  if (!firstFile) return 'Selected folder'
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

  // Process dropped items - handle both files and directories
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue

    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry()
      if (entry) {
        if (entry.isDirectory) {
          // Read all files from the directory recursively
          await readDirectory(entry as any, files, entry.name)
        } else {
          const file = item.getAsFile()
          if (file) {
            files.push(file)
          }
        }
      }
    }
  }

  if (files.length > 0) {
    processFiles(files)
  }
}

// Helper function to recursively read directory contents
const readDirectory = async (dirEntry: any, files: File[], path = '') => {
  const dirReader = dirEntry.createReader()

  return new Promise<void>(resolve => {
    const readEntries = () => {
      dirReader.readEntries(async (entries: any[]) => {
        if (entries.length === 0) {
          resolve()
          return
        }

        for (const entry of entries) {
          if (entry.isFile) {
            const file = await new Promise<File>(resolveFile => {
              entry.file((f: File) => {
                // Create a new File object with the full path
                const newFile = new File([f], f.name, { type: f.type })
                // Add webkitRelativePath property
                Object.defineProperty(newFile, 'webkitRelativePath', {
                  value: path ? `${path}/${f.name}` : f.name,
                  writable: false,
                })
                resolveFile(newFile)
              })
            })
            files.push(file)
          } else if (entry.isDirectory) {
            const subPath = path ? `${path}/${entry.name}` : entry.name
            await readDirectory(entry, files, subPath)
          }
        }

        // Continue reading (directories may have more entries than batch size)
        readEntries()
      })
    }

    readEntries()
  })
}

const processFiles = (files: File[]) => {
  selectedFiles.value = files

  // Look for metadata files (can be overall_export_metadata or *.overall_export_metadata)
  const metadata = files.find(
    f => f.name === 'overall_export_metadata' || f.name.endsWith('.overall_export_metadata')
  )
  metadataFile.value = metadata || null

  if (!metadata) {
    appStore.showToast({
      type: 'warning',
      title: 'Metadata file not found',
      message: 'Could not find export metadata file in the selected folder',
    })
    return
  }
}

const clearSelection = () => {
  selectedFiles.value = []
  metadataFile.value = null
  if (folderInput.value) {
    folderInput.value.value = ''
  }
}

const handleExportEntities = async () => {
  await exportEntities(props.projectId)
}

const handleExportAsJson = async () => {
  // Don't pass namespace to export ALL namespaces
  await exportEntitiesAsJson(props.projectId)
}

const handleImportEntities = async () => {
  if (selectedFiles.value.length === 0) return
  await importEntities(props.projectId, selectedFiles.value, metadataFile.value)
}

onMounted(async () => {
  const isConnected = await checkDatastoreConnection()
  if (isConnected) {
    await loadData(props.projectId)
  }
})
</script>
