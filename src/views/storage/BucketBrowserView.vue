<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <!-- Navigation and Title -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div class="flex items-center space-x-4">
              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets`"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeftIcon class="w-5 h-5" />
              </router-link>
              
              <div>
                <div class="flex items-center space-x-2">
                  <ArchiveBoxIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ bucketName }}
                  </h1>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ currentPath || 'Root folder' }}
                </p>
              </div>
            </div>
            
            <!-- Action buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="refreshObjects"
                :disabled="storageStore.loading.objects"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ArrowPathIcon 
                  :class="['w-4 h-4 mr-2', storageStore.loading.objects ? 'animate-spin' : '']"
                />
                Refresh
              </button>
              
              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets/${encodeURIComponent(bucketName)}/upload`"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
                Upload
              </router-link>
            </div>
          </div>

          <!-- Breadcrumbs -->
          <nav v-if="storageStore.breadcrumbs.length > 0" class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2 text-sm">
              <li>
                <button
                  @click="navigateToPath('')"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <HomeIcon class="w-4 h-4" />
                  <span class="sr-only">Home</span>
                </button>
              </li>
              <li v-for="(breadcrumb, index) in storageStore.breadcrumbs" :key="index" class="flex items-center">
                <ChevronRightIcon class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
                <button
                  v-if="!breadcrumb.isLast"
                  @click="navigateToPath(breadcrumb.path)"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate transition-colors duration-200"
                >
                  {{ breadcrumb.name }}
                </button>
                <span v-else class="text-gray-500 dark:text-gray-400 truncate">
                  {{ breadcrumb.name }}
                </span>
              </li>
            </ol>
          </nav>

          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div class="flex items-center space-x-4">
              <!-- View mode toggle -->
              <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  @click="storageStore.setViewMode('grid')"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    storageStore.viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  ]"
                >
                  <Squares2X2Icon class="w-4 h-4 mr-2" />
                  Grid
                </button>
                <button
                  @click="storageStore.setViewMode('list')"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    storageStore.viewMode === 'list'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  ]"
                >
                  <ListBulletIcon class="w-4 h-4 mr-2" />
                  List
                </button>
              </div>

              <!-- Sort options -->
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
                <select
                  :value="storageStore.sortBy"
                  @change="storageStore.setSortBy(($event.target as HTMLSelectElement).value as any)"
                  class="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="modified">Modified</option>
                </select>
              </div>
            </div>

            <!-- Selection actions -->
            <div v-if="storageStore.selectedObjects.length > 0" class="flex items-center space-x-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ storageStore.selectedObjects.length }} selected
              </span>
              <button
                @click="handleBulkDownload"
                :disabled="storageStore.loading.download"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-transparent rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                @click="confirmBulkDelete"
                :disabled="storageStore.loading.delete"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-transparent rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <TrashIcon class="w-4 h-4 mr-2" />
                Delete
              </button>
              <button
                @click="storageStore.clearSelection"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading State -->
      <div v-if="storageStore.loading.objects && !storageStore.objects.length" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600 dark:text-blue-400 transition ease-in-out duration-150">
          <ArrowPathIcon class="animate-spin -ml-1 mr-3 h-5 w-5" />
          Loading objects...
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="storageStore.hasError" class="text-center py-12">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Error Loading Objects
          </h3>
          <p class="text-red-700 dark:text-red-300 mb-4">
            {{ storageStore.state.error }}
          </p>
          <button
            @click="refreshObjects"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!storageStore.objects.length" class="text-center py-12">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-auto">
          <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <DocumentIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Objects Found
          </h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">
            This {{ currentPath ? 'folder' : 'bucket' }} is empty. Upload some files to get started.
          </p>
          <router-link
            :to="`/projects/${currentProjectId}/storage/buckets/${encodeURIComponent(bucketName)}/upload`"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          >
            <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
            Upload Files
          </router-link>
        </div>
      </div>

      <!-- Objects Grid View -->
      <div v-else-if="storageStore.viewMode === 'grid'" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <div
          v-for="object in storageStore.objects"
          :key="object.name"
          class="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/10 transition-all duration-200 cursor-pointer"
          :class="{ 'ring-2 ring-blue-500 dark:ring-blue-400': storageStore.selectedObjects.includes(object.name) }"
          @click="handleObjectClick(object)"
        >
          <!-- Selection checkbox -->
          <div v-if="!object.isFolder" class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <input
              type="checkbox"
              :checked="storageStore.selectedObjects.includes(object.name)"
              @click.stop="storageStore.selectObject(object.name)"
              @change="() => {}"
              class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <!-- Object icon/preview -->
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 mb-2 flex items-center justify-center">
              <img
                v-if="object.preview && object.contentType?.startsWith('image/')"
                :src="object.preview"
                :alt="object.name"
                class="w-12 h-12 object-cover rounded"
                @error="$event.target.style.display = 'none'"
              />
              <FolderIcon
                v-else-if="object.isFolder"
                class="w-12 h-12 text-blue-500 dark:text-blue-400"
              />
              <DocumentIcon
                v-else
                class="w-12 h-12 text-gray-400 dark:text-gray-500"
              />
            </div>
            
            <p class="text-xs font-medium text-gray-900 dark:text-white truncate w-full" :title="object.name">
              {{ object.isFolder ? object.name : getFileName(object.name) }}
            </p>
            
            <p v-if="!object.isFolder" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ formatFileSize(parseInt(object.size || '0')) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Objects List View -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    :checked="allObjectsSelected"
                    :indeterminate="someObjectsSelected"
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Modified
                </th>
                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="object in storageStore.objects"
                :key="object.name"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                :class="{ 'bg-blue-50 dark:bg-blue-900/20': storageStore.selectedObjects.includes(object.name) }"
                @click="handleObjectClick(object)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-if="!object.isFolder"
                    type="checkbox"
                    :checked="storageStore.selectedObjects.includes(object.name)"
                    @click.stop="storageStore.selectObject(object.name)"
                    @change="() => {}"
                    class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <FolderIcon
                      v-if="object.isFolder"
                      class="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3"
                    />
                    <DocumentIcon
                      v-else
                      class="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3"
                    />
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ object.isFolder ? object.name : getFileName(object.name) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ object.isFolder ? '—' : formatFileSize(parseInt(object.size || '0')) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ object.isFolder ? 'Folder' : (object.contentType || 'Unknown') }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ object.isFolder ? '—' : formatDate(object.updated || object.timeCreated) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    v-if="!object.isFolder"
                    @click.stop="downloadObject(object)"
                    :disabled="storageStore.loading.download"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Load more button -->
      <div v-if="storageStore.pagination.hasMore" class="text-center mt-6">
        <button
          @click="loadMore"
          :disabled="storageStore.loading.objects"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ArrowPathIcon v-if="storageStore.loading.objects" class="animate-spin -ml-1 mr-2 h-4 w-4" />
          {{ storageStore.loading.objects ? 'Loading...' : 'Load More' }}
        </button>
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
                      Delete Objects
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete {{ deleteModal.objects.length }} object{{ deleteModal.objects.length === 1 ? '' : 's' }}? 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    @click="handleBulkDelete"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  HomeIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  DocumentIcon,
  FolderIcon,
  TrashIcon,
  ExclamationTriangleIcon
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
import type { StorageObjectWithPreview } from '@/types'

const router = useRouter()
const route = useRoute()
const storageStore = useStorageStore()
const projectsStore = useProjectsStore()

// Local state
const deleteModal = ref<{
  show: boolean
  objects: string[]
}>({
  show: false,
  objects: []
})

// Props from route
const bucketName = computed(() => route.params.bucketName as string)
const currentProjectId = computed(() => route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown')
const currentPath = computed(() => storageStore.currentPath)

// Computed
const allObjectsSelected = computed(() => {
  const nonFolderObjects = storageStore.objects.filter(obj => !obj.isFolder)
  return nonFolderObjects.length > 0 && nonFolderObjects.every(obj => 
    storageStore.selectedObjects.includes(obj.name)
  )
})

const someObjectsSelected = computed(() => {
  const nonFolderObjects = storageStore.objects.filter(obj => !obj.isFolder)
  return storageStore.selectedObjects.length > 0 && 
         storageStore.selectedObjects.length < nonFolderObjects.length
})

// Methods
async function refreshObjects(): Promise<void> {
  await storageStore.fetchObjects(bucketName.value, currentPath.value, true)
}

async function loadMore(): Promise<void> {
  await storageStore.fetchObjects(bucketName.value, currentPath.value, false)
}

function navigateToPath(path: string): void {
  storageStore.fetchObjects(bucketName.value, path, true)
}

function handleObjectClick(object: StorageObjectWithPreview): void {
  if (object.isFolder) {
    const newPath = currentPath.value + object.name + '/'
    navigateToPath(newPath)
  } else {
    // Navigate to object details
    const objectPath = encodeURIComponent(object.name)
    router.push(`/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName.value)}/objects/${objectPath}`)
  }
}

function toggleSelectAll(): void {
  if (allObjectsSelected.value) {
    storageStore.clearSelection()
  } else {
    storageStore.selectAllObjects()
  }
}

async function downloadObject(object: StorageObjectWithPreview): Promise<void> {
  if (object.isFolder) return
  await storageStore.downloadObject(bucketName.value, object.name)
}

async function handleBulkDownload(): Promise<void> {
  for (const objectName of storageStore.selectedObjects) {
    await storageStore.downloadObject(bucketName.value, objectName)
  }
}

function confirmBulkDelete(): void {
  deleteModal.value = {
    show: true,
    objects: [...storageStore.selectedObjects]
  }
}

async function handleBulkDelete(): Promise<void> {
  try {
    await storageStore.deleteObjects(bucketName.value, deleteModal.value.objects)
    deleteModal.value.show = false
  } catch (error) {
    // Error is handled in the store
  }
}

function getFileName(fullPath: string): string {
  const parts = fullPath.split('/')
  return parts[parts.length - 1] || fullPath
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
  } else {
    return date.toLocaleDateString()
  }
}

// Lifecycle
onMounted(async () => {
  if (bucketName.value) {
    await storageStore.fetchBucket(bucketName.value)
    await storageStore.fetchObjects(bucketName.value, '', true)
  }
})
</script>