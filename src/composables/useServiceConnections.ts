/// <reference types="vite/client" />

import { ref } from 'vue'

export interface ServiceConnectionStatus {
    pubsub: boolean
    storage: boolean
    firestore: boolean
    datastore: boolean
}

// Reactive connection status
const pubsubConnected = ref(false)
const storageConnected = ref(false)
const firestoreConnected = ref(false)
const datastoreConnected = ref(false)

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
     * Check Datastore emulator connection
     */
    const checkDatastoreConnection = async (): Promise<boolean> => {
        try {
            const baseUrl = import.meta.env.VITE_DATASTORE_BASE_URL || '/datastore'
            // Try a simple query to check connection
            const response = await fetch(`${baseUrl}/v1/projects/test-project:runQuery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    partitionId: { projectId: 'test-project' },
                    query: { kind: [{ name: '__kind__' }], limit: 1 }
                }),
                signal: AbortSignal.timeout(3000)
            })
            datastoreConnected.value = response.ok || response.status === 400 // 400 is also OK (means emulator is running)
            return datastoreConnected.value
        } catch (error) {
            console.warn('Datastore emulator connection check failed:', error)
            datastoreConnected.value = false
            return false
        }
    }

    /**
     * Check all service connections
     */
    const checkAllConnections = async (): Promise<ServiceConnectionStatus> => {
        const [pubsub, storage, firestore, datastore] = await Promise.all([
            checkPubSubConnection(),
            checkStorageConnection(),
            checkFirestoreConnection(),
            checkDatastoreConnection()
        ])

        return {
            pubsub,
            storage,
            firestore,
            datastore
        }
    }

    return {
        // Reactive status
        pubsubConnected,
        storageConnected,
        firestoreConnected,
        datastoreConnected,

        // Methods
        checkPubSubConnection,
        checkStorageConnection,
        checkFirestoreConnection,
        checkDatastoreConnection,
        checkAllConnections
    }
}
