import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

interface RuntimeConfig {
  pubsub?: {
    pubsubPreConfiguredMsgAttr?: Record<string, string>
    defaultProjectId?: string
    // Add other pubsub configuration properties here
    [key: string]: any
  }
  // Add other service configuration sections here
  [key: string]: any
}

export const useConfigStore = defineStore('config', () => {
  // State
  const runtimeConfig = ref<RuntimeConfig>({})
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let initPromise: Promise<void> | null = null

  // Getters
  const pubsubPreConfiguredAttributes = computed((): Record<string, string> => {
    // Use only runtime configuration - no build-time fallbacks
    if (runtimeConfig.value.pubsub?.pubsubPreConfiguredMsgAttr) {
      return runtimeConfig.value.pubsub.pubsubPreConfiguredMsgAttr
    }

    return {}
  })

  const pubsubDefaultProjectId = computed((): string | null => {
    return runtimeConfig.value.pubsub?.defaultProjectId ?? null
  })

  // Actions
  async function loadRuntimeConfig() {
    if (initPromise) return initPromise

    // Already loaded, skip
    if (isLoaded.value) return

    isLoading.value = true
    error.value = null

    initPromise = (async () => {
      try {
        const response = await fetch('/config.json', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          const config = await response.json()
          runtimeConfig.value = config
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
      } finally {
        isLoaded.value = true
        isLoading.value = false
        initPromise = null
      }
    })()

    return initPromise
  }

  async function refreshConfig() {
    isLoaded.value = false
    initPromise = null
    await loadRuntimeConfig()
  }

  function updateRuntimeConfig(config: Partial<RuntimeConfig>) {
    runtimeConfig.value = { ...runtimeConfig.value, ...config }
  }

  loadRuntimeConfig()

  return {
    // State
    runtimeConfig: readonly(runtimeConfig),
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Getters
    pubsubPreConfiguredAttributes,
    pubsubDefaultProjectId,

    // Actions
    loadRuntimeConfig,
    refreshConfig,
    updateRuntimeConfig,
  }
})
