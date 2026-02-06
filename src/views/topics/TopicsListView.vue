<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="text-center">
        <ExclamationCircleIcon class="mx-auto h-12 w-12 text-red-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error Loading Topics</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
        <div class="mt-4">
          <button
            @click="fetchTopics"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon class="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Topics List -->
    <div v-else-if="topics.length > 0" class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Topics ({{ topics.length }})
            </h2>
            <div class="flex items-center space-x-3">
              <button
                @click="showCreateTopicModal = true"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon class="h-4 w-4 sm:mr-2" />
                <span class="hidden sm:inline">Create Topic</span>
              </button>
              <button
                @click="fetchTopics"
                :disabled="isLoading"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon class="h-4 w-4 sm:mr-2" :class="{ 'animate-spin': isLoading }" />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Topics List Content -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="topic in topics"
            :key="topic.name"
            :id="`topic-${getTopicDisplayName(topic.name)}`"
            @click="selectTopicAndPublish(topic)"
            :class="[
              'px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer',
              selectedTopic?.name === topic.name
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                : '',
            ]"
          >
            <div class="flex items-start justify-between cursor-pointer">
              <div class="flex items-start space-x-3 flex-1 cursor-pointer">
                <QueueListIcon class="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div class="flex-1 min-w-0 cursor-pointer">
                  <div class="flex items-center space-x-2 mb-1">
                    <button
                      @click.stop="openTopicDetails(topic)"
                      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors group"
                    >
                      <span>{{ getTopicDisplayName(topic.name) }}</span>
                      <svg
                        class="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <div v-if="topic.schemaSettings" class="flex items-center">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      >
                        <svg
                          class="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Schema
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ topic.name }}
                  </p>

                  <!-- Topic Properties Grid -->
                  <div
                    class="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs cursor-pointer"
                  >
                    <!-- Message Retention - Always show default -->
                    <div class="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer">
                      <svg
                        class="w-3 h-3 mr-1.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="font-medium mr-1">Retention:</span>
                      <span>{{ topic.messageRetentionDuration || '7d (default)' }}</span>
                    </div>

                    <!-- Schema Information -->
                    <div
                      v-if="topic.schemaSettings"
                      class="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer"
                    >
                      <svg
                        class="w-3 h-3 mr-1.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span class="font-medium mr-1">Schema:</span>
                      <span class="truncate">{{
                        getSchemaDisplayName(topic.schemaSettings.schema)
                      }}</span>
                    </div>

                    <!-- Subscriptions Count - Always show -->
                    <div class="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer">
                      <svg
                        class="w-3 h-3 mr-1.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <span class="font-medium mr-1">Subscriptions:</span>
                      <span>{{ topic.subscriptionsCount || 0 }}</span>
                    </div>

                    <!-- KMS Key -->
                    <div
                      v-if="topic.kmsKeyName"
                      class="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer"
                    >
                      <svg
                        class="w-3 h-3 mr-1.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2m2-2H9a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2z"
                        />
                      </svg>
                      <span class="font-medium mr-1">Encrypted:</span>
                      <span class="text-green-600 dark:text-green-400">Yes</span>
                    </div>
                  </div>

                  <!-- Topic Labels -->
                  <div
                    v-if="topic.labels && Object.keys(topic.labels).length > 0"
                    class="mt-2 flex flex-wrap gap-1"
                  >
                    <span
                      v-for="(value, key) in topic.labels"
                      :key="key"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {{ key }}: {{ value }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Topic Actions -->
              <div class="flex items-center space-x-2 ml-4">
                <button
                  v-if="(topic.subscriptionsCount || 0) > 0"
                  @click.stop="navigateToSubscriptions(topic)"
                  class="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                  title="View subscriptions"
                >
                  <InboxStackIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="showPublishMessage(topic)"
                  :class="[
                    'p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors',
                    selectedTopic?.name === topic.name
                      ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : '',
                  ]"
                  title="Publish message"
                >
                  <PaperAirplaneIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="showDeleteConfirmation(topic)"
                  :disabled="isDeletingTopic"
                  class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete topic"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">Topics (0)</h2>
            <div class="flex items-center space-x-3">
              <button
                @click="showCreateTopicModal = true"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon class="h-4 w-4 sm:mr-2" />
                <span class="hidden sm:inline">Create Topic</span>
              </button>
              <button
                @click="fetchTopics"
                :disabled="isLoading"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon class="h-4 w-4 sm:mr-2" :class="{ 'animate-spin': isLoading }" />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State Content -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="text-center py-12">
          <QueueListIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No topics yet</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Get started by creating your first topic for project "{{ currentProjectId }}"
          </p>
          <div class="mt-6">
            <button
              @click="showCreateTopicModal = true"
              class="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlusIcon class="h-4 w-4 sm:mr-2" />
              <span class="hidden sm:inline">Create Topic</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Create Topic Modal -->
    <CreateTopicModal v-model="showCreateTopicModal" @topic-created="handleTopicCreated" />

    <!-- Topic Details Modal -->
    <TopicDetailsModal
      v-model="showTopicDetailsModal"
      :topic-name="selectedTopicName"
      :project-id="currentProjectId"
      @topic-updated="handleTopicUpdated"
      @subscriptions-changed="handleSubscriptionsChanged"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteTopicModal"
      title="Delete Topic"
      :message="`Are you sure you want to delete topic '${topicToDelete ? getTopicDisplayName(topicToDelete.name) : ''}'?`"
      confirm-label="Delete Topic"
      :is-loading="isDeletingTopic"
      :details="{
        title: 'What will happen:',
        description:
          'The topic and all its messages will be permanently deleted. Subscriptions will lose access to this topic.',
      }"
      @confirm="deleteTopic"
      @cancel="cancelDeleteTopic"
    />

    <!-- Publish Message Modal -->
    <PublishMessageModal
      v-model="showPublishMessageModal"
      :topic-name="
        selectedTopicForPublish?.name ? getTopicDisplayName(selectedTopicForPublish.name) : ''
      "
      :project-id="currentProjectId"
      @message-published="handleMessagePublished"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { handleFocusTarget } from '@/utils/focusUtils'
import { useAppStore } from '@/stores/app'
import { useTopicsStore } from '@/stores/topics'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import type { PubSubTopic } from '@/types'
import {
  QueueListIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  InboxStackIcon,
} from '@heroicons/vue/24/outline'
import CreateTopicModal from '@/components/modals/CreateTopicModal.vue'
import TopicDetailsModal from '@/components/modals/TopicDetailsModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import PublishMessageModal from '@/components/modals/PublishMessageModal.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const topicsStore = useTopicsStore()

const isLoading = ref(false)
const error = ref<string | null>(null)
const topics = ref<PubSubTopic[]>([])
const showCreateTopicModal = ref(false)
const showTopicDetailsModal = ref(false)
const selectedTopicName = ref<string>('')
const isDeletingTopic = ref(false)
const showDeleteTopicModal = ref(false)
const topicToDelete = ref<PubSubTopic | null>(null)
const showPublishMessageModal = ref(false)
const selectedTopicForPublish = ref<PubSubTopic | null>(null)
const selectedTopic = ref<PubSubTopic | null>(null)

const currentProjectId = computed(() => route.params.projectId as string)

const getTopicDisplayName = (fullName: string): string => {
  // Extract topic name from full resource name (projects/project-id/topics/topic-name)
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

const getSchemaDisplayName = (schemaFullName: string): string => {
  // Extract schema name from full resource name (projects/project-id/schemas/schema-name)
  const parts = schemaFullName.split('/')
  return parts[parts.length - 1] || schemaFullName
}

const fetchTopics = async () => {
  if (!currentProjectId.value) {
    error.value = 'No project selected'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const fetchedTopics = await topicsApi.getTopics(currentProjectId.value)

    // Calculate subscription counts for each topic
    const allSubscriptions = await subscriptionsApi.getSubscriptions(currentProjectId.value)

    // Create a map of topic name to subscription count
    const subscriptionCounts = new Map<string, number>()
    // Ensure allSubscriptions is an array before calling forEach
    const subscriptionsArray = Array.isArray(allSubscriptions) ? allSubscriptions : []
    subscriptionsArray.forEach((sub: any) => {
      const topicField = sub.topic || sub.topicName
      const topicName = typeof topicField === 'string' ? topicField.split('/').pop() : null
      if (topicName) {
        const currentCount = subscriptionCounts.get(topicName) || 0
        subscriptionCounts.set(topicName, currentCount + 1)
      }
    })

    // Update subscription counts on topics
    const topicsWithCounts = fetchedTopics.map((topic: any) => {
      const topicName = topic.name?.split('/').pop() || ''
      const count = subscriptionCounts.get(topicName) || 0
      return {
        ...topic,
        subscriptionsCount: count,
      }
    })

    topics.value = topicsWithCounts
  } catch (err: any) {
    console.error('Error fetching topics:', err)

    if (err.response?.status === 404) {
      error.value = `Project "${currentProjectId.value}" not found. Make sure the project exists in the emulator.`
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
      error.value = "Cannot connect to the Pub/Sub emulator. Please check if it's running."
    } else {
      error.value = err.message || 'Failed to load topics'
    }
  } finally {
    isLoading.value = false
  }
}

const openTopicDetails = (topic: PubSubTopic) => {
  selectedTopicName.value = getTopicDisplayName(topic.name)
  showTopicDetailsModal.value = true
}

const handleTopicCreated = () => {
  // Refresh the topics list after successful creation
  fetchTopics()
}

const handleTopicUpdated = () => {
  // Refresh the topics list after successful update
  fetchTopics()
}

const handleSubscriptionsChanged = () => {
  // Refresh the topics list after subscriptions are created/deleted
  fetchTopics()
}

const showDeleteConfirmation = (topic: PubSubTopic) => {
  topicToDelete.value = topic
  showDeleteTopicModal.value = true
}

const deleteTopic = async () => {
  if (!topicToDelete.value) return

  const topic = topicToDelete.value
  const topicDisplayName = getTopicDisplayName(topic.name)

  isDeletingTopic.value = true
  try {
    // Use the store method which includes cascading subscription deletion
    await topicsStore.deleteTopic(topicDisplayName, currentProjectId.value)

    // Remove the topic from local state immediately for better UX
    topics.value = topics.value.filter(t => t.name !== topic.name)

    appStore.showToast({
      type: 'success',
      title: 'Topic Deleted',
      message: `Topic "${topicDisplayName}" and all related subscriptions have been deleted successfully`,
    })
  } catch (error: any) {
    console.error('Error deleting topic:', error)

    let errorMessage = 'Failed to delete topic'
    if (error.response?.status === 404) {
      errorMessage = 'Topic not found or already deleted'
      // Remove from local state anyway since it doesn't exist
      topics.value = topics.value.filter(t => t.name !== topic.name)
    }

    appStore.showToast({
      type: 'error',
      title: 'Delete Failed',
      message: errorMessage,
    })
  } finally {
    isDeletingTopic.value = false
    showDeleteTopicModal.value = false
    topicToDelete.value = null
  }
}

const cancelDeleteTopic = () => {
  showDeleteTopicModal.value = false
  topicToDelete.value = null
}

const showPublishMessage = (topic: PubSubTopic) => {
  selectedTopicForPublish.value = topic
  showPublishMessageModal.value = true
}

const selectTopicAndPublish = (topic: PubSubTopic) => {
  selectedTopic.value = topic
  selectedTopicForPublish.value = topic
  showPublishMessageModal.value = true
}

const handleMessagePublished = () => {
  // Message published successfully
}

const navigateToSubscriptions = (topic: PubSubTopic) => {
  const topicName = getTopicDisplayName(topic.name)
  // Navigate to subscriptions page with hash for topic focus
  router.push({
    name: 'project-subscriptions',
    params: { projectId: currentProjectId.value },
    hash: `#${topicName}`,
  })
}

// Handle URL hash for topic focus
const handleTopicFocus = async () => {
  const hash = route.hash.slice(1) || window.location.hash.slice(1)
  if (hash && topics.value.length > 0) {
    await handleFocusTarget(hash, 'topic')
  }
}

// Watch for project changes and refetch topics
watch(
  () => currentProjectId.value,
  (newProjectId, oldProjectId) => {
    if (newProjectId !== oldProjectId && oldProjectId) {
      // Clear store data for the old project
      topicsStore.clearProjectData(oldProjectId)

      // Clear local data when project changes
      topics.value = []
      error.value = null

      // Fetch topics for new project
      if (newProjectId) {
        fetchTopics()
      }
    }
  },
  { immediate: false }
)

// Watch for topics data changes to handle focus
watch(
  () => topics.value.length,
  newLength => {
    if (newLength > 0) {
      handleTopicFocus()
    }
  }
)

// Watch for route hash changes
watch(
  () => route.hash,
  newHash => {
    if (newHash && topics.value.length > 0) {
      handleTopicFocus()
    }
  },
  { immediate: true }
)

onMounted(() => {
  fetchTopics()
})
</script>
