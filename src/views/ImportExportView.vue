<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Import/Export
          </h2>
          <!-- Invisible button to maintain consistent header height with topics list -->
          <div class="invisible">
            <button class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md">
              <span>Placeholder</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Emulators Running Message -->
    <div v-if="availableTabs.length === 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-8 text-center">
        <div class="mb-4">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Emulators Running</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Start the Pub/Sub or Storage emulators to use the import/export functionality.
        </p>
        <button
          @click="checkAllConnectionsAndUpdateTabs"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          Check Connections
        </button>
      </div>
    </div>

    <!-- Service Selection Tabs -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5 mr-2 inline-block" />
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- PubSub Tab Content -->
    <div v-if="activeTab === 'pubsub'">
      <!-- Export Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Export Pub/Sub Configuration
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Export all your current topics, subscriptions, and message templates to JSON files
          </p>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <!-- Export Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                @click="exportPubSubConfiguration"
                :disabled="isExporting.pubsub"
                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownTrayIcon v-if="!isExporting.pubsub" class="h-4 w-4 mr-2" />
                <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
                {{ isExporting.pubsub ? 'Exporting...' : 'Export Topics & Subscriptions' }}
              </button>
              <button
                @click="exportPubSubTemplates"
                :disabled="isExporting.pubsubTemplates"
                class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownTrayIcon v-if="!isExporting.pubsubTemplates" class="h-4 w-4 mr-2" />
                <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
                {{ isExporting.pubsubTemplates ? 'Exporting...' : 'Export Message Templates' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Import Pub/Sub Data
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Import topics, subscriptions, or message templates from JSON files
          </p>
        </div>
        <div class="p-6">
          <div class="space-y-6">
            <!-- Import Type Selection -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What would you like to import?
              </label>
              <div class="space-y-2">
                <div class="flex items-center">
                  <input
                    id="import-pubsub-config"
                    v-model="pubsubImportType"
                    value="config"
                    type="radio"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <label for="import-pubsub-config" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Topics & Subscriptions
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="import-pubsub-templates"
                    v-model="pubsubImportType"
                    value="templates"
                    type="radio"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <label for="import-pubsub-templates" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Message Templates
                  </label>
                </div>
              </div>
            </div>

            <!-- Generic Import Component -->
            <ImportComponent
              :import-type="pubsubImportType"
              :is-importing="isImporting.pubsub || isImporting.pubsubTemplates"
              @import="handlePubSubImport"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Storage Tab Content -->
    <div v-if="activeTab === 'storage'">
      <!-- Export Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Export Storage Configuration
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Export all your current bucket configurations to JSON files
          </p>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <!-- Export Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                @click="exportStorageConfiguration"
                :disabled="isExporting.storage"
                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownTrayIcon v-if="!isExporting.storage" class="h-4 w-4 mr-2" />
                <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
                {{ isExporting.storage ? 'Exporting...' : 'Export Bucket Configurations' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Import Storage Data
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Import bucket configurations from JSON files
          </p>
        </div>
        <div class="p-6">
          <div class="space-y-6">
            <!-- Generic Import Component -->
            <ImportComponent
              :import-type="'storage'"
              :is-importing="isImporting.storage"
              @import="handleStorageImport"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useMessageTemplatesStore } from '@/stores/messageTemplates'
import { useStorageStore } from '@/stores/storage'
import { useServiceConnections } from '@/composables/useServiceConnections'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import type { PubSubTopic, PubSubSubscription, CreateTopicRequest, CreateSubscriptionRequest } from '@/types'
import type { MessageTemplate } from '@/utils/templateStorage'
import type { StorageBucket, CreateBucketRequest } from '@/types/storage'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  QueueListIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'
import ImportComponent from '@/components/import-export/ImportComponent.vue'

const route = useRoute()
const appStore = useAppStore()
const templatesStore = useMessageTemplatesStore()
const storageStore = useStorageStore()
const { 
  pubsubConnected, 
  storageConnected, 
  checkPubSubConnection, 
  checkStorageConnection, 
  checkAllConnections 
} = useServiceConnections()

// Component state
const activeTab = ref('pubsub')
const pubsubImportType = ref<'config' | 'templates'>('config')

const isExporting = ref({
  pubsub: false,
  pubsubTemplates: false,
  storage: false
})

const isImporting = ref({
  pubsub: false,
  pubsubTemplates: false,
  storage: false
})

// Data
const topics = ref<PubSubTopic[]>([])
const subscriptions = ref<PubSubSubscription[]>([])
const messageTemplates = ref<MessageTemplate[]>([])
const buckets = ref<StorageBucket[]>([])

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)

const availableTabs = computed(() => {
  const tabs = []

  // Only show PubSub tab if connected
  if (pubsubConnected.value) {
    tabs.push({
      id: 'pubsub',
      name: 'Pub/Sub',
      icon: QueueListIcon
    })
  }

  // Only show Storage tab if connected
  if (storageConnected.value) {
    tabs.push({
      id: 'storage',
      name: 'Storage',
      icon: ArchiveBoxIcon
    })
  }

  return tabs
})

// Interface for import/export configuration
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

interface StorageBucketConfig {
  name: string
  location?: string
  storageClass?: string
  uniformBucketLevelAccess?: boolean
  publicAccessPrevention?: 'enforced' | 'inherited'
  versioning?: boolean
  labels?: Record<string, string>
}

// Methods
const loadPubSubData = async () => {
  if (!currentProjectId.value) return

  // Check PubSub connection first
  const isConnected = await checkPubSubConnection()
  if (!isConnected) {
    console.warn('PubSub emulator is not running, skipping data load')
    topics.value = []
    subscriptions.value = []
    messageTemplates.value = []
    return
  }

  try {
    // Load topics
    const topicsResponse = await topicsApi.getTopics(currentProjectId.value)
    topics.value = Array.isArray(topicsResponse) ? topicsResponse.map(topic => ({
      ...topic,
      id: topic.id || `${currentProjectId.value}-${topic.name || 'unknown'}-${Date.now()}`,
      name: topic.name || 'unknown',
      fullName: topic.name || `projects/${currentProjectId.value}/topics/unknown`,
      projectId: currentProjectId.value,
      createdAt: new Date(topic.createdAt || Date.now()),
      updatedAt: new Date(topic.updatedAt || Date.now()),
      labels: topic.labels || {},
      state: 'ACTIVE',
      messageCount: topic.messageCount || 0,
      subscriptionsCount: topic.subscriptionsCount || 0
    })) : []

    // Load subscriptions
    const subscriptionsResponse = await subscriptionsApi.getSubscriptions(currentProjectId.value)
    subscriptions.value = Array.isArray(subscriptionsResponse) ? subscriptionsResponse.map(sub => ({
      ...sub,
      id: sub.id || `${currentProjectId.value}-${sub.name || 'unknown'}-${Date.now()}`,
      name: sub.name || 'unknown',
      fullName: sub.name || `projects/${currentProjectId.value}/subscriptions/unknown`,
      projectId: currentProjectId.value,
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
    messageTemplates.value = templatesStore.exportTemplates(currentProjectId.value)

  } catch (error) {
    console.error('Failed to load PubSub data:', error)
    // Don't show error toast if PubSub is simply not running
    pubsubConnected.value = false
  }
}

const loadStorageData = async () => {
  if (!currentProjectId.value) return

  // Check Storage connection first
  const isConnected = await checkStorageConnection()
  if (!isConnected) {
    console.warn('Storage emulator is not running, skipping data load')
    buckets.value = []
    return
  }

  try {
    await storageStore.fetchBuckets()
    buckets.value = storageStore.buckets
  } catch (error) {
    console.error('Failed to load Storage data:', error)
    // Don't show error toast if Storage is simply not running
    storageConnected.value = false
  }
}

// Export methods
const exportPubSubConfiguration = async () => {
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
      `pubsub-config-${currentProjectId.value}-${new Date().toISOString().split('T')[0]}.json`,
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

const exportPubSubTemplates = async () => {
  isExporting.value.pubsubTemplates = true
  try {
    // Load latest templates
    await templatesStore.loadTemplates()
    const exportData = templatesStore.exportTemplates(currentProjectId.value)

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
      `message-templates-${currentProjectId.value}-${new Date().toISOString().split('T')[0]}.json`,
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
    isExporting.value.pubsubTemplates = false
  }
}

const exportStorageConfiguration = async () => {
  isExporting.value.storage = true
  try {
    const exportData: StorageBucketConfig[] = buckets.value.map(bucket => ({
      name: bucket.name,
      location: bucket.location || 'US',
      storageClass: bucket.storageClass || 'STANDARD',
      uniformBucketLevelAccess: bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled || false,
      publicAccessPrevention: bucket.iamConfiguration?.publicAccessPrevention || 'inherited',
      versioning: bucket.versioning?.enabled || false,
      labels: bucket.labels || {}
    }))

    // Download the file
    downloadFile(
      JSON.stringify(exportData, null, 2),
      `storage-buckets-${currentProjectId.value}-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    )

    appStore.showToast({
      type: 'success',
      title: 'Storage configuration exported',
      message: `Exported ${exportData.length} bucket configuration${exportData.length === 1 ? '' : 's'}`
    })
  } catch (error) {
    console.error('Storage export failed:', error)
    appStore.showToast({
      type: 'error',
      title: 'Export failed',
      message: (error as Error).message
    })
  } finally {
    isExporting.value.storage = false
  }
}

// Import handlers
const handlePubSubImport = async (data: { importData: any[], options: any }) => {
  if (pubsubImportType.value === 'templates') {
    await importPubSubTemplates(data.importData, data.options)
  } else {
    await importPubSubConfiguration(data.importData, data.options)
  }
}

const handleStorageImport = async (data: { importData: any[], options: any }) => {
  await importStorageConfiguration(data.importData, data.options)
}

const importPubSubConfiguration = async (importData: any[], options: any) => {
  if (!currentProjectId.value) return
  
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

          await topicsApi.createTopic(currentProjectId.value, topicRequest)
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
              deadLetterTopic: `projects/${currentProjectId.value}/topics/${item.config.dead_letter_topic}`,
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

          await subscriptionsApi.createSubscription(currentProjectId.value, subRequest)
          successCount++
        } catch {
          errorCount++
        }
      }
    }

    // Reload data
    await loadPubSubData()

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

const importPubSubTemplates = async (importData: any[], options: any) => {
  if (!currentProjectId.value) return

  isImporting.value.pubsubTemplates = true
  try {
    // Load existing templates from IndexedDB first to sync the store
    await templatesStore.loadTemplates()

    let successCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const template of importData) {
      try {
        // Import each template - check templates directly by project ID
        const projectTemplates = templatesStore.templates.filter(t => t.projectId === currentProjectId.value)
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
          projectId: currentProjectId.value,
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
    isImporting.value.pubsubTemplates = false
  }
}

const importStorageConfiguration = async (importData: StorageBucketConfig[], options: any) => {
  isImporting.value.storage = true
  try {
    let successCount = 0
    let errorCount = 0

    for (const bucketConfig of importData) {
      try {
        const existingBucket = buckets.value.find(b => b.name === bucketConfig.name)

        if (existingBucket && !options.overwriteExisting) {
          successCount++
          continue
        }

        const bucketRequest: CreateBucketRequest = {
          name: bucketConfig.name,
          location: bucketConfig.location || 'US',
          storageClass: bucketConfig.storageClass || 'STANDARD',
          iamConfiguration: {
            uniformBucketLevelAccess: {
              enabled: bucketConfig.uniformBucketLevelAccess || false
            },
            publicAccessPrevention: bucketConfig.publicAccessPrevention || 'inherited'
          }
        }

        await storageStore.createBucket(bucketRequest, true) // Silent mode to prevent spam notifications
        successCount++
      } catch {
        errorCount++
      }
    }

    // Reload data
    await loadStorageData()

    // Show toast notification
    if (successCount > 0 && errorCount === 0) {
      appStore.showToast({
        type: 'success',
        title: 'Storage import completed successfully',
        message: `${successCount} bucket${successCount === 1 ? '' : 's'} imported`
      })
    } else if (successCount > 0 && errorCount > 0) {
      appStore.showToast({
        type: 'warning',
        title: 'Storage import completed with errors',
        message: `${successCount} successful, ${errorCount} failed`
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Storage import failed',
        message: `All ${errorCount} bucket${errorCount === 1 ? '' : 's'} failed to import`
      })
    }
  } catch (error) {
    console.error('Storage import failed:', error)
    appStore.showToast({
      type: 'error',
      title: 'Import failed',
      message: (error as Error).message
    })
  } finally {
    isImporting.value.storage = false
  }
}

// Utility functions
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const extractTopicName = (fullName: string): string => {
  if (fullName.includes('/topics/')) {
    return fullName.split('/topics/')[1]
  }
  return fullName
}

const extractSubscriptionName = (fullName: string): string => {
  if (fullName.includes('/subscriptions/')) {
    return fullName.split('/subscriptions/')[1]
  }
  return fullName
}

// Method to check all connections and handle tab switching
const checkAllConnectionsAndUpdateTabs = async () => {
  await checkAllConnections()

  // Switch to first available tab if current tab is not available
  if (availableTabs.value.length > 0) {
    const currentTabAvailable = availableTabs.value.some(tab => tab.id === activeTab.value)
    if (!currentTabAvailable) {
      activeTab.value = availableTabs.value[0].id
    }
  }
}

// Watch for tab changes to load appropriate data
watch(activeTab, (newTab) => {
  if (newTab === 'pubsub') {
    loadPubSubData()
  } else if (newTab === 'storage') {
    loadStorageData()
  }
}, { immediate: true })

// Watch availableTabs to switch to first available tab
watch(availableTabs, (newTabs) => {
  if (newTabs.length > 0) {
    const currentTabAvailable = newTabs.some(tab => tab.id === activeTab.value)
    if (!currentTabAvailable) {
      activeTab.value = newTabs[0].id
    }
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  // Check connections first
  await checkAllConnectionsAndUpdateTabs()

  // Load data for the active tab
  if (activeTab.value === 'pubsub' && pubsubConnected.value) {
    loadPubSubData()
  } else if (activeTab.value === 'storage' && storageConnected.value) {
    loadStorageData()
  }
})
</script>