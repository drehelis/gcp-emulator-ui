<template>
  <div class="space-y-3">
    <div v-for="(item, index) in items" :key="index" class="flex items-end space-x-4">
      <div class="flex-1 space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
          {{ keyLabel }}
        </label>
        <input
          :value="getItemKey(item)"
          @input="updateItem(index, 'key', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="keyPlaceholder"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
        />
      </div>
      <div class="flex-1 space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
          {{ valueLabel }}
        </label>
        <input
          :value="item.value"
          @input="updateItem(index, 'value', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="valuePlaceholder"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
        />
      </div>
      <button
        @click="removeItem(index)"
        class="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-end mb-0"
        :title="`Remove ${itemType}`"
      >
        <TrashIcon class="h-4 w-4" />
      </button>
    </div>

    <button
      @click="addItem"
      class="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <PlusIcon class="h-4 w-4 mr-1" />
      Add {{ itemType }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends { value: string }">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface Props {
  items: T[]
  keyLabel: string
  valueLabel: string
  keyPlaceholder: string
  valuePlaceholder: string
  itemType: string
}

interface Emits {
  'update:items': [items: T[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getItemKey = (item: T): string => {
  if ('key' in item) {
    return (item as any).key
  }
  if ('name' in item) {
    return (item as any).name
  }
  return ''
}

const updateItem = (index: number, field: 'key' | 'value', value: string) => {
  const updatedItems = [...props.items]
  const currentItem = updatedItems[index]

  if (field === 'key') {
    if ('key' in currentItem) {
      updatedItems[index] = { ...currentItem, key: value } as T
    } else if ('name' in currentItem) {
      updatedItems[index] = { ...currentItem, name: value } as T
    }
  } else {
    updatedItems[index] = { ...currentItem, value } as T
  }

  emit('update:items', updatedItems)
}

const addItem = () => {
  const sampleItem = props.items[0]
  let newItem: T

  if ('key' in sampleItem) {
    newItem = { key: '', value: '' } as T
  } else {
    newItem = { name: '', value: '' } as T
  }

  emit('update:items', [...props.items, newItem])
}

const removeItem = (index: number) => {
  if (props.items.length > 1) {
    const updatedItems = props.items.filter((_, i) => i !== index)
    emit('update:items', updatedItems)
  } else {
    const sampleItem = props.items[0]
    let resetItem: T

    if ('key' in sampleItem) {
      resetItem = { key: '', value: '' } as T
    } else {
      resetItem = { name: '', value: '' } as T
    }

    emit('update:items', [resetItem])
  }
}
</script>
