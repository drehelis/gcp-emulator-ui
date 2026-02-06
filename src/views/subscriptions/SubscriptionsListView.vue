<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Error Loading Subscriptions
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
        <div class="mt-4">
          <button
            @click="loadSubscriptions"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon class="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Subscriptions List -->
    <div v-else-if="subscriptionsByTopic.size > 0" class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Subscriptions ({{ subscriptions.length }})
            </h2>
            <div class="flex items-center space-x-3">
              <button
                @click="loadSubscriptions({ preserveExpandedTopics: true })"
                :disabled="loading"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon class="h-4 w-4 sm:mr-2" :class="{ 'animate-spin': loading }" />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Topics with subscriptions - Single card with dividers -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div
          v-for="([topicName, topicSubscriptions], index) in Array.from(subscriptionsByTopic)"
          :key="topicName"
          :class="index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''"
          :id="`topic-${getTopicDisplayName(topicName)}`"
        >
          <!-- Topic Header -->
          <div
            @click="toggleTopicExpansion(topicName)"
            :class="[
              'px-6 py-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b',
              isTopicExpanded(topicName)
                ? 'border-gray-200 dark:border-gray-700'
                : 'border-transparent',
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-start space-x-3">
                <ChevronRightIcon
                  v-if="!isTopicExpanded(topicName)"
                  class="h-4 w-4 text-gray-400 transition-transform"
                />
                <ChevronDownIcon v-else class="h-4 w-4 text-gray-400 transition-transform" />
                <QueueListIcon class="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ getTopicDisplayName(topicName) }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ topicName }}</p>
                </div>
              </div>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
              >
                {{ (topicSubscriptions || []).length }} subscription{{
                  (topicSubscriptions || []).length !== 1 ? 's' : ''
                }}
              </span>
            </div>
          </div>

          <!-- Subscriptions for this topic -->
          <div
            v-if="isTopicExpanded(topicName)"
            class="divide-y divide-gray-200 dark:divide-gray-700"
          >
            <div
              v-for="subscription in topicSubscriptions"
              :key="subscription.name"
              @click="selectSubscriptionAndOpenModal(subscription)"
              :class="[
                'px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer',
                selectedSubscription?.name === subscription.name
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                  : '',
              ]"
            >
              <div class="flex items-start justify-between cursor-pointer">
                <div class="flex items-start space-x-3 flex-1 cursor-pointer">
                  <InboxStackIcon class="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div class="flex-1 min-w-0 cursor-pointer">
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ getSubscriptionDisplayName(subscription.name) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ subscription.name }}
                    </p>

                    <!-- Subscription Properties Grid -->
                    <div
                      class="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs cursor-pointer"
                    >
                      <!-- Ack Deadline -->
                      <div
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span class="font-medium mr-1">Ack Deadline:</span>
                        <span>{{ subscription.ackDeadlineSeconds }}s</span>
                      </div>

                      <!-- Type -->
                      <div
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
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          />
                        </svg>
                        <span class="font-medium mr-1">Type:</span>
                        <span>{{ subscription.pushConfig?.pushEndpoint ? 'Push' : 'Pull' }}</span>
                      </div>

                      <!-- Detached Status -->
                      <div
                        v-if="subscription.detached"
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
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                        <span class="font-medium mr-1">Status:</span>
                        <span class="text-yellow-600 dark:text-yellow-400">Detached</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Subscription Actions -->
                <div class="flex items-center space-x-2 ml-4">
                  <button
                    @click.stop="selectSubscriptionAndOpenModal(subscription)"
                    :disabled="pullingMessages.has(subscription.name)"
                    class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View subscription messages"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="deleteSubscription(subscription)"
                    :disabled="isDeletingSubscription"
                    class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete subscription"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
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
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">Subscriptions (0)</h2>
            <div class="flex items-center space-x-3">
              <button
                @click="loadSubscriptions({ preserveExpandedTopics: true })"
                :disabled="loading"
                class="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon class="h-4 w-4 sm:mr-2" :class="{ 'animate-spin': loading }" />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State Content -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="text-center py-12">
          <InboxStackIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No subscriptions yet
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Create subscriptions to start receiving messages from topics
          </p>
        </div>
      </div>
    </div>

    <!-- Subscription Messages Modal -->
    <SubscriptionMessagesModal
      v-model="showSubscriptionMessagesModal"
      :subscription="selectedSubscription"
      :project-id="currentProjectId"
      :messages="selectedSubscription ? pulledMessages.get(selectedSubscription.name) || [] : []"
      :is-pulling="selectedSubscription ? pullingMessages.has(selectedSubscription.name) : false"
      :is-acknowledging="
        selectedSubscription ? acknowledgingMessages.has(selectedSubscription.name) : false
      "
      @pull-messages="handleModalPullMessages"
      @acknowledge-message="acknowledgeIndividualMessage"
      @acknowledge-all="acknowledgePulledMessages"
    />

    <!-- Delete Subscription Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteSubscriptionModal"
      title="Delete Subscription"
      :message="`Are you sure you want to delete subscription '${subscriptionToDelete ? getSubscriptionDisplayName(subscriptionToDelete.name) : ''}'?`"
      confirm-label="Delete Subscription"
      :is-loading="isDeletingSubscription"
      :details="{
        title: 'What will happen:',
        description:
          'The subscription will be permanently deleted and will stop receiving messages from its topic.',
      }"
      @confirm="confirmDeleteSubscription"
      @cancel="cancelDeleteSubscription"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { handleTopicFocus as handleTopicFocusUtil } from '@/utils/focusUtils'
import { useAppStore } from '@/stores/app'
import { subscriptionsApi } from '@/api/pubsub'
import type { PubSubSubscription, ReceivedMessage, PullRequest } from '@/types/pubsub'
import SubscriptionMessagesModal from '@/components/modals/SubscriptionMessagesModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  InboxStackIcon,
  QueueListIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const appStore = useAppStore()

const currentProjectId = computed(() => route.params.projectId as string)

// State
const subscriptions = ref<PubSubSubscription[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pulledMessages = ref(new Map<string, ReceivedMessage[]>())
const pullingMessages = ref(new Set<string>())
const acknowledgingMessages = ref(new Set<string>())
const isDeletingSubscription = ref(false)
const expandedTopics = ref(new Set<string>())
const selectedSubscription = ref<PubSubSubscription | null>(null)
const showSubscriptionMessagesModal = ref(false)
const showDeleteSubscriptionModal = ref(false)
const subscriptionToDelete = ref<PubSubSubscription | null>(null)

// Computed
const subscriptionsByTopic = computed(() => {
  const grouped = new Map<string, PubSubSubscription[]>()

  subscriptions.value.forEach(subscription => {
    const topicName = subscription.topicName || 'unknown'
    if (!grouped.has(topicName)) {
      grouped.set(topicName, [])
    }
    grouped.get(topicName)!.push(subscription)
  })

  // Sort subscriptions within each topic
  grouped.forEach(subs => {
    subs.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  })

  // Sort topics alphabetically
  return new Map([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)))
})

// Methods
const getTopicDisplayName = (topicName: string) => {
  if (!topicName) return 'unknown'
  const parts = topicName.split('/')
  return parts[parts.length - 1]
}

const getSubscriptionDisplayName = (subscriptionName: string) => {
  if (!subscriptionName) return 'unknown'
  const parts = subscriptionName.split('/')
  return parts[parts.length - 1]
}

const loadSubscriptions = async (options: { preserveExpandedTopics?: boolean } = {}) => {
  if (!currentProjectId.value) return

  const previousExpandedTopics = new Set(expandedTopics.value)

  loading.value = true
  error.value = null

  try {
    console.log('Loading subscriptions for project:', currentProjectId.value)
    const response = await subscriptionsApi.getSubscriptions(currentProjectId.value)
    console.log('Subscriptions API response in component:', response)

    // Transform the API response to match our interface
    // API returns 'topic' but our interface expects 'topicName'
    // Ensure response is always an array to prevent .map() errors
    const safeResponse = Array.isArray(response) ? response : []
    const transformedSubscriptions = safeResponse.map((sub: any) => ({
      ...sub,
      topicName: sub.topic || sub.topicName || 'unknown', // Handle both field names with fallback
      projectId: currentProjectId.value,
      id: sub.name || `sub-${Date.now()}`,
      fullName: sub.name || '',
      name: sub.name || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ackDeadlineSeconds: sub.ackDeadlineSeconds || 60,
      messageCount: sub.messageCount || 0,
      undeliveredMessageCount: sub.undeliveredMessageCount || 0,
    }))

    console.log('Transformed subscriptions:', transformedSubscriptions)
    subscriptions.value = transformedSubscriptions

    if (options.preserveExpandedTopics) {
      const topicNames = new Set(subscriptionsByTopic.value.keys())
      expandedTopics.value = new Set(
        [...previousExpandedTopics].filter(topicName => topicNames.has(topicName))
      )
    } else {
      // Start with all topics collapsed by default
      expandedTopics.value = new Set()
    }

    // Handle topic focus after data is loaded
    await nextTick()
    handleTopicFocus()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load subscriptions'
    appStore.showToast({
      type: 'error',
      title: 'Error loading subscriptions',
    })
  } finally {
    loading.value = false
  }
}

const pullMessages = async (subscription: PubSubSubscription, retryCount = 0) => {
  if (!currentProjectId.value || pullingMessages.value.has(subscription.name)) return

  pullingMessages.value.add(subscription.name)
  const subscriptionDisplayName = getSubscriptionDisplayName(subscription.name)
  const startTime = Date.now()

  // Progress indicators
  const warningTimer1 = setTimeout(() => {
    appStore.showToast({
      type: 'info',
      title: 'Still pulling messages...',
      message: 'This is taking longer than usual, please wait.',
      duration: 5000,
    })
  }, 30000) // 30 seconds

  const warningTimer2 = setTimeout(() => {
    appStore.showToast({
      type: 'warning',
      title: 'Pull operation in progress',
      message: 'This can take up to 3 minutes. Please be patient.',
      duration: 8000,
    })
  }, 60000) // 1 minute

  try {
    const pullRequest: PullRequest = {
      subscription: subscription.name,
      maxMessages: 1000,
    }

    // Create abort controller for timeout (longer than HTTP timeout)
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 320000) // 5.3 minute timeout (slightly longer than HTTP)

    const response = (await Promise.race([
      subscriptionsApi.pullMessages(currentProjectId.value, subscriptionDisplayName, pullRequest),
      new Promise((_, reject) => {
        abortController.signal.addEventListener('abort', () => {
          reject(new Error('Pull operation timed out after 3 minutes'))
        })
      }),
    ])) as any

    clearTimeout(timeoutId)

    const duration = Math.round((Date.now() - startTime) / 1000)
    const receivedMessages = response.receivedMessages || []
    pulledMessages.value.set(subscription.name, receivedMessages)

    if (receivedMessages.length > 0) {
      appStore.showToast({
        type: 'success',
        title: `Pulled ${receivedMessages.length} message(s)`,
        message: `Completed in ${duration}s`,
      })
    } else {
      appStore.showToast({
        type: 'info',
        title: 'No messages available to pull',
        message: `Completed in ${duration}s`,
      })
    }
  } catch (err: any) {
    const duration = Math.round((Date.now() - startTime) / 1000)

    // Handle timeout specifically
    if (err.message?.includes('timed out') || err.name === 'AbortError') {
      if (retryCount < 2) {
        // Allow 2 retries
        appStore.showToast({
          type: 'warning',
          title: 'Pull timed out, retrying...',
          message: `Attempt ${retryCount + 2} of 3`,
        })
        clearTimeout(warningTimer1)
        clearTimeout(warningTimer2)
        pullingMessages.value.delete(subscription.name)
        return pullMessages(subscription, retryCount + 1)
      } else {
        appStore.showToast({
          type: 'error',
          title: 'Pull operation failed',
          message: `Timed out after ${duration}s. Try reducing maxMessages or check emulator performance.`,
        })
      }
    } else {
      error.value = err.response?.data?.message || err.message || 'Failed to pull messages'
      appStore.showToast({
        type: 'error',
        title: 'Error pulling messages',
        message: `Failed after ${duration}s: ${error.value}`,
      })
    }
  } finally {
    // Clear all timers
    clearTimeout(warningTimer1)
    clearTimeout(warningTimer2)
    pullingMessages.value.delete(subscription.name)
  }
}

const acknowledgePulledMessages = async (subscriptionName: string) => {
  if (!currentProjectId.value || acknowledgingMessages.value.has(subscriptionName)) return

  const messages = pulledMessages.value.get(subscriptionName)
  if (!messages || messages.length === 0) return

  acknowledgingMessages.value.add(subscriptionName)

  try {
    const subscriptionDisplayName = getSubscriptionDisplayName(subscriptionName)
    const ackIds = messages.map(msg => msg.ackId)

    await subscriptionsApi.acknowledgeMessages(
      currentProjectId.value,
      subscriptionDisplayName,
      ackIds
    )

    // Clear pulled messages after acknowledgment
    pulledMessages.value.set(subscriptionName, [])

    appStore.showToast({
      type: 'success',
      title: `Acknowledged ${ackIds.length} message(s)`,
    })

    // Refresh subscription data to update message count
    await loadSubscriptions()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to acknowledge messages'
    appStore.showToast({
      type: 'error',
      title: 'Error acknowledging messages',
    })
  } finally {
    acknowledgingMessages.value.delete(subscriptionName)
  }
}

const acknowledgeIndividualMessage = async (subscriptionName: string, ackId: string) => {
  if (!currentProjectId.value || acknowledgingMessages.value.has(subscriptionName)) return

  acknowledgingMessages.value.add(subscriptionName)

  try {
    const subscriptionDisplayName = getSubscriptionDisplayName(subscriptionName)

    await subscriptionsApi.acknowledgeMessages(currentProjectId.value, subscriptionDisplayName, [
      ackId,
    ])

    // Remove the acknowledged message from pulled messages
    const messages = pulledMessages.value.get(subscriptionName) || []
    const updatedMessages = messages.filter(msg => msg.ackId !== ackId)
    pulledMessages.value.set(subscriptionName, updatedMessages)

    appStore.showToast({
      type: 'success',
      title: 'Message acknowledged',
    })

    // Refresh subscription data to update message count
    await loadSubscriptions()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to acknowledge message'
    appStore.showToast({
      type: 'error',
      title: 'Error acknowledging message',
    })
  } finally {
    acknowledgingMessages.value.delete(subscriptionName)
  }
}

// Removed unused function openSubscriptionDetails

const deleteSubscription = async (subscription: PubSubSubscription) => {
  subscriptionToDelete.value = subscription
  showDeleteSubscriptionModal.value = true
}

const confirmDeleteSubscription = async () => {
  if (!subscriptionToDelete.value || !currentProjectId.value || isDeletingSubscription.value) {
    return
  }

  const subscription = subscriptionToDelete.value
  const subscriptionDisplayName = getSubscriptionDisplayName(subscription.name)

  isDeletingSubscription.value = true
  try {
    console.log('Attempting to delete subscription:', subscriptionDisplayName)
    await subscriptionsApi.deleteSubscription(currentProjectId.value, subscriptionDisplayName)
    console.log('Delete API call successful')

    appStore.showToast({
      type: 'success',
      title: 'Subscription Deleted',
      message: `Subscription "${subscriptionDisplayName}" deleted successfully`,
    })

    // Remove from local array immediately for better UX
    subscriptions.value = subscriptions.value.filter(
      sub => getSubscriptionDisplayName(sub.name) !== subscriptionDisplayName
    )

    // Refresh subscriptions list from API
    await loadSubscriptions({ preserveExpandedTopics: true })
  } catch (error: any) {
    console.error('Error deleting subscription:', error)

    // Try to remove locally anyway if it's a 404 (subscription doesn't exist)
    if (error.response?.status === 404) {
      subscriptions.value = subscriptions.value.filter(
        sub => getSubscriptionDisplayName(sub.name) !== subscriptionDisplayName
      )
      appStore.showToast({
        type: 'info',
        title: 'Subscription Removed',
        message: `Subscription "${subscriptionDisplayName}" was already deleted or doesn't exist`,
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete subscription: ${error.message || 'Unknown error'}`,
      })
    }
  } finally {
    isDeletingSubscription.value = false
    showDeleteSubscriptionModal.value = false
    subscriptionToDelete.value = null
  }
}

const cancelDeleteSubscription = () => {
  showDeleteSubscriptionModal.value = false
  subscriptionToDelete.value = null
}

const toggleTopicExpansion = (topicName: string) => {
  if (expandedTopics.value.has(topicName)) {
    expandedTopics.value.delete(topicName)
  } else {
    expandedTopics.value.add(topicName)
  }
}

const isTopicExpanded = (topicName: string) => {
  return expandedTopics.value.has(topicName)
}

const selectSubscriptionAndOpenModal = async (subscription: PubSubSubscription) => {
  selectedSubscription.value = subscription

  // Open the modal first, then pull messages (so user sees loading state)
  showSubscriptionMessagesModal.value = true

  // Automatically pull messages when opening the modal
  await pullMessages(subscription)
}

const handleModalPullMessages = async () => {
  if (selectedSubscription.value) {
    await pullMessages(selectedSubscription.value)
  }
}

// Handle URL hash for topic focus
const handleTopicFocus = async () => {
  const hash = route.hash.slice(1) || window.location.hash.slice(1) // Remove # from hash
  await handleTopicFocusUtil(
    hash,
    subscriptionsByTopic.value,
    expandedTopics.value,
    getTopicDisplayName
  )
}

// Watchers
watch(
  () => currentProjectId.value,
  (newProjectId, oldProjectId) => {
    if (newProjectId !== oldProjectId && newProjectId) {
      loadSubscriptions()
    }
  },
  { immediate: true }
)

// Watch for subscriptions data changes to handle topic focus
watch(
  () => subscriptionsByTopic.value.size,
  newSize => {
    if (newSize > 0) {
      handleTopicFocus()
    }
  }
)

// Watch for route hash changes
watch(
  () => route.hash,
  newHash => {
    if (newHash && subscriptionsByTopic.value.size > 0) {
      handleTopicFocus()
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  if (currentProjectId.value) {
    loadSubscriptions()
  }
})
</script>
