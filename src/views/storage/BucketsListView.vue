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
              <!-- View Mode Toggle -->
              <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
                <button
                  @click="storageStore.setViewMode('list')"
                  :class="[
                    'p-1.5 rounded text-sm font-medium transition-colors',
                    storageStore.viewMode === 'list'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  ]"
                >
                  <Bars3Icon class="w-4 h-4" />
                </button>
                <button
                  @click="storageStore.setViewMode('grid')"
                  :class="[
                    'p-1.5 rounded text-sm font-medium transition-colors',
                    storageStore.viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  ]"
                >
                  <Squares2X2Icon class="w-4 h-4" />
                </button>
              </div>

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
      
      <!-- Buckets List View -->
      <div v-if="storageStore.viewMode === 'list'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
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
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div class="flex items-center space-x-2">
                      <span>{{ bucket.storageClass || 'STANDARD' }}</span>
                      <span v-if="bucket.location" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {{ bucket.location }}
                      </span>
                    </div>
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

      <!-- Buckets Grid View -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="bucket in storageStore.buckets"
          :key="bucket.name"
          @click="navigateToBucket(bucket.name)"
          class="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/10 transition-all duration-200 cursor-pointer"
        >
          <!-- Bucket Icon -->
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 mb-3 flex items-center justify-center">
              <ArchiveBoxIcon class="w-10 h-10 text-blue-500" />
            </div>

            <!-- Bucket Name -->
            <div class="w-full mb-2">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ bucket.name }}
              </h3>
            </div>

            <!-- Bucket Details -->
            <div class="w-full text-center space-y-1">
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ bucket.storageClass || 'STANDARD' }}
              </div>
              <div v-if="bucket.location" class="text-xs">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {{ bucket.location }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons (visible on hover) -->
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
            <button
              @click.stop="navigateToBucket(bucket.name)"
              class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Browse objects"
            >
              <FolderIcon class="w-3.5 h-3.5" />
            </button>
            <button
              @click.stop="copyBucketName(bucket.name)"
              class="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Copy bucket name"
            >
              <DocumentDuplicateIcon class="w-3.5 h-3.5" />
            </button>
            <button
              @click.stop="confirmDeleteBucket(bucket)"
              :disabled="storageStore.loading.delete"
              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete bucket"
            >
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
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
    <ConfirmationModal
      v-model="deleteModal.show"
      title="Delete Bucket"
      :message="`Are you sure you want to delete bucket '${deleteModal.bucket?.name || ''}'?`"
      confirm-label="Delete Bucket"
      :is-loading="storageStore.loading.delete"
      :details="{
        title: 'Bucket Details',
        description: deleteModal.bucket?.name || ''
      }"
      @confirm="handleDeleteBucket"
      @cancel="cancelDeleteBucket"
    />

    <!-- Create Bucket Modal -->
    <CreateBucketModal
      v-model="showCreateBucketModal"
      @bucket-created="handleBucketCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArchiveBoxIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  Bars3Icon,
  Squares2X2Icon
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import type { StorageBucket } from '@/types'
import CreateBucketModal from '@/components/modals/CreateBucketModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'

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

function cancelDeleteBucket(): void {
  deleteModal.value = {
    show: false,
    bucket: null
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
  // Wait for the current project ID to be available
  if (currentProjectId.value && currentProjectId.value !== 'Unknown') {
    if (!storageStore.buckets.length) {
      await storageStore.fetchBuckets()
    }
  }
})

// Watch for project ID changes and refetch buckets
watch(currentProjectId, async (newProjectId, oldProjectId) => {
  if (newProjectId && newProjectId !== 'Unknown' && newProjectId !== oldProjectId) {
    await storageStore.fetchBuckets(true) // Force refresh
  }
}, { immediate: true })

</script>