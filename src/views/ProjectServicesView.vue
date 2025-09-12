<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Choose a Service
        </h1>
      </div>

      <!-- Service cards -->
      <div v-if="hasAnyServices" class="grid grid-cols-1 gap-8 max-w-4xl" :class="{ 'md:grid-cols-2': isPubSubEnabled && isCloudStorageEnabled }">
        <!-- PubSub Service -->
        <div 
          v-if="isPubSubEnabled"
          @click="navigateToService('pubsub')"
          class="relative group cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
        >
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 h-full flex flex-col items-center text-center">
            <!-- Icon container -->
            <div class="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors duration-200">
              <!-- Official Google Pub/Sub Icon -->
              <svg class="w-10 h-10 text-amber-600 dark:text-amber-400" viewBox="0 0 75 81" fill="none" aria-hidden="true">
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
            
            <!-- Title and description -->
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Pub/Sub
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-1">
              Manage topics, subscriptions, and messages in Google Cloud Pub/Sub emulator
            </p>
            
            
            <!-- Hover effect arrow -->
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowTopRightOnSquareIcon class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <!-- Cloud Storage Service -->
        <div 
          v-if="isCloudStorageEnabled"
          @click="navigateToService('storage')"
          class="relative group cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
        >
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 h-full flex flex-col items-center text-center">
            <!-- Icon container -->
            <div class="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors duration-200">
              <!-- Custom Google Cloud Storage Icon -->
              <svg class="w-10 h-10 text-amber-600 dark:text-amber-400" viewBox="0 0 81 65" fill="none" aria-hidden="true">
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
            
            <!-- Title and description -->
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Cloud Storage
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-1">
              Manage buckets and objects in Google Cloud Storage emulator
            </p>
            
            
            <!-- Hover effect arrow -->
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowTopRightOnSquareIcon class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- No services enabled message -->
      <div v-else class="text-center py-12">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-auto">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Services Available
          </h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            No services are currently enabled. Check your environment configuration.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const projectsStore = useProjectsStore()

const currentProjectId = computed(() => {
  return route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown'
})

const isPubSubEnabled = computed(() => {
  return import.meta.env.VITE_ENABLE_PUBSUB === 'true'
})

const isCloudStorageEnabled = computed(() => {
  return import.meta.env.VITE_ENABLE_CLOUD_STORAGE === 'true'
})

const hasAnyServices = computed(() => {
  return isPubSubEnabled.value || isCloudStorageEnabled.value
})

const navigateToService = (service: 'pubsub' | 'storage') => {
  const projectId = currentProjectId.value
  
  if (service === 'pubsub') {
    router.push(`/projects/${projectId}/pubsub/topics`)
  } else if (service === 'storage') {
    router.push(`/projects/${projectId}/storage/buckets`)
  }
}
</script>