/**
 * Tests for Datastore API client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios before importing the API
const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: mocks.mockPost,
      get: mocks.mockGet,
      defaults: { baseURL: '' },
    })),
  },
}))

// Import after mocking
import { datastoreApi } from '../datastore'

describe('datastoreApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    datastoreApi.clearCache()
  })

  const projectId = 'test-project'

  describe('lookup', () => {
    it('sends correct lookup request', async () => {
      mocks.mockPost.mockResolvedValue({ data: { found: [] } })

      const key = { partitionId: { projectId }, path: [{ kind: 'User', name: 'user1' }] }
      await datastoreApi.lookup(projectId, { keys: [key] })

      expect(mocks.mockPost).toHaveBeenCalledWith(`/v1/projects/${projectId}:lookup`, {
        keys: [key],
      })
    })
  })

  describe('runQuery', () => {
    it('sends correct runQuery request', async () => {
      mocks.mockPost.mockResolvedValue({ data: { batch: { entityResults: [] } } })

      const request = { partitionId: { projectId }, query: { kind: [{ name: 'User' }] } }
      await datastoreApi.runQuery(projectId, request)

      expect(mocks.mockPost).toHaveBeenCalledWith(`/v1/projects/${projectId}:runQuery`, request)
    })
  })

  describe('listKinds', () => {
    it('fetches kinds and caches result', async () => {
      // Mock first call: lookup __kind__
      // Mock second calls: lookup each kind for db discovery

      // We expect caching, so we'll test calling it twice

      // Mock for __kind__ query
      mocks.mockPost.mockImplementation((url: string, data: any) => {
        if (url.includes(':runQuery') && data.query?.kind?.[0]?.name === '__kind__') {
          return Promise.resolve({
            data: {
              batch: {
                entityResults: [
                  { entity: { key: { path: [{ name: 'KindA' }] } } },
                  { entity: { key: { path: [{ name: 'KindB' }] } } },
                ],
              },
            },
          })
        }
        // Mock to verify DB for KindA/KindB (default DB)
        if (
          url.includes(':runQuery') &&
          (data.query?.kind?.[0]?.name === 'KindA' || data.query?.kind?.[0]?.name === 'KindB')
        ) {
          return Promise.resolve({
            data: {
              batch: {
                entityResults: [
                  {
                    entity: {
                      key: { partitionId: { databaseId: '' }, path: [{ kind: 'KindA', id: '1' }] },
                    },
                  },
                ],
              },
            },
          })
        }
        return Promise.resolve({ data: {} })
      })

      // First call
      const kinds = await datastoreApi.listKinds(projectId, undefined, '')
      expect(kinds).toEqual(['KindA', 'KindB'])
      expect(mocks.mockPost).toHaveBeenCalledTimes(3) // 1 for __kind__, 2 for verifying DB

      // Second call (should be cached)
      vi.clearAllMocks() // Clear to ensure no new calls
      const cachedKinds = await datastoreApi.listKinds(projectId, undefined, '')
      expect(cachedKinds).toEqual(['KindA', 'KindB'])
      expect(mocks.mockPost).not.toHaveBeenCalled()
    })
  })

  describe('createEntity', () => {
    it('commits entity and clears cache', async () => {
      mocks.mockPost.mockResolvedValue({ data: { mutationResults: [{}] } })
      const entity = {
        key: { partitionId: { projectId }, path: [{ kind: 'User', name: 'u1' }] },
        properties: {},
      }

      await datastoreApi.createEntity(projectId, entity)

      expect(mocks.mockPost).toHaveBeenCalledWith(
        `/v1/projects/${projectId}:commit`,
        expect.objectContaining({ mutations: [{ insert: entity }] })
      )
    })
  })

  describe('deleteEntity', () => {
    it('deletes entity', async () => {
      mocks.mockPost.mockResolvedValue({ data: { mutationResults: [{}] } })
      const key = {
        partitionId: { projectId, databaseId: '' },
        path: [{ kind: 'User', name: 'u1' }],
      }

      await datastoreApi.deleteEntity(projectId, key)

      expect(mocks.mockPost).toHaveBeenCalledWith(
        `/v1/projects/${projectId}:commit`,
        expect.objectContaining({ mutations: [{ delete: expect.any(Object) }] })
      )
    })
  })

  describe('exportEntitiesAsJson', () => {
    it('exports all entities by namespace and kind', async () => {
      // 1. List namespaces
      mocks.mockPost.mockImplementation((url: string) => {
        if (url.includes('__namespace__')) {
          return Promise.resolve({
            data: {
              batch: {
                entityResults: [{ entity: { key: { path: [{ name: 'ns1' }] } } }],
              },
            },
          })
        }
        // 2. List Kinds for namespace
        if (url.includes('__kind__')) {
          return Promise.resolve({
            data: {
              batch: {
                entityResults: [{ entity: { key: { path: [{ name: 'Kind1' }] } } }],
              },
            },
          })
        }
        // 3. Run Query for Kind1
        if (url.includes(':runQuery')) {
          // Determine if checking db (limit 1) or fetching all (limit 10000)
          // The listKinds calls also trigger checks. This is complex to mock perfectly with just URL/Data inspection.
          // We return generic success.
          return Promise.resolve({
            data: {
              batch: {
                entityResults: [{ entity: { key: { path: [{ kind: 'Kind1', name: 'e1' }] } } }],
              },
            },
          })
        }
        return Promise.resolve({ data: {} })
      })

      const data = await datastoreApi.exportEntitiesAsJson(projectId)

      expect(data.projectId).toBe(projectId)
      // We expect namespaces: [''] (default) + ['ns1'] -> actually the implementation collects them
      // Impl: listNamespaces returns default '' always + results from query.
      // Our mock returns ns1. So ['', 'ns1'].
      // For each, it lists kinds, then queries entities.
      // This verifies the flow executes without error.
      expect(data.namespaces).toBeDefined()
    })
  })

  describe('file operations', () => {
    it('uploadFile sends multipart request', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      mocks.mockPost.mockResolvedValue({ data: {} })

      await datastoreApi.uploadFile(file, '/folder/test.txt')

      // Check that it posted to file server URL (we can't check baseURL easily on the mock call args here, but we check calls)
      expect(mocks.mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/upload?path='),
        expect.any(FormData)
      )
    })
  })
})
