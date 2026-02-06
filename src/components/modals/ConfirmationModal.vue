<template>
  <BaseModal
    v-model="modelValue"
    :title="title"
    :icon="ExclamationTriangleIcon"
    icon-color="warning"
    size="sm"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ message }}
      </p>

      <div v-if="details" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">
          {{ details.title }}
        </p>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          {{ details.description }}
        </p>
      </div>

      <div
        v-if="showWarning"
        class="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
      >
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">Warning</p>
          <p class="text-xs text-red-600 dark:text-red-300 mt-1">This action cannot be undone.</p>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'

interface Props {
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  showWarning?: boolean
  details?: {
    title: string
    description: string
  }
}

interface Emits {
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  isLoading: false,
  showWarning: true,
})

const emit = defineEmits<Emits>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: props.cancelLabel,
    handler: handleCancel,
    variant: 'secondary',
  },
  {
    label: props.confirmLabel,
    handler: handleConfirm,
    variant: 'danger',
    loading: props.isLoading,
    disabled: props.isLoading,
  },
])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  modelValue.value = false
}

const handleClose = () => {
  if (!props.isLoading) {
    handleCancel()
  }
}
</script>
