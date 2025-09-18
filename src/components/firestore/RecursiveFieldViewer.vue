<template>
  <div
    class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
  >
    <div class="flex items-center min-w-0 flex-1">
      <!-- Collapsible button for maps/arrays -->
      <button
        v-if="fieldType === 'map' || fieldType === 'array'"
        @click="toggleExpanded"
        class="p-0.5 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
      >
        <ChevronRightIcon
          :class="[
            'w-3 h-3 transition-transform duration-200',
            isExpanded ? 'rotate-90' : ''
          ]"
        />
      </button>
      <div v-else class="w-4 mr-1"></div>

      <span class="text-blue-600 dark:text-blue-400 font-mono mr-1">{{ fieldName }}:</span>

      <!-- For non-map/array fields, show the value -->
      <span
        v-if="fieldType !== 'map' && fieldType !== 'array'"
        class="text-gray-900 dark:text-white font-mono truncate"
      >
        "{{ formatFieldValue(fieldValue) }}"
      </span>
      <!-- For map fields, show map indicator -->
      <span
        v-else-if="fieldType === 'map'"
        class="text-gray-500 dark:text-gray-400 font-mono text-xs"
      >
        {{ Object.keys(fieldValue.mapValue.fields || {}).length }} fields
      </span>
      <!-- For array fields, show array indicator -->
      <span
        v-else-if="fieldType === 'array'"
        class="text-gray-500 dark:text-gray-400 font-mono text-xs"
      >
        {{ (fieldValue.arrayValue.values || []).length }} items
      </span>
    </div>

    <!-- Hover Actions -->
    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ fieldType }}</span>
      <button
        v-if="fieldType === 'map' || fieldType === 'array'"
        @click="fieldType === 'map' ? handleAddToMap() : handleAddToArray()"
        class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
        :title="fieldType === 'map' ? 'Add field to map' : 'Add item to array'"
      >
        <PlusIcon class="w-3 h-3" />
      </button>
      <button
        v-else
        @click="handleEditField()"
        class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
        title="Edit field"
      >
        <PencilIcon class="w-3 h-3" />
      </button>
      <button
        @click="handleDeleteField()"
        class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors duration-150"
        title="Delete field"
      >
        <TrashIcon class="w-3 h-3" />
      </button>
    </div>
  </div>

  <!-- Recursive nested content for maps -->
  <div
    v-if="fieldType === 'map' && isExpanded && fieldValue.mapValue.fields"
    class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
  >
    <RecursiveFieldViewer
      v-for="(nestedValue, nestedFieldName) in fieldValue.mapValue.fields"
      :key="nestedFieldName"
      :field-name="nestedFieldName"
      :field-value="nestedValue"
      :field-path="`${fieldPath}.${nestedFieldName}`"
      :expanded-fields="expandedFields"
      @toggle-field="$emit('toggle-field', $event)"
      @edit-field="$emit('edit-field', $event)"
      @delete-field="$emit('delete-field', $event)"
      @add-to-map="$emit('add-to-map', $event)"
      @add-to-array="$emit('add-to-array', $event)"
    />
  </div>

  <!-- Recursive nested content for arrays -->
  <div
    v-if="fieldType === 'array' && isExpanded && fieldValue.arrayValue.values"
    class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
  >
    <RecursiveFieldViewer
      v-for="(arrayItem, arrayIndex) in fieldValue.arrayValue.values"
      :key="arrayIndex"
      :field-name="`[${arrayIndex}]`"
      :field-value="arrayItem"
      :field-path="`${fieldPath}[${arrayIndex}]`"
      :expanded-fields="expandedFields"
      @toggle-field="$emit('toggle-field', $event)"
      @edit-field="$emit('edit-field', $event)"
      @delete-field="$emit('delete-field', $event)"
      @add-to-map="$emit('add-to-map', $event)"
      @add-to-array="$emit('add-to-array', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

interface Props {
  fieldName: string
  fieldValue: any
  fieldPath: string
  expandedFields: Set<string>
}

interface Emits {
  'toggle-field': [fieldPath: string]
  'edit-field': [data: { path: string, fieldName: string, fieldValue: any }]
  'delete-field': [data: { path: string, displayName: string }]
  'add-to-map': [fieldPath: string]
  'add-to-array': [fieldPath: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed
const fieldType = computed((): string => {
  const value = props.fieldValue
  if (value.stringValue !== undefined) return 'string'
  if (value.integerValue !== undefined) return 'number'
  if (value.booleanValue !== undefined) return 'boolean'
  if (value.timestampValue !== undefined) return 'timestamp'
  if (value.arrayValue !== undefined) return 'array'
  if (value.mapValue !== undefined) return 'map'
  if (value.referenceValue !== undefined) return 'reference'
  if (value.geoPointValue !== undefined) return 'geopoint'
  if (value.bytesValue !== undefined) return 'bytes'
  if (value.nullValue !== undefined) return 'null'
  return 'unknown'
})

const isExpanded = computed((): boolean => {
  return props.expandedFields.has(props.fieldPath)
})

// Methods
const formatFieldValue = (value: any): string => {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return value.integerValue
  if (value.booleanValue !== undefined) return value.booleanValue.toString()
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.referenceValue !== undefined) return value.referenceValue
  if (value.geoPointValue !== undefined) return `${value.geoPointValue.latitude}, ${value.geoPointValue.longitude}`
  if (value.bytesValue !== undefined) return value.bytesValue
  if (value.nullValue !== undefined) return 'null'
  return JSON.stringify(value, null, 2)
}

const toggleExpanded = () => {
  emit('toggle-field', props.fieldPath)
}

const handleEditField = () => {
  emit('edit-field', {
    path: props.fieldPath,
    fieldName: props.fieldName,
    fieldValue: props.fieldValue
  })
}

const handleDeleteField = () => {
  emit('delete-field', {
    path: props.fieldPath,
    displayName: props.fieldPath
  })
}

const handleAddToMap = () => {
  emit('add-to-map', props.fieldPath)
}

const handleAddToArray = () => {
  emit('add-to-array', props.fieldPath)
}
</script>