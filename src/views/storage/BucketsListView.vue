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
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                Create Bucket
              </button>
              <button
                @click="refreshBuckets"
                :disabled="storageStore.loading.buckets"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': storageStore.loading.buckets }" />
                Refresh
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
                  <button
                    @click.stop="navigateToBucket(bucket.name)"
                    class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors group"
                  >
                    <span>{{ bucket.name }}</span>
                    <svg class="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <div v-if="bucket.location" class="flex items-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {{ bucket.location }}
                    </span>
                  </div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>{{ bucket.storageClass || 'STANDARD' }}</div>
                  <div v-if="bucket.timeCreated">Created {{ formatDate(bucket.timeCreated) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Actions Menu -->
            <div class="relative ml-4">
              <button
                @click.stop="toggleBucketMenu(bucket.name)"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <EllipsisVerticalIcon class="w-5 h-5" />
              </button>
              
              <!-- Dropdown Menu -->
              <div
                v-if="activeBucketMenu === bucket.name"
                v-click-outside="() => closeBucketMenu()"
                class="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700"
              >
                <div class="py-1">
                  <button
                    @click="navigateToBucket(bucket.name)"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FolderIcon class="w-4 h-4 mr-2 inline" />
                    Browse Objects
                  </button>
                  <button
                    @click="copyBucketName(bucket.name)"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <DocumentDuplicateIcon class="w-4 h-4 mr-2 inline" />
                    Copy Name
                  </button>
                  <hr class="my-1 border-gray-200 dark:border-gray-600">
                  <button
                    @click="confirmDeleteBucket(bucket)"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon class="w-4 h-4 mr-2 inline" />
                    Delete Bucket
                  </button>
                </div>
              </div>
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
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon class="h-4 w-4 mr-2" />
                Create Bucket
              </button>
              <button
                @click="refreshBuckets"
                :disabled="storageStore.loading.buckets"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': storageStore.loading.buckets }" />
                Refresh
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
  EllipsisVerticalIcon,
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
const activeBucketMenu = ref<string | null>(null)
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

function toggleBucketMenu(bucketName: string): void {
  activeBucketMenu.value = activeBucketMenu.value === bucketName ? null : bucketName
}

function closeBucketMenu(): void {
  activeBucketMenu.value = null
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
  closeBucketMenu()
}

function confirmDeleteBucket(bucket: StorageBucket): void {
  deleteModal.value = {
    show: true,
    bucket
  }
  closeBucketMenu()
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

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside)
    delete el._clickOutside
  }
}
</script>