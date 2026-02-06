<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 min-w-0 flex-1">
              <button
                @click="navigateBack"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <ArrowLeftIcon class="w-5 h-5" />
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <DocumentIcon class="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h1 class="text-sm sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {{ displayFileName }}
                  </h1>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-3 flex-shrink-0">
              <button
                @click="downloadObject"
                :disabled="storageStore.loading.download"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
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
    <div class="px-4 sm:px-6 lg:px-8 py-6">
      <!-- Breadcrumbs -->
      <nav v-if="objectBreadcrumbs.length > 0" class="mb-6" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <li>
            <button
              @click="navigateToPath('')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <HomeIcon class="w-4 h-4 translate-y-0.5" />
              <span class="sr-only">Home</span>
            </button>
          </li>
          <li
            v-for="(breadcrumb, index) in objectBreadcrumbs"
            :key="index"
            class="flex items-baseline"
          >
            <ChevronRightIcon class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
            <button
              v-if="!breadcrumb.isLast"
              @click="navigateToPath(breadcrumb.path)"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate transition-colors"
            >
              {{ breadcrumb.name }}
            </button>
            <span v-else class="text-gray-500 dark:text-gray-400 truncate">
              {{ breadcrumb.name }}
            </span>
          </li>
        </ol>
      </nav>
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600 dark:text-blue-400"
        >
          <ArrowPathIcon class="animate-spin -ml-1 mr-3 h-5 w-5" />
          Loading object details...
        </div>
      </div>

      <!-- Object Details -->
      <div v-else-if="objectData" class="space-y-6">
        <!-- Object Summary Card -->
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <!-- Key Information -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
              <!-- Mobile: Stack all elements vertically -->
              <div class="flex flex-col sm:hidden gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-xl font-bold text-blue-600 dark:text-blue-400">{{
                    formatFileSize(parseInt(objectData.size || '0'))
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                    objectData.contentType || 'Unknown'
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >{{ objectData.storageClass || 'STANDARD' }} class</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >Modified {{ formatDate(objectData.updated) }}</span
                  >
                </div>
              </div>

              <!-- Desktop: Horizontal layout -->
              <div class="hidden sm:flex sm:items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{
                    formatFileSize(parseInt(objectData.size || '0'))
                  }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">•</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                    objectData.contentType || 'Unknown'
                  }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span class="text-gray-500 dark:text-gray-400">•</span>
                  <span>{{ objectData.storageClass || 'STANDARD' }} class</span>
                  <span class="text-gray-500 dark:text-gray-400">•</span>
                  <span>Modified {{ formatDate(objectData.updated) }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                v-if="isTextFile && !isEditing"
                @click="startEditing"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="Edit file"
              >
                <PencilSquareIcon class="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        </div>

        <!-- Preview Card -->
        <div
          v-if="canPreview"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Preview</h2>

          <div class="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <!-- Image Preview -->
            <img
              v-if="objectData.contentType?.startsWith('image/')"
              :src="previewUrl"
              :alt="objectData.name"
              class="max-w-full max-h-[70vh] object-contain rounded-lg"
              @error="previewError = true"
            />
            <!-- Video Preview -->
            <video
              v-else-if="objectData.contentType?.startsWith('video/')"
              :src="previewUrl"
              controls
              preload="metadata"
              class="max-w-full max-h-[70vh] rounded-lg"
              @error="previewError = true"
            >
              Your browser does not support the video tag.
            </video>
            <!-- PDF Preview -->
            <div
              v-else-if="objectData.contentType === 'application/pdf'"
              class="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <iframe
                :src="pdfBlobUrl || previewUrl"
                class="w-full h-full border-0"
                @error="previewError = true"
              >
                Your browser does not support PDF preview.
              </iframe>
              <div
                v-if="previewError"
                class="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900"
              >
                <div class="text-center">
                  <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Your browser does not support PDF preview.
                  </p>
                  <a
                    :href="previewUrl"
                    target="_blank"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
            <!-- Text File Preview/Editor -->
            <div v-else-if="isTextFile" class="w-full">
              <!-- Read-only view -->
              <div v-if="!isEditing" class="relative">
                <pre
                  class="w-full h-[60vh] p-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto font-mono whitespace-pre-wrap"
                  >{{ fileContent }}</pre
                >
              </div>
              <!-- Editor view -->
              <div v-else>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Editing: {{ objectData.name }}
                    </span>
                    <div
                      v-if="validationError"
                      class="flex items-center text-red-600 dark:text-red-400"
                    >
                      <ExclamationTriangleIcon class="w-4 h-4 mr-1" />
                      <span class="text-xs">{{ validationError }}</span>
                    </div>
                    <div
                      v-else-if="isValidContent && editContent.trim()"
                      class="flex items-center text-green-600 dark:text-green-400"
                    >
                      <svg
                        class="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span class="text-xs">Valid {{ fileExtension.toUpperCase() }}</span>
                    </div>
                  </div>
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
                      :disabled="isSaving || !isValidContent"
                      class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                      :class="{ 'bg-gray-400 hover:bg-gray-400': !isValidContent }"
                    >
                      <ArrowPathIcon v-if="isSaving" class="animate-spin w-3 h-3 mr-1" />
                      {{ isSaving ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>

                <!-- Enhanced Editor with Line Numbers -->
                <div
                  class="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div class="flex h-[60vh]">
                    <!-- Line Numbers -->
                    <div
                      ref="lineNumbersRef"
                      class="bg-gray-100 dark:bg-gray-800 px-3 py-4 border-r border-gray-200 dark:border-gray-700 select-none overflow-hidden"
                    >
                      <div
                        class="text-xs font-mono text-gray-500 dark:text-gray-400 leading-5"
                        style="line-height: 1.25rem"
                      >
                        <div v-for="lineNum in lineCount" :key="lineNum" class="h-5 text-right">
                          {{ lineNum }}
                        </div>
                      </div>
                    </div>
                    <!-- Editor Area -->
                    <div class="flex-1 relative">
                      <textarea
                        ref="textareaRef"
                        v-model="editContent"
                        @input="validateContent"
                        @scroll="syncLineNumbersScroll"
                        class="w-full h-full p-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-0 resize-none font-mono focus:outline-none leading-5"
                        :class="{ 'bg-red-50 dark:bg-red-900/10': !isValidContent }"
                        :placeholder="`Edit ${objectData.name} content here...`"
                        spellcheck="false"
                        style="line-height: 1.25rem"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Status Bar -->
                  <div
                    class="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div
                      class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400"
                    >
                      <div class="flex items-center space-x-4">
                        <span>Lines: {{ lineCount }}</span>
                        <span>Characters: {{ editContent.length }}</span>
                        <span>Type: {{ fileExtension.toUpperCase() || 'Text' }}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span
                          v-if="isValidContent && editContent.trim()"
                          class="text-green-600 dark:text-green-400"
                          >✓ Valid</span
                        >
                        <span v-else-if="validationError" class="text-red-600 dark:text-red-400"
                          >✗ Invalid</span
                        >
                        <span class="text-gray-500">{{
                          objectData.contentType || 'text/plain'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
        <div
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto"
        >
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
// TypeScript declarations for browser globals
declare global {
  interface Window {
    DOMParser: {
      new (): {
        parseFromString(): {
          getElementsByTagName(): {
            length: number
          }
        }
      }
    }
  }
}

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import storageApi from '@/api/storage'
import type { StorageObject } from '@/types'

const route = useRoute()
const router = useRouter()
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
const validationError = ref('')
const isValidContent = ref(true)

// PDF blob URL for preview
const pdfBlobUrl = ref('')

// Props from route
const bucketName = computed(() => route.params.bucketName as string)
const objectName = computed(() => {
  const path = route.params.objectPath
  return Array.isArray(path) ? path.join('/') : (path as string) || ''
})
const currentProjectId = computed(
  () => (route.params.projectId as string) || projectsStore.selectedProjectId || 'Unknown'
)

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
  const textExtensions = [
    'txt',
    'json',
    'xml',
    'yaml',
    'yml',
    'md',
    'js',
    'ts',
    'css',
    'html',
    'csv',
    'log',
    'env',
    'ini',
    'conf',
    'config',
  ]
  return textExtensions.includes(ext || '')
})

const canPreview = computed(() => {
  const contentType = objectData.value?.contentType
  return (
    contentType?.startsWith('image/') ||
    contentType?.startsWith('video/') ||
    contentType === 'application/pdf' ||
    isTextFile.value
  )
})

const previewUrl = computed(() => {
  if (!objectData.value) return ''
  return storageApi.getObjectPreviewUrl(bucketName.value, objectData.value.name)
})

const fileExtension = computed(() => {
  if (!objectData.value?.name) return ''
  return objectData.value.name.split('.').pop()?.toLowerCase() || ''
})

const lineCount = computed(() => {
  if (!editContent.value) return 1
  return editContent.value.split('\n').length
})

const displayFileName = computed(() => {
  const objName = objectName.value
  if (!objName) return ''

  // Extract just the filename from the full path
  const parts = objName.split('/')
  return parts[parts.length - 1] || objName
})

const objectBreadcrumbs = computed(() => {
  const objName = objectName.value
  if (!objName) return []

  const breadcrumbs: Array<{ name: string; path: string; isLast: boolean }> = []
  const parts = objName.split('/').filter(Boolean)

  let currentPath = ''
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (i < parts.length - 1) {
      // It's a folder
      currentPath += `${part}/`
      breadcrumbs.push({
        name: part,
        path: currentPath,
        isLast: false,
      })
    } else {
      // It's the file itself
      breadcrumbs.push({
        name: part,
        path: objName,
        isLast: true,
      })
    }
  }

  return breadcrumbs
})

// Methods
async function navigateBack(): Promise<void> {
  router.push(
    `/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName.value)}`
  )
}

async function navigateToPath(path: string): Promise<void> {
  // Update the storage store with the new path
  await storageStore.fetchObjects(bucketName.value, path, true)

  // Navigate to bucket browser with the specified path
  router.push(
    `/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName.value)}`
  )
}

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
        message: `Failed to load file content (${response.status})`,
      })
    }
  } catch (error: any) {
    console.error('Error loading text content:', error)
    previewError.value = true
    appStore.showToast({
      type: 'error',
      title: 'Load Failed',
      message: error.message || 'Failed to load file content',
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
  validateContent()
}

function validateContent(): void {
  validationError.value = ''
  isValidContent.value = true

  if (!editContent.value.trim()) {
    return // Empty content is valid
  }

  try {
    if (fileExtension.value === 'json' || objectData.value?.contentType === 'application/json') {
      JSON.parse(editContent.value)
    } else if (
      fileExtension.value === 'xml' ||
      objectData.value?.contentType === 'application/xml'
    ) {
      // Basic XML validation - check for matching tags
      const parser = new window.DOMParser()
      const xmlDoc = parser.parseFromString(editContent.value, 'text/xml')
      const parseError = xmlDoc.getElementsByTagName('parsererror')
      if (parseError.length > 0) {
        throw new Error('Invalid XML format')
      }
    }
  } catch (error: any) {
    validationError.value = error.message || 'Invalid format'
    isValidContent.value = false
  }
}

function cancelEditing(): void {
  isEditing.value = false
  editContent.value = fileContent.value
}

// Load PDF as blob for preview
async function loadPdfBlob(): Promise<void> {
  if (!objectData.value) return

  try {
    const blob = await storageApi.downloadObject({
      bucket: bucketName.value,
      object: objectData.value.name,
    })
    pdfBlobUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('Failed to load PDF blob:', error)
  }
}

async function saveTextContent(): Promise<void> {
  if (!objectData.value) return

  try {
    isSaving.value = true

    // Create a file with the edited content
    const blob = new Blob([editContent.value], {
      type: objectData.value.contentType || 'text/plain',
    })

    // Convert blob to File object
    const file = new File([blob], objectData.value.name, {
      type: objectData.value.contentType || 'text/plain',
    })

    // Upload the updated content
    await storageApi.uploadObject(file, {
      bucket: bucketName.value,
      name: objectData.value.name,
      contentType: objectData.value.contentType || 'text/plain',
    })

    // Update local content
    fileContent.value = editContent.value
    isEditing.value = false

    // Show success message
    appStore.showToast({
      type: 'success',
      title: 'File Saved',
      message: `Successfully updated ${objectData.value.name}`,
    })
  } catch (error: any) {
    console.error('Error saving file:', error)

    // Show error message
    appStore.showToast({
      type: 'error',
      title: 'Save Failed',
      message:
        error.response?.data?.message || error.message || 'Failed to save file. Please try again.',
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
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}

// Editor scroll synchronization
const lineNumbersRef = ref<HTMLElement>()
const textareaRef = ref<HTMLElement>()

function syncLineNumbersScroll(): void {
  if (lineNumbersRef.value && textareaRef.value) {
    // Apply negative transform to move line numbers up based on textarea scroll
    const scrollTop = textareaRef.value.scrollTop
    const lineNumbersContainer = lineNumbersRef.value.querySelector('div')
    if (lineNumbersContainer) {
      lineNumbersContainer.style.transform = `translateY(-${scrollTop}px)`
    }
  }
}

// Auto-load PDF as blob when object is loaded
watch(
  objectData,
  newObjectData => {
    if (pdfBlobUrl.value) {
      URL.revokeObjectURL(pdfBlobUrl.value)
      pdfBlobUrl.value = ''
    }

    if (newObjectData?.contentType === 'application/pdf') {
      loadPdfBlob()
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  loadObject()
})

// Cleanup blob URLs to prevent memory leaks
onUnmounted(() => {
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
  }
})
</script>
