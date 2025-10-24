import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDatastoreStore } from '@/stores/datastore'
import datastoreApi from '@/api/datastore'

export function useDatastoreImportExport() {
  const appStore = useAppStore()
  const datastoreStore = useDatastoreStore()

  const isExporting = ref(false)
  const isExportingJson = ref(false)
  const isImporting = ref(false)
  const isUploading = ref(false)

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

  // Export entities to /srv directory and provide download link
  const exportEntities = async (projectId: string) => {
    isExporting.value = true
    try {
      // Export to /srv directory (accessible via /fs)
      const exportDirectory = '/srv'
      await datastoreStore.exportEntities(projectId, exportDirectory)

      // The export API returns empty {}, so we need to construct the directory name
      // The emulator creates directories with format: datastore_export_{unix_timestamp_in_seconds}
      const exportDirName = `datastore_export_${Math.floor(Date.now() / 1000)}`

      // Trigger download via miniserve's tar.gz download feature
      // Miniserve with --enable-tar-gz compresses folders on the fly
      // Use a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = `/fs/${exportDirName}/?download=tar_gz`
      link.download = `${exportDirName}.tar.gz`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      appStore.showToast({
        type: 'success',
        title: 'Download started',
        message: `Downloading ${exportDirName}.tar.gz`
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

  // Upload files and import entities
  const importEntities = async (projectId: string, files: File[], metadataFile: File | null) => {
    isImporting.value = true
    isUploading.value = true
    try {
      if (!metadataFile) {
        throw new Error('No metadata file provided')
      }

      // Step 1: Detect the root folder name from file paths
      let rootFolder = ''
      if (files.length > 0 && files[0]?.webkitRelativePath) {
        const parts = files[0].webkitRelativePath.split('/')
        rootFolder = parts[0] || ''
      }

      // Step 2: Upload files to /srv via miniserve
      await datastoreApi.uploadFiles(files, '/')

      isUploading.value = false

      // Step 3: Call the Datastore emulator import API
      // Import path must point to the metadata file
      const importPath = rootFolder ? `/srv/${rootFolder}/${metadataFile.name}` : `/srv/${metadataFile.name}`
      await datastoreStore.importEntities(projectId, importPath)

      // Step 4: Reload data
      await loadData(projectId)

      appStore.showToast({
        type: 'success',
        title: 'Import completed',
        message: `Successfully imported ${files.length} file(s)`
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
      isUploading.value = false
    }
  }

  return {
    isExporting,
    isExportingJson,
    isImporting,
    isUploading,
    loadData,
    exportEntities,
    exportEntitiesAsJson,
    importEntities
  }
}
