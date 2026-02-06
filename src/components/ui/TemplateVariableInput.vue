<template>
  <div class="space-y-2">
    <div
      v-for="(variable, index) in variables"
      :key="index"
      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
    >
      <div class="flex-1">
        <input
          :value="variable.name"
          @input="updateVariable(index, 'name', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Variable name (e.g., userId)"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
      <div class="flex-1">
        <input
          :value="variable.value"
          @input="updateVariable(index, 'value', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Variable value"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
      <div class="flex justify-center sm:justify-start">
        <button
          @click="removeVariable(index)"
          class="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Remove variable"
        >
          <TrashIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <button
      @click="addVariable"
      class="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
    >
      <PlusIcon class="h-4 w-4 mr-2" />
      Add Template Variable
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface TemplateVariable {
  name: string
  value: string
}

interface Props {
  variables: TemplateVariable[]
}

interface Emits {
  'update:variables': [variables: TemplateVariable[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const updateVariable = (index: number, field: 'name' | 'value', value: string) => {
  const updatedVariables = [...props.variables]
  updatedVariables[index] = { ...updatedVariables[index], [field]: value }
  emit('update:variables', updatedVariables)
}

const addVariable = () => {
  emit('update:variables', [...props.variables, { name: '', value: '' }])
}

const removeVariable = (index: number) => {
  if (props.variables.length > 1) {
    const updatedVariables = props.variables.filter((_, i) => i !== index)
    emit('update:variables', updatedVariables)
  } else {
    emit('update:variables', [{ name: '', value: '' }])
  }
}
</script>
