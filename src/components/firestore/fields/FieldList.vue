<template>
  <div class="space-y-1">
    <template v-for="(value, fieldName) in fields" :key="fieldName">
      <FieldItem
        :field-name="fieldName"
        :field-value="value"
        :field-path="fieldName"
        :expanded-fields="expandedFields"
        @toggle-field="$emit('toggle-field', $event)"
        @edit-field="$emit('edit-field', $event)"
        @delete-field="$emit('delete-field', $event)"
        @add-to-map="$emit('add-to-map', $event)"
        @add-to-array="$emit('add-to-array', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import FieldItem from './FieldItem.vue'

interface Props {
  fields: Record<string, any>
  expandedFields: Set<string>
}

defineProps<Props>()

defineEmits<{
  'toggle-field': [fieldName: string]
  'edit-field': [data: any]
  'delete-field': [data: any]
  'add-to-map': [fieldPath: string]
  'add-to-array': [fieldPath: string]
}>()
</script>
