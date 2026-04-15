<template>
  <BaseModal
    v-model="modelValue"
    title="Edit Bucket"
    size="3xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div v-if="featureStore.storageNotifications" class="space-y-6">
      <div v-if="bucketName" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Current Notification Triggers
        </h3>

        <div v-if="currentNotifications.length > 0" class="space-y-3">
          <div
            v-for="notification in currentNotifications"
            :key="notification.id"
            class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ notification.topic.split('/').pop() }}
                </span>
                <span
                  class="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  ID: {{ notification.id }}
                </span>
              </div>
              <div class="mt-1 flex flex-wrap gap-1.5">
                <span
                  v-for="event in notification.event_types"
                  :key="event"
                  class="px-1.5 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/50"
                >
                  {{ event }}
                </span>
                <span
                  v-if="notification.object_name_prefix"
                  class="px-1.5 py-0.5 text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/50"
                >
                  Prefix: {{ notification.object_name_prefix }}
                </span>
              </div>
            </div>

            <button
              @click="handleDelete(notification)"
              class="ml-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Remove trigger"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-4 italic">
          No notification triggers configured for this bucket
        </p>
      </div>

      <!-- Add New Notification -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
      >
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <PlusIcon class="w-4 h-4 mr-2 text-blue-500" />
          Add New Notification Trigger
        </h3>

        <div class="space-y-5">
          <div>
            <label
              class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2"
            >
              Pub/Sub Topic
            </label>
            <select
              v-model="newForm.topic"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm transition-all"
            >
              <option value="" disabled>Select a topic...</option>
              <option v-for="topic in filteredTopics" :key="topic.name" :value="topic.name">
                {{ topic.name }}
              </option>
            </select>
            <p
              v-if="filteredTopics.length === 0 && availableTopics.length > 0 && !isLoadingTopics"
              class="mt-1 text-xs text-amber-600 dark:text-amber-400"
            >
              All available topics are already configured for this bucket.
            </p>
            <p
              v-else-if="availableTopics.length === 0 && !isLoadingTopics"
              class="mt-1 text-xs text-amber-600 dark:text-amber-400"
            >
              No topics found. Create a topic first in the Pub/Sub section.
            </p>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2"
            >
              Event Types (Optional)
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="option in eventTypeOptions"
                :key="option.value"
                class="flex items-center p-2 rounded-md border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                :class="{
                  'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800':
                    newForm.event_types.includes(option.value),
                }"
              >
                <input
                  type="checkbox"
                  v-model="newForm.event_types"
                  :value="option.value"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="ml-2 text-xs text-gray-700 dark:text-gray-300">{{
                  option.label
                }}</span>
              </label>
            </div>
            <p class="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              Leave all unselected to subscribe to all events
            </p>
          </div>

          <!-- Prefix -->
          <div>
            <label
              class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2"
            >
              Object Name Prefix (Optional)
            </label>
            <input
              v-model="newForm.object_name_prefix"
              type="text"
              placeholder="e.g. uploads"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
            />
          </div>

          <div class="flex justify-end pt-2">
            <button
              @click="handleAdd"
              :disabled="!newForm.topic || isSubmitting"
              class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon v-if="!isSubmitting" class="w-4 h-4 mr-2" />
              <svg v-else class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Add Trigger
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="py-12 flex flex-col items-center justify-center space-y-4">
      <ExclamationTriangleIcon class="w-12 h-12 text-amber-500" />
      <div class="text-center">
        <p class="text-base font-medium text-gray-900 dark:text-white">Feature Not Supported</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This version of the storage emulator does not support notification configurations.
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-model="deleteConfirm.show"
      title="Remove Notification Trigger"
      :message="`Are you sure you want to remove this notification trigger to topic '${deleteConfirm.topicName}'?`"
      confirm-label="Remove"
      :is-loading="deleteConfirm.isDeleting"
      @confirm="executeDelete"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { TrashIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import { usePubSubTopics } from '@/composables/usePubSubTopics'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useFeatureStore } from '@/stores/features'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'

interface Props {
  modelValue: boolean
  bucketName: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const storageStore = useStorageStore()
const projectsStore = useProjectsStore()
const featureStore = useFeatureStore()
const { availableTopics, isLoadingTopics, fetchTopics } = usePubSubTopics()

const isSubmitting = ref(false)

const eventTypeOptions = [
  { value: 'OBJECT_FINALIZE', label: 'Object Finalize' },
  { value: 'OBJECT_DELETE', label: 'Object Delete' },
  { value: 'OBJECT_METADATA_UPDATE', label: 'Metadata Update' },
  { value: 'OBJECT_ARCHIVE', label: 'Object Archive' },
]

const newForm = ref({
  topic: '',
  event_types: [] as string[],
  object_name_prefix: '',
  payload_format: 'JSON_API_V1',
})

const currentNotifications = computed(() => {
  return storageStore.bucketNotifications[props.bucketName] || []
})

const deleteConfirm = ref({
  show: false,
  notificationId: '',
  topicName: '',
  isDeleting: false,
})

const filteredTopics = computed(() => {
  const configuredTopicNames = currentNotifications.value.map(n => n.topic)
  return availableTopics.value.filter(topic => !configuredTopicNames.includes(topic.name))
})

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Done',
    handler: handleClose,
    variant: 'secondary',
  },
])

const loadTopics = async () => {
  await fetchTopics(projectsStore.selectedProjectId)
}

const handleAdd = async () => {
  if (!newForm.value.topic) return

  isSubmitting.value = true
  try {
    const config = {
      topic: newForm.value.topic,
      payload_format: 'JSON_API_V1',
      ...(newForm.value.event_types.length ? { event_types: newForm.value.event_types } : {}),
      ...(newForm.value.object_name_prefix
        ? { object_name_prefix: newForm.value.object_name_prefix }
        : {}),
    }

    await storageStore.createNotification(props.bucketName, config)

    // Reset form
    newForm.value = {
      topic: '',
      event_types: [],
      object_name_prefix: '',
      payload_format: 'JSON_API_V1',
    }
  } catch {
    // Error handled by store toast
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = (notification: any) => {
  deleteConfirm.value = {
    show: true,
    notificationId: notification.id,
    topicName: notification.topic.split('/').pop() || '',
    isDeleting: false,
  }
}

const executeDelete = async () => {
  if (!deleteConfirm.value.notificationId) return

  deleteConfirm.value.isDeleting = true
  try {
    await storageStore.deleteNotification(props.bucketName, deleteConfirm.value.notificationId)
    deleteConfirm.value.show = false
  } catch {
    // Error handled by store toast
  } finally {
    deleteConfirm.value.isDeleting = false
  }
}

const handleClose = () => {
  modelValue.value = false
}

onMounted(() => {
  if (props.modelValue) {
    loadTopics()
  }
})

watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      loadTopics()
    }
  }
)
</script>
