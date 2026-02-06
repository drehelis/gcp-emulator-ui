<template>
  <div class="space-y-4">
    <!-- Headers (only show at top level) -->
    <div
      v-if="showHeaders && level === 1"
      class="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      <div class="col-span-1"></div>
      <div class="col-span-4">Field name</div>
      <div class="col-span-3">Field type</div>
      <div class="col-span-4">Field value</div>
    </div>

    <!-- Render each field -->
    <div v-for="(field, index) in fields" :key="field.id" class="space-y-2">
      <!-- Main field row -->
      <div class="grid grid-cols-12 gap-2 items-start">
        <!-- Field number and collapse button -->
        <div class="col-span-1 flex items-center" :style="{ paddingLeft: `${(level - 1) * 16}px` }">
          <button
            v-if="field.type === 'map'"
            @click="toggleFieldCollapse(field.id)"
            class="mr-2 firestore-hover-gray"
          >
            <svg
              class="w-4 h-4 transform transition-transform"
              :class="{ 'rotate-90': !isFieldCollapsed(field.id) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
          <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">{{
            getFieldNumber(field, index)
          }}</span>
        </div>

        <!-- Field name -->
        <div class="col-span-4">
          <input
            v-model="field.name"
            type="text"
            class="firestore-input"
            placeholder="Field name"
            :class="{ 'border-red-300 dark:border-red-600': !field.name && level === 1 }"
          />
          <p v-if="!field.name && level === 1" class="mt-1 text-xs text-red-500">Required</p>
        </div>

        <!-- Field type dropdown -->
        <div class="col-span-3 relative">
          <button
            @click="toggleDropdown(field.id)"
            class="firestore-select flex items-center justify-between"
          >
            <span>{{ field.type }}</span>
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="dropdownOpen === field.id && fieldTypeOptions"
            class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            <div
              v-for="option in fieldTypeOptions"
              :key="option"
              @click="selectFieldType(field.id, option)"
              class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white"
              :class="{ 'bg-blue-100 dark:bg-blue-900': field.type === option }"
            >
              {{ option }}
            </div>
          </div>
        </div>

        <!-- Field value (only for non-map types) -->
        <div class="col-span-4">
          <input
            v-if="field.type !== 'map'"
            v-model="field.value"
            type="text"
            class="firestore-input"
            placeholder="Field value"
          />
          <div v-else class="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {{ field.subFields?.length || 0 }} field(s)
          </div>
        </div>

        <!-- Actions -->
        <div class="col-span-1 flex items-center space-x-1">
          <!-- Add sub-field button (only for map types) -->
          <button
            v-if="field.type === 'map'"
            @click="addSubField(field)"
            class="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            title="Add sub-field"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
          </button>

          <!-- Remove field button -->
          <button
            v-if="canRemoveField"
            @click="removeField(field.id)"
            class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            title="Remove field"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Recursive sub-fields for map types -->
      <div v-if="field.type === 'map' && field.subFields && !isFieldCollapsed(field.id)">
        <FieldRenderer
          :fields="field.subFields"
          :level="level + 1"
          :show-headers="false"
          :parent-field="field"
          :field-path="[...(fieldPath || []), index]"
          :dropdown-open="dropdownOpen"
          :field-type-options="fieldTypeOptions"
          @add-field="$emit('add-field')"
          @add-sub-field="$emit('add-sub-field', $event)"
          @remove-field="$emit('remove-field', $event)"
          @toggle-dropdown="$emit('toggle-dropdown', $event)"
          @select-field-type="$emit('select-field-type', $event)"
        />
      </div>
    </div>

    <!-- Add field button (only at root level) -->
    <div v-if="level === 1" class="pt-2">
      <button
        @click="$emit('add-field')"
        class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          ></path>
        </svg>
        Add field
      </button>
    </div>

    <!-- Add sub-field button for map parent -->
    <div v-if="level > 1 && parentField" class="pt-2">
      <button
        @click="$emit('add-sub-field', parentField)"
        class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
      >
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          ></path>
        </svg>
        Add field to {{ parentField.name || 'map' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Field {
  id: string
  name: string
  type: string
  value: string
  subFields?: Field[]
  level?: number
  parentId?: string
}

interface Props {
  fields: Field[]
  level: number
  showHeaders: boolean
  parentField?: Field
  fieldPath?: number[]
  dropdownOpen?: string | null
  fieldTypeOptions?: string[]
}

interface Emits {
  'add-field': []
  'add-sub-field': [field: Field]
  'remove-field': [fieldId: string]
  'toggle-dropdown': [fieldId: string]
  'select-field-type': [data: { fieldId: string; type: string }]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Track collapsed fields
const collapsedFields = ref<Set<string>>(new Set())

// Computed
const canRemoveField = computed(() => {
  return props.level > 1 || props.fields.length > 1
})

// Methods
const getFieldNumber = (field: Field, index: number): string => {
  if (props.level === 1) {
    return (index + 1).toString()
  } else {
    // Build number based on fieldPath - only show immediate parent + current index
    const parentPath = props.fieldPath || []
    if (parentPath.length > 0) {
      const parentNumber = parentPath.map(i => i + 1).join('.')
      return `${parentNumber}.${index + 1}`
    }
    return `${index + 1}`
  }
}

const toggleFieldCollapse = (fieldId: string) => {
  if (collapsedFields.value.has(fieldId)) {
    collapsedFields.value.delete(fieldId)
  } else {
    collapsedFields.value.add(fieldId)
  }
}

const isFieldCollapsed = (fieldId: string): boolean => {
  return collapsedFields.value.has(fieldId)
}

const toggleDropdown = (fieldId: string) => {
  emit('toggle-dropdown', fieldId)
}

const selectFieldType = (fieldId: string, type: string) => {
  emit('select-field-type', { fieldId, type })
}

const addSubField = (field: Field) => {
  emit('add-sub-field', field)
}

const removeField = (fieldId: string) => {
  emit('remove-field', fieldId)
}
</script>
