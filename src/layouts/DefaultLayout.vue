<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
    <!-- Sidebar -->
    <Transition
      enter-active-class="transition-transform duration-300"
      leave-active-class="transition-transform duration-300"
      enter-from-class="transform -translate-x-full"
      leave-to-class="transform -translate-x-full"
    >
      <aside
        v-show="!appStore.layout.sidebar.collapsed || !isMobile"
        class="fixed inset-y-0 left-0 z-50 lg:static lg:inset-0"
        :class="[
          appStore.layout.sidebar.collapsed && !isMobile ? 'w-16' : 'w-80',
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-200',
          'flex flex-col overflow-y-auto overflow-x-visible transition-all duration-200'
        ]"
      >
        <!-- Sidebar Header -->
        <div 
          class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200"
          :class="{ 'justify-center': appStore.layout.sidebar.collapsed && !isMobile }"
        >
          <div 
            v-if="!appStore.layout.sidebar.collapsed || isMobile"
            class="flex items-center space-x-3"
          >
            <div class="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <QueueListIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">GCP Emulator UI</h1>
            </div>
          </div>
          
          <div 
            v-else
            class="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center"
          >
            <QueueListIcon class="w-5 h-5 text-white" />
          </div>

          <button
            v-if="!isMobile"
            @click="appStore.toggleSidebar"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <ChevronLeftIcon 
              class="w-5 h-5 transition-transform duration-200" 
              :class="{ 'rotate-180': appStore.layout.sidebar.collapsed }"
            />
          </button>
        </div>

        <!-- Project Selector -->
        <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700 overflow-visible relative z-50 transition-colors duration-200">
          <ProjectSelector :collapsed="appStore.layout.sidebar.collapsed && !isMobile" />
        </div>

        <!-- Project Navigation -->
        <div v-if="currentProject">
          <div v-if="(!appStore.layout.sidebar.collapsed || isMobile)" class="px-4 py-3">
            <!-- Project overview link -->
            <div class="mb-3">
              <router-link
                :to="`/projects/${currentProject}`"
                @click="handleMobileNavClick"
                class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path === `/projects/${currentProject}` ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              >
                <CubeIcon class="w-4 h-4 mr-3" />
                Services
              </router-link>
            </div>

            <!-- PubSub services (show when in pubsub routes) -->
            <div v-if="$route.path.includes('/pubsub')" class="space-y-1 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pub/Sub</p>
              <router-link
                :to="`/projects/${currentProject}/pubsub/topics`"
                @click="handleMobileNavClick"
                class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/topics') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              >
                <QueueListIcon class="w-4 h-4 mr-3" />
                Topics
              </router-link>
              <router-link
                :to="`/projects/${currentProject}/pubsub/subscriptions`"
                @click="handleMobileNavClick"
                class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/subscriptions') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              >
                <InboxStackIcon class="w-4 h-4 mr-3" />
                Subscriptions
              </router-link>
              <router-link
                :to="`/projects/${currentProject}/pubsub/message-templates`"
                @click="handleMobileNavClick"
                class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/message-templates') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              >
                <DocumentDuplicateIcon class="w-4 h-4 mr-3" />
                Message Templates
              </router-link>
              <router-link
                :to="`/projects/${currentProject}/pubsub/import-export`"
                @click="handleMobileNavClick"
                class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/import-export') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              >
                <ArrowsRightLeftIcon class="w-4 h-4 mr-3" />
                Import/Export
              </router-link>
            </div>

            <!-- Storage services (show when in storage routes) -->
            <div v-if="$route.path.includes('/storage')" class="space-y-1 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Storage</p>
              <router-link
                :to="`/projects/${currentProject}/storage/buckets`"
                @click="handleMobileNavClick"
                class="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/buckets') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              >
                <ArchiveBoxIcon class="w-4 h-4 mr-3" />
                Buckets
              </router-link>
            </div>
          </div>

          <!-- Collapsed Project Navigation -->
          <div v-else-if="appStore.layout.sidebar.collapsed && !isMobile" class="px-2 py-3 space-y-1">
            <router-link
              :to="`/projects/${currentProject}`"
              class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
              :class="$route.path === `/projects/${currentProject}` ? 
                'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
              title="Project Services"
            >
              <CubeIcon class="w-5 h-5" />
            </router-link>
            
            <!-- Show PubSub nav items when in pubsub routes -->
            <template v-if="$route.path.includes('/pubsub')">
              <router-link
                :to="`/projects/${currentProject}/pubsub/topics`"
                class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/topics') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
                title="Topics"
              >
                <QueueListIcon class="w-5 h-5" />
              </router-link>
              <router-link
                :to="`/projects/${currentProject}/pubsub/subscriptions`"
                class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/subscriptions') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
                title="Subscriptions"
              >
                <InboxStackIcon class="w-5 h-5" />
              </router-link>
              <router-link
                :to="`/projects/${currentProject}/pubsub/message-templates`"
                class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/message-templates') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
                title="Message Templates"
              >
                <DocumentDuplicateIcon class="w-5 h-5" />
              </router-link>
              <router-link
                :to="`/projects/${currentProject}/pubsub/import-export`"
                class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/import-export') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
                title="Import/Export"
              >
                <ArrowsRightLeftIcon class="w-5 h-5" />
              </router-link>
            </template>

            <!-- Show Storage nav items when in storage routes -->
            <template v-if="$route.path.includes('/storage')">
              <router-link
                :to="`/projects/${currentProject}/storage/buckets`"
                class="flex items-center justify-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                :class="$route.path.includes('/buckets') ? 
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'"
                title="Buckets"
              >
                <ArchiveBoxIcon class="w-5 h-5" />
              </router-link>
            </template>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin">
          <template v-for="item in navigationItems" :key="item.id">
            <div v-if="item.divider" class="my-3 border-t border-gray-200 dark:border-gray-700"></div>
            <NavItem 
              v-else
              :to="item.route"
              :icon="item.icon"
              :label="item.label"
              :badge="item.badge"
              :disabled="item.disabled"
              :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
              @click="handleMobileNavClick"
            />
          </template>
        </nav>

      </aside>
    </Transition>

    <!-- Mobile sidebar overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!appStore.layout.sidebar.collapsed && isMobile"
        class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
        @click="appStore.setSidebarCollapsed(true)"
      />
    </Transition>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Header -->
      <header 
        class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 transition-colors duration-200"
        :class="{ 'lg:pl-4': appStore.layout.sidebar.collapsed }"
      >
        <!-- Left side -->
        <div class="flex items-center space-x-4">
          <!-- Mobile menu button -->
          <button
            v-if="isMobile"
            @click="appStore.setSidebarCollapsed(false)"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Bars3Icon class="w-6 h-6" />
          </button>

          <!-- Breadcrumbs -->
          <nav class="hidden md:flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li v-for="(breadcrumb, index) in appStore.breadcrumbs" :key="index" class="flex items-center">
                <ChevronRightIcon v-if="index > 0" class="w-4 h-4 text-gray-400 mx-2" />
                <component
                  :is="breadcrumb.route && !breadcrumb.disabled ? 'router-link' : 'span'"
                  :to="breadcrumb.route"
                  :class="[
                    'text-sm font-medium',
                    breadcrumb.disabled 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : breadcrumb.route 
                        ? 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' 
                        : 'text-gray-900 dark:text-white'
                  ]"
                >
                  {{ breadcrumb.label }}
                </component>
              </li>
            </ol>
          </nav>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <!-- Search -->
          <div class="hidden lg:block">
            <GlobalSearch />
          </div>


          <!-- Theme toggle -->
          <button
            @click="toggleTheme"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            :title="`Switch to ${appStore.isDarkMode ? 'light' : 'dark'} theme`"
          >
            <component :is="themeIcon" class="w-5 h-5" />
          </button>

          <!-- Fullscreen toggle -->
          <button
            @click="toggleFullscreen"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            title="Toggle fullscreen"
          >
            <component :is="fullscreenIcon" class="w-5 h-5" />
          </button>
        </div>
      </header>


      <!-- Page Content -->
      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  QueueListIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  InboxStackIcon,
  CubeIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import type { NavigationItem } from '@/types'

// Import components (these would be created)
import ProjectSelector from '@/components/navigation/ProjectSelector.vue'
import NavItem from '@/components/navigation/NavItem.vue'
import GlobalSearch from '@/components/search/GlobalSearch.vue'

const route = useRoute()
const appStore = useAppStore()
const projectsStore = useProjectsStore()

// Reactive state
const isMobile = ref(false)
const isFullscreen = ref(false)

// Current project from route only (for navigation)
const currentProject = computed(() => {
  return route.params.projectId as string
})

// Navigation items
const navigationItems = computed<NavigationItem[]>(() => {
  return []
})

// Watch for route changes and sync project selection
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId && typeof newProjectId === 'string') {
    // Always update the store selection when URL changes to ensure consistency
    if (projectsStore.selectedProjectId !== newProjectId) {
      projectsStore.selectProject(newProjectId)
    }
  } else {
    // Clear selection when not on a project route
    if (projectsStore.selectedProjectId) {
      projectsStore.clearSelectedProject()
    }
  }
}, { immediate: true })

// Theme management
const themeIcon = computed(() => {
  switch (appStore.theme) {
    case 'light':
      return SunIcon
    case 'dark':
      return MoonIcon
    case 'auto':
    default:
      return ComputerDesktopIcon
  }
})


const fullscreenIcon = computed(() => {
  return isFullscreen.value ? ArrowsPointingInIcon : ArrowsPointingOutIcon
})

// Methods
const handleMobileNavClick = () => {
  if (isMobile.value) {
    appStore.setSidebarCollapsed(true)
  }
}

function toggleTheme() {
  const themes = ['light', 'dark', 'auto'] as const
  const currentIndex = themes.indexOf(appStore.theme)
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  appStore.setTheme(nextTheme)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}


function handleResize() {
  const mobile = window.innerWidth < 1024
  if (mobile !== isMobile.value) {
    isMobile.value = mobile
    
    // Auto-collapse sidebar on mobile
    if (mobile && !appStore.layout.sidebar.collapsed) {
      appStore.setSidebarCollapsed(true)
    }
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Lifecycle
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
/* Sidebar transition styles */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

/* Custom scrollbar for sidebar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: theme('colors.gray.300');
  border-radius: 2px;
}

.dark nav::-webkit-scrollbar-thumb {
  background: theme('colors.gray.600');
}

nav::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.400');
}

.dark nav::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.500');
}
</style>