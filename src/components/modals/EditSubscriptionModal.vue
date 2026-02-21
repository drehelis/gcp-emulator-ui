<template>
  <BaseModal
    v-model="modelValue"
    :title="`Edit ${subscription?.name ? getSubscriptionDisplayName(subscription.name) : 'Loading...'}`"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading subscription details...</span>
    </div>

    <div v-else-if="subscription" class="space-y-6">
      <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <SubscriptionFormFields
          v-model="editSubscriptionForm"
          mode="edit"
          read-only-name
          read-only-delivery-type
          read-only-big-query-table
          :available-topics="availableTopics"
        />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import SubscriptionFormFields from '@/components/forms/SubscriptionFormFields.vue'
import { subscriptionsApi } from '@/api/pubsub'
import { useAppStore } from '@/stores/app'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import type { PubSubSubscription } from '@/types'
import { getMeaningfulErrorMessage } from '@/utils/errorMessages'
import { validateSubscriptionForm, type SubscriptionForm } from '@/utils/subscriptionUtils'
import { useTopicsStore } from '@/stores/topics'

interface Props {
  modelValue: boolean
  subscription: PubSubSubscription | null
  projectId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'subscriptions-changed': []
}>()

const appStore = useAppStore()
const topicsStore = useTopicsStore()

const availableTopics = computed(() =>
  topicsStore.topics
    .filter(t => t.projectId === props.projectId)
    .map(t => t.fullName)
    .filter(Boolean)
)

const isLoading = ref(false)
const isUpdating = ref(false)

const editSubscriptionForm = ref<SubscriptionForm>({
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

const currentProjectId = computed(() => props.projectId)

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
    loading: isUpdating.value,
    disabled: isUpdating.value,
  },
])

const getSubscriptionDisplayName = (fullName: string | undefined): string => {
  if (!fullName) return 'Unknown'
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

const handleClose = () => {
  if (!isUpdating.value) {
    modelValue.value = false
  }
}

const handleUpdate = async () => {
  if (!props.subscription || !currentProjectId.value) return

  const isEditingExistingPushSub =
    props.subscription.pushConfig?.pushEndpoint &&
    typeof props.subscription.pushConfig === 'object'
  const existingPushEndpoint =
    isEditingExistingPushSub && props.subscription.pushConfig
      ? props.subscription.pushConfig.pushEndpoint
      : undefined

  const errors = validateSubscriptionForm(editSubscriptionForm.value, {
    skipPushEndpointIfExists: true,
    ...(existingPushEndpoint && { existingPushEndpoint }),
  })

  if (Object.keys(errors).length > 0) {
    editSubscriptionForm.value.errors = errors
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

  isUpdating.value = true
  try {
    const subscriptionName = getSubscriptionDisplayName(props.subscription.name)

    // Delete existing
    await subscriptionsApi.deleteSubscription(currentProjectId.value, subscriptionName)

    // Recreate
    const createRequest: any = {
      name: subscriptionName,
      topic: (props.subscription as any).topic || props.subscription.topicName,
      ackDeadlineSeconds: editSubscriptionForm.value.ackDeadlineSeconds,
      enableMessageOrdering: editSubscriptionForm.value.enableMessageOrdering,
      ...(editSubscriptionForm.value.filter &&
        editSubscriptionForm.value.filter.trim() && { filter: editSubscriptionForm.value.filter.trim() }),
    }

    if (editSubscriptionForm.value.deliveryType === 'push') {
      createRequest.pushConfig = {
        pushEndpoint:
          editSubscriptionForm.value.pushEndpoint ||
          props.subscription.pushConfig?.pushEndpoint ||
          '',
      }
    }

    if (editSubscriptionForm.value.deliveryType === 'bigquery') {
      createRequest.bigqueryConfig = {
        table: editSubscriptionForm.value.bigqueryTable,
        useTopicSchema: editSubscriptionForm.value.useTopicSchema,
        writeMetadata: editSubscriptionForm.value.writeMetadata,
      }
    }

    if (editSubscriptionForm.value.enableDeadLetter) {
      createRequest.deadLetterPolicy = {
        deadLetterTopic: editSubscriptionForm.value.deadLetterTopic,
        maxDeliveryAttempts: editSubscriptionForm.value.maxDeliveryAttempts,
      }
    }

    if (editSubscriptionForm.value.enableRetryPolicy) {
      createRequest.retryPolicy = {
        minimumBackoff: editSubscriptionForm.value.minimumBackoff,
        maximumBackoff: editSubscriptionForm.value.maximumBackoff,
      }
    }

    await subscriptionsApi.createSubscription(currentProjectId.value, createRequest)

    appStore.showToast({
      type: 'success',
      title: 'Subscription Updated',
      message: `Subscription "${editSubscriptionForm.value.name}" updated successfully`,
    })

    emit('subscriptions-changed')
    modelValue.value = false
  } catch (error: any) {
    console.error('Error updating subscription (delete+create):', error)

    if (error.response?.status === 409 || error.message?.includes('ALREADY_EXISTS')) {
      appStore.showToast({
        type: 'warning',
        title: 'Update Blocked',
        message:
          'The subscription could not be updated because it still exists. The delete operation may have failed. Please try refreshing the page and try again.',
        duration: 8000,
      })
    } else if (error.response?.status === 404 || error.message?.includes('NOT_FOUND')) {
      appStore.showToast({
        type: 'error',
        title: 'Topic Missing',
        message: 'The topic no longer exists. Please refresh the page to see the current state.',
        duration: 6000,
      })
    } else {
      appStore.showToast({
        type: 'error',
        title: 'Update Failed',
        message: `Failed to update subscription: ${getMeaningfulErrorMessage(error)}`,
        duration: 5000,
      })
    }
  } finally {
    isUpdating.value = false
  }
}

watch(
  () => [props.modelValue, props.subscription],
  ([isOpen, subscription]) => {
    if (isOpen && subscription && (subscription as PubSubSubscription).name) {
      const sub = subscription as PubSubSubscription
      const displayName = getSubscriptionDisplayName(sub.name)

      let deliveryType: 'pull' | 'push' | 'bigquery' = 'pull'
      if (sub.pushConfig?.pushEndpoint) {
        deliveryType = 'push'
      } else if (sub.bigqueryConfig) {
        deliveryType = 'bigquery'
      }

      editSubscriptionForm.value = {
        name: displayName,
        deliveryType,
        ackDeadlineSeconds: sub.ackDeadlineSeconds || 60,
        enableMessageOrdering: sub.enableMessageOrdering || false,
        filter: sub.filter || '',
        pushEndpoint: sub.pushConfig?.pushEndpoint || '',
        bigqueryTable: sub.bigqueryConfig?.table || '',
        useTopicSchema: sub.bigqueryConfig?.useTopicSchema || false,
        writeMetadata: sub.bigqueryConfig?.writeMetadata || false,
        deadLetterTopic: sub.deadLetterPolicy?.deadLetterTopic || '',
        maxDeliveryAttempts: sub.deadLetterPolicy?.maxDeliveryAttempts || 5,
        minimumBackoff: sub.retryPolicy?.minimumBackoff || '',
        maximumBackoff: sub.retryPolicy?.maximumBackoff || '',
        enableDeadLetter: !!sub.deadLetterPolicy,
        enableRetryPolicy: !!sub.retryPolicy,
      }
    }
  },
  { immediate: true }
)
</script>
