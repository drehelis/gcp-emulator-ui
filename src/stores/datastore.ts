/**
 * Datastore store for managing Datastore emulator entities, kinds, and namespaces
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DatastoreEntity, DatastoreKey, DatastoreKindWithMetadata } from '@/types'
import datastoreApi from '@/api/datastore'
import { useProjectsStore } from './projects'

export const useDatastoreStore = defineStore('datastore', () => {
  const loading = ref(false)
  const databases = ref<string[]>([])
  const kinds = ref<DatastoreKindWithMetadata[]>([])
  const namespaces = ref<string[]>([])
  const entities = ref<Map<string, DatastoreEntity[]>>(new Map())
  const selectedDatabase = ref<string>('')
  const selectedNamespace = ref<string>('')

  // Computed
  const getEntitiesByKind = computed(() => {
    return (kind: string) => entities.value.get(kind) || []
  })

  // Get current database for operations
  const getCurrentDatabase = (): string => {
    return selectedDatabase.value
  }

  // Set selected database
  const setSelectedDatabase = (databaseId: string) => {
    selectedDatabase.value = databaseId
  }

  // Get current namespace for operations
  const getCurrentNamespace = (): string => {
    return selectedNamespace.value
  }

  // Set selected namespace
  const setSelectedNamespace = (namespaceId: string) => {
    selectedNamespace.value = namespaceId
  }

  // Load all databases for the selected namespace
  const loadDatabases = async (projectId: string) => {
    try {
      loading.value = true
      const databaseList = await datastoreApi.listDatabases(projectId, selectedNamespace.value)
      databases.value = databaseList

      // Set default database if not selected (only auto-select if value is exactly undefined)
      // Empty string '' is a valid database selection (default database)
      if (
        (selectedDatabase.value === undefined || selectedDatabase.value === '') &&
        databaseList.length > 0
      ) {
        selectedDatabase.value = databaseList[0]
      }
    } catch (error) {
      console.error('Failed to load databases:', error)
      databases.value = ['']
    } finally {
      loading.value = false
    }
  }

  // Load all namespaces (without database filter to get all namespaces)
  const loadNamespaces = async (projectId: string) => {
    try {
      loading.value = true
      // Don't pass database filter - we want all namespaces across all databases
      const namespaceList = await datastoreApi.listNamespaces(projectId)
      namespaces.value = namespaceList

      // Set default namespace if not selected
      if (!selectedNamespace.value && namespaceList.length > 0) {
        selectedNamespace.value = namespaceList[0]
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error)
      namespaces.value = ['']
    } finally {
      loading.value = false
    }
  }

  // Load all kinds
  const loadKinds = async (projectId: string) => {
    try {
      loading.value = true
      const kindNames = await datastoreApi.listKinds(
        projectId,
        selectedNamespace.value,
        selectedDatabase.value
      )

      // Set kinds immediately without counts for fast UI rendering
      kinds.value = kindNames.map(name => ({
        name,
        entityCount: 0,
        bytes: 0,
        namespace: selectedNamespace.value,
        isExpanded: false,
      }))

      // Load entity counts in background (don't block UI)
      // Use smaller limit for faster counting
      Promise.all(
        kinds.value.map(async kind => {
          try {
            const result = await datastoreApi.getEntitiesByKind(
              projectId,
              kind.name,
              selectedNamespace.value,
              100, // Fetch only 100 for quick count estimation
              undefined,
              selectedDatabase.value
            )
            // Update count reactively
            kind.entityCount = result.entities.length
            // If we got exactly 100, there might be more - show 100+
            if (result.entities.length === 100 && result.hasMore) {
              kind.entityCount = 100 // UI can show "100+" if needed
            }
          } catch (error) {
            console.warn(`Failed to load count for kind ${kind.name}:`, error)
          }
        })
      ).catch(() => {
        // Silently handle errors - counts are not critical
      })
    } catch (error) {
      console.warn('Failed to load kinds:', error)
    } finally {
      loading.value = false
    }
  }

  // Load entities for a specific kind
  const loadEntities = async (projectId: string, kind: string) => {
    try {
      loading.value = true
      const result = await datastoreApi.getEntitiesByKind(
        projectId,
        kind,
        selectedNamespace.value,
        undefined,
        undefined,
        selectedDatabase.value
      )
      const kindEntities = result.entities
      entities.value.set(kind, kindEntities)

      // Update kind entity count
      const kindMetadata = kinds.value.find(k => k.name === kind)
      if (kindMetadata) {
        kindMetadata.entityCount = kindEntities.length
      }

      // Extract and track unique database IDs from entities
      const discoveredDatabases = new Set(databases.value)
      kindEntities.forEach(entity => {
        const databaseId = entity.key?.partitionId?.databaseId
        if (databaseId !== undefined) {
          discoveredDatabases.add(databaseId)
        }
      })

      // Update databases list if new databases were discovered
      const newDatabasesList = Array.from(discoveredDatabases).sort()
      if (JSON.stringify(newDatabasesList) !== JSON.stringify(databases.value)) {
        databases.value = newDatabasesList
      }
    } catch (error) {
      console.error('Failed to load entities:', error)
      entities.value.set(kind, [])
    } finally {
      loading.value = false
    }
  }

  // Get a single entity by key
  const getEntity = async (
    projectId: string,
    key: DatastoreKey
  ): Promise<DatastoreEntity | null> => {
    try {
      return await datastoreApi.getEntity(projectId, key)
    } catch (error) {
      console.error('Failed to get entity:', error)
      return null
    }
  }

  // Create an entity
  const createEntity = async (projectId: string, entity: DatastoreEntity) => {
    try {
      loading.value = true
      const createdEntity = await datastoreApi.createEntity(projectId, entity)

      // Update local cache
      const kind = datastoreApi.getKeyKind(entity.key)
      const currentEntities = entities.value.get(kind) || []
      entities.value.set(kind, [...currentEntities, createdEntity])

      // Update kind entity count
      const kindMetadata = kinds.value.find(k => k.name === kind)
      if (kindMetadata) {
        kindMetadata.entityCount = currentEntities.length + 1
      } else {
        // Add new kind if it doesn't exist
        kinds.value.push({
          name: kind,
          entityCount: 1,
          bytes: 0,
          namespace: selectedNamespace.value,
          isExpanded: false,
        })
      }

      return createdEntity
    } catch (error) {
      console.error('Failed to create entity:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update an entity
  const updateEntity = async (projectId: string, entity: DatastoreEntity) => {
    try {
      loading.value = true
      const updatedEntity = await datastoreApi.updateEntity(projectId, entity)

      // Update local cache
      const kind = datastoreApi.getKeyKind(entity.key)
      const currentEntities = entities.value.get(kind) || []
      const entityId = datastoreApi.getKeyId(entity.key)

      const updatedEntities = currentEntities.map(e => {
        const eId = datastoreApi.getKeyId(e.key)
        return eId === entityId ? updatedEntity : e
      })

      entities.value.set(kind, updatedEntities)

      return updatedEntity
    } catch (error) {
      console.error('Failed to update entity:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete an entity
  const deleteEntity = async (projectId: string, key: DatastoreKey) => {
    try {
      loading.value = true
      await datastoreApi.deleteEntity(projectId, key)

      // Update local cache
      const kind = datastoreApi.getKeyKind(key)
      const currentEntities = entities.value.get(kind) || []
      const entityId = datastoreApi.getKeyId(key)

      const updatedEntities = currentEntities.filter(e => {
        const eId = datastoreApi.getKeyId(e.key)
        return eId !== entityId
      })

      entities.value.set(kind, updatedEntities)

      // Update kind entity count
      const kindMetadata = kinds.value.find(k => k.name === kind)
      if (kindMetadata) {
        kindMetadata.entityCount = updatedEntities.length
      }

      return true
    } catch (error) {
      console.error('Failed to delete entity:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete all entities of a kind
  const deleteKind = async (projectId: string, kind: string) => {
    try {
      loading.value = true
      await datastoreApi.deleteKind(
        projectId,
        kind,
        selectedNamespace.value,
        selectedDatabase.value
      )

      // Remove from local state
      kinds.value = kinds.value.filter(k => k.name !== kind)
      entities.value.delete(kind)

      return true
    } catch (error) {
      console.error('Failed to delete kind:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Health check
  const healthCheck = async () => {
    try {
      const projectsStore = useProjectsStore()
      const projectId = projectsStore.selectedProjectId
      return await datastoreApi.healthCheck(projectId)
    } catch {
      return false
    }
  }

  // Export entities (Datastore emulator API)
  const exportEntities = async (projectId: string, exportDirectory: string) => {
    try {
      loading.value = true
      return await datastoreApi.exportEntities(projectId, exportDirectory)
    } catch (error) {
      console.error('Failed to export entities:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Import entities (Datastore emulator API)
  const importEntities = async (projectId: string, metadataFilePath: string) => {
    try {
      loading.value = true
      const result = await datastoreApi.importEntities(projectId, metadataFilePath)

      // Refresh kinds and entities after import
      await loadKinds(projectId)

      return result
    } catch (error) {
      console.error('Failed to import entities:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Export entities as JSON
  const exportEntitiesAsJson = async (projectId: string, namespaceId?: string) => {
    try {
      loading.value = true
      return await datastoreApi.exportEntitiesAsJson(projectId, namespaceId)
    } catch (error) {
      console.error('Failed to export entities as JSON:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Clear all data
  const clearData = () => {
    kinds.value = []
    entities.value.clear()
  }

  return {
    loading,
    databases,
    kinds,
    namespaces,
    entities,
    selectedDatabase,
    selectedNamespace,
    getEntitiesByKind,
    // Database operations
    getCurrentDatabase,
    setSelectedDatabase,
    loadDatabases,
    // Namespace operations
    getCurrentNamespace,
    setSelectedNamespace,
    loadNamespaces,
    // Kind operations
    loadKinds,
    deleteKind,
    // Entity operations
    loadEntities,
    getEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    // Import/Export
    exportEntities,
    exportEntitiesAsJson,
    importEntities,
    // Utility
    healthCheck,
    clearData,
  }
})
