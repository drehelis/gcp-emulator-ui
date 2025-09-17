<template>
  <BaseModal v-model="isOpen" title="Add Field" size="xl">
    <div class="space-y-4">
      <!-- Field Editor -->
      <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        <!-- Table Header -->
        <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <div class="grid grid-cols-12 gap-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <div class="col-span-4">Field Name</div>
            <div class="col-span-4">Type</div>
            <div class="col-span-4">Value</div>
          </div>
        </div>

        <!-- Single Field Editor -->
        <div class="bg-white dark:bg-gray-800">
          <div class="px-4 py-3">
            <div class="grid grid-cols-12 gap-3 items-start">
              <!-- Field Name -->
              <div class="col-span-4">
                <input
                  v-model="localField.name"
                  type="text"
                  placeholder="Enter field name"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p v-if="!localField.name.trim()" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Field name is required</p>
              </div>

              <!-- Field Type -->
              <div class="col-span-4">
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
              <div class="col-span-4">
                <!-- String -->
                <textarea
                  v-if="localField.type === 'string'"
                  v-model="localField.value"
                  placeholder="Enter text value"
                  rows="1"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  style="field-sizing: content; min-height: 2.5rem;"
                />

                <!-- Number -->
                <input
                  v-else-if="localField.type === 'number'"
                  v-model.number="localField.value"
                  type="number"
                  step="any"
                  placeholder="0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />

                <!-- Boolean -->
                <select
                  v-else-if="localField.type === 'boolean'"
                  v-model="localField.value"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option :value="true">true</option>
                  <option :value="false">false</option>
                </select>

                <!-- Timestamp -->
                <input
                  v-else-if="localField.type === 'timestamp'"
                  v-model="localField.value"
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
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-6">
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          @click="handleSubmit"
          :disabled="!localField.name.trim()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Add Field
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import NestedFieldRenderer from '@/components/firestore/NestedFieldRenderer.vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  'add-field': [field: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(false)

// Reactive field data
const localField = reactive({
  name: '',
  type: 'string',
  value: ''
})

// GeoPoint data
const geoPoint = reactive({
  latitude: 0,
  longitude: 0
})

// Map and Array data for nested fields
const mapData = reactive<Record<string, any>>({})
const arrayData = reactive<any[]>([])

// Watch for model value changes
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
})

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Watch for type changes to reset value
watch(() => localField.type, (newType) => {
  switch (newType) {
    case 'string':
      localField.value = ''
      break
    case 'number':
      localField.value = 0
      break
    case 'boolean':
      localField.value = false
      break
    case 'null':
      localField.value = null
      break
    case 'timestamp':
      localField.value = new Date().toISOString().slice(0, 16)
      break
    case 'map':
      localField.value = {}
      break
    case 'array':
      localField.value = []
      break
    case 'geopoint':
      localField.value = { latitude: geoPoint.latitude, longitude: geoPoint.longitude }
      break
    case 'reference':
      localField.value = ''
      break
  }
})

// Handle type change
function handleTypeChange() {
  // Reset nested data when changing types
  if (localField.type === 'map') {
    Object.keys(mapData).forEach(key => delete mapData[key])
  } else if (localField.type === 'array') {
    arrayData.splice(0, arrayData.length)
  }
}

// Update geopoint
function updateGeoPoint() {
  localField.value = {
    latitude: geoPoint.latitude,
    longitude: geoPoint.longitude
  }
}

// Handle form submission
function handleSubmit() {
  if (!localField.name.trim()) return

  let finalValue = localField.value

  // Handle special cases
  if (localField.type === 'geopoint') {
    finalValue = {
      latitude: geoPoint.latitude,
      longitude: geoPoint.longitude
    }
  } else if (localField.type === 'null') {
    finalValue = null
  } else if (localField.type === 'map') {
    finalValue = { ...mapData }
  } else if (localField.type === 'array') {
    finalValue = [...arrayData]
  }

  const newField = {
    id: `field_${Date.now()}`,
    name: localField.name.trim(),
    type: localField.type,
    value: finalValue
  }

  emit('add-field', newField)
  handleCancel()
}

// Handle cancel
function handleCancel() {
  // Reset form
  localField.name = ''
  localField.type = 'string'
  localField.value = ''
  geoPoint.latitude = 0
  geoPoint.longitude = 0
  Object.keys(mapData).forEach(key => delete mapData[key])
  arrayData.splice(0, arrayData.length)

  isOpen.value = false
}

// Map and Array operations
function addMapField() {
  const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  mapData[tempKey] = ''
}

function addArrayItem() {
  arrayData.push('')
}

// Handle nested updates
function handleNestedMapUpdate(event: { path: (string | number)[], value: any }) {
  Object.assign(mapData, event.value)
}

function handleNestedArrayUpdate(event: { path: (string | number)[], value: any }) {
  arrayData.splice(0, arrayData.length, ...event.value)
}
</script>
