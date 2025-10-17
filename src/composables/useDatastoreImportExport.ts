import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDatastoreStore } from '@/stores/datastore'

export function useDatastoreImportExport() {
  const appStore = useAppStore()
  const datastoreStore = useDatastoreStore()

  const isExporting = ref(false)
  const isImporting = ref(false)

  // Load data
  const loadData = async (projectId: string) => {
    try {
      await datastoreStore.loadNamespaces(projectId)
      await datastoreStore.loadDatabases(projectId)
      await datastoreStore.loadKinds(projectId)
    } catch (error) {
      console.error('Failed to load Datastore data:', error)
      throw error
    }
  }

  // Export entities to a directory on the emulator host
  const exportEntities = async (projectId: string, exportDirectory: string) => {
    isExporting.value = true
    try {
      // Call the Datastore emulator export API
      await datastoreStore.exportEntities(projectId, exportDirectory)

      appStore.showToast({
        type: 'success',
        title: 'Datastore export started',
        message: `Exporting to ${exportDirectory}`
      })
    } catch (error) {
      console.error('Datastore export failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Export failed',
        message: (error as Error).message
      })
      throw error
    } finally {
      isExporting.value = false
    }
  }

  // Import entities from a metadata file path
  const importEntities = async (projectId: string, metadataFilePath: string) => {
    isImporting.value = true
    try {
      // Call the Datastore emulator import API
      await datastoreStore.importEntities(projectId, metadataFilePath)

      // Reload data
      await loadData(projectId)

      appStore.showToast({
        type: 'success',
        title: 'Datastore import completed',
        message: 'Datastore entities imported'
      })
    } catch (error) {
      console.error('Datastore import failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Import failed',
        message: (error as Error).message
      })
      throw error
    } finally {
      isImporting.value = false
    }
  }

  return {
    isExporting,
    isImporting,
    loadData,
    exportEntities,
    importEntities
  }
}
