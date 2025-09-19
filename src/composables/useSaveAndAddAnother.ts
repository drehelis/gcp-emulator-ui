import { ref } from 'vue'

interface SaveAndAddAnotherConfig<T extends Record<string, any>> {
  entityType: 'document' | 'collection'
  validateForm: () => boolean
  setValidationError: (hasError: boolean) => void
  buildPayload: () => any
  saveEntity: (payload: any) => Promise<any>
  clearForm: () => void
  onSuccess: (savedId: string) => void
  getEntityId: (result: any) => string
  formState: T
}

export function useSaveAndAddAnother<T extends Record<string, any>>(config?: SaveAndAddAnotherConfig<T>) {
  const lastSavedId = ref<string | null>(null)
  const isLoading = ref(false)

  const setLastSaved = (id: string) => {
    lastSavedId.value = id
  }

  const clearNotification = () => {
    lastSavedId.value = null
  }

  const getSuccessMessage = (type: 'document' | 'collection', id: string) => {
    const entityType = type === 'document' ? 'document' : 'collection'
    return `Your previous ${entityType} '${id}' was saved.`
  }

  const handleSaveAndAddAnother = async () => {
    if (!config) {
      throw new Error('Configuration required for handleSaveAndAddAnother')
    }

    config.setValidationError(true)
    if (!config.validateForm()) return

    try {
      isLoading.value = true

      const payload = config.buildPayload()
      const result = await config.saveEntity(payload)

      if (result) {
        const savedId = config.getEntityId(result)

        // Set notification
        setLastSaved(savedId)

        // Clear form but keep field values
        config.clearForm()

        // Notify parent but DON'T close modal
        config.onSuccess(savedId)
      }
    } catch (error) {
      console.error(`Failed to create ${config.entityType}:`, error)
    } finally {
      isLoading.value = false
    }
  }

  const handleClearFields = () => {
    if (config?.formState) {
      // Reset all form fields
      Object.keys(config.formState).forEach(key => {
        if (config.formState[key]?.resetForm) {
          config.formState[key].resetForm()
        }
      })
    }
    clearNotification()
  }

  return {
    lastSavedId,
    isLoading,
    setLastSaved,
    clearNotification,
    getSuccessMessage,
    handleSaveAndAddAnother,
    handleClearFields
  }
}