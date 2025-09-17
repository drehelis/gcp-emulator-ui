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

  const getDocumentsByCollection = computed(() => {
    return (collectionId: string) => documents.value.get(collectionId) || []
  })

  // Load collections
  const loadCollections = async (projectId: string) => {
    try {
      loading.value = true
      const databasePath = firestoreApi.getDefaultDatabasePath(projectId)
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
      const databasePath = firestoreApi.getDefaultDatabasePath(projectId)

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

  // Load documents
  const loadDocuments = async (projectId: string, collectionId: string) => {
    try {
      loading.value = true
      const databasePath = firestoreApi.getDefaultDatabasePath(projectId)
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
      const databasePath = firestoreApi.getDefaultDatabasePath(projectId)
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

  // Delete collection
  const deleteCollection = async (projectId: string, collectionId: string) => {
    try {
      loading.value = true
      const databasePath = firestoreApi.getDefaultDatabasePath(projectId)

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

  return {
    loading,
    collections,
    documents,
    getDocumentsByCollection,
    loadCollections,
    createCollection,
    loadDocuments,
    updateDocument,
    deleteCollection,
    healthCheck
  }
})