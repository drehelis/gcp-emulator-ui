<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Project Services</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage your Google Cloud emulator services
        </p>
      </div>

      <!-- Services Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Services</h2>
        </div>

        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <!-- PubSub Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !pubsubConnected }"
            @click="navigateToService('pubsub')"
          >
            <div class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    pubsubConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700',
                  ]"
                >
                  <!-- Pub/Sub Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      pubsubConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                    viewBox="0 0 75 81"
                    fill="none"
                  >
                    <g>
                      <circle
                        cx="12.037"
                        cy="12.037"
                        fill="currentColor"
                        opacity="0.4"
                        r="11.537"
                        transform="matrix(-.5 -.866025 .866025 -.5 32.928631 57.219606)"
                      />
                      <circle
                        cx="7.69"
                        cy="7.69"
                        fill="currentColor"
                        opacity="0.7"
                        r="7.19"
                        transform="matrix(-.5 -.866025 .866025 -.5 62.371209 35.20122)"
                      />
                      <circle
                        cx="7.69"
                        cy="7.69"
                        fill="currentColor"
                        opacity="0.7"
                        r="7.19"
                        transform="matrix(-.5 .866025 -.866025 -.5 19.121192 22.748398)"
                      />
                      <circle cx="37.151" cy="9.3" fill="currentColor" opacity="0.4" r="8.8" />
                      <circle cx="37.151" cy="73.62" fill="currentColor" opacity="0.7" r="6.88" />
                      <circle
                        cx="9.696"
                        cy="9.696"
                        fill="currentColor"
                        opacity="0.4"
                        r="9.196"
                        transform="matrix(-.5 -.866025 .866025 -.5 5.934033 70.102014)"
                      />
                      <path
                        fill="currentColor"
                        d="M23.529 45.63l-8.724 5.037a8.82 8.82 0 0 1 2.116 2.474 8.82 8.82 0 0 1 1.084 3.069l8.724-5.037c-.717-.773-1.36-1.639-1.91-2.592s-.979-1.943-1.29-2.95z"
                      />
                      <circle
                        cx="9.696"
                        cy="9.696"
                        fill="currentColor"
                        opacity="0.4"
                        r="9.196"
                        transform="matrix(-.5 .866025 -.866025 -.5 77.564768 54.174005)"
                      />
                      <path
                        d="M47.576 51.173c1.497-1.6 2.58-3.502 3.204-5.54l8.718 5.033c-.829.666-1.551 1.495-2.116 2.474a8.82 8.82 0 0 0-1.084 3.069zm-7.225-23.602a14.17 14.17 0 0 0-6.4.005V17.504a8.82 8.82 0 0 0 6.4 0z"
                        fill="currentColor"
                      />
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      pubsubConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400',
                    ]"
                  >
                    Pub/Sub
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      pubsubConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500',
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
                <button
                  v-else
                  type="button"
                  aria-label="Reconnect Pub/Sub emulator"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  @click.stop="reconnectService('pubsub')"
                >
                  <ArrowPathIcon
                    class="w-4 h-4 text-amber-600 dark:text-amber-400"
                    :class="{ 'animate-spin': reconnectingService === 'pubsub' }"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Cloud Storage Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !storageConnected }"
            @click="navigateToService('storage')"
          >
            <div class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    storageConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700',
                  ]"
                >
                  <!-- Storage Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      storageConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                    viewBox="0 0 81 65"
                    fill="none"
                  >
                    <g>
                      <path d="M0.5 0.5h80v28h-80z" fill="currentColor" opacity="0.3" />
                      <path d="M72.5 0.5h8v28h-8z" fill="currentColor" opacity="0.6" />
                      <path d="M80.5 0.5h-8v28l8-28z" fill="currentColor" opacity="0.8" />
                      <path d="M0.5 0.5h8v28h-8z" fill="currentColor" opacity="0.6" />
                      <path d="M16.5 12.5h24v4h-24z" fill="currentColor" />
                      <circle cx="58.5" cy="14.5" r="6" fill="currentColor" />
                      <path d="M0.5 36.5h80v28h-80z" fill="currentColor" opacity="0.3" />
                      <path d="M72.5 36.5h8v28h-8z" fill="currentColor" opacity="0.6" />
                      <path d="M80.5 36.5h-8v28l8-28z" fill="currentColor" opacity="0.8" />
                      <path d="M0.5 36.5h8v28h-8z" fill="currentColor" opacity="0.6" />
                      <path d="M16.5 48.5h24v4h-24z" fill="currentColor" />
                      <circle cx="58.5" cy="50.5" r="6" fill="currentColor" />
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      storageConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400',
                    ]"
                  >
                    Cloud Storage
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      storageConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500',
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
                <button
                  v-else
                  type="button"
                  aria-label="Reconnect Storage emulator"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  @click.stop="reconnectService('storage')"
                >
                  <ArrowPathIcon
                    class="w-4 h-4 text-amber-600 dark:text-amber-400"
                    :class="{ 'animate-spin': reconnectingService === 'storage' }"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Firestore Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !firestoreConnected }"
            @click="navigateToService('firestore')"
          >
            <div class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    firestoreConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700',
                  ]"
                >
                  <!-- Firestore Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      firestoreConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <g>
                      <path
                        fill="currentColor"
                        opacity="0.8"
                        d="M21,13,12,9v4l9,4Zm0-7L12,2V6l9,4Z"
                      />
                      <polygon fill="currentColor" opacity="0.6" points="3 6 12 2 12 6 3 10 3 6" />
                      <polygon
                        fill="currentColor"
                        opacity="0.6"
                        points="3 13 12 9 12 13 3 17 3 13"
                      />
                      <polygon
                        fill="currentColor"
                        points="12 18 15.37 16.5 19.88 18.5 12 22 12 18"
                      />
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      firestoreConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400',
                    ]"
                  >
                    Firestore
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      firestoreConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500',
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
                <button
                  v-else
                  type="button"
                  aria-label="Reconnect Firestore emulator"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  @click.stop="reconnectService('firestore')"
                >
                  <ArrowPathIcon
                    class="w-4 h-4 text-amber-600 dark:text-amber-400"
                    :class="{ 'animate-spin': reconnectingService === 'firestore' }"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Datastore Service -->
          <div
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-75': !datastoreConnected }"
            @click="navigateToService('datastore')"
          >
            <div class="flex items-center justify-between cursor-pointer">
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="[
                    datastoreConnected
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-gray-100 dark:bg-gray-700',
                  ]"
                >
                  <!-- Datastore Icon -->
                  <svg
                    class="w-6 h-6"
                    :class="[
                      datastoreConnected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                    viewBox="0 0 24 24"
                  >
                    <g>
                      <polygon fill="currentColor" opacity="0.4" points="7 6 8 5 2 5 3 6 7 6" />
                      <polygon fill="currentColor" opacity="0.7" points="7 6 7 10 8 11 8 5 7 6" />
                      <polygon fill="currentColor" opacity="0.4" points="3 6 2 5 2 11 3 10 3 6" />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="3 10 2 11 8 11 7 10 3 10"
                      />
                      <rect fill="currentColor" opacity="0.4" x="3" y="6" width="4" height="4" />
                      <polygon fill="currentColor" opacity="0.8" points="14 6 15 5 9 5 10 6 14 6" />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="14 6 14 10 15 11 15 5 14 6"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="10 6 9 5 9 11 10 10 10 6"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="10 10 9 11 15 11 14 10 10 10"
                      />
                      <rect fill="currentColor" opacity="1" x="10" y="6" width="4" height="4" />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="21 6 22 5 16 5 17 6 21 6"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="21 6 21 10 22 11 22 5 21 6"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="17 6 16 5 16 11 17 10 17 6"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="17 10 16 11 22 11 21 10 17 10"
                      />
                      <rect fill="currentColor" opacity="1" x="17" y="6" width="4" height="4" />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="7 14 8 13 2 13 3 14 7 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="7 14 7 18 8 19 8 13 7 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="3 14 2 13 2 19 3 18 3 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="3 18 2 19 8 19 7 18 3 18"
                      />
                      <rect fill="currentColor" opacity="1" x="3" y="14" width="4" height="4" />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="14 14 15 13 9 13 10 14 14 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.7"
                        points="14 14 14 18 15 19 15 13 14 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="10 14 9 13 9 19 10 18 10 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="10 18 9 19 15 19 14 18 10 18"
                      />
                      <rect fill="currentColor" opacity="0.4" x="10" y="14" width="4" height="4" />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="21 14 22 13 16 13 17 14 21 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.7"
                        points="21 14 21 18 22 19 22 13 21 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.4"
                        points="17 14 16 13 16 19 17 18 17 14"
                      />
                      <polygon
                        fill="currentColor"
                        opacity="0.8"
                        points="17 18 16 19 22 19 21 18 17 18"
                      />
                      <rect fill="currentColor" opacity="0.4" x="17" y="14" width="4" height="4" />
                    </g>
                  </svg>
                </div>

                <div>
                  <h3
                    class="text-sm font-medium"
                    :class="[
                      datastoreConnected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400',
                    ]"
                  >
                    Datastore
                  </h3>
                  <p
                    class="text-xs"
                    :class="[
                      datastoreConnected
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500',
                    ]"
                  >
                    <span v-if="datastoreConnected">Entity kinds and namespaces</span>
                    <span v-else>Emulator not running</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <!-- Arrow -->
                <ArrowTopRightOnSquareIcon
                  v-if="datastoreConnected"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
                <button
                  v-else
                  type="button"
                  aria-label="Reconnect Datastore emulator"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  @click.stop="reconnectService('datastore')"
                >
                  <ArrowPathIcon
                    class="w-4 h-4 text-amber-600 dark:text-amber-400"
                    :class="{ 'animate-spin': reconnectingService === 'datastore' }"
                  />
                </button>
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
import { ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
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
  datastoreConnected,
  checkAllConnections,
  checkServiceConnection,
} = useServiceConnections()

// UI state
const isCheckingConnections = ref(false)
const reconnectingService = ref<string | null>(null)

const currentProjectId = computed(() => {
  return (route.params.projectId as string) || projectsStore.selectedProjectId || 'Unknown'
})

const reconnectService = async (service: 'pubsub' | 'storage' | 'firestore' | 'datastore') => {
  reconnectingService.value = service
  try {
    const connected = await checkServiceConnection(service)
    if (connected) {
      appStore.showToast({
        type: 'success',
        title: 'Connected',
        message: `${service.charAt(0).toUpperCase() + service.slice(1)} emulator is now connected`,
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Connection Failed',
        message: `${service.charAt(0).toUpperCase() + service.slice(1)} emulator is still unreachable`,
      })
    }
  } finally {
    reconnectingService.value = null
  }
}

const checkAllConnectionsWithLoading = async () => {
  isCheckingConnections.value = true
  try {
    await checkAllConnections()
  } finally {
    isCheckingConnections.value = false
  }
}

const navigateToService = (service: 'pubsub' | 'storage' | 'firestore' | 'datastore') => {
  // If service is disconnected, attempt reconnect instead of navigating
  if (service === 'pubsub' && !pubsubConnected.value) {
    reconnectService('pubsub')
    return
  }

  if (service === 'storage' && !storageConnected.value) {
    reconnectService('storage')
    return
  }

  if (service === 'firestore' && !firestoreConnected.value) {
    reconnectService('firestore')
    return
  }

  if (service === 'datastore' && !datastoreConnected.value) {
    reconnectService('datastore')
    return
  }

  const projectId = currentProjectId.value

  if (service === 'pubsub') {
    router.push(`/projects/${projectId}/pubsub/topics`)
  } else if (service === 'storage') {
    router.push(`/projects/${projectId}/storage/buckets`)
  } else if (service === 'firestore') {
    router.push(`/projects/${projectId}/firestore/collections`)
  } else if (service === 'datastore') {
    router.push(`/projects/${projectId}/datastore/namespaces`)
  }
}

// Check connections on mount
onMounted(() => {
  checkAllConnectionsWithLoading()
})
</script>
