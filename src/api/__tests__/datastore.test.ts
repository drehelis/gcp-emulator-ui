import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { datastoreApi } from '../datastore'

vi.mock('axios', () => {
  const instance = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => instance),
      post: instance.post,
      get: instance.get,
    },
  }
})

describe('datastoreApi', () => {
  let mockInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockInstance = (axios.create as any).mock.results[0].value
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
    })
  })

  describe('entity operations', () => {
    it('getEntity returns entity or null', async () => {
      mockInstance.post.mockResolvedValueOnce({
        data: { found: [{ entity: { name: 'e1' } }] },
      })

      const key = { path: [], partitionId: { projectId: 'p' } } as any
      const entity = await datastoreApi.getEntity('p', key)
      expect(entity).toEqual({ name: 'e1' })
    })

    it('deleteEntity strips databaseId for default database', async () => {
      mockInstance.post.mockResolvedValue({ data: {} })

      const key = {
        partitionId: { projectId: 'p', namespaceId: 'ns', databaseId: '(default)' },
        path: [{ kind: 'K', name: 'N' }],
      } as any

      await datastoreApi.deleteEntity('p', key)

      const lastCall = mockInstance.post.mock.calls.find((call: any) => call[0].endsWith(':commit'))
      const request = lastCall[1] as any
      expect(request.mutations[0].delete.partitionId.databaseId).toBeUndefined()
    })
  })
})
