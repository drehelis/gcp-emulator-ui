<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 max-w-2xl mx-auto transition-colors"
    :class="{
      'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10': isDragOver,
    }"
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Upload Icon -->
    <div
      class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto"
    >
      <ArrowUpTrayIcon v-if="!loading" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
      <ArrowPathIcon v-else class="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
    </div>

    <!-- Upload Text -->
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
      <span v-if="!loading">{{ title }}</span>
      <span v-else>Uploading Files...</span>
    </h3>

    <p v-if="!loading" class="text-gray-600 dark:text-gray-400 text-sm mb-6 text-center">
      <span v-if="!isDragOver">
        <template v-if="description"> {{ description }}<br /> </template>
        This {{ currentPath ? 'folder' : 'bucket' }} is empty.
        <strong>Drag and drop files here</strong> or click to upload.
      </span>
      <span v-else class="text-blue-600 dark:text-blue-400 font-medium">
        Drop files here to upload
      </span>
    </p>

    <!-- Upload Progress -->
    <div v-if="loading && uploadProgress.length > 0" class="mb-6">
      <div class="space-y-2">
        <div
          v-for="progress in uploadProgress"
          :key="progress.file.name"
          class="flex items-center justify-between text-xs"
        >
          <span class="text-gray-600 dark:text-gray-400 truncate mr-4">{{
            progress.file.name
          }}</span>
          <div class="flex items-center space-x-2">
            <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                class="bg-blue-600 h-1.5 rounded-full transition-all"
                :style="{ width: `${progress.percentage}%` }"
              ></div>
            </div>
            <span class="text-gray-500 dark:text-gray-400 w-8 text-right"
              >{{ progress.percentage }}%</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Buttons -->
    <div v-if="!loading" class="flex flex-col items-center justify-center">
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-center mb-3">
        <button
          @click="$emit('create-file')"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          <DocumentTextIcon class="w-4 h-4 mr-2" />
          Create File
        </button>
        <button
          @click="triggerFileInput"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
          Choose Files
        </button>
      </div>
      <div class="text-center">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">or drag and drop files here</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Multiple files supported • Max 100MB per file
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="hidden"
      @change="handleFileSelect"
      accept="*/*"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpTrayIcon, ArrowPathIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { getFilesFromDataTransfer } from '@/utils/fileSystem'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  uploadProgress: {
    type: Array as () => Array<{ file: File; percentage: number }>,
    default: () => [],
  },
  bucketName: {
    type: String,
    required: true,
  },
  currentPath: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'No Objects Found',
  },
  description: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (_e: 'files-selected', _files: File[]): void
  (_e: 'create-file'): void
}>()

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  // Only set isDragOver to false if we're actually leaving the drop zone
  if (!event.currentTarget?.contains(event.relatedTarget as any)) {
    isDragOver.value = false
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  if (event.dataTransfer) {
    const files = await getFilesFromDataTransfer(event.dataTransfer)
    if (files.length > 0) {
      emit('files-selected', files)
    }
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const files = Array.from(target.files)
    emit('files-selected', files)
    // Reset value so same files can be selected again
    target.value = ''
  }
}
</script>
