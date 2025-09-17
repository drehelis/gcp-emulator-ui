/// <reference types="vite/client" />

import { ref } from 'vue'

export interface ServiceConnectionStatus {
    pubsub: boolean
    storage: boolean
    firestore: boolean
}

// Reactive connection status
const pubsubConnected = ref(false)
const storageConnected = ref(false)
const firestoreConnected = ref(false)

/**
 * Composable for managing GCP emulator service connections
 */
export function useServiceConnections() {
    /**
     * Check Pub/Sub emulator connection
     */
    const checkPubSubConnection = async (): Promise<boolean> => {
        try {
            const baseUrl = import.meta.env.VITE_PUBSUB_BASE_URL || '/_pubsub-hc'
            const response = await fetch(`${baseUrl}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            })
            pubsubConnected.value = response.ok
            return response.ok
        } catch (error) {
            console.warn('Pub/Sub emulator connection check failed:', error)
            pubsubConnected.value = false
            return false
        }
    }

    /**
     * Check Storage emulator connection
     */
    const checkStorageConnection = async (): Promise<boolean> => {
        try {
            const baseUrl = import.meta.env.VITE_STORAGE_BASE_URL || '/_storage-hc'
            const response = await fetch(`${baseUrl}/_internal/healthcheck`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            })
            storageConnected.value = response.ok
            return response.ok
        } catch (error) {
            console.warn('Storage emulator connection check failed:', error)
            storageConnected.value = false
            return false
        }
    }

    /**
     * Check Firestore emulator connection
     */
    const checkFirestoreConnection = async (): Promise<boolean> => {
        try {
            const baseUrl = import.meta.env.VITE_FIRESTORE_BASE_URL || '/_firestore-hc'
            const response = await fetch(`${baseUrl}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            })
            firestoreConnected.value = response.ok
            return response.ok
        } catch (error) {
            console.warn('Firestore emulator connection check failed:', error)
            firestoreConnected.value = false
            return false
        }
    }

    /**
     * Check all service connections
     */
    const checkAllConnections = async (): Promise<ServiceConnectionStatus> => {
        const [pubsub, storage, firestore] = await Promise.all([
            checkPubSubConnection(),
            checkStorageConnection(),
            checkFirestoreConnection()
        ])

        return {
            pubsub,
            storage,
            firestore
        }
    }

    return {
        // Reactive status
        pubsubConnected,
        storageConnected,
        firestoreConnected,

        // Methods
        checkPubSubConnection,
        checkStorageConnection,
        checkFirestoreConnection,
        checkAllConnections
    }
}
