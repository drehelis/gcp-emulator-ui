/**
 * Main application store
 * Manages global app state, theme, navigation, and UI preferences
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import type {
  Theme,
  LayoutConfig,
  NotificationSettings,
  UIFeatureFlags,
  LoadingState,
  ToastNotification,
  ModalConfig,
} from '@/types'

export const useAppStore = defineStore(
  'app',
  () => {
    // State
    const theme = ref<Theme>('auto')
    const colorScheme = ref('blue')
    const layout = ref<LayoutConfig>({
      sidebar: {
        collapsed: false,
        width: 280,
        collapsedWidth: 64,
      },
      header: {
        height: 64,
        fixed: true,
      },
      footer: {
        height: 48,
        visible: true,
      },
    })

    const loading = ref<LoadingState>({
      global: false,
      components: {},
      operations: {},
    })

    const notifications = ref<NotificationSettings>({
      enableToasts: true,
      toastDuration: 5000,
      enableSound: false,
      enableDesktopNotifications: true,
    })

    const toasts = ref<ToastNotification[]>([])
    const modals = ref<ModalConfig[]>([])

    const featureFlags = ref<UIFeatureFlags>({
      enableAdvancedSearch: true,
      enableBulkOperations: true,
      enableDragAndDrop: true,
      enableVirtualScrolling: true,
      enableRealTimeUpdates: true,
      enableKeyboardShortcuts: true,
      enableContextMenu: true,
      maxTableRows: 1000,
      maxChartDataPoints: 10000,
    })

    const preferences = ref({
      language: 'en-US',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'medium' as const,
      refreshInterval: 30000,
      autoSave: true,
      enableAnimations: true,
      soundEnabled: false,
      tooltipsEnabled: true,
      compactMode: false,
    })

    const breadcrumbs = ref<Array<{ label: string; route?: string; disabled?: boolean }>>([])
    const pageTitle = ref<string>('GCP Emulator UI')
    const pageDescription = ref<string>('')

    // Getters
    const isDarkMode = computed(() => {
      if (theme.value === 'dark') return true
      if (theme.value === 'light') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    const currentTheme = computed(() => (isDarkMode.value ? 'dark' : 'light'))

    const isLoading = computed(() => loading.value.global)

    const hasActiveModals = computed(() => modals.value.length > 0)

    const currentToasts = computed(() =>
      toasts.value.filter(
        toast =>
          !toast.persistent ||
          Date.now() - toast.timestamp.getTime() <
            (toast.duration || notifications.value.toastDuration)
      )
    )

    const sidebarWidth = computed(() =>
      layout.value.sidebar.collapsed
        ? layout.value.sidebar.collapsedWidth
        : layout.value.sidebar.width
    )

    // Actions
    function setTheme(newTheme: Theme) {
      theme.value = newTheme

      // Apply theme to document
      const root = document.documentElement
      const shouldBeDark =
        newTheme === 'dark' ||
        (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

      if (shouldBeDark) {
        root.classList.add('dark')
        root.setAttribute('data-theme', 'dark')
      } else {
        root.classList.remove('dark')
        root.setAttribute('data-theme', 'light')
      }

      // Save to localStorage
      localStorage.setItem('app-theme', newTheme)
    }

    function setColorScheme(scheme: string) {
      colorScheme.value = scheme
      document.documentElement.setAttribute('data-color-scheme', scheme)
      localStorage.setItem('app-color-scheme', scheme)
    }

    function toggleSidebar() {
      layout.value.sidebar.collapsed = !layout.value.sidebar.collapsed
      localStorage.setItem('sidebar-collapsed', String(layout.value.sidebar.collapsed))
    }

    function setSidebarCollapsed(collapsed: boolean) {
      layout.value.sidebar.collapsed = collapsed
      localStorage.setItem('sidebar-collapsed', String(collapsed))
    }

    function setGlobalLoading(isLoading: boolean) {
      loading.value.global = isLoading
    }

    function setComponentLoading(component: string, isLoading: boolean) {
      if (isLoading) {
        loading.value.components[component] = true
      } else {
        delete loading.value.components[component]
      }
    }

    function setOperationLoading(operation: string, isLoading: boolean) {
      if (isLoading) {
        loading.value.operations[operation] = true
      } else {
        delete loading.value.operations[operation]
      }
    }

    function showToast(notification: Omit<ToastNotification, 'id' | 'timestamp'>) {
      if (!notifications.value.enableToasts) return

      const toast = useToast()
      const message = notification.message || notification.title
      const options = {
        timeout: notification.persistent
          ? false
          : notification.duration || notifications.value.toastDuration,
      }

      // Use Vue Toastification to display the toast
      switch (notification.type) {
        case 'success':
          toast.success(message, options)
          break
        case 'error':
          toast.error(message, options)
          break
        case 'warning':
          toast.warning(message, options)
          break
        case 'info':
        default:
          toast.info(message, options)
          break
      }

      // Play sound if enabled
      if (notifications.value.enableSound && notification.type === 'error') {
        playNotificationSound('error')
      }

      // Show desktop notification if enabled and permission granted
      if (
        notifications.value.enableDesktopNotifications &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        })
      }

      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      return toastId
    }

    function removeToast(id: string) {
      const index = toasts.value.findIndex(toast => toast.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }

    function clearToasts() {
      toasts.value = []
    }

    function openModal(config: Omit<ModalConfig, 'id'>) {
      const modal: ModalConfig = {
        ...config,
        id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }

      modals.value.push(modal)

      // Disable body scroll when modal is open
      if (modals.value.length === 1) {
        document.body.style.overflow = 'hidden'
      }

      return modal.id
    }

    function closeModal(id: string, result?: any) {
      const index = modals.value.findIndex(modal => modal.id === id)
      if (index > -1) {
        const modal = modals.value[index]
        modals.value.splice(index, 1)

        // Re-enable body scroll if no more modals
        if (modals.value.length === 0) {
          document.body.style.overflow = ''
        }

        return { modal, result }
      }
      return null
    }

    function closeAllModals() {
      const closedModals = [...modals.value]
      modals.value = []
      document.body.style.overflow = ''
      return closedModals
    }

    function setBreadcrumbs(items: Array<{ label: string; route?: string; disabled?: boolean }>) {
      breadcrumbs.value = items
    }

    function setPageTitle(title: string) {
      pageTitle.value = title
      document.title = `${title} - GCP Emulator UI`
    }

    function setPageDescription(description: string) {
      pageDescription.value = description
    }

    function updatePreferences(updates: Partial<typeof preferences.value>) {
      Object.assign(preferences.value, updates)
      localStorage.setItem('app-preferences', JSON.stringify(preferences.value))
    }

    function updateNotifications(updates: Partial<NotificationSettings>) {
      Object.assign(notifications.value, updates)
    }

    function toggleToasts() {
      notifications.value.enableToasts = !notifications.value.enableToasts
    }

    function toggleFeatureFlag(flag: keyof UIFeatureFlags) {
      if (typeof featureFlags.value[flag] === 'boolean') {
        ;(featureFlags.value[flag] as boolean) = !(featureFlags.value[flag] as boolean)
      }
    }

    function enableFeature(flag: keyof UIFeatureFlags) {
      if (typeof featureFlags.value[flag] === 'boolean') {
        ;(featureFlags.value[flag] as boolean) = true
      }
    }

    function disableFeature(flag: keyof UIFeatureFlags) {
      if (typeof featureFlags.value[flag] === 'boolean') {
        ;(featureFlags.value[flag] as boolean) = false
      }
    }

    function playNotificationSound(type: 'success' | 'error' | 'warning' | 'info') {
      if (!notifications.value.enableSound) return

      // Simple beep for different notification types
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Different frequencies for different types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 700,
      }

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }

    function initializeApp() {
      // Load theme from localStorage
      const savedTheme = localStorage.getItem('app-theme') as Theme
      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        setTheme('auto')
      }

      // Load color scheme
      const savedColorScheme = localStorage.getItem('app-color-scheme')
      if (savedColorScheme) {
        setColorScheme(savedColorScheme)
      }

      // Load sidebar state
      const sidebarCollapsed = localStorage.getItem('sidebar-collapsed')
      if (sidebarCollapsed !== null) {
        setSidebarCollapsed(sidebarCollapsed === 'true')
      }

      // Load preferences
      const savedPreferences = localStorage.getItem('app-preferences')
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences)
          updatePreferences(parsed)
        } catch (error) {
          console.warn('Failed to parse saved preferences:', error)
        }
      }

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      // Listen for theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addListener(() => {
        if (theme.value === 'auto') {
          setTheme('auto') // Trigger theme update
        }
      })
    }

    return {
      // State
      theme,
      colorScheme,
      layout,
      loading,
      notifications,
      toasts,
      modals,
      featureFlags,
      preferences,
      breadcrumbs,
      pageTitle,
      pageDescription,

      // Getters
      isDarkMode,
      currentTheme,
      isLoading,
      hasActiveModals,
      currentToasts,
      sidebarWidth,

      // Actions
      setTheme,
      setColorScheme,
      toggleSidebar,
      setSidebarCollapsed,
      setGlobalLoading,
      setComponentLoading,
      setOperationLoading,
      showToast,
      removeToast,
      clearToasts,
      openModal,
      closeModal,
      closeAllModals,
      setBreadcrumbs,
      setPageTitle,
      setPageDescription,
      updatePreferences,
      updateNotifications,
      toggleToasts,
      toggleFeatureFlag,
      enableFeature,
      disableFeature,
      playNotificationSound,
      initializeApp,
    }
  },
  {
    persist: {
      key: 'emulator-ui-app',
      storage: localStorage,
      beforeRestore: () => {
        // App store restoring
      },
      afterRestore: context => {
        // Don't call initializeApp() here - it's called from main.ts
        // Just apply the restored theme immediately
        if (context.store.theme && typeof document !== 'undefined') {
          const root = document.documentElement
          const shouldBeDark =
            context.store.theme === 'dark' ||
            (context.store.theme === 'auto' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)

          if (shouldBeDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },
    },
  }
)
