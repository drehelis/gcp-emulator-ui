import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMessageTemplatesStore } from '../messageTemplates'
import { useProjectsStore } from '../projects'
import { templateStorage } from '@/utils/templateStorage'

// Mock dependencies
vi.mock('@/utils/templateStorage', () => ({
  templateStorage: {
    getTemplates: vi.fn(),
    saveTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    clearTemplates: vi.fn()
  }
}))

vi.mock('../projects', () => ({
  useProjectsStore: vi.fn()
}))

describe('useMessageTemplatesStore', () => {
  const mockProjectsStore = {
    selectedProject: { projectId: 'test-project' }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(useProjectsStore).mockReturnValue(mockProjectsStore as any)
    vi.clearAllMocks()
  })

  describe('loadTemplates', () => {
    it('loads templates from storage', async () => {
      const mockTemplates = [
        { id: '1', name: 't1', projectId: 'test-project', topicName: 'topic1', data: 'data', variables: {}, attributes: {} }
      ]
      vi.mocked(templateStorage.getTemplates).mockResolvedValue(mockTemplates as any)

      const store = useMessageTemplatesStore()
      await store.loadTemplates()

      expect(store.templates).toEqual(mockTemplates)
      expect(store.state.state).toBe('success')
    })
    
    it('computes current project templates', async () => {
        const mockTemplates = [
            { id: '1', name: 't1', projectId: 'test-project', topicName: 'topic1', data: '', variables: {}, attributes: {} },
            { id: '2', name: 't2', projectId: 'other-project', topicName: 'topic1', data: '', variables: {}, attributes: {} }
        ]
        vi.mocked(templateStorage.getTemplates).mockResolvedValue(mockTemplates as any)
        
        const store = useMessageTemplatesStore()
        await store.loadTemplates()
        
        expect(store.currentProjectTemplates).toHaveLength(1)
        expect(store.currentProjectTemplates[0].id).toBe('1')
    })
  })

  describe('saveTemplate', () => {
    it('saves template and adds to state', async () => {
      const newTemplate = { id: '2', name: 't2', projectId: 'test-project' }
      vi.mocked(templateStorage.saveTemplate).mockResolvedValue(newTemplate as any)

      const store = useMessageTemplatesStore()
      await store.saveTemplate({ name: 't2' } as any)

      expect(store.templates).toContainEqual(newTemplate)
      expect(templateStorage.saveTemplate).toHaveBeenCalled()
    })
  })

  describe('updateTemplate', () => {
    it('updates template in state and storage', async () => {
      const initial = { id: '1', name: 'old', projectId: 'test-project' }
      const updated = { ...initial, name: 'new' }
      
      vi.mocked(templateStorage.getTemplates).mockResolvedValue([initial] as any)
      vi.mocked(templateStorage.updateTemplate).mockResolvedValue(updated as any)
      
      const store = useMessageTemplatesStore()
      await store.loadTemplates()
      
      store.selectTemplate(initial as any)
      
      await store.updateTemplate('1', { name: 'new' })
      
      expect(store.getTemplate('1')?.name).toBe('new')
      expect(store.selectedTemplate?.name).toBe('new') // also updates selection
    })
  })
  
  describe('deleteTemplate', () => {
      it('deletes template', async () => {
          const t1 = { id: '1', projectId: 'test-project' }
          vi.mocked(templateStorage.getTemplates).mockResolvedValue([t1] as any)
          
          const store = useMessageTemplatesStore()
          await store.loadTemplates()
          
          await store.deleteTemplate('1')
          
          expect(store.templates).toHaveLength(0)
          expect(templateStorage.deleteTemplate).toHaveBeenCalledWith('1')
      })
  })
  
  describe('duplicateTemplate', () => {
      it('duplicates template with new name', async () => {
          const original = { id: '1', name: 'orig', projectId: 'test-project', data: 'd', variables: {}, attributes: {} }
          const duplicate = { id: '2', name: 'orig (Copy)', projectId: 'test-project', data: 'd', variables: {}, attributes: {} }
          
          vi.mocked(templateStorage.getTemplates).mockResolvedValue([original] as any)
          vi.mocked(templateStorage.saveTemplate).mockResolvedValue(duplicate as any)
          
          const store = useMessageTemplatesStore()
          await store.loadTemplates()
          
          await store.duplicateTemplate('1')
          
          expect(templateStorage.saveTemplate).toHaveBeenCalledWith(expect.objectContaining({
              name: 'orig (Copy)',
              data: 'd'
          }))
      })
  })
  
  describe('searchTemplates', () => {
      it('filters templates by query', async () => {
           const templates = [
            { id: '1', name: 'alpha', projectId: 'test-project', topicName: 't1', tags: [] },
            { id: '2', name: 'beta', projectId: 'test-project', topicName: 't1', tags: ['match'] },
            { id: '3', name: 'gamma', projectId: 'test-project', topicName: 't1', tags: [] }
        ]
        vi.mocked(templateStorage.getTemplates).mockResolvedValue(templates as any)
        
        const store = useMessageTemplatesStore()
        await store.loadTemplates()
        
        const results = store.searchTemplates('match')
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe('2')
        // beta has tags ['match']. 'match' includes 'match'. Should find it.
        // alpha has name 'alpha'.
        
        // Let's test exact name match first
        const resultsAlpha = store.searchTemplates('alpha')
        expect(resultsAlpha).toHaveLength(1)
        expect(resultsAlpha[0].id).toBe('1')
        
        // Test tag match
        const resultsTag = store.searchTemplates('match')
        expect(resultsTag).toHaveLength(1)
        expect(resultsTag[0].id).toBe('2')
      })
  })
  describe('importTemplates', () => {
    it('imports templates and handles name conflicts', async () => {
      const existing = { id: '1', name: 't1', projectId: 'test-project', topicName: 'top', data: 'd', variables: {}, attributes: {} }
      const toImport = { id: 'new', name: 't1', projectId: 'test-project', topicName: 'top', data: 'd2', variables: {}, attributes: {} }
      
      vi.mocked(templateStorage.getTemplates).mockResolvedValue([existing] as any)
      
      const store = useMessageTemplatesStore()
      await store.loadTemplates()
      
      const count = await store.importTemplates([toImport] as any)
      
      expect(count).toBe(1)
      expect(store.templates).toHaveLength(2)
      const imported = store.templates.find(t => t.id !== '1')
      expect(imported?.name).toBe('t1 (Imported)')
    })

    it('handles import errors gracefully', async () => {
         const store = useMessageTemplatesStore()
         const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
         
         // Create an object that throws when accessed to simulate runtime error during processing
         const badTemplate = { name: 'bad-template' }
         Object.defineProperty(badTemplate, 'projectId', {
             get() { throw new Error('Processing fail') },
             enumerable: true
         })
         
         const count = await store.importTemplates([badTemplate as any])
         
         expect(count).toBe(0)
         expect(store.state.state).toBe('success') // Overall op succeeds even if items fail
         expect(consoleSpy).toHaveBeenCalled()
         expect(consoleSpy.mock.calls[0][0]).toContain('Import errors:')
         
         consoleSpy.mockRestore()
    })
  })
  
  describe('getters', () => {
      it('templatesByTopic groups correctly', () => {
          const store = useMessageTemplatesStore()
          store.templates = [
              { projectId: 'test-project', topicName: 't1', id: '1' },
              { projectId: 'test-project', topicName: 't1', id: '2' },
              { projectId: 'test-project', topicName: 't2', id: '3' }
          ] as any
          
          const grouped = store.templatesByTopic
          expect(Object.keys(grouped)).toHaveLength(2)
          expect(grouped['t1']).toHaveLength(2)
          expect(grouped['t2']).toHaveLength(1)
      })

      it('templateStats computes correct stats', () => {
          const store = useMessageTemplatesStore()
          store.templates = [
              { projectId: 'test-project', topicName: 't1', variables: { v: '1' }, attributes: {} },
              { projectId: 'test-project', topicName: 't2', variables: {}, attributes: { a: '1' } }
          ] as any
          
          const stats = store.templateStats
          expect(stats.total).toBe(2)
          expect(stats.byTopic).toBe(2)
          expect(stats.withVariables).toBe(1)
          expect(stats.withAttributes).toBe(1)
      })
  })

  describe('error handling', () => {
      it('sets error state on load failure', async () => {
          vi.mocked(templateStorage.getTemplates).mockRejectedValue(new Error('Load failed'))
          
          const store = useMessageTemplatesStore()
          await expect(store.loadTemplates()).rejects.toThrow('Load failed')
          
          expect(store.state.state).toBe('error')
          expect(store.state.error).toBe('Load failed')
      })
  })
  
  describe('clearProjectTemplates', () => {
      it('removes templates for project', async () => {
          const t1 = { id: '1', projectId: 'p1', topicName: 't', name: 'n1', data: '', variables: {}, attributes: {} }
          const t2 = { id: '2', projectId: 'p2', topicName: 't', name: 'n2', data: '', variables: {}, attributes: {} }
          vi.mocked(templateStorage.getTemplates).mockResolvedValue([t1, t2] as any)
          
          const store = useMessageTemplatesStore()
          await store.loadTemplates()
          
          store.selectTemplate(t1 as any)
          
          await store.clearProjectTemplates('p1')
          
          expect(store.templates).toHaveLength(1)
          expect(store.templates[0].id).toBe('2')
          expect(store.selectedTemplate).toBeNull()
          expect(templateStorage.clearTemplates).toHaveBeenCalledWith('p1')
      })
  })
  
  describe('reset', () => {
      it('resets state', async () => {
          const t1 = { id: '1', projectId: 'p1', topicName: 't', name: 'n1', data: '', variables: {}, attributes: {} }
          vi.mocked(templateStorage.getTemplates).mockResolvedValue([t1] as any)
          
          const store = useMessageTemplatesStore()
          await store.loadTemplates()
          
          store.reset()
          
          expect(store.templates).toHaveLength(0)
          expect(store.state.state).toBe('idle')
      })
  })
  describe('exportTemplates', () => {
    it('returns templates for project', () => {
      const store = useMessageTemplatesStore()
      store.templates = [
          { id: '1', projectId: 'p1', name: 'n1', topicName: 't', data: '', variables: {}, attributes: {} },
          { id: '2', projectId: 'p2', name: 'n2', topicName: 't', data: '', variables: {}, attributes: {} }
      ] as any
      
      const exported = store.exportTemplates('p1')
      expect(exported).toHaveLength(1)
      expect(exported[0].id).toBe('1')
    })
  })

  describe('duplicateTemplate errors', () => {
    it('throws if template not found', async () => {
       const store = useMessageTemplatesStore()
       await expect(store.duplicateTemplate('missing')).rejects.toThrow('Template not found')
    })
  })
})
