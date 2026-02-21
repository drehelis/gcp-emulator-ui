<template>
  <BaseModal
    v-model="modelValue"
    :title="`Edit ${topic?.name ? getTopicDisplayName(topic.name) : 'Loading...'}`"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading topic details...</span>
    </div>

    <div v-else-if="topic" class="space-y-6">
      <!-- Topic Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Topic Configuration</h3>

        <div class="space-y-4">
          <!-- Topic Name (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic Name
            </label>
            <div
              class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
            >
              {{ getTopicDisplayName(topic.name) }}
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Full path: {{ topic.name }}</p>
          </div>

          <!-- Message Retention -->
          <div>
            <label
              for="retention"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Message Retention Duration
            </label>
            <input
              id="retention"
              v-model="editForm.messageRetentionDuration"
              type="text"
              placeholder="7d (e.g., 1h, 24h, 7d)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
            <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Limitation: Configurable message retention is not supported - emulator retains all
              messages indefinitely
            </p>
          </div>

          <!-- Schema Settings -->
          <div>
            <label class="flex items-center mb-2">
              <input
                v-model="editForm.useSchema"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Avro Schema</span>
            </label>

            <div v-if="editForm.useSchema" class="mt-2">
              <input
                v-model="editForm.schemaName"
                type="text"
                placeholder="Schema name"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Limitation: Only Avro schemas are supported - Protocol Buffers are not supported
                in the emulator
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscriptions Management -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">Subscriptions</h3>
          <button
            @click="addSubscription"
            class="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Add Subscription
          </button>
        </div>

        <div v-if="isLoadingSubscriptions" class="flex items-center justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-sm text-gray-600 dark:text-gray-400"
            >Loading subscriptions...</span
          >
        </div>

        <div
          v-else-if="subscriptions.length === 0 && !showNewSubscriptionForm"
          class="text-center py-4"
        >
          <InboxStackIcon class="mx-auto w-8 h-8 text-gray-400 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">No subscriptions found</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Create a subscription to start receiving messages
          </p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(subscription, index) in subscriptions"
            :key="subscription.name || index"
            class="group w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-green-300 dark:hover:border-green-600"
          >
            <div class="flex items-center justify-between">
              <!-- Left: icon + name + badges -->
              <div class="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                <InboxStackIcon class="h-4 w-4 text-green-500 shrink-0 group-hover:scale-110 group-hover:text-green-600 transition-transform" />

                <div class="flex-1 flex flex-col xl:flex-row xl:items-center justify-between min-w-0 gap-1.5 xl:gap-4">
                  <!-- Name -->
                  <div class="min-w-0 shrink group/name" @click.stop="editSubscription(subscription)">
                    <span class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover/name:text-blue-800 dark:group-hover/name:text-blue-300 group-hover/name:underline transition-colors truncate cursor-pointer">
                      {{ getSubscriptionDisplayName(subscription.name) }}
                      <svg class="w-3 h-3 ml-1 opacity-60 group-hover/name:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                    <p class="text-[11px] leading-tight text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {{ subscription.name }}
                    </p>
                  </div>

                  <!-- Badges -->
                  <div class="flex flex-wrap gap-1.5 text-[11px] shrink-0">
                    <!-- Ack Deadline -->
                    <div class="inline-flex items-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                      <svg class="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="font-medium mr-1">Ack:</span>
                      <span>{{ subscription.ackDeadlineSeconds || 60 }}s</span>
                    </div>

                    <!-- Type -->
                    <div class="inline-flex items-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                      <svg class="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span class="font-medium mr-1">Type:</span>
                      <span>{{ subscription.pushConfig?.pushEndpoint ? 'Push' : subscription.bigqueryConfig ? 'BigQuery' : 'Pull' }}</span>
                    </div>

                    <!-- Ordering -->
                    <div v-if="subscription.enableMessageOrdering" class="inline-flex items-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                      <svg class="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      <span>Ordering</span>
                    </div>

                    <!-- Dead Letter Policy -->
                    <div v-if="subscription.deadLetterPolicy" class="inline-flex items-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600" title="Dead Letter Policy enabled">
                      <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <svg class="w-2.5 h-2.5 -ml-1 -mt-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path fill="white" d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </div>

                    <!-- Retry Policy -->
                    <div v-if="subscription.retryPolicy" class="inline-flex items-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600" :title="`Retry Policy: ${subscription.retryPolicy.minimumBackoff} – ${subscription.retryPolicy.maximumBackoff}`">
                      <svg class="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{{ subscription.retryPolicy.minimumBackoff }} → {{ subscription.retryPolicy.maximumBackoff }}</span>
                    </div>

                    <!-- Filter -->
                    <div v-if="subscription.filter" class="inline-flex items-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600" :title="subscription.filter">
                      <svg class="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                      </svg>
                      <span>Filter</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: actions (fade in on hover) -->
              <div class="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 shrink-0">
                <button
                  @click.stop="openDuplicateSubscriptionModal(subscription)"
                  :disabled="isDuplicatingSubscription || !subscription?.name"
                  class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/40 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Duplicate subscription"
                  aria-label="Duplicate subscription"
                >
                  <DocumentDuplicateIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="showDeleteSubscriptionConfirmation(subscription)"
                  :disabled="isDeletingSubscription || !subscription?.name"
                  class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete subscription"
                  aria-label="Delete subscription"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- New Subscription Form -->
        <div
          v-if="showNewSubscriptionForm"
          class="mt-4 border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800"
        >
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Create New Subscription
          </h4>

          <SubscriptionFormFields
            v-model="newSubscription"
            mode="create"
            :available-topics="availableTopicNames"
          />
        </div>
      </div>
    </div>

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
          'The subscription will be permanently deleted and will stop receiving messages from this topic.',
      }"
      @confirm="deleteSubscription"
      @cancel="cancelDeleteSubscription"
    />
  </BaseModal>

  <EditSubscriptionModal
    v-model="showEditSubscriptionModal"
    :subscription="editingSubscription"
    :project-id="currentProjectId"
    @subscriptions-changed="handleSubscriptionsChanged"
  />

  <Teleport to="body">
    <BaseModal
      v-model="showDuplicateSubscriptionModal"
      title="Duplicate Subscription"
      :icon="DocumentDuplicateIcon"
      icon-color="primary"
      size="md"
      :actions="duplicateModalActions"
      @close="handleDuplicateModalClose"
    >
      <form @submit.prevent="confirmDuplicateSubscription" class="space-y-4">
        <div>
          <label
            for="duplicate-subscription-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Subscription Name
          </label>
          <input
            id="duplicate-subscription-name"
            ref="duplicateSubscriptionNameInput"
            v-model="duplicateSubscriptionName"
            type="text"
            placeholder="Enter name for the duplicated subscription..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            :class="{
              'border-red-300 focus:border-red-500 focus:ring-red-500':
                duplicateSubscriptionNameError,
            }"
            @input="clearDuplicateSubscriptionNameError"
          />
          <p
            v-if="duplicateSubscriptionNameError"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ duplicateSubscriptionNameError }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will create a copy of "{{
              subscriptionToDuplicate
                ? getSubscriptionDisplayName(subscriptionToDuplicate.name)
                : ''
            }}" with the same settings.
          </p>
        </div>
      </form>
    </BaseModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  PlusIcon,
  InboxStackIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import SubscriptionFormFields from '@/components/forms/SubscriptionFormFields.vue'
import EditSubscriptionModal from '@/components/modals/EditSubscriptionModal.vue'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import { useAppStore } from '@/stores/app'
import { useTopicsStore } from '@/stores/topics'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import type { PubSubTopic, PubSubSubscription } from '@/types'
import { getMeaningfulErrorMessage } from '@/utils/errorMessages'
import {
  validateSubscriptionForm,
  validateSubscriptionName,
  normalizeSubscriptionName,
  buildSubscriptionRequest,
  type SubscriptionForm,
} from '@/utils/subscriptionUtils'

const availableTopicNames = computed(() =>
  topicsStore.topics
    .filter(t => t.projectId === currentProjectId.value)
    .map(t => t.fullName)
    .filter(Boolean)
)

interface Props {
  modelValue: boolean
  topicName?: string
  projectId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'topic-updated': []
  'subscriptions-changed': []
}>()

const route = useRoute()
const appStore = useAppStore()
const topicsStore = useTopicsStore()

const isLoading = ref(false)
const isLoadingSubscriptions = ref(false)
const isUpdating = ref(false)
const isCreatingSubscription = ref(false)
const isDeletingSubscription = ref(false)
const isUpdatingSubscription = ref(false)
const isDuplicatingSubscription = ref(false)

const topic = ref<PubSubTopic | null>(null)
const subscriptions = ref<PubSubSubscription[]>([])
const showNewSubscriptionForm = ref(false)
const showEditSubscriptionModal = ref(false)
const editingSubscription = ref<PubSubSubscription | null>(null)
const showDeleteSubscriptionModal = ref(false)
const subscriptionToDelete = ref<PubSubSubscription | null>(null)
const showDuplicateSubscriptionModal = ref(false)
const subscriptionToDuplicate = ref<PubSubSubscription | null>(null)
const duplicateSubscriptionName = ref('')
const duplicateSubscriptionNameError = ref('')
const duplicateSubscriptionNameInput = ref<HTMLInputElement | null>(null)

const editForm = ref({
  messageRetentionDuration: '7d',
  useSchema: false,
  schemaName: '',
})

const newSubscription = ref<SubscriptionForm>({
  name: '',
  deliveryType: 'pull',
  ackDeadlineSeconds: 60,
  enableMessageOrdering: false,
  filter: '',
  enableDeadLetter: false,
  maxDeliveryAttempts: 5,
  enableRetryPolicy: false,
  minimumBackoff: '10s',
  maximumBackoff: '600s',
})

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const currentProjectId = computed(() => props.projectId || (route.params.projectId as string))

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleClose,
    variant: 'secondary',
  },
  {
    label: 'Update',
    handler: handleUpdate,
    variant: 'primary',
    loading: isUpdating.value || isUpdatingSubscription.value,
    disabled: isUpdating.value || isUpdatingSubscription.value,
  },
])

const duplicateModalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleDuplicateModalClose,
    variant: 'secondary',
    disabled: isDuplicatingSubscription.value,
  },
  {
    label: 'Duplicate Subscription',
    handler: confirmDuplicateSubscription,
    variant: 'primary',
    loading: isDuplicatingSubscription.value,
    disabled: !duplicateSubscriptionName.value.trim() || isDuplicatingSubscription.value,
  },
])

const getTopicDisplayName = (fullName: string): string => {
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

const getSubscriptionDisplayName = (fullName: string | undefined): string => {
  if (!fullName) {
    return 'Unknown'
  }

  // Handle different possible formats:
  // 1. Full resource path: projects/project-id/subscriptions/sub-name
  // 2. Just the name: sub-name
  // 3. Other formats

  if (typeof fullName !== 'string') {
    return 'Unknown'
  }

  const parts = fullName.split('/')
  const displayName = parts[parts.length - 1] || fullName

  return displayName
}

const loadTopic = async () => {
  if (!props.topicName || !currentProjectId.value) return

  isLoading.value = true
  try {
    // First, try to get the topic from the store (which may have updated data)
    let topicData = topicsStore.getTopicByName(props.topicName, currentProjectId.value)

    // If not found in store, fetch from API
    if (!topicData) {
      topicData = await topicsApi.getTopic(currentProjectId.value, props.topicName)
      // Add some default values since the emulator response is minimal
      topicData = {
        ...topicData,
        messageRetentionDuration: topicData.messageRetentionDuration || '7d',
        labels: topicData.labels || {},
        messageCount: topicData.messageCount || 0,
        subscriptionsCount: topicData.subscriptionsCount || 0,
        createdAt: topicData.createdAt || new Date(),
        updatedAt: topicData.updatedAt || new Date(),
      }
    }

    topic.value = topicData

    // Populate edit form
    editForm.value = {
      messageRetentionDuration: topicData.messageRetentionDuration || '7d',
      useSchema: !!topicData.schemaSettings,
      schemaName: topicData.schemaSettings?.schema
        ? getTopicDisplayName(topicData.schemaSettings.schema)
        : '',
    }
  } catch (error) {
    console.error('Error loading topic:', error)
    appStore.showToast({
      type: 'error',
      title: 'Error',
      message: 'Failed to load topic details',
    })
  } finally {
    isLoading.value = false
  }
}

const loadSubscriptions = async () => {
  if (!props.topicName || !currentProjectId.value) return

  isLoadingSubscriptions.value = true
  try {
    // Get all subscriptions for the project
    const allSubs = await subscriptionsApi.getSubscriptions(currentProjectId.value)

    // Filter subscriptions for this specific topic
    const topicPath = `projects/${currentProjectId.value}/topics/${props.topicName}`
    const safeAllSubs = Array.isArray(allSubs) ? allSubs : []
    const filteredSubs = safeAllSubs.filter(sub => {
      // Try different possible field names for the topic reference
      const subTopic = sub.topic

      // Check multiple possible matches
      return (
        subTopic === topicPath ||
        subTopic === props.topicName ||
        subTopic?.endsWith(`/topics/${props.topicName}`) ||
        false
      )
    })

    subscriptions.value = filteredSubs

    // Update the topic's subscription count
    if (topic.value) {
      topic.value.subscriptionsCount = filteredSubs.length
    }
  } catch (error) {
    console.error('Error loading subscriptions:', error)
  } finally {
    isLoadingSubscriptions.value = false
  }
}

const saveNewSubscription = async () => {
  if (!topic.value || !currentProjectId.value) return

  // Validate
  const errors = validateSubscriptionForm(newSubscription.value, {
    validateName: true,
    validateBigQuery: true,
  })

  if (Object.keys(errors).length > 0) {
    newSubscription.value.errors = errors

    // Show specific validation errors
    const errorMessages = Object.values(errors)
    const errorMessage =
      errorMessages.length === 1
        ? errorMessages[0]
        : `Validation errors: ${errorMessages.join(', ')}`

    appStore.showToast({
      type: 'error',
      title: 'Validation Error',
      message: errorMessage || 'Validation failed',
      duration: 6000,
    })
    return
  }

  isCreatingSubscription.value = true
  try {
    const subRequest = buildSubscriptionRequest(
      currentProjectId.value,
      topic.value.name,
      newSubscription.value
    )

    await subscriptionsApi.createSubscription(currentProjectId.value, subRequest)

    appStore.showToast({
      type: 'success',
      title: 'Subscription Created',
      message: `Subscription "${newSubscription.value.name}" created successfully`,
    })

    // Refresh subscriptions list
    await loadSubscriptions()
    cancelSubscriptionForm()

    // Emit event to refresh topics list with updated subscription count
    emit('subscriptions-changed')
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    console.error('Error details:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      fullError: error,
    })

    // Handle specific error cases for subscription creation
    if (
      error.response?.status === 409 ||
      error.message?.includes('ALREADY_EXISTS') ||
      error.response?.data?.message?.includes('ALREADY_EXISTS')
    ) {
      appStore.showToast({
        type: 'warning',
        title: 'Subscription Exists',
        message: `A subscription named "${newSubscription.value.name}" already exists for this topic. Please choose a different name.`,
        duration: 8000,
      })
    } else if (error.response?.status === 404 || error.message?.includes('NOT_FOUND')) {
      appStore.showToast({
        type: 'error',
        title: 'Topic Missing',
        message: 'The topic no longer exists. Please refresh the page to see the current state.',
        duration: 6000,
      })
    } else if (error.response?.status === 400) {
      appStore.showToast({
        type: 'error',
        title: 'Invalid Configuration',
        message:
          'The subscription configuration is invalid. Please check your settings and try again.',
        duration: 5000,
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Create Failed',
        message: `Failed to create subscription: ${getMeaningfulErrorMessage(error)}`,
        duration: 5000,
      })
    }
  } finally {
    isCreatingSubscription.value = false
  }
}

const handleUpdate = async () => {
  if (!topic.value || !currentProjectId.value) return

  // If we're creating a new one, handle subscription operations
  if (showNewSubscriptionForm.value) {
    console.log('Calling saveNewSubscription')
    await saveNewSubscription()
    return
  }

  isUpdating.value = true
  try {
    // Prepare update data
    const updateData = {
      labels: {},
      messageRetentionDuration: editForm.value.messageRetentionDuration,
      schemaSettings:
        editForm.value.useSchema && editForm.value.schemaName
          ? {
              schema: `projects/${currentProjectId.value}/schemas/${editForm.value.schemaName}`,
              encoding: 'JSON' as const,
            }
          : undefined,
      // Preserve existing data
      createdAt: topic.value.createdAt,
      messageCount: topic.value.messageCount,
      subscriptionsCount: topic.value.subscriptionsCount,
    }

    // Call the update API
    const updatedTopic = await topicsApi.updateTopic(
      currentProjectId.value,
      getTopicDisplayName(topic.value.name),
      updateData
    )

    // Update the local topic data
    const mergedTopic = { ...topic.value, ...updatedTopic }
    topic.value = mergedTopic

    // Update the topic in the topics store so it persists
    const existingTopics = topicsStore.topics
    const topicIndex = existingTopics.findIndex(
      t =>
        getTopicDisplayName(t.name) === getTopicDisplayName(topic.value!.name) &&
        t.projectId === currentProjectId.value
    )

    if (topicIndex !== -1) {
      // Update existing topic in store
      existingTopics[topicIndex] = mergedTopic
    } else {
      // Add new topic to store if not found
      existingTopics.push(mergedTopic)
    }

    appStore.showToast({
      type: 'success',
      title: 'Topic Updated',
      message: `Topic "${getTopicDisplayName(topic.value.name)}" has been updated successfully`,
    })

    emit('topic-updated')

    // Close the modal after successful update
    modelValue.value = false
  } catch (error) {
    console.error('Error updating topic:', error)
    appStore.showToast({
      type: 'error',
      title: 'Update Failed',
      message: 'Failed to update topic',
    })
  } finally {
    isUpdating.value = false
  }
}

const handleClose = () => {
  if (!isUpdating.value && !isCreatingSubscription.value && !isUpdatingSubscription.value) {
    modelValue.value = false
    showNewSubscriptionForm.value = false
    showEditSubscriptionModal.value = false
    editingSubscription.value = null
  }
}

const editSubscription = (subscription: PubSubSubscription) => {
  editingSubscription.value = subscription
  showEditSubscriptionModal.value = true
}

const handleSubscriptionsChanged = async () => {
  await loadSubscriptions()
  emit('subscriptions-changed')
}

const addSubscription = () => {
  editingSubscription.value = null
  showEditSubscriptionModal.value = false
  showNewSubscriptionForm.value = true
  newSubscription.value = {
    name: '',
    deliveryType: 'pull',
    ackDeadlineSeconds: 60,
    enableMessageOrdering: false,
    filter: '',
    enableDeadLetter: false,
    maxDeliveryAttempts: 5,
    enableRetryPolicy: false,
    minimumBackoff: '10s',
    maximumBackoff: '600s',
  }
}

const openDuplicateSubscriptionModal = (subscription: PubSubSubscription) => {
  subscriptionToDuplicate.value = subscription
  duplicateSubscriptionName.value = normalizeSubscriptionName(
    `${getSubscriptionDisplayName(subscription.name)}-copy`
  )
  duplicateSubscriptionNameError.value = ''
  showDuplicateSubscriptionModal.value = true

  nextTick(() => {
    duplicateSubscriptionNameInput.value?.focus()
  })
}

const confirmDuplicateSubscription = async () => {
  if (!subscriptionToDuplicate.value || !currentProjectId.value) return

  // Capture the name immediately to use in all toast messages
  const targetName = duplicateSubscriptionName.value.trim()

  const nameError = validateSubscriptionName(targetName)
  if (nameError) {
    duplicateSubscriptionNameError.value = nameError
    return
  }

  isDuplicatingSubscription.value = true
  try {
    const source = subscriptionToDuplicate.value
    const deliveryType = source.pushConfig?.pushEndpoint
      ? 'push'
      : source.bigqueryConfig
        ? 'bigquery'
        : 'pull'

    // Map PubSubSubscription to SubscriptionForm
    const subForm: SubscriptionForm = {
      name: targetName,
      deliveryType,
      ackDeadlineSeconds: source.ackDeadlineSeconds || 60,
      enableMessageOrdering: source.enableMessageOrdering || false,
      enableDeadLetter: !!source.deadLetterPolicy,
      enableRetryPolicy: !!source.retryPolicy,
    }

    if (source.filter) subForm.filter = source.filter
    if (source.pushConfig?.pushEndpoint) subForm.pushEndpoint = source.pushConfig.pushEndpoint
    if (source.bigqueryConfig?.table) {
      subForm.bigqueryTable = source.bigqueryConfig.table
      if (source.bigqueryConfig.useTopicSchema !== undefined) subForm.useTopicSchema = source.bigqueryConfig.useTopicSchema
      if (source.bigqueryConfig.writeMetadata !== undefined) subForm.writeMetadata = source.bigqueryConfig.writeMetadata
    }
    
    if (source.deadLetterPolicy) {
      if (source.deadLetterPolicy.deadLetterTopic) subForm.deadLetterTopic = source.deadLetterPolicy.deadLetterTopic
      if (source.deadLetterPolicy.maxDeliveryAttempts) subForm.maxDeliveryAttempts = source.deadLetterPolicy.maxDeliveryAttempts
    }

    if (source.retryPolicy) {
      if (source.retryPolicy.minimumBackoff) subForm.minimumBackoff = source.retryPolicy.minimumBackoff
      if (source.retryPolicy.maximumBackoff) subForm.maximumBackoff = source.retryPolicy.maximumBackoff
    }

    const topicFullName =
      topic.value?.name ||
      source.topicName ||
      (source as { topic?: string }).topic ||
      props.topicName ||
      ''

    const createRequest = buildSubscriptionRequest(
      currentProjectId.value,
      topicFullName,
      subForm
    )

    // Preserve fields that buildSubscriptionRequest doesn't handle natively
    if (source.retainAckedMessages !== undefined) createRequest.retainAckedMessages = source.retainAckedMessages
    if (source.messageRetentionDuration) createRequest.messageRetentionDuration = source.messageRetentionDuration
    if (source.labels) createRequest.labels = source.labels
    
    // Preserve advanced push/bigquery attributes that SubscriptionForm lacks
    if (deliveryType === 'push' && source.pushConfig?.attributes && createRequest.pushConfig) {
      createRequest.pushConfig.attributes = source.pushConfig.attributes
    }
    if (deliveryType === 'bigquery' && source.bigqueryConfig && createRequest.bigqueryConfig) {
      if (source.bigqueryConfig.dropUnknownFields !== undefined) createRequest.bigqueryConfig.dropUnknownFields = source.bigqueryConfig.dropUnknownFields
      if (source.bigqueryConfig.serviceAccountEmail) createRequest.bigqueryConfig.serviceAccountEmail = source.bigqueryConfig.serviceAccountEmail
    }

    await subscriptionsApi.createSubscription(currentProjectId.value, createRequest)

    appStore.showToast({
      type: 'success',
      title: 'Subscription Duplicated',
      message: `Subscription "${targetName}" has been created`,
    })

    await loadSubscriptions()
    emit('subscriptions-changed')
    handleDuplicateModalClose()
  } catch (error: any) {
    if (
      error.response?.status === 409 ||
      error.message?.includes('ALREADY_EXISTS') ||
      error.response?.data?.message?.includes('ALREADY_EXISTS')
    ) {
      appStore.showToast({
        type: 'warning',
        title: 'Subscription Exists',
        message: `A subscription named "${targetName}" already exists. Please choose a different name.`,
        duration: 8000,
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Duplication Failed',
        message: `Failed to duplicate subscription: ${getMeaningfulErrorMessage(error)}`,
        duration: 5000,
      })
    }
  } finally {
    isDuplicatingSubscription.value = false
  }
}

const handleDuplicateModalClose = () => {
  showDuplicateSubscriptionModal.value = false
  subscriptionToDuplicate.value = null
  duplicateSubscriptionName.value = ''
  duplicateSubscriptionNameError.value = ''
  isDuplicatingSubscription.value = false
}

const clearDuplicateSubscriptionNameError = () => {
  duplicateSubscriptionNameError.value = ''
}

const cancelSubscriptionForm = () => {
  showNewSubscriptionForm.value = false
  showEditSubscriptionModal.value = false
  editingSubscription.value = null
  newSubscription.value = {
    name: '',
    deliveryType: 'pull',
    ackDeadlineSeconds: 60,
    enableMessageOrdering: false,
    filter: '',
    enableDeadLetter: false,
    maxDeliveryAttempts: 5,
    enableRetryPolicy: false,
    minimumBackoff: '10s',
    maximumBackoff: '600s',
  }
}

const showDeleteSubscriptionConfirmation = (subscription: PubSubSubscription) => {
  subscriptionToDelete.value = subscription
  showDeleteSubscriptionModal.value = true
}

const deleteSubscription = async () => {
  if (!subscriptionToDelete.value || !currentProjectId.value || isDeletingSubscription.value) {
    return
  }

  isDeletingSubscription.value = true
  try {
    const subscriptionName = getSubscriptionDisplayName(subscriptionToDelete.value.name)
    await subscriptionsApi.deleteSubscription(currentProjectId.value, subscriptionName)
    appStore.showToast({
      type: 'success',
      title: 'Subscription Deleted',
    })

    // Remove from local list immediately and emit to refresh parent
    await loadSubscriptions()
    emit('subscriptions-changed')
  } catch (err: any) {
    appStore.showToast({
      type: 'error',
      title: 'Delete Failed',
      message: `Failed to delete subscription: ${getMeaningfulErrorMessage(err)}`,
      duration: 5000,
    })
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

// Load data when modal opens or props change
watch(
  () => [props.modelValue, props.topicName, currentProjectId.value],
  async ([isOpen]) => {
    if (isOpen && props.topicName) {
      await loadTopic()
      await loadSubscriptions()
    }
  },
  { immediate: true }
)
</script>
