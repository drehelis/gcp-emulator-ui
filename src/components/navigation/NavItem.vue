<template>
  <div v-if="isSectionHeader" class="flex items-center mb-2" :class="customClasses">
    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {{ label }}
    </p>
  </div>

  <!-- Services Header (main Services link) -->
  <div v-else-if="label === 'Services' && !isCollapsed" :class="customClasses">
    <router-link
      :to="to"
      @click="handleClick"
      class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
      :class="[
        isActive ?
          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
          'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
        customClasses
      ]"
    >
      <component v-if="icon" :is="icon" class="w-4 h-4 mr-3" />
      {{ label }}
    </router-link>
  </div>

  <!-- Sub Items (Topics, Subscriptions, etc.) -->
  <router-link
    v-else-if="!isCollapsed && isSubItem"
    :to="to"
    @click="handleClick"
    class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
    :class="[
      isActive ?
        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
        'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      customClasses
    ]"
  >
    <component v-if="icon" :is="icon" class="w-4 h-4 mr-3" />
    {{ label }}
  </router-link>

  <!-- Collapsed Items (icon only) -->
  <router-link
    v-else-if="isCollapsed"
    :to="to"
    class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
    :class="[
      isActive ?
        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
        'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      customClasses
    ]"
    :title="label"
  >
    <component v-if="icon" :is="icon" class="w-5 h-5" />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'

interface Props {
  to?: string | null
  icon?: Component
  label: string
  badge?: string | number
  isCollapsed?: boolean
  exact?: boolean
  disabled?: boolean
  isServiceHeader?: boolean
  isSubItem?: boolean
  isSectionHeader?: boolean
  connected?: boolean
  customClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  exact: false,
  isCollapsed: false,
  disabled: false,
  isServiceHeader: false,
  isSubItem: false,
  isSectionHeader: false,
  connected: true,
  customClasses: ''
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

.nav-item--service-header {
  @apply font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider px-2 py-1 cursor-default;
}

.nav-item--service-header:hover {
  @apply bg-transparent text-gray-700 dark:text-gray-300;
}

.nav-item--sub-item {
  @apply ml-4 text-xs;
}
</style>