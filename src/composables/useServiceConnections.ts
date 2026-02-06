/// <reference types="vite/client" />

import { ref, computed, type Ref } from 'vue'
import { useAppStore } from '@/stores/app'

export const SERVICE_NAMES = ['pubsub', 'storage', 'firestore', 'datastore'] as const
export type ServiceName = (typeof SERVICE_NAMES)[number]

export type ServiceConnectionStatus = Record<ServiceName, boolean>
export type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'partial' | 'disconnected'

export interface ConnectionState {
  status: ConnectionStatus
  lastChecked: Date | null
  error: string | null
  services: ServiceConnectionStatus
}

interface ServiceConfig {
  envVar: string
  defaultUrl: string
  healthPath: string
  label: string
}

const SERVICE_CONFIG: Record<ServiceName, ServiceConfig> = {
  pubsub: {
    envVar: 'VITE_PUBSUB_BASE_URL',
    defaultUrl: '/_pubsub-hc',
    healthPath: '/',
    label: 'Pub/Sub',
  },
  storage: {
    envVar: 'VITE_STORAGE_BASE_URL',
    defaultUrl: '/_storage-hc',
    healthPath: '/_internal/healthcheck',
    label: 'Storage',
  },
  firestore: {
    envVar: 'VITE_FIRESTORE_BASE_URL',
    defaultUrl: '/_firestore-hc',
    healthPath: '/',
    label: 'Firestore',
  },
  datastore: {
    envVar: 'VITE_DATASTORE_BASE_URL',
    defaultUrl: '/_datastore-hc',
    healthPath: '/',
    label: 'Datastore',
  },
}

const createFalseStatus = (): ServiceConnectionStatus =>
  Object.fromEntries(SERVICE_NAMES.map(s => [s, false])) as ServiceConnectionStatus

const serviceConnected: Record<ServiceName, Ref<boolean>> = {
  pubsub: ref(false),
  storage: ref(false),
  firestore: ref(false),
  datastore: ref(false),
}

const skipPeriodicCheck = ref<ServiceConnectionStatus>(createFalseStatus())

const connectionState = ref<ConnectionState>({
  status: 'unknown',
  lastChecked: null,
  error: null,
  services: createFalseStatus(),
})

let checkInterval: number | null = null

/**
 * Composable for managing GCP emulator service connections
 */
export function useServiceConnections() {
  const appStore = useAppStore()

  // Computed states
  const isConnected = computed(() => connectionState.value.status === 'connected')
  const isPartiallyConnected = computed(() => connectionState.value.status === 'partial')
  const isDisconnected = computed(() => connectionState.value.status === 'disconnected')
  const isChecking = computed(() => connectionState.value.status === 'checking')
  const anyConnected = computed(() =>
    SERVICE_NAMES.some(service => serviceConnected[service].value)
  )

  /**
   * Generic service connection check
   */
  const checkConnection = async (
    service: ServiceName,
    force: boolean = false
  ): Promise<boolean> => {
    if (!force && skipPeriodicCheck.value[service]) {
      return serviceConnected[service].value
    }

    const config = SERVICE_CONFIG[service]

    try {
      const baseUrl = import.meta.env[config.envVar] || config.defaultUrl
      const response = await fetch(`${baseUrl}${config.healthPath}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })
      serviceConnected[service].value = response.ok
      skipPeriodicCheck.value[service] = !response.ok
      return response.ok
    } catch (error) {
      console.debug(`${config.label} emulator connection check failed:`, error)
      serviceConnected[service].value = false
      skipPeriodicCheck.value[service] = true
      return false
    }
  }

  const checkPubSubConnection = (force = false) => checkConnection('pubsub', force)
  const checkStorageConnection = (force = false) => checkConnection('storage', force)
  const checkFirestoreConnection = (force = false) => checkConnection('firestore', force)
  const checkDatastoreConnection = (force = false) => checkConnection('datastore', force)

  /**
   * Check all service connections and update global state
   */
  const checkAllConnections = async (force: boolean = false): Promise<ServiceConnectionStatus> => {
    connectionState.value.status = 'checking'

    const results = await Promise.all(SERVICE_NAMES.map(service => checkConnection(service, force)))

    const services = Object.fromEntries(
      SERVICE_NAMES.map((service, i) => [service, results[i]])
    ) as ServiceConnectionStatus

    const connectedCount = results.filter(Boolean).length

    connectionState.value = {
      status:
        connectedCount === 0
          ? 'disconnected'
          : connectedCount === SERVICE_NAMES.length
            ? 'connected'
            : 'partial',
      lastChecked: new Date(),
      error: connectedCount === 0 ? 'No emulators are reachable' : null,
      services,
    }

    return services
  }

  /**
   * Check a specific service connection (forces check, ignores skip status)
   */
  const checkServiceConnection = (service: ServiceName): Promise<boolean> =>
    checkConnection(service, true)

  /**
   * Start periodic connection checks
   */
  const startPeriodicCheck = (intervalMs: number = 30000) => {
    if (checkInterval) {
      clearInterval(checkInterval)
    }

    checkInterval = window.setInterval(() => {
      if (connectionState.value.status !== 'checking') {
        checkAllConnections(false)
      }
    }, intervalMs)
  }

  /**
   * Stop periodic connection checks
   */
  const stopPeriodicCheck = () => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  /**
   * Retry connection with user feedback
   */
  const retryConnection = async (): Promise<boolean> => {
    appStore.showToast({
      type: 'info',
      title: 'Retrying connection...',
      message: 'Attempting to connect to emulators',
    })

    const result = await checkAllConnections(true)
    const anySuccess = Object.values(result).some(Boolean)

    if (anySuccess) {
      const connectedServices = Object.entries(result)
        .filter(([, v]) => v)
        .map(([k]) => SERVICE_CONFIG[k as ServiceName].label)
        .join(', ')

      appStore.showToast({
        type: 'success',
        title: 'Connection restored',
        message: `Connected to: ${connectedServices}`,
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Connection failed',
        message: 'No emulators are reachable. Please check if they are running.',
      })
    }

    return anySuccess
  }

  /**
   * Reset connection state and clear skip flags
   */
  const reset = () => {
    connectionState.value = {
      status: 'unknown',
      lastChecked: null,
      error: null,
      services: createFalseStatus(),
    }
    SERVICE_NAMES.forEach(service => {
      serviceConnected[service].value = false
    })
    skipPeriodicCheck.value = createFalseStatus()
    stopPeriodicCheck()
  }

  return {
    pubsubConnected: serviceConnected.pubsub,
    storageConnected: serviceConnected.storage,
    firestoreConnected: serviceConnected.firestore,
    datastoreConnected: serviceConnected.datastore,

    serviceConnected,

    connectionState: computed(() => connectionState.value),

    skipPeriodicCheck: computed(() => skipPeriodicCheck.value),

    isConnected,
    isPartiallyConnected,
    isDisconnected,
    isChecking,
    anyConnected,

    checkPubSubConnection,
    checkStorageConnection,
    checkFirestoreConnection,
    checkDatastoreConnection,

    checkConnection,
    checkAllConnections,
    checkServiceConnection,
    startPeriodicCheck,
    stopPeriodicCheck,
    retryConnection,
    reset,

    SERVICE_CONFIG,
    SERVICE_NAMES,
  }
}
