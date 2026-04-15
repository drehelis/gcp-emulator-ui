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
  reset: vi.fn(),
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
    localStorage.clear()
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

    it('does not auto-select if database already selected', async () => {
      vi.mocked(datastoreApi.listDatabases).mockResolvedValue(['db1', 'db2'])
      const store = useDatastoreStore()
      store.setSelectedDatabase('db2')
      await store.loadDatabases(projectId)
      expect(store.selectedDatabase).toBe('db2')
    })

    it('does not auto-select if selected database is empty string', async () => {
      vi.mocked(datastoreApi.listDatabases).mockResolvedValue(['db1', 'db2'])
      const store = useDatastoreStore()
      store.setSelectedDatabase('')
      await store.loadDatabases(projectId)
      expect(store.selectedDatabase).toBe('')
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

    it('keeps existing namespace if still in list', async () => {
      vi.mocked(datastoreApi.listNamespaces).mockResolvedValue(['ns1', 'ns2'])
      const store = useDatastoreStore()
      store.setSelectedNamespace('ns2')
      await store.loadNamespaces(projectId)
      expect(store.selectedNamespace).toBe('ns2')
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

    it('handles 100+ entities in kind count', async () => {
      vi.mocked(datastoreApi.listKinds).mockResolvedValue(['KindA'])
      vi.mocked(datastoreApi.getEntitiesByKind).mockResolvedValue({
        entities: Array(100).fill({}),
        hasMore: true,
      } as any)

      const store = useDatastoreStore()
      await store.loadKinds(projectId)

      expect(store.kinds[0].entityCount).toBe(100)
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

    it('discovers databases from entity keys', async () => {
      const entities = [
        { key: { partitionId: { databaseId: 'found-db' }, path: [{ kind: 'KindA' }] } },
      ]
      vi.mocked(datastoreApi.getEntitiesByKind).mockResolvedValue({
        entities,
        hasMore: false,
      } as any)

      const store = useDatastoreStore()
      await store.loadEntities(projectId, 'KindA')

      expect(store.databases).toContain('found-db')
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

  describe('selection and helpers', () => {
    it('getCurrentDatabase returns empty string if undefined', () => {
      const store = useDatastoreStore()
      store.setSelectedDatabase(undefined)
      expect(store.getCurrentDatabase()).toBe('')
    })

    it('getCurrentNamespace returns empty string if undefined', () => {
      const store = useDatastoreStore()
      store.setSelectedNamespace(undefined)
      expect(store.getCurrentNamespace()).toBe('')
    })

    it('addDatabase updates custom list and persistence', () => {
      const store = useDatastoreStore()
      store.addDatabase('custom-db')
      expect(store.databases).toContain('custom-db')

      const stored = localStorage.getItem('datastore_enter_manually_databases')
      expect(stored).toContain('custom-db')
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
      expect(apiMock.exportEntities).toHaveBeenCalledWith('p1', '/tmp', undefined)
    })

    it('importEntities calls api and reloads kinds', async () => {
      const store = useDatastoreStore()

      await store.importEntities('p1', '/tmp/meta')

      expect(apiMock.importEntities).toHaveBeenCalledWith('p1', '/tmp/meta', undefined)
      expect(apiMock.listKinds).toHaveBeenCalledWith('p1', undefined, undefined)
    })

    it('exportEntitiesAsJson calls api', async () => {
      const store = useDatastoreStore()
      await store.exportEntitiesAsJson('p1', 'ns1')
      expect(apiMock.exportEntitiesAsJson).toHaveBeenCalledWith('p1', 'ns1', undefined)
    })

    it('clearData resets state', () => {
      const store = useDatastoreStore()
      store.kinds = [{ name: 'k', entityCount: 1, bytes: 0, isExpanded: false }]
      store.entities.set('k', [{} as any])

      store.clearData()

      expect(store.kinds).toHaveLength(0)
      expect(store.entities.size).toBe(0)
    })

    it('deleteAllContent calls api and clears state', async () => {
      vi.mocked(apiMock.reset).mockResolvedValue(undefined as any)
      const store = useDatastoreStore()
      store.kinds = [{ name: 'KindA', entityCount: 1, bytes: 0, isExpanded: false }]
      store.entities.set('KindA', [{} as any])
      store.selectedDatabase = 'db1'
      store.selectedNamespace = 'ns1'

      await store.deleteAllContent()

      expect(apiMock.reset).toHaveBeenCalled()
      expect(store.kinds).toHaveLength(0)
      expect(store.entities.size).toBe(0)
      expect(store.selectedDatabase).toBeUndefined()
      expect(store.selectedNamespace).toBeUndefined()
      // Computed properties should fall back to default empty state
      expect(store.databases).toEqual([''])
      expect(store.namespaces).toEqual([''])
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

    it('deleteAllContent handles error', async () => {
      vi.mocked(apiMock.reset).mockRejectedValue(new Error('reset fail'))
      const store = useDatastoreStore()
      await expect(store.deleteAllContent()).rejects.toThrow('reset fail')
      expect(store.loading).toBe(false)
    })
  })
})
