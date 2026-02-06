<template>
  <BaseModal
    v-model="modelValue"
    title="Create Topic"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-4 sm:space-y-6">
      <!-- Topic Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
          Topic Configuration
        </h3>

        <div class="space-y-3 sm:space-y-4">
          <!-- Topic Name -->
          <div>
            <label
              for="topic-name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Topic Name *
            </label>
            <input
              id="topic-name"
              ref="topicNameInput"
              v-model="topicForm.name"
              type="text"
              placeholder="Enter topic name (e.g., my-topic)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              :class="{
                'border-red-300 focus:border-red-500 focus:ring-red-500': topicErrors.name,
              }"
              @input="clearTopicError('name')"
            />
            <p v-if="topicErrors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ topicErrors.name }}
            </p>
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
              v-model="topicForm.messageRetentionDuration"
              type="text"
              placeholder="7d (e.g., 1h, 24h, 7d)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: Emulator retains all messages indefinitely regardless of this setting
            </p>
          </div>

          <!-- Schema Settings -->
          <div>
            <label class="flex items-center">
              <input
                v-model="topicForm.useSchema"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Avro Schema</span>
            </label>

            <div v-if="topicForm.useSchema" class="mt-2">
              <input
                v-model="topicForm.schemaName"
                type="text"
                placeholder="Schema name (optional)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only Avro schemas are supported in the emulator
              </p>
            </div>
          </div>

          <!-- Labels -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Labels (Optional)
            </label>
            <div class="space-y-2">
              <div
                v-for="(label, index) in topicForm.labels"
                :key="index"
                class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2"
              >
                <input
                  v-model="label.key"
                  type="text"
                  placeholder="Key"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <input
                  v-model="label.value"
                  type="text"
                  placeholder="Value"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <button
                  @click="removeTopicLabel(index)"
                  class="p-2 text-gray-400 hover:text-red-500 transition-colors self-start sm:self-auto"
                >
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
              <button
                @click="addTopicLabel"
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                + Add Label
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0"
        >
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">
            Create Subscriptions (Optional)
          </h3>
          <button
            @click="addSubscription"
            class="inline-flex items-center justify-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Add Subscription
          </button>
        </div>

        <div v-if="subscriptions.length === 0" class="text-center py-4">
          <InboxStackIcon class="mx-auto w-8 h-8 text-gray-400 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">No subscriptions added</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            You can add subscriptions later if needed
          </p>
        </div>

        <div v-else class="space-y-3 sm:space-y-4">
          <div
            v-for="(subscription, index) in subscriptions"
            :key="index"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                Subscription {{ index + 1 }}
              </h4>
              <button
                @click="removeSubscription(index)"
                class="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <SubscriptionFormFields
              :model-value="subscription"
              mode="create"
              @update:model-value="value => (subscriptions[index] = value)"
            />
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { XMarkIcon, PlusIcon, InboxStackIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import SubscriptionFormFields from '@/components/forms/SubscriptionFormFields.vue'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import { useAppStore } from '@/stores/app'
import type { ModalAction } from '@/components/ui/BaseModal.vue'

interface Props {
  modelValue: boolean
}

interface TopicLabel {
  key: string
  value: string
}

interface SubscriptionForm {
  name: string
  deliveryType: 'pull' | 'push' | 'bigquery'
  pushEndpoint?: string
  bigqueryTable?: string
  useTopicSchema?: boolean
  writeMetadata?: boolean
  ackDeadlineSeconds: number
  enableMessageOrdering: boolean
  filter?: string
  useDeadLetter?: boolean
  deadLetterTopic?: string
  maxDeliveryAttempts?: number
  useRetryPolicy?: boolean
  minimumBackoff?: string
  maximumBackoff?: string
  errors?: Record<string, string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'topic-created': []
}>()

const route = useRoute()
const appStore = useAppStore()

const topicNameInput = ref<HTMLInputElement>()
const isSubmitting = ref(false)

const topicForm = ref({
  name: '',
  messageRetentionDuration: '7d',
  useSchema: false,
  schemaName: '',
  labels: [{ key: '', value: '' }] as TopicLabel[],
})

const topicErrors = ref<Record<string, string>>({})

const subscriptions = ref<SubscriptionForm[]>([])

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const currentProjectId = computed(() => route.params.projectId as string)

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleClose,
    variant: 'secondary',
  },
  {
    label: `Create Topic${subscriptions.value.length > 0 ? ` & ${subscriptions.value.length} Subscription${subscriptions.value.length > 1 ? 's' : ''}` : ''}`,
    handler: handleSubmit,
    variant: 'primary',
    loading: isSubmitting.value,
    disabled: !topicForm.value.name.trim() || isSubmitting.value,
  },
])

const validateTopicName = (name: string): string => {
  if (!name.trim()) {
    return 'Topic name is required'
  }

  if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(name)) {
    return 'Topic name must start with a letter and contain only letters, numbers, hyphens, and underscores'
  }

  if (name.length > 255) {
    return 'Topic name must be less than 255 characters'
  }

  return ''
}

const validateSubscription = (subscription: SubscriptionForm): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!subscription.name.trim()) {
    errors.name = 'Subscription name is required'
  } else if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(subscription.name)) {
    errors.name =
      'Subscription name must start with a letter and contain only letters, numbers, hyphens, and underscores'
  }

  if (subscription.deliveryType === 'push' && !subscription.pushEndpoint?.trim()) {
    errors.pushEndpoint = 'Push endpoint is required for push subscriptions'
  }

  if (subscription.deliveryType === 'bigquery' && !subscription.bigqueryTable?.trim()) {
    errors.bigqueryTable = 'BigQuery table is required for BigQuery subscriptions'
  }

  return errors
}

const handleSubmit = async () => {
  const nameError = validateTopicName(topicForm.value.name)
  if (nameError) {
    topicErrors.value.name = nameError
    return
  }

  // Validate subscriptions
  let hasSubscriptionErrors = false
  subscriptions.value.forEach(sub => {
    const errors = validateSubscription(sub)
    sub.errors = errors
    if (Object.keys(errors).length > 0) {
      hasSubscriptionErrors = true
    }
  })

  if (hasSubscriptionErrors) {
    return
  }

  isSubmitting.value = true

  try {
    // Prepare topic data
    const labels = topicForm.value.labels
      .filter(label => label.key.trim() && label.value.trim())
      .reduce(
        (acc, label) => {
          acc[label.key.trim()] = label.value.trim()
          return acc
        },
        {} as Record<string, string>
      )

    const topicRequest = {
      name: topicForm.value.name.trim(),
      messageRetentionDuration: topicForm.value.messageRetentionDuration,
      ...(Object.keys(labels).length > 0 && { labels }),
      ...(topicForm.value.useSchema &&
        topicForm.value.schemaName && {
          schemaSettings: {
            schema: `projects/${currentProjectId.value}/schemas/${topicForm.value.schemaName}`,
            encoding: 'JSON' as const,
          },
        }),
    }

    // Create topic
    await topicsApi.createTopic(currentProjectId.value, topicRequest)

    // Create subscriptions
    for (const subscription of subscriptions.value) {
      const subRequest = {
        name: subscription.name.trim(),
        topic: `projects/${currentProjectId.value}/topics/${topicForm.value.name.trim()}`,
        ackDeadlineSeconds: subscription.ackDeadlineSeconds,
        enableMessageOrdering: subscription.enableMessageOrdering,
        ...(subscription.filter &&
          subscription.filter.trim() && { filter: subscription.filter.trim() }),
        pushConfig:
          subscription.deliveryType === 'push'
            ? {
                pushEndpoint: subscription.pushEndpoint,
              }
            : undefined,
        bigqueryConfig:
          subscription.deliveryType === 'bigquery'
            ? {
                table: subscription.bigqueryTable,
                useTopicSchema: subscription.useTopicSchema,
                writeMetadata: subscription.writeMetadata,
              }
            : undefined,
        deadLetterPolicy: subscription.useDeadLetter
          ? {
              deadLetterTopic: subscription.deadLetterTopic
                ? `projects/${currentProjectId.value}/topics/${subscription.deadLetterTopic}`
                : undefined,
              maxDeliveryAttempts: subscription.maxDeliveryAttempts || 5,
            }
          : undefined,
        retryPolicy: subscription.useRetryPolicy
          ? {
              minimumBackoff: subscription.minimumBackoff || '1s',
              maximumBackoff: subscription.maximumBackoff || '600s',
            }
          : undefined,
      }

      await subscriptionsApi.createSubscription(currentProjectId.value, subRequest)
    }

    appStore.showToast({
      type: 'success',
      title: 'Resources Created',
      message: `Topic "${topicForm.value.name}" ${subscriptions.value.length > 0 ? `and ${subscriptions.value.length} subscription${subscriptions.value.length > 1 ? 's' : ''} ` : ''}created successfully`,
    })

    // Close modal and emit success
    modelValue.value = false
    emit('topic-created')
    resetForm()
  } catch (err: any) {
    console.error('Error creating topic/subscriptions:', err)
    appStore.showToast({
      type: 'error',
      title: 'Creation Failed',
      message: err.message || 'Failed to create topic and subscriptions',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  if (!isSubmitting.value) {
    modelValue.value = false
    resetForm()
  }
}

const resetForm = () => {
  topicForm.value = {
    name: '',
    messageRetentionDuration: '7d',
    useSchema: false,
    schemaName: '',
    labels: [{ key: '', value: '' }],
  }
  topicErrors.value = {}
  subscriptions.value = []
  isSubmitting.value = false
}

const clearTopicError = (field: string) => {
  if (topicErrors.value[field]) {
    delete topicErrors.value[field]
  }
}

const addTopicLabel = () => {
  topicForm.value.labels.push({ key: '', value: '' })
}

const removeTopicLabel = (index: number) => {
  topicForm.value.labels.splice(index, 1)
}

const addSubscription = () => {
  subscriptions.value.push({
    name: '',
    deliveryType: 'pull',
    ackDeadlineSeconds: 60,
    enableMessageOrdering: false,
    useDeadLetter: false,
    maxDeliveryAttempts: 5,
    useRetryPolicy: false,
    minimumBackoff: '1s',
    maximumBackoff: '600s',
    useTopicSchema: false,
    writeMetadata: false,
  })
}

const removeSubscription = (index: number) => {
  subscriptions.value.splice(index, 1)
}

// Focus input when modal opens
watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen) {
      await nextTick()
      topicNameInput.value?.focus()
    }
  }
)
</script>
