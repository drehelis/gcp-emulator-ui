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
      <!-- Header with Actions -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Buckets
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
                  title="Table view"
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
                  title="Grid view"
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

      <!-- Buckets Table View -->
      <div class="px-4 sm:px-6 lg:px-8">
        <div v-if="storageStore.viewMode === 'list'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Desktop Table View -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full">
            <!-- Table Header -->
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    class="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                  >
                </th>
                <th scope="col" class="px-3 py-2 text-left">
                  <button
                    @click="handleSort('name')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Name
                    <ChevronUpIcon
                      v-if="sortBy === 'name' && sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="sortBy === 'name' && sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-32 hidden md:table-cell">
                  <button
                    @click="handleSort('created')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Created
                    <ChevronUpIcon
                      v-if="sortBy === 'created' && sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="sortBy === 'created' && sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-24 hidden sm:table-cell">
                  <button
                    @click="handleSort('location')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Location
                    <ChevronUpIcon
                      v-if="sortBy === 'location' && sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="sortBy === 'location' && sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-28 hidden lg:table-cell">
                  <button
                    @click="handleSort('storageClass')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150 whitespace-nowrap"
                  >
                    Class
                    <ChevronUpIcon
                      v-if="sortBy === 'storageClass' && sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="sortBy === 'storageClass' && sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-20 hidden xl:table-cell">
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Public
                  </span>
                </th>
                <th scope="col" class="w-16 px-3 py-2"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody class="bg-white dark:bg-gray-800">
              <tr
                v-for="(bucket, index) in sortedBuckets"
                :key="bucket.name"
                :id="`bucket-${bucket.name}`"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer"
                :class="[
                  index !== sortedBuckets.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                ]"
                @click="navigateToBucket(bucket.name)"
              >
                <!-- Checkbox -->
                <td class="px-3 py-1.5">
                  <input
                    type="checkbox"
                    class="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                    @click.stop
                  >
                </td>

                <!-- Name -->
                <td class="px-3 py-1.5">
                  <div class="flex items-center min-w-0">
                    <ArchiveBoxIcon class="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                    <span class="text-xs font-medium text-gray-900 dark:text-white truncate" :title="bucket.name">
                      {{ bucket.name }}
                    </span>
                  </div>
                </td>

                <!-- Created -->
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
                  {{ bucket.timeCreated ? new Date(bucket.timeCreated).toLocaleDateString() : 'N/A' }}
                </td>

                <!-- Location -->
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  <span class="truncate" :title="bucket.location || 'US'">
                    {{ bucket.location || 'US' }}
                  </span>
                </td>

                <!-- Storage Class -->
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell whitespace-nowrap">
                  <span class="truncate" :title="bucket.storageClass || 'Standard'">
                    {{ bucket.storageClass || 'Standard' }}
                  </span>
                </td>

                <!-- Public Access -->
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell whitespace-nowrap">
                  Not public
                </td>

                <!-- Actions -->
                <td class="px-3 py-1.5 text-right">
                  <div class="flex items-center justify-end space-x-1">
                    <button
                      @click.stop="downloadBucketAsZip(bucket.name)"
                      :disabled="downloadingBuckets.has(bucket.name)"
                      class="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download bucket as ZIP"
                    >
                      <ArrowDownTrayIcon :class="['w-3.5 h-3.5', downloadingBuckets.has(bucket.name) ? 'animate-pulse' : '']" />
                    </button>
                    <button
                      @click.stop="confirmDeleteBucket(bucket)"
                      :disabled="storageStore.loading.delete"
                      class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete bucket"
                    >
                      <TrashIcon class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="md:hidden">
            <!-- Mobile Header with Sort -->
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ sortedBuckets.length }} bucket{{ sortedBuckets.length !== 1 ? 's' : '' }}
                </span>
                <select
                  @change="handleMobileSortChange"
                  class="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="created-desc">Created (Newest)</option>
                  <option value="created-asc">Created (Oldest)</option>
                  <option value="location-asc">Location (A-Z)</option>
                  <option value="storageClass-asc">Class (A-Z)</option>
                </select>
              </div>
            </div>

            <!-- Mobile Buckets List -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="bucket in sortedBuckets"
                :key="bucket.name"
                :id="`bucket-${bucket.name}`"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer"
                @click="navigateToBucket(bucket.name)"
              >
                <div class="flex items-start space-x-3">
                  <ArchiveBoxIcon class="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ bucket.name }}
                    </h3>
                    <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{{ bucket.location || 'US' }}</span>
                      <span>{{ bucket.storageClass || 'Standard' }}</span>
                      <span v-if="bucket.timeCreated">
                        {{ new Date(bucket.timeCreated).toLocaleDateString() }}
                      </span>
                    </div>
                  </div>
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
            :id="`bucket-${bucket.name}`"
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
                @click.stop="downloadBucketAsZip(bucket.name)"
                :disabled="downloadingBuckets.has(bucket.name)"
                class="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download bucket as ZIP"
              >
                <ArrowDownTrayIcon :class="['w-3.5 h-3.5', downloadingBuckets.has(bucket.name) ? 'animate-pulse' : '']" />
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
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  Bars3Icon,
  Squares2X2Icon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import storageApi from '@/api/storage'
import type { StorageBucket } from '@/types'
import CreateBucketModal from '@/components/modals/CreateBucketModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import { handleFocusTarget } from '@/utils/focusUtils'

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
const downloadingBuckets = ref(new Set<string>())

// Sorting state
const sortBy = ref<'name' | 'created' | 'location' | 'storageClass'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Computed
const currentProjectId = computed(() => {
  return route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown'
})

const sortedBuckets = computed(() => {
  const buckets = [...storageStore.buckets]

  return buckets.sort((a, b) => {
    let aValue: string | number = ''
    let bValue: string | number = ''

    switch (sortBy.value) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'created':
        aValue = a.timeCreated ? new Date(a.timeCreated).getTime() : 0
        bValue = b.timeCreated ? new Date(b.timeCreated).getTime() : 0
        break
      case 'location':
        aValue = (a.location || 'US').toLowerCase()
        bValue = (b.location || 'US').toLowerCase()
        break
      case 'storageClass':
        aValue = (a.storageClass || 'Standard').toLowerCase()
        bValue = (b.storageClass || 'Standard').toLowerCase()
        break
    }

    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
})

// Methods
function handleSort(field: 'name' | 'created' | 'location' | 'storageClass'): void {
  if (sortBy.value === field) {
    // Toggle sort order if clicking the same column
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new sort field and default to ascending
    sortBy.value = field
    sortOrder.value = 'asc'
  }
}

function handleMobileSortChange(event: Event): void {
  const target = event.target as { value: string }
  const [field, order] = target.value.split('-') as [string, 'asc' | 'desc']

  switch (field) {
    case 'name':
      sortBy.value = 'name'
      break
    case 'created':
      sortBy.value = 'created'
      break
    case 'location':
      sortBy.value = 'location'
      break
    case 'storageClass':
      sortBy.value = 'storageClass'
      break
  }

  sortOrder.value = order
}

async function refreshBuckets(): Promise<void> {
  await storageStore.fetchBuckets(true)
}

function navigateToBucket(bucketName: string): void {
  // Clear the current path and breadcrumbs when navigating to a different bucket
  storageStore.clearCurrentPath()
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
  } catch {
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

async function downloadBucketAsZip(bucketName: string): Promise<void> {
  if (downloadingBuckets.value.has(bucketName)) {
    return
  }

  downloadingBuckets.value.add(bucketName)

  try {
    const blob = await storageApi.downloadBucketAsZip(bucketName, (progress) => {
      console.log(`Downloading bucket ${bucketName}: ${progress.current}/${progress.total} - ${progress.currentFile}`)
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${bucketName}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    appStore.showToast({
      type: 'success',
      title: 'Download Complete',
      message: `Bucket "${bucketName}" downloaded successfully`
    })
  } catch (error) {
    console.error('Failed to download bucket:', error)
    appStore.showToast({
      type: 'error',
      title: 'Download Failed',
      message: `Failed to download bucket "${bucketName}"`
    })
  } finally {
    downloadingBuckets.value.delete(bucketName)
  }
}


// Handle focus targeting when hash is present
async function handleBucketFocus(): Promise<void> {
  const hash = route.hash.slice(1) // Remove the # prefix
  if (hash && storageStore.buckets.length > 0) {
    // Wait a bit for the DOM to be ready
    setTimeout(() => {
      handleFocusTarget(hash, 'bucket')
    }, 100)
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

  // Handle focus if there's a hash in the URL
  await handleBucketFocus()
})

// Watch for project ID changes and refetch buckets
watch(currentProjectId, async (newProjectId, oldProjectId) => {
  if (newProjectId && newProjectId !== 'Unknown' && newProjectId !== oldProjectId) {
    await storageStore.fetchBuckets(true) // Force refresh
  }
}, { immediate: true })

// Watch for route hash changes to handle focus targeting
watch(() => route.hash, () => {
  handleBucketFocus()
})

// Watch for buckets changes to handle focus targeting when data loads
watch(() => storageStore.buckets, () => {
  if (route.hash) {
    handleBucketFocus()
  }
}, { deep: true })

</script>
