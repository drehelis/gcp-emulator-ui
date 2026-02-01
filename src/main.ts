/**
 * Main application entry point
 * Bootstrap Vue 3 application with all plugins and configurations
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createHead } from '@vueuse/head'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Toast, { POSITION, type PluginOptions } from 'vue-toastification'

// Import root component and core styles
import App from './App.vue'
import router from './router'

// Import styles
import './assets/styles/main.css'
import 'vue-toastification/dist/index.css'

// Import global components
import GlobalComponents from './plugins/global-components'

// Import API client setup
import { setupApiClient } from './api/client'

// Import error handling
import { setupErrorHandling } from './utils/errorSetup'

// Import stores
import { useAppStore } from './stores/app'
import { useProjectsStore } from './stores/projects'

// Create app instance
const app = createApp(App)

// Create and configure Pinia store
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Configure Vue Query
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 10, // 10 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      },
      mutations: {
        retry: 1,
        retryDelay: 1000
      }
    }
  }
})

// Configure head management
const head = createHead()
app.use(head)

// Configure toast notifications
const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
  newestOnTop: true,
  maxToasts: 5,
  transition: "Vue-Toastification__bounce",
  toastDefaults: {
    [POSITION.TOP_RIGHT]: {
      timeout: 5000,
      closeButton: false,
    }
  }
}
app.use(Toast, toastOptions)

// Register global components
app.use(GlobalComponents)

// Use router
app.use(router)

// Setup error handling
setupErrorHandling(app)

// Setup API client
setupApiClient()

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error, info)
}

// Global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('Vue warning:', msg, trace)
  }
}

// Performance measurement
if (import.meta.env.DEV) {
  app.config.performance = true
}

// Set global properties
app.config.globalProperties.$APP_VERSION = __APP_VERSION__

// Initialize stores and mount app
async function initializeApp() {
  let appMounted = false

  try {
    // Initialize app store first (this should always work)
    const appStore = useAppStore()
    appStore.initializeApp()

    // Initialize config store for runtime configuration
    const { useConfigStore } = await import('./stores/config')
    const configStore = useConfigStore()
    await configStore.loadRuntimeConfig()

    // Mount the app early so we can show UI feedback
    app.mount('#app')
    appMounted = true

    // Log startup information
    console.log(`GCP Emulator UI v${app.config.globalProperties.$APP_VERSION}`)

    // Initialize connection monitoring using unified service connections
    const { useServiceConnections } = await import('./composables/useServiceConnections')
    const { checkAllConnections, startPeriodicCheck } = useServiceConnections()

    // Check all emulator connections
    const connectionResult = await checkAllConnections()
    const hasAnyConnection = Object.values(connectionResult).some(Boolean)

    if (hasAnyConnection) {
      // Initialize projects store only if at least one emulator is connected
      try {
        const projectsStore = useProjectsStore()
        projectsStore.initialize()

        // Start periodic connection monitoring
        startPeriodicCheck()
      } catch (storeError) {
        console.debug('Failed to initialize projects store:', storeError)
        appStore.showToast({
          type: 'warning',
          title: 'Partial initialization',
          message: 'The app loaded but some features may not work properly. Please check the API connection.',
          persistent: true
        })

        // Still start monitoring - user can retry later
        startPeriodicCheck()
      }
    } else {
      console.debug('No emulator connections during initialization - app will load with connection warnings')

      // Start periodic checks to allow recovery
      startPeriodicCheck()

    }

  } catch (error) {
    console.error('Critical app initialization error:', error)

    if (appMounted) {
      // App is mounted, we can use Vue toast notifications
      try {
        const appStore = useAppStore()
        appStore.showToast({
          type: 'error',
          title: 'Initialization Error',
          message: 'Failed to fully initialize the application. Please refresh the page.',
          persistent: true
        })
      } catch {
        // Fallback to browser alert
        alert('Failed to initialize the application. Please refresh the page.')
      }
    } else {
      // App not mounted yet, show fallback error page
      showFallbackErrorPage(error)
    }
  }
}

function showFallbackErrorPage(error: any) {
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    ">
      <div>
        <div style="margin-bottom: 2rem;">
          <svg style="width: 4rem; height: 4rem; margin: 0 auto 1rem; opacity: 0.8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem; font-weight: 600;">Failed to Load GCP Emulator UI</h1>
        <p style="font-size: 1.1rem; margin-bottom: 1.5rem; opacity: 0.9; max-width: 400px; line-height: 1.5;">
          We encountered a critical error while initializing the application. This might be due to:
        </p>
        <ul style="text-align: left; max-width: 400px; margin: 0 auto 2rem; opacity: 0.8; line-height: 1.5;">
          <li>• Network connectivity issues</li>
          <li>• API server configuration problems</li>
          <li>• Browser compatibility issues</li>
        </ul>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button 
            onclick="window.location.reload()" 
            style="
              background: rgba(255, 255, 255, 0.9);
              border: none;
              color: #4c51bf;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-size: 1rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            "
            onmouseover="this.style.background='white'; this.style.transform='translateY(-1px)'"
            onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.transform='translateY(0)'"
          >
            Refresh Page
          </button>
          <button
            onclick="this.nextElementSibling.style.display='block'; this.style.display='none';"
            style="
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s ease;
            "
          >
            Show Details
          </button>
        </div>
        <div style="display: none; margin-top: 2rem; text-align: left; max-width: 600px;">
          <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Error Details:</h3>
          <pre style="
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 0.5rem;
            overflow: auto;
            font-size: 0.85rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 200px;
          ">${error?.stack || error?.message || error}</pre>
        </div>
      </div>
    </div>
  `
}

// Start the application
initializeApp()