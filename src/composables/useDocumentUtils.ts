/**
 * Document utilities composable
 * Centralized utilities for document operations and path manipulation
 */

import type { FirestoreDocument } from '@/types'

export const useDocumentUtils = () => {
  /**
   * Extract document ID from a Firestore document path
   * @param documentPath - Full document path (e.g., "projects/x/databases/(default)/documents/collection/doc-id")
   * @returns Document ID (last segment of the path)
   */
  const getDocumentId = (documentPath: string): string => {
    return documentPath.split('/').pop() || documentPath
  }

  /**
   * Find document by ID in a collection of documents
   * @param documents - Array of FirestoreDocument objects
   * @param documentId - Document ID to search for
   * @returns Found document or undefined
   */
  const findDocumentById = (documents: FirestoreDocument[], documentId: string): FirestoreDocument | undefined => {
    return documents.find(doc => getDocumentId(doc.name) === documentId)
  }

  /**
   * Find document by its full path name
   * @param documents - Array of FirestoreDocument objects
   * @param documentPath - Full document path to search for
   * @returns Found document or undefined
   */
  const findDocumentByPath = (documents: FirestoreDocument[], documentPath: string): FirestoreDocument | undefined => {
    return documents.find(doc => doc.name === documentPath)
  }

  /**
   * Extract collection ID from document path
   * @param documentPath - Full document path
   * @returns Collection ID or empty string
   */
  const getCollectionIdFromPath = (documentPath: string): string => {
    const parts = documentPath.split('/')
    const documentsIndex = parts.indexOf('documents')
    if (documentsIndex !== -1 && parts.length > documentsIndex + 1) {
      return parts[documentsIndex + 1]
    }
    return ''
  }

  /**
   * Build document path from components
   * @param projectId - Google Cloud project ID
   * @param databaseId - Firestore database ID (default: "(default)")
   * @param collectionId - Collection ID
   * @param documentId - Document ID
   * @returns Full document path
   */
  const buildDocumentPath = (
    projectId: string,
    databaseId: string = '(default)',
    collectionId: string,
    documentId: string
  ): string => {
    return `projects/${projectId}/databases/${databaseId}/documents/${collectionId}/${documentId}`
  }

  /**
   * Extract parent collection path from document path
   * @param documentPath - Full document path
   * @returns Parent collection path
   */
  const getParentCollectionPath = (documentPath: string): string => {
    const parts = documentPath.split('/')
    const documentIdIndex = parts.length - 1
    return parts.slice(0, documentIdIndex).join('/')
  }

  /**
   * Check if document path is a subcollection document
   * @param documentPath - Full document path
   * @returns True if it's a subcollection document
   */
  const isSubcollectionDocument = (documentPath: string): boolean => {
    const parts = documentPath.split('/')
    const documentsIndex = parts.indexOf('documents')
    // Subcollection documents have more than 3 parts after 'documents'
    // Normal: documents/collection/doc -> 2 parts
    // Subcollection: documents/collection/doc/subcollection/subdoc -> 4 parts
    return documentsIndex !== -1 && (parts.length - documentsIndex - 1) > 2
  }

  /**
   * Get breadcrumb segments from document path for navigation
   * @param documentPath - Full document path
   * @returns Array of breadcrumb segments with type and name
   */
  const getBreadcrumbSegments = (documentPath: string): Array<{type: 'collection' | 'document', name: string}> => {
    const parts = documentPath.split('/')
    const documentsIndex = parts.indexOf('documents')

    if (documentsIndex === -1) return []

    const pathParts = parts.slice(documentsIndex + 1)
    const segments: Array<{type: 'collection' | 'document', name: string}> = []

    // Alternate between collection and document
    pathParts.forEach((part, index) => {
      segments.push({
        type: index % 2 === 0 ? 'collection' : 'document',
        name: part
      })
    })

    return segments
  }

  /**
   * Validate document ID format
   * @param documentId - Document ID to validate
   * @returns True if valid document ID
   */
  const isValidDocumentId = (documentId: string): boolean => {
    if (!documentId || typeof documentId !== 'string') return false

    // Firestore document ID constraints
    const trimmed = documentId.trim()
    if (trimmed.length === 0 || trimmed.length > 1500) return false

    // Cannot contain forward slash or control characters
    if (trimmed.includes('/')) return false

    // Check for control characters manually to avoid ESLint issues
    for (let i = 0; i < trimmed.length; i++) {
      const charCode = trimmed.charCodeAt(i)
      if (charCode <= 31 || charCode === 127) return false
    }

    return true
  }

  return {
    // Core utilities
    getDocumentId,
    findDocumentById,
    findDocumentByPath,

    // Path utilities
    getCollectionIdFromPath,
    buildDocumentPath,
    getParentCollectionPath,

    // Document analysis
    isSubcollectionDocument,
    getBreadcrumbSegments,

    // Validation
    isValidDocumentId
  }
}
