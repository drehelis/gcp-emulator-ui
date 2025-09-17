<template>
  <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <div class="grid grid-cols-12 gap-3 items-start">
      <!-- Field Name -->
      <div class="col-span-4">
        <input
          v-model="localField.name"
          @blur="updateField"
          type="text"
          placeholder="Enter field name"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <p v-if="!localField.name.trim()" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional field - leave empty to skip</p>
      </div>

      <!-- Field Type -->
      <div class="col-span-2">
        <select
          v-model="localField.type"
          @change="handleTypeChange"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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

      <!-- Field Value -->
      <div class="col-span-5">
        <!-- String -->
        <textarea
          v-if="localField.type === 'string'"
          v-model="localField.value"
          @input="updateField"
          placeholder="Enter text value"
          rows="1"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          style="field-sizing: content; min-height: 2.5rem;"
        />

        <!-- Number -->
        <input
          v-else-if="localField.type === 'number'"
          v-model.number="localField.value"
          @input="updateField"
          type="number"
          step="any"
          placeholder="0"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <!-- Boolean -->
        <select
          v-else-if="localField.type === 'boolean'"
          v-model="localField.value"
          @change="updateField"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option :value="true">true</option>
          <option :value="false">false</option>
        </select>

        <!-- Timestamp -->
        <input
          v-else-if="localField.type === 'timestamp'"
          v-model="localField.value"
          @input="updateField"
          type="datetime-local"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <!-- Null -->
        <div v-else-if="localField.type === 'null'" class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 italic">
          null
        </div>

        <!-- Reference -->
        <input
          v-else-if="localField.type === 'reference'"
          v-model="localField.value"
          @input="updateField"
          type="text"
          placeholder="projects/PROJECT_ID/databases/(default)/documents/..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />

        <!-- GeoPoint -->
        <div v-else-if="localField.type === 'geopoint'" class="grid grid-cols-2 gap-2">
          <input
            v-model.number="geoPoint.latitude"
            @input="updateGeoPoint"
            type="number"
            step="any"
            placeholder="Latitude"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <input
            v-model.number="geoPoint.longitude"
            @input="updateGeoPoint"
            type="number"
            step="any"
            placeholder="Longitude"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Map -->
        <div v-else-if="localField.type === 'map'" class="flex items-center gap-2">
          <span class="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
            {{ Object.keys(mapData).length }} field(s)
          </span>
          <button
            @click="addMapField"
            class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <PlusIcon class="w-3 h-3" />
            Add Field
          </button>
        </div>

        <!-- Array -->
        <div v-else-if="localField.type === 'array'" class="flex items-center gap-2">
          <span class="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
            {{ arrayData.length }} item(s)
          </span>
          <button
            @click="addArrayItem"
            class="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
          >
            <PlusIcon class="w-3 h-3" />
            Add Item
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="col-span-1 flex justify-end">
        <button
          @click="$emit('delete', field.id)"
          class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Delete field"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Nested Map Fields -->
    <NestedFieldRenderer
      v-if="localField.type === 'map'"
      :value="mapData"
      :path="[]"
      :depth="0"
      @update="handleNestedMapUpdate"
    />

    <!-- Nested Array Items -->
    <NestedFieldRenderer
      v-if="localField.type === 'array'"
      :value="arrayData"
      :path="[]"
      :depth="0"
      @update="handleNestedArrayUpdate"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import NestedFieldRenderer from './NestedFieldRenderer.vue'

interface Field {
  id: string
  name: string
  type: string
  value: any
}

interface Props {
  field: Field
}

interface Emits {
  update: [fieldId: string, updates: Partial<Field>]
  delete: [fieldId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local reactive copy of the field
const localField = reactive({ ...props.field })
const geoPoint = ref({ latitude: 0, longitude: 0 })

// Computed properties for complex types
const mapData = computed({
  get: () => localField.value || {},
  set: (value) => {
    localField.value = value
    updateField()
  }
})

const arrayData = computed({
  get: () => localField.value || [],
  set: (value) => {
    localField.value = value
    updateField()
  }
})

// Watch for external field changes
watch(() => props.field, (newField) => {
  Object.assign(localField, newField)
  initializeSpecialTypes()
}, { deep: true })

// Initialize special types
function initializeSpecialTypes() {
  if (localField.type === 'geopoint' && localField.value) {
    geoPoint.value = { ...localField.value }
  }
}

// Initialize on mount
initializeSpecialTypes()

function getDefaultValueForType(type: string): any {
  switch (type) {
    case 'string': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'null': return null
    case 'timestamp': return new Date().toISOString().slice(0, 16)
    case 'reference': return ''
    case 'map': return {}
    case 'array': return []
    case 'geopoint': return { latitude: 0, longitude: 0 }
    default: return ''
  }
}

function handleTypeChange() {
  localField.value = getDefaultValueForType(localField.type)
  if (localField.type === 'geopoint') {
    geoPoint.value = { latitude: 0, longitude: 0 }
  }
  updateField()
}

function updateField() {
  emit('update', localField.id, {
    name: localField.name,
    type: localField.type,
    value: localField.value
  })
}

function updateGeoPoint() {
  localField.value = { ...geoPoint.value }
  updateField()
}

function getValueType(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'map'
  return 'string'
}

// Map methods
function addMapField() {
  // Generate a unique temporary key for internal tracking
  let tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const newMap = { ...mapData.value }
  newMap[tempKey] = ''
  mapData.value = newMap
}

function updateMapFieldValue(key: string, value: any) {
  const newMap = { ...mapData.value }
  newMap[key] = value
  mapData.value = newMap
}

function updateMapFieldType(key: string, type: string) {
  const newMap = { ...mapData.value }
  switch (type) {
    case 'string':
      newMap[key] = ''
      break
    case 'number':
      newMap[key] = 0
      break
    case 'boolean':
      newMap[key] = false
      break
    case 'null':
      newMap[key] = null
      break
    case 'map':
      newMap[key] = {}
      break
    case 'array':
      newMap[key] = []
      break
  }
  mapData.value = newMap
}

function renameMapField(oldKey: string, newKey: string) {
  newKey = newKey.trim()

  // If empty, just delete the field
  if (!newKey) {
    const newMap: Record<string, any> = {}
    Object.keys(mapData.value).forEach(key => {
      if (key !== oldKey) {
        newMap[key] = mapData.value[key]
      }
    })
    mapData.value = newMap
    return
  }

  // Only rename if different and not a duplicate
  if ((oldKey !== newKey || oldKey.startsWith('_temp_')) && !Object.prototype.hasOwnProperty.call(mapData.value, newKey)) {
    const newMap: Record<string, any> = {}
    Object.keys(mapData.value).forEach(key => {
      if (key === oldKey) {
        newMap[newKey] = mapData.value[oldKey]
      } else {
        newMap[key] = mapData.value[key]
      }
    })
    mapData.value = newMap
  }
}

function deleteMapField(key: string) {
  const newMap: Record<string, any> = {}
  Object.keys(mapData.value).forEach(k => {
    if (k !== key) {
      newMap[k] = mapData.value[k]
    }
  })
  mapData.value = newMap
}

// Array methods
function addArrayItem() {
  // Default to string type - users can change it after adding
  const newArray = [...arrayData.value]
  newArray.push('')
  arrayData.value = newArray
}

function updateArrayItem(index: number, value: any) {
  const newArray = [...arrayData.value]
  newArray[index] = value
  arrayData.value = newArray
}

function updateArrayItemType(index: number, type: string) {
  const newArray = [...arrayData.value]
  switch (type) {
    case 'string':
      newArray[index] = ''
      break
    case 'number':
      newArray[index] = 0
      break
    case 'boolean':
      newArray[index] = false
      break
    case 'null':
      newArray[index] = null
      break
    case 'map':
      newArray[index] = {}
      break
    case 'array':
      newArray[index] = []
      break
  }
  arrayData.value = newArray
}

function deleteArrayItem(index: number) {
  const newArray = [...arrayData.value]
  newArray.splice(index, 1)
  arrayData.value = newArray
}

// Nested map methods
function addNestedMapField(parentKey: string) {
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newMap = { ...mapData.value }
  if (!newMap[parentKey]) newMap[parentKey] = {}
  newMap[parentKey][tempKey] = ''
  mapData.value = newMap
}

function addNestedArrayItem(parentKey: string) {
  const newMap = { ...mapData.value }
  if (!Array.isArray(newMap[parentKey])) newMap[parentKey] = []

  // Default to string type - users can change it after adding
  newMap[parentKey].push('')
  mapData.value = newMap
}

function updateNestedMapFieldValue(parentKey: string, childKey: string, value: any) {
  const newMap = { ...mapData.value }
  newMap[parentKey][childKey] = value
  mapData.value = newMap
}

function updateNestedMapFieldType(parentKey: string, childKey: string, type: string) {
  const newMap = { ...mapData.value }
  switch (type) {
    case 'string':
      newMap[parentKey][childKey] = ''
      break
    case 'number':
      newMap[parentKey][childKey] = 0
      break
    case 'boolean':
      newMap[parentKey][childKey] = false
      break
    case 'null':
      newMap[parentKey][childKey] = null
      break
    case 'map':
      newMap[parentKey][childKey] = {}
      break
    case 'array':
      newMap[parentKey][childKey] = []
      break
  }
  mapData.value = newMap
}

function renameNestedMapField(parentKey: string, oldKey: string, newKey: string) {
  newKey = newKey.trim()

  if (!newKey) {
    const newMap = { ...mapData.value }
    const nestedObj: Record<string, any> = {}
    Object.keys(newMap[parentKey]).forEach(key => {
      if (key !== oldKey) {
        nestedObj[key] = newMap[parentKey][key]
      }
    })
    newMap[parentKey] = nestedObj
    mapData.value = newMap
    return
  }

  if ((oldKey !== newKey || oldKey.startsWith('_temp_')) && !Object.prototype.hasOwnProperty.call(mapData.value[parentKey], newKey)) {
    const newMap = { ...mapData.value }
    const nestedObj: Record<string, any> = {}
    Object.keys(newMap[parentKey]).forEach(key => {
      if (key === oldKey) {
        nestedObj[newKey] = newMap[parentKey][oldKey]
      } else {
        nestedObj[key] = newMap[parentKey][key]
      }
    })
    newMap[parentKey] = nestedObj
    mapData.value = newMap
  }
}

function deleteNestedMapField(parentKey: string, childKey: string) {
  const newMap = { ...mapData.value }
  delete newMap[parentKey][childKey]
  mapData.value = newMap
}

function updateNestedArrayItem(parentKey: string, index: number, value: any) {
  const newMap = { ...mapData.value }
  newMap[parentKey][index] = value
  mapData.value = newMap
}

function updateNestedArrayItemType(parentKey: string, index: number, type: string) {
  const newMap = { ...mapData.value }
  switch (type) {
    case 'string':
      newMap[parentKey][index] = ''
      break
    case 'number':
      newMap[parentKey][index] = 0
      break
    case 'boolean':
      newMap[parentKey][index] = false
      break
    case 'null':
      newMap[parentKey][index] = null
      break
    case 'map':
      newMap[parentKey][index] = {}
      break
    case 'array':
      newMap[parentKey][index] = []
      break
  }
  mapData.value = newMap
}

function deleteNestedArrayItem(parentKey: string, index: number) {
  const newMap = { ...mapData.value }
  newMap[parentKey].splice(index, 1)
  mapData.value = newMap
}

// Method for deeply nested map operations
function addDeeplyNestedMapField(parentKey: string, childKey: string) {
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newMap = { ...mapData.value }
  if (!newMap[parentKey][childKey]) newMap[parentKey][childKey] = {}
  newMap[parentKey][childKey][tempKey] = ''
  mapData.value = newMap
}

function addDeeplyNestedArrayItem(parentKey: string, childKey: string) {
  // For now, just add to the nested array - can be expanded for deeper nesting
  addNestedArrayItem(parentKey)
}

function addDeeplyNestedMapFieldToArray(parentKey: string, index: number) {
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newMap = { ...mapData.value }
  if (!newMap[parentKey][index]) newMap[parentKey][index] = {}
  newMap[parentKey][index][tempKey] = ''
  mapData.value = newMap
}

function addDeeplyNestedArrayItemToArray(parentKey: string, index: number) {
  const newMap = { ...mapData.value }
  if (!Array.isArray(newMap[parentKey][index])) newMap[parentKey][index] = []
  newMap[parentKey][index].push('')
  mapData.value = newMap
}

// Array within array methods
function addArrayMapField(arrayIndex: number) {
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newArray = [...arrayData.value]
  if (!newArray[arrayIndex]) newArray[arrayIndex] = {}
  newArray[arrayIndex][tempKey] = ''
  arrayData.value = newArray
}

function addArrayArrayItem(arrayIndex: number) {
  const newArray = [...arrayData.value]
  if (!Array.isArray(newArray[arrayIndex])) newArray[arrayIndex] = []
  newArray[arrayIndex].push('')
  arrayData.value = newArray
}

// Methods for array map field operations
function renameArrayMapField(arrayIndex: number, oldKey: string, newKey: string) {
  newKey = newKey.trim()

  if (!newKey) {
    const newArray = [...arrayData.value]
    const nestedObj: Record<string, any> = {}
    Object.keys(newArray[arrayIndex]).forEach(key => {
      if (key !== oldKey) {
        nestedObj[key] = newArray[arrayIndex][key]
      }
    })
    newArray[arrayIndex] = nestedObj
    arrayData.value = newArray
    return
  }

  if ((oldKey !== newKey || oldKey.startsWith('_temp_')) && !Object.prototype.hasOwnProperty.call(arrayData.value[arrayIndex], newKey)) {
    const newArray = [...arrayData.value]
    const nestedObj: Record<string, any> = {}
    Object.keys(newArray[arrayIndex]).forEach(key => {
      if (key === oldKey) {
        nestedObj[newKey] = newArray[arrayIndex][oldKey]
      } else {
        nestedObj[key] = newArray[arrayIndex][key]
      }
    })
    newArray[arrayIndex] = nestedObj
    arrayData.value = newArray
  }
}

function updateArrayMapFieldType(arrayIndex: number, key: string, type: string) {
  const newArray = [...arrayData.value]
  switch (type) {
    case 'string':
      newArray[arrayIndex][key] = ''
      break
    case 'number':
      newArray[arrayIndex][key] = 0
      break
    case 'boolean':
      newArray[arrayIndex][key] = false
      break
    case 'null':
      newArray[arrayIndex][key] = null
      break
    case 'map':
      newArray[arrayIndex][key] = {}
      break
    case 'array':
      newArray[arrayIndex][key] = []
      break
  }
  arrayData.value = newArray
}

function updateArrayMapFieldValue(arrayIndex: number, key: string, value: any) {
  const newArray = [...arrayData.value]
  newArray[arrayIndex][key] = value
  arrayData.value = newArray
}

function deleteArrayMapField(arrayIndex: number, key: string) {
  const newArray = [...arrayData.value]
  delete newArray[arrayIndex][key]
  arrayData.value = newArray
}

// Methods for array array item operations
function updateArrayArrayItemType(arrayIndex: number, itemIndex: number, type: string) {
  const newArray = [...arrayData.value]
  switch (type) {
    case 'string':
      newArray[arrayIndex][itemIndex] = ''
      break
    case 'number':
      newArray[arrayIndex][itemIndex] = 0
      break
    case 'boolean':
      newArray[arrayIndex][itemIndex] = false
      break
    case 'null':
      newArray[arrayIndex][itemIndex] = null
      break
    case 'map':
      newArray[arrayIndex][itemIndex] = {}
      break
    case 'array':
      newArray[arrayIndex][itemIndex] = []
      break
  }
  arrayData.value = newArray
}

function updateArrayArrayItem(arrayIndex: number, itemIndex: number, value: any) {
  const newArray = [...arrayData.value]
  newArray[arrayIndex][itemIndex] = value
  arrayData.value = newArray
}

function deleteArrayArrayItem(arrayIndex: number, itemIndex: number) {
  const newArray = [...arrayData.value]
  newArray[arrayIndex].splice(itemIndex, 1)
  arrayData.value = newArray
}

// Handlers for recursive nested field updates
function handleNestedMapUpdate(event: { path: (string | number)[], value: any }) {
  mapData.value = event.value
}

function handleNestedArrayUpdate(event: { path: (string | number)[], value: any }) {
  arrayData.value = event.value
}
</script>