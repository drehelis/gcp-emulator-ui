/**
 * Tests for errorMessages utility
 * HTTP error message formatting and service-specific error handling
 */

import { describe, it, expect } from 'vitest'
import {
  getMeaningfulErrorMessage,
  getPubSubErrorMessage,
  getStorageErrorMessage,
} from '../errorMessages'

describe('getMeaningfulErrorMessage', () => {
  describe('HTTP status codes', () => {
    it('returns ALREADY_EXISTS for 409 status', () => {
      const error = { response: { status: 409 } }
      expect(getMeaningfulErrorMessage(error)).toBe('ALREADY_EXISTS: Resource already exists')
    })

    it('returns NOT_FOUND for 404 status', () => {
      const error = { response: { status: 404 } }
      expect(getMeaningfulErrorMessage(error)).toBe('NOT_FOUND: Resource not found')
    })

    it('returns INVALID_REQUEST for 400 status', () => {
      const error = { response: { status: 400 } }
      expect(getMeaningfulErrorMessage(error)).toBe('INVALID_REQUEST: Invalid request parameters')
    })

    it('returns PERMISSION_DENIED for 403 status', () => {
      const error = { response: { status: 403 } }
      expect(getMeaningfulErrorMessage(error)).toBe('PERMISSION_DENIED: Access denied')
    })

    it('returns INTERNAL_ERROR for 500 status', () => {
      const error = { response: { status: 500 } }
      expect(getMeaningfulErrorMessage(error)).toBe('INTERNAL_ERROR: Server internal error')
    })
  })

  describe('message passthrough', () => {
    it('passes through ALREADY_EXISTS in message', () => {
      const error = { message: 'ALREADY_EXISTS: Topic already exists' }
      expect(getMeaningfulErrorMessage(error)).toBe('ALREADY_EXISTS: Topic already exists')
    })

    it('passes through NOT_FOUND in message', () => {
      const error = { message: 'NOT_FOUND: Topic not found' }
      expect(getMeaningfulErrorMessage(error)).toBe('NOT_FOUND: Topic not found')
    })

    it('passes through PERMISSION_DENIED in message', () => {
      const error = { message: 'PERMISSION_DENIED: No access' }
      expect(getMeaningfulErrorMessage(error)).toBe('PERMISSION_DENIED: No access')
    })

    it('passes through INVALID_ prefixed messages', () => {
      const error = { message: 'INVALID_ARGUMENT: Bad input' }
      expect(getMeaningfulErrorMessage(error)).toBe('INVALID_ARGUMENT: Bad input')
    })
  })

  describe('generic error handling', () => {
    it('parses status code from generic message', () => {
      const error = { message: 'Request failed with status code 409' }
      expect(getMeaningfulErrorMessage(error)).toBe('ALREADY_EXISTS: Resource already exists')
    })

    it('handles unknown status codes', () => {
      const error = { message: 'Request failed with status code 418' }
      expect(getMeaningfulErrorMessage(error)).toBe('HTTP_ERROR: Request failed (418)')
    })

    it('returns original message for unknown errors', () => {
      const error = { message: 'Something went wrong' }
      expect(getMeaningfulErrorMessage(error)).toBe('Something went wrong')
    })

    it('returns fallback for errors without message', () => {
      const error = {}
      expect(getMeaningfulErrorMessage(error)).toBe('Unknown error occurred')
    })
  })
})

describe('getPubSubErrorMessage', () => {
  it('provides subscription-specific message for ALREADY_EXISTS', () => {
    const error = { response: { status: 409 } }
    const result = getPubSubErrorMessage(error, 'create subscription')
    expect(result).toContain('subscription')
    expect(result).toContain('already exists')
  })

  it('provides topic-specific message for ALREADY_EXISTS', () => {
    const error = { response: { status: 409 } }
    const result = getPubSubErrorMessage(error, 'create topic')
    expect(result).toContain('topic')
    expect(result).toContain('already exists')
  })

  it('provides subscription-specific message for NOT_FOUND', () => {
    const error = { response: { status: 404 } }
    const result = getPubSubErrorMessage(error, 'delete subscription')
    expect(result).toContain('subscription')
    expect(result).toContain('no longer exists')
  })

  it('provides topic-specific message for NOT_FOUND', () => {
    const error = { response: { status: 404 } }
    const result = getPubSubErrorMessage(error, 'delete topic')
    expect(result).toContain('topic')
    expect(result).toContain('no longer exists')
  })

  it('falls back to base message for other errors', () => {
    const error = { response: { status: 500 } }
    const result = getPubSubErrorMessage(error, 'publish message')
    expect(result).toBe('INTERNAL_ERROR: Server internal error')
  })
})

describe('getStorageErrorMessage', () => {
  it('provides bucket-specific message for ALREADY_EXISTS', () => {
    const error = { response: { status: 409 } }
    const result = getStorageErrorMessage(error, 'create bucket')
    expect(result).toContain('bucket')
    expect(result).toContain('globally unique')
  })

  it('provides file-specific message for ALREADY_EXISTS', () => {
    const error = { response: { status: 409 } }
    const result = getStorageErrorMessage(error, 'upload file')
    expect(result).toContain('file')
    expect(result).toContain('already exists')
  })

  it('provides bucket-specific message for NOT_FOUND', () => {
    const error = { response: { status: 404 } }
    const result = getStorageErrorMessage(error, 'delete bucket')
    expect(result).toContain('bucket')
    expect(result).toContain('no longer exists')
  })

  it('provides file-specific message for NOT_FOUND', () => {
    const error = { response: { status: 404 } }
    const result = getStorageErrorMessage(error, 'download file')
    expect(result).toContain('file')
    expect(result).toContain('no longer exists')
  })

  it('provides permission denied message', () => {
    const error = { response: { status: 403 } }
    const result = getStorageErrorMessage(error, 'access bucket')
    expect(result).toContain('permission')
  })

  it('provides bucket-specific invalid request message', () => {
    const error = { response: { status: 400 } }
    const result = getStorageErrorMessage(error, 'create bucket')
    expect(result).toContain('bucket')
    expect(result).toContain('Invalid')
  })

  it('falls back to base message for other errors', () => {
    const error = { response: { status: 500 } }
    const result = getStorageErrorMessage(error, 'list objects')
    expect(result).toBe('INTERNAL_ERROR: Server internal error')
  })
})
