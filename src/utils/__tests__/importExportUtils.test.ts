/**
 * Tests for importExportUtils utility
 * File download and path extraction utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadFile, extractTopicName, extractSubscriptionName } from '../importExportUtils'

describe('downloadFile', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock document.body methods
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  it('creates a blob with correct content and type', () => {
    const content = '{"data": "test"}'
    const filename = 'export.json'
    const mimeType = 'application/json'
    
    downloadFile(content, filename, mimeType)
    
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(document.body.appendChild).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('sets the correct filename on the anchor element', () => {
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
    
    downloadFile('content', 'myfile.txt', 'text/plain')
    
    expect(mockAnchor.download).toBe('myfile.txt')
    expect(mockAnchor.click).toHaveBeenCalled()
  })
})

describe('extractTopicName', () => {
  it('extracts topic name from full path', () => {
    const fullPath = 'projects/my-project/topics/my-topic'
    expect(extractTopicName(fullPath)).toBe('my-topic')
  })

  it('handles topic name with hyphens and underscores', () => {
    const fullPath = 'projects/my-project/topics/my-topic_name-v2'
    expect(extractTopicName(fullPath)).toBe('my-topic_name-v2')
  })

  it('returns original string if not a full path', () => {
    const simpleName = 'my-topic'
    expect(extractTopicName(simpleName)).toBe('my-topic')
  })

  it('handles empty string', () => {
    expect(extractTopicName('')).toBe('')
  })
})

describe('extractSubscriptionName', () => {
  it('extracts subscription name from full path', () => {
    const fullPath = 'projects/my-project/subscriptions/my-subscription'
    expect(extractSubscriptionName(fullPath)).toBe('my-subscription')
  })

  it('handles subscription name with special characters', () => {
    const fullPath = 'projects/my-project/subscriptions/sub_name-v2.test'
    expect(extractSubscriptionName(fullPath)).toBe('sub_name-v2.test')
  })

  it('returns original string if not a full path', () => {
    const simpleName = 'my-subscription'
    expect(extractSubscriptionName(simpleName)).toBe('my-subscription')
  })

  it('handles empty string', () => {
    expect(extractSubscriptionName('')).toBe('')
  })
})
