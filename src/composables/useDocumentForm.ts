import { ref, computed } from 'vue'

export interface Field {
  id: string
  name: string
  type: string
  value: any
}

export function useDocumentForm() {
  // Form state
  const documentId = ref('')
  const fields = ref<Field[]>([])
  const loading = ref(false)

  // Computed
  const isFormValid = computed(() => {
    // No specific validation required for documents - empty documents are allowed
    return true
  })

  // Helper functions
  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const buildFirestoreValue = (value: any): any => {
    if (value === null || value === undefined) {
      return { nullValue: null }
    }

    if (typeof value === 'string') {
      return { stringValue: value }
    }

    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { integerValue: value.toString() }
        : { doubleValue: value }
    }

    if (typeof value === 'boolean') {
      return { booleanValue: value }
    }

    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(item => buildFirestoreValue(item))
        }
      }
    }

    if (typeof value === 'object') {
      const fields: Record<string, any> = {}
      for (const [key, val] of Object.entries(value)) {
        // Skip temporary keys (empty field names)
        if (!key.startsWith('_temp_')) {
          fields[key] = buildFirestoreValue(val)
        }
      }
      return { mapValue: { fields } }
    }

    return { stringValue: String(value) }
  }

  const buildDocumentFields = () => {
    const documentFields: Record<string, any> = {}
    for (const field of fields.value) {
      if (field.name.trim()) {
        documentFields[field.name] = buildFirestoreValue(field.value)
      }
    }

    // If no fields have names, create an empty document
    if (Object.keys(documentFields).length === 0) {
      // Firestore requires at least some content, so we'll create a timestamp field
      documentFields['created_at'] = buildFirestoreValue(new Date().toISOString())
    }

    return documentFields
  }

  // Field management
  const addField = () => {
    fields.value.push({
      id: generateFieldId(),
      name: '',
      type: 'string',
      value: ''
    })
  }

  const updateFieldValue = (fieldId: string, updates: Partial<Field>) => {
    const field = fields.value.find(f => f.id === fieldId)
    if (field) {
      Object.assign(field, updates)
    }
  }

  const removeField = (fieldId: string) => {
    const index = fields.value.findIndex(f => f.id === fieldId)
    if (index > -1) {
      fields.value.splice(index, 1)

      // Ensure there's always at least one field
      if (fields.value.length === 0) {
        fields.value.push({
          id: generateFieldId(),
          name: '',
          type: 'string',
          value: ''
        })
      }
    }
  }

  // Reset form
  const resetForm = () => {
    documentId.value = ''
    fields.value = [{
      id: generateFieldId(),
      name: '',
      type: 'string',
      value: ''
    }]
    loading.value = false
  }

  // Initialize with one empty field
  resetForm()

  return {
    // State
    documentId,
    fields,
    loading,

    // Computed
    isFormValid,

    // Methods
    addField,
    updateFieldValue,
    removeField,
    resetForm,
    buildDocumentFields,
    buildFirestoreValue
  }
}