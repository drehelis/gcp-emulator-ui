<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition-bg">
    <!-- Minimal header with close button -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 theme-transition-colors"
    >
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <img class="h-8 w-auto" src="/logo.svg" alt="GCP Emulator UI" />
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ pageTitle }}
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Theme toggle -->
            <button
              @click="toggleTheme"
              class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <SunIcon v-if="isDark" class="h-5 w-5" />
              <MoonIcon v-else class="h-5 w-5" />
            </button>

            <!-- Close/Back button -->
            <button
              @click="goBack"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <XMarkIcon class="h-4 w-4 mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SunIcon, MoonIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const pageTitle = computed(() => appStore.pageTitle)
const isDark = computed(() => appStore.theme === 'dark')

const toggleTheme = () => {
  appStore.toggleTheme()
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
/* Fullscreen layout specific styles */
</style>
