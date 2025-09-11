/**
 * Projects store
 * Manages GCP project state, selection, and operations
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pubsubApi } from '@/api/pubsub'
import { useAppStore } from './app'
import type {
  GCPProject,
  SearchFilters,
  PaginationOptions,
  BaseStoreState
} from '@/types'

export const useProjectsStore = defineStore('projects', () => {
  // State
  const state = ref<BaseStoreState>({
    state: 'idle',
    error: null,
    lastUpdated: null
  })

  const projects = ref<GCPProject[]>([])
  const selectedProject = ref<GCPProject | null>(null)
  const recentProjects = ref<string[]>([]) // Project IDs
  const favoriteProjects = ref<string[]>([]) // Project IDs

  const filters = ref<SearchFilters>({
    namePattern: '',
    states: [],
    dateRange: undefined
  })

  const pagination = ref<PaginationOptions>({
    pageSize: 50,
    pageToken: undefined,
    orderBy: 'name',
    filter: ''
  })

  // Cache for project details
  const projectCache = ref<Map<string, GCPProject>>(new Map())

  // Getters
  const activeProjects = computed(() =>
    projects.value.filter(p => p.state === 'ACTIVE')
  )

  const favoriteProjectsList = computed(() =>
    projects.value.filter(p => favoriteProjects.value.includes(p.projectId))
  )

  const recentProjectsList = computed(() => {
    const recentIds = recentProjects.value.slice(0, 10) // Last 10
    return recentIds
      .map(id => projects.value.find(p => p.projectId === id))
      .filter(Boolean) as GCPProject[]
  })

  const filteredProjects = computed(() => {
    let filtered = [...projects.value]

    // Apply name filter
    if (filters.value.namePattern) {
      const pattern = filters.value.namePattern.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(pattern) ||
        p.projectId.toLowerCase().includes(pattern) ||
        p.displayName?.toLowerCase().includes(pattern)
      )
    }

    // Apply state filter
    if (filters.value.states && filters.value.states.length > 0) {
      filtered = filtered.filter(p =>
        filters.value.states!.includes(p.state)
      )
    }

    // Apply date range filter
    if (filters.value.dateRange) {
      filtered = filtered.filter(p => {
        const createdAt = new Date(p.createdAt)
        return createdAt >= filters.value.dateRange!.start &&
          createdAt <= filters.value.dateRange!.end
      })
    }

    return filtered
  })

  const projectStats = computed(() => ({
    total: projects.value.length,
    active: activeProjects.value.length,
    inactive: projects.value.filter(p => p.state !== 'ACTIVE').length,
    favorites: favoriteProjects.value.length,
    recent: recentProjects.value.length
  }))

  const isLoading = computed(() => state.value.state === 'loading')
  const hasError = computed(() => state.value.state === 'error')

  // New simplified state for project names
  const projectList = ref<string[]>([])
  const selectedProjectId = ref<string | null>(null)

  // Actions
  async function fetchProjects() {
    try {
      state.value.state = 'loading'
      state.value.error = null

      // Call the real API
      const projectNames = await pubsubApi.projects.getProjects()
      projectList.value = projectNames

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return projectNames
    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message

      const appStore = useAppStore()
      appStore.showToast({
        type: 'error',
        title: 'Failed to fetch projects',
        message: (error as Error).message
      })

      throw error
    }
  }

  async function addProject(projectId: string) {
    try {
      await pubsubApi.projects.attachProject(projectId)

      if (!projectList.value.includes(projectId)) {
        projectList.value.push(projectId)
      }

      // Automatically select the newly added project
      selectProject(projectId)

      const appStore = useAppStore()
      appStore.showToast({
        type: 'success',
        title: 'Project added',
        message: `Project "${projectId}" has been attached successfully`
      })

      return projectId
    } catch (error) {
      const appStore = useAppStore()
      appStore.showToast({
        type: 'error',
        title: 'Failed to add project',
        message: (error as Error).message
      })

      throw error
    }
  }

  async function fetchProject(projectId: string): Promise<GCPProject | null> {
    try {
      // Check cache first
      if (projectCache.value.has(projectId)) {
        return projectCache.value.get(projectId)!
      }

      state.value.state = 'loading'
      state.value.error = null

      // TODO: Replace with actual API call
      const mockProject: GCPProject = {
        id: projectId,
        projectId,
        name: projectId,
        displayName: `Project ${projectId}`,
        state: 'ACTIVE',
        lifecycleState: 'ACTIVE',
        parent: 'organizations/123456789',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        labels: {}
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update cache
      projectCache.value.set(projectId, mockProject)

      // Add to projects list if not exists
      const existingIndex = projects.value.findIndex(p => p.projectId === projectId)
      if (existingIndex === -1) {
        projects.value.push(mockProject)
      } else {
        projects.value[existingIndex] = mockProject
      }

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return mockProject

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  function selectProject(projectIdOrProject: string | GCPProject) {
    const projectId = typeof projectIdOrProject === 'string' ? projectIdOrProject : projectIdOrProject.projectId

    selectedProjectId.value = projectId

    if (typeof projectIdOrProject === 'object') {
      selectedProject.value = projectIdOrProject
    }

    // Add to project list if not already there (URL-based project discovery)
    if (!projectList.value.includes(projectId)) {
      projectList.value.push(projectId)

      const appStore = useAppStore()
      appStore.showToast({
        type: 'success',
        title: 'Project discovered',
        message: `Project "${projectId}" has been added to your project list`
      })
    }

    // Add to recent projects
    const currentIndex = recentProjects.value.indexOf(projectId)

    if (currentIndex > -1) {
      // Move to front
      recentProjects.value.splice(currentIndex, 1)
    }

    recentProjects.value.unshift(projectId)

    // Keep only last 20
    if (recentProjects.value.length > 20) {
      recentProjects.value = recentProjects.value.slice(0, 20)
    }

    // Save to localStorage
    localStorage.setItem('emulator-ui-selected-project-id', projectId)
    localStorage.setItem('emulator-ui-recent-projects', JSON.stringify(recentProjects.value))
    localStorage.setItem('emulator-ui-project-list', JSON.stringify(projectList.value))
  }

  function clearSelectedProject() {
    selectedProject.value = null
    selectedProjectId.value = null
    localStorage.removeItem('emulator-ui-selected-project-id')
  }

  function addToFavorites(projectId: string) {
    if (!favoriteProjects.value.includes(projectId)) {
      favoriteProjects.value.push(projectId)
      localStorage.setItem('emulator-ui-favorite-projects', JSON.stringify(favoriteProjects.value))
    }
  }

  function removeFromFavorites(projectId: string) {
    const index = favoriteProjects.value.indexOf(projectId)
    if (index > -1) {
      favoriteProjects.value.splice(index, 1)
      localStorage.setItem('emulator-ui-favorite-projects', JSON.stringify(favoriteProjects.value))
    }
  }

  function toggleFavorite(projectId: string) {
    if (favoriteProjects.value.includes(projectId)) {
      removeFromFavorites(projectId)
    } else {
      addToFavorites(projectId)
    }
  }

  function updateFilters(newFilters: Partial<SearchFilters>) {
    Object.assign(filters.value, newFilters)
  }

  function clearFilters() {
    filters.value = {
      namePattern: '',
      states: [],
      dateRange: undefined
    }
  }

  function updatePagination(options: Partial<PaginationOptions>) {
    Object.assign(pagination.value, options)
  }

  function clearCache() {
    projectCache.value.clear()
  }

  function refreshProject(projectId: string) {
    // Remove from cache to force refresh
    projectCache.value.delete(projectId)
    return fetchProject(projectId)
  }

  function getProjectById(projectId: string): GCPProject | undefined {
    return projects.value.find(p => p.projectId === projectId) ||
      projectCache.value.get(projectId)
  }

  function isProjectFavorite(projectId: string): boolean {
    return favoriteProjects.value.includes(projectId)
  }

  function isProjectRecent(projectId: string): boolean {
    return recentProjects.value.includes(projectId)
  }

  function deleteProject(projectId: string) {
    // Remove from project list
    projectList.value = projectList.value.filter(id => id !== projectId)
    
    // Remove from projects array
    projects.value = projects.value.filter(p => p.projectId !== projectId)
    
    // Remove from cache
    projectCache.value.delete(projectId)
    
    // Remove from recent projects
    recentProjects.value = recentProjects.value.filter(id => id !== projectId)
    
    // Remove from favorites
    favoriteProjects.value = favoriteProjects.value.filter(id => id !== projectId)
    
    // Clear selection if this was the selected project
    if (selectedProjectId.value === projectId) {
      clearSelectedProject()
    }
    
    // Update localStorage
    try {
      localStorage.setItem('emulator-ui-project-list', JSON.stringify(projectList.value))
    } catch (error) {
      console.warn('Failed to save project list to localStorage:', error)
    }
  }

  // Initialize store
  function initialize() {
    // Load selected project ID from localStorage
    try {
      const saved = localStorage.getItem('emulator-ui-selected-project-id')
      if (saved) {
        selectedProjectId.value = saved
      }
    } catch (error) {
      console.warn('Failed to load selected project ID from localStorage:', error)
    }

    // Load project list from localStorage
    try {
      const saved = localStorage.getItem('emulator-ui-project-list')
      if (saved) {
        projectList.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load project list from localStorage:', error)
    }

    // Load recent projects
    try {
      const saved = localStorage.getItem('emulator-ui-recent-projects')
      if (saved) {
        recentProjects.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load recent projects from localStorage:', error)
    }

    // Load favorite projects
    try {
      const saved = localStorage.getItem('emulator-ui-favorite-projects')
      if (saved) {
        favoriteProjects.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load favorite projects from localStorage:', error)
    }
  }

  function reset() {
    projects.value = []
    selectedProject.value = null
    recentProjects.value = []
    favoriteProjects.value = []
    filters.value = {
      namePattern: '',
      states: [],
      dateRange: undefined
    }
    pagination.value = {
      pageSize: 50,
      pageToken: undefined,
      orderBy: 'name',
      filter: ''
    }
    projectCache.value.clear()
    state.value = {
      state: 'idle',
      error: null,
      lastUpdated: null
    }
  }

  return {
    // State
    state,
    projects,
    selectedProject,
    recentProjects,
    favoriteProjects,
    filters,
    pagination,

    // New simplified state
    projectList,
    selectedProjectId,

    // Getters
    activeProjects,
    favoriteProjectsList,
    recentProjectsList,
    filteredProjects,
    projectStats,
    isLoading,
    hasError,

    // Actions
    fetchProjects,
    fetchProject,
    selectProject,
    addProject,
    clearSelectedProject,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    updateFilters,
    clearFilters,
    updatePagination,
    clearCache,
    refreshProject,
    getProjectById,
    isProjectFavorite,
    isProjectRecent,
    deleteProject,
    initialize,
    reset
  }
}, {
  persist: {
    key: 'emulator-ui-projects',
    storage: localStorage,
    beforeRestore: () => {
      // Projects store restoring
    },
    afterRestore: (context) => {
      context.store.initialize()
    }
  }
})