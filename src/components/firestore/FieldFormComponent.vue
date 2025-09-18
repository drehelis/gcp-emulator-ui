<template>
  <div class="space-y-4">
    <!-- Horizontal Field Editor Layout -->
    <div class="grid grid-cols-12 gap-4 items-start">
      <!-- Field Name (hidden for array items) -->
      <div v-if="!isArrayItem" class="col-span-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Field Name</label>
        <input
          v-if="mode === 'add'"
          v-model="localFieldName"
          @input="$emit('update:fieldName', localFieldName)"
          type="text"
          placeholder="Field name"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <input
          v-else
          :value="fieldName"
          type="text"
          readonly
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
      </div>

      <!-- Field Type Dropdown -->
      <div :class="isArrayItem ? 'col-span-4' : 'col-span-3'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Field Type</label>
        <select
          v-model="localFieldType"
          @change="handleTypeChange"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="null">Null</option>
          <option value="timestamp">Timestamp</option>
          <option value="map">Map</option>
          <option value="array">Array</option>
          <option value="geopoint">GeoPoint</option>
          <option value="reference">Reference</option>
        </select>
      </div>

      <!-- Field Value Input (for simple types only) -->
      <div v-if="localFieldType !== 'map' && localFieldType !== 'array'" :class="isArrayItem ? 'col-span-8' : 'col-span-5'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Field Value</label>

        <!-- String -->
        <textarea
          v-if="localFieldType === 'string'"
          v-model="localFieldValue"
          @input="updateValue"
          placeholder="Enter string value"
          rows="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
        />

        <!-- Number -->
        <input
          v-else-if="localFieldType === 'number'"
          v-model.number="localFieldValue"
          @input="updateValue"
          type="number"
          step="any"
          placeholder="Enter number"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <!-- Boolean -->
        <select
          v-else-if="localFieldType === 'boolean'"
          v-model="localFieldValue"
          @change="updateValue"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option :value="true">true</option>
          <option :value="false">false</option>
        </select>

        <!-- Timestamp -->
        <input
          v-else-if="localFieldType === 'timestamp'"
          v-model="localFieldValue"
          @input="updateValue"
          type="datetime-local"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <!-- Null -->
        <div v-else-if="localFieldType === 'null'" class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 italic">
          null
        </div>

        <!-- GeoPoint -->
        <div v-else-if="localFieldType === 'geopoint'" class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model.number="localGeoPoint.latitude"
              @input="updateGeoPoint"
              type="number"
              step="any"
              min="-90"
              max="90"
              placeholder="Latitude (-90 to 90)"
              :class="[
                'px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
                isValidLatitude ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500' : 'border-red-300 dark:border-red-600 focus:ring-red-500'
              ]"
            />
            <input
              v-model.number="localGeoPoint.longitude"
              @input="updateGeoPoint"
              type="number"
              step="any"
              min="-180"
              max="180"
              placeholder="Longitude (-180 to 180)"
              :class="[
                'px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
                isValidLongitude ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500' : 'border-red-300 dark:border-red-600 focus:ring-red-500'
              ]"
            />
          </div>
          <div v-if="!isValidGeoPoint" class="text-xs text-red-600 dark:text-red-400">
            Invalid coordinates: Latitude must be between -90 and 90, Longitude must be between -180 and 180
          </div>
        </div>

        <!-- Reference -->
        <input
          v-else-if="localFieldType === 'reference'"
          v-model="localFieldValue"
          @input="updateValue"
          type="text"
          placeholder="projects/PROJECT_ID/databases/(default)/documents/COLLECTION/DOCUMENT"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>

    <!-- Complex Field Value (Map and Array) - Full Width Below -->
    <div v-if="localFieldType === 'map' || localFieldType === 'array'" class="mt-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Field Value</label>
      <div class="border border-gray-200 dark:border-gray-600 rounded-md">
        <FieldEditor
          :field-name="''"
          :field-value="localFieldValue"
          :path="[]"
          :level="0"
          :can-edit-name="false"
          :hide-type-selector="true"
          :forced-type="localFieldType"
          :hide-delete-button="true"
          :hide-border="true"
          :hide-field-name="true"
          @update="handleFieldEditorUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import FieldEditor from './FieldEditor.vue'

interface Props {
  fieldName?: string
  fieldType?: string
  fieldValue?: any
  mode: 'add' | 'edit'
  fieldPath?: string
}

interface Emits {
  'update:fieldName': [value: string]
  'update:fieldType': [value: string]
  'update:fieldValue': [value: any]
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: '',
  fieldType: 'string',
  fieldValue: '',
  fieldPath: ''
})

const emit = defineEmits<Emits>()

// Computed properties
const isArrayItem = computed(() => {
  return props.mode === 'add' && props.fieldPath?.includes('[new]')
})

// Validation for geopoint
const isValidLatitude = computed(() => {
  const lat = localGeoPoint.value.latitude
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90
})

const isValidLongitude = computed(() => {
  const lng = localGeoPoint.value.longitude
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180
})

const isValidGeoPoint = computed(() => {
  return isValidLatitude.value && isValidLongitude.value
})

// Local reactive state
const localFieldName = ref(props.fieldName)
const localFieldType = ref(props.fieldType)
const localFieldValue = ref(props.fieldValue)
const localGeoPoint = ref({ latitude: 0, longitude: 0 })

// Watch for prop changes
watch(() => props.fieldName, (newVal) => {
  localFieldName.value = newVal
})

watch(() => props.fieldType, (newVal) => {
  localFieldType.value = newVal
})

watch(() => props.fieldValue, (newVal) => {
  localFieldValue.value = newVal
  if (props.fieldType === 'geopoint' && newVal && typeof newVal === 'object') {
    localGeoPoint.value = { ...newVal }
  }
})

// Helper function to get default value for each type
const getDefaultValue = (type: string) => {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'null':
      return null
    case 'timestamp':
      return new Date().toISOString().slice(0, 16)
    case 'geopoint':
      return { latitude: 0, longitude: 0 }
    case 'reference':
      return ''
    case 'map':
      return {}
    case 'array':
      return []
    default:
      return ''
  }
}

// Handlers
const handleTypeChange = () => {
  const defaultValue = getDefaultValue(localFieldType.value)
  localFieldValue.value = defaultValue

  if (localFieldType.value === 'geopoint') {
    localGeoPoint.value = { latitude: 0, longitude: 0 }
  }

  emit('update:fieldType', localFieldType.value)
  emit('update:fieldValue', localFieldValue.value)
}

const updateValue = () => {
  emit('update:fieldValue', localFieldValue.value)
}

const updateGeoPoint = () => {
  localFieldValue.value = { ...localGeoPoint.value }
  emit('update:fieldValue', localFieldValue.value)
}

const handleFieldEditorUpdate = (event: { path: string[], value: any }) => {
  localFieldValue.value = event.value
  emit('update:fieldValue', event.value)
}
</script>