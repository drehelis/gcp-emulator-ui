/**
 * Tests for useStorageImportExport composable
 * Storage import/export helpers for bucket configurations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useStorageImportExport } from '../useStorageImportExport'
import type { StorageBucket } from '@/types/storage'
import { downloadFile } from '@/utils/importExportUtils'

const mockShowToast = vi.fn()
const mockFetchBuckets = vi.fn()
const mockCreateBucket = vi.fn()

const storageStoreState = {
  buckets: [] as StorageBucket[],
}

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showToast: mockShowToast,
  }),
}))

vi.mock('@/stores/storage', () => ({
  useStorageStore: () => ({
    get buckets() {
      return storageStoreState.buckets
    },
    fetchBuckets: mockFetchBuckets,
    createBucket: mockCreateBucket,
  }),
}))

vi.mock('@/utils/importExportUtils', () => ({
  downloadFile: vi.fn(),
}))

describe('useStorageImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageStoreState.buckets = []
    mockShowToast.mockReset()
    mockFetchBuckets.mockReset().mockResolvedValue(undefined)
    mockCreateBucket.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loadData', () => {
    it('loads buckets from the storage store', async () => {
      const bucketsData: StorageBucket[] = [{ name: 'bucket-a' }]
      mockFetchBuckets.mockImplementation(async () => {
        storageStoreState.buckets = bucketsData
      })

      const { loadData, buckets } = useStorageImportExport()

      await loadData()

      expect(buckets.value).toEqual(bucketsData)
    })

    it('logs and rethrows errors', async () => {
      const error = new Error('load failed')
      mockFetchBuckets.mockRejectedValue(error)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { loadData } = useStorageImportExport()

      await expect(loadData()).rejects.toThrow('load failed')
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load Storage data:', error)

      consoleSpy.mockRestore()
    })
  })

  describe('exportConfiguration', () => {
    it('exports bucket configuration and shows success toast', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-06T10:30:00.000Z'))

      const { exportConfiguration, buckets, isExporting } = useStorageImportExport()
      buckets.value = [
        {
          name: 'alpha',
          location: 'EU',
          storageClass: 'NEARLINE',
          iamConfiguration: {
            uniformBucketLevelAccess: { enabled: true },
            publicAccessPrevention: 'enforced',
          },
          versioning: { enabled: true },
          labels: { team: 'a' },
        },
        {
          name: 'beta',
        },
      ]

      await exportConfiguration('project-1')

      const expectedExport = [
        {
          name: 'alpha',
          location: 'EU',
          storageClass: 'NEARLINE',
          uniformBucketLevelAccess: true,
          publicAccessPrevention: 'enforced',
          versioning: true,
          labels: { team: 'a' },
        },
        {
          name: 'beta',
          location: 'US',
          storageClass: 'STANDARD',
          uniformBucketLevelAccess: false,
          publicAccessPrevention: 'inherited',
          versioning: false,
          labels: {},
        },
      ]

      expect(downloadFile).toHaveBeenCalledWith(
        JSON.stringify(expectedExport, null, 2),
        'storage-buckets-project-1-2026-02-06.json',
        'application/json'
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Storage configuration exported' })
      )
      expect(isExporting.value).toBe(false)
    })

    it('handles export errors and shows error toast', async () => {
      const error = new Error('export failed')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const downloadFileMock = vi.mocked(downloadFile)
      downloadFileMock.mockImplementation(() => {
        throw error
      })

      const { exportConfiguration, buckets, isExporting } = useStorageImportExport()
      buckets.value = [{ name: 'alpha' }]

      await exportConfiguration('project-2')

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', title: 'Export failed', message: 'export failed' })
      )
      expect(consoleSpy).toHaveBeenCalledWith('Storage export failed:', error)
      expect(isExporting.value).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('importConfiguration', () => {
    it('skips existing buckets when overwrite is false and shows success', async () => {
      storageStoreState.buckets = [{ name: 'existing' }]
      const importData = [
        { name: 'existing' },
        { name: 'new-bucket', location: 'EU', storageClass: 'COLDLINE' },
      ]

      const { importConfiguration, buckets } = useStorageImportExport()
      buckets.value = [{ name: 'existing' }]

      await importConfiguration(importData, { overwriteExisting: false })

      expect(mockCreateBucket).toHaveBeenCalledTimes(1)
      expect(mockCreateBucket).toHaveBeenCalledWith(
        {
          name: 'new-bucket',
          location: 'EU',
          storageClass: 'COLDLINE',
          iamConfiguration: {
            uniformBucketLevelAccess: { enabled: false },
            publicAccessPrevention: 'inherited',
          },
        },
        true
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Storage import completed successfully' })
      )
    })

    it('shows warning when some buckets fail', async () => {
      const importData = [{ name: 'good' }, { name: 'bad' }]
      mockCreateBucket
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('create failed'))

      const { importConfiguration } = useStorageImportExport()

      await importConfiguration(importData, { overwriteExisting: true })

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning', title: 'Storage import completed with errors' })
      )
    })

    it('shows error when all buckets fail', async () => {
      const importData = [{ name: 'bad-1' }, { name: 'bad-2' }]
      mockCreateBucket.mockRejectedValue(new Error('create failed'))

      const { importConfiguration } = useStorageImportExport()

      await importConfiguration(importData, { overwriteExisting: true })

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', title: 'Storage import failed' })
      )
    })

    it('handles loadData failures with import failed toast', async () => {
      const error = new Error('reload failed')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetchBuckets.mockRejectedValue(error)

      const { importConfiguration } = useStorageImportExport()

      await importConfiguration([{ name: 'bucket' }], { overwriteExisting: true })

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', title: 'Import failed', message: 'reload failed' })
      )
      expect(consoleSpy).toHaveBeenCalledWith('Storage import failed:', error)

      consoleSpy.mockRestore()
    })
  })
})
