<template>
  <div class="space-y-4">
    <!-- Fields Table -->
    <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <!-- Table Header -->
      <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <div class="grid grid-cols-12 gap-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          <div class="col-span-4">Field Name</div>
          <div class="col-span-4">Type</div>
          <div class="col-span-3">Value</div>
          <div class="col-span-1"></div>
        </div>
      </div>

      <!-- Fields List -->
      <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
        <DocumentField
          v-for="field in fields"
          :key="field.id"
          :field="field"
          @update="updateFieldValue"
          @delete="removeField"
        />
      </div>

      <!-- Add Field Button -->
      <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
        <button
          @click="addField"
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Another Field
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DocumentField from './DocumentField.vue'

interface Field {
  id: string
  name: string
  type: string
  value: any
}

interface Props {
  modelValue: Field[]
  minFields?: number
}

interface Emits {
  'update:modelValue': [fields: Field[]]
}

const props = withDefaults(defineProps<Props>(), {
  minFields: 0
})

const emit = defineEmits<Emits>()

const fields = ref<Field[]>([...props.modelValue])

// Watch for external changes to modelValue
watch(() => props.modelValue, (newFields) => {
  fields.value = [...newFields]
}, { deep: true })

// Watch for internal changes and emit
watch(fields, (newFields) => {
  emit('update:modelValue', [...newFields])
}, { deep: true })

// Methods
const generateFieldId = () => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const addField = () => {
  fields.value.push({
    id: generateFieldId(),
    name: '',
    type: 'string',
    value: ''
  })
}

const updateFieldValue = (fieldId: string, updates: Partial<Field>) => {
  const field = fields.value.find(f => f.id === fieldId)
  if (field) {
    Object.assign(field, updates)
  }
}

const removeField = (fieldId: string) => {
  const index = fields.value.findIndex(f => f.id === fieldId)
  if (index > -1) {
    fields.value.splice(index, 1)

    // Ensure there's always at least minFields fields
    if (fields.value.length < props.minFields) {
      fields.value.push({
        id: generateFieldId(),
        name: '',
        type: 'string',
        value: ''
      })
    }
  }
}

// Initialize with at least minFields if empty
if (fields.value.length < props.minFields) {
  for (let i = fields.value.length; i < props.minFields; i++) {
    addField()
  }
}
</script>
