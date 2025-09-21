import { ref, type Ref } from 'vue'
import type { FirestoreDocument } from '@/types'

export interface FieldOperationContext {
  document: FirestoreDocument | null
  column: 'column-one' | 'column-three'
}

 
export function useColumnFieldOperations(
  modalManager: any,
  deepNavigation: any,
  getColumnThreeDocument: (_levelIndex: number) => FirestoreDocument | null,
  handleEditField: (_data: any) => void,
  currentStackIndex: Ref<number>
) {
  // Track which document context is being edited
  const activeFieldOperationContext = ref<FieldOperationContext>({
    document: null,
    column: 'column-three'
  })

  // Context-aware field operation handlers for Column One
  const handleColumnOneFieldOperations = {
    addField: () => {
      const document = deepNavigation.getColumnOneDocument(currentStackIndex.value)
      console.log('Column One addField - document:', document?.name, 'path:', document?.path)
      if (document) {
        activeFieldOperationContext.value = { document, column: 'column-one' }
        console.log('Column One addField - context set to:', activeFieldOperationContext.value)
        modalManager.openAddFieldModal()
      }
    },
    editField: (data: any) => {
      const document = deepNavigation.getColumnOneDocument(currentStackIndex.value)
      if (document) {
        activeFieldOperationContext.value = { document, column: 'column-one' }
        handleEditField(data)
      }
    },
    deleteField: (data: any) => {
      const document = deepNavigation.getColumnOneDocument(currentStackIndex.value)
      if (document) {
        activeFieldOperationContext.value = { document, column: 'column-one' }
        modalManager.openDeleteFieldModal(data)
      }
    }
  }

  // Context-aware field operation handlers for Column Three
  const handleColumnThreeFieldOperations = {
    addField: () => {
      const document = getColumnThreeDocument(currentStackIndex.value)
      console.log('Column Three addField - document:', document?.name, 'path:', document?.path)
      if (document) {
        activeFieldOperationContext.value = { document, column: 'column-three' }
        console.log('Column Three addField - context set to:', activeFieldOperationContext.value)
        modalManager.openAddFieldModal()
      }
    },
    editField: (data: any) => {
      const document = getColumnThreeDocument(currentStackIndex.value)
      if (document) {
        activeFieldOperationContext.value = { document, column: 'column-three' }
        handleEditField(data)
      }
    },
    deleteField: (data: any) => {
      const document = getColumnThreeDocument(currentStackIndex.value)
      if (document) {
        activeFieldOperationContext.value = { document, column: 'column-three' }
        modalManager.openDeleteFieldModal(data)
      }
    }
  }

  return {
    activeFieldOperationContext,
    handleColumnOneFieldOperations,
    handleColumnThreeFieldOperations
  }
}