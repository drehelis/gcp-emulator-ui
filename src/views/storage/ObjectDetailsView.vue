<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets/${encodeURIComponent(bucketName)}`"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeftIcon class="w-5 h-5" />
              </router-link>
              
              <div>
                <div class="flex items-center space-x-2">
                  <DocumentIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ objectName }}
                  </h1>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  in {{ bucketName }}
                </p>
              </div>
            </div>
            
            <!-- Action buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="downloadObject"
                :disabled="storageStore.loading.download"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600 dark:text-blue-400">
          <ArrowPathIcon class="animate-spin -ml-1 mr-3 h-5 w-5" />
          Loading object details...
        </div>
      </div>

      <!-- Object Details -->
      <div v-else-if="objectData" class="space-y-6">
        <!-- Object Info Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Object Information
          </h2>
          
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ objectData.name }}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Size</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatFileSize(parseInt(objectData.size || '0')) }}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Content Type</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ objectData.contentType || 'Unknown' }}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Class</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ objectData.storageClass || 'STANDARD' }}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(objectData.timeCreated) }}</dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Modified</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(objectData.updated) }}</dd>
            </div>
          </div>
        </div>

        <!-- Preview Card -->
        <div v-if="canPreview" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Preview
            </h2>
            <button
              v-if="isTextFile && !isEditing"
              @click="startEditing"
              class="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              title="Edit file"
            >
              <PencilSquareIcon class="w-4 h-4" />
            </button>
          </div>
          
          <div class="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <!-- Image Preview -->
            <img
              v-if="objectData.contentType?.startsWith('image/')"
              :src="previewUrl"
              :alt="objectData.name"
              class="max-w-full max-h-96 object-contain rounded-lg"
              @error="previewError = true"
            />
            <!-- Video Preview -->
            <video
              v-else-if="objectData.contentType?.startsWith('video/')"
              :src="previewUrl"
              controls
              preload="metadata"
              class="max-w-full max-h-96 rounded-lg"
              @error="previewError = true"
            >
              Your browser does not support the video tag.
            </video>
            <!-- PDF Preview -->
            <iframe
              v-else-if="objectData.contentType === 'application/pdf'"
              :src="previewUrl"
              class="w-full h-96 rounded-lg border-0"
              @error="previewError = true"
            >
              <p>Your browser does not support PDF preview. <a :href="previewUrl" target="_blank" class="text-blue-600 hover:text-blue-700">Download the PDF</a> to view it.</p>
            </iframe>
            <!-- Text File Preview/Editor -->
            <div v-else-if="isTextFile" class="w-full">
              <!-- Read-only view -->
              <div v-if="!isEditing" class="relative">
                <pre class="w-full h-96 p-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto font-mono whitespace-pre-wrap">{{ fileContent }}</pre>
              </div>
              <!-- Editor view -->
              <div v-else>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Editing: {{ objectData.name }}
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      @click="cancelEditing"
                      :disabled="isSaving"
                      class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      @click="saveTextContent"
                      :disabled="isSaving"
                      class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                      <ArrowPathIcon v-if="isSaving" class="animate-spin w-3 h-3 mr-1" />
                      {{ isSaving ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
                <textarea
                  v-model="editContent"
                  class="w-full h-96 p-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :placeholder="`Edit ${objectData.name} content here...`"
                  spellcheck="false"
                ></textarea>
              </div>
            </div>
            <!-- Error State -->
            <div v-else-if="previewError" class="text-center text-gray-500 dark:text-gray-400">
              <DocumentIcon class="w-12 h-12 mx-auto mb-2" />
              <p>Preview not available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Object Not Found
          </h3>
          <p class="text-red-700 dark:text-red-300">
            The requested object could not be found or loaded.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import storageApi from '@/api/storage'
import type { StorageObject } from '@/types'

const route = useRoute()
const storageStore = useStorageStore()
const projectsStore = useProjectsStore()
const appStore = useAppStore()

// Local state
const objectData = ref<StorageObject | null>(null)
const loading = ref(false)
const previewError = ref(false)
const fileContent = ref('')
const isEditing = ref(false)
const isSaving = ref(false)
const editContent = ref('')

// Props from route
const bucketName = computed(() => route.params.bucketName as string)
const objectName = computed(() => {
  const path = route.params.objectPath
  return Array.isArray(path) ? path.join('/') : (path as string || '')
})
const currentProjectId = computed(() => route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown')

// Computed
const isTextFile = computed(() => {
  const contentType = objectData.value?.contentType
  const fileName = objectData.value?.name

  // Check by content type
  if (contentType?.startsWith('text/')) return true
  if (contentType === 'application/json') return true
  if (contentType === 'application/xml') return true
  if (contentType === 'application/yaml') return true
  if (contentType === 'application/x-yaml') return true

  // Check by file extension
  if (!fileName) return false
  const ext = fileName.split('.').pop()?.toLowerCase()
  const textExtensions = ['txt', 'json', 'xml', 'yaml', 'yml', 'md', 'js', 'ts', 'css', 'html', 'csv', 'log', 'env', 'ini', 'conf', 'config']
  return textExtensions.includes(ext || '')
})

const canPreview = computed(() => {
  const contentType = objectData.value?.contentType
  return contentType?.startsWith('image/') ||
         contentType?.startsWith('video/') ||
         contentType === 'application/pdf' ||
         isTextFile.value
})

const previewUrl = computed(() => {
  if (!objectData.value) return ''
  return storageApi.getObjectPreviewUrl(bucketName.value, objectData.value.name)
})

// Methods
async function loadObject(): Promise<void> {
  if (!bucketName.value || !objectName.value) return

  try {
    loading.value = true
    objectData.value = await storageApi.getObject(bucketName.value, objectName.value)

    // Load text content for text files
    if (objectData.value && isTextFile.value) {
      await loadTextContent()
    }
  } catch (error) {
    console.error('Error loading object:', error)
    objectData.value = null
  } finally {
    loading.value = false
  }
}

async function loadTextContent(): Promise<void> {
  if (!objectData.value) return

  try {
    const response = await fetch(previewUrl.value)
    if (response.ok) {
      fileContent.value = await response.text()
      editContent.value = fileContent.value
    } else {
      previewError.value = true
      appStore.showToast({
        type: 'error',
        title: 'Load Failed',
        message: `Failed to load file content (${response.status})`
      })
    }
  } catch (error: any) {
    console.error('Error loading text content:', error)
    previewError.value = true
    appStore.showToast({
      type: 'error',
      title: 'Load Failed',
      message: error.message || 'Failed to load file content'
    })
  }
}

async function downloadObject(): Promise<void> {
  if (!objectData.value) return
  await storageStore.downloadObject(bucketName.value, objectData.value.name)
}

function startEditing(): void {
  isEditing.value = true
  editContent.value = fileContent.value
}

function cancelEditing(): void {
  isEditing.value = false
  editContent.value = fileContent.value
}

async function saveTextContent(): Promise<void> {
  if (!objectData.value) return

  try {
    isSaving.value = true

    // Create a file with the edited content
    const blob = new Blob([editContent.value], {
      type: objectData.value.contentType || 'text/plain'
    })

    // Convert blob to File object
    const file = new File([blob], objectData.value.name, {
      type: objectData.value.contentType || 'text/plain'
    })

    // Upload the updated content
    await storageApi.uploadObject(file, {
      bucket: bucketName.value,
      name: objectData.value.name,
      contentType: objectData.value.contentType || 'text/plain'
    })

    // Update local content
    fileContent.value = editContent.value
    isEditing.value = false

    // Show success message
    appStore.showToast({
      type: 'success',
      title: 'File Saved',
      message: `Successfully updated ${objectData.value.name}`
    })
  } catch (error: any) {
    console.error('Error saving file:', error)

    // Show error message
    appStore.showToast({
      type: 'error',
      title: 'Save Failed',
      message: error.response?.data?.message || error.message || 'Failed to save file. Please try again.'
    })
  } finally {
    isSaving.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadObject()
})
</script>