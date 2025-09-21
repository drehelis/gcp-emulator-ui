/**
 * Minimal Firestore API client for Firestore emulator integration
 */

import axios from 'axios'
import type {
  FirestoreDocument,
  CreateDocumentRequest,
  ListDocumentsResponse,
  ListCollectionsResponse,
} from '@/types'

const firestoreClient = axios.create({
  baseURL: import.meta.env.VITE_FIRESTORE_BASE_URL || '/firestore',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Handle URL encoding for (default) database name
firestoreClient.interceptors.request.use((config) => {
  if (config.url) {
    config.url = config.url.replace(/\(default\)/g, '%28default%29')
  }
  return config
})

export const firestoreApi = {
  // Create document
  async createDocument(request: CreateDocumentRequest): Promise<FirestoreDocument> {
    const { parent, collectionId, documentId, document } = request

    if (documentId) {
      // Create document with specific ID using POST with documentId parameter
      const path = `/v1/${parent}/documents/${collectionId}`
      const response = await firestoreClient.post(path, {
        fields: document.fields
      }, {
        params: { documentId }
      })
      return response.data
    } else {
      // Auto-generate document ID - use POST without documentId
      const path = `/v1/${parent}/documents/${collectionId}`
      const response = await firestoreClient.post(path, {
        fields: document.fields
      })
      return response.data
    }
  },

  // Create subcollection (document inside a subcollection path)
  async createSubcollection(
    parentDocumentPath: string,
    collectionId: string,
    document: any,
    documentId?: string
  ): Promise<FirestoreDocument> {
    console.log('Creating subcollection:', {
      parentDocumentPath,
      collectionId,
      documentId,
      document
    })

    if (documentId) {
      // Create document with specific ID using POST with documentId parameter
      const path = `/v1/${parentDocumentPath}/${collectionId}`
      console.log('Subcollection API call path:', path)
      const response = await firestoreClient.post(path, {
        fields: document.fields
      }, {
        params: { documentId }
      })
      console.log('Subcollection created successfully:', response.data)
      return response.data
    } else {
      // Auto-generate document ID - use POST without documentId
      const path = `/v1/${parentDocumentPath}/${collectionId}`
      console.log('Subcollection API call path:', path)
      const response = await firestoreClient.post(path, {
        fields: document.fields
      })
      console.log('Subcollection created successfully:', response.data)
      return response.data
    }
  },

  // List documents in a collection
  async listDocuments(parent: string, collectionId: string): Promise<ListDocumentsResponse> {
    const response = await firestoreClient.get(`/v1/${parent}/documents/${collectionId}`)
    return {
      documents: response.data.documents || [],
      nextPageToken: response.data.nextPageToken
    }
  },

  // List documents in a subcollection
  async listSubcollectionDocuments(parentDocumentPath: string, collectionId: string): Promise<ListDocumentsResponse> {
    const response = await firestoreClient.get(`/v1/${parentDocumentPath}/${collectionId}`)
    return {
      documents: response.data.documents || [],
      nextPageToken: response.data.nextPageToken
    }
  },

  // Discover collections by listing all documents
  async listCollections(parent: string): Promise<ListCollectionsResponse> {
    try {
      // List all documents at root to discover collections
      const response = await firestoreClient.get(`/v1/${parent}/documents/`)
      const documents = response.data.documents || []

      // Extract unique collection names
      const collectionNames = new Set<string>()
      documents.forEach((doc: any) => {
        const pathParts = doc.name.split('/')
        const documentsIndex = pathParts.indexOf('documents')
        if (documentsIndex !== -1 && pathParts.length > documentsIndex + 1) {
          collectionNames.add(pathParts[documentsIndex + 1])
        }
      })

      const collections = Array.from(collectionNames).map(name => ({
        name: `${parent}/documents/${name}`,
        collectionId: name
      }))

      return { collections, nextPageToken: undefined }
    } catch (error) {
      console.warn('Failed to discover collections:', error)
      return { collections: [], nextPageToken: undefined }
    }
  },

  // List subcollections for a specific document
  // Uses document listing endpoint to discover subcollections
  async listSubcollections(documentPath: string): Promise<ListCollectionsResponse> {
    try {
      // List all documents under the document path to discover subcollections
      // This endpoint returns all nested collections and documents
      const response = await firestoreClient.get(`/v1/${documentPath}/`)

      const documents = response.data.documents || []

      // Extract unique subcollection names from the nested document paths
      const subcollectionNames = new Set<string>()
      documents.forEach((doc: any) => {
        const pathParts = doc.name.split('/')
        // Find the index of our document in the path
        const documentIndex = pathParts.findIndex(part => documentPath.endsWith(part))
        // The next part after our document would be a subcollection
        if (documentIndex !== -1 && pathParts.length > documentIndex + 1) {
          subcollectionNames.add(pathParts[documentIndex + 1])
        }
      })

      const collections = Array.from(subcollectionNames).map(name => ({
        name: `${documentPath}/${name}`,
        id: name,
        path: `${documentPath}/${name}`
      }))

      return { collections, nextPageToken: undefined }
    } catch (error) {
      console.warn('Failed to list subcollections for document:', documentPath, error)
      return { collections: [], nextPageToken: undefined }
    }
  },

  // Health check
  async healthCheck(projectId?: string): Promise<boolean> {
    try {
      const project = projectId || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project'
      const databasePath = `projects/${project}/databases/(default)`
      await firestoreClient.get(`/v1/${databasePath}/documents/`, { timeout: 5000 })
      return true
    } catch {
      return false
    }
  },

  // Update document
  async updateDocument(documentPath: string, document: any): Promise<FirestoreDocument> {
    const response = await firestoreClient.patch(`/v1/${documentPath}`, document)
    return response.data
  },

  // Delete document
  async deleteDocument(documentPath: string): Promise<boolean> {
    try {
      await firestoreClient.delete(`/v1/${documentPath}`)
      return true
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  },

  // Delete collection (by deleting all documents)
  async deleteCollection(parent: string, collectionId: string): Promise<boolean> {
    try {
      // First, get all documents in the collection
      const response = await firestoreClient.get(`/v1/${parent}/documents/${collectionId}`)
      const documents = response.data.documents || []

      // Delete each document individually
      const deletePromises = documents.map((doc: any) => {
        return firestoreClient.delete(`/v1/${doc.name}`)
      })

      // Wait for all deletions to complete
      await Promise.all(deletePromises)

      return true
    } catch (error) {
      console.error('Failed to delete collection:', error)
      throw error
    }
  },

  // Test if a specific database exists
  async testDatabase(projectId: string, databaseId: string): Promise<boolean> {
    try {
      const databasePath = `projects/${projectId}/databases/${databaseId}`
      const response = await firestoreClient.get(`/v1/${databasePath}/documents/`, {
        timeout: 3000,
        validateStatus: (status) => status === 200 || status === 404
      })
      return response.status === 200 || response.status === 404
    } catch {
      return false
    }
  },

  // Helper to get database path
  getDefaultDatabasePath(projectId?: string): string {
    const project = projectId || import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID || 'test-project'
    return `projects/${project}/databases/(default)`
  },

  // Helper to get custom database path
  getDatabasePath(projectId: string, databaseId: string): string {
    return `projects/${projectId}/databases/${databaseId}`
  }
}


export default firestoreApi