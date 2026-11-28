<template>
  <BaseModal v-model="isOpen" :title="modalTitle" size="3xl" @close="handleClose">
    <FieldFormComponent
      v-if="isOpen"
      :mode="mode"
      :field-name="fieldName"
      :field-type="fieldType"
      :field-value="fieldValue"
      :field-path="fieldPath"
      @update:field-name="fieldName = $event"
      @update:field-type="fieldType = $event"
      @update:field-value="fieldValue = $event"
    />

    <template #footer>
      <button
        type="button"
        @click="handleClose"
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        @click="handleSave"
        :disabled="!isFormValid"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
      >
        {{ mode === 'add' ? 'Add Field' : 'Update' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '../ui/BaseModal.vue'
import FieldFormComponent from './FieldFormComponent.vue'
import { useFirestoreFields } from '@/composables/useFirestoreFields'

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  initialFieldName?: string
  initialFieldType?: string
  initialFieldValue?: any
  // For edit mode - additional context
  fieldPath?: string
  isNewField?: boolean
  parentPath?: string
}

interface Emits {
  'update:modelValue': [value: boolean]
  save: [
    data: {
      fieldName: string
      fieldType: string
      fieldValue: any
      fieldPath?: string
      isNewField?: boolean
      parentPath?: string
    },
  ]
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  initialFieldName: '',
  initialFieldType: 'string',
  initialFieldValue: '',
})

const emit = defineEmits<Emits>()
const { getDefaultValue, parseVectorInput, isValidDecimal128 } = useFirestoreFields()

// Local form state
const fieldName = ref('')
const fieldType = ref('string')
const fieldValue = ref<any>('')

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const modalTitle = computed(() => {
  if (props.mode === 'add') {
    if (props.fieldPath?.includes('[new]')) {
      return 'Add item to array'
    }
    return 'Add field'
  } else {
    return 'Edit field'
  }
})

const isFormValid = computed(() => {
  // Check field name for add mode (except array items)
  if (props.mode === 'add') {
    // Array items don't need field names
    if (!props.fieldPath?.includes('[new]')) {
      if (fieldName.value.trim() === '') {
        return false
      }
    }
  }

  // Check geopoint values
  if (fieldType.value === 'geopoint' && fieldValue.value) {
    const geo = fieldValue.value
    if (typeof geo === 'object' && geo.latitude !== undefined && geo.longitude !== undefined) {
      const lat = Number(geo.latitude)
      const lng = Number(geo.longitude)

      // Validate latitude and longitude ranges
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false
      }
    }
  }

  // Validate Enterprise data types
  if (fieldType.value === 'decimal128') {
    if (!isValidDecimal128(String(fieldValue.value ?? ''))) {
      return false
    }
  }

  if (fieldType.value === 'vector') {
    if (parseVectorInput(fieldValue.value) === null) {
      return false
    }
  }

  return true
})

// Reset form when modal opens
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      resetForm()
    }
  }
)

// Helper functions
const resetForm = () => {
  fieldName.value = props.initialFieldName || ''
  fieldType.value = props.initialFieldType || 'string'
  fieldValue.value =
    props.mode === 'edit' && props.initialFieldValue !== undefined
      ? props.initialFieldValue
      : props.initialFieldValue || getDefaultValue(props.initialFieldType || 'string')
}

// Event handlers
const handleClose = () => {
  isOpen.value = false
  emit('close')
}

const handleSave = () => {
  if (!isFormValid.value) return

  emit('save', {
    fieldName: fieldName.value,
    fieldType: fieldType.value,
    fieldValue: fieldValue.value,
    fieldPath: props.fieldPath,
    isNewField: props.isNewField,
    parentPath: props.parentPath,
  })
}
</script>
