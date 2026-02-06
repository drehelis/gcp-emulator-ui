<template>
  <div class="space-y-2">
    <div
      v-for="(attribute, index) in attributes"
      :key="index"
      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
    >
      <div class="flex-1 relative">
        <input
          :value="attribute.key"
          @input="updateAttribute(index, 'key', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Attribute key (e.g., eventType)"
          :class="[
            'block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500',
            isPreconfigured(attribute.key) ? 'pr-20' : '',
          ]"
          :title="isPreconfigured(attribute.key) ? 'Pre-configured at runtime' : ''"
        />
        <span
          v-if="isPreconfigured(attribute.key)"
          class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
          title="This attribute is pre-configured from runtime config"
        >
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Auto
        </span>
      </div>
      <div class="flex-1">
        <input
          :value="attribute.value"
          @input="updateAttribute(index, 'value', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Attribute value"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
      <div class="flex justify-center sm:justify-start">
        <button
          @click="removeAttribute(index)"
          class="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Remove attribute"
        >
          <TrashIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <button
      @click="addAttribute"
      class="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
    >
      <PlusIcon class="h-4 w-4 mr-2" />
      Add Message Attribute
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface MessageAttribute {
  key: string
  value: string
}

interface Props {
  attributes: MessageAttribute[]
  preconfiguredKeys?: string[]
}

interface Emits {
  'update:attributes': [attributes: MessageAttribute[]]
}

const props = withDefaults(defineProps<Props>(), {
  preconfiguredKeys: () => [],
})
const emit = defineEmits<Emits>()

const isPreconfigured = (key: string): boolean => {
  return key.trim() !== '' && props.preconfiguredKeys.includes(key)
}

const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
  const updatedAttributes = [...props.attributes]
  updatedAttributes[index] = { ...updatedAttributes[index], [field]: value }
  emit('update:attributes', updatedAttributes)
}

const addAttribute = () => {
  emit('update:attributes', [...props.attributes, { key: '', value: '' }])
}

const removeAttribute = (index: number) => {
  if (props.attributes.length > 1) {
    const updatedAttributes = props.attributes.filter((_, i) => i !== index)
    emit('update:attributes', updatedAttributes)
  } else {
    emit('update:attributes', [{ key: '', value: '' }])
  }
}
</script>
