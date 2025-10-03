<template>
  <div class="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
    <div class="flex items-center justify-end">
      <div class="flex items-center gap-3">
        <!-- Rows per page selector -->
        <div class="flex items-center gap-1.5">
          <label class="text-xs text-gray-500 dark:text-gray-400">Rows:</label>
          <select
            :value="limit"
            @change="handleLimitChange"
            class="px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option v-for="option in limitOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <!-- Pagination controls -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-600 dark:text-gray-400">
            {{ paginationStart }}–{{ paginationEnd }}{{ hasMore ? '+' : '' }}
          </span>
          <div class="flex items-center gap-1">
            <button
              @click="$emit('previous')"
              :disabled="currentPage === 1"
              class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <button
              @click="$emit('next')"
              :disabled="!hasMore"
              class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface Props {
  limit: number
  currentPage: number
  paginationStart: number
  paginationEnd: number
  hasMore: boolean
  limitOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  limitOptions: () => [10, 25, 50, 100]
})

const emit = defineEmits<{
  'update:limit': [value: number]
  'limit-change': []
  next: []
  previous: []
}>()

const handleLimitChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newLimit = Number(target.value)
  emit('update:limit', newLimit)
  emit('limit-change')
}
</script>
