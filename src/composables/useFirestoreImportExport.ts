import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useFirestoreStore } from '@/stores/firestore'
import { firestoreApi } from '@/api/firestore'
import type { FirestoreDocument } from '@/types/firestore'
import { downloadFile } from '@/utils/importExportUtils'

export interface FirestoreDocumentExport {
  document: FirestoreDocument
  subcollections?: FirestoreCollectionExport[]
}

export interface FirestoreCollectionExport {
  collectionId: string
  documents: FirestoreDocumentExport[]
}

export function useFirestoreImportExport() {
  const appStore = useAppStore()
  const firestoreStore = useFirestoreStore()

  const isExporting = ref(false)
  const isImporting = ref(false)

  // Load data
  const loadData = async (projectId: string) => {
    try {
      await firestoreStore.loadCollections(projectId)
    } catch (error) {
      console.error('Failed to load Firestore data:', error)
      throw error
    }
  }

  // Helper function to recursively export subcollections for a document
  const exportDocumentWithSubcollections = async (
    documentPath: string,
    document: FirestoreDocument
  ): Promise<FirestoreDocumentExport> => {
    const documentExport: FirestoreDocumentExport = {
      document
    }

    try {
      // Get subcollections for this document
      const subcollectionsResponse = await firestoreApi.listSubcollections(documentPath)

      if (subcollectionsResponse.collections.length > 0) {
        documentExport.subcollections = []

        // Export each subcollection
        for (const subcollection of subcollectionsResponse.collections) {
          try {
            const subcollectionId = subcollection.id || subcollection.name.split('/').pop() || ''

            // Get all documents in this subcollection
            const docsResponse = await firestoreApi.listSubcollectionDocuments(documentPath, subcollectionId)
            const subcollectionDocs: FirestoreDocumentExport[] = []

            // Recursively export each document with its subcollections
            for (const subDoc of docsResponse.documents) {
              const subDocExport = await exportDocumentWithSubcollections(subDoc.name, subDoc)
              subcollectionDocs.push(subDocExport)
            }

            documentExport.subcollections.push({
              collectionId: subcollectionId,
              documents: subcollectionDocs
            })
          } catch (error) {
            console.error(`Failed to export subcollection:`, error)
          }
        }
      }
    } catch (error) {
      // Subcollections might not exist or error occurred, continue without them
      console.warn(`No subcollections found for document ${documentPath}:`, error)
    }

    return documentExport
  }

  // Export collections
  const exportCollections = async (projectId: string) => {
    isExporting.value = true
    try {
      const exportData: FirestoreCollectionExport[] = []
      const databasePath = firestoreStore.getCurrentDatabasePath(projectId)

      // Get all top-level collections
      const collections = firestoreStore.collections

      if (collections.length === 0) {
        appStore.showToast({
          type: 'info',
          title: 'No collections to export',
          message: 'No Firestore collections found in this project'
        })
        return
      }

      let totalDocuments = 0

      // Export each collection with its documents (including subcollections recursively)
      for (const collection of collections) {
        try {
          const response = await firestoreApi.listDocuments(databasePath, collection.id)
          const collectionDocs: FirestoreDocumentExport[] = []

          // For each document, recursively export with subcollections
          for (const doc of response.documents) {
            const docExport = await exportDocumentWithSubcollections(doc.name, doc)
            collectionDocs.push(docExport)
            totalDocuments++
          }

          exportData.push({
            collectionId: collection.id,
            documents: collectionDocs
          })
        } catch (error) {
          console.error(`Failed to export collection ${collection.id}:`, error)
        }
      }

      // Download the file
      downloadFile(
        JSON.stringify(exportData, null, 2),
        `firestore-collections-${projectId}-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      )

      appStore.showToast({
        type: 'success',
        title: 'Firestore collections exported',
        message: `Exported ${exportData.length} collection${exportData.length === 1 ? '' : 's'} with ${totalDocuments} document${totalDocuments === 1 ? '' : 's'}`
      })
    } catch (error) {
      console.error('Firestore export failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Export failed',
        message: (error as Error).message
      })
    } finally {
      isExporting.value = false
    }
  }

  // Helper function to recursively import subcollections for a document
  const importDocumentWithSubcollections = async (
    parentPath: string,
    collectionId: string,
    docExport: FirestoreDocumentExport,
    options: any,
    stats: { success: number; error: number },
    isSubcollection = false
  ): Promise<void> => {
    try {
      const doc = docExport.document
      const docId = doc.name.split('/').pop() || ''

      // Import the document
      if (isSubcollection) {
        // For subcollections, use the createSubcollection API
        // parentPath is already the full document path (e.g., projects/.../documents/col/doc)
        if (options.overwriteExisting) {
          const documentPath = `${parentPath}/${collectionId}/${docId}`
          try {
            await firestoreApi.updateDocument(documentPath, doc)
            stats.success++
          } catch {
            // If update fails, try creating
            try {
              await firestoreApi.createSubcollection(
                parentPath,
                collectionId,
                doc,
                docId
              )
              stats.success++
            } catch (createError: any) {
              // Document might already exist, skip it
              if (createError?.message?.includes('already exists')) {
                stats.success++ // Count as success since it exists
              } else {
                throw createError
              }
            }
          }
        } else {
          // Don't overwrite - try to create, skip if exists
          try {
            await firestoreApi.createSubcollection(
              parentPath,
              collectionId,
              doc,
              docId
            )
            stats.success++
          } catch (createError: any) {
            // Document already exists, skip it
            if (createError?.message?.includes('already exists')) {
              stats.success++ // Count as success since it exists
            } else {
              throw createError
            }
          }
        }
      } else {
        // For top-level collections, use the regular createDocument API
        // parentPath is the database path (e.g., projects/.../databases/(default))
        if (options.overwriteExisting) {
          const documentPath = `${parentPath}/documents/${collectionId}/${docId}`
          try {
            await firestoreApi.updateDocument(documentPath, doc)
            stats.success++
          } catch {
            // If update fails, try creating
            try {
              await firestoreApi.createDocument({
                parent: parentPath,
                collectionId,
                documentId: docId,
                document: doc
              })
              stats.success++
            } catch (createError: any) {
              // Document might already exist, skip it
              if (createError?.message?.includes('already exists')) {
                stats.success++ // Count as success since it exists
              } else {
                throw createError
              }
            }
          }
        } else {
          // Don't overwrite - try to create, skip if exists
          try {
            await firestoreApi.createDocument({
              parent: parentPath,
              collectionId,
              documentId: docId,
              document: doc
            })
            stats.success++
          } catch (createError: any) {
            // Document already exists, skip it
            if (createError?.message?.includes('already exists')) {
              stats.success++ // Count as success since it exists
            } else {
              throw createError
            }
          }
        }
      }

      // Import subcollections if they exist
      if (docExport.subcollections && docExport.subcollections.length > 0) {
        // Build the document path for subcollections
        const documentPath = isSubcollection
          ? `${parentPath}/${collectionId}/${docId}`
          : `${parentPath}/documents/${collectionId}/${docId}`

        for (const subcollection of docExport.subcollections) {
          try {
            // Recursively import each document in the subcollection
            for (const subDocExport of subcollection.documents) {
              await importDocumentWithSubcollections(
                documentPath,
                subcollection.collectionId,
                subDocExport,
                options,
                stats,
                true  // This is a subcollection
              )
            }
          } catch (error) {
            console.error(`Failed to import subcollection ${subcollection.collectionId}:`, error)
            stats.error++
          }
        }
      }
    } catch (error) {
      console.error('Failed to import document:', error)
      stats.error++
    }
  }

  // Import collections
  const importCollections = async (projectId: string, importData: FirestoreCollectionExport[], options: any) => {
    isImporting.value = true
    try {
      const stats = { success: 0, error: 0 }
      const databasePath = firestoreStore.getCurrentDatabasePath(projectId)

      for (const collectionData of importData) {
        try {
          const collectionId = collectionData.collectionId
          const documents = collectionData.documents

          // Import each document with its subcollections recursively
          for (const docExport of documents) {
            await importDocumentWithSubcollections(
              databasePath,
              collectionId,
              docExport,
              options,
              stats
            )
          }
        } catch (error) {
          console.error(`Failed to import collection ${collectionData.collectionId}:`, error)
          stats.error++
        }
      }

      // Reload data
      await loadData(projectId)

      // Show toast notification
      if (stats.success > 0 && stats.error === 0) {
        appStore.showToast({
          type: 'success',
          title: 'Firestore import completed successfully',
          message: `${stats.success} document${stats.success === 1 ? '' : 's'} imported`
        })
      } else if (stats.success > 0 && stats.error > 0) {
        appStore.showToast({
          type: 'warning',
          title: 'Firestore import completed with errors',
          message: `${stats.success} successful, ${stats.error} failed`
        })
      } else if (stats.error > 0) {
        appStore.showToast({
          type: 'error',
          title: 'Firestore import failed',
          message: `All ${stats.error} document${stats.error === 1 ? '' : 's'} failed to import`
        })
      } else {
        appStore.showToast({
          type: 'info',
          title: 'No documents to import',
          message: 'The import file contains no documents'
        })
      }
    } catch (error) {
      console.error('Firestore import failed:', error)
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
    isExporting,
    isImporting,
    loadData,
    exportCollections,
    importCollections
  }
}
