<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <ArrowUpTrayIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                    Upload Objects
                  </h1>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Upload files to {{ bucketName }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Upload Area -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
            isDragOver 
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          ]"
        >
          <div class="space-y-4">
            <div class="flex justify-center">
              <CloudArrowUpIcon class="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Drop files here to upload
              </h3>
              <p class="text-gray-500 dark:text-gray-400">
                or
              </p>
            </div>
            
            <div>
              <input
                ref="fileInput"
                type="file"
                multiple
                @change="handleFileSelect"
                class="hidden"
              />
              <button
                @click="$refs.fileInput?.click()"
                :disabled="storageStore.loading.upload"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <DocumentPlusIcon class="w-4 h-4 mr-2" />
                Select Files
              </button>
            </div>
            
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Supports all file types, up to 5TB per file
            </p>
          </div>
        </div>
      </div>

      <!-- Selected Files -->
      <div v-if="selectedFiles.length > 0" class="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Selected Files ({{ selectedFiles.length }})
          </h3>
          <button
            @click="clearFiles"
            :disabled="storageStore.loading.upload"
            class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Clear All
          </button>
        </div>

        <div class="space-y-3 mb-6">
          <div
            v-for="(file, index) in selectedFiles"
            :key="`${file.name}-${file.size}-${index}`"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <DocumentIcon class="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ file.name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatFileSize(file.size) }}
                </p>
              </div>
            </div>
            <button
              @click="removeFile(index)"
              :disabled="storageStore.loading.upload"
              class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Upload Button -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Ready to upload {{ selectedFiles.length }} file{{ selectedFiles.length === 1 ? '' : 's' }}
          </p>
          <button
            @click="handleUpload"
            :disabled="storageStore.loading.upload || selectedFiles.length === 0"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ArrowPathIcon v-if="storageStore.loading.upload" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            {{ storageStore.loading.upload ? 'Uploading...' : 'Start Upload' }}
          </button>
        </div>
      </div>

      <!-- Upload Progress -->
      <div v-if="storageStore.uploadProgress.length > 0" class="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Progress
        </h3>

        <div class="space-y-4">
          <div
            v-for="progress in storageStore.uploadProgress"
            :key="progress.file.name"
            class="space-y-2"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 min-w-0 flex-1">
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    progress.status === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                      : progress.status === 'error' 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                  ]"
                >
                  <CheckIcon v-if="progress.status === 'completed'" class="w-4 h-4" />
                  <XMarkIcon v-else-if="progress.status === 'error'" class="w-4 h-4" />
                  <span v-else>{{ progress.percentage }}%</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ progress.file.name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(progress.loaded) }} / {{ formatFileSize(progress.total) }}
                  </p>
                </div>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {{ progress.status }}
              </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                :class="[
                  'h-2 rounded-full transition-all duration-300',
                  progress.status === 'completed' 
                    ? 'bg-green-500' 
                    : progress.status === 'error' 
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                ]"
                :style="{ width: `${progress.percentage}%` }"
              />
            </div>

            <!-- Error message -->
            <div v-if="progress.status === 'error' && progress.error" class="text-sm text-red-600 dark:text-red-400">
              {{ progress.error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
  DocumentIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'

const router = useRouter()
const route = useRoute()
const storageStore = useStorageStore()
const projectsStore = useProjectsStore()

// Local state
const selectedFiles = ref<File[]>([])
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

// Props from route
const bucketName = computed(() => route.params.bucketName as string)
const currentProjectId = computed(() => route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown')

// Methods
function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragEnter(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault()
  // Only set to false if we're leaving the drop zone entirely
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    isDragOver.value = false
  }
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer?.files || [])
  addFiles(files)
}

function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addFiles(files)
  
  // Clear the input
  target.value = ''
}

function addFiles(files: File[]): void {
  selectedFiles.value.push(...files)
}

function removeFile(index: number): void {
  selectedFiles.value.splice(index, 1)
}

function clearFiles(): void {
  selectedFiles.value = []
}

async function handleUpload(): Promise<void> {
  if (selectedFiles.value.length === 0) return

  try {
    await storageStore.uploadFiles(selectedFiles.value, bucketName.value, '')
    
    // Clear selected files after successful upload
    selectedFiles.value = []
    
    // Navigate back to bucket browser
    router.push(`/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName.value)}`)
  } catch {
    // Error is handled in the store
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
</script>