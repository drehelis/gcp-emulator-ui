import { ref } from 'vue'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'

export const useModalManager = () => {
  // Collection modals
  const showCreateCollectionModal = ref(false)
  const isCreatingRootCollection = ref(false)
  const showDeleteCollectionModal = ref(false)
  const isDeletingCollection = ref(false)
  const collectionToDelete = ref<FirestoreCollectionWithMetadata | null>(null)

  // Document modals
  const showAddDocumentModal = ref(false)
  const cloneDocumentData = ref<FirestoreDocument | null>(null)
  const isAddingToSubcollection = ref(false)
  const subcollectionPath = ref<string | null>(null)
  const showDeleteDocumentModal = ref(false)
  const isDeletingDocument = ref(false)
  const documentToDelete = ref<FirestoreDocument | null>(null)
  const showDeleteAllFieldsModal = ref(false)
  const isDeletingAllFields = ref(false)

  // Field modals
  const showFieldModal = ref(false)
  const fieldModalMode = ref<'add' | 'edit'>('add')
  const fieldModalData = ref({
    fieldName: '',
    fieldType: 'string',
    fieldValue: '',
    fieldPath: '',
    isNew: false,
    parentPath: ''
  })
  const showDeleteFieldModal = ref(false)
  const isDeletingField = ref(false)
  const fieldToDelete = ref<{ path: string; displayName: string } | null>(null)

  // Collection actions
  const openCreateCollectionModal = (forceRoot = false) => {
    isCreatingRootCollection.value = forceRoot
    showCreateCollectionModal.value = true
  }

  const openCreateRootCollectionModal = () => {
    isCreatingRootCollection.value = true
    isAddingToSubcollection.value = false
    subcollectionPath.value = null
    showCreateCollectionModal.value = true
  }

  const openDeleteCollectionModal = (collection: FirestoreCollectionWithMetadata) => {
    collectionToDelete.value = collection
    showDeleteCollectionModal.value = true
  }

  const closeDeleteCollectionModal = () => {
    showDeleteCollectionModal.value = false
    collectionToDelete.value = null
  }

  // Document actions
  const openAddDocumentModal = () => {
    isAddingToSubcollection.value = false
    subcollectionPath.value = null
    showAddDocumentModal.value = true
  }

  const openAddSubcollectionDocumentModal = (subcollectionFullPath: string) => {
    isAddingToSubcollection.value = true
    subcollectionPath.value = subcollectionFullPath
    showAddDocumentModal.value = true
  }

  const openCloneDocumentModal = (document: FirestoreDocument) => {
    cloneDocumentData.value = document
    isAddingToSubcollection.value = false
    subcollectionPath.value = null
    showAddDocumentModal.value = true
  }

  const closeAddDocumentModal = () => {
    cloneDocumentData.value = null
    isAddingToSubcollection.value = false
    subcollectionPath.value = null
  }

  const openDeleteDocumentModal = (document: FirestoreDocument) => {
    documentToDelete.value = document
    showDeleteDocumentModal.value = true
  }

  const closeDeleteDocumentModal = () => {
    showDeleteDocumentModal.value = false
    documentToDelete.value = null
  }

  const openDeleteAllFieldsModal = () => {
    showDeleteAllFieldsModal.value = true
  }

  const closeDeleteAllFieldsModal = () => {
    showDeleteAllFieldsModal.value = false
  }

  // Field actions
  const openAddFieldModal = () => {
    fieldModalMode.value = 'add'
    fieldModalData.value = {
      fieldName: '',
      fieldType: 'string',
      fieldValue: '',
      fieldPath: '',
      isNew: true,
      parentPath: ''
    }
    showFieldModal.value = true
  }

  const openEditFieldModal = (data: { path: string; fieldName: string; fieldValue: any; fieldType: string; editableValue: any }) => {
    fieldModalMode.value = 'edit'
    fieldModalData.value = {
      fieldName: data.fieldName,
      fieldType: data.fieldType,
      fieldValue: data.editableValue,
      fieldPath: data.path,
      isNew: false,
      parentPath: ''
    }
    showFieldModal.value = true
  }

  const openAddToMapModal = (fieldPath: string) => {
    fieldModalMode.value = 'add'
    fieldModalData.value = {
      fieldName: '',
      fieldType: 'string',
      fieldValue: '',
      fieldPath: `${fieldPath}.newField`,
      isNew: true,
      parentPath: fieldPath
    }
    showFieldModal.value = true
  }

  const openAddToArrayModal = (fieldPath: string) => {
    fieldModalMode.value = 'add'
    fieldModalData.value = {
      fieldName: '',
      fieldType: 'string',
      fieldValue: '',
      fieldPath: `${fieldPath}[new]`,
      isNew: true,
      parentPath: fieldPath
    }
    showFieldModal.value = true
  }

  const closeFieldModal = () => {
    showFieldModal.value = false
  }

  const openDeleteFieldModal = (data: { path: string; displayName: string }) => {
    fieldToDelete.value = data
    showDeleteFieldModal.value = true
  }

  const closeDeleteFieldModal = () => {
    showDeleteFieldModal.value = false
    fieldToDelete.value = null
  }

  return {
    // Collection modal state
    showCreateCollectionModal,
    isCreatingRootCollection,
    showDeleteCollectionModal,
    isDeletingCollection,
    collectionToDelete,

    // Document modal state
    showAddDocumentModal,
    cloneDocumentData,
    isAddingToSubcollection,
    subcollectionPath,
    showDeleteDocumentModal,
    isDeletingDocument,
    documentToDelete,
    showDeleteAllFieldsModal,
    isDeletingAllFields,

    // Field modal state
    showFieldModal,
    fieldModalMode,
    fieldModalData,
    showDeleteFieldModal,
    isDeletingField,
    fieldToDelete,

    // Actions
    openCreateCollectionModal,
    openCreateRootCollectionModal,
    openDeleteCollectionModal,
    closeDeleteCollectionModal,
    openAddDocumentModal,
    openAddSubcollectionDocumentModal,
    openCloneDocumentModal,
    closeAddDocumentModal,
    openDeleteDocumentModal,
    closeDeleteDocumentModal,
    openDeleteAllFieldsModal,
    closeDeleteAllFieldsModal,
    openAddFieldModal,
    openEditFieldModal,
    openAddToMapModal,
    openAddToArrayModal,
    closeFieldModal,
    openDeleteFieldModal,
    closeDeleteFieldModal
  }
}