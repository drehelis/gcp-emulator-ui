<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="transform -translate-y-full opacity-0"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div 
      v-if="showWarning"
      class="fixed top-0 left-0 right-0 z-50 bg-red-600 dark:bg-red-700 text-white shadow-lg"
    >
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <!-- Warning Icon -->
            <svg 
              class="w-5 h-5 text-red-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            
            <div>
              <h3 class="font-medium text-sm">
                {{ warningTitle }}
              </h3>
              <p class="text-xs text-red-200 mt-0.5">
                {{ warningMessage }}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Retry button -->
            <button
              v-if="canRetry"
              @click="handleRetry"
              :disabled="isRetrying"
              class="flex items-center space-x-1 px-3 py-1 bg-red-700 hover:bg-red-800 disabled:bg-red-800 disabled:opacity-50 rounded-md text-xs font-medium transition-colors"
            >
              <svg 
                v-if="isRetrying"
                class="w-3 h-3 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <svg 
                v-else
                class="w-3 h-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{{ isRetrying ? 'Retrying...' : 'Retry' }}</span>
            </button>

            <!-- Dismiss button -->
            <button
              v-if="canDismiss"
              @click="handleDismiss"
              class="flex items-center justify-center w-6 h-6 hover:bg-red-700 rounded-full transition-colors"
              :title="'Dismiss warning'"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApiConnection } from '@/composables/useApiConnection'

interface Props {
  show?: boolean
  title?: string
  message?: string
  canRetry?: boolean
  canDismiss?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: 'Connection Issue',
  message: 'Unable to connect to the API server',
  canRetry: true,
  canDismiss: true,
  persistent: false
})

const emit = defineEmits<{
  dismiss: []
  retry: []
}>()

const { retryConnection, connectionState } = useApiConnection()
const isRetrying = ref(false)
const isDismissed = ref(false)

const showWarning = computed(() => {
  if (!props.show || isDismissed.value) return false
  if (props.persistent) return true
  return connectionState.value.status === 'disconnected' || 
         connectionState.value.status === 'error'
})

const warningTitle = computed(() => {
  if (props.title !== 'Connection Issue') return props.title
  
  const status = connectionState.value.status
  if (status === 'disconnected') return 'API Server Unreachable'
  if (status === 'error') return 'API Connection Error'
  return 'Connection Issue'
})

const warningMessage = computed(() => {
  if (props.message !== 'Unable to connect to the API server') return props.message
  
  return connectionState.value.error || 'Unable to connect to the API server. Please check your connection and server status.'
})

async function handleRetry() {
  if (isRetrying.value) return
  
  isRetrying.value = true
  isDismissed.value = false
  
  try {
    const success = await retryConnection()
    if (success) {
      isDismissed.value = true
    }
  } finally {
    isRetrying.value = false
  }
  
  emit('retry')
}

function handleDismiss() {
  isDismissed.value = true
  emit('dismiss')
}
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>