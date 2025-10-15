/**
 * Configuration Store
 * Manages both build-time and runtime configuration
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

interface RuntimeConfig {
    pubsub?: {
        pubsubPreConfiguredMsgAttr?: Record<string, string>
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

    // Getters
    const pubsubPreConfiguredAttributes = computed((): Record<string, string> => {
        // Use only runtime configuration - no build-time fallbacks
        if (runtimeConfig.value.pubsub?.pubsubPreConfiguredMsgAttr) {
            return runtimeConfig.value.pubsub.pubsubPreConfiguredMsgAttr
        }

        return {}
    })

    // Actions
    async function loadRuntimeConfig() {
        if (isLoading.value) return

        isLoading.value = true
        error.value = null

        try {
            // Try to fetch runtime configuration
            const response = await fetch('/config.json', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            })

            if (response.ok) {
                const config = await response.json()
                runtimeConfig.value = config
            } else if (response.status !== 404) {
                // 404 is expected if config endpoint doesn't exist, other errors should be logged
                console.warn('Failed to load runtime config:', response.status, response.statusText)
            }
        } catch (err) {
            // Network errors or parsing errors - log but don't fail
            console.warn('Runtime config loading failed:', err)
            error.value = err instanceof Error ? err.message : 'Unknown error'
        } finally {
            isLoaded.value = true
            isLoading.value = false
        }
    }

    async function refreshConfig() {
        isLoaded.value = false
        await loadRuntimeConfig()
    }

    function updateRuntimeConfig(config: Partial<RuntimeConfig>) {
        runtimeConfig.value = { ...runtimeConfig.value, ...config }
    }

    // Initialize on first access
    if (!isLoaded.value && !isLoading.value) {
        loadRuntimeConfig()
    }

    return {
        // State
        runtimeConfig: readonly(runtimeConfig),
        isLoaded: readonly(isLoaded),
        isLoading: readonly(isLoading),
        error: readonly(error),

        // Getters
        pubsubPreConfiguredAttributes,

        // Actions
        loadRuntimeConfig,
        refreshConfig,
        updateRuntimeConfig
    }
})