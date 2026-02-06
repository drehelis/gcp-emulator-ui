<template>
  <div class="space-y-6">
    <!-- Import Method Selection -->
    <div>
      <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Import Method
      </label>
      <div class="space-y-2">
        <div class="flex items-center">
          <input
            id="import-file"
            v-model="importMode"
            value="file"
            type="radio"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
          />
          <label
            for="import-file"
            class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
          >
            Upload File
          </label>
        </div>
        <div class="flex items-center">
          <input
            id="import-paste"
            v-model="importMode"
            value="paste"
            type="radio"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
          />
          <label
            for="import-paste"
            class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
          >
            Paste JSON
          </label>
        </div>
      </div>
    </div>

    <!-- File Upload Mode -->
    <div v-if="importMode === 'file'">
      <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select {{ getFileTypeLabel() }} File
      </label>
      <div
        class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors"
        :class="
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        "
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
      >
        <div class="space-y-1 text-center">
          <DocumentIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <div class="flex text-sm text-gray-600 dark:text-gray-400">
            <label
              for="file-upload"
              class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleFileUpload"
                class="sr-only"
              />
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">JSON files only</p>
        </div>
      </div>
    </div>

    <!-- JSON Paste Mode -->
    <div v-if="importMode === 'paste'">
      <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Paste JSON {{ getFileTypeLabel() }}
      </label>
      <div class="space-y-3">
        <textarea
          v-model="jsonText"
          @input="handleJsonPaste"
          :placeholder="getPlaceholderText()"
          rows="10"
          :class="[
            'w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none dark:bg-gray-700 dark:text-white text-sm font-mono json-textarea',
            jsonError
              ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500',
          ]"
        />

        <!-- Error message -->
        <div v-if="jsonError" class="text-sm text-red-600 dark:text-red-400 mt-1">
          {{ jsonError }}
        </div>

        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ getHelpText() }}
          </p>
          <button
            v-if="jsonText"
            @click="clearJsonText"
            class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Import Preview -->
    <div v-if="importPreview" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <DocumentIcon v-if="importMode === 'file'" class="h-5 w-5 text-gray-400 mr-2" />
          <span
            v-if="importMode === 'file'"
            class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
          >
            {{ importFile?.name }}
          </span>
          <span v-if="importMode === 'file'" class="ml-2 text-xs text-gray-500 dark:text-gray-400">
            ({{ importFile ? formatFileSize(importFile.size) : '' }})
          </span>
          <span
            v-if="importMode === 'paste'"
            class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
          >
            📋 Pasted JSON {{ getFileTypeLabel() }}
          </span>
        </div>
        <button
          @click="clearImportData"
          class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-2">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Preview: {{ importPreview.length }} {{ getPreviewLabel()
          }}{{ importPreview.length === 1 ? '' : 's' }}
        </div>
        <div class="bg-white dark:bg-gray-800 rounded border p-3 max-h-40 overflow-y-auto">
          <pre class="text-xs text-gray-700 dark:text-gray-300">{{
            JSON.stringify(importPreview.slice(0, 3), null, 2)
          }}</pre>
          <div
            v-if="importPreview.length > 3"
            class="text-xs text-gray-500 dark:text-gray-400 mt-2"
          >
            ... and {{ importPreview.length - 3 }} more {{ getPreviewLabel()
            }}{{ importPreview.length - 3 === 1 ? '' : 's' }}
          </div>
        </div>
      </div>

      <!-- Import Options -->
      <div class="mt-4 space-y-3">
        <div
          v-if="
            importType === 'config' ||
            importType === 'storage' ||
            importType === 'firestore' ||
            importType === 'datastore'
          "
        >
          <div class="flex items-center" v-if="importType === 'config'">
            <input
              id="create-topics"
              v-model="importOptions.createTopics"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
            />
            <label
              for="create-topics"
              class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
            >
              Create topics if they don't exist
            </label>
          </div>
          <div class="flex items-center" v-if="importType === 'config'">
            <input
              id="create-subscriptions"
              v-model="importOptions.createSubscriptions"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
            />
            <label
              for="create-subscriptions"
              class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
            >
              Create subscriptions if they don't exist
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="overwrite-existing"
              v-model="importOptions.overwriteExisting"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
            />
            <label
              for="overwrite-existing"
              class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
            >
              {{
                importType === 'storage'
                  ? 'Overwrite existing buckets'
                  : importType === 'firestore'
                    ? 'Overwrite existing documents'
                    : importType === 'datastore'
                      ? 'Overwrite existing entities'
                      : 'Overwrite existing configurations'
              }}
            </label>
          </div>
        </div>
        <div v-if="importType === 'templates'">
          <div class="flex items-center">
            <input
              id="overwrite-templates"
              v-model="importOptions.overwriteTemplates"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
            />
            <label
              for="overwrite-templates"
              class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
            >
              Overwrite existing templates with same name
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="preserve-ids"
              v-model="importOptions.preserveTemplateIds"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
            />
            <label
              for="preserve-ids"
              class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white"
            >
              Preserve template IDs (may cause conflicts)
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Button -->
    <div v-if="importPreview" class="pt-4">
      <button
        @click="handleImport"
        :disabled="isImporting || !importPreview || !isValidImportOptions"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowUpTrayIcon v-if="!isImporting" class="h-4 w-4 mr-2" />
        <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
        {{ isImporting ? 'Importing...' : `Import ${getImportButtonLabel()}` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowUpTrayIcon, ArrowPathIcon, DocumentIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  importType: string
  isImporting: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  import: [data: { importData: any[]; options: any }]
}>()

// Component state
const importMode = ref<'file' | 'paste'>('file')
const jsonText = ref('')
const jsonError = ref<string | null>(null)
const isDragOver = ref(false)
const importFile = ref<File | null>(null)
const importPreview = ref<any[] | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const importOptions = ref({
  createTopics: true,
  createSubscriptions: true,
  overwriteExisting: false,
  overwriteTemplates: false,
  preserveTemplateIds: false,
})

// Computed properties
const isValidImportOptions = computed(() => {
  if (props.importType === 'config') {
    return importOptions.value.createTopics || importOptions.value.createSubscriptions
  }
  return true
})

// Helper methods for different import types
const getFileTypeLabel = () => {
  switch (props.importType) {
    case 'config':
      return 'Configuration'
    case 'templates':
      return 'Template'
    case 'storage':
      return 'Bucket Configuration'
    case 'firestore':
      return 'Firestore Collections'
    case 'datastore':
      return 'Datastore Entities'
    default:
      return 'Configuration'
  }
}

const getPlaceholderText = () => {
  switch (props.importType) {
    case 'config':
      return 'Paste your JSON configuration here...'
    case 'templates':
      return 'Paste your JSON templates here...'
    case 'storage':
      return 'Paste your JSON bucket configurations here...'
    case 'firestore':
      return 'Paste your JSON collections and documents here...'
    case 'datastore':
      return 'Paste your JSON kinds and entities here...'
    default:
      return 'Paste your JSON data here...'
  }
}

const getHelpText = () => {
  switch (props.importType) {
    case 'config':
      return 'Paste your JSON array of topic and subscription configurations'
    case 'templates':
      return 'Paste your JSON array of message templates'
    case 'storage':
      return 'Paste your JSON array of bucket configurations'
    case 'firestore':
      return 'Paste your JSON array of Firestore collections with documents'
    case 'datastore':
      return 'Paste your JSON export of Datastore kinds with entities'
    default:
      return 'Paste your JSON data'
  }
}

const getPreviewLabel = () => {
  switch (props.importType) {
    case 'templates':
      return 'template'
    case 'storage':
      return 'bucket configuration'
    case 'firestore':
      return 'collection'
    case 'datastore':
      return 'kind'
    default:
      return 'configuration'
  }
}

const getImportButtonLabel = () => {
  switch (props.importType) {
    case 'templates':
      return 'Templates'
    case 'storage':
      return 'Bucket Configurations'
    case 'firestore':
      return 'Collections'
    case 'datastore':
      return 'Entities'
    default:
      return 'Configuration'
  }
}

// File processing methods
const processFile = async (file: File) => {
  if (!file.name.endsWith('.json')) {
    return Promise.reject(new Error('Please select a JSON file'))
  }

  importFile.value = file

  try {
    const content = await readFileContent(file)
    const parsed = JSON.parse(content)

    // Handle both array and single object cases
    let configurations: any[]
    if (Array.isArray(parsed)) {
      configurations = parsed
    } else {
      configurations = [parsed]
    }

    // Validate structure based on import type
    validateImportData(configurations)
    importPreview.value = configurations
  } catch (error) {
    console.error('Failed to parse file:', error)
    clearImportFile()
    throw error
  }
}

const validateImportData = (configurations: any[]) => {
  switch (props.importType) {
    case 'config':
      for (const item of configurations) {
        if (!item.topic_name || !item.sub_name) {
          throw new Error('Each configuration must have topic_name and sub_name')
        }
      }
      break
    case 'templates':
      for (const item of configurations) {
        if (!item.name || !item.projectId || !item.topicName || !item.data) {
          throw new Error('Each template must have name, projectId, topicName, and data fields')
        }
      }
      break
    case 'storage':
      for (const item of configurations) {
        if (!item.name) {
          throw new Error('Each bucket configuration must have a name field')
        }
      }
      break
    case 'firestore':
      for (const item of configurations) {
        if (!item.collectionId || !item.documents) {
          throw new Error('Each collection must have collectionId and documents fields')
        }
      }
      break
    case 'datastore':
      // Support both array of kinds format and full export format
      if (configurations.length === 1 && configurations[0].version && configurations[0].kinds) {
        // Full export format - unwrap it for preview
        if (!Array.isArray(configurations[0].kinds)) {
          throw new Error('Export data must contain kinds array')
        }
      } else {
        // Array of kinds format
        for (const item of configurations) {
          if (!item.kind || !item.entities) {
            throw new Error('Each kind must have kind and entities fields')
          }
        }
      }
      break
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    await processFile(file)
  } catch (error) {
    console.error('File upload error:', error)
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// Drag and drop handlers
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

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  try {
    await processFile(file)
  } catch (error) {
    console.error('Drop error:', error)
  }
}

const handleJsonPaste = async () => {
  if (!jsonText.value.trim()) {
    jsonError.value = null
    importPreview.value = null
    return
  }

  try {
    const parsedData = JSON.parse(jsonText.value)

    // Ensure importPreview is always an array for consistent handling
    let configurations: any[]
    if (Array.isArray(parsedData)) {
      configurations = parsedData
    } else {
      configurations = [parsedData]
    }

    // Validate structure based on import type
    validateImportData(configurations)
    importPreview.value = configurations
    jsonError.value = null
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : 'Invalid JSON format'
    importPreview.value = null
  }
}

// Clear methods
const clearJsonText = () => {
  jsonText.value = ''
  jsonError.value = null
  importPreview.value = null
}

const clearImportFile = () => {
  importFile.value = null
  importPreview.value = null
  isDragOver.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const clearImportData = () => {
  importFile.value = null
  jsonText.value = ''
  jsonError.value = null
  importPreview.value = null
  isDragOver.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Import handler
const handleImport = () => {
  if (importPreview.value) {
    emit('import', {
      importData: importPreview.value,
      options: importOptions.value,
    })
  }
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Watch for import type changes
watch(
  () => props.importType,
  () => {
    clearImportData()
  }
)
</script>

<style scoped>
.json-textarea {
  caret-color: auto !important;
}

.json-textarea:focus {
  caret-color: #3b82f6 !important; /* Blue cursor on focus */
}
</style>
