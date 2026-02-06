/**
 * Tests for useSaveAndAddAnother composable
 * Form workflow management for save and continue patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSaveAndAddAnother } from '../useSaveAndAddAnother'

describe('useSaveAndAddAnother', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('initializes with null lastSavedId', () => {
      const { lastSavedId } = useSaveAndAddAnother()
      expect(lastSavedId.value).toBeNull()
    })

    it('initializes with isLoading false', () => {
      const { isLoading } = useSaveAndAddAnother()
      expect(isLoading.value).toBe(false)
    })
  })

  describe('setLastSaved', () => {
    it('sets the last saved ID', () => {
      const { lastSavedId, setLastSaved } = useSaveAndAddAnother()

      setLastSaved('doc-123')
      expect(lastSavedId.value).toBe('doc-123')
    })
  })

  describe('clearNotification', () => {
    it('clears the last saved ID', () => {
      const { lastSavedId, setLastSaved, clearNotification } = useSaveAndAddAnother()

      setLastSaved('doc-123')
      expect(lastSavedId.value).toBe('doc-123')

      clearNotification()
      expect(lastSavedId.value).toBeNull()
    })
  })

  describe('getSuccessMessage', () => {
    it('generates document success message', () => {
      const { getSuccessMessage } = useSaveAndAddAnother()

      const message = getSuccessMessage('document', 'my-doc')
      expect(message).toBe("Your previous document 'my-doc' was saved.")
    })

    it('generates collection success message', () => {
      const { getSuccessMessage } = useSaveAndAddAnother()

      const message = getSuccessMessage('collection', 'my-collection')
      expect(message).toBe("Your previous collection 'my-collection' was saved.")
    })
  })

  describe('handleSaveAndAddAnother', () => {
    it('throws error when config is not provided', async () => {
      const { handleSaveAndAddAnother } = useSaveAndAddAnother()

      await expect(handleSaveAndAddAnother()).rejects.toThrow('Configuration required')
    })

    it('validates form before saving', async () => {
      const mockConfig = {
        entityType: 'document' as const,
        validateForm: vi.fn().mockReturnValue(false),
        setValidationError: vi.fn(),
        buildPayload: vi.fn(),
        saveEntity: vi.fn(),
        clearForm: vi.fn(),
        onSuccess: vi.fn(),
        getEntityId: vi.fn(),
        formState: {},
      }

      const { handleSaveAndAddAnother } = useSaveAndAddAnother(mockConfig)
      await handleSaveAndAddAnother()

      expect(mockConfig.setValidationError).toHaveBeenCalledWith(true)
      expect(mockConfig.validateForm).toHaveBeenCalled()
      expect(mockConfig.saveEntity).not.toHaveBeenCalled()
    })

    it('saves entity and clears form on success', async () => {
      const mockConfig = {
        entityType: 'document' as const,
        validateForm: vi.fn().mockReturnValue(true),
        setValidationError: vi.fn(),
        buildPayload: vi.fn().mockReturnValue({ name: 'test' }),
        saveEntity: vi.fn().mockResolvedValue({ id: 'doc-456' }),
        clearForm: vi.fn(),
        onSuccess: vi.fn(),
        getEntityId: vi.fn().mockReturnValue('doc-456'),
        formState: {},
      }

      const { handleSaveAndAddAnother, lastSavedId } = useSaveAndAddAnother(mockConfig)
      await handleSaveAndAddAnother()

      expect(mockConfig.saveEntity).toHaveBeenCalledWith({ name: 'test' })
      expect(mockConfig.clearForm).toHaveBeenCalled()
      expect(mockConfig.onSuccess).toHaveBeenCalledWith('doc-456')
      expect(lastSavedId.value).toBe('doc-456')
    })

    it('handles save errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockConfig = {
        entityType: 'document' as const,
        validateForm: vi.fn().mockReturnValue(true),
        setValidationError: vi.fn(),
        buildPayload: vi.fn().mockReturnValue({}),
        saveEntity: vi.fn().mockRejectedValue(new Error('Save failed')),
        clearForm: vi.fn(),
        onSuccess: vi.fn(),
        getEntityId: vi.fn(),
        formState: {},
      }

      const { handleSaveAndAddAnother, isLoading } = useSaveAndAddAnother(mockConfig)
      await handleSaveAndAddAnother()

      expect(consoleSpy).toHaveBeenCalled()
      expect(isLoading.value).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('handleClearFields', () => {
    it('clears notification', () => {
      const { handleClearFields, lastSavedId, setLastSaved } = useSaveAndAddAnother()

      setLastSaved('doc-123')
      handleClearFields()

      expect(lastSavedId.value).toBeNull()
    })

    it('calls resetForm on formState objects with config', () => {
      const mockResetForm = vi.fn()
      const mockConfig = {
        entityType: 'document' as const,
        validateForm: vi.fn(),
        setValidationError: vi.fn(),
        buildPayload: vi.fn(),
        saveEntity: vi.fn(),
        clearForm: vi.fn(),
        onSuccess: vi.fn(),
        getEntityId: vi.fn(),
        formState: {
          field1: { resetForm: mockResetForm },
          field2: { resetForm: mockResetForm },
        },
      }

      const { handleClearFields } = useSaveAndAddAnother(mockConfig)
      handleClearFields()

      expect(mockResetForm).toHaveBeenCalledTimes(2)
    })
  })
})
