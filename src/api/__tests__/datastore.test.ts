import { describe, it, expect, vi, beforeEach } from 'vitest'
import { datastoreApi } from '../datastore'

const mockInstance = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}))

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockInstance),
      post: mockInstance.post,
      get: mockInstance.get,
    },
  }
})

describe('datastoreApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    datastoreApi.clearCache()
  })

  it('lookup calls the correct endpoint', async () => {
    mockInstance.post.mockResolvedValue({ data: { found: [] } })

    const request = { keys: [] }
    const result = await datastoreApi.lookup('proj1', request)

    expect(mockInstance.post).toHaveBeenCalledWith('/v1/projects/proj1:lookup', request)
    expect(result).toEqual({ found: [] })
  })

  it('runQuery calls the correct endpoint', async () => {
    mockInstance.post.mockResolvedValue({ data: { batch: {} } })

    const request = { query: {} } as any
    const result = await datastoreApi.runQuery('proj1', request)

    expect(mockInstance.post).toHaveBeenCalledWith('/v1/projects/proj1:runQuery', request)
    expect(result).toEqual({ batch: {} })
  })

  describe('listKinds', () => {
    it('returns sorted list of kind names from __kind__ query', async () => {
      mockInstance.post.mockResolvedValue({
        data: {
          batch: {
            entityResults: [
              { entity: { key: { path: [{ name: 'KindB' }] } } },
              { entity: { key: { path: [{ name: 'KindA' }] } } },
            ],
          },
        },
      })

      const kinds = await datastoreApi.listKinds('proj1')
      expect(kinds).toEqual(['KindA', 'KindB'])
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/v1/projects/proj1:runQuery',
        expect.objectContaining({
          query: { kind: [{ name: '__kind__' }] },
        })
      )
    })

    it('uses databaseId in partitionId when provided', async () => {
      mockInstance.post.mockResolvedValue({ data: { batch: { entityResults: [] } } })

      await datastoreApi.listKinds('proj1', 'ns1', 'db1')
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/v1/projects/proj1:runQuery',
        expect.objectContaining({
          partitionId: expect.objectContaining({ databaseId: 'db1' }),
          databaseId: 'db1',
        })
      )
    })

    it('returns cached results on second call', async () => {
      mockInstance.post.mockResolvedValueOnce({
        data: {
          batch: {
            entityResults: [{ entity: { key: { path: [{ name: 'KindA' }] } } }],
          },
        },
      })

      const kinds1 = await datastoreApi.listKinds('proj1')
      const kinds2 = await datastoreApi.listKinds('proj1')

      expect(kinds1).toEqual(['KindA'])
      expect(kinds2).toEqual(['KindA'])
      expect(mockInstance.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('listDatabases', () => {
    it('discovers databases by probing kinds', async () => {
      // First call to listKinds (metadata discovery)
      mockInstance.post.mockResolvedValueOnce({
        data: {
          batch: {
            entityResults: [{ entity: { key: { path: [{ name: 'KindA' }] } } }],
          },
        },
      })

      // Probe call for KindA
      mockInstance.post.mockResolvedValueOnce({
        data: {
          batch: {
            entityResults: [{ entity: { key: { partitionId: { databaseId: 'db1' } } } }],
          },
        },
      })

      const databases = await datastoreApi.listDatabases('proj1')
      expect(databases).toContain('db1')
      expect(databases).toContain('') // always includes default
    })

    it('handles query failures during probing gracefully', async () => {
      // listKinds succeeds
      mockInstance.post.mockResolvedValueOnce({
        data: { batch: { entityResults: [{ entity: { key: { path: [{ name: 'K' }] } } }] } },
      })
      // Probing fails
      mockInstance.post.mockRejectedValueOnce(new Error('API Error'))

      const databases = await datastoreApi.listDatabases('proj1')
      expect(databases).toEqual([''])
    })
  })

  describe('listNamespaces', () => {
    it('filters namespaces by databaseId if provided', async () => {
      mockInstance.post.mockResolvedValue({
        data: {
          batch: {
            entityResults: [
              {
                entity: {
                  key: { path: [{ name: 'ns1' }], partitionId: { databaseId: 'db1' } },
                },
              },
              {
                entity: {
                  key: { path: [{ name: 'ns2' }], partitionId: { databaseId: 'db2' } },
                },
              },
            ],
          },
        },
      })

      const namespaces = await datastoreApi.listNamespaces('proj1', 'db1')
      expect(namespaces).toEqual(['', 'ns1'])
    })
  })

  describe('getEntitiesByKind', () => {
    it('handles offset pagination', async () => {
      mockInstance.post.mockResolvedValue({ data: { batch: { entityResults: [] } } })

      await datastoreApi.getEntitiesByKind('p1', 'K1', 'ns1', 10, 20)
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/v1/projects/p1:runQuery',
        expect.objectContaining({
          query: expect.objectContaining({ offset: 20 }),
        })
      )
    })

    it('handles cursor pagination', async () => {
      mockInstance.post.mockResolvedValue({ data: { batch: { entityResults: [] } } })

      await datastoreApi.getEntitiesByKind('p1', 'K1', 'ns1', 10, 'cursor123')
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/v1/projects/p1:runQuery',
        expect.objectContaining({
          query: expect.objectContaining({ startCursor: 'cursor123' }),
        })
      )
    })
  })

  describe('mutations', () => {
    it('createEntity normalizes partitionId and includes databaseId', async () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const entity = {
        key: { path: [{ kind: 'K' }], partitionId: { projectId: 'p', databaseId: 'db1' } },
        properties: {},
      } as any

      await datastoreApi.createEntity('p', entity)

      const request = mockInstance.post.mock.calls[0][1] as any
      expect(request.databaseId).toBe('db1')
      expect(request.mutations[0].insert.key.partitionId.databaseId).toBe('db1')
    })

    it('updateEntity handles default database normalization', async () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      const entity = {
        key: {
          path: [{ kind: 'K' }],
          partitionId: { projectId: 'p', databaseId: '(default)' },
        },
        properties: {},
      } as any

      await datastoreApi.updateEntity('p', entity)

      const request = mockInstance.post.mock.calls[0][1] as any
      expect(request.databaseId).toBeUndefined()
      expect(request.mutations[0].update.key.partitionId.databaseId).toBeUndefined()
    })

    it('deleteKind handles batch deletion', async () => {
      mockInstance.post
        // listKinds
        .mockResolvedValueOnce({
          data: { batch: { entityResults: [{ entity: { key: { path: [{ name: 'K' }] } } }] } },
        })
        // getEntitiesByKind
        .mockResolvedValueOnce({
          data: {
            batch: {
              entityResults: Array(10)
                .fill(0)
                .map((_, i) => ({ entity: { key: { path: [{ kind: 'K', id: i.toString() }] } } })),
            },
          },
        })
        // commit
        .mockResolvedValue({ data: {} })

      await datastoreApi.deleteKind('p', 'K')
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/v1/projects/p:commit',
        expect.objectContaining({
          mutations: expect.arrayContaining([
            expect.objectContaining({ delete: expect.any(Object) }),
          ]),
        })
      )
    })
  })

  describe('cache management', () => {
    it('clearCache with pattern only removes matches', async () => {
      // Seed cache via API calls
      mockInstance.post.mockResolvedValue({ data: { batch: { entityResults: [] } } })

      await datastoreApi.listKinds('p1') // key: kinds:p1::
      await datastoreApi.listKinds('p2') // key: kinds:p2::

      datastoreApi.clearCache('p1')

      // Should call API for p1 again but not p2
      await datastoreApi.listKinds('p1')
      await datastoreApi.listKinds('p2')

      expect(mockInstance.post).toHaveBeenCalledTimes(3) // p1(seed), p2(seed), p1(after clear)
    })
  })
})
