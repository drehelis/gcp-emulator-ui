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
          <select
            v-model="newArrayItemType"
            class="text-xs px-2 py-1 border border-green-300 dark:border-green-600 rounded bg-white dark:bg-gray-700"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
          </select>
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
    <div v-if="localField.type === 'map' && Object.keys(mapData).length > 0" class="bg-blue-50/30 dark:bg-blue-900/10">
      <div
        v-for="(value, key) in mapData"
        :key="key"
        class="px-4 py-2 border-l-2 border-blue-300 dark:border-blue-600 ml-8"
      >
        <div class="grid grid-cols-12 gap-3 items-center text-sm">
          <!-- Nested indicator -->
          <div class="col-span-1 flex items-center">
            <span class="text-xs text-blue-600 dark:text-blue-400 font-mono">└─</span>
          </div>

          <!-- Map Field Name -->
          <div class="col-span-3">
            <input
              :value="key"
              @blur="renameMapField(key, ($event.target as HTMLInputElement).value)"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
              type="text"
              placeholder="field name"
              class="w-full px-2 py-1 text-xs border border-blue-200 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800 font-medium"
            />
          </div>

          <!-- Map Field Type -->
          <div class="col-span-2">
            <select
              :value="getValueType(value)"
              @change="updateMapFieldType(key, ($event.target as HTMLSelectElement).value)"
              class="w-full px-2 py-1 text-xs border border-blue-200 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="null">Null</option>
            </select>
          </div>

          <!-- Map Field Value -->
          <div class="col-span-5">
            <input
              v-if="getValueType(value) === 'string'"
              :value="value"
              @input="updateMapFieldValue(key, ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Value"
              class="w-full px-2 py-1 text-xs border border-blue-200 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            />
            <input
              v-else-if="getValueType(value) === 'number'"
              :value="value"
              @input="updateMapFieldValue(key, Number(($event.target as HTMLInputElement).value))"
              type="number"
              step="any"
              placeholder="0"
              class="w-full px-2 py-1 text-xs border border-blue-200 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            />
            <select
              v-else-if="getValueType(value) === 'boolean'"
              :value="value"
              @change="updateMapFieldValue(key, ($event.target as HTMLSelectElement).value === 'true')"
              class="w-full px-2 py-1 text-xs border border-blue-200 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            >
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>
            <div v-else-if="getValueType(value) === 'null'" class="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
              null
            </div>
          </div>

          <!-- Delete -->
          <div class="col-span-1 flex justify-center">
            <button
              @click="deleteMapField(key)"
              class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <TrashIcon class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Nested Array Items -->
    <div v-if="localField.type === 'array' && arrayData.length > 0" class="bg-green-50/30 dark:bg-green-900/10">
      <div
        v-for="(item, index) in arrayData"
        :key="index"
        class="px-4 py-2 border-l-2 border-green-300 dark:border-green-600 ml-8"
      >
        <div class="grid grid-cols-12 gap-3 items-center text-sm">
          <!-- Nested indicator + Index -->
          <div class="col-span-1 flex items-center">
            <span class="text-xs text-green-600 dark:text-green-400 font-mono">└─[{{ index }}]</span>
          </div>

          <!-- Array Item Type -->
          <div class="col-span-2">
            <select
              :value="getValueType(item)"
              @change="updateArrayItemType(index, ($event.target as HTMLSelectElement).value)"
              class="w-full px-2 py-1 text-xs border border-green-200 dark:border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="null">Null</option>
            </select>
          </div>

          <!-- Array Item Value -->
          <div class="col-span-8">
            <input
              v-if="getValueType(item) === 'string'"
              :value="item"
              @input="updateArrayItem(index, ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Value"
              class="w-full px-2 py-1 text-xs border border-green-200 dark:border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            />
            <input
              v-else-if="getValueType(item) === 'number'"
              :value="item"
              @input="updateArrayItem(index, Number(($event.target as HTMLInputElement).value))"
              type="number"
              step="any"
              placeholder="0"
              class="w-full px-2 py-1 text-xs border border-green-200 dark:border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            />
            <select
              v-else-if="getValueType(item) === 'boolean'"
              :value="item"
              @change="updateArrayItem(index, ($event.target as HTMLSelectElement).value === 'true')"
              class="w-full px-2 py-1 text-xs border border-green-200 dark:border-green-600 rounded focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800"
            >
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>
            <div v-else-if="getValueType(item) === 'null'" class="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
              null
            </div>
          </div>

          <!-- Delete -->
          <div class="col-span-1 flex justify-center">
            <button
              @click="deleteArrayItem(index)"
              class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <TrashIcon class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'

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
const newArrayItemType = ref('string')

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
  return 'string'
}

// Map methods
function addMapField() {
  // Generate a unique field name
  let fieldName = 'field'
  let counter = 1
  while (mapData.value.hasOwnProperty(fieldName)) {
    fieldName = `field${counter}`
    counter++
  }

  const newMap = { ...mapData.value }
  newMap[fieldName] = ''
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
  }
  mapData.value = newMap
}

function renameMapField(oldKey: string, newKey: string) {
  newKey = newKey.trim()

  // If empty, generate a default name
  if (!newKey) {
    let counter = 1
    newKey = 'field'
    while (mapData.value.hasOwnProperty(newKey) && newKey !== oldKey) {
      newKey = `field${counter}`
      counter++
    }
  }

  // Only rename if different and not a duplicate
  if (oldKey !== newKey && !mapData.value.hasOwnProperty(newKey)) {
    const newMap = { ...mapData.value }
    newMap[newKey] = newMap[oldKey]
    delete newMap[oldKey]
    mapData.value = newMap
  }
}

function deleteMapField(key: string) {
  const newMap = { ...mapData.value }
  delete newMap[key]
  mapData.value = newMap
}

// Array methods
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
    case 'null':
      defaultValue = null
      break
    default:
      defaultValue = ''
  }

  const newArray = [...arrayData.value]
  newArray.push(defaultValue)
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
  }
  arrayData.value = newArray
}

function deleteArrayItem(index: number) {
  const newArray = [...arrayData.value]
  newArray.splice(index, 1)
  arrayData.value = newArray
}
</script>