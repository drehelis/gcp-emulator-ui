import { describe, it, expect } from 'vitest'
import {
  getMeaningfulErrorMessage,
  getPubSubErrorMessage,
  getStorageErrorMessage,
} from '../errorMessages'

describe('errorMessages utilities', () => {
  describe('getMeaningfulErrorMessage', () => {
    it('returns predefined messages for status codes', () => {
      expect(getMeaningfulErrorMessage({ code: 409 })).toBe(
        'ALREADY_EXISTS: Resource already exists'
      )
      expect(getMeaningfulErrorMessage({ status: 404 })).toBe('NOT_FOUND: Resource not found')
      expect(getMeaningfulErrorMessage({ response: { status: 400 } })).toBe(
        'INVALID_REQUEST: Invalid request parameters'
      )
      expect(getMeaningfulErrorMessage({ code: 403 })).toBe('PERMISSION_DENIED: Access denied')
      expect(getMeaningfulErrorMessage({ code: 500 })).toBe('INTERNAL_ERROR: Server internal error')
    })

    it('returns error.message if it contains keywords', () => {
      expect(getMeaningfulErrorMessage({ message: 'Error: ALREADY_EXISTS' })).toBe(
        'Error: ALREADY_EXISTS'
      )
      expect(getMeaningfulErrorMessage({ message: 'Something NOT_FOUND here' })).toBe(
        'Something NOT_FOUND here'
      )
    })

    it('parses axios style error messages', () => {
      expect(getMeaningfulErrorMessage({ message: 'Request failed with status code 409' })).toBe(
        'ALREADY_EXISTS: Resource already exists'
      )
      expect(getMeaningfulErrorMessage({ message: 'Request failed with status code 999' })).toBe(
        'HTTP_ERROR: Request failed (999)'
      )
    })

    it('fallbacks to original message or default', () => {
      expect(getMeaningfulErrorMessage({ message: 'Specific Error' })).toBe('Specific Error')
      expect(getMeaningfulErrorMessage({})).toBe('Unknown error occurred')
    })
  })

  describe('getPubSubErrorMessage', () => {
    it('provides context for ALREADY_EXISTS', () => {
      const err = { code: 409 }
      expect(getPubSubErrorMessage(err, 'create subscription')).toContain(
        'subscription with this name already exists'
      )
      expect(getPubSubErrorMessage(err, 'create topic')).toContain(
        'topic with this name already exists'
      )
    })

    it('provides context for NOT_FOUND', () => {
      const err = { code: 404 }
      expect(getPubSubErrorMessage(err, 'get subscription')).toContain(
        'subscription no longer exists'
      )
      expect(getPubSubErrorMessage(err, 'get topic')).toContain('topic no longer exists')
    })
  })

  describe('getStorageErrorMessage', () => {
    it('provides context for ALREADY_EXISTS', () => {
      const err = { code: 409 }
      expect(getStorageErrorMessage(err, 'create bucket')).toContain(
        'bucket with this name already exists'
      )
      expect(getStorageErrorMessage(err, 'upload file')).toContain(
        'file with this name already exists'
      )
      expect(getStorageErrorMessage(err, 'other')).toBe(
        'This resource already exists. Please choose a different name.'
      )
    })

    it('provides context for NOT_FOUND', () => {
      const err = { code: 404 }
      expect(getStorageErrorMessage(err, 'delete bucket')).toContain('bucket no longer exists')
      expect(getStorageErrorMessage(err, 'delete file')).toContain('file no longer exists')
    })

    it('provides context for PERMISSION_DENIED', () => {
      expect(getStorageErrorMessage({ code: 403 }, '')).toContain('do not have permission')
    })

    it('provides context for INVALID_REQUEST', () => {
      const err = { code: 400 }
      expect(getStorageErrorMessage(err, 'create bucket')).toContain('Invalid bucket configuration')
      expect(getStorageErrorMessage(err, 'other')).toContain('Invalid request')
    })
  })
})
