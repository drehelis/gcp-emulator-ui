<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="storageStore.loading.buckets && !storageStore.buckets.length" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="storageStore.hasError" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="text-center">
        <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error Loading Buckets</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ storageStore.state.error }}</p>
        <div class="mt-4">
          <button
            @click="refreshBuckets"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon class="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Buckets List -->
    <div v-else-if="storageStore.buckets.length > 0" class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Buckets ({{ storageStore.buckets.length }})
            </h2>
            <div class="flex items-center space-x-3">
              <button
                @click="showCreateBucketModal = true"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon class="h-4 w-4 sm:mr-2" />
                <span class="hidden sm:inline">Create Bucket</span>
              </button>
              <button
                @click="refreshBuckets"
                :disabled="storageStore.loading.buckets"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon class="h-4 w-4 sm:mr-2" :class="{ 'animate-spin': storageStore.loading.buckets }" />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Buckets List Content -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="bucket in storageStore.buckets"
            :key="bucket.name"
            @click="navigateToBucket(bucket.name)"
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
          <div class="flex items-start justify-between cursor-pointer">
            <div class="flex items-start space-x-3 flex-1 cursor-pointer">
              <ArchiveBoxIcon class="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div class="flex-1 min-w-0 cursor-pointer">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ bucket.name }}
                  </span>
                  <div v-if="bucket.location" class="flex items-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {{ bucket.location }}
                    </span>
                  </div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>{{ bucket.storageClass || 'STANDARD' }}</div>
                </div>
              </div>
            </div>
            
            <!-- Bucket Actions -->
            <div class="flex items-center space-x-2 ml-4">
              <button
                @click.stop="navigateToBucket(bucket.name)"
                class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Browse objects"
              >
                <FolderIcon class="w-4 h-4" />
              </button>
              <button
                @click.stop="copyBucketName(bucket.name)"
                class="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                title="Copy bucket name"
              >
                <DocumentDuplicateIcon class="w-4 h-4" />
              </button>
              <button
                @click.stop="confirmDeleteBucket(bucket)"
                :disabled="storageStore.loading.delete"
                class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete bucket"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Buckets (0)
            </h2>
            <div class="flex items-center space-x-3">
              <button
                @click="showCreateBucketModal = true"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon class="h-4 w-4 sm:mr-2" />
                <span class="hidden sm:inline">Create Bucket</span>
              </button>
              <button
                @click="refreshBuckets"
                :disabled="storageStore.loading.buckets"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon class="h-4 w-4 sm:mr-2" :class="{ 'animate-spin': storageStore.loading.buckets }" />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State Content -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="text-center py-12">
          <ArchiveBoxIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Buckets Found</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Create your first bucket to start storing objects in Cloud Storage.</p>
          <div class="mt-6">
            <button
              @click="showCreateBucketModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Create Bucket
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <TransitionRoot as="template" :show="deleteModal.show">
      <Dialog as="div" class="relative z-50" @close="deleteModal.show = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div class="sm:flex sm:items-start">
                  <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Delete Bucket
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete bucket "{{ deleteModal.bucket?.name }}"? 
                        This action cannot be undone and will permanently delete the bucket and all its contents.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    @click="handleDeleteBucket"
                    :disabled="storageStore.loading.delete"
                    class="inline-flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  >
                    <ArrowPathIcon v-if="storageStore.loading.delete" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {{ storageStore.loading.delete ? 'Deleting...' : 'Delete' }}
                  </button>
                  <button
                    @click="deleteModal.show = false"
                    :disabled="storageStore.loading.delete"
                    class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Create Bucket Modal -->
    <CreateBucketModal
      v-model="showCreateBucketModal"
      @bucket-created="handleBucketCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArchiveBoxIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import type { StorageBucket } from '@/types'
import CreateBucketModal from '@/components/modals/CreateBucketModal.vue'

const router = useRouter()
const route = useRoute()
const storageStore = useStorageStore()
const projectsStore = useProjectsStore()
const appStore = useAppStore()

// Local state
const showCreateBucketModal = ref(false)
const deleteModal = ref<{
  show: boolean
  bucket: StorageBucket | null
}>({
  show: false,
  bucket: null
})

// Computed
const currentProjectId = computed(() => {
  return route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown'
})

// Methods
async function refreshBuckets(): Promise<void> {
  await storageStore.fetchBuckets(true)
}

function navigateToBucket(bucketName: string): void {
  router.push(`/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName)}`)
}

async function copyBucketName(bucketName: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(bucketName)
    appStore.showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: `Bucket name "${bucketName}" copied to clipboard`
    })
  } catch (error) {
    console.error('Failed to copy bucket name:', error)
    appStore.showToast({
      type: 'error',
      title: 'Copy Failed',
      message: 'Failed to copy bucket name to clipboard'
    })
  }
}

function confirmDeleteBucket(bucket: StorageBucket): void {
  deleteModal.value = {
    show: true,
    bucket
  }
}

async function handleDeleteBucket(): Promise<void> {
  if (!deleteModal.value.bucket) return

  try {
    await storageStore.deleteBucket(deleteModal.value.bucket.name)
    deleteModal.value.show = false
  } catch (error) {
    // Error is already handled in the store
  }
}

function handleBucketCreated(): void {
  // Refresh the buckets list after successful creation
  refreshBuckets()
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} months ago`
  } else {
    return `${Math.floor(diffDays / 365)} years ago`
  }
}

// Lifecycle
onMounted(async () => {
  if (!storageStore.buckets.length) {
    await storageStore.fetchBuckets()
  }
})

</script>