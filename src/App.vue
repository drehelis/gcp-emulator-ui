<template>
  <router-view />

  <!-- Global toast notifications -->
  <Teleport to="body">
    <div id="toast-container"></div>
  </Teleport>

  <!-- Global modals -->
  <Teleport to="body">
    <div id="modal-container">
      <component
        v-for="modal in appStore.modals"
        :key="modal.id"
        :is="modal.component"
        v-bind="modal.props"
        @close="result => appStore.closeModal(modal.id, result)"
      />
    </div>
  </Teleport>

  <!-- Global loading removed to avoid duplicate with index.html loading screen -->

  <!-- PWA update prompt -->
  <Transition
    enter-active-class="transition-transform"
    leave-active-class="transition-transform"
    enter-from-class="transform translate-y-full"
    leave-to-class="transform translate-y-full"
  >
    <div
      v-if="showUpdatePrompt"
      class="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm"
    >
      <div class="flex items-start space-x-3">
        <div class="shrink-0">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">Update Available</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A new version of the app is available. Refresh to get the latest features.
          </p>
          <div class="mt-3 flex space-x-2">
            <button
              @click="refreshApp"
              class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            >
              Refresh
            </button>
            <button
              @click="dismissUpdatePrompt"
              class="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          @click="dismissUpdatePrompt"
          class="shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// PWA update handling
const showUpdatePrompt = ref(false)
let updateSW: (() => Promise<void>) | undefined

// Handle online/offline status
function handleOnline() {
  // Connection restored - could implement red ribbon dismissal here
}

function handleOffline() {
  // Network offline - could implement red ribbon display here
}

// Register all lifecycle hooks before any async operations
onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

onMounted(async () => {
  // Register PWA update handler
  if ('serviceWorker' in navigator) {
    const { registerSW } = await import('virtual:pwa-register')

    updateSW = registerSW({
      onNeedRefresh() {
        showUpdatePrompt.value = true
      },
      onOfflineReady() {
        appStore.showToast({
          type: 'success',
          title: 'Ready for offline use',
          message: 'The app has been cached and is ready to work offline',
        })
      },
      onRegisterError(error) {
        console.error('SW registration error:', error)
        appStore.showToast({
          type: 'error',
          title: 'Service Worker Error',
          message: 'Failed to register service worker',
        })
      },
    })
  }

  // Add event listeners for online/offline status
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

function refreshApp() {
  if (updateSW) {
    updateSW()
  } else {
    window.location.reload()
  }
}

function dismissUpdatePrompt() {
  showUpdatePrompt.value = false
}
</script>

<style>
/* Global CSS custom properties for theming */
:root {
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  --color-primary-300: #7dd3fc;
  --color-primary-400: #38bdf8;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  --color-primary-800: #075985;
  --color-primary-900: #0c4a6e;
  --color-primary-950: #082f49;
}

.dark {
  color-scheme: dark;
}

/* Hide I-beam cursor but keep text selectable */
* {
  cursor: default !important;
}

/* Only show text cursor on actual input elements */
input,
textarea,
[contenteditable='true'] {
  cursor: text !important;
  caret-color: auto !important;
}

/* Pointer cursor for interactive elements */
button,
a,
[role='button'],
.cursor-pointer,
button *,
a *,
[role='button'] * {
  cursor: pointer !important;
}

/* Hide blinking caret on non-input elements */
*:not(input):not(textarea):not([contenteditable='true']) {
  caret-color: transparent;
}

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f3f4f6;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 50px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark ::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Focus styles for accessibility */
.focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6;
}

/* Vue transition classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--theme-transition-duration) var(--theme-transition-timing);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform var(--theme-transition-duration) var(--theme-transition-timing);
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* Loading animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Toast notification customizations */
.Vue-Toastification__container {
  z-index: 9999;
}

/* Base toast styling for light/dark mode */
.Vue-Toastification__toast {
  background-color: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  transition:
    background-color var(--theme-transition-duration) var(--theme-transition-timing),
    color var(--theme-transition-duration) var(--theme-transition-timing),
    border-color var(--theme-transition-duration) var(--theme-transition-timing);
}

.dark .Vue-Toastification__toast {
  background-color: #1f2937;
  color: #f9fafb;
  border: 1px solid #374151;
}

/* Toast type-specific colors */
.Vue-Toastification__toast--success {
  background-color: #10b981;
  color: white;
}

.Vue-Toastification__toast--error {
  background-color: #ef4444;
  color: white;
}

.Vue-Toastification__toast--warning {
  background-color: #f59e0b;
  color: white;
}

.Vue-Toastification__toast--info {
  background-color: #3b82f6;
  color: white;
}

/* Progress bar styling for dark mode */
.Vue-Toastification__progress-bar {
  background-color: rgba(255, 255, 255, 0.7);
}

.dark .Vue-Toastification__progress-bar {
  background-color: rgba(255, 255, 255, 0.8);
}

/* Close button styling for dark mode */
.Vue-Toastification__close-button {
  color: rgba(255, 255, 255, 0.8);
}

.dark .Vue-Toastification__close-button {
  color: rgba(255, 255, 255, 0.9);
}

/* Icon styling for better contrast in dark mode */
.Vue-Toastification__icon {
  color: white;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-primary-500: #0066cc;
    --color-primary-600: #0052a3;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
