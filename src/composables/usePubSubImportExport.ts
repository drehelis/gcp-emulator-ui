import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useMessageTemplatesStore } from '@/stores/messageTemplates'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import type { PubSubTopic, PubSubSubscription, CreateTopicRequest, CreateSubscriptionRequest } from '@/types'
import type { MessageTemplate } from '@/utils/templateStorage'
import { downloadFile, extractTopicName, extractSubscriptionName } from '@/utils/importExportUtils'

interface TopicSubscriptionConfig {
  topic_name: string
  sub_name: string
  enable_message_ordering?: boolean
  ack_deadline_seconds?: number
  message_retention_duration?: string
  enable_exactly_once_delivery?: boolean
  push_endpoint?: string
  dead_letter_topic?: string
  max_delivery_attempts?: number
  retry_minimum_backoff?: string
  retry_maximum_backoff?: string
  labels?: Record<string, string>
}

export function usePubSubImportExport() {
  const appStore = useAppStore()
  const templatesStore = useMessageTemplatesStore()

  const topics = ref<PubSubTopic[]>([])
  const subscriptions = ref<PubSubSubscription[]>([])
  const messageTemplates = ref<MessageTemplate[]>([])

  const isExporting = ref({
    pubsub: false,
    templates: false
  })

  const isImporting = ref({
    pubsub: false,
    templates: false
  })

  // Load data
  const loadData = async (projectId: string) => {
    try {
      // Load topics
      const topicsResponse = await topicsApi.getTopics(projectId)
      topics.value = Array.isArray(topicsResponse) ? topicsResponse.map(topic => ({
        ...topic,
        id: topic.id || `${projectId}-${topic.name || 'unknown'}-${Date.now()}`,
        name: topic.name || 'unknown',
        fullName: topic.name || `projects/${projectId}/topics/unknown`,
        projectId,
        createdAt: new Date(topic.createdAt || Date.now()),
        updatedAt: new Date(topic.updatedAt || Date.now()),
        labels: topic.labels || {},
        state: 'ACTIVE',
        messageCount: topic.messageCount || 0,
        subscriptionsCount: topic.subscriptionsCount || 0
      })) : []

      // Load subscriptions
      const subscriptionsResponse = await subscriptionsApi.getSubscriptions(projectId)
      subscriptions.value = Array.isArray(subscriptionsResponse) ? subscriptionsResponse.map(sub => ({
        ...sub,
        id: sub.id || `${projectId}-${sub.name || 'unknown'}-${Date.now()}`,
        name: sub.name || 'unknown',
        fullName: sub.name || `projects/${projectId}/subscriptions/unknown`,
        projectId,
        topicName: (sub as any).topic || sub.topicName || 'unknown',
        createdAt: new Date(sub.createdAt || Date.now()),
        updatedAt: new Date(sub.updatedAt || Date.now()),
        labels: sub.labels || {},
        ackDeadlineSeconds: sub.ackDeadlineSeconds || 60,
        retainAckedMessages: sub.retainAckedMessages || false,
        messageRetentionDuration: sub.messageRetentionDuration || '604800s',
        enableMessageOrdering: sub.enableMessageOrdering || false,
        enableExactlyOnceDelivery: sub.enableExactlyOnceDelivery || false,
        detached: sub.detached || false,
        messageCount: sub.messageCount || 0,
        undeliveredMessageCount: sub.undeliveredMessageCount || 0
      })) : []

      // Load message templates
      await templatesStore.loadTemplates()
      messageTemplates.value = templatesStore.exportTemplates(projectId)
    } catch (error) {
      console.error('Failed to load PubSub data:', error)
      throw error
    }
  }

  // Export configuration
  const exportConfiguration = async (projectId: string) => {
    isExporting.value.pubsub = true
    try {
      const exportData: TopicSubscriptionConfig[] = []

      // Group subscriptions by topic
      const subscriptionsByTopic = subscriptions.value.reduce((acc, sub) => {
        const topicName = extractTopicName(sub.topicName)
        if (!acc[topicName]) {
          acc[topicName] = []
        }
        acc[topicName].push(sub)
        return acc
      }, {} as Record<string, PubSubSubscription[]>)

      // Process topics and their subscriptions
      for (const topic of topics.value) {
        const topicName = extractTopicName(topic.name)
        const topicSubs = subscriptionsByTopic[topicName] || []

        if (topicSubs.length > 0) {
          // Export topic with each subscription
          for (const sub of topicSubs) {
            const config: TopicSubscriptionConfig = {
              topic_name: topicName,
              sub_name: extractSubscriptionName(sub.name),
            }

            // Add subscription-specific properties
            if (sub.enableMessageOrdering) {
              config.enable_message_ordering = true
            }
            if (sub.ackDeadlineSeconds !== 60) {
              config.ack_deadline_seconds = sub.ackDeadlineSeconds
            }
            if (sub.messageRetentionDuration !== '604800s') {
              config.message_retention_duration = sub.messageRetentionDuration
            }
            if (sub.enableExactlyOnceDelivery) {
              config.enable_exactly_once_delivery = true
            }
            if (sub.pushConfig?.pushEndpoint) {
              config.push_endpoint = sub.pushConfig.pushEndpoint
            }
            if (sub.deadLetterPolicy?.deadLetterTopic) {
              config.dead_letter_topic = extractTopicName(sub.deadLetterPolicy.deadLetterTopic)
              if (sub.deadLetterPolicy.maxDeliveryAttempts !== undefined) {
                config.max_delivery_attempts = sub.deadLetterPolicy.maxDeliveryAttempts
              }
            }
            if (sub.retryPolicy?.minimumBackoff) {
              config.retry_minimum_backoff = sub.retryPolicy.minimumBackoff
            }
            if (sub.retryPolicy?.maximumBackoff) {
              config.retry_maximum_backoff = sub.retryPolicy.maximumBackoff
            }
            if (sub.labels && Object.keys(sub.labels).length > 0) {
              config.labels = sub.labels
            }

            exportData.push(config)
          }
        } else {
          // Export topic without subscriptions
          exportData.push({
            topic_name: topicName,
            sub_name: `${topicName}-sub`
          })
        }
      }

      // Download the file
      downloadFile(
        JSON.stringify(exportData, null, 2),
        `pubsub-config-${projectId}-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      )

      appStore.showToast({
        type: 'success',
        title: 'Configuration exported',
        message: `Exported ${exportData.length} configuration${exportData.length === 1 ? '' : 's'}`
      })
    } catch (error) {
      console.error('Export failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Export failed',
        message: (error as Error).message
      })
    } finally {
      isExporting.value.pubsub = false
    }
  }

  // Export templates
  const exportTemplates = async (projectId: string) => {
    isExporting.value.templates = true
    try {
      // Load latest templates
      await templatesStore.loadTemplates()
      const exportData = templatesStore.exportTemplates(projectId)

      if (exportData.length === 0) {
        appStore.showToast({
          type: 'info',
          title: 'No templates to export',
          message: 'No message templates found for this project'
        })
        return
      }

      // Download the file
      downloadFile(
        JSON.stringify(exportData, null, 2),
        `message-templates-${projectId}-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      )

      appStore.showToast({
        type: 'success',
        title: 'Templates exported',
        message: `Exported ${exportData.length} template${exportData.length === 1 ? '' : 's'}`
      })
    } catch (error) {
      console.error('Templates export failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Export failed',
        message: (error as Error).message
      })
    } finally {
      isExporting.value.templates = false
    }
  }

  // Import configuration
  const importConfiguration = async (projectId: string, importData: any[], options: any) => {
    isImporting.value.pubsub = true
    try {
      let successCount = 0
      let errorCount = 0

      const topicsToCreate = new Set<string>()
      const subscriptionsToCreate: Array<{
        config: any
        topicName: string
        subscriptionName: string
      }> = []

      // Collect unique topics and subscriptions to create
      for (const config of importData) {
        if (options.createTopics) {
          topicsToCreate.add(config.topic_name)
        }
        if (options.createSubscriptions) {
          subscriptionsToCreate.push({
            config,
            topicName: config.topic_name,
            subscriptionName: config.sub_name
          })
        }
      }

      // Create topics first
      if (options.createTopics) {
        for (const topicName of topicsToCreate) {
          try {
            const existingTopic = topics.value.find(t => extractTopicName(t.name) === topicName)

            if (existingTopic && !options.overwriteExisting) {
              successCount++
              continue
            }

            const topicRequest: CreateTopicRequest = {
              name: topicName,
              labels: {}
            }

            await topicsApi.createTopic(projectId, topicRequest)
            successCount++
          } catch {
            errorCount++
          }
        }
      }

      // Create subscriptions
      if (options.createSubscriptions) {
        for (const item of subscriptionsToCreate) {
          try {
            const existingSubscription = subscriptions.value.find(s =>
              extractSubscriptionName(s.name) === item.subscriptionName
            )

            if (existingSubscription && !options.overwriteExisting) {
              successCount++
              continue
            }

            const subRequest: CreateSubscriptionRequest = {
              name: item.subscriptionName,
              topic: item.topicName,
              ackDeadlineSeconds: item.config.ack_deadline_seconds || 60,
              retainAckedMessages: false,
              messageRetentionDuration: item.config.message_retention_duration || '604800s',
              enableMessageOrdering: item.config.enable_message_ordering || false,
              enableExactlyOnceDelivery: item.config.enable_exactly_once_delivery || false,
              labels: item.config.labels || {}
            }

            // Add push config if present
            if (item.config.push_endpoint) {
              subRequest.pushConfig = {
                pushEndpoint: item.config.push_endpoint
              }
            }

            // Add dead letter policy if present
            if (item.config.dead_letter_topic) {
              subRequest.deadLetterPolicy = {
                deadLetterTopic: `projects/${projectId}/topics/${item.config.dead_letter_topic}`,
                maxDeliveryAttempts: item.config.max_delivery_attempts || 5
              }
            }

            // Add retry policy if present
            if (item.config.retry_minimum_backoff && item.config.retry_maximum_backoff) {
              subRequest.retryPolicy = {
                minimumBackoff: item.config.retry_minimum_backoff,
                maximumBackoff: item.config.retry_maximum_backoff
              }
            }

            await subscriptionsApi.createSubscription(projectId, subRequest)
            successCount++
          } catch {
            errorCount++
          }
        }
      }

      // Reload data
      await loadData(projectId)

      // Show toast notification
      if (successCount > 0 && errorCount === 0) {
        appStore.showToast({
          type: 'success',
          title: 'PubSub import completed successfully',
          message: `${successCount} configuration${successCount === 1 ? '' : 's'} imported`
        })
      } else if (successCount > 0 && errorCount > 0) {
        appStore.showToast({
          type: 'warning',
          title: 'PubSub import completed with errors',
          message: `${successCount} successful, ${errorCount} failed`
        })
      } else {
        appStore.showToast({
          type: 'error',
          title: 'PubSub import failed',
          message: `All ${errorCount} configuration${errorCount === 1 ? '' : 's'} failed to import`
        })
      }
    } catch (error) {
      console.error('PubSub import failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Import failed',
        message: (error as Error).message
      })
    } finally {
      isImporting.value.pubsub = false
    }
  }

  // Import templates
  const importTemplates = async (projectId: string, importData: any[], options: any) => {
    isImporting.value.templates = true
    try {
      // Load existing templates from IndexedDB first to sync the store
      await templatesStore.loadTemplates()

      let successCount = 0
      let skippedCount = 0
      let errorCount = 0

      for (const template of importData) {
        try {
          // Import each template - check templates directly by project ID
          const projectTemplates = templatesStore.templates.filter(t => t.projectId === projectId)
          const existingTemplate = projectTemplates.find(t => t.name === template.name)

          // Skip if template exists and we're not overwriting
          if (existingTemplate && !options.overwriteTemplates) {
            skippedCount++
            continue
          }

          // Determine the name to use - always use original name when overwriting or if no conflict
          let templateName = template.name

          // Only generate unique name if we're creating a new template (not overwriting)
          if (!existingTemplate || !options.overwriteTemplates) {
            // Check if we need to generate a unique name
            if (projectTemplates.find(t => t.name === templateName)) {
              let counter = 1
              const baseName = template.name
              do {
                templateName = `${baseName} (${counter})`
                counter++
              } while (projectTemplates.find(t => t.name === templateName))
            }
          }

          // Create template data with proper date handling
          const templateData = {
            name: templateName,
            projectId,
            topicName: template.topicName,
            data: template.data,
            attributes: template.attributes || {},
            variables: template.variables || {},
            description: template.description || '',
            tags: template.tags || []
          }

          // Create or update template
          if (existingTemplate && options.overwriteTemplates) {
            // Update existing template
            await templatesStore.updateTemplate(existingTemplate.id, templateData)
          } else {
            // Create new template
            await templatesStore.saveTemplate(templateData)
          }

          successCount++
        } catch (error) {
          console.error('Failed to import template:', template.name, error)
          errorCount++
        }
      }

      // Show toast notification with detailed results
      const totalProcessed = successCount + skippedCount

      if (totalProcessed > 0 && errorCount === 0) {
        if (skippedCount > 0 && successCount === 0) {
          // All templates were skipped
          appStore.showToast({
            type: 'info',
            title: 'Templates already exist',
            message: `${skippedCount} template${skippedCount === 1 ? '' : 's'} skipped (already exist${skippedCount === 1 ? 's' : ''}). Enable 'Overwrite existing templates' to update them.`
          })
        } else if (skippedCount > 0 && successCount > 0) {
          // Mixed results
          appStore.showToast({
            type: 'success',
            title: 'Templates import completed',
            message: `${successCount} imported, ${skippedCount} skipped (already exist${skippedCount === 1 ? 's' : ''})`
          })
        } else {
          // All templates were imported/updated
          const action = options.overwriteTemplates ? 'updated' : 'imported'
          appStore.showToast({
            type: 'success',
            title: 'Templates import completed successfully',
            message: `${successCount} template${successCount === 1 ? '' : 's'} ${action}`
          })
        }
      } else if (totalProcessed > 0 && errorCount > 0) {
        // Some success, some errors
        appStore.showToast({
          type: 'warning',
          title: 'Templates import completed with errors',
          message: `${successCount} imported, ${skippedCount} skipped, ${errorCount} failed. Check console for details.`
        })
      } else if (errorCount > 0) {
        // All failed
        appStore.showToast({
          type: 'error',
          title: 'Templates import failed',
          message: `All ${errorCount} template${errorCount === 1 ? '' : 's'} failed to import. Check console for details.`
        })
      } else {
        // Nothing processed
        appStore.showToast({
          type: 'info',
          title: 'No templates to import',
          message: 'No templates were processed'
        })
      }
    } catch (error) {
      console.error('Templates import failed:', error)
      appStore.showToast({
        type: 'error',
        title: 'Import failed',
        message: (error as Error).message
      })
    } finally {
      isImporting.value.templates = false
    }
  }

  return {
    topics,
    subscriptions,
    messageTemplates,
    isExporting,
    isImporting,
    loadData,
    exportConfiguration,
    exportTemplates,
    importConfiguration,
    importTemplates
  }
}
