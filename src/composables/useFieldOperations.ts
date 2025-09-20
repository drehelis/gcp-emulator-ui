import { ref } from 'vue'
import { formatFieldValue, getFieldType, getEditableValue } from '@/utils/firestoreHelpers'

export const useFieldOperations = () => {
  const expandedMapFields = ref<Set<string>>(new Set())

  const toggleMapField = (fieldName: string) => {
    if (expandedMapFields.value.has(fieldName)) {
      expandedMapFields.value.delete(fieldName)
    } else {
      expandedMapFields.value.add(fieldName)
    }
  }

  const isMapFieldExpanded = (fieldName: string): boolean => {
    return expandedMapFields.value.has(fieldName)
  }

  const clearExpandedFields = () => {
    expandedMapFields.value.clear()
  }

  const restoreExpandedFields = (fieldsSet: Set<string>) => {
    expandedMapFields.value = fieldsSet
  }

  return {
    expandedMapFields,
    toggleMapField,
    isMapFieldExpanded,
    clearExpandedFields,
    restoreExpandedFields,
    formatFieldValue,
    getFieldType,
    getEditableValue
  }
}