<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Import/Export
          </h2>
          <!-- Invisible button to maintain consistent header height with topics list -->
          <div class="invisible">
            <button class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md">
              <span>Placeholder</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Emulators Running Message -->
    <div v-if="availableTabs.length === 0" class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-bg">
      <div class="px-6 py-8 text-center">
        <div class="mb-4">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Emulators Running</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Start an emulator to use the import/export functionality.
        </p>
        <button
          @click="checkAllConnectionsAndUpdateTabs(true)"
          :disabled="isCheckingConnections"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon :class="['h-4 w-4 mr-2', isCheckingConnections && 'animate-spin']" />
          {{ isCheckingConnections ? 'Checking...' : 'Check Connections' }}
        </button>
      </div>
    </div>

    <!-- Service Selection Tabs -->
    <div v-if="availableTabs.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5 mr-2 inline-block" />
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- PubSub Tab Content -->
    <div v-if="availableTabs.length > 0 && activeTab === 'pubsub'">
      <PubSubImportExport :project-id="currentProjectId" />
    </div>

    <!-- Storage Tab Content -->
    <div v-if="availableTabs.length > 0 && activeTab === 'storage'">
      <StorageImportExport :project-id="currentProjectId" />
    </div>

    <!-- Firestore Tab Content -->
    <div v-if="availableTabs.length > 0 && activeTab === 'firestore'">
      <FirestoreImportExport :project-id="currentProjectId" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useServiceConnections } from '@/composables/useServiceConnections'
import {
  ArrowPathIcon,
  QueueListIcon,
  ArchiveBoxIcon,
  CircleStackIcon
} from '@heroicons/vue/24/outline'
import PubSubImportExport from '@/components/import-export/PubSubImportExport.vue'
import StorageImportExport from '@/components/import-export/StorageImportExport.vue'
import FirestoreImportExport from '@/components/import-export/FirestoreImportExport.vue'

const route = useRoute()
const appStore = useAppStore()
const {
  pubsubConnected,
  storageConnected,
  firestoreConnected,
  checkAllConnections
} = useServiceConnections()

// Component state
const activeTab = ref('pubsub')
const isCheckingConnections = ref(false)

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)

const availableTabs = computed(() => {
  const tabs = []

  // Only show PubSub tab if connected
  if (pubsubConnected.value) {
    tabs.push({
      id: 'pubsub',
      name: 'Pub/Sub',
      icon: QueueListIcon
    })
  }

  // Only show Storage tab if connected
  if (storageConnected.value) {
    tabs.push({
      id: 'storage',
      name: 'Storage',
      icon: ArchiveBoxIcon
    })
  }

  // Only show Firestore tab if connected
  if (firestoreConnected.value) {
    tabs.push({
      id: 'firestore',
      name: 'Firestore',
      icon: CircleStackIcon
    })
  }

  return tabs
})

// Method to check all connections and handle tab switching
const checkAllConnectionsAndUpdateTabs = async (showToast = false) => {
  isCheckingConnections.value = true
  try {
    const status = await checkAllConnections()

    // Switch to first available tab if current tab is not available
    if (availableTabs.value.length > 0) {
      const currentTabAvailable = availableTabs.value.some(tab => tab.id === activeTab.value)
      if (!currentTabAvailable) {
        activeTab.value = availableTabs.value[0].id
      }

      // Show success message with what's connected (only if showToast is true)
      if (showToast) {
        const connected = []
        if (status.pubsub) connected.push('Pub/Sub')
        if (status.storage) connected.push('Storage')
        if (status.firestore) connected.push('Firestore')

        appStore.showToast({
          type: 'success',
          title: 'Emulators found',
          message: `Connected to: ${connected.join(', ')}`
        })
      }
    } else {
      // Show info message if still no connections (only if showToast is true)
      if (showToast) {
        appStore.showToast({
          type: 'info',
          title: 'No emulators detected',
          message: 'Make sure an emulator is running and try again'
        })
      }
    }
  } finally {
    isCheckingConnections.value = false
  }
}

// Watch availableTabs to switch to first available tab
watch(availableTabs, (newTabs) => {
  if (newTabs.length > 0) {
    const currentTabAvailable = newTabs.some(tab => tab.id === activeTab.value)
    if (!currentTabAvailable) {
      activeTab.value = newTabs[0].id
    }
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  // Check connections first
  await checkAllConnectionsAndUpdateTabs()
})
</script>
