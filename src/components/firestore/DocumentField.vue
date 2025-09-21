<template>
  <div class="px-4 py-3 firestore-row-hover">
    <div class="grid grid-cols-12 gap-3 items-start">
      <!-- Field Name -->
      <div class="col-span-4">
        <input
          v-model="localField.name"
          @blur="updateField"
          type="text"
          placeholder="Enter field name"
          class="firestore-input"
        />
        <p v-if="!localField.name.trim()" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional field - leave empty to skip</p>
      </div>

      <!-- Field Type -->
      <div class="col-span-2">
        <select
          v-model="localField.type"
          @change="handleTypeChange"
          class="firestore-select"
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
          class="firestore-textarea"
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
          class="firestore-input"
        />

        <!-- Boolean -->
        <select
          v-else-if="localField.type === 'boolean'"
          v-model="localField.value"
          @change="updateField"
          class="firestore-select"
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
          class="firestore-input"
        />

        <!-- Null -->
        <div v-else-if="localField.type === 'null'" class="firestore-null-value">
          null
        </div>

        <!-- Reference -->
        <input
          v-else-if="localField.type === 'reference'"
          v-model="localField.value"
          @input="updateField"
          type="text"
          placeholder="projects/PROJECT_ID/databases/(default)/documents/..."
          class="firestore-input"
        />

        <!-- GeoPoint -->
        <div v-else-if="localField.type === 'geopoint'" class="grid grid-cols-2 gap-2">
          <input
            v-model.number="geoPoint.latitude"
            @input="updateGeoPoint"
            type="number"
            step="any"
            placeholder="Latitude"
            class="firestore-input"
          />
          <input
            v-model.number="geoPoint.longitude"
            @input="updateGeoPoint"
            type="number"
            step="any"
            placeholder="Longitude"
            class="firestore-input"
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
          class="firestore-btn-icon-small firestore-hover-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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


// Map methods
function addMapField() {
  // Generate a unique temporary key for internal tracking
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const newMap = { ...mapData.value }
  newMap[tempKey] = ''
  mapData.value = newMap
}


// Array methods
function addArrayItem() {
  // Default to string type - users can change it after adding
  const newArray = [...arrayData.value]
  newArray.push('')
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