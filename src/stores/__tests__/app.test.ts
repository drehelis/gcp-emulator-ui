/**
 * Tests for app store
 * Theme, layout, and UI state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../app'

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}))

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => toastMocks,
}))

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    toastMocks.warning.mockReset()
    toastMocks.info.mockReset()
  })

  describe('initial state', () => {
    it('has default theme of auto', () => {
      const store = useAppStore()
      expect(store.theme).toBe('auto')
    })

    it('has default color scheme of blue', () => {
      const store = useAppStore()
      expect(store.colorScheme).toBe('blue')
    })

    it('has sidebar not collapsed by default', () => {
      const store = useAppStore()
      expect(store.layout.sidebar.collapsed).toBe(false)
    })

    it('has no loading state initially', () => {
      const store = useAppStore()
      expect(store.loading.global).toBe(false)
    })

    it('has default feature flags', () => {
      const store = useAppStore()
      expect(store.featureFlags.enableAdvancedSearch).toBe(true)
      expect(store.featureFlags.enableBulkOperations).toBe(true)
    })
  })

  describe('theme actions', () => {
    it('sets theme to dark', () => {
      const store = useAppStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
    })

    it('sets theme to light', () => {
      const store = useAppStore()
      store.setTheme('light')
      expect(store.theme).toBe('light')
    })

    it('sets theme to auto', () => {
      const store = useAppStore()
      store.setTheme('dark')
      store.setTheme('auto')
      expect(store.theme).toBe('auto')
    })
  })

  describe('color scheme', () => {
    it('sets color scheme', () => {
      const store = useAppStore()
      store.setColorScheme('green')
      expect(store.colorScheme).toBe('green')
    })
  })

  describe('sidebar actions', () => {
    it('toggles sidebar collapsed state', () => {
      const store = useAppStore()
      const initial = store.layout.sidebar.collapsed

      store.toggleSidebar()
      expect(store.layout.sidebar.collapsed).toBe(!initial)

      store.toggleSidebar()
      expect(store.layout.sidebar.collapsed).toBe(initial)
    })

    it('sets sidebar collapsed state directly', () => {
      const store = useAppStore()

      store.setSidebarCollapsed(true)
      expect(store.layout.sidebar.collapsed).toBe(true)

      store.setSidebarCollapsed(false)
      expect(store.layout.sidebar.collapsed).toBe(false)
    })
  })

  describe('loading state', () => {
    it('sets global loading state', () => {
      const store = useAppStore()

      store.setGlobalLoading(true)
      expect(store.loading.global).toBe(true)

      store.setGlobalLoading(false)
      expect(store.loading.global).toBe(false)
    })

    it('sets component loading state', () => {
      const store = useAppStore()

      store.setComponentLoading('topics', true)
      expect(store.loading.components.topics).toBe(true)

      store.setComponentLoading('topics', false)
      expect(store.loading.components.topics).toBeUndefined()
    })

    it('sets operation loading state', () => {
      const store = useAppStore()

      store.setOperationLoading('createTopic', true)
      expect(store.loading.operations.createTopic).toBe(true)

      store.setOperationLoading('createTopic', false)
      expect(store.loading.operations.createTopic).toBeUndefined()
    })
  })

  describe('breadcrumbs', () => {
    it('sets breadcrumbs', () => {
      const store = useAppStore()
      const items = [
        { label: 'Home', route: '/' },
        { label: 'Topics', route: '/topics' },
      ]

      store.setBreadcrumbs(items)
      expect(store.breadcrumbs).toEqual(items)
    })
  })

  describe('page title and description', () => {
    it('sets page title', () => {
      const store = useAppStore()
      store.setPageTitle('My Topics')
      expect(store.pageTitle).toBe('My Topics')
    })

    it('sets page description', () => {
      const store = useAppStore()
      store.setPageDescription('Manage your Pub/Sub topics')
      expect(store.pageDescription).toBe('Manage your Pub/Sub topics')
    })
  })

  describe('preferences', () => {
    it('updates preferences', () => {
      const store = useAppStore()

      store.updatePreferences({ compactMode: true })
      expect(store.preferences.compactMode).toBe(true)
    })

    it('merges preference updates', () => {
      const store = useAppStore()
      const initialAnimations = store.preferences.enableAnimations

      store.updatePreferences({ compactMode: true })
      expect(store.preferences.enableAnimations).toBe(initialAnimations)
    })
  })

  describe('feature flags', () => {
    it('toggles feature flag', () => {
      const store = useAppStore()
      const initialValue = store.featureFlags.enableAdvancedSearch

      store.toggleFeatureFlag('enableAdvancedSearch')
      expect(store.featureFlags.enableAdvancedSearch).toBe(!initialValue)
    })

    it('enables feature', () => {
      const store = useAppStore()
      store.disableFeature('enableAdvancedSearch')

      store.enableFeature('enableAdvancedSearch')
      expect(store.featureFlags.enableAdvancedSearch).toBe(true)
    })

    it('disables feature', () => {
      const store = useAppStore()
      store.enableFeature('enableBulkOperations')

      store.disableFeature('enableBulkOperations')
      expect(store.featureFlags.enableBulkOperations).toBe(false)
    })
  })

  describe('computed getters', () => {
    it('calculates isDarkMode correctly for dark theme', () => {
      const store = useAppStore()
      store.setTheme('dark')
      expect(store.isDarkMode).toBe(true)
    })

    it('calculates isDarkMode correctly for light theme', () => {
      const store = useAppStore()
      store.setTheme('light')
      expect(store.isDarkMode).toBe(false)
    })

    it('calculates sidebarWidth based on collapsed state', () => {
      const store = useAppStore()

      store.setSidebarCollapsed(false)
      expect(store.sidebarWidth).toBe(store.layout.sidebar.width)

      store.setSidebarCollapsed(true)
      expect(store.sidebarWidth).toBe(store.layout.sidebar.collapsedWidth)
    })

    it('calculates isLoading from global state', () => {
      const store = useAppStore()
      expect(store.isLoading).toBe(false)

      store.setGlobalLoading(true)
      expect(store.isLoading).toBe(true)
    })
  })

  describe('modals', () => {
    it('opens modal and returns id', () => {
      const store = useAppStore()

      const id = store.openModal({
        title: 'Test Modal',
        component: 'TestComponent',
      })

      expect(id).toBeDefined()
      expect(store.modals.length).toBe(1)
      expect(store.hasActiveModals).toBe(true)
    })

    it('closes modal by id', () => {
      const store = useAppStore()

      const id = store.openModal({
        title: 'Test Modal',
        component: 'TestComponent',
      })

      store.closeModal(id)
      expect(store.modals.length).toBe(0)
      expect(store.hasActiveModals).toBe(false)
    })

    it('closes all modals', () => {
      const store = useAppStore()

      store.openModal({ title: 'Modal 1', component: 'Test1' })
      store.openModal({ title: 'Modal 2', component: 'Test2' })

      expect(store.modals.length).toBe(2)

      store.closeAllModals()
      expect(store.modals.length).toBe(0)
    })
  })

  describe('toast notifications', () => {
    it('returns toast id when showing toast', () => {
      const store = useAppStore()

      const id = store.showToast({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      })

      // showToast uses vue-toastification directly and returns an id
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('clears internal toasts array', () => {
      const store = useAppStore()
      store.clearToasts()
      expect(store.toasts).toHaveLength(0)
    })

    it('shows error toast', () => {
      const store = useAppStore()
      const id = store.showToast({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong',
      })
      expect(id).toBeDefined()
    })

    it('shows warning toast', () => {
      const store = useAppStore()
      const id = store.showToast({
        type: 'warning',
        title: 'Warning',
        message: 'Be careful',
      })
      expect(id).toBeDefined()
    })

    it('shows info toast', () => {
      const store = useAppStore()
      const id = store.showToast({
        type: 'info',
        title: 'Info',
        message: 'FYI',
      })
      expect(id).toBeDefined()
    })

    it('removeToast removes toast by id', () => {
      const store = useAppStore()
      store.removeToast('non-existent-id')
      // Just ensure it doesn't throw
      expect(store.toasts).toHaveLength(0)
    })

    it('toggleToasts disables showToast', () => {
      const store = useAppStore()

      store.toggleToasts()
      const result = store.showToast({
        type: 'success',
        title: 'Test',
        message: 'Should not show',
      })

      expect(result).toBeUndefined()
      expect(toastMocks.success).not.toHaveBeenCalled()
    })
  })

  describe('notifications settings', () => {
    it('has default notification settings', () => {
      const store = useAppStore()
      expect(store.notifications.enableToasts).toBe(true)
      expect(store.notifications.toastDuration).toBe(5000)
    })

    it('respects enableToasts setting', () => {
      const store = useAppStore()
      store.$patch({ notifications: { ...store.notifications, enableToasts: false } })

      const result = store.showToast({
        type: 'success',
        title: 'Test',
        message: 'Should not show',
      })

      expect(result).toBeUndefined()
      expect(toastMocks.success).not.toHaveBeenCalled()
    })

    it('updates notifications partially', () => {
      const store = useAppStore()
      const initialDuration = store.notifications.toastDuration

      store.updateNotifications({ enableToasts: false })

      expect(store.notifications.enableToasts).toBe(false)
      expect(store.notifications.toastDuration).toBe(initialDuration)
    })

    it('updateNotifications disables showToast', () => {
      const store = useAppStore()

      store.updateNotifications({ enableToasts: false })

      const result = store.showToast({
        type: 'success',
        title: 'Test',
        message: 'Should not show',
      })

      expect(result).toBeUndefined()
      expect(toastMocks.success).not.toHaveBeenCalled()
    })

    it('toggles toast notifications', () => {
      const store = useAppStore()
      expect(store.notifications.enableToasts).toBe(true)

      store.toggleToasts()
      expect(store.notifications.enableToasts).toBe(false)

      store.toggleToasts()
      expect(store.notifications.enableToasts).toBe(true)
    })
  })

  describe('initializeApp', () => {
    it('initializes without errors', () => {
      const store = useAppStore()
      expect(() => store.initializeApp()).not.toThrow()
    })

    it('loads theme from localStorage', () => {
      localStorage.setItem('app-theme', 'dark')
      const store = useAppStore()
      store.initializeApp()
      expect(store.theme).toBe('dark')
    })

    it('loads color scheme from localStorage', () => {
      localStorage.setItem('app-color-scheme', 'green')
      const store = useAppStore()
      store.initializeApp()
      expect(store.colorScheme).toBe('green')
    })

    it('loads sidebar state from localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true')
      const store = useAppStore()
      store.initializeApp()
      expect(store.layout.sidebar.collapsed).toBe(true)
    })

    it('loads preferences from localStorage', () => {
      localStorage.setItem('app-preferences', JSON.stringify({ compactMode: true }))
      const store = useAppStore()
      store.initializeApp()
      expect(store.preferences.compactMode).toBe(true)
    })

    it('handles invalid preferences JSON gracefully', () => {
      localStorage.setItem('app-preferences', 'invalid-json')
      const store = useAppStore()
      expect(() => store.initializeApp()).not.toThrow()
    })
  })

  describe('currentTheme computed', () => {
    it('returns dark when isDarkMode is true', () => {
      const store = useAppStore()
      store.setTheme('dark')
      expect(store.currentTheme).toBe('dark')
    })

    it('returns light when isDarkMode is false', () => {
      const store = useAppStore()
      store.setTheme('light')
      expect(store.currentTheme).toBe('light')
    })
  })

  describe('currentToasts computed', () => {
    it('returns empty array initially', () => {
      const store = useAppStore()
      expect(store.currentToasts).toEqual([])
    })
  })

  describe('playNotificationSound', () => {
    it('does nothing when sound is disabled', () => {
      const store = useAppStore()
      store.$patch({ notifications: { ...store.notifications, enableSound: false } })
      expect(() => store.playNotificationSound('success')).not.toThrow()
    })
  })

  describe('closeModal with result', () => {
    it('returns modal and result when closing', () => {
      const store = useAppStore()
      const id = store.openModal({ title: 'Test', component: 'TestComp' })

      const result = store.closeModal(id, { confirmed: true })

      expect(result?.modal.title).toBe('Test')
      expect(result?.result.confirmed).toBe(true)
    })

    it('returns null for non-existent modal', () => {
      const store = useAppStore()
      const result = store.closeModal('non-existent-id')
      expect(result).toBeNull()
    })
  })
})
