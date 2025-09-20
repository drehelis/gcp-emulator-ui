<template>
  <div>
    <!-- Root level field -->
    <div
      class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      <div class="flex items-center min-w-0 flex-1">
        <!-- Toggle button for map and array fields -->
        <button
          v-if="getFieldType(fieldValue) === 'map' || getFieldType(fieldValue) === 'array'"
          @click="$emit('toggle-field', fieldName)"
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
          v-if="getFieldType(fieldValue) !== 'map' && getFieldType(fieldValue) !== 'array'"
          class="text-gray-900 dark:text-white font-mono truncate"
        >
          "{{ formatFieldValue(fieldValue) }}"
        </span>

        <!-- For map fields, show map indicator -->
        <span
          v-else-if="getFieldType(fieldValue) === 'map'"
          class="text-gray-500 dark:text-gray-400 font-mono text-xs"
        >
          {{ Object.keys(fieldValue.mapValue?.fields || {}).length }} fields
        </span>

        <!-- For array fields, show array indicator -->
        <span
          v-else-if="getFieldType(fieldValue) === 'array'"
          class="text-gray-500 dark:text-gray-400 font-mono text-xs"
        >
          {{ (fieldValue.arrayValue?.values || []).length }} items
        </span>
      </div>

      <!-- Hover Actions -->
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ getFieldType(fieldValue) }}</span>
        <button
          v-if="getFieldType(fieldValue) === 'map' || getFieldType(fieldValue) === 'array'"
          @click="getFieldType(fieldValue) === 'map' ? $emit('add-to-map', fieldPath) : $emit('add-to-array', fieldPath)"
          class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
          :title="getFieldType(fieldValue) === 'map' ? 'Add field to map' : 'Add item to array'"
        >
          <PlusIcon class="w-3 h-3" />
        </button>
        <button
          v-else
          @click="$emit('edit-field', { path: fieldPath, fieldName, fieldValue })"
          class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
          title="Edit field"
        >
          <PencilIcon class="w-3 h-3" />
        </button>
        <button
          @click="$emit('delete-field', { path: fieldPath, displayName: fieldName })"
          class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors duration-150"
          title="Delete field"
        >
          <TrashIcon class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Expanded map fields -->
    <div
      v-if="getFieldType(fieldValue) === 'map' && isExpanded"
      class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
    >
      <template
        v-for="(subValue, subFieldName) in (fieldValue.mapValue?.fields || {})"
        :key="`${fieldName}.${subFieldName}`"
      >
        <FieldItem
          :field-name="subFieldName"
          :field-value="subValue"
          :field-path="`${fieldPath}.${subFieldName}`"
          :expanded-fields="expandedFields"
          @toggle-field="$emit('toggle-field', $event)"
          @edit-field="$emit('edit-field', $event)"
          @delete-field="$emit('delete-field', $event)"
          @add-to-map="$emit('add-to-map', $event)"
          @add-to-array="$emit('add-to-array', $event)"
        />
      </template>
    </div>

    <!-- Expanded array fields -->
    <div
      v-if="getFieldType(fieldValue) === 'array' && isExpanded"
      class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
    >
      <FieldItem
        v-for="(arrayItem, arrayIndex) in (fieldValue.arrayValue?.values || [])"
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRightIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { formatFieldValue, getFieldType } from '@/utils/firestoreHelpers'

interface Props {
  fieldName: string
  fieldValue: any
  fieldPath: string
  expandedFields: Set<string>
}

const props = defineProps<Props>()

defineEmits<{
  'toggle-field': [fieldName: string]
  'edit-field': [data: any]
  'delete-field': [data: any]
  'add-to-map': [fieldPath: string]
  'add-to-array': [fieldPath: string]
}>()

const isExpanded = computed(() => {
  return props.expandedFields.has(props.fieldPath)
})
</script>