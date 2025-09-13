<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Import/Export
          </h2>
          <!-- Invisible placeholder to maintain header height -->
          <div class="inline-flex items-center px-3 py-2 text-sm font-medium opacity-0 pointer-events-none">
            <div class="h-4 w-4 mr-2"></div>
            Refresh
          </div>
        </div>
      </div>
    </div>

    <!-- Export Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Export Configuration
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
              @click="exportConfiguration"
              :disabled="isExporting"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExporting" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExporting ? 'Exporting...' : 'Export Topics & Subscriptions' }}
            </button>
            <button
              @click="exportTemplates"
              :disabled="isExportingTemplates"
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExportingTemplates" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExportingTemplates ? 'Exporting...' : 'Export Message Templates' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Import Data
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
                  id="import-config"
                  v-model="importType"
                  value="config"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label for="import-config" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                  Topics & Subscriptions
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="import-templates"
                  v-model="importType"
                  value="templates"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label for="import-templates" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                  Message Templates
                </label>
              </div>
            </div>
          </div>

          <!-- Import Method Selection -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Import Method
            </label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="import-file"
                  v-model="importMode"
                  value="file"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label for="import-file" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                  Upload File
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="import-paste"
                  v-model="importMode"
                  value="paste"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label for="import-paste" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                  Paste JSON
                </label>
              </div>
            </div>
          </div>

          <!-- File Upload Mode -->
          <div v-if="importMode === 'file'">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select {{ importType === 'config' ? 'Configuration' : 'Template' }} File
            </label>
            <div 
              class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors"
              :class="isDragOver ? 
                'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' : 
                'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
            >
              <div class="space-y-1 text-center">
                <DocumentIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div class="flex text-sm text-gray-600 dark:text-gray-400">
                  <label for="file-upload" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      ref="fileInput"
                      type="file" 
                      accept=".json"
                      @change="handleFileUpload"
                      class="sr-only" 
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  JSON files only
                </p>
              </div>
            </div>
          </div>

          <!-- JSON Paste Mode -->
          <div v-if="importMode === 'paste'">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste JSON {{ importType === 'config' ? 'Configuration' : 'Templates' }}
            </label>
            <div class="space-y-3">
              <textarea
                v-model="jsonText"
                @input="handleJsonPaste"
                :placeholder="importType === 'config' ? 'Paste your JSON configuration here...' : 'Paste your JSON templates here...'"
                rows="10"
                :class="[
                  'w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none dark:bg-gray-700 dark:text-white text-sm font-mono json-textarea',
                  jsonError 
                    ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                ]"
              />
              
              <!-- Error message -->
              <div v-if="jsonError" class="text-sm text-red-600 dark:text-red-400 mt-1">
                {{ jsonError }}
              </div>
              
              <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ importType === 'config' 
                    ? 'Paste your JSON array of topic and subscription configurations' 
                    : 'Paste your JSON array of message templates' }}
                </p>
                <button
                  v-if="jsonText"
                  @click="clearJsonText"
                  class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <!-- Import Preview -->
          <div v-if="importPreview" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <DocumentIcon v-if="importMode === 'file'" class="h-5 w-5 text-gray-400 mr-2" />
                <span v-if="importMode === 'file'" class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  {{ importFile?.name }}
                </span>
                <span v-if="importMode === 'file'" class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ({{ importFile ? formatFileSize(importFile.size) : '' }})
                </span>
                <span v-if="importMode === 'paste'" class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  📋 Pasted JSON {{ importType === 'config' ? 'Configuration' : 'Templates' }}
                </span>
              </div>
              <button
                @click="clearImportData"
                class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
            
            <div class="space-y-2">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Preview: {{ importPreview.length }} {{ importType === 'templates' ? 'template' : 'configuration' }}{{ importPreview.length === 1 ? '' : 's' }}
              </div>
              <div class="bg-white dark:bg-gray-800 rounded border p-3 max-h-40 overflow-y-auto">
                <pre class="text-xs text-gray-700 dark:text-gray-300">{{ JSON.stringify(importPreview.slice(0, 3), null, 2) }}</pre>
                <div v-if="importPreview.length > 3" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ... and {{ importPreview.length - 3 }} more {{ importType === 'templates' ? 'template' : 'configuration' }}{{ importPreview.length - 3 === 1 ? '' : 's' }}
                </div>
              </div>
            </div>

            <!-- Import Options -->
            <div class="mt-4 space-y-3">
              <div v-if="importType === 'config'">
                <div class="flex items-center">
                  <input
                    id="create-topics"
                    v-model="importOptions.createTopics"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label for="create-topics" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Create topics if they don't exist
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="create-subscriptions"
                    v-model="importOptions.createSubscriptions"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label for="create-subscriptions" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Create subscriptions if they don't exist
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="overwrite-existing"
                    v-model="importOptions.overwriteExisting"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label for="overwrite-existing" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Overwrite existing configurations
                  </label>
                </div>
              </div>
              <div v-if="importType === 'templates'">
                <div class="flex items-center">
                  <input
                    id="overwrite-templates"
                    v-model="importOptions.overwriteTemplates"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label for="overwrite-templates" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Overwrite existing templates with same name
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="preserve-ids"
                    v-model="importOptions.preserveTemplateIds"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-blue-600"
                  />
                  <label for="preserve-ids" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                    Preserve template IDs (may cause conflicts)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Import Button -->
          <div v-if="importPreview" class="pt-4">
            <button
              @click="importType === 'templates' ? importTemplatesData() : importConfiguration()"
              :disabled="(isImporting || isImportingTemplates) || !importPreview || (importType === 'config' && !importOptions.createTopics && !importOptions.createSubscriptions)"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpTrayIcon v-if="!isImporting && !isImportingTemplates" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ (isImporting || isImportingTemplates) ? 'Importing...' : `Import ${importType === 'templates' ? 'Templates' : 'Configuration'}` }}
            </button>
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
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import type { PubSubTopic, PubSubSubscription, CreateTopicRequest, CreateSubscriptionRequest } from '@/types'
import type { MessageTemplate } from '@/utils/templateStorage'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const appStore = useAppStore()
const templatesStore = useMessageTemplatesStore()

// Component state
const importOptions = ref({
  createTopics: true,
  createSubscriptions: true,
  overwriteExisting: false,
  overwriteTemplates: false,
  preserveTemplateIds: false
})

const importType = ref<'config' | 'templates'>('config')
const importMode = ref<'file' | 'paste'>('file')
const jsonText = ref('')
const jsonError = ref<string | null>(null)

const isExporting = ref(false)
const isExportingTemplates = ref(false)
const isImporting = ref(false)
const isImportingTemplates = ref(false)
const isDragOver = ref(false)
const importFile = ref<File | null>(null)
const importPreview = ref<any[] | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Data
const topics = ref<PubSubTopic[]>([])
const subscriptions = ref<PubSubSubscription[]>([])
const messageTemplates = ref<MessageTemplate[]>([])

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)

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

// Methods
const loadData = async () => {
  if (!currentProjectId.value) return

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
    await templatesStore.loadTemplates(currentProjectId.value)
    messageTemplates.value = templatesStore.exportTemplates(currentProjectId.value)

  } catch (error) {
    console.error('Failed to load data:', error)
    appStore.showToast({
      type: 'error',
      title: 'Failed to load data',
      message: (error as Error).message
    })
  }
}


const exportConfiguration = async () => {
  isExporting.value = true
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
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pubsub-config-${currentProjectId.value}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

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
    isExporting.value = false
  }
}

const exportTemplates = async () => {
  isExportingTemplates.value = true
  try {
    // Load latest templates
    await templatesStore.loadTemplates(currentProjectId.value)
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
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `message-templates-${currentProjectId.value}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

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
    isExportingTemplates.value = false
  }
}

const processFile = async (file: File) => {
  if (!file.name.endsWith('.json')) {
    appStore.showToast({
      type: 'error',
      title: 'Invalid file type',
      message: 'Please select a JSON file'
    })
    return
  }

  importFile.value = file
  
  try {
    const content = await readFileContent(file)
    const parsed = JSON.parse(content)
    
    // Handle both array and single object cases
    let configurations: any[]
    if (Array.isArray(parsed)) {
      configurations = parsed
    } else {
      configurations = [parsed]
    }

    // Validate structure based on import type
    if (importType.value === 'config') {
      for (const item of configurations) {
        if (!item.topic_name || !item.sub_name) {
          throw new Error('Each configuration must have topic_name and sub_name')
        }
      }
    } else {
      for (const item of configurations) {
        if (!item.name || !item.projectId || !item.topicName || !item.data) {
          throw new Error('Each template must have name, projectId, topicName, and data fields')
        }
      }
    }

    importPreview.value = configurations
  } catch (error) {
    console.error('Failed to parse file:', error)
    appStore.showToast({
      type: 'error',
      title: 'Invalid file',
      message: (error as Error).message
    })
    clearImportFile()
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  await processFile(file)
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// Drag and drop handlers
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = true
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  await processFile(file)
}

const clearImportFile = () => {
  importFile.value = null
  importPreview.value = null
  isDragOver.value = false
  jsonText.value = ''
  jsonError.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleJsonPaste = async () => {
  if (!jsonText.value.trim()) {
    jsonError.value = null
    importPreview.value = null
    return
  }
  
  try {
    const parsedData = JSON.parse(jsonText.value)
    
    // Ensure importPreview is always an array for consistent handling
    let configurations: any[]
    if (Array.isArray(parsedData)) {
      configurations = parsedData
    } else {
      // If it's a single object, wrap it in an array
      configurations = [parsedData]
    }

    // Validate structure based on import type
    if (importType.value === 'config') {
      for (const item of configurations) {
        if (!item.topic_name || !item.sub_name) {
          throw new Error('Each configuration must have topic_name and sub_name')
        }
      }
    } else {
      for (const item of configurations) {
        if (!item.name || !item.projectId || !item.topicName || !item.data) {
          throw new Error('Each template must have name, projectId, topicName, and data fields')
        }
      }
    }
    
    importPreview.value = configurations
    jsonError.value = null // Clear any previous error
  } catch (error) {
    // Set error state for visual feedback
    jsonError.value = error instanceof Error ? error.message : 'Invalid JSON format'
    importPreview.value = null
  }
}

const clearJsonText = () => {
  jsonText.value = ''
  jsonError.value = null
  importPreview.value = null
}

const clearImportData = () => {
  importFile.value = null
  jsonText.value = ''
  jsonError.value = null
  importPreview.value = null
  isDragOver.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const clearOnTypeChange = () => {
  importPreview.value = null
  jsonError.value = null
  jsonText.value = ''
  importFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}


const importConfiguration = async () => {
  if (!importPreview.value || !currentProjectId.value || importType.value !== 'config') return

  isImporting.value = true

  try {
    let successCount = 0
    let errorCount = 0
    
    const topicsToCreate = new Set<string>()
    const subscriptionsToCreate: Array<{
      config: TopicSubscriptionConfig
      topicName: string
      subscriptionName: string
    }> = []

    // Collect unique topics and subscriptions to create
    for (const config of importPreview.value) {
      if (importOptions.value.createTopics) {
        topicsToCreate.add(config.topic_name)
      }
      if (importOptions.value.createSubscriptions) {
        subscriptionsToCreate.push({
          config,
          topicName: config.topic_name,
          subscriptionName: config.sub_name
        })
      }
    }

    // Create topics first
    if (importOptions.value.createTopics) {
      for (const topicName of topicsToCreate) {
        try {
          const existingTopic = topics.value.find(t => extractTopicName(t.name) === topicName)
          
          if (existingTopic && !importOptions.value.overwriteExisting) {
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
    if (importOptions.value.createSubscriptions) {
      for (const item of subscriptionsToCreate) {
        try {
          const existingSubscription = subscriptions.value.find(s => 
            extractSubscriptionName(s.name) === item.subscriptionName
          )
          
          if (existingSubscription && !importOptions.value.overwriteExisting) {
            successCount++
            continue
          }

          const subscriptionRequest: CreateSubscriptionRequest = {
            name: item.subscriptionName,
            topic: `projects/${currentProjectId.value}/topics/${item.topicName}`,
            ackDeadlineSeconds: item.config.ack_deadline_seconds || 60,
            retainAckedMessages: false,
            messageRetentionDuration: item.config.message_retention_duration || '604800s',
            enableMessageOrdering: item.config.enable_message_ordering || false,
            labels: item.config.labels || {}
          }

          // Add push config if specified
          if (item.config.push_endpoint) {
            subscriptionRequest.pushConfig = {
              pushEndpoint: item.config.push_endpoint
            }
          }

          // Add dead letter policy if specified
          if (item.config.dead_letter_topic) {
            subscriptionRequest.deadLetterPolicy = {
              deadLetterTopic: `projects/${currentProjectId.value}/topics/${item.config.dead_letter_topic}`,
              maxDeliveryAttempts: item.config.max_delivery_attempts || 5
            }
          }

          // Add retry policy if specified
          if (item.config.retry_minimum_backoff && item.config.retry_maximum_backoff) {
            subscriptionRequest.retryPolicy = {
              minimumBackoff: item.config.retry_minimum_backoff,
              maximumBackoff: item.config.retry_maximum_backoff
            }
          }

          await subscriptionsApi.createSubscription(currentProjectId.value, subscriptionRequest)
          successCount++
        } catch {
          errorCount++
        }
      }
    }

    // Reload data
    await loadData()

    // Show toast notification
    if (successCount > 0 && errorCount === 0) {
      appStore.showToast({
        type: 'success',
        title: 'Import completed successfully',
        message: `${successCount} configuration${successCount === 1 ? '' : 's'} imported`
      })
    } else if (successCount > 0 && errorCount > 0) {
      appStore.showToast({
        type: 'warning',
        title: 'Import completed with errors',
        message: `${successCount} successful, ${errorCount} failed`
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Import failed',
        message: `All ${errorCount} configuration${errorCount === 1 ? '' : 's'} failed to import`
      })
    }
  } catch (error) {
    console.error('Import failed:', error)
    appStore.showToast({
      type: 'error',
      title: 'Import failed',
      message: (error as Error).message
    })
  } finally {
    isImporting.value = false
  }
}

const importTemplatesData = async () => {
  if (!importPreview.value || !currentProjectId.value || importType.value !== 'templates') return

  isImportingTemplates.value = true

  try {
    let successCount = 0
    let errorCount = 0
    const templateData = importPreview.value as MessageTemplate[]

    for (const template of templateData) {
      try {
        // Check if template with same name exists
        const existingTemplate = messageTemplates.value.find(t => 
          t.name === template.name && t.projectId === currentProjectId.value
        )

        if (existingTemplate && !importOptions.value.overwriteTemplates) {
          successCount++
          continue
        }

        // Prepare template form data (ensuring all data is serializable for IndexedDB)
        const templateForm = {
          name: String(template.name || ''),
          description: template.description ? String(template.description) : undefined,
          projectId: currentProjectId.value, // Override with current project
          topicName: String(template.topicName || ''),
          data: String(template.data || ''),
          attributes: JSON.parse(JSON.stringify(template.attributes || {})),
          variables: JSON.parse(JSON.stringify(template.variables || {})),
          tags: Array.isArray(template.tags) ? template.tags.map(tag => String(tag)) : []
        }

        if (existingTemplate && importOptions.value.overwriteTemplates) {
          // Update existing template
          await templatesStore.updateTemplate(existingTemplate.id, templateForm)
        } else {
          // Create new template
          await templatesStore.saveTemplate(templateForm)
        }
        
        successCount++
      } catch {
        errorCount++
      }
    }

    // Reload templates data
    await templatesStore.loadTemplates(currentProjectId.value)
    messageTemplates.value = templatesStore.exportTemplates(currentProjectId.value)

    // Show toast notification
    if (successCount > 0 && errorCount === 0) {
      appStore.showToast({
        type: 'success',
        title: 'Templates imported successfully',
        message: `${successCount} template${successCount === 1 ? '' : 's'} imported`
      })
    } else if (successCount > 0 && errorCount > 0) {
      appStore.showToast({
        type: 'warning',
        title: 'Templates import completed with errors',
        message: `${successCount} successful, ${errorCount} failed`
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Templates import failed',
        message: `All ${errorCount} template${errorCount === 1 ? '' : 's'} failed to import`
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
    isImportingTemplates.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
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


// Watch import type changes
watch(importType, () => {
  clearOnTypeChange()
})

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.json-textarea {
  caret-color: auto !important;
}

.json-textarea:focus {
  caret-color: #3b82f6 !important; /* Blue cursor on focus */
}
</style>
