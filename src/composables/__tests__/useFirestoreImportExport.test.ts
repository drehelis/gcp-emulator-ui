import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFirestoreImportExport } from '../useFirestoreImportExport'
import { createPinia, setActivePinia } from 'pinia'
import { firestoreApi } from '@/api/firestore'
import { downloadFile } from '@/utils/importExportUtils'

// Mock dependencies
const mockAppStore = vi.hoisted(() => ({
  showToast: vi.fn(),
}))

const mockFirestoreStore = vi.hoisted(() => ({
  loadCollections: vi.fn(),
  getCurrentDatabasePath: vi.fn(projectId => `projects/${projectId}/databases/(default)`),
}))

vi.mock('@/api/firestore', () => ({
  firestoreApi: {
    listCollections: vi.fn(),
    listDocuments: vi.fn(),
    listSubcollections: vi.fn(),
    listSubcollectionDocuments: vi.fn(),
    createDocument: vi.fn(),
    createSubcollection: vi.fn(),
    updateDocument: vi.fn(),
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => mockAppStore),
}))

vi.mock('@/stores/firestore', () => ({
  useFirestoreStore: vi.fn(() => mockFirestoreStore),
}))

vi.mock('@/utils/importExportUtils', () => ({
  downloadFile: vi.fn(),
}))

describe('useFirestoreImportExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.resetAllMocks()
    // Reset implementations to default success
    ;(firestoreApi.listCollections as any).mockResolvedValue({ collections: [] })
    ;(firestoreApi.listDocuments as any).mockResolvedValue({ documents: [] })
    ;(firestoreApi.listSubcollections as any).mockResolvedValue({ collections: [] })
  })

  it('should initialize with default values', () => {
    const { isExporting, isImporting } = useFirestoreImportExport()
    expect(isExporting.value).toBe(false)
    expect(isImporting.value).toBe(false)
  })

  describe('loadData', () => {
    it('should load collections through the store', async () => {
      const { loadData } = useFirestoreImportExport()
      await loadData('p1')
      expect(mockFirestoreStore.loadCollections).toHaveBeenCalledWith('p1')
    })
  })

  describe('exportCollections', () => {
    it('should export nested collections and documents', async () => {
      // Mock top-level collection
      ;(firestoreApi.listCollections as any).mockResolvedValueOnce({
        collections: [{ name: 'projects/p1/databases/(default)/collectionGroups/c1', id: 'c1' }],
      })
      // Mock document in c1
      ;(firestoreApi.listDocuments as any).mockResolvedValueOnce({
        documents: [{ name: 'projects/p1/databases/(default)/documents/c1/d1', fields: {} }],
      })
      // Mock subcollection in d1
      ;(firestoreApi.listSubcollections as any).mockResolvedValueOnce({
        collections: [{ name: 'projects/p1/databases/(default)/documents/c1/d1/sub1', id: 'sub1' }],
      })
      // Ensure nested calls return empty
      ;(firestoreApi.listSubcollections as any).mockResolvedValue({ collections: [] })

      // Mock document in sub1
      ;(firestoreApi.listSubcollectionDocuments as any).mockResolvedValueOnce({
        documents: [
          { name: 'projects/p1/databases/(default)/documents/c1/d1/sub1/sd1', fields: {} },
        ],
      })

      const { exportCollections } = useFirestoreImportExport()
      await exportCollections('p1')

      expect(downloadFile).toHaveBeenCalled()
      const exportData = JSON.parse((downloadFile as any).mock.calls[0][0])

      expect(exportData).toHaveLength(1)
      expect(exportData[0].collectionId).toBe('c1')
      expect(exportData[0].documents[0].document.name).toContain('d1')
      expect(exportData[0].documents[0].subcollections[0].collectionId).toBe('sub1')
      expect(exportData[0].documents[0].subcollections[0].documents[0].document.name).toContain(
        'sd1'
      )
    })

    it('should notify if no collections found', async () => {
      ;(firestoreApi.listCollections as any).mockResolvedValue({ collections: [] })
      const { exportCollections } = useFirestoreImportExport()
      await exportCollections('p1')

      expect(downloadFile).not.toHaveBeenCalled()
      expect(mockAppStore.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }))
    })
  })

  describe('importCollections', () => {
    const mockImportData = [
      {
        collectionId: 'c1',
        documents: [
          {
            document: { name: 'projects/p1/databases/(default)/documents/c1/d1', fields: {} },
            subcollections: [
              {
                collectionId: 'sub1',
                documents: [
                  {
                    document: {
                      name: 'projects/p1/databases/(default)/documents/c1/d1/sub1/sd1',
                      fields: {},
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    it('should import recursive data using creation APIs', async () => {
      const options = { overwriteExisting: false }
      const { importCollections } = useFirestoreImportExport()

      await importCollections('p1', mockImportData, options)

      expect(firestoreApi.createDocument).toHaveBeenCalled()
      expect(firestoreApi.createSubcollection).toHaveBeenCalled()
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      )
    })

    it('should use update APIs when overwriteExisting is true', async () => {
      const options = { overwriteExisting: true }
      ;(firestoreApi.updateDocument as any).mockResolvedValue({})

      const { importCollections } = useFirestoreImportExport()
      await importCollections('p1', mockImportData, options)

      expect(firestoreApi.updateDocument).toHaveBeenCalled()
    })

    it('should notify if no documents to import', async () => {
      const { importCollections } = useFirestoreImportExport()
      await importCollections('p1', [], { overwriteExisting: false })

      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info', title: 'No documents to import' })
      )
    })

    it('should handle "already exists" errors gracefully during creation', async () => {
      const options = { overwriteExisting: false }
      ;(firestoreApi.createDocument as any).mockRejectedValueOnce({ message: 'already exists' })

      const { importCollections } = useFirestoreImportExport()
      await importCollections('p1', mockImportData, options)

      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }) // Still succeeds because we skip existing
      )
    })

    it('should try creating if update fails when overwriteExisting is true', async () => {
      const options = { overwriteExisting: true }
      // Update fails, then create succeeds
      ;(firestoreApi.updateDocument as any).mockRejectedValueOnce(new Error('Update failed'))
      ;(firestoreApi.createDocument as any).mockResolvedValueOnce({})

      const { importCollections } = useFirestoreImportExport()
      await importCollections('p1', mockImportData, options)

      expect(firestoreApi.createDocument).toHaveBeenCalled()
      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      )
    })

    it('should handle mixed import results', async () => {
      const mixedData = [
        { collectionId: 'c1', documents: [{ document: { name: 'doc1', fields: {} } }] },
        { collectionId: 'c1', documents: [{ document: { name: 'doc2', fields: {} } }] },
      ]

      // First fails, second succeeds
      ;(firestoreApi.createDocument as any)
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce({})

      const { importCollections } = useFirestoreImportExport()
      await importCollections('p1', mixedData, { overwriteExisting: false })

      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: expect.stringContaining('completed with errors'),
        })
      )
    })

    it('should handle import errors gracefully', async () => {
      ;(firestoreApi.createDocument as any).mockRejectedValue(new Error('API Error'))
      const { importCollections } = useFirestoreImportExport()

      await importCollections('p1', mockImportData, { overwriteExisting: false })

      expect(mockAppStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      )
    })
  })
})
