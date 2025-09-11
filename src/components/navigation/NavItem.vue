<template>
  <component
    :is="to && !disabled ? 'router-link' : 'div'"
    :to="to && !disabled ? to : undefined"
    @click="handleClick"
    class="nav-item"
    :class="{
      'nav-item--active': isActive && !disabled,
      'nav-item--collapsed': isCollapsed,
      'nav-item--disabled': disabled
    }"
  >
    <component v-if="icon" :is="icon" class="w-5 h-5 shrink-0" :class="{ 'w-6 h-6': isCollapsed }" />
    <span v-if="!isCollapsed" class="ml-3 truncate">{{ label }}</span>
    <span v-if="badge && !isCollapsed" class="nav-item__badge">{{ badge }}</span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'

interface Props {
  to?: string
  icon?: Component
  label: string
  badge?: string | number
  isCollapsed?: boolean
  exact?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  exact: false,
  isCollapsed: false,
  disabled: false
})

const emit = defineEmits<{
  click: []
}>()

const route = useRoute()

const isActive = computed(() => {
  if (!props.to) return false
  
  if (props.exact) {
    return route.path === props.to
  }
  
  return route.path.startsWith(props.to)
})

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<style scoped>
@reference "tailwindcss";

.nav-item {
  @apply flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors duration-200;
}

.nav-item--active {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300;
}

.nav-item--collapsed {
  @apply justify-center px-2;
}

.nav-item__icon {
  @apply w-5 h-5 flex-shrink-0;
}

.nav-item--collapsed .nav-item__icon {
  @apply w-6 h-6;
}

.nav-item__text {
  @apply ml-3 truncate;
}

.nav-item__badge {
  @apply ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}

.nav-item--active .nav-item__badge {
  @apply bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200;
}

.nav-item--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.nav-item--disabled:hover {
  @apply bg-transparent text-gray-600 dark:text-gray-400;
}
</style>