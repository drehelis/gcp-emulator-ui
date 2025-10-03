<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Create Storage Bucket
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new Cloud Storage bucket to store your objects
              </p>
            </div>
            
            <router-link
              :to="`/projects/${currentProjectId}/storage/buckets`"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Back to Buckets
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form @submit.prevent="handleSubmit" class="space-y-8">
        <!-- Basic Information -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure the basic settings for your bucket
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <!-- Bucket Name -->
            <div class="sm:col-span-2">
              <label for="bucketName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bucket Name *
              </label>
              <div class="mt-1">
                <input
                  id="bucketName"
                  v-model="form.name"
                  type="text"
                  required
                  :disabled="storageStore.loading.create"
                  pattern="^[a-z0-9][a-z0-9._-]*[a-z0-9]$"
                  minlength="3"
                  maxlength="63"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="my-storage-bucket"
                />
              </div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Bucket names must be 3-63 characters, lowercase letters, numbers, hyphens, and periods only.
                Must start and end with a letter or number.
              </p>
              <div v-if="nameError" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ nameError }}
              </div>
            </div>

            <!-- Project -->
            <div>
              <label for="project" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project
              </label>
              <div class="mt-1">
                <input
                  id="project"
                  v-model="form.project"
                  type="text"
                  readonly
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <!-- Location -->
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <div class="mt-1">
                <select
                  id="location"
                  v-model="form.location"
                  :disabled="storageStore.loading.create"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="US">US (Multi-Region)</option>
                  <option value="EU">EU (Multi-Region)</option>
                  <option value="ASIA">Asia (Multi-Region)</option>
                  <option value="us-central1">us-central1 (Iowa)</option>
                  <option value="us-east1">us-east1 (South Carolina)</option>
                  <option value="us-west1">us-west1 (Oregon)</option>
                  <option value="europe-west1">europe-west1 (Belgium)</option>
                  <option value="asia-southeast1">asia-southeast1 (Singapore)</option>
                </select>
              </div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose where your data will be stored geographically
              </p>
            </div>
          </div>
        </div>

        <!-- Storage Class -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Storage Class
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose the default storage class for objects in this bucket
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label
              v-for="option in storageClassOptions"
              :key="option.value"
              class="relative flex cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-sm focus:outline-none hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              :class="{
                'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400': form.storageClass === option.value
              }"
            >
              <input
                v-model="form.storageClass"
                type="radio"
                :value="option.value"
                :disabled="storageStore.loading.create"
                class="sr-only"
              />
              <span class="flex flex-1 flex-col">
                <span class="block text-sm font-medium text-gray-900 dark:text-white">
                  {{ option.label }}
                </span>
                <span class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  {{ option.description }}
                </span>
                <span class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {{ option.useCase }}
                </span>
              </span>
              <CheckCircleIcon
                v-if="form.storageClass === option.value"
                class="h-5 w-5 text-blue-600 dark:text-blue-400 absolute top-4 right-4"
              />
            </label>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Settings
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Optional settings for enhanced functionality
            </p>
          </div>

          <div class="space-y-6">
            <!-- Versioning -->
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <label for="versioning" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Object Versioning
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Keep multiple versions of objects when they are overwritten or deleted
                </p>
              </div>
              <div class="ml-4">
                <button
                  type="button"
                  @click="form.enableVersioning = !form.enableVersioning"
                  :disabled="storageStore.loading.create"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="{
                    'bg-blue-600': form.enableVersioning,
                    'bg-gray-200 dark:bg-gray-700': !form.enableVersioning
                  }"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-out"
                    :class="{
                      'translate-x-5': form.enableVersioning,
                      'translate-x-0': !form.enableVersioning
                    }"
                  />
                </button>
              </div>
            </div>

            <!-- Labels -->
            <div>
              <label for="labels" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Labels
              </label>
              <div class="mt-1">
                <div class="space-y-2">
                  <div
                    v-for="(label, index) in form.labels"
                    :key="index"
                    class="flex items-center space-x-2"
                  >
                    <input
                      v-model="label.key"
                      type="text"
                      placeholder="Key"
                      :disabled="storageStore.loading.create"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span class="text-gray-400">=</span>
                    <input
                      v-model="label.value"
                      type="text"
                      placeholder="Value"
                      :disabled="storageStore.loading.create"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      @click="removeLabel(index)"
                      :disabled="storageStore.loading.create"
                      class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addLabel"
                  :disabled="storageStore.loading.create"
                  class="mt-2 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-transparent rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusIcon class="w-4 h-4 mr-2" />
                  Add Label
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Labels help you organize and categorize your buckets
              </p>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              * Required fields
            </p>
            
            <div class="flex items-center space-x-3">
              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets`"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Cancel
              </router-link>
              
              <button
                type="submit"
                :disabled="!isFormValid || storageStore.loading.create"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon v-if="storageStore.loading.create" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                {{ storageStore.loading.create ? 'Creating...' : 'Create Bucket' }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import type { CreateBucketRequest } from '@/types'

const router = useRouter()
const route = useRoute()
const storageStore = useStorageStore()
const projectsStore = useProjectsStore()

// Form state
const form = ref({
  name: '',
  project: '',
  location: 'US',
  storageClass: 'STANDARD',
  enableVersioning: false,
  labels: [] as Array<{ key: string; value: string }>
})

const nameError = ref('')

// Storage class options
const storageClassOptions = [
  {
    value: 'STANDARD',
    label: 'Standard',
    description: 'Best for frequently accessed data',
    useCase: 'Hot data, websites, streaming'
  },
  {
    value: 'NEARLINE',
    label: 'Nearline',
    description: 'Best for data accessed once per month',
    useCase: 'Backups, disaster recovery'
  },
  {
    value: 'COLDLINE',
    label: 'Coldline',
    description: 'Best for data accessed once per quarter',
    useCase: 'Long-term storage, archiving'
  },
  {
    value: 'ARCHIVE',
    label: 'Archive',
    description: 'Best for data accessed once per year',
    useCase: 'Legal compliance, digital preservation'
  }
]

// Computed
const currentProjectId = computed(() => {
  return route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown'
})

const isFormValid = computed(() => {
  return form.value.name && 
         form.value.name.length >= 3 && 
         form.value.name.length <= 63 &&
         /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(form.value.name) &&
         !nameError.value
})

// Methods
function validateBucketName(): void {
  const name = form.value.name
  nameError.value = ''

  if (!name) return

  if (name.length < 3 || name.length > 63) {
    nameError.value = 'Bucket name must be between 3 and 63 characters'
    return
  }

  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(name)) {
    nameError.value = 'Bucket name contains invalid characters'
    return
  }

  if (name.includes('..') || name.includes('.-') || name.includes('-.')) {
    nameError.value = 'Bucket name cannot contain consecutive periods or dashes'
    return
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    nameError.value = 'Bucket name cannot be formatted as an IP address'
    return
  }
}

function addLabel(): void {
  form.value.labels.push({ key: '', value: '' })
}

function removeLabel(index: number): void {
  form.value.labels.splice(index, 1)
}

async function handleSubmit(): Promise<void> {
  if (!isFormValid.value) return

  try {
    // Prepare labels
    const labels: Record<string, string> = {}
    for (const label of form.value.labels) {
      if (label.key && label.value) {
        labels[label.key] = label.value
      }
    }

    const request: CreateBucketRequest = {
      name: form.value.name,
      project: form.value.project,
      predefinedAcl: 'private',
      projection: 'full'
    }

    await storageStore.createBucket(request)
    
    // Navigate to the new bucket
    router.push(`/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(form.value.name)}`)
  } catch {
    // Error is handled in the store
  }
}

// Watchers
import { watch } from 'vue'
watch(() => form.value.name, validateBucketName)

// Lifecycle
onMounted(() => {
  form.value.project = currentProjectId.value
})
</script>