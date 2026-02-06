<template>
  <div class="p-4" :class="{ 'bg-gray-50 dark:bg-gray-700/30': level > 0 }">
    <div class="flex items-start gap-3">
      <!-- Field Name -->
      <div class="flex-1 min-w-0">
        <div v-if="!hideFieldName" class="flex items-center gap-2 mb-2">
          <span v-if="level > 0" class="text-xs text-gray-400 font-mono">{{ path.join('.') }}</span>
          <input
            v-if="canEditName"
            v-model="localFieldName"
            @blur="updateFieldName"
            type="text"
            placeholder="Field name"
            class="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          />
          <span v-else class="text-sm font-medium text-gray-900 dark:text-white">{{
            fieldName
          }}</span>
        </div>

        <!-- Field Value Editor -->
        <div class="space-y-3">
          <!-- Type Selector -->
          <div v-if="!hideTypeSelector" class="flex items-center gap-2">
            <label class="text-xs text-gray-500 dark:text-gray-400">Type:</label>
            <select
              v-model="fieldType"
              @change="handleTypeChange"
              class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="null">Null</option>
              <option value="timestamp">Timestamp</option>
              <option value="map">Map (Object)</option>
              <option value="array">Array</option>
              <option value="geopoint">GeoPoint</option>
              <option value="reference">Reference</option>
            </select>
          </div>

          <!-- Value Input based on type -->
          <div class="space-y-2">
            <!-- String -->
            <textarea
              v-if="fieldType === 'string'"
              v-model="stringValue"
              @input="updateValue"
              placeholder="Enter string value"
              rows="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
            />

            <!-- Number -->
            <input
              v-else-if="fieldType === 'number'"
              v-model.number="numberValue"
              @input="updateValue"
              type="number"
              step="any"
              placeholder="Enter number"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />

            <!-- Boolean -->
            <select
              v-else-if="fieldType === 'boolean'"
              v-model="booleanValue"
              @change="updateValue"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>

            <!-- Timestamp -->
            <input
              v-else-if="fieldType === 'timestamp'"
              v-model="timestampValue"
              @input="updateValue"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />

            <!-- Null -->
            <div
              v-else-if="fieldType === 'null'"
              class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 italic"
            >
              null
            </div>

            <!-- GeoPoint -->
            <div v-else-if="fieldType === 'geopoint'" class="grid grid-cols-2 gap-2">
              <input
                v-model.number="geoPoint.latitude"
                @input="updateValue"
                type="number"
                step="any"
                placeholder="Latitude"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                v-model.number="geoPoint.longitude"
                @input="updateValue"
                type="number"
                step="any"
                placeholder="Longitude"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <!-- Reference -->
            <input
              v-else-if="fieldType === 'reference'"
              v-model="referenceValue"
              @input="updateValue"
              type="text"
              placeholder="projects/PROJECT_ID/databases/(default)/documents/COLLECTION/DOCUMENT"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />

            <!-- Map (Object) -->
            <div
              v-else-if="fieldType === 'map'"
              :class="hideBorder ? '' : 'border border-gray-200 dark:border-gray-600 rounded-md'"
            >
              <div
                class="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Map Fields</span
                  >
                  <div class="flex gap-2">
                    <button
                      @click="addMapField"
                      class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="Object.keys(mapValue).length === 0"
                class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm"
              >
                No fields in map
              </div>
              <div v-else>
                <NestedFieldRenderer
                  :value="mapValue"
                  :path="path"
                  :depth="level"
                  @update="handleNestedUpdate"
                />
              </div>
            </div>

            <!-- Array -->
            <div
              v-else-if="fieldType === 'array'"
              :class="hideBorder ? '' : 'border border-gray-200 dark:border-gray-600 rounded-md'"
            >
              <div
                class="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Array Items</span
                  >
                  <div class="flex gap-2">
                    <button
                      @click="addArrayItem"
                      class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="arrayValue.length === 0"
                class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm"
              >
                No items in array
              </div>
              <div v-else>
                <NestedFieldRenderer
                  :value="arrayValue"
                  :path="path"
                  :depth="level"
                  @update="handleNestedUpdate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!hideDeleteButton" class="flex items-center gap-1 pt-6">
        <button
          @click="$emit('delete', path)"
          class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          title="Delete field"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import NestedFieldRenderer from './NestedFieldRenderer.vue'

interface Props {
  fieldName: string
  fieldValue: any
  path: string[]
  level: number
  canEditName?: boolean
  hideTypeSelector?: boolean
  forcedType?: string
  hideDeleteButton?: boolean
  hideBorder?: boolean
  hideFieldName?: boolean
}

interface Emits {
  update: [{ path: string[]; value: any }]
  delete: [path: string[]]
  rename: [{ oldPath: string[]; newPath: string[] }]
}

const props = withDefaults(defineProps<Props>(), {
  canEditName: false,
  hideTypeSelector: false,
  forcedType: undefined,
  hideDeleteButton: false,
  hideBorder: false,
  hideFieldName: false,
})

const emit = defineEmits<Emits>()

// Local state
const localFieldName = ref(props.fieldName)
const fieldType = ref(props.forcedType || getInitialType(props.fieldValue))
const stringValue = ref('')
const numberValue = ref(0)
const booleanValue = ref(false)
const timestampValue = ref('')
const referenceValue = ref('')
const mapValue = ref<Record<string, any>>({})
const arrayValue = ref<any[]>([])
const geoPoint = ref({ latitude: 0, longitude: 0 })

// Initialize values based on field type
function getInitialType(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'map'
  return 'string'
}

function initializeValues() {
  const value = props.fieldValue

  switch (fieldType.value) {
    case 'string':
      stringValue.value = typeof value === 'string' ? value : ''
      break
    case 'number':
      numberValue.value = typeof value === 'number' ? value : 0
      break
    case 'boolean':
      booleanValue.value = typeof value === 'boolean' ? value : false
      break
    case 'timestamp':
      timestampValue.value =
        typeof value === 'string' ? value : new Date().toISOString().slice(0, 16)
      break
    case 'reference':
      referenceValue.value = typeof value === 'string' ? value : ''
      break
    case 'map':
      mapValue.value =
        typeof value === 'object' && !Array.isArray(value) && value !== null ? { ...value } : {}
      break
    case 'array':
      arrayValue.value = Array.isArray(value) ? [...value] : []
      break
    case 'geopoint':
      if (
        typeof value === 'object' &&
        value !== null &&
        'latitude' in value &&
        'longitude' in value
      ) {
        geoPoint.value = { latitude: value.latitude, longitude: value.longitude }
      } else {
        geoPoint.value = { latitude: 0, longitude: 0 }
      }
      break
  }
}

// Initialize on mount and when props change
initializeValues()
watch(() => props.fieldValue, initializeValues, { deep: true })
watch(
  () => props.forcedType,
  newType => {
    if (newType) {
      fieldType.value = newType
      initializeValues()
    }
  }
)

function getCurrentValue() {
  switch (fieldType.value) {
    case 'string':
      return stringValue.value
    case 'number':
      return numberValue.value
    case 'boolean':
      return booleanValue.value
    case 'null':
      return null
    case 'timestamp':
      return timestampValue.value
    case 'reference':
      return referenceValue.value
    case 'map':
      return mapValue.value
    case 'array':
      return arrayValue.value
    case 'geopoint':
      return geoPoint.value
    default:
      return stringValue.value
  }
}

function updateValue() {
  emit('update', { path: props.path, value: getCurrentValue() })
}

function handleTypeChange() {
  initializeValues()
  updateValue()
}

function updateFieldName() {
  if (localFieldName.value !== props.fieldName) {
    const oldPath = [...props.path]
    const newPath = [...props.path.slice(0, -1), localFieldName.value]
    emit('rename', { oldPath, newPath })
  }
}

function addMapField() {
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  mapValue.value[tempKey] = ''
  updateValue()
}

function handleNestedUpdate(event: { path: (string | number)[]; value: any }) {
  if (event.path.length === props.path.length) {
    // Direct update to this field's value
    if (fieldType.value === 'map') {
      mapValue.value = event.value
    } else if (fieldType.value === 'array') {
      arrayValue.value = event.value
    }
    updateValue()
  } else {
    // This shouldn't happen as NestedFieldRenderer handles its own updates
    // But we'll emit it up just in case
    emit('update', { path: event.path, value: event.value })
  }
}

function addArrayItem() {
  // Default to adding a string item
  const defaultValue = ''

  arrayValue.value.push(defaultValue)
  updateValue()
}
</script>
