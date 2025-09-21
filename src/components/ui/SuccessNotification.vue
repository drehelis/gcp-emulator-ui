<template>
  <div
    v-if="show"
    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800 dark:text-green-200">
            {{ message }}
          </p>
        </div>
      </div>
      <div v-if="showClearButton" class="flex-shrink-0">
        <button
          @click="$emit('clear')"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1"
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
  clearButtonLabel: 'Clear field values'
})

defineEmits<Emits>()
</script>