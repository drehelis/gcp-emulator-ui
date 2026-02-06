<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      :style="{ zIndex: props.zIndex }"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 backdrop-blur-[2px] bg-white/5 dark:bg-black/5"
        @click="handleBackdropClick"
      ></div>

      <!-- Modal content -->
      <div
        class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col max-h-[95vh] sm:max-h-[90vh]"
        :class="sizeClasses"
        @keydown="emit('keydown', $event)"
      >
        <!-- Modal header -->
        <div
          v-if="title || $slots.header"
          class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0"
        >
          <div class="flex items-center min-w-0 flex-1 mr-4">
            <component
              v-if="icon"
              :is="icon"
              class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0"
              :class="iconColorClass"
            />
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              <slot name="header">{{ title }}</slot>
            </h3>
          </div>
          <button
            v-if="!persistent"
            @click="close"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal body -->
        <div class="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-hide">
          <slot></slot>
        </div>

        <!-- Modal footer -->
        <div
          v-if="$slots.footer || actions.length > 0"
          class="flex flex-col-reverse gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-600 sm:flex-row sm:justify-end flex-shrink-0"
        >
          <slot name="footer">
            <button
              v-for="action in actions"
              :key="action.label"
              @click="action.handler"
              :disabled="action.loading || action.disabled"
              class="inline-flex justify-center items-center px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              :class="getActionButtonClass(action)"
            >
              <svg
                v-if="action.loading"
                class="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ action.label }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { Component } from 'vue'

export interface ModalAction {
  label: string
  handler: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  loading?: boolean
  disabled?: boolean
}

interface Props {
  modelValue: boolean
  title?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full'
  icon?: Component
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  persistent?: boolean
  actions?: ModalAction[]
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  iconColor: 'primary',
  persistent: false,
  actions: () => [],
  zIndex: 50,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  keydown: [event: KeyboardEvent]
}>()

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-full sm:max-w-5xl',
    full: 'max-w-full sm:max-w-6xl',
  }
  return sizes[props.size]
})

const iconColorClass = computed(() => {
  const colors = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  }
  return colors[props.iconColor]
})

const getActionButtonClass = (action: ModalAction) => {
  const variants = {
    primary: 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary:
      'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
  }

  return variants[action.variant || 'secondary']
}

const close = () => {
  if (!props.persistent) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleBackdropClick = () => {
  if (!props.persistent) {
    close()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue && !props.persistent) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>
