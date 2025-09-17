<template>
  <div class="p-4" :class="{ 'bg-gray-50 dark:bg-gray-700/30': level > 0 }">
    <div class="flex items-start gap-3">
      <!-- Field Name -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <span v-if="level > 0" class="text-xs text-gray-400 font-mono">{{ path.join('.') }}</span>
          <input
            v-if="canEditName"
            v-model="localFieldName"
            @blur="updateFieldName"
            type="text"
            placeholder="Field name"
            class="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          />
          <span v-else class="text-sm font-medium text-gray-900 dark:text-white">{{ fieldName }}</span>
        </div>

        <!-- Field Value Editor -->
        <div class="space-y-3">
          <!-- Type Selector -->
          <div class="flex items-center gap-2">
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
              rows="2"
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
            <div v-else-if="fieldType === 'null'" class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 italic">
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
            <div v-else-if="fieldType === 'map'" class="border border-gray-200 dark:border-gray-600 rounded-md">
              <div class="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Map Fields</span>
                  <button
                    @click="addMapField"
                    class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Field
                  </button>
                </div>
              </div>
              <div v-if="Object.keys(mapValue).length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No fields in map
              </div>
              <div v-else class="divide-y divide-gray-200 dark:divide-gray-600">
                <FieldEditor
                  v-for="(value, key) in mapValue"
                  :key="key"
                  :field-name="key"
                  :field-value="value"
                  :path="[...path, key]"
                  :level="level + 1"
                  :can-edit-name="true"
                  @update="$emit('update', $event.path, $event.value)"
                  @delete="deleteMapField(key)"
                  @rename="renameMapField"
                />
              </div>
            </div>

            <!-- Array -->
            <div v-else-if="fieldType === 'array'" class="border border-gray-200 dark:border-gray-600 rounded-md">
              <div class="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Array Items</span>
                  <div class="flex gap-2">
                    <select
                      v-model="newArrayItemType"
                      class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="map">Map</option>
                      <option value="null">Null</option>
                    </select>
                    <button
                      @click="addArrayItem"
                      class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="arrayValue.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No items in array
              </div>
              <div v-else class="divide-y divide-gray-200 dark:divide-gray-600">
                <FieldEditor
                  v-for="(item, index) in arrayValue"
                  :key="index"
                  :field-name="index.toString()"
                  :field-value="item"
                  :path="[...path, index.toString()]"
                  :level="level + 1"
                  :can-edit-name="false"
                  @update="$emit('update', $event.path, $event.value)"
                  @delete="deleteArrayItem(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 pt-6">
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
import { ref, computed, watch } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'

interface Props {
  fieldName: string
  fieldValue: any
  path: string[]
  level: number
  canEditName?: boolean
}

interface Emits {
  update: [{ path: string[], value: any }]
  delete: [path: string[]]
  rename: [{ oldPath: string[], newPath: string[] }]
}

const props = withDefaults(defineProps<Props>(), {
  canEditName: false
})

const emit = defineEmits<Emits>()

// Local state
const localFieldName = ref(props.fieldName)
const fieldType = ref(getInitialType(props.fieldValue))
const stringValue = ref('')
const numberValue = ref(0)
const booleanValue = ref(false)
const timestampValue = ref('')
const referenceValue = ref('')
const mapValue = ref<Record<string, any>>({})
const arrayValue = ref<any[]>([])
const geoPoint = ref({ latitude: 0, longitude: 0 })
const newArrayItemType = ref('string')

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
      timestampValue.value = typeof value === 'string' ? value : new Date().toISOString().slice(0, 16)
      break
    case 'reference':
      referenceValue.value = typeof value === 'string' ? value : ''
      break
    case 'map':
      mapValue.value = typeof value === 'object' && !Array.isArray(value) && value !== null ? { ...value } : {}
      break
    case 'array':
      arrayValue.value = Array.isArray(value) ? [...value] : []
      break
    case 'geopoint':
      if (typeof value === 'object' && value !== null && 'latitude' in value && 'longitude' in value) {
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
  const fieldName = prompt('Enter field name:')
  if (fieldName && fieldName.trim() && !mapValue.value.hasOwnProperty(fieldName.trim())) {
    mapValue.value[fieldName.trim()] = ''
    updateValue()
  }
}

function deleteMapField(key: string) {
  delete mapValue.value[key]
  updateValue()
}

function renameMapField({ oldPath, newPath }: { oldPath: string[], newPath: string[] }) {
  const oldKey = oldPath[oldPath.length - 1]
  const newKey = newPath[newPath.length - 1]

  if (oldKey !== newKey && !mapValue.value.hasOwnProperty(newKey)) {
    mapValue.value[newKey] = mapValue.value[oldKey]
    delete mapValue.value[oldKey]
    updateValue()
  }
}

function addArrayItem() {
  let defaultValue: any
  switch (newArrayItemType.value) {
    case 'string':
      defaultValue = ''
      break
    case 'number':
      defaultValue = 0
      break
    case 'boolean':
      defaultValue = false
      break
    case 'map':
      defaultValue = {}
      break
    case 'null':
      defaultValue = null
      break
    default:
      defaultValue = ''
  }

  arrayValue.value.push(defaultValue)
  updateValue()
}

function deleteArrayItem(index: number) {
  arrayValue.value.splice(index, 1)
  updateValue()
}
</script>