import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('runAggregationQuery calls the correct endpoint', async () => {
    mockInstance.post.mockResolvedValue({ data: { batch: {} } })
    const request = { aggregationQuery: {} } as any
    const result = await datastoreApi.runAggregationQuery('proj1', request)
    expect(mockInstance.post).toHaveBeenCalledWith(
      '/v1/projects/proj1:runAggregationQuery',
      request
    )
    expect(result).toEqual({ batch: {} })
  })

  it('beginTransaction returns transaction ID', async () => {
    mockInstance.post.mockResolvedValue({ data: { transaction: 'tx1' } })
    const tx = await datastoreApi.beginTransaction('proj1', { readWrite: {} }, 'db1')
    expect(tx).toBe('tx1')
    expect(mockInstance.post).toHaveBeenCalledWith(
      '/v1/projects/proj1:beginTransaction',
      expect.objectContaining({ databaseId: 'db1' })
    )
  })

  it('rollback calls correct endpoint', async () => {
    mockInstance.post.mockResolvedValue({})
    await datastoreApi.rollback('proj1', 'tx1', 'db1')
    expect(mockInstance.post).toHaveBeenCalledWith(
      '/v1/projects/proj1:rollback',
      expect.objectContaining({ transaction: 'tx1', databaseId: 'db1' })
    )
  })

  it('allocateIds returns keys', async () => {
    mockInstance.post.mockResolvedValue({ data: { keys: [{ path: [] }] } })
    const res = await datastoreApi.allocateIds('proj1', { keys: [{ path: [] }], databaseId: 'db1' })
    expect(res.keys).toHaveLength(1)
    expect(mockInstance.post).toHaveBeenCalledWith(
      '/v1/projects/proj1:allocateIds',
      expect.objectContaining({ databaseId: 'db1' })
    )
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

      await datastoreApi.deleteKind('p', 'K', 'ns1', 'db1')
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/v1/projects/p:commit',
        expect.objectContaining({
          databaseId: 'db1',
          mutations: expect.arrayContaining([
            expect.objectContaining({ delete: expect.any(Object) }),
          ]),
        })
      )
    })

    it('handles deleteKind error gracefully', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(datastoreApi, 'getEntitiesByKind').mockRejectedValue(new Error('fail'))
      await datastoreApi.deleteKind('p', 'K')
      expect(console.error).toHaveBeenCalled()
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

    it('handles cache TTL expiration', async () => {
      vi.useFakeTimers()
      mockInstance.post.mockResolvedValue({ data: { batch: { entityResults: [] } } })

      await datastoreApi.listKinds('p1')
      expect(mockInstance.post).toHaveBeenCalledTimes(1)

      // Advance time by 31 seconds (TTL is 30s)
      vi.advanceTimersByTime(31000)

      await datastoreApi.listKinds('p1')
      expect(mockInstance.post).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('utility operations', () => {
    it('healthCheck returns true on success', async () => {
      mockInstance.post.mockResolvedValue({ data: { batch: {} } })
      const healthy = await datastoreApi.healthCheck('p1')
      expect(healthy).toBe(true)
    })

    it('healthCheck returns false on error', async () => {
      vi.spyOn(datastoreApi, 'listKinds').mockRejectedValue(new Error())
      const healthy = await datastoreApi.healthCheck('p1')
      expect(healthy).toBe(false)
    })

    it('exportEntities calls emulator endpoint', async () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      await datastoreApi.exportEntities('p1', '/tmp/export')
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/emulator/v1/projects/p1:export',
        expect.objectContaining({ export_directory: '/tmp/export' })
      )
    })

    it('importEntities calls emulator endpoint', async () => {
      mockInstance.post.mockResolvedValue({ data: {} })
      await datastoreApi.importEntities('p1', '/tmp/import')
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/emulator/v1/projects/p1:import',
        expect.objectContaining({ export_directory: '/tmp/import' })
      )
    })
  })

  describe('exportEntitiesAsJson', () => {
    it('traverses namespaces and kinds', async () => {
      mockInstance.post
        // listNamespaces
        .mockResolvedValueOnce({
          data: {
            batch: {
              entityResults: [{ entity: { key: { path: [{ name: 'ns1' }] } } }],
            },
          },
        })
        // listKinds for ns1
        .mockResolvedValueOnce({
          data: {
            batch: {
              entityResults: [{ entity: { key: { path: [{ name: 'Kind1' }] } } }],
            },
          },
        })
        // runQuery for Kind1 in ns1
        .mockResolvedValueOnce({
          data: {
            batch: {
              entityResults: [{ entity: { key: { path: [{ kind: 'Kind1', name: 'e1' }] } } }],
            },
          },
        })

      const data = await datastoreApi.exportEntitiesAsJson('p1')
      expect(data.namespaces).toHaveLength(2) // ns1 + default
    })
  })

  describe('file server operations', () => {
    it('createDirectory calls upload with mkdir', async () => {
      mockInstance.post.mockResolvedValue({})
      await datastoreApi.createDirectory('path/to/dir')
      expect(mockInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('/upload?path=path%2Fto'),
        expect.any(FormData)
      )
    })

    it('uploadFile calls upload with file content', async () => {
      mockInstance.post.mockResolvedValue({})
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      await datastoreApi.uploadFile(file, 'path/to/test.txt')
      expect(mockInstance.post).toHaveBeenCalled()
    })

    it('downloadFile returns blob', async () => {
      const blob = new Blob(['content'])
      mockInstance.get.mockResolvedValue({ data: blob })
      const result = await datastoreApi.downloadFile('test.txt')
      expect(result).toBe(blob)
    })

    it('uploadFiles creates directories and uploads files', async () => {
      mockInstance.post.mockResolvedValue({})
      const file1 = new File(['c1'], 'dir1/f1.txt', { type: 'text/plain' })
      // @ts-ignore - webkitRelativePath is read-only in browser but we can mock it
      Object.defineProperty(file1, 'webkitRelativePath', { value: 'dir1/f1.txt' })

      await datastoreApi.uploadFiles([file1], '/base')

      // Should create directory dir1
      expect(mockInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('mkdir=dir1'),
        expect.any(FormData)
      )
      // Should upload file
      expect(mockInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('path=%2Fbase%2Fdir1'),
        expect.any(FormData)
      )
    })

    it('uploadFile handles targetPath without slash', async () => {
      mockInstance.post.mockResolvedValue({})
      const file = new File(['c'], 'f.txt')
      await datastoreApi.uploadFile(file, 'no-slash-path')
      expect(mockInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('path=%2F'),
        expect.any(FormData)
      )
    })

    it('reset calls correct endpoint', async () => {
      mockInstance.post.mockResolvedValue({})
      await datastoreApi.reset()
      expect(mockInstance.post).toHaveBeenCalledWith('/reset')
    })
  })
})
