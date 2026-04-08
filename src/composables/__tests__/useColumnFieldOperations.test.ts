import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useColumnFieldOperations } from '../useColumnFieldOperations'

describe('useColumnFieldOperations', () => {
  let modalManager: any
  let deepNavigation: any
  let getColumnThreeDocument: any
  let handleEditField: any
  let currentStackIndex: any

  beforeEach(() => {
    modalManager = {
      openAddFieldModal: vi.fn(),
      openDeleteFieldModal: vi.fn(),
    }
    deepNavigation = {
      getColumnOneDocument: vi.fn(),
    }
    getColumnThreeDocument = vi.fn()
    handleEditField = vi.fn()
    currentStackIndex = ref(0)
  })

  it('should initialize with default context', () => {
    const { activeFieldOperationContext } = useColumnFieldOperations(
      modalManager,
      deepNavigation,
      getColumnThreeDocument,
      handleEditField,
      currentStackIndex
    )
    expect(activeFieldOperationContext.value).toEqual({
      document: null,
      column: 'column-three',
    })
  })

  it('handleColumnOneFieldOperations.addField sets context and opens modal', () => {
    const mockDoc = { name: 'doc1', path: 'path/1' }
    deepNavigation.getColumnOneDocument.mockReturnValue(mockDoc)

    const { handleColumnOneFieldOperations, activeFieldOperationContext } =
      useColumnFieldOperations(
        modalManager,
        deepNavigation,
        getColumnThreeDocument,
        handleEditField,
        currentStackIndex
      )

    handleColumnOneFieldOperations.addField()

    expect(deepNavigation.getColumnOneDocument).toHaveBeenCalledWith(0)
    expect(activeFieldOperationContext.value).toEqual({
      document: mockDoc,
      column: 'column-one',
    })
    expect(modalManager.openAddFieldModal).toHaveBeenCalled()
  })

  it('handleColumnOneFieldOperations.editField sets context and calls handleEditField', () => {
    const mockDoc = { name: 'doc1', path: 'path/1' }
    deepNavigation.getColumnOneDocument.mockReturnValue(mockDoc)
    const testData = { field: 'f1' }

    const { handleColumnOneFieldOperations, activeFieldOperationContext } =
      useColumnFieldOperations(
        modalManager,
        deepNavigation,
        getColumnThreeDocument,
        handleEditField,
        currentStackIndex
      )

    handleColumnOneFieldOperations.editField(testData)

    expect(activeFieldOperationContext.value).toEqual({
      document: mockDoc,
      column: 'column-one',
    })
    expect(handleEditField).toHaveBeenCalledWith(testData)
  })

  it('handleColumnOneFieldOperations.deleteField sets context and opens delete modal', () => {
    const mockDoc = { name: 'doc1', path: 'path/1' }
    deepNavigation.getColumnOneDocument.mockReturnValue(mockDoc)
    const testData = { field: 'f1' }

    const { handleColumnOneFieldOperations, activeFieldOperationContext } =
      useColumnFieldOperations(
        modalManager,
        deepNavigation,
        getColumnThreeDocument,
        handleEditField,
        currentStackIndex
      )

    handleColumnOneFieldOperations.deleteField(testData)

    expect(activeFieldOperationContext.value).toEqual({
      document: mockDoc,
      column: 'column-one',
    })
    expect(modalManager.openDeleteFieldModal).toHaveBeenCalledWith(testData)
  })

  it('handleColumnThreeFieldOperations.addField sets context and opens modal', () => {
    const mockDoc = { name: 'doc3', path: 'path/3' }
    getColumnThreeDocument.mockReturnValue(mockDoc)

    const { handleColumnThreeFieldOperations, activeFieldOperationContext } =
      useColumnFieldOperations(
        modalManager,
        deepNavigation,
        getColumnThreeDocument,
        handleEditField,
        currentStackIndex
      )

    handleColumnThreeFieldOperations.addField()

    expect(getColumnThreeDocument).toHaveBeenCalledWith(0)
    expect(activeFieldOperationContext.value).toEqual({
      document: mockDoc,
      column: 'column-three',
    })
    expect(modalManager.openAddFieldModal).toHaveBeenCalled()
  })

  it('handleColumnThreeFieldOperations.editField sets context and calls handleEditField', () => {
    const mockDoc = { name: 'doc3', path: 'path/3' }
    getColumnThreeDocument.mockReturnValue(mockDoc)
    const testData = { field: 'f3' }

    const { handleColumnThreeFieldOperations, activeFieldOperationContext } =
      useColumnFieldOperations(
        modalManager,
        deepNavigation,
        getColumnThreeDocument,
        handleEditField,
        currentStackIndex
      )

    handleColumnThreeFieldOperations.editField(testData)

    expect(activeFieldOperationContext.value).toEqual({
      document: mockDoc,
      column: 'column-three',
    })
    expect(handleEditField).toHaveBeenCalledWith(testData)
  })

  it('handleColumnThreeFieldOperations.deleteField sets context and opens delete modal', () => {
    const mockDoc = { name: 'doc3', path: 'path/3' }
    getColumnThreeDocument.mockReturnValue(mockDoc)
    const testData = { field: 'f3' }

    const { handleColumnThreeFieldOperations, activeFieldOperationContext } =
      useColumnFieldOperations(
        modalManager,
        deepNavigation,
        getColumnThreeDocument,
        handleEditField,
        currentStackIndex
      )

    handleColumnThreeFieldOperations.deleteField(testData)

    expect(activeFieldOperationContext.value).toEqual({
      document: mockDoc,
      column: 'column-three',
    })
    expect(modalManager.openDeleteFieldModal).toHaveBeenCalledWith(testData)
  })
})
