<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger button -->
    <button
      @click="toggle"
      type="button"
      class="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      :class="{ 'text-gray-400 dark:text-gray-400': !modelValue }"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center min-w-0">
          <slot name="icon" />
          <span class="truncate">{{ selectedLabel }}</span>
        </div>
        <svg
          class="h-4 w-4 text-gray-400 shrink-0 transition-transform"
          :class="{ 'rotate-180': isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="isOpen"
      class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg"
    >
      <!-- Search (only when options exceed threshold) -->
      <div
        v-if="options.length > searchThreshold"
        class="p-2 border-b border-gray-200 dark:border-gray-600"
      >
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            :placeholder="searchPlaceholder"
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            @click.stop
          />
        </div>
      </div>

      <!-- Options list -->
      <div class="max-h-48 overflow-auto">
        <!-- Clear option -->
        <button
          v-if="clearable"
          @click="select('')"
          type="button"
          class="w-full px-3 py-2 text-left text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 italic"
        >
          {{ clearLabel }}
        </button>

        <!-- Items -->
        <button
          v-for="option in filteredOptions"
          :key="option.value"
          @click="select(option.value)"
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors"
          :class="{
            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400':
              modelValue === option.value,
            'text-gray-900 dark:text-white': modelValue !== option.value,
          }"
        >
          <div class="flex items-center">
            <slot name="option-icon" :option="option" />
            <span class="truncate">{{ option.label }}</span>
            <svg
              v-if="modelValue === option.value"
              class="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </button>

        <!-- Empty state -->
        <div
          v-if="filteredOptions.length === 0"
          class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ query ? noResultsText : emptyText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

export interface DropdownOption {
  value: string
  label: string
}

interface Props {
  modelValue: string
  options: DropdownOption[]
  placeholder?: string
  searchPlaceholder?: string
  searchThreshold?: number
  clearable?: boolean
  clearLabel?: string
  emptyText?: string
  noResultsText?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  searchPlaceholder: 'Search...',
  searchThreshold: 5,
  clearable: false,
  clearLabel: 'None',
  emptyText: 'No options available',
  noResultsText: 'No options match your search',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const query = ref('')
const containerRef = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  return props.options.find(o => o.value === props.modelValue)?.label ?? props.modelValue
})

const filteredOptions = computed(() => {
  if (!query.value.trim()) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(
    o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
  )
})

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value && props.options.length > props.searchThreshold) {
    nextTick(() => searchInput.value?.focus())
  }
}

const select = (value: string) => {
  emit('update:modelValue', value)
  isOpen.value = false
  query.value = ''
}

// Close on outside click
const onClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
    query.value = ''
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

// Reset query when closed
watch(isOpen, open => {
  if (!open) query.value = ''
})
</script>
