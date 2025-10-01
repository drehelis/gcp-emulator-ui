import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useStorageStore } from '@/stores/storage'
import type { StorageBucket, CreateBucketRequest } from '@/types/storage'
import { downloadFile } from '@/utils/importExportUtils'

interface StorageBucketConfig {
  name: string
  location?: string
  storageClass?: string
  uniformBucketLevelAccess?: boolean
  publicAccessPrevention?: 'enforced' | 'inherited'
  versioning?: boolean
  labels?: Record<string, string>
}

export function useStorageImportExport() {
  const appStore = useAppStore()
  const storageStore = useStorageStore()

  const buckets = ref<StorageBucket[]>([])
  const isExporting = ref(false)
  const isImporting = ref(false)

  // Load data
  const loadData = async () => {
    try {
      await storageStore.fetchBuckets()
      buckets.value = storageStore.buckets
    } catch (error) {
      console.error('Failed to load Storage data:', error)
      throw error
    }
  }

  // Export configuration
  const exportConfiguration = async (projectId: string) => {
    isExporting.value = true
    try {
      const exportData: StorageBucketConfig[] = buckets.value.map(bucket => ({
        name: bucket.name,
        location: bucket.location || 'US',
        storageClass: bucket.storageClass || 'STANDARD',
        uniformBucketLevelAccess: bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled || false,
        publicAccessPrevention: bucket.iamConfiguration?.publicAccessPrevention || 'inherited',
        versioning: bucket.versioning?.enabled || false,
        labels: bucket.labels || {}
      }))

      // Download the file
      downloadFile(
        JSON.stringify(exportData, null, 2),
        `storage-buckets-${projectId}-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      )

      appStore.showToast({
        type: 'success',
        title: 'Storage configuration exported',
        message: `Exported ${exportData.length} bucket configuration${exportData.length === 1 ? '' : 's'}`
      })
    } catch (error) {
      console.error('Storage export failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Export failed',
        message: (error as Error).message
      })
    } finally {
      isExporting.value = false
    }
  }

  // Import configuration
  const importConfiguration = async (importData: StorageBucketConfig[], options: any) => {
    isImporting.value = true
    try {
      let successCount = 0
      let errorCount = 0

      for (const bucketConfig of importData) {
        try {
          const existingBucket = buckets.value.find(b => b.name === bucketConfig.name)

          if (existingBucket && !options.overwriteExisting) {
            successCount++
            continue
          }

          const bucketRequest: CreateBucketRequest = {
            name: bucketConfig.name,
            location: bucketConfig.location || 'US',
            storageClass: bucketConfig.storageClass || 'STANDARD',
            iamConfiguration: {
              uniformBucketLevelAccess: {
                enabled: bucketConfig.uniformBucketLevelAccess || false
              },
              publicAccessPrevention: bucketConfig.publicAccessPrevention || 'inherited'
            }
          }

          await storageStore.createBucket(bucketRequest, true) // Silent mode to prevent spam notifications
          successCount++
        } catch {
          errorCount++
        }
      }

      // Reload data
      await loadData()

      // Show toast notification
      if (successCount > 0 && errorCount === 0) {
        appStore.showToast({
          type: 'success',
          title: 'Storage import completed successfully',
          message: `${successCount} bucket${successCount === 1 ? '' : 's'} imported`
        })
      } else if (successCount > 0 && errorCount > 0) {
        appStore.showToast({
          type: 'warning',
          title: 'Storage import completed with errors',
          message: `${successCount} successful, ${errorCount} failed`
        })
      } else {
        appStore.showToast({
          type: 'error',
          title: 'Storage import failed',
          message: `All ${errorCount} bucket${errorCount === 1 ? '' : 's'} failed to import`
        })
      }
    } catch (error) {
      console.error('Storage import failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Import failed',
        message: (error as Error).message
      })
    } finally {
      isImporting.value = false
    }
  }

  return {
    buckets,
    isExporting,
    isImporting,
    loadData,
    exportConfiguration,
    importConfiguration
  }
}
