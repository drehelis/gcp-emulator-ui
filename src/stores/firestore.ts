/**
 * Minimal Firestore store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  FirestoreDocument,
  FirestoreCollectionWithMetadata,
  CreateDocumentRequest,
} from '@/types'
import firestoreApi from '@/api/firestore'
import { useProjectsStore } from './projects'

export const useFirestoreStore = defineStore('firestore', () => {
  const loading = ref(false)
  const collections = ref<FirestoreCollectionWithMetadata[]>([])
  const documents = ref<Map<string, FirestoreDocument[]>>(new Map())

  // Database management with localStorage persistence
  const STORAGE_KEY_DATABASES = 'firestore-databases'
  const STORAGE_KEY_SELECTED_DB = 'firestore-selected-database'

  // Load databases from localStorage
  const loadDatabasesFromStorage = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DATABASES)
      return stored ? JSON.parse(stored) : ['(default)']
    } catch {
      return ['(default)']
    }
  }

  // Load selected database from localStorage
  const loadSelectedDatabaseFromStorage = (): string => {
    return localStorage.getItem(STORAGE_KEY_SELECTED_DB) || '(default)'
  }

  // Save databases to localStorage
  const saveDatabasesToStorage = (databaseList: string[]) => {
    localStorage.setItem(STORAGE_KEY_DATABASES, JSON.stringify(databaseList))
  }

  // Save selected database to localStorage
  const saveSelectedDatabaseToStorage = (databaseId: string) => {
    localStorage.setItem(STORAGE_KEY_SELECTED_DB, databaseId)
  }

  const availableDatabases = ref<string[]>(loadDatabasesFromStorage())
  const selectedDatabase = ref<string>(loadSelectedDatabaseFromStorage())
  const testingDatabase = ref(false)

  const getDocumentsByCollection = computed(() => {
    return (collectionId: string) => documents.value.get(collectionId) || []
  })

  // Add a new database
  const addDatabase = async (projectId: string, databaseId: string): Promise<boolean> => {
    try {
      testingDatabase.value = true

      // Test if database exists
      const exists = await firestoreApi.testDatabase(projectId, databaseId)
      if (!exists) {
        return false
      }

      // Add to available databases if not already present
      if (!availableDatabases.value.includes(databaseId)) {
        availableDatabases.value.push(databaseId)
        availableDatabases.value.sort((a, b) => {
          if (a === '(default)') return -1
          if (b === '(default)') return 1
          return a.localeCompare(b)
        })
        saveDatabasesToStorage(availableDatabases.value)
      }

      return true
    } catch (error) {
      console.error('Failed to add database:', error)
      return false
    } finally {
      testingDatabase.value = false
    }
  }

  // Remove a database (except default)
  const removeDatabase = (databaseId: string) => {
    if (databaseId === '(default)') return

    availableDatabases.value = availableDatabases.value.filter(db => db !== databaseId)
    saveDatabasesToStorage(availableDatabases.value)

    // If the removed database was selected, switch to default
    if (selectedDatabase.value === databaseId) {
      setSelectedDatabase('(default)')
    }
  }

  // Set selected database
  const setSelectedDatabase = (databaseId: string) => {
    selectedDatabase.value = databaseId
    saveSelectedDatabaseToStorage(databaseId)
  }

  // Get current database path
  const getCurrentDatabasePath = (projectId: string): string => {
    return firestoreApi.getDatabasePath(projectId, selectedDatabase.value)
  }

  // Load collections
  const loadCollections = async (projectId: string) => {
    try {
      loading.value = true
      const databasePath = getCurrentDatabasePath(projectId)
      const response = await firestoreApi.listCollections(databasePath)

      collections.value = response.collections.map(collection => ({
        id: collection.collectionId,
        name: collection.name,
        path: collection.name,
        documentCount: 0,
        isExpanded: false,
        statistics: {
          name: collection.name,
          documentCount: 0,
          totalSize: 0,
          lastModified: new Date()
        }
      }))
    } catch (error) {
      console.warn('Failed to load collections:', error)
    } finally {
      loading.value = false
    }
  }

  // Create collection
  const createCollection = async (projectId: string, collectionId: string, initialDocument?: any, documentId?: string) => {
    try {
      loading.value = true
      const databasePath = getCurrentDatabasePath(projectId)

      const request: CreateDocumentRequest = {
        parent: databasePath,
        collectionId,
        documentId,
        document: initialDocument || { fields: { placeholder: { stringValue: 'Initial document' } } }
      }

      await firestoreApi.createDocument(request)

      // Add to local state
      const newCollection: FirestoreCollectionWithMetadata = {
        id: collectionId,
        name: `${databasePath}/documents/${collectionId}`,
        path: `${databasePath}/documents/${collectionId}`,
        documentCount: 1,
        isExpanded: false,
        statistics: {
          name: `${databasePath}/documents/${collectionId}`,
          documentCount: 1,
          totalSize: 0,
          lastModified: new Date()
        }
      }

      if (!collections.value.find(c => c.id === collectionId)) {
        collections.value.push(newCollection)
      }

      return true
    } catch (error) {
      console.error('Failed to create collection:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // Create subcollection
  const createSubcollection = async (
    parentDocumentPath: string,
    collectionId: string,
    initialDocument?: any,
    documentId?: string
  ) => {
    try {
      loading.value = true

      const document = initialDocument || { fields: { placeholder: { stringValue: 'Initial document' } } }

      await firestoreApi.createSubcollection(
        parentDocumentPath,
        collectionId,
        document,
        documentId
      )

      return true
    } catch (error) {
      console.error('Failed to create subcollection:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // Create document in existing collection
  const createDocument = async (projectId: string, collectionId: string, document: any, documentId?: string) => {
    try {
      loading.value = true
      const databasePath = getCurrentDatabasePath(projectId)

      const request: CreateDocumentRequest = {
        parent: databasePath,
        collectionId,
        documentId,
        document
      }

      const createdDocument = await firestoreApi.createDocument(request)

      // Update local documents cache
      const currentDocs = documents.value.get(collectionId) || []
      documents.value.set(collectionId, [...currentDocs, createdDocument])

      // Update collection document count
      const collection = collections.value.find(c => c.id === collectionId)
      if (collection) {
        collection.documentCount = currentDocs.length + 1
      }

      return createdDocument
    } catch (error) {
      console.error('Failed to create document:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // Create document in subcollection
  const createSubcollectionDocument = async (parentDocumentPath: string, collectionId: string, document: any, documentId?: string) => {
    try {
      loading.value = true

      const createdDocument = await firestoreApi.createSubcollection(
        parentDocumentPath,
        collectionId,
        document,
        documentId
      )
      return createdDocument
    } catch (error) {
      console.error('Failed to create subcollection document:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  // Load documents
  const loadDocuments = async (projectId: string, collectionId: string) => {
    try {
      loading.value = true
      const databasePath = getCurrentDatabasePath(projectId)
      const response = await firestoreApi.listDocuments(databasePath, collectionId)
      documents.value.set(collectionId, response.documents)

      // Update collection document count
      const collection = collections.value.find(c => c.id === collectionId)
      if (collection) {
        collection.documentCount = response.documents.length
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      documents.value.set(collectionId, [])
    } finally {
      loading.value = false
    }
  }

  // Update document
  const updateDocument = async (projectId: string, collectionId: string, documentId: string, document: any) => {
    try {
      loading.value = true
      const databasePath = getCurrentDatabasePath(projectId)
      const documentPath = `${databasePath}/documents/${collectionId}/${documentId}`

      await firestoreApi.updateDocument(documentPath, document)

      return true
    } catch (error) {
      console.error('Failed to update document:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete document
  const deleteDocument = async (documentPath: string, collectionId?: string) => {
    try {
      loading.value = true
      await firestoreApi.deleteDocument(documentPath)

      // Update local documents cache if collectionId is provided
      if (collectionId) {
        const currentDocs = documents.value.get(collectionId) || []
        const updatedDocs = currentDocs.filter(doc => doc.name !== documentPath)
        documents.value.set(collectionId, updatedDocs)

        // Update collection document count
        const collection = collections.value.find(c => c.id === collectionId)
        if (collection) {
          collection.documentCount = updatedDocs.length
        }
      }

      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete collection
  const deleteCollection = async (projectId: string, collectionId: string) => {
    try {
      loading.value = true
      const databasePath = getCurrentDatabasePath(projectId)

      await firestoreApi.deleteCollection(databasePath, collectionId)

      // Remove from local state
      collections.value = collections.value.filter(c => c.id !== collectionId)
      documents.value.delete(collectionId)

      return true
    } catch (error) {
      console.error('Failed to delete collection:', error)
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
      return await firestoreApi.healthCheck(projectId)
    } catch {
      return false
    }
  }

  // Load subcollections for a document
  const loadSubcollections = async (documentPath: string) => {
    try {
      const response = await firestoreApi.listSubcollections(documentPath)

      return response.collections.map(collection => ({
        id: collection.collectionId,
        name: collection.name,
        path: collection.name,
        documentCount: 0,
        isExpanded: false,
        statistics: {
          name: collection.name,
          documentCount: 0,
          totalSize: 0,
          lastModified: new Date()
        }
      }))
    } catch (error) {
      console.error('Failed to load subcollections:', error)
      return []
    }
  }

  const clearData = () => {
    collections.value = []
    documents.value.clear()
  }

  return {
    loading,
    collections,
    documents,
    getDocumentsByCollection,
    // Database management
    availableDatabases,
    selectedDatabase,
    testingDatabase,
    addDatabase,
    removeDatabase,
    setSelectedDatabase,
    getCurrentDatabasePath,
    // Collection and document operations
    loadCollections,
    loadSubcollections,
    createCollection,
    createSubcollection,
    createDocument,
    createSubcollectionDocument,
    loadDocuments,
    updateDocument,
    deleteDocument,
    deleteCollection,
    healthCheck,
    clearData
  }
})