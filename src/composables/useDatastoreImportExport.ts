import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDatastoreStore } from '@/stores/datastore'

export function useDatastoreImportExport() {
  const appStore = useAppStore()
  const datastoreStore = useDatastoreStore()

  const isExporting = ref(false)
  const isExportingJson = ref(false)
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

  // Export entities as JSON and download
  const exportEntitiesAsJson = async (projectId: string, namespaceId?: string) => {
    isExportingJson.value = true
    try {
      // Query all entities and get as JSON
      const jsonData = await datastoreStore.exportEntitiesAsJson(projectId, namespaceId)

      // Create blob and download
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `datastore-export-${projectId}-${namespaceId || 'default'}-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Calculate totals
      const totalNamespaces = jsonData.namespaces.length
      const totalKinds = jsonData.namespaces.reduce((sum: number, ns: any) => sum + ns.kinds.length, 0)
      const totalEntities = jsonData.namespaces.reduce(
        (sum: number, ns: any) => sum + ns.kinds.reduce((kindSum: number, k: any) => kindSum + k.count, 0),
        0
      )

      appStore.showToast({
        type: 'success',
        title: 'JSON export completed',
        message: `Downloaded ${totalNamespaces} namespace(s), ${totalKinds} kind(s), ${totalEntities} entitie(s)`
      })
    } catch (error) {
      console.error('JSON export failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'JSON export failed',
        message: (error as Error).message
      })
      throw error
    } finally {
      isExportingJson.value = false
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
    isExportingJson,
    isImporting,
    loadData,
    exportEntities,
    exportEntitiesAsJson,
    importEntities
  }
}
