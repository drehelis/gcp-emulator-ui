import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDatastoreImportExport } from '../useDatastoreImportExport'
import { createPinia, setActivePinia } from 'pinia'
import datastoreApi from '@/api/datastore'

// Mock dependencies
const mockAppStore = vi.hoisted(() => ({
  showToast: vi.fn(),
}))

const mockDatastoreStore = vi.hoisted(() => ({
  loadNamespaces: vi.fn(),
  loadDatabases: vi.fn(),
  loadKinds: vi.fn(),
  exportEntities: vi.fn(),
  exportEntitiesAsJson: vi.fn(),
  importEntities: vi.fn(),
}))

vi.mock('@/api/datastore', () => ({
  default: {
    uploadFiles: vi.fn(),
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => mockAppStore),
}))

vi.mock('@/stores/datastore', () => ({
  useDatastoreStore: vi.fn(() => mockDatastoreStore),
}))

// Mock URL.createObjectURL and revokeObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'mock-url')
  window.URL.revokeObjectURL = vi.fn()
}

describe('useDatastoreImportExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.resetAllMocks()
  })

  it('should initialize with default values', () => {
    const { isExporting, isExportingJson, isImporting, isUploading } = useDatastoreImportExport()
    expect(isExporting.value).toBe(false)
    expect(isExportingJson.value).toBe(false)
    expect(isImporting.value).toBe(false)
    expect(isUploading.value).toBe(false)
  })

  describe('loadData', () => {
    it('should load namespaces, databases and kinds', async () => {
      const { loadData } = useDatastoreImportExport()
      await loadData('p1')
      expect(mockDatastoreStore.loadNamespaces).toHaveBeenCalledWith('p1')
      expect(mockDatastoreStore.loadDatabases).toHaveBeenCalledWith('p1')
      expect(mockDatastoreStore.loadKinds).toHaveBeenCalledWith('p1')
    })
  })

  describe('exportEntities', () => {
    it('should trigger native export and download', async () => {
      // Mock document.createElement to track the link click
      const mockLink = { href: '', download: '', click: vi.fn() }
      const spy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as any)
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({}) as any)

      const { exportEntities } = useDatastoreImportExport()
      await exportEntities('p1')

      expect(mockDatastoreStore.exportEntities).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Download started' })
      )

      spy.mockRestore()
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })

    it('should handle export failures', async () => {
      mockDatastoreStore.exportEntities.mockRejectedValue(new Error('Export failed'))
      const { exportEntities } = useDatastoreImportExport()

      await expect(exportEntities('p1')).rejects.toThrow('Export failed')
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      )
    })
  })

  describe('exportEntitiesAsJson', () => {
    it('should export entities as JSON file', async () => {
      const mockJson = {
        namespaces: [
          {
            kinds: [{ count: 5 }],
          },
        ],
      }
      mockDatastoreStore.exportEntitiesAsJson.mockResolvedValue(mockJson)

      const { exportEntitiesAsJson } = useDatastoreImportExport()
      await exportEntitiesAsJson('p1', 'ns1')

      expect(mockDatastoreStore.exportEntitiesAsJson).toHaveBeenCalledWith('p1', 'ns1')
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'JSON export completed' })
      )
    })
  })

  describe('importEntities', () => {
    it('should upload and import files', async () => {
      const mockFiles = [
        { name: 'file1', webkitRelativePath: 'folder/file1' } as any,
        { name: 'metadata', webkitRelativePath: 'folder/metadata' } as any,
      ]
      const metadataFile = mockFiles[1]

      const { importEntities } = useDatastoreImportExport()
      await importEntities('p1', mockFiles, metadataFile)

      expect(datastoreApi.uploadFiles).toHaveBeenCalledWith(mockFiles, '/')
      expect(mockDatastoreStore.importEntities).toHaveBeenCalledWith('p1', '/srv/folder/metadata')
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      )
    })

    it('should throw if no metadata file provided', async () => {
      const { importEntities } = useDatastoreImportExport()
      await expect(importEntities('p1', [], null)).rejects.toThrow('No metadata file provided')
    })

    it('should handle import failures', async () => {
      datastoreApi.uploadFiles.mockRejectedValue(new Error('Upload failed'))
      const { importEntities } = useDatastoreImportExport()

      await expect(
        importEntities('p1', [{ name: 'f1' } as any], { name: 'm1' } as any)
      ).rejects.toThrow('Upload failed')
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      )
    })
  })
})
