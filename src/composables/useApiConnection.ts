/**
 * API Connection Status Composable
 * Manages and monitors API connection status
 */

import { ref, computed } from 'vue'
import { healthApi } from '@/api/pubsub'
import { useAppStore } from '@/stores/app'

type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'disconnected' | 'error'

interface ConnectionState {
  status: ConnectionStatus
  lastChecked: Date | null
  error: string | null
  retryCount: number
}

const connectionState = ref<ConnectionState>({
  status: 'unknown',
  lastChecked: null,
  error: null,
  retryCount: 0
})

let checkInterval: number | null = null

export function useApiConnection() {
  const appStore = useAppStore()

  const isConnected = computed(() => connectionState.value.status === 'connected')
  const isDisconnected = computed(() => 
    connectionState.value.status === 'disconnected' || 
    connectionState.value.status === 'error'
  )
  const isChecking = computed(() => connectionState.value.status === 'checking')

  async function checkConnection(): Promise<boolean> {
    connectionState.value.status = 'checking'
    connectionState.value.lastChecked = new Date()

    try {
      // Use the health API to check connection
      await healthApi.getHealthStatus()
      
      connectionState.value.status = 'connected'
      connectionState.value.error = null
      connectionState.value.retryCount = 0
      
      return true
    } catch (error: any) {
      connectionState.value.retryCount++
      
      if (error.code === 0 || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        // Network/connection error
        connectionState.value.status = 'disconnected'
        connectionState.value.error = 'Unable to connect to the API server. Please check if the server is running and accessible.'
      } else if (error.response?.status >= 500) {
        // Server error
        connectionState.value.status = 'error'
        connectionState.value.error = `Server error (${error.response.status}): The API server is experiencing issues.`
      } else if (error.code === 'ENOTFOUND') {
        // DNS/hostname error
        connectionState.value.status = 'error'
        connectionState.value.error = 'Cannot resolve the API server hostname. Please check the API URL configuration.'
      } else {
        // Other error
        connectionState.value.status = 'error'
        connectionState.value.error = `Connection failed: ${error.message || 'Unknown error'}`
      }
      
      return false
    }
  }

  function startPeriodicCheck(intervalMs: number = 30000) {
    if (checkInterval) {
      clearInterval(checkInterval)
    }
    
    checkInterval = window.setInterval(() => {
      if (connectionState.value.status !== 'checking') {
        checkConnection()
      }
    }, intervalMs)
  }

  function stopPeriodicCheck() {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  async function retryConnection(): Promise<boolean> {
    appStore.showToast({
      type: 'info',
      title: 'Retrying connection...',
      message: 'Attempting to reconnect to the API server'
    })

    const success = await checkConnection()
    
    if (success) {
      appStore.showToast({
        type: 'success',
        title: 'Connection restored',
        message: 'Successfully connected to the API server'
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Connection failed',
        message: connectionState.value.error || 'Unable to connect to the API server'
      })
    }
    
    return success
  }

  function reset() {
    connectionState.value = {
      status: 'unknown',
      lastChecked: null,
      error: null,
      retryCount: 0
    }
    stopPeriodicCheck()
  }

  return {
    // State
    connectionState: computed(() => connectionState.value),
    
    // Computed
    isConnected,
    isDisconnected,
    isChecking,
    
    // Actions
    checkConnection,
    startPeriodicCheck,
    stopPeriodicCheck,
    retryConnection,
    reset
  }
}