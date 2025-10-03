<template>
  <Listbox v-model="selected" :disabled="disabled">
    <div class="relative">
      <ListboxButton
        :class="[
          'relative w-full cursor-pointer rounded-md py-2 pl-3 pr-8 text-left text-sm transition-colors',
          'border focus:outline-none focus:ring-1',
          disabled
            ? 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500'
        ]"
      >
        <span class="flex items-center gap-2">
          <component
            v-if="icon"
            :is="icon"
            class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
          />
          <span class="block truncate text-gray-900 dark:text-white">
            {{ displayValue || placeholder }}
          </span>
          <span v-if="badge" class="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {{ badge }}
          </span>
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon
            class="h-4 w-4 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
        </span>
      </ListboxButton>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-sm shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none"
        >
          <!-- Search Input (if searchable) -->
          <div v-if="searchable" class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                @click.stop
              />
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredOptions.length === 0" class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <component
              v-if="emptyIcon"
              :is="emptyIcon"
              class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600"
            />
            <p class="text-xs">{{ emptyText || 'No options available' }}</p>
          </div>

          <!-- Options -->
          <ListboxOption
            v-for="option in filteredOptions"
            :key="option.value"
            v-slot="{ active, selected: isSelected }"
            :value="option.value"
            as="template"
          >
            <li
              :class="[
                'relative cursor-pointer select-none py-2 px-3',
                active
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-900 dark:text-gray-100'
              ]"
            >
              <div class="flex items-center gap-2">
                <component
                  v-if="option.icon"
                  :is="option.icon"
                  class="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span
                  :class="[
                    'block truncate',
                    isSelected ? 'font-medium' : 'font-normal'
                  ]"
                >
                  {{ option.label }}
                </span>
                <span v-if="option.badge" class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {{ option.badge }}
                </span>
                <CheckIcon
                  v-if="isSelected"
                  class="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-500"
                  aria-hidden="true"
                />
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption
} from '@headlessui/vue'
import {
  CheckIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

export interface SelectOption {
  value: string
  label: string
  icon?: any
  badge?: string
  description?: string
  disabled?: boolean
}

interface Props {
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  icon?: any
  badge?: string
  searchable?: boolean
  emptyText?: string
  emptyIcon?: any
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option...',
  disabled: false,
  searchable: false,
  emptyText: 'No options available'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const searchQuery = ref('')
const open = ref(false)

const selected = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const displayValue = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || ''
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options
  }

  const query = searchQuery.value.toLowerCase()
  return props.options.filter(option =>
    option.label.toLowerCase().includes(query) ||
    option.description?.toLowerCase().includes(query)
  )
})

// Reset search when closing
watch(open, (isOpen) => {
  if (!isOpen) {
    searchQuery.value = ''
  }
})
</script>
