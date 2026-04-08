import { describe, it, expect } from 'vitest'
import { useModalManager } from '../useModalManager'

describe('useModalManager', () => {
  it('should initialize with default values', () => {
    const manager = useModalManager()
    expect(manager.showCreateCollectionModal.value).toBe(false)
    expect(manager.isCreatingRootCollection.value).toBe(false)
    expect(manager.collectionToDelete.value).toBeNull()
    expect(manager.showAddDocumentModal.value).toBe(false)
    expect(manager.showFieldModal.value).toBe(false)
  })

  describe('Collection actions', () => {
    it('openCreateCollectionModal sets state', () => {
      const manager = useModalManager()
      manager.openCreateCollectionModal(true)
      expect(manager.isCreatingRootCollection.value).toBe(true)
      expect(manager.showCreateCollectionModal.value).toBe(true)
    })

    it('openCreateRootCollectionModal sets state', () => {
      const manager = useModalManager()
      manager.openCreateRootCollectionModal()
      expect(manager.isCreatingRootCollection.value).toBe(true)
      expect(manager.isAddingToSubcollection.value).toBe(false)
      expect(manager.showCreateCollectionModal.value).toBe(true)
    })

    it('openDeleteCollectionModal sets state', () => {
      const manager = useModalManager()
      const mockCol = { id: 'c1', name: 'c1', path: 'p/c1' }
      manager.openDeleteCollectionModal(mockCol as any)
      expect(manager.collectionToDelete.value).toEqual(mockCol)
      expect(manager.showDeleteCollectionModal.value).toBe(true)
    })

    it('closeDeleteCollectionModal resets state', () => {
      const manager = useModalManager()
      manager.openDeleteCollectionModal({} as any)
      manager.closeDeleteCollectionModal()
      expect(manager.collectionToDelete.value).toBeNull()
      expect(manager.showDeleteCollectionModal.value).toBe(false)
    })
  })

  describe('Document actions', () => {
    it('openAddSubcollectionDocumentModal sets state', () => {
      const manager = useModalManager()
      manager.openAddSubcollectionDocumentModal('path/to/sub')
      expect(manager.isAddingToSubcollection.value).toBe(true)
      expect(manager.subcollectionPath.value).toBe('path/to/sub')
      expect(manager.showAddDocumentModal.value).toBe(true)
    })

    it('openCloneDocumentModal sets state', () => {
      const manager = useModalManager()
      const mockDoc = { name: 'doc1', fields: {} }
      manager.openCloneDocumentModal(mockDoc as any)
      expect(manager.cloneDocumentData.value).toEqual(mockDoc)
      expect(manager.showAddDocumentModal.value).toBe(true)
    })

    it('closeAddDocumentModal resets state', () => {
      const manager = useModalManager()
      manager.openCloneDocumentModal({} as any)
      manager.closeAddDocumentModal()
      expect(manager.cloneDocumentData.value).toBeNull()
      expect(manager.isAddingToSubcollection.value).toBe(false)
    })
  })

  describe('Field actions', () => {
    it('openAddFieldModal sets state', () => {
      const manager = useModalManager()
      manager.openAddFieldModal()
      expect(manager.fieldModalMode.value).toBe('add')
      expect(manager.fieldModalData.value.isNew).toBe(true)
      expect(manager.showFieldModal.value).toBe(true)
    })

    it('openEditFieldModal sets state', () => {
      const manager = useModalManager()
      manager.openEditFieldModal({
        path: 'p1',
        fieldName: 'f1',
        fieldValue: 'v1',
        fieldType: 'string',
        editableValue: 'v1',
      })
      expect(manager.fieldModalMode.value).toBe('edit')
      expect(manager.fieldModalData.value.fieldName).toBe('f1')
      expect(manager.showFieldModal.value).toBe(true)
    })

    it('openAddToMapModal sets state', () => {
      const manager = useModalManager()
      manager.openAddToMapModal('parent.map')
      expect(manager.fieldModalData.value.parentPath).toBe('parent.map')
      expect(manager.fieldModalData.value.fieldPath).toBe('parent.map.newField')
    })

    it('openAddToArrayModal sets state', () => {
      const manager = useModalManager()
      manager.openAddToArrayModal('parent.array')
      expect(manager.fieldModalData.value.parentPath).toBe('parent.array')
      expect(manager.fieldModalData.value.fieldPath).toBe('parent.array[new]')
    })

    it('openDeleteFieldModal sets state', () => {
      const manager = useModalManager()
      const fieldData = { path: 'f1', displayName: 'Field 1' }
      manager.openDeleteFieldModal(fieldData)
      expect(manager.fieldToDelete.value).toEqual(fieldData)
      expect(manager.showDeleteFieldModal.value).toBe(true)
    })
  })
})
