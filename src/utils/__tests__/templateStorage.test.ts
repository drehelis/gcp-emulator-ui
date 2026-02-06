/**
 * Tests for templateStorage utility
 * Message template storage using IndexedDB
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { templateStorage, type CreateTemplateForm } from '../templateStorage'

// Mock IndexedDB
const mockObjectStore = {
  add: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  index: vi.fn(),
  createIndex: vi.fn(),
}

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
}

const mockDB = {
  transaction: vi.fn(() => mockTransaction),
  objectStoreNames: {
    contains: vi.fn(() => true),
  },
  createObjectStore: vi.fn(() => mockObjectStore),
}

const mockRequest = {
  result: mockDB,
  error: null,
  onsuccess: null as (() => void) | null,
  onerror: null as (() => void) | null,
}

const mockOpenRequest = {
  ...mockRequest,
  onupgradeneeded: null as ((_event: any) => void) | null,
}

// Mock indexedDB globally
const mockIndexedDB = {
  open: vi.fn(() => mockOpenRequest),
}

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
})

describe('templateStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the internal db reference by accessing the private property
    // @ts-ignore - accessing private property for testing
    templateStorage.db = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('open', () => {
    it('opens IndexedDB connection', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => {
          request.onsuccess?.()
        }, 0)
        return request
      })

      const db = await templateStorage.open()
      expect(mockIndexedDB.open).toHaveBeenCalledWith('PubSubMessageTemplates', 1)
      expect(db).toBeDefined()
    })

    it('returns cached db on subsequent calls', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => {
          request.onsuccess?.()
        }, 0)
        return request
      })

      await templateStorage.open()
      await templateStorage.open()

      // Should only open once since db is cached
      expect(mockIndexedDB.open).toHaveBeenCalledTimes(1)
    })

    it('creates object store on upgrade', async () => {
      const createObjectStoreMock = vi.fn(() => ({
        createIndex: vi.fn(),
      }))

      mockIndexedDB.open.mockImplementation(() => {
        const request = {
          ...mockOpenRequest,
          onupgradeneeded: null as any,
          onsuccess: null as any,
        }
        setTimeout(() => {
          if (request.onupgradeneeded) {
            request.onupgradeneeded({
              target: {
                result: {
                  objectStoreNames: { contains: () => false },
                  createObjectStore: createObjectStoreMock,
                },
              },
            })
          }
          request.onsuccess?.()
        }, 0)
        return request
      })

      // @ts-ignore
      templateStorage.db = null
      await templateStorage.open()

      expect(createObjectStoreMock).toHaveBeenCalledWith('templates', { keyPath: 'id' })
    })

    it('rejects on error', async () => {
      const mockError = new Error('DB Error')
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest, error: mockError }
        setTimeout(() => {
          request.onerror?.()
        }, 0)
        return request
      })

      // @ts-ignore
      templateStorage.db = null
      await expect(templateStorage.open()).rejects.toThrow('DB Error')
    })
  })

  describe('saveTemplate', () => {
    const mockTemplateData: CreateTemplateForm = {
      name: 'Test Template',
      description: 'A test template',
      projectId: 'my-project',
      topicName: 'my-topic',
      data: '{"message": "hello"}',
      attributes: { key: 'value' },
      variables: { var1: 'val1' },
      tags: ['tag1', 'tag2'],
    }

    it('saves a new template with generated id', async () => {
      // Setup mocks
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      mockObjectStore.index.mockReturnValue({
        getAll: vi.fn(() => {
          const req = { onsuccess: null as any, onerror: null as any, result: [] }
          setTimeout(() => req.onsuccess?.(), 0)
          return req
        }),
      })

      mockObjectStore.add.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      const template = await templateStorage.saveTemplate(mockTemplateData)

      expect(template.id).toMatch(/^template-/)
      expect(template.name).toBe('Test Template')
      expect(template.projectId).toBe('my-project')
      expect(template.createdAt).toBeInstanceOf(Date)
      expect(template.updatedAt).toBeInstanceOf(Date)
    })

    it('throws error if template with same name exists', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      mockObjectStore.index.mockReturnValue({
        getAll: vi.fn(() => {
          const req = {
            onsuccess: null as any,
            onerror: null as any,
            result: [{ name: 'Test Template', projectId: 'my-project' }],
          }
          setTimeout(() => req.onsuccess?.(), 0)
          return req
        }),
      })

      await expect(templateStorage.saveTemplate(mockTemplateData)).rejects.toThrow(
        'Template "Test Template" already exists in this project'
      )
    })
  })

  describe('getTemplates', () => {
    it('returns all templates when no projectId specified', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      const mockTemplates = [
        {
          id: '1',
          name: 'Template 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Template 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockObjectStore.getAll.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any, result: mockTemplates }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      const templates = await templateStorage.getTemplates()

      expect(templates).toHaveLength(2)
      expect(templates[0].name).toBe('Template 1')
      expect(templates[0].createdAt).toBeInstanceOf(Date)
    })

    it('returns templates for specific project', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      const mockTemplates = [
        {
          id: '1',
          name: 'Template 1',
          projectId: 'my-project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockObjectStore.index.mockReturnValue({
        getAll: vi.fn(() => {
          const req = { onsuccess: null as any, onerror: null as any, result: mockTemplates }
          setTimeout(() => req.onsuccess?.(), 0)
          return req
        }),
      })

      const templates = await templateStorage.getTemplates('my-project')

      expect(templates).toHaveLength(1)
      expect(templates[0].projectId).toBe('my-project')
    })
  })

  describe('getTemplate', () => {
    it('returns template by id', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockObjectStore.get.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any, result: mockTemplate }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      const template = await templateStorage.getTemplate('template-123')

      expect(template?.id).toBe('template-123')
      expect(template?.createdAt).toBeInstanceOf(Date)
    })

    it('returns null for non-existent template', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      mockObjectStore.get.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any, result: undefined }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      const template = await templateStorage.getTemplate('non-existent')

      expect(template).toBeNull()
    })
  })

  describe('updateTemplate', () => {
    it('updates existing template', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      const existingTemplate = {
        id: 'template-123',
        name: 'Old Name',
        projectId: 'my-project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockObjectStore.get.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any, result: existingTemplate }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      mockObjectStore.put.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      const updated = await templateStorage.updateTemplate('template-123', { name: 'New Name' })

      expect(updated.name).toBe('New Name')
      expect(updated.id).toBe('template-123')
    })

    it('throws error for non-existent template', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      mockObjectStore.get.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any, result: undefined }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      await expect(templateStorage.updateTemplate('non-existent', { name: 'New' })).rejects.toThrow(
        'Template not found'
      )
    })
  })

  describe('deleteTemplate', () => {
    it('deletes template by id', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      mockObjectStore.delete.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      await expect(templateStorage.deleteTemplate('template-123')).resolves.toBeUndefined()
      expect(mockObjectStore.delete).toHaveBeenCalledWith('template-123')
    })
  })

  describe('clearTemplates', () => {
    it('clears all templates when no projectId specified', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      mockObjectStore.clear.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      await expect(templateStorage.clearTemplates()).resolves.toBeUndefined()
      expect(mockObjectStore.clear).toHaveBeenCalled()
    })

    it('clears only project templates when projectId specified', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockOpenRequest }
        setTimeout(() => request.onsuccess?.(), 0)
        return request
      })

      const mockTemplates = [
        {
          id: 'template-1',
          projectId: 'my-project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'template-2',
          projectId: 'my-project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockObjectStore.index.mockReturnValue({
        getAll: vi.fn(() => {
          const req = { onsuccess: null as any, onerror: null as any, result: mockTemplates }
          setTimeout(() => req.onsuccess?.(), 0)
          return req
        }),
      })

      mockObjectStore.delete.mockImplementation(() => {
        const req = { onsuccess: null as any, onerror: null as any }
        setTimeout(() => req.onsuccess?.(), 0)
        return req
      })

      await templateStorage.clearTemplates('my-project')

      // Should delete each template individually
      expect(mockObjectStore.delete).toHaveBeenCalledTimes(2)
    })
  })
})
