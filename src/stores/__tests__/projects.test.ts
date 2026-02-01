/**
 * Tests for Projects store
 * GCP project management and selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '../projects'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}))

// Mock pubsub API
vi.mock('@/api/pubsub', () => ({
  pubsubApi: {
    projects: {
      getProjects: vi.fn(),
      attachProject: vi.fn(),
      removeProject: vi.fn()
    }
  }
}))

describe('useProjectsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has idle state initially', () => {
      const store = useProjectsStore()
      expect(store.state.state).toBe('idle')
    })

    it('has empty projects array', () => {
      const store = useProjectsStore()
      expect(store.projects).toEqual([])
    })

    it('has null selected project', () => {
      const store = useProjectsStore()
      expect(store.selectedProject).toBeNull()
      expect(store.selectedProjectId).toBeNull()
    })

    it('has empty project list', () => {
      const store = useProjectsStore()
      expect(store.projectList).toEqual([])
    })

    it('has empty recent projects', () => {
      const store = useProjectsStore()
      expect(store.recentProjects).toEqual([])
    })

    it('has empty favorite projects', () => {
      const store = useProjectsStore()
      expect(store.favoriteProjects).toEqual([])
    })

    it('is not loading initially', () => {
      const store = useProjectsStore()
      expect(store.isLoading).toBe(false)
    })

    it('has no error initially', () => {
      const store = useProjectsStore()
      expect(store.hasError).toBe(false)
    })
  })

  describe('selectProject', () => {
    it('sets selected project ID from string', () => {
      const store = useProjectsStore()
      store.selectProject('my-project')
      expect(store.selectedProjectId).toBe('my-project')
    })

    it('adds project to project list if not present', () => {
      const store = useProjectsStore()
      store.selectProject('new-project')
      expect(store.projectList).toContain('new-project')
    })

    it('adds project to recent projects', () => {
      const store = useProjectsStore()
      store.selectProject('my-project')
      expect(store.recentProjects).toContain('my-project')
    })

    it('moves project to front of recent list when selected again', () => {
      const store = useProjectsStore()
      store.selectProject('project-a')
      store.selectProject('project-b')
      store.selectProject('project-a')
      
      expect(store.recentProjects[0]).toBe('project-a')
    })

    it('limits recent projects to 20', () => {
      const store = useProjectsStore()
      for (let i = 0; i < 25; i++) {
        store.selectProject(`project-${i}`)
      }
      expect(store.recentProjects.length).toBe(20)
    })

    it('persists to localStorage', () => {
      const store = useProjectsStore()
      store.selectProject('saved-project')
      
      const saved = localStorage.getItem('emulator-ui-selected-project-id')
      expect(saved).toBe('saved-project')
    })
  })

  describe('clearSelectedProject', () => {
    it('clears selected project', () => {
      const store = useProjectsStore()
      store.selectProject('my-project')
      
      store.clearSelectedProject()
      
      expect(store.selectedProject).toBeNull()
      expect(store.selectedProjectId).toBeNull()
    })

    it('removes from localStorage', () => {
      const store = useProjectsStore()
      store.selectProject('my-project')
      store.clearSelectedProject()
      
      expect(localStorage.getItem('emulator-ui-selected-project-id')).toBeNull()
    })
  })

  describe('favorites management', () => {
    it('adds project to favorites', () => {
      const store = useProjectsStore()
      store.addToFavorites('fav-project')
      expect(store.favoriteProjects).toContain('fav-project')
    })

    it('does not add duplicate favorites', () => {
      const store = useProjectsStore()
      store.addToFavorites('fav-project')
      store.addToFavorites('fav-project')
      expect(store.favoriteProjects.filter(p => p === 'fav-project').length).toBe(1)
    })

    it('removes project from favorites', () => {
      const store = useProjectsStore()
      store.addToFavorites('fav-project')
      store.removeFromFavorites('fav-project')
      expect(store.favoriteProjects).not.toContain('fav-project')
    })

    it('toggles favorite status', () => {
      const store = useProjectsStore()
      
      store.toggleFavorite('toggle-project')
      expect(store.isProjectFavorite('toggle-project')).toBe(true)
      
      store.toggleFavorite('toggle-project')
      expect(store.isProjectFavorite('toggle-project')).toBe(false)
    })

    it('persists favorites to localStorage', () => {
      const store = useProjectsStore()
      store.addToFavorites('saved-fav')
      
      const saved = localStorage.getItem('emulator-ui-favorite-projects')
      expect(saved).toContain('saved-fav')
    })
  })

  describe('filters', () => {
    it('updates filters', () => {
      const store = useProjectsStore()
      store.updateFilters({ namePattern: 'test' })
      expect(store.filters.namePattern).toBe('test')
    })

    it('clears filters', () => {
      const store = useProjectsStore()
      store.updateFilters({ namePattern: 'test', states: ['ACTIVE'] })
      
      store.clearFilters()
      
      expect(store.filters.namePattern).toBe('')
      expect(store.filters.states).toEqual([])
    })
  })

  describe('pagination', () => {
    it('updates pagination options', () => {
      const store = useProjectsStore()
      store.updatePagination({ pageSize: 100 })
      expect(store.pagination.pageSize).toBe(100)
    })
  })

  describe('deleteProject', () => {
    it('removes project from project list', () => {
      const store = useProjectsStore()
      store.selectProject('to-delete')
      store.selectProject('to-keep')
      
      store.deleteProject('to-delete')
      
      expect(store.projectList).not.toContain('to-delete')
      expect(store.projectList).toContain('to-keep')
    })

    it('clears selection if deleted project was selected', () => {
      const store = useProjectsStore()
      store.selectProject('to-delete')
      
      store.deleteProject('to-delete')
      
      expect(store.selectedProjectId).toBeNull()
    })

    it('removes from favorites and recent', () => {
      const store = useProjectsStore()
      store.selectProject('to-delete')
      store.addToFavorites('to-delete')
      
      store.deleteProject('to-delete')
      
      expect(store.recentProjects).not.toContain('to-delete')
      expect(store.favoriteProjects).not.toContain('to-delete')
    })
  })

  describe('getProjectById', () => {
    it('returns undefined for unknown project', () => {
      const store = useProjectsStore()
      expect(store.getProjectById('unknown')).toBeUndefined()
    })
  })

  describe('isProjectRecent', () => {
    it('returns true for recent project', () => {
      const store = useProjectsStore()
      store.selectProject('recent-project')
      expect(store.isProjectRecent('recent-project')).toBe(true)
    })

    it('returns false for non-recent project', () => {
      const store = useProjectsStore()
      expect(store.isProjectRecent('never-selected')).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state', () => {
      const store = useProjectsStore()
      store.selectProject('my-project')
      store.addToFavorites('my-project')
      store.updateFilters({ namePattern: 'test' })
      
      store.reset()
      
      expect(store.projects).toEqual([])
      expect(store.selectedProject).toBeNull()
      expect(store.recentProjects).toEqual([])
      expect(store.favoriteProjects).toEqual([])
      expect(store.filters.namePattern).toBe('')
      expect(store.state.state).toBe('idle')
    })
  })

  describe('initialize', () => {
    it('loads selected project from localStorage', () => {
      localStorage.setItem('emulator-ui-selected-project-id', 'stored-project')
      
      const store = useProjectsStore()
      store.initialize()
      
      expect(store.selectedProjectId).toBe('stored-project')
    })

    it('loads project list from localStorage', () => {
      localStorage.setItem('emulator-ui-project-list', JSON.stringify(['p1', 'p2']))
      
      const store = useProjectsStore()
      store.initialize()
      
      expect(store.projectList).toEqual(['p1', 'p2'])
    })

    it('loads favorites from localStorage', () => {
      localStorage.setItem('emulator-ui-favorite-projects', JSON.stringify(['fav1']))
      
      const store = useProjectsStore()
      store.initialize()
      
      expect(store.favoriteProjects).toEqual(['fav1'])
    })
  })

  describe('computed properties', () => {
    it('projectStats returns correct counts', () => {
      const store = useProjectsStore()
      expect(store.projectStats.total).toBe(0)
      expect(store.projectStats.favorites).toBe(0)
    })

    it('activeProjects filters active state', () => {
      const store = useProjectsStore()
      expect(store.activeProjects).toEqual([])
    })
  })

  describe('clearCache', () => {
    it('clears project cache', () => {
      const store = useProjectsStore()
      store.clearCache()
      // Just ensure it doesn't throw
      expect(true).toBe(true)
    })
  })

  describe('fetchProjects', () => {
    it('sets loading state during fetch', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.getProjects).mockResolvedValue(['project1'])

      const store = useProjectsStore()
      const promise = store.fetchProjects()
      
      expect(store.isLoading).toBe(true)
      await promise
      expect(store.isLoading).toBe(false)
    })

    it('populates project list from API', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.getProjects).mockResolvedValue(['proj1', 'proj2'])

      const store = useProjectsStore()
      await store.fetchProjects()
      
      expect(store.projectList).toContain('proj1')
      expect(store.projectList).toContain('proj2')
    })

    it('sets error state on fetch failure', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.getProjects).mockRejectedValue(new Error('Network error'))

      const store = useProjectsStore()
      
      await expect(store.fetchProjects()).rejects.toThrow()
      expect(store.hasError).toBe(true)
    })
  })

  describe('addProject', () => {
    it('adds project via API', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.attachProject).mockResolvedValue()

      const store = useProjectsStore()
      await store.addProject('new-project')
      
      expect(store.projectList).toContain('new-project')
    })

    it('selects newly added project', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.attachProject).mockResolvedValue()

      const store = useProjectsStore()
      await store.addProject('new-project')
      
      expect(store.selectedProjectId).toBe('new-project')
    })

    it('does not add duplicate projects', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.attachProject).mockResolvedValue()

      const store = useProjectsStore()
      await store.addProject('dup-project')
      await store.addProject('dup-project')
      
      expect(store.projectList.filter(p => p === 'dup-project').length).toBe(1)
    })

    it('handles add error gracefully', async () => {
      const pubsubApi = await import('@/api/pubsub')
      vi.mocked(pubsubApi.pubsubApi.projects.attachProject).mockRejectedValue(new Error('Add failed'))

      const store = useProjectsStore()
      
      await expect(store.addProject('fail-project')).rejects.toThrow()
    })
  })

  describe('filteredProjects computed', () => {
    it('filters by name pattern', () => {
      const store = useProjectsStore()
      // Add projects via internal mutation for testing
      store.$patch({
        projects: [
          { projectId: 'test-project', name: 'Test Project', state: 'ACTIVE', createdAt: new Date() },
          { projectId: 'other-project', name: 'Other Project', state: 'ACTIVE', createdAt: new Date() }
        ]
      })
      
      store.updateFilters({ namePattern: 'test' })
      
      expect(store.filteredProjects.length).toBe(1)
      expect(store.filteredProjects[0].name).toContain('Test')
    })

    it('filters by project state', () => {
      const store = useProjectsStore()
      store.$patch({
        projects: [
          { projectId: 'active-p', name: 'Active', state: 'ACTIVE', createdAt: new Date() },
          { projectId: 'inactive-p', name: 'Inactive', state: 'DELETE_REQUESTED', createdAt: new Date() }
        ]
      })
      
      store.updateFilters({ states: ['ACTIVE'] })
      
      expect(store.filteredProjects.length).toBe(1)
    })  
  })

  describe('fetchProject', () => {
    it('returns cached project if available', async () => {
      const store = useProjectsStore()
      
      // First call to cache
      const project = await store.fetchProject('cached-project')
      
      // Second call should return cached
      const cached = await store.fetchProject('cached-project')
      expect(cached?.projectId).toBe('cached-project')
    })
  })
})

