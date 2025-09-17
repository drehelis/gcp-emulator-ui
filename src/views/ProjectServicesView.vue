<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Project Services
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage your Google Cloud emulator services
        </p>
      </div>

      <!-- Services Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Services
          </h2>
        </div>

        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <!-- PubSub Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !pubsubConnected }"
            @click="navigateToService('pubsub')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    pubsubConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  ]"
                >
                  <!-- Pub/Sub Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      pubsubConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500'
                    ]"
                    viewBox="0 0 75 81"
                    fill="none"
                  >
                    <g>
                      <circle cx="12.037" cy="12.037" fill="currentColor" opacity="0.4" r="11.537" transform="matrix(-.5 -.866025 .866025 -.5 32.928631 57.219606)"/>
                      <circle cx="7.69" cy="7.69" fill="currentColor" opacity="0.7" r="7.19" transform="matrix(-.5 -.866025 .866025 -.5 62.371209 35.20122)"/>
                      <circle cx="7.69" cy="7.69" fill="currentColor" opacity="0.7" r="7.19" transform="matrix(-.5 .866025 -.866025 -.5 19.121192 22.748398)"/>
                      <circle cx="37.151" cy="9.3" fill="currentColor" opacity="0.4" r="8.8"/>
                      <circle cx="37.151" cy="73.62" fill="currentColor" opacity="0.7" r="6.88"/>
                      <circle cx="9.696" cy="9.696" fill="currentColor" opacity="0.4" r="9.196" transform="matrix(-.5 -.866025 .866025 -.5 5.934033 70.102014)"/>
                      <path fill="currentColor" d="M23.529 45.63l-8.724 5.037a8.82 8.82 0 0 1 2.116 2.474 8.82 8.82 0 0 1 1.084 3.069l8.724-5.037c-.717-.773-1.36-1.639-1.91-2.592s-.979-1.943-1.29-2.95z"/>
                      <circle cx="9.696" cy="9.696" fill="currentColor" opacity="0.4" r="9.196" transform="matrix(-.5 .866025 -.866025 -.5 77.564768 54.174005)"/>
                      <path d="M47.576 51.173c1.497-1.6 2.58-3.502 3.204-5.54l8.718 5.033c-.829.666-1.551 1.495-2.116 2.474a8.82 8.82 0 0 0-1.084 3.069zm-7.225-23.602a14.17 14.17 0 0 0-6.4.005V17.504a8.82 8.82 0 0 0 6.4 0z" fill="currentColor"/>
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      pubsubConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    ]"
                  >
                    Pub/Sub
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      pubsubConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    ]"
                  >
                    <span v-if="pubsubConnected">Topics, subscriptions, and messages</span>
                    <span v-else>Emulator not running</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-3">

                <!-- Arrow -->
                <ArrowTopRightOnSquareIcon
                  v-if="pubsubConnected"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
                <ExclamationTriangleIcon
                  v-else
                  class="w-4 h-4 text-red-600 dark:text-red-400"
                />
              </div>
            </div>
          </div>

          <!-- Cloud Storage Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !storageConnected }"
            @click="navigateToService('storage')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    storageConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  ]"
                >
                  <!-- Storage Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      storageConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500'
                    ]"
                    viewBox="0 0 81 65"
                    fill="none"
                  >
                    <g>
                      <path d="M0.5 0.5h80v28h-80z" fill="currentColor" opacity="0.3"/>
                      <path d="M72.5 0.5h8v28h-8z" fill="currentColor" opacity="0.6"/>
                      <path d="M80.5 0.5h-8v28l8-28z" fill="currentColor" opacity="0.8"/>
                      <path d="M0.5 0.5h8v28h-8z" fill="currentColor" opacity="0.6"/>
                      <path d="M16.5 12.5h24v4h-24z" fill="currentColor"/>
                      <circle cx="58.5" cy="14.5" r="6" fill="currentColor"/>
                      <path d="M0.5 36.5h80v28h-80z" fill="currentColor" opacity="0.3"/>
                      <path d="M72.5 36.5h8v28h-8z" fill="currentColor" opacity="0.6"/>
                      <path d="M80.5 36.5h-8v28l8-28z" fill="currentColor" opacity="0.8"/>
                      <path d="M0.5 36.5h8v28h-8z" fill="currentColor" opacity="0.6"/>
                      <path d="M16.5 48.5h24v4h-24z" fill="currentColor"/>
                      <circle cx="58.5" cy="50.5" r="6" fill="currentColor"/>
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      storageConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    ]"
                  >
                    Cloud Storage
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      storageConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    ]"
                  >
                    <span v-if="storageConnected">Buckets and objects</span>
                    <span v-else>Emulator not running</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-3">

                <!-- Arrow -->
                <ArrowTopRightOnSquareIcon
                  v-if="storageConnected"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
                <ExclamationTriangleIcon
                  v-else
                  class="w-4 h-4 text-red-600 dark:text-red-400"
                />
              </div>
            </div>
          </div>

          <!-- Firestore Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !firestoreConnected }"
            @click="navigateToService('firestore')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    firestoreConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  ]"
                >
                  <!-- Firestore Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      firestoreConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500'
                    ]"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <g>
                      <path fill="currentColor" opacity="0.8" d="M21,13,12,9v4l9,4Zm0-7L12,2V6l9,4Z"/>
                      <polygon fill="currentColor" opacity="0.6" points="3 6 12 2 12 6 3 10 3 6"/>
                      <polygon fill="currentColor" opacity="0.6" points="3 13 12 9 12 13 3 17 3 13"/>
                      <polygon fill="currentColor" points="12 18 15.37 16.5 19.88 18.5 12 22 12 18"/>
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      firestoreConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    ]"
                  >
                    Firestore
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      firestoreConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    ]"
                  >
                    <span v-if="firestoreConnected">Collections and documents</span>
                    <span v-else>Emulator not running</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <!-- Arrow -->
                <ArrowTopRightOnSquareIcon
                  v-if="firestoreConnected"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
                <ExclamationTriangleIcon
                  v-else
                  class="w-4 h-4 text-red-600 dark:text-red-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useServiceConnections } from '@/composables/useServiceConnections'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const projectsStore = useProjectsStore()
const {
  pubsubConnected,
  storageConnected,
  firestoreConnected,
  checkAllConnections
} = useServiceConnections()

// UI state
const isCheckingConnections = ref(false)

const currentProjectId = computed(() => {
  return route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown'
})


const checkAllConnectionsWithLoading = async () => {
  isCheckingConnections.value = true
  try {
    await checkAllConnections()
  } finally {
    isCheckingConnections.value = false
  }
}

const navigateToService = (service: 'pubsub' | 'storage' | 'firestore') => {
  // Don't navigate if service is disconnected
  if (service === 'pubsub' && !pubsubConnected.value) {
    appStore.showToast({
      type: 'error',
      title: 'Service Unavailable',
      message: 'Pub/Sub emulator is not running or unreachable'
    })
    return
  }

  if (service === 'storage' && !storageConnected.value) {
    appStore.showToast({
      type: 'error',
      title: 'Service Unavailable',
      message: 'Storage emulator is not running or unreachable'
    })
    return
  }

  if (service === 'firestore' && !firestoreConnected.value) {
    appStore.showToast({
      type: 'error',
      title: 'Service Unavailable',
      message: 'Firestore emulator is not running or unreachable'
    })
    return
  }

  const projectId = currentProjectId.value

  if (service === 'pubsub') {
    router.push(`/projects/${projectId}/pubsub/topics`)
  } else if (service === 'storage') {
    router.push(`/projects/${projectId}/storage/buckets`)
  } else if (service === 'firestore') {
    router.push(`/projects/${projectId}/firestore/collections`)
  }
}

// Check connections on mount
onMounted(() => {
  checkAllConnectionsWithLoading()
})
</script>