<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex theme-transition-bg">
    <!-- Sidebar -->
    <Transition
      enter-active-class="transition-transform"
      leave-active-class="transition-transform"
      enter-from-class="transform -translate-x-full"
      leave-to-class="transform -translate-x-full"
    >
      <aside
        v-show="!appStore.layout.sidebar.collapsed || !isMobile"
        class="fixed inset-y-0 left-0 z-50 lg:static lg:inset-0"
        :class="[
          appStore.layout.sidebar.collapsed && !isMobile ? 'w-16' : 'w-80',
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 theme-transition-colors',
          'flex flex-col overflow-y-auto overflow-x-visible transition-all',
        ]"
      >
        <!-- Sidebar Header -->
        <div
          class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors"
          :class="{ 'justify-center': appStore.layout.sidebar.collapsed && !isMobile }"
        >
          <div
            v-if="!appStore.layout.sidebar.collapsed || isMobile"
            class="flex items-center space-x-3"
          >
            <div class="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <QueueListIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex items-center space-x-2">
              <a
                href="https://github.com/drehelis/gcp-emulator-ui"
                target="_blank"
                rel="noopener noreferrer"
                class="p-1.5 hover:opacity-70 theme-transition-colors hover:scale-110 transition-transform"
                title="View on GitHub"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 98 96"
                  xmlns="http://www.w3.org/2000/svg"
                  class="fill-gray-700 dark:fill-gray-300"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                  />
                </svg>
              </a>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">GCP Emulator UI</h1>
            </div>
          </div>

          <div
            v-else
            class="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center"
          >
            <QueueListIcon class="w-5 h-5 text-white" />
          </div>

          <!-- Collapse/Expand button (desktop only) -->
          <button
            v-if="!isMobile"
            @click="appStore.toggleSidebar"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 theme-transition-colors"
            :title="appStore.layout.sidebar.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <ChevronLeftIcon
              class="w-5 h-5 transition-transform"
              :class="{ 'rotate-180': appStore.layout.sidebar.collapsed }"
            />
          </button>
        </div>

        <!-- Project Selector -->
        <div
          class="px-4 py-4 border-b border-gray-200 dark:border-gray-700 overflow-visible relative z-50 theme-transition-colors"
        >
          <ProjectSelector :collapsed="appStore.layout.sidebar.collapsed && !isMobile" />
        </div>

        <!-- Dynamic Navigation -->
        <div
          class="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin"
          v-if="navigationItems.length > 0"
        >
          <template v-for="item in navigationItems" :key="item.id">
            <!-- Services Header -->
            <div
              v-if="item.label === 'Services' && !appStore.layout.sidebar.collapsed"
              class="mb-3"
            >
              <NavItem
                :to="item.route"
                :icon="item.icon"
                :label="item.label"
                :badge="item.badge"
                :disabled="item.disabled"
                :exact="item.exact"
                :is-service-header="item.isServiceHeader"
                :is-sub-item="item.isSubItem"
                :is-section-header="item.isSectionHeader"
                :connected="item.connected"
                :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
                :custom-classes="item.customClasses"
                @click="handleMobileNavClick"
              />
            </div>

            <!-- PubSub Section Container -->
            <div
              v-else-if="item.id === 'pubsub-section'"
              class="space-y-1 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3 theme-transition-colors"
            >
              <template v-for="subItem in item.children" :key="subItem.id">
                <NavItem
                  :to="subItem.route"
                  :icon="subItem.icon"
                  :label="subItem.label"
                  :badge="subItem.badge"
                  :disabled="subItem.disabled"
                  :is-service-header="subItem.isServiceHeader"
                  :is-sub-item="subItem.isSubItem"
                  :is-section-header="subItem.isSectionHeader"
                  :connected="subItem.connected"
                  :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
                  :custom-classes="subItem.customClasses"
                  @click="handleMobileNavClick"
                />
              </template>
            </div>

            <!-- Storage Section Container -->
            <div
              v-else-if="item.id === 'storage-section'"
              class="space-y-1 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3 theme-transition-colors"
            >
              <template v-for="subItem in item.children" :key="subItem.id">
                <NavItem
                  :to="subItem.route"
                  :icon="subItem.icon"
                  :label="subItem.label"
                  :badge="subItem.badge"
                  :disabled="subItem.disabled"
                  :is-service-header="subItem.isServiceHeader"
                  :is-sub-item="subItem.isSubItem"
                  :is-section-header="subItem.isSectionHeader"
                  :connected="subItem.connected"
                  :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
                  :custom-classes="subItem.customClasses"
                  @click="handleMobileNavClick"
                />
              </template>
            </div>

            <!-- Firestore Section Container -->
            <div
              v-else-if="item.id === 'firestore-section'"
              class="space-y-1 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3"
            >
              <template v-for="subItem in item.children" :key="subItem.id">
                <NavItem
                  :to="subItem.route"
                  :icon="subItem.icon"
                  :label="subItem.label"
                  :badge="subItem.badge"
                  :disabled="subItem.disabled"
                  :is-service-header="subItem.isServiceHeader"
                  :is-sub-item="subItem.isSubItem"
                  :is-section-header="subItem.isSectionHeader"
                  :connected="subItem.connected"
                  :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
                  :custom-classes="subItem.customClasses"
                  @click="handleMobileNavClick"
                />
              </template>
            </div>

            <!-- Datastore Section Container -->
            <div
              v-else-if="item.id === 'datastore-section'"
              class="space-y-1 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3"
            >
              <template v-for="subItem in item.children" :key="subItem.id">
                <NavItem
                  :to="subItem.route"
                  :icon="subItem.icon"
                  :label="subItem.label"
                  :badge="subItem.badge"
                  :disabled="subItem.disabled"
                  :is-service-header="subItem.isServiceHeader"
                  :is-sub-item="subItem.isSubItem"
                  :is-section-header="subItem.isSectionHeader"
                  :connected="subItem.connected"
                  :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
                  :custom-classes="subItem.customClasses"
                  @click="handleMobileNavClick"
                />
              </template>
            </div>

            <!-- Other Items (Expanded Mode) -->
            <NavItem
              v-else-if="
                !item.id.includes('-section') &&
                !appStore.layout.sidebar.collapsed &&
                !item.isSeparator
              "
              :to="item.route"
              :icon="item.icon"
              :label="item.label"
              :badge="item.badge"
              :disabled="item.disabled"
              :exact="item.exact"
              :is-service-header="item.isServiceHeader"
              :is-sub-item="item.isSubItem"
              :is-section-header="item.isSectionHeader"
              :connected="item.connected"
              :is-collapsed="false"
              :custom-classes="item.customClasses || 'mt-4'"
              @click="handleMobileNavClick"
            />

            <!-- Collapsed Separator -->
            <div
              v-else-if="item.isSeparator && appStore.layout.sidebar.collapsed"
              class="my-3 mx-auto w-8 border-t border-gray-200 dark:border-gray-700 theme-transition-colors"
            ></div>

            <!-- Collapsed/Other Items -->
            <NavItem
              v-else-if="
                !item.id.includes('-section') &&
                appStore.layout.sidebar.collapsed &&
                !item.isSeparator
              "
              :to="item.route"
              :icon="item.icon"
              :label="item.label"
              :badge="item.badge"
              :disabled="item.disabled"
              :is-service-header="item.isServiceHeader"
              :is-sub-item="item.isSubItem"
              :is-section-header="item.isSectionHeader"
              :connected="item.connected"
              :is-collapsed="appStore.layout.sidebar.collapsed && !isMobile"
              :custom-classes="item.customClasses"
              @click="handleMobileNavClick"
            />
          </template>
        </div>
      </aside>
    </Transition>

    <!-- Mobile sidebar overlay -->
    <Transition
      enter-active-class="transition-opacity"
      leave-active-class="transition-opacity"
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
        class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 theme-transition-colors"
        :class="{ 'lg:pl-4': appStore.layout.sidebar.collapsed }"
      >
        <!-- Left side -->
        <div class="flex items-center space-x-4">
          <!-- Mobile menu button -->
          <button
            v-if="isMobile"
            @click="appStore.setSidebarCollapsed(false)"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 theme-transition-colors"
          >
            <Bars3Icon class="w-6 h-6" />
          </button>

          <!-- Breadcrumbs -->
          <nav class="hidden md:flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li
                v-for="(breadcrumb, index) in appStore.breadcrumbs"
                :key="index"
                class="flex items-center"
              >
                <ChevronRightIcon
                  v-if="index > 0"
                  class="w-4 h-4 text-gray-400 mx-2 theme-transition-colors"
                />
                <component
                  :is="breadcrumb.route && !breadcrumb.disabled ? 'router-link' : 'span'"
                  :to="breadcrumb.route"
                  :class="[
                    'text-sm font-medium theme-transition-colors',
                    breadcrumb.disabled
                      ? 'text-gray-400 dark:text-gray-500'
                      : breadcrumb.route
                        ? 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                        : 'text-gray-900 dark:text-white',
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
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 theme-transition-colors"
            :title="`Switch to ${appStore.isDarkMode ? 'light' : 'dark'} theme`"
          >
            <component :is="themeIcon" class="w-5 h-5" />
          </button>

          <!-- Fullscreen toggle -->
          <button
            @click="toggleFullscreen"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 theme-transition-colors"
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
  ArchiveBoxIcon,
  CircleStackIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline'

import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useServiceConnections } from '@/composables/useServiceConnections'
import type { NavigationItem } from '@/types'

// Import components (these would be created)
import ProjectSelector from '@/components/navigation/ProjectSelector.vue'
import NavItem from '@/components/navigation/NavItem.vue'
import GlobalSearch from '@/components/search/GlobalSearch.vue'

const route = useRoute()
const appStore = useAppStore()
const projectsStore = useProjectsStore()
const {
  pubsubConnected,
  storageConnected,
  firestoreConnected,
  datastoreConnected,
  checkAllConnections,
} = useServiceConnections()

// Reactive state
const isMobile = ref(false)
const isFullscreen = ref(false)

// Current project from route only (for navigation)
const currentProject = computed(() => {
  return route.params.projectId as string
})

// Dynamic navigation items that replicate the exact hardcoded structure
const navigationItems = computed<NavigationItem[]>(() => {
  if (!currentProject.value) return []

  const items: NavigationItem[] = []

  // Only show navigation when not collapsed or on mobile
  if (!appStore.layout.sidebar.collapsed || isMobile.value) {
    // Project overview link (Services header)
    items.push({
      id: 'services-header',
      label: 'Services',
      route: `/projects/${currentProject.value}`,
      icon: CubeIcon,
      disabled: false,
      exact: true,
    })

    // PubSub services with connection status
    if (showPubSubNav.value) {
      const pubsubChildren: NavigationItem[] = []

      // PubSub section header
      pubsubChildren.push({
        id: 'pubsub-section-header',
        label: 'Pub/Sub',
        route: null,
        icon: null,
        disabled: false,
        isSectionHeader: true,
        connected: pubsubConnected.value,
      })

      // Only show PubSub navigation items when connected
      if (pubsubConnected.value) {
        pubsubChildren.push({
          id: 'pubsub-topics',
          label: 'Topics',
          route: `/projects/${currentProject.value}/pubsub/topics`,
          icon: QueueListIcon,
          disabled: false,
          isSubItem: true,
        })

        pubsubChildren.push({
          id: 'pubsub-subscriptions',
          label: 'Subscriptions',
          route: `/projects/${currentProject.value}/pubsub/subscriptions`,
          icon: InboxStackIcon,
          disabled: false,
          isSubItem: true,
        })

        pubsubChildren.push({
          id: 'pubsub-templates',
          label: 'Templates',
          route: `/projects/${currentProject.value}/pubsub/message-templates`,
          icon: DocumentDuplicateIcon,
          disabled: false,
          isSubItem: true,
        })
      }

      items.push({
        id: 'pubsub-section',
        label: 'PubSub Section',
        route: null,
        children: pubsubChildren,
      })
    }

    // Storage services with connection status
    if (showStorageNav.value) {
      const storageChildren: NavigationItem[] = []

      // Storage section header
      storageChildren.push({
        id: 'storage-section-header',
        label: 'Storage',
        route: null,
        icon: null,
        disabled: false,
        isSectionHeader: true,
        connected: storageConnected.value,
      })

      // Only show Storage navigation items when connected
      if (storageConnected.value) {
        storageChildren.push({
          id: 'storage-buckets',
          label: 'Buckets',
          route: `/projects/${currentProject.value}/storage/buckets`,
          icon: ArchiveBoxIcon,
          disabled: false,
          isSubItem: true,
        })
      }

      items.push({
        id: 'storage-section',
        label: 'Storage Section',
        route: null,
        children: storageChildren,
      })
    }

    // Firestore services with connection status
    if (showFirestoreNav.value) {
      const firestoreChildren: NavigationItem[] = []

      // Firestore section header
      firestoreChildren.push({
        id: 'firestore-section-header',
        label: 'Firestore',
        route: null,
        icon: null,
        disabled: false,
        isSectionHeader: true,
        connected: firestoreConnected.value,
      })

      // Only show Firestore navigation items when connected
      if (firestoreConnected.value) {
        firestoreChildren.push({
          id: 'firestore-collections',
          label: 'Collections',
          route: `/projects/${currentProject.value}/firestore/collections`,
          icon: CircleStackIcon,
          disabled: false,
          isSubItem: true,
        })
      }

      items.push({
        id: 'firestore-section',
        label: 'Firestore Section',
        route: null,
        children: firestoreChildren,
      })
    }

    // Datastore services with connection status
    if (showDatastoreNav.value) {
      const datastoreChildren: NavigationItem[] = []

      // Datastore section header
      datastoreChildren.push({
        id: 'datastore-section-header',
        label: 'Datastore',
        route: null,
        icon: null,
        disabled: false,
        isSectionHeader: true,
        connected: datastoreConnected.value,
      })

      // Only show Datastore navigation items when connected
      if (datastoreConnected.value) {
        datastoreChildren.push({
          id: 'datastore-namespaces',
          label: 'Namespaces',
          route: `/projects/${currentProject.value}/datastore/namespaces`,
          icon: TableCellsIcon,
          disabled: false,
          isSubItem: true,
        })
      }

      items.push({
        id: 'datastore-section',
        label: 'Datastore Section',
        route: null,
        children: datastoreChildren,
      })
    }
  } else {
    // Collapsed sidebar navigation (icon only)
    items.push({
      id: 'collapsed-services',
      label: 'Project Services',
      route: `/projects/${currentProject.value}`,
      icon: CubeIcon,
      disabled: false,
    })

    if (showPubSubNav.value) {
      // Add separator before PubSub section
      items.push({
        id: 'separator-pubsub',
        label: '',
        route: null,
        icon: null,
        disabled: false,
        isSeparator: true,
      })

      items.push({
        id: 'collapsed-pubsub-topics',
        label: 'Topics',
        route: `/projects/${currentProject.value}/pubsub/topics`,
        icon: QueueListIcon,
        disabled: false,
        customClasses: !pubsubConnected.value ? 'opacity-50' : '',
      })

      items.push({
        id: 'collapsed-pubsub-subscriptions',
        label: 'Subscriptions',
        route: `/projects/${currentProject.value}/pubsub/subscriptions`,
        icon: InboxStackIcon,
        disabled: false,
        customClasses: !pubsubConnected.value ? 'opacity-50' : '',
      })

      items.push({
        id: 'collapsed-pubsub-templates',
        label: 'Templates',
        route: `/projects/${currentProject.value}/pubsub/message-templates`,
        icon: DocumentDuplicateIcon,
        disabled: false,
        customClasses: !pubsubConnected.value ? 'opacity-50' : '',
      })
    }

    if (showStorageNav.value) {
      // Add separator before Storage section
      items.push({
        id: 'separator-storage',
        label: '',
        route: null,
        icon: null,
        disabled: false,
        isSeparator: true,
      })

      items.push({
        id: 'collapsed-storage-buckets',
        label: 'Buckets',
        route: `/projects/${currentProject.value}/storage/buckets`,
        icon: ArchiveBoxIcon,
        disabled: false,
        customClasses: !storageConnected.value ? 'opacity-50' : '',
      })
    }

    if (showFirestoreNav.value) {
      // Add separator before Firestore section
      items.push({
        id: 'separator-firestore',
        label: '',
        route: null,
        icon: null,
        disabled: false,
        isSeparator: true,
      })

      items.push({
        id: 'collapsed-firestore-collections',
        label: 'Collections',
        route: `/projects/${currentProject.value}/firestore/collections`,
        icon: CircleStackIcon,
        disabled: false,
        customClasses: !firestoreConnected.value ? 'opacity-50' : '',
      })
    }

    if (showDatastoreNav.value) {
      // Add separator before Datastore section
      items.push({
        id: 'separator-datastore',
        label: '',
        route: null,
        icon: null,
        disabled: false,
        isSeparator: true,
      })

      items.push({
        id: 'collapsed-datastore-namespaces',
        label: 'Entities',
        route: `/projects/${currentProject.value}/datastore/namespaces`,
        icon: TableCellsIcon,
        disabled: false,
        customClasses: !datastoreConnected.value ? 'opacity-50' : '',
      })
    }

    // Add separator before Import/Export
    items.push({
      id: 'separator-import-export',
      label: '',
      route: null,
      icon: null,
      disabled: false,
      isSeparator: true,
    })
  }

  // Always add unified Import/Export (after all service sections in both modes)
  items.push({
    id: 'unified-import-export',
    label: 'Import/Export',
    route: `/projects/${currentProject.value}/import-export`,
    icon: ArrowsRightLeftIcon,
    disabled: false,
  })

  return items
})

// Always show services when in a project, but with connection status
const showPubSubNav = computed(() => !!currentProject.value)
const showStorageNav = computed(() => !!currentProject.value)
const showFirestoreNav = computed(() => !!currentProject.value)
const showDatastoreNav = computed(() => !!currentProject.value)

// Watch for route changes and sync project selection
watch(
  () => route.params.projectId,
  newProjectId => {
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
  },
  { immediate: true }
)

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

// Check connections when project changes
watch(
  currentProject,
  newProject => {
    if (newProject) {
      checkAllConnections()
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  checkAllConnections()
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
