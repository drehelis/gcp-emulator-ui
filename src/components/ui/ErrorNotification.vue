<template>
  <div
    v-if="show"
    class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ message }}
          </p>
        </div>
      </div>
      <div v-if="showClearButton" class="flex-shrink-0">
        <button
          @click="$emit('clear')"
          class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md px-2 py-1"
        >
          {{ clearButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  message: string
  showClearButton?: boolean
  clearButtonLabel?: string
}

interface Emits {
  clear: []
}

withDefaults(defineProps<Props>(), {
  showClearButton: true,
  clearButtonLabel: 'Dismiss',
})

defineEmits<Emits>()
</script>
