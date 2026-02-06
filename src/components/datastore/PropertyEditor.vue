<template>
  <div
    class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
  >
    <div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50">
      <button
        @click="expanded = !expanded"
        class="flex items-center text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-1 text-left"
      >
        <ChevronDownIcon v-if="expanded" class="w-4 h-4 mr-2 text-gray-500" />
        <ChevronRightIcon v-else class="w-4 h-4 mr-2 text-gray-500" />
        <span class="truncate">{{ name || 'Unnamed property' }}</span>
        <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">{{ type }}</span>
      </button>

      <button
        @click="$emit('remove')"
        class="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        title="Remove property"
      >
        <TrashIcon class="w-4 h-4" />
      </button>
    </div>

    <div
      v-if="expanded"
      class="p-4 space-y-3 border-t border-gray-200 dark:border-gray-700 animate-fadeIn"
    >
      <!-- Property Name -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="name"
          type="text"
          placeholder="Property name"
          :disabled="readOnly"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <!-- Property Type -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Type
        </label>
        <select
          v-model="type"
          :disabled="readOnly"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="string">String</option>
          <option value="text">Text</option>
          <option value="timestamp">Date and time</option>
          <option value="integer">Integer</option>
          <option value="double">Floating point number</option>
          <option value="boolean">Boolean</option>
          <option value="key">Key</option>
          <option value="geopoint">Geopoint</option>
          <option value="array">Array</option>
          <option value="entity">Embedded entity</option>
          <option value="null">Null</option>
        </select>
      </div>

      <!-- Property Value -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Value
        </label>
        <textarea
          v-if="['string', 'text', 'key', 'array', 'entity'].includes(type)"
          v-model="propertyValue"
          :rows="type === 'array' || type === 'entity' ? 5 : 3"
          :placeholder="getValuePlaceholder(type)"
          :disabled="readOnly"
          class="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <select
          v-else-if="type === 'boolean'"
          v-model="propertyValue"
          :disabled="readOnly"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
        <input
          v-else-if="type !== 'null'"
          v-model="propertyValue"
          :type="getInputType(type)"
          :placeholder="getValuePlaceholder(type)"
          :disabled="readOnly"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div
          v-else
          class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          Null value (no input needed)
        </div>
      </div>

      <!-- Index Setting -->
      <div class="flex items-center pt-2">
        <input
          :id="`index-${propertyId}`"
          v-model="indexed"
          type="checkbox"
          :disabled="readOnly"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label
          :for="`index-${propertyId}`"
          class="ml-2.5 block text-sm text-gray-700 dark:text-gray-300"
        >
          Index this property
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDownIcon, ChevronRightIcon, TrashIcon } from '@heroicons/vue/24/outline'

export interface PropertyForm {
  name: string
  type:
    | 'string'
    | 'text'
    | 'timestamp'
    | 'integer'
    | 'double'
    | 'boolean'
    | 'key'
    | 'geopoint'
    | 'array'
    | 'entity'
    | 'null'
  value: string
  indexed: boolean
  expanded: boolean
}

interface Props {
  property: PropertyForm
  propertyId: string
  readOnly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  remove: []
  update: [property: PropertyForm]
}>()

// Create computed properties with getters and setters to avoid prop mutation

const expanded = computed({
  get: () => props.property.expanded,
  set: (value: boolean) => emit('update', { ...props.property, expanded: value }),
})

const name = computed({
  get: () => props.property.name,
  set: (value: string) => emit('update', { ...props.property, name: value }),
})

const type = computed({
  get: () => props.property.type,
  set: (value: PropertyForm['type']) => emit('update', { ...props.property, type: value }),
})

const propertyValue = computed({
  get: () => props.property.value,
  set: (value: string) => emit('update', { ...props.property, value }),
})

const indexed = computed({
  get: () => props.property.indexed,
  set: (value: boolean) => emit('update', { ...props.property, indexed: value }),
})

const getInputType = (propertyType: string): string => {
  switch (propertyType) {
    case 'integer':
    case 'double':
      return 'number'
    case 'timestamp':
      return 'datetime-local'
    case 'geopoint':
      return 'text'
    default:
      return 'text'
  }
}

const getValuePlaceholder = (propertyType: string): string => {
  switch (propertyType) {
    case 'string':
      return 'Enter string value'
    case 'text':
      return 'Enter text value (long strings, not indexed by default)'
    case 'integer':
      return 'Enter integer value'
    case 'double':
      return 'Enter floating point number'
    case 'timestamp':
      return 'Select date and time'
    case 'key':
      return 'Enter key as JSON, e.g., {"path":[{"kind":"Kind","name":"name"}]}'
    case 'geopoint':
      return 'Enter latitude,longitude e.g., 37.7749,-122.4194'
    case 'array':
      return 'Enter array as JSON, e.g., {"values":[{"stringValue":"item1"},{"stringValue":"item2"}]}'
    case 'entity':
      return 'Enter entity as JSON, e.g., {"properties":{"field":{"stringValue":"value"}}}'
    default:
      return 'Enter value'
  }
}
</script>
