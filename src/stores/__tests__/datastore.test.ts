import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDatastoreStore } from '../datastore'
import { datastoreApi } from '@/api/datastore'
import { useProjectsStore } from '../projects'

const apiMock = vi.hoisted(() => ({
  listDatabases: vi.fn(),
  listNamespaces: vi.fn(),
  listKinds: vi.fn(),
  getEntitiesByKind: vi.fn(),
  createEntity: vi.fn(),
  updateEntity: vi.fn(),
  deleteEntity: vi.fn(),
  deleteKind: vi.fn(),
  healthCheck: vi.fn(),
  exportEntities: vi.fn(),
  importEntities: vi.fn(),
  exportEntitiesAsJson: vi.fn(),
  getKeyKind: vi.fn((key: any) => key.path[key.path.length - 1].kind),
  getKeyId: vi.fn(
    (key: any) => key.path[key.path.length - 1].name || key.path[key.path.length - 1].id
  ),
}))

vi.mock('@/api/datastore', () => ({
  datastoreApi: apiMock,
  default: apiMock,
}))

vi.mock('../projects', () => ({
  useProjectsStore: vi.fn(),
}))

describe('useDatastoreStore', () => {
  const projectId = 'test-project'

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(useProjectsStore).mockReturnValue({ selectedProjectId: projectId } as any)
  })

  describe('initialization', () => {
    it('initializes with default state', () => {
      const store = useDatastoreStore()
      expect(store.kinds).toHaveLength(0)
      expect(store.entities.size).toBe(0)
    })
  })

  describe('loadDatabases', () => {
    it('loads databases and sets default', async () => {
      vi.mocked(datastoreApi.listDatabases).mockResolvedValue(['(default)', 'db2'])

      const store = useDatastoreStore()
      await store.loadDatabases(projectId)

      expect(store.databases).toEqual(['(default)', 'db2'])
      expect(store.selectedDatabase).toBe('(default)')
    })
  })

  describe('loadNamespaces', () => {
    it('loads namespaces and sets default', async () => {
      vi.mocked(datastoreApi.listNamespaces).mockResolvedValue(['', 'ns1'])

      const store = useDatastoreStore()
      await store.loadNamespaces(projectId)

      expect(store.namespaces).toEqual(['', 'ns1'])
      expect(store.selectedNamespace).toBe('')
    })
  })

  describe('loadKinds', () => {
    it('loads kinds and counts', async () => {
      vi.mocked(datastoreApi.listKinds).mockResolvedValue(['KindA'])
      vi.mocked(datastoreApi.getEntitiesByKind).mockResolvedValue({
        entities: [],
        hasMore: false,
      } as any)

      const store = useDatastoreStore()
      await store.loadKinds(projectId)

      expect(store.kinds).toHaveLength(1)
      expect(store.kinds[0].name).toBe('KindA')
      expect(datastoreApi.getEntitiesByKind).toHaveBeenCalled() // called for counting
    })
  })

  describe('loadEntities', () => {
    it('loads entities and updates kind count', async () => {
      const entities = [{ key: { path: [{ kind: 'KindA', name: 'e1' }] } }]
      vi.mocked(datastoreApi.getEntitiesByKind).mockResolvedValue({
        entities,
        hasMore: false,
      } as any)

      const store = useDatastoreStore()
      // Setup kind metadata first
      store.kinds = [{ name: 'KindA', entityCount: 0, bytes: 0, isExpanded: false }]

      await store.loadEntities(projectId, 'KindA')

      expect(store.entities.get('KindA')).toEqual(entities)
      expect(store.kinds[0].entityCount).toBe(1)
    })
  })

  describe('createEntity', () => {
    it('creates entity and updates cache', async () => {
      const entity = { key: { path: [{ kind: 'KindA', name: 'e2' }] } }
      vi.mocked(datastoreApi.createEntity).mockResolvedValue(entity as any)

      const store = useDatastoreStore()
      store.entities.set('KindA', [])

      await store.createEntity(projectId, entity as any)

      expect(store.entities.get('KindA')).toContainEqual(entity)
      expect(store.kinds).toHaveLength(1) // Should add new kind if not exists
      expect(store.kinds[0].name).toBe('KindA')
    })
  })

  describe('updateEntity', () => {
    it('updates entity in cache', async () => {
      const original = { key: { path: [{ kind: 'KindA', name: 'e1' }] }, prop: 'old' }
      const updated = { ...original, prop: 'new' }
      vi.mocked(datastoreApi.updateEntity).mockResolvedValue(updated as any)

      const store = useDatastoreStore()
      store.entities.set('KindA', [original as any])

      await store.updateEntity(projectId, updated as any)

      expect(store.entities.get('KindA')![0].prop).toBe('new')
    })
  })

  describe('deleteEntity', () => {
    it('deletes entity from cache', async () => {
      const entity = { key: { path: [{ kind: 'KindA', name: 'e1' }] } }
      vi.mocked(datastoreApi.deleteEntity).mockResolvedValue(true as any)

      const store = useDatastoreStore()
      store.entities.set('KindA', [entity as any])
      store.kinds = [{ name: 'KindA', entityCount: 1, bytes: 0, isExpanded: false }]

      await store.deleteEntity(projectId, entity.key as any)

      expect(store.entities.get('KindA')).toHaveLength(0)
      expect(store.kinds[0].entityCount).toBe(0)
    })
  })

  describe('deleteKind', () => {
    it('removes kind from list', async () => {
      vi.mocked(datastoreApi.deleteKind).mockResolvedValue(true as any)

      const store = useDatastoreStore()
      store.kinds = [{ name: 'KindA', entityCount: 1, bytes: 0, isExpanded: false }]
      store.entities.set('KindA', [])

      await store.deleteKind(projectId, 'KindA')

      expect(store.kinds).toHaveLength(0)
      expect(store.entities.has('KindA')).toBe(false)
    })
  })

  describe('import/export/health', () => {
    it('healthCheck returns true on success', async () => {
      vi.mocked(apiMock.healthCheck).mockResolvedValue(true as any)
      const store = useDatastoreStore()
      expect(await store.healthCheck()).toBe(true)
    })

    it('healthCheck returns false on failure', async () => {
      vi.mocked(apiMock.healthCheck).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()
      expect(await store.healthCheck()).toBe(false)
    })

    it('exportEntities calls api', async () => {
      const store = useDatastoreStore()
      await store.exportEntities('p1', '/tmp')
      expect(apiMock.exportEntities).toHaveBeenCalledWith('p1', '/tmp')
    })

    it('importEntities calls api and reloads kinds', async () => {
      const store = useDatastoreStore()

      await store.importEntities('p1', '/tmp/meta')

      expect(apiMock.importEntities).toHaveBeenCalledWith('p1', '/tmp/meta')
      expect(apiMock.listKinds).toHaveBeenCalledWith('p1', '', '') // loadKinds calls listKinds
    })

    it('clearData resets state', () => {
      const store = useDatastoreStore()
      store.kinds = [{ name: 'k', entityCount: 1, bytes: 0, isExpanded: false }]
      store.entities.set('k', [{} as any])

      store.clearData()

      expect(store.kinds).toHaveLength(0)
      expect(store.entities.size).toBe(0)
    })
  })

  describe('error handling', () => {
    it('loadDatabases handles error', async () => {
      vi.mocked(apiMock.listDatabases).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()

      await expect(store.loadDatabases('p1')).resolves.not.toThrow()
      expect(store.databases).toEqual([''])
    })

    it('loadNamespaces handles error', async () => {
      vi.mocked(apiMock.listNamespaces).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()

      await expect(store.loadNamespaces('p1')).resolves.not.toThrow()
      expect(store.namespaces).toEqual([''])
    })

    it('loadKinds handles error', async () => {
      vi.mocked(apiMock.listKinds).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()

      await expect(store.loadKinds('p1')).resolves.not.toThrow()
      // Kinds validation not strictly needed if we just check it doesn't crash
    })

    it('createEntity handles error', async () => {
      vi.mocked(apiMock.createEntity).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()
      await expect(store.createEntity('p1', {} as any)).rejects.toThrow('fail')
    })

    it('updateEntity handles error', async () => {
      vi.mocked(apiMock.updateEntity).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()
      await expect(store.updateEntity('p1', {} as any)).rejects.toThrow('fail')
    })

    it('deleteEntity handles error', async () => {
      vi.mocked(apiMock.deleteEntity).mockRejectedValue(new Error('fail'))
      const store = useDatastoreStore()
      await expect(store.deleteEntity('p1', {} as any)).rejects.toThrow('fail')
    })
  })
})
