/**
 * Message Templates store
 * Manages message templates for reuse across different topics
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BaseStoreState } from '@/types'
import { useProjectsStore } from './projects'
import { templateStorage, type MessageTemplate, type CreateTemplateForm } from '@/utils/templateStorage'

// Re-export types for convenience
export type { MessageTemplate, CreateTemplateForm }

export const useMessageTemplatesStore = defineStore('messageTemplates', () => {
  const projectsStore = useProjectsStore()

  // State
  const state = ref<BaseStoreState>({
    state: 'idle',
    error: null,
    lastUpdated: null
  })

  const templates = ref<MessageTemplate[]>([])
  const selectedTemplate = ref<MessageTemplate | null>(null)

  // Getters
  const currentProjectTemplates = computed(() => {
    if (!projectsStore.selectedProject) return []
    return templates.value.filter(template => 
      template.projectId === projectsStore.selectedProject!.projectId
    )
  })

  const templatesByTopic = computed(() => {
    const grouped: Record<string, MessageTemplate[]> = {}
    currentProjectTemplates.value.forEach(template => {
      if (!grouped[template.topicName]) {
        grouped[template.topicName] = []
      }
      grouped[template.topicName].push(template)
    })
    return grouped
  })

  const templateStats = computed(() => ({
    total: currentProjectTemplates.value.length,
    byTopic: Object.keys(templatesByTopic.value).length,
    withVariables: currentProjectTemplates.value.filter(t => 
      Object.keys(t.variables).length > 0
    ).length,
    withAttributes: currentProjectTemplates.value.filter(t => 
      Object.keys(t.attributes).length > 0
    ).length,
  }))

  const isLoading = computed(() => state.value.state === 'loading')
  const hasError = computed(() => state.value.state === 'error')

  // Actions
  async function loadTemplates(): Promise<void> {
    try {
      state.value.state = 'loading'
      state.value.error = null

      // Load from IndexedDB
      const loadedTemplates = await templateStorage.getTemplates()
      templates.value = loadedTemplates

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function saveTemplate(templateData: CreateTemplateForm): Promise<MessageTemplate> {
    try {
      state.value.state = 'loading'
      state.value.error = null

      // Save to IndexedDB
      const newTemplate = await templateStorage.saveTemplate(templateData)

      // Add to local state
      templates.value.push(newTemplate)

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return newTemplate

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function updateTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
    try {
      state.value.state = 'loading'
      state.value.error = null

      // Update in IndexedDB
      const updatedTemplate = await templateStorage.updateTemplate(templateId, updates)

      // Update local state
      const templateIndex = templates.value.findIndex(t => t.id === templateId)
      if (templateIndex !== -1) {
        templates.value[templateIndex] = updatedTemplate
      }

      // Update selected template if it's the one being updated
      if (selectedTemplate.value?.id === templateId) {
        selectedTemplate.value = updatedTemplate
      }

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      return updatedTemplate

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function deleteTemplate(templateId: string): Promise<void> {
    try {
      state.value.state = 'loading'
      state.value.error = null

      // Delete from IndexedDB
      await templateStorage.deleteTemplate(templateId)

      // Remove from local state
      const templateIndex = templates.value.findIndex(t => t.id === templateId)
      if (templateIndex !== -1) {
        templates.value.splice(templateIndex, 1)
      }

      // Clear selection if deleted template was selected
      if (selectedTemplate.value?.id === templateId) {
        selectedTemplate.value = null
      }

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  async function duplicateTemplate(templateId: string, newName?: string): Promise<MessageTemplate> {
    try {
      const originalTemplate = templates.value.find(t => t.id === templateId)
      if (!originalTemplate) {
        throw new Error('Template not found')
      }

      const duplicateName = newName || `${originalTemplate.name} (Copy)`
      
      const duplicateData: CreateTemplateForm = {
        name: duplicateName,
        description: originalTemplate.description,
        projectId: originalTemplate.projectId,
        topicName: originalTemplate.topicName,
        data: originalTemplate.data,
        attributes: { ...originalTemplate.attributes },
        variables: { ...originalTemplate.variables },
        tags: originalTemplate.tags ? [...originalTemplate.tags] : undefined
      }

      return await saveTemplate(duplicateData)

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  function selectTemplate(template: MessageTemplate) {
    selectedTemplate.value = template
  }

  function clearSelectedTemplate() {
    selectedTemplate.value = null
  }

  function getTemplate(templateId: string): MessageTemplate | undefined {
    return templates.value.find(t => t.id === templateId)
  }

  function getTemplatesByTopic(topicName: string, projectId?: string): MessageTemplate[] {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) return []

    return templates.value.filter(template => 
      template.topicName === topicName && 
      template.projectId === targetProjectId
    )
  }

  function searchTemplates(query: string, projectId?: string): MessageTemplate[] {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) return []

    const lowerQuery = query.toLowerCase()
    return templates.value.filter(template => {
      if (template.projectId !== targetProjectId) return false
      
      return template.name.toLowerCase().includes(lowerQuery) ||
             template.description?.toLowerCase().includes(lowerQuery) ||
             template.topicName.toLowerCase().includes(lowerQuery) ||
             template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    })
  }

  async function importTemplates(templatesData: MessageTemplate[]): Promise<number> {
    try {
      state.value.state = 'loading'
      state.value.error = null

      let importedCount = 0
      const errors: string[] = []

      for (const templateData of templatesData) {
        try {
          // Generate new ID to avoid conflicts
          const importedTemplate: MessageTemplate = {
            ...templateData,
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          // Check for name conflicts
          const existingTemplate = templates.value.find(t => 
            t.name === importedTemplate.name && 
            t.projectId === importedTemplate.projectId
          )

          if (existingTemplate) {
            // Add suffix to avoid conflict
            importedTemplate.name = `${importedTemplate.name} (Imported)`
          }

          templates.value.push(importedTemplate)
          importedCount++

        } catch (error) {
          errors.push(`Failed to import template "${templateData.name}": ${(error as Error).message}`)
        }
      }

      if (importedCount > 0) {
        // Templates are automatically persisted via Pinia persistence
      }

      state.value.state = 'success'
      state.value.lastUpdated = new Date()

      if (errors.length > 0) {
        console.warn('Import errors:', errors)
      }

      return importedCount

    } catch (error) {
      state.value.state = 'error'
      state.value.error = (error as Error).message
      throw error
    }
  }

  function exportTemplates(projectId?: string): MessageTemplate[] {
    const targetProjectId = projectId || projectsStore.selectedProject?.projectId
    if (!targetProjectId) return []

    return templates.value.filter(template => template.projectId === targetProjectId)
  }

  async function clearProjectTemplates(projectId: string) {
    // Clear from IndexedDB
    await templateStorage.clearTemplates(projectId)
    
    // Clear from local state
    templates.value = templates.value.filter(template => template.projectId !== projectId)
    
    if (selectedTemplate.value?.projectId === projectId) {
      selectedTemplate.value = null
    }
  }

  function reset() {
    templates.value = []
    selectedTemplate.value = null
    state.value = {
      state: 'idle',
      error: null,
      lastUpdated: null
    }
  }


  return {
    // State
    state,
    templates,
    selectedTemplate,

    // Getters
    currentProjectTemplates,
    templatesByTopic,
    templateStats,
    isLoading,
    hasError,

    // Actions
    loadTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    selectTemplate,
    clearSelectedTemplate,
    getTemplate,
    getTemplatesByTopic,
    searchTemplates,
    importTemplates,
    exportTemplates,
    clearProjectTemplates,
    reset
  }
})