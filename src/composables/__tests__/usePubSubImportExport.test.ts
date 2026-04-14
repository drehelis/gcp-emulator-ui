import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePubSubImportExport } from '../usePubSubImportExport'
import { createPinia, setActivePinia } from 'pinia'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import { useAppStore } from '@/stores/app'
import { useMessageTemplatesStore } from '@/stores/messageTemplates'
import { downloadFile } from '@/utils/importExportUtils'

// Mock dependencies
const mockAppStore = vi.hoisted(() => ({
  showToast: vi.fn(),
}))

const mockTemplatesStore = vi.hoisted(() => ({
  loadTemplates: vi.fn(),
  exportTemplates: vi.fn(),
  saveTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  templates: [] as any[],
}))

vi.mock('@/api/pubsub', () => ({
  topicsApi: {
    getTopics: vi.fn(),
    createTopic: vi.fn(),
  },
  subscriptionsApi: {
    getSubscriptions: vi.fn(),
    createSubscription: vi.fn(),
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => mockAppStore),
}))

vi.mock('@/stores/messageTemplates', () => ({
  useMessageTemplatesStore: vi.fn(() => mockTemplatesStore),
}))

vi.mock('@/utils/importExportUtils', () => ({
  downloadFile: vi.fn(),
  extractTopicName: vi.fn(name => name.split('/').pop() || ''),
  extractSubscriptionName: vi.fn(name => name.split('/').pop() || ''),
}))

describe('usePubSubImportExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.resetAllMocks()
    mockTemplatesStore.templates = []
  })

  it('should initialize with default values', () => {
    const { topics, subscriptions, messageTemplates, isExporting, isImporting } =
      usePubSubImportExport()

    expect(topics.value).toEqual([])
    expect(subscriptions.value).toEqual([])
    expect(messageTemplates.value).toEqual([])
    expect(isExporting.value).toEqual({ pubsub: false, templates: false })
    expect(isImporting.value).toEqual({ pubsub: false, templates: false })
  })

  describe('loadData', () => {
    it('should load topics, subscriptions and templates', async () => {
      const mockTopics = [{ name: 'projects/p1/topics/t1' }]
      const mockSubs = [{ name: 'projects/p1/subscriptions/s1', topic: 'projects/p1/topics/t1' }]
      const mockTemplates = [{ name: 'temp1' }]

      ;(topicsApi.getTopics as any).mockResolvedValue(mockTopics)
      ;(subscriptionsApi.getSubscriptions as any).mockResolvedValue(mockSubs)
      const templatesStore = useMessageTemplatesStore()
      ;(templatesStore.exportTemplates as any).mockReturnValue(mockTemplates)

      const { loadData, topics, subscriptions, messageTemplates } = usePubSubImportExport()

      await loadData('p1')

      expect(topicsApi.getTopics).toHaveBeenCalledWith('p1')
      expect(subscriptionsApi.getSubscriptions).toHaveBeenCalledWith('p1')
      expect(templatesStore.loadTemplates).toHaveBeenCalled()

      expect(topics.value).toHaveLength(1)
      expect(topics.value[0].name).toBe('projects/p1/topics/t1')
      expect(subscriptions.value).toHaveLength(1)
      expect(subscriptions.value[0].name).toBe('projects/p1/subscriptions/s1')
      expect(messageTemplates.value).toEqual(mockTemplates)
    })

    it('should handle errors during load', async () => {
      const error = new Error('Load failed')
      ;(topicsApi.getTopics as any).mockRejectedValue(error)

      const { loadData } = usePubSubImportExport()

      await expect(loadData('p1')).rejects.toThrow('Load failed')
    })
  })

  describe('exportConfiguration', () => {
    it('should export configuration to a JSON file', async () => {
      const mockTopics = [{ name: 'projects/p1/topics/t1' }]
      const mockSubs = [
        {
          name: 'projects/p1/subscriptions/s1',
          topicName: 'projects/p1/topics/t1',
          enableMessageOrdering: true,
        },
      ]

      ;(topicsApi.getTopics as any).mockResolvedValue(mockTopics)
      ;(subscriptionsApi.getSubscriptions as any).mockResolvedValue(mockSubs)

      const { loadData, exportConfiguration } = usePubSubImportExport()
      await loadData('p1')

      await exportConfiguration('p1')

      expect(downloadFile).toHaveBeenCalled()
      const content = JSON.parse((downloadFile as any).mock.calls[0][0])
      expect(content).toHaveLength(1)
      expect(content[0]).toMatchObject({
        topic_name: 't1',
        sub_name: 's1',
        enable_message_ordering: true,
      })

      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })

    it('should handle export errors', async () => {
      ;(downloadFile as any).mockImplementationOnce(() => {
        throw new Error('Disk full')
      })

      const { exportConfiguration } = usePubSubImportExport()
      await exportConfiguration('p1')

      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Disk full' })
      )
    })
  })

  describe('exportTemplates', () => {
    it('should export message templates', async () => {
      const mockTemplates = [{ name: 'temp1' }]
      const templatesStore = useMessageTemplatesStore()
      ;(templatesStore.exportTemplates as any).mockReturnValue(mockTemplates)

      const { exportTemplates } = usePubSubImportExport()
      await exportTemplates('p1')

      expect(downloadFile).toHaveBeenCalled()
      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })

    it('should notify if no templates to export', async () => {
      const templatesStore = useMessageTemplatesStore()
      ;(templatesStore.exportTemplates as any).mockReturnValue([])

      const { exportTemplates } = usePubSubImportExport()
      await exportTemplates('p1')

      expect(downloadFile).not.toHaveBeenCalled()
      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }))
    })
  })

  describe('importConfiguration', () => {
    it('should import topics and subscriptions', async () => {
      const importData = [
        {
          topic_name: 't1',
          sub_name: 's1',
          ack_deadline_seconds: 30,
        },
      ]
      const options = { createTopics: true, createSubscriptions: true, overwriteExisting: true }

      const { importConfiguration } = usePubSubImportExport()
      await importConfiguration('p1', importData, options)

      expect(topicsApi.createTopic).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 't1' })
      )
      expect(subscriptionsApi.createSubscription).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 's1', topic: 't1', ackDeadlineSeconds: 30 })
      )

      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })

    it('should handle partial failures during import', async () => {
      const importData = [
        { topic_name: 't1', sub_name: 's1' },
        { topic_name: 't2', sub_name: 's2' },
      ]
      const options = { createTopics: true, createSubscriptions: false }

      ;(topicsApi.createTopic as any)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Fail'))

      const { importConfiguration } = usePubSubImportExport()
      await importConfiguration('p1', importData, options)

      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('1 successful, 1 failed'),
        })
      )
    })
  })

  describe('importTemplates', () => {
    it('should import message templates', async () => {
      const importData = [{ name: 'temp1', topicName: 't1', data: '{}' }]
      const options = { overwriteTemplates: true }

      // Mock existing template
      mockTemplatesStore.templates = [{ id: '1', name: 'temp1', projectId: 'p1' } as any]

      const { importTemplates } = usePubSubImportExport()
      await importTemplates('p1', importData, options)

      expect(mockTemplatesStore.updateTemplate).toHaveBeenCalled()
      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })

    it('should skip conflicting templates when overwrite is false', async () => {
      const importData = [{ name: 'temp1', topicName: 't1', data: '{}' }]
      const options = { overwriteTemplates: false, renameTemplates: false }

      mockTemplatesStore.templates = [{ id: '1', name: 'temp1', projectId: 'p1' } as any]

      const { importTemplates } = usePubSubImportExport()
      await importTemplates('p1', importData, options)

      expect(mockTemplatesStore.saveTemplate).not.toHaveBeenCalled()
      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info', title: 'Templates already exist' })
      )
    })

    it('should rename conflicting templates when renameTemplates is true', async () => {
      const importData = [{ name: 'temp1', topicName: 't1', data: '{}' }]
      const options = { overwriteTemplates: false, renameTemplates: true }

      mockTemplatesStore.templates = [{ id: '1', name: 'temp1', projectId: 'p1' } as any]

      const { importTemplates } = usePubSubImportExport()
      await importTemplates('p1', importData, options)

      expect(mockTemplatesStore.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'temp1 (1)' })
      )
    })

    it('should handle partial template failures', async () => {
      const importData = [
        { name: 'success', topicName: 't1', data: '{}' },
        { name: 'fail', topicName: 't1', data: '{}' },
      ]
      const options = { overwriteTemplates: true }

      mockTemplatesStore.saveTemplate
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Fail'))

      const { importTemplates } = usePubSubImportExport()
      await importTemplates('p1', importData, options)

      const appStore = useAppStore()
      expect(appStore.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('1 imported, 0 skipped, 1 failed'),
        })
      )
    })
  })
})
