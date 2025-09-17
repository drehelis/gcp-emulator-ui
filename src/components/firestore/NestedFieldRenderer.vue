<template>
  <div v-if="isMap && Object.keys(value || {}).length > 0" :class="containerClass">
    <div
      v-for="(nestedValue, nestedKey) in value"
      :key="`nested-${path.join('-')}-${nestedKey}`"
      class="px-4 py-2 relative"
    >
      <!-- Delete button - positioned absolutely to align across all levels -->
      <div class="absolute top-2 flex justify-center" :style="deleteButtonStyle">
        <button
          @click="deleteField(nestedKey)"
          class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          <TrashIcon class="w-3 h-3" />
        </button>
      </div>

      <div class="grid grid-cols-12 gap-3 items-center text-sm">
        <!-- Tree indicator -->
        <div class="col-span-1 flex items-center">
          <span :class="indicatorClass">├─</span>
        </div>

        <!-- Field Name -->
        <div class="col-span-3">
          <input
            :value="nestedKey.startsWith('_temp_') ? '' : nestedKey"
            @blur="renameField(nestedKey, ($event.target as HTMLInputElement).value)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            type="text"
            placeholder="field name"
            :class="inputClass"
          />
        </div>

        <!-- Field Type -->
        <div class="col-span-2">
          <select
            :value="getValueType(nestedValue)"
            @change="updateFieldType(nestedKey, ($event.target as HTMLSelectElement).value)"
            :class="selectClass"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
            <option value="map">Map</option>
            <option value="array">Array</option>
          </select>
        </div>

        <!-- Field Value -->
        <div class="col-span-5">
          <input
            v-if="getValueType(nestedValue) === 'string'"
            :value="nestedValue"
            @input="updateFieldValue(nestedKey, ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Value"
            :class="inputClass"
          />
          <input
            v-else-if="getValueType(nestedValue) === 'number'"
            :value="nestedValue"
            @input="updateFieldValue(nestedKey, Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="any"
            placeholder="0"
            :class="inputClass"
          />
          <select
            v-else-if="getValueType(nestedValue) === 'boolean'"
            :value="nestedValue"
            @change="updateFieldValue(nestedKey, ($event.target as HTMLSelectElement).value === 'true')"
            :class="selectClass"
          >
            <option :value="true">true</option>
            <option :value="false">false</option>
          </select>
          <div v-else-if="getValueType(nestedValue) === 'null'" class="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
            null
          </div>
          <div v-else-if="getValueType(nestedValue) === 'map'" class="flex items-center gap-2">
            <span class="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              {{ Object.keys(nestedValue || {}).length }} field(s)
            </span>
            <button
              @click="addNestedField(nestedKey, 'map')"
              class="text-xs px-1 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon class="w-3 h-3" />
            </button>
          </div>
          <div v-else-if="getValueType(nestedValue) === 'array'" class="flex items-center gap-2">
            <span class="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {{ (nestedValue || []).length }} item(s)
            </span>
            <button
              @click="addNestedField(nestedKey, 'array')"
              class="text-xs px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <PlusIcon class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Delete column removed - now positioned absolutely -->
      </div>

      <!-- Recursive nesting for maps and arrays -->
      <NestedFieldRenderer
        v-if="getValueType(nestedValue) === 'map'"
        :value="nestedValue"
        :path="[...path, nestedKey]"
        :depth="depth + 1"
        @update="handleNestedUpdate"
      />
      <NestedFieldRenderer
        v-if="getValueType(nestedValue) === 'array'"
        :value="nestedValue"
        :path="[...path, nestedKey]"
        :depth="depth + 1"
        @update="handleNestedUpdate"
      />
    </div>
  </div>

  <div v-else-if="isArray && (value || []).length > 0" :class="containerClass">
    <div
      v-for="(item, index) in value"
      :key="`array-${path.join('-')}-${index}`"
      class="px-4 py-2 relative"
    >
      <!-- Delete button - positioned absolutely to align across all levels -->
      <div class="absolute top-2 flex justify-center" :style="deleteButtonStyle">
        <button
          @click="deleteArrayItem(index)"
          class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          <TrashIcon class="w-3 h-3" />
        </button>
      </div>

      <div class="grid grid-cols-12 gap-3 items-center text-sm">
        <!-- Tree indicator -->
        <div class="col-span-1 flex items-center">
          <span :class="indicatorClass">├─[{{ index }}]</span>
        </div>

        <!-- Array Item Type -->
        <div class="col-span-2">
          <select
            :value="getValueType(item)"
            @change="updateArrayItemType(index, ($event.target as HTMLSelectElement).value)"
            :class="selectClass"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
            <option value="map">Map</option>
            <option value="array">Array</option>
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
            :class="inputClass"
          />
          <input
            v-else-if="getValueType(item) === 'number'"
            :value="item"
            @input="updateArrayItem(index, Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="any"
            placeholder="0"
            :class="inputClass"
          />
          <select
            v-else-if="getValueType(item) === 'boolean'"
            :value="item"
            @change="updateArrayItem(index, ($event.target as HTMLSelectElement).value === 'true')"
            :class="selectClass"
          >
            <option :value="true">true</option>
            <option :value="false">false</option>
          </select>
          <div v-else-if="getValueType(item) === 'null'" class="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
            null
          </div>
          <div v-else-if="getValueType(item) === 'map'" class="flex items-center gap-2">
            <span class="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              {{ Object.keys(item || {}).length }} field(s)
            </span>
            <button
              @click="addNestedArrayItem(index, 'map')"
              class="text-xs px-1 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon class="w-3 h-3" />
            </button>
          </div>
          <div v-else-if="getValueType(item) === 'array'" class="flex items-center gap-2">
            <span class="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {{ (item || []).length }} item(s)
            </span>
            <button
              @click="addNestedArrayItem(index, 'array')"
              class="text-xs px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <PlusIcon class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Delete column removed - now positioned absolutely -->
      </div>

      <!-- Recursive nesting for array items -->
      <NestedFieldRenderer
        v-if="getValueType(item) === 'map'"
        :value="item"
        :path="[...path, index]"
        :depth="depth + 1"
        @update="handleArrayNestedUpdate"
      />
      <NestedFieldRenderer
        v-if="getValueType(item) === 'array'"
        :value="item"
        :path="[...path, index]"
        :depth="depth + 1"
        @update="handleArrayNestedUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'

interface Props {
  value: any
  path: (string | number)[]
  depth: number
}

interface Emits {
  update: [{ path: (string | number)[], value: any }]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Color scheme based on depth
const colorSchemes = [
  'blue', 'purple', 'indigo', 'teal', 'emerald', 'cyan', 'sky', 'violet'
]

const currentColor = computed(() => colorSchemes[props.depth % colorSchemes.length])

const isMap = computed(() =>
  props.value && typeof props.value === 'object' && !Array.isArray(props.value)
)

const isArray = computed(() => Array.isArray(props.value))

const containerClass = computed(() => {
  const color = currentColor.value
  return `bg-${color}-50/20 dark:bg-${color}-900/5 border-l-2 border-${color}-400 dark:border-${color}-500 ml-4 mt-2`
})

const indicatorClass = computed(() => {
  const color = currentColor.value
  return `text-xs text-${color}-600 dark:text-${color}-400 font-mono`
})

const inputClass = computed(() => {
  const color = currentColor.value
  return `w-full px-2 py-1 text-xs border border-${color}-200 dark:border-${color}-600 rounded focus:outline-none focus:ring-1 focus:ring-${color}-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800 font-medium`
})

const selectClass = computed(() => {
  const color = currentColor.value
  return `w-full px-2 py-1 text-xs border border-${color}-200 dark:border-${color}-600 rounded focus:outline-none focus:ring-1 focus:ring-${color}-500 dark:bg-gray-700 dark:text-white bg-white dark:bg-gray-800`
})

const deleteButtonStyle = computed(() => {
  const indentCompensation = props.depth * 16 // 16px per level (ml-4 = 1rem = 16px)
  return {
    right: '1rem', // right-4 = 1rem
    transform: `translateX(${indentCompensation}px)`
  }
})

function getValueType(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'map'
  return 'string'
}

function updateValue(newValue: any) {
  emit('update', { path: props.path, value: newValue })
}

// Helper function to preserve object key order
function preserveObjectOrder(obj: Record<string, any>): Record<string, any> {
  const orderedObj: Record<string, any> = {}
  Object.keys(obj).forEach(key => {
    orderedObj[key] = obj[key]
  })
  return orderedObj
}

// Map field operations
function renameField(oldKey: string, newKey: string) {
  newKey = newKey.trim()
  if (!newKey) {
    // Delete the field while preserving order
    const newValue: Record<string, any> = {}
    Object.keys(props.value).forEach(key => {
      if (key !== oldKey) {
        newValue[key] = props.value[key]
      }
    })
    updateValue(newValue)
    return
  }

  if ((oldKey !== newKey || oldKey.startsWith('_temp_')) && !Object.prototype.hasOwnProperty.call(props.value, newKey)) {
    // Rename field while preserving its position
    const newValue: Record<string, any> = {}
    Object.keys(props.value).forEach(key => {
      if (key === oldKey) {
        newValue[newKey] = props.value[oldKey]
      } else {
        newValue[key] = props.value[key]
      }
    })
    updateValue(newValue)
  }
}

function updateFieldType(key: string, type: string) {
  const newValue = preserveObjectOrder(props.value)
  switch (type) {
    case 'string': newValue[key] = ''; break
    case 'number': newValue[key] = 0; break
    case 'boolean': newValue[key] = false; break
    case 'null': newValue[key] = null; break
    case 'map': newValue[key] = {}; break
    case 'array': newValue[key] = []; break
  }
  updateValue(newValue)
}

function updateFieldValue(key: string, value: any) {
  const newValue = preserveObjectOrder(props.value)
  newValue[key] = value
  updateValue(newValue)
}

function deleteField(key: string) {
  // Delete field while preserving order of remaining fields
  const newValue: Record<string, any> = {}
  Object.keys(props.value).forEach(k => {
    if (k !== key) {
      newValue[k] = props.value[k]
    }
  })
  updateValue(newValue)
}

function addNestedField(parentKey: string, type: 'map' | 'array') {
  const newValue = preserveObjectOrder(props.value)
  if (type === 'map') {
    const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (!newValue[parentKey]) newValue[parentKey] = {}
    newValue[parentKey][tempKey] = ''
  } else {
    if (!Array.isArray(newValue[parentKey])) newValue[parentKey] = []
    newValue[parentKey].push('')
  }
  updateValue(newValue)
}

// Array operations
function updateArrayItemType(index: number, type: string) {
  const newValue = [...props.value]
  switch (type) {
    case 'string': newValue[index] = ''; break
    case 'number': newValue[index] = 0; break
    case 'boolean': newValue[index] = false; break
    case 'null': newValue[index] = null; break
    case 'map': newValue[index] = {}; break
    case 'array': newValue[index] = []; break
  }
  updateValue(newValue)
}

function updateArrayItem(index: number, value: any) {
  const newValue = [...props.value]
  newValue[index] = value
  updateValue(newValue)
}

function deleteArrayItem(index: number) {
  const newValue = [...props.value]
  newValue.splice(index, 1)
  updateValue(newValue)
}

function addNestedArrayItem(index: number, type: 'map' | 'array') {
  const newValue = [...props.value]
  if (type === 'map') {
    const tempKey = `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (!newValue[index]) newValue[index] = {}
    newValue[index][tempKey] = ''
  } else {
    if (!Array.isArray(newValue[index])) newValue[index] = []
    newValue[index].push('')
  }
  updateValue(newValue)
}

// Handle recursive updates
function handleNestedUpdate(event: { path: (string | number)[], value: any }) {
  // Remove our own path prefix from the event path
  const relativePath = event.path.slice(props.path.length)
  
  if (relativePath.length === 0) {
    // Direct update to this level
    updateValue(event.value)
    return
  }
  
  const newValue = isMap.value ? preserveObjectOrder(props.value) : [...props.value]
  const [firstKey, ...restPath] = relativePath

  if (restPath.length === 0) {
    newValue[firstKey] = event.value
  } else {
    // Deep update
    const updateNested = (obj: any, path: (string | number)[], value: any): any => {
      if (path.length === 1) {
        if (Array.isArray(obj)) {
          const newObj = [...obj]
          newObj[path[0] as number] = value
          return newObj
        } else {
          return preserveObjectOrder({ ...obj, [path[0]]: value })
        }
      }

      const [key, ...remaining] = path
      if (Array.isArray(obj)) {
        const newObj = [...obj]
        newObj[key as number] = updateNested(obj[key as number], remaining, value)
        return newObj
      } else {
        const newObj = preserveObjectOrder(obj)
        newObj[key] = updateNested(obj[key], remaining, value)
        return newObj
      }
    }

    newValue[firstKey] = updateNested(newValue[firstKey], restPath, event.value)
  }

  updateValue(newValue)
}

function handleArrayNestedUpdate(event: { path: (string | number)[], value: any }) {
  handleNestedUpdate(event)
}
</script>
