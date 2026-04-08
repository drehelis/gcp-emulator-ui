import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSaveAndAddAnother } from '../useSaveAndAddAnother'

describe('useSaveAndAddAnother', () => {
  const mockConfig = {
    entityType: 'document' as const,
    validateForm: vi.fn(() => true),
    setValidationError: vi.fn(),
    buildPayload: vi.fn(() => ({ id: 'new-doc' })),
    saveEntity: vi.fn(async () => ({ id: 'new-doc' })),
    clearForm: vi.fn(),
    onSuccess: vi.fn(),
    getEntityId: vi.fn((res: any) => res.id),
    formState: {
      field1: { resetForm: vi.fn() },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { lastSavedId, isLoading } = useSaveAndAddAnother()
    expect(lastSavedId.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('setLastSaved and clearNotification should work', () => {
    const { lastSavedId, setLastSaved, clearNotification } = useSaveAndAddAnother()
    setLastSaved('doc1')
    expect(lastSavedId.value).toBe('doc1')
    clearNotification()
    expect(lastSavedId.value).toBeNull()
  })

  it('getSuccessMessage should return correct text', () => {
    const { getSuccessMessage } = useSaveAndAddAnother()
    expect(getSuccessMessage('document', 'doc1')).toBe("Your previous document 'doc1' was saved.")
    expect(getSuccessMessage('collection', 'col1')).toBe(
      "Your previous collection 'col1' was saved."
    )
  })

  it('handleSaveAndAddAnother should execute full flow on success', async () => {
    const { handleSaveAndAddAnother, lastSavedId } = useSaveAndAddAnother(mockConfig)

    await handleSaveAndAddAnother()

    expect(mockConfig.validateForm).toHaveBeenCalled()
    expect(mockConfig.buildPayload).toHaveBeenCalled()
    expect(mockConfig.saveEntity).toHaveBeenCalledWith({ id: 'new-doc' })
    expect(lastSavedId.value).toBe('new-doc')
    expect(mockConfig.clearForm).toHaveBeenCalled()
    expect(mockConfig.onSuccess).toHaveBeenCalledWith('new-doc')
  })

  it('handleSaveAndAddAnother should stop if validation fails', async () => {
    mockConfig.validateForm.mockReturnValue(false)
    const { handleSaveAndAddAnother } = useSaveAndAddAnother(mockConfig)

    await handleSaveAndAddAnother()

    expect(mockConfig.saveEntity).not.toHaveBeenCalled()
  })

  it('handleClearFields should call resetForm on fields', () => {
    const { handleClearFields } = useSaveAndAddAnother(mockConfig)
    handleClearFields()
    expect(mockConfig.formState.field1.resetForm).toHaveBeenCalled()
  })

  it('handleSaveAndAddAnother should throw error if config is missing', async () => {
    const { handleSaveAndAddAnother } = useSaveAndAddAnother()
    await expect(handleSaveAndAddAnother()).rejects.toThrow(
      'Configuration required for handleSaveAndAddAnother'
    )
  })
})
