import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { topicsApi } from '@/api/pubsub'

interface MessageAttribute {
    key: string
    value: string
}

interface TemplateVariable {
    name: string
    value: string
}

export function useMessagePublisher() {
    const toast = useToast()

    // Form state
    const templateVariables = ref<TemplateVariable[]>([{ name: '', value: '' }])
    const messageAttributes = ref<MessageAttribute[]>([{ key: '', value: '' }])
    const messageData = ref('')
    const formatAsJson = ref(true)
    const isPublishing = ref(false)
    const jsonValidationError = ref('')

    // Computed properties
    const canPublish = computed(() => {
        if (!messageData.value.trim()) return false
        if (formatAsJson.value && jsonValidationError.value) return false
        return true
    })

    // JSON validation
    const validateJson = () => {
        if (!formatAsJson.value) {
            jsonValidationError.value = ''
            return
        }

        if (!messageData.value.trim()) {
            jsonValidationError.value = ''
            return
        }

        try {
            JSON.parse(messageData.value)
            jsonValidationError.value = ''
        } catch {
            jsonValidationError.value = 'Invalid JSON format'
        }
    }

    // Template processing
    const processTemplate = (template: string): string => {
        let processed = template

        templateVariables.value.forEach(variable => {
            if (variable.name.trim() && variable.value.trim()) {
                const placeholder = `{{.${variable.name.trim()}}}`
                processed = processed.replace(
                    new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    variable.value.trim()
                )
            }
        })

        return processed
    }

    // Message publishing
    const publishMessage = async (projectId: string, topicName: string) => {
        if (!canPublish.value) return

        isPublishing.value = true

        try {
            const attributes: Record<string, string> = {}
            messageAttributes.value.forEach(attr => {
                if (attr.key.trim() && attr.value.trim()) {
                    attributes[attr.key.trim()] = attr.value.trim()
                }
            })

            let data = processTemplate(messageData.value)

            if (formatAsJson.value) {
                try {
                    const parsed = JSON.parse(data)
                    data = JSON.stringify(parsed, null, 2)
                } catch {
                    // Keep original data if JSON parsing fails
                }
            }

            const response = await topicsApi.publishMessage(projectId, topicName, {
                data: btoa(data),
                attributes
            })

            toast.success(`Message published successfully to topic "${topicName}"`)
            return response.messageIds?.[0] || 'unknown'
        } catch (error: any) {
            console.error('Error publishing message:', error)
            toast.error(error.message || 'Failed to publish message')
            throw error
        } finally {
            isPublishing.value = false
        }
    }

    const loadFromTemplate = (template: { data: string; attributes: Record<string, string>; variables: Record<string, string> }) => {
        messageData.value = template.data

        try {
            JSON.parse(template.data)
            formatAsJson.value = true
        } catch {
            formatAsJson.value = false
        }

        const variables = Object.entries(template.variables || {})
        if (variables.length > 0) {
            templateVariables.value = variables.map(([name, value]) => ({ name, value }))
        } else {
            templateVariables.value = [{ name: '', value: '' }]
        }

        const attrs = Object.entries(template.attributes)
        if (attrs.length > 0) {
            messageAttributes.value = attrs.map(([key, value]) => ({ key, value }))
        } else {
            messageAttributes.value = [{ key: '', value: '' }]
        }
    }

    // Form reset
    const resetForm = () => {
        templateVariables.value = [{ name: '', value: '' }]
        messageAttributes.value = [{ key: '', value: '' }]
        messageData.value = ''
        formatAsJson.value = true
        jsonValidationError.value = ''
    }

    // Watch for JSON format changes
    watch([messageData, formatAsJson], () => {
        validateJson()
    })

    return {
        // State
        templateVariables,
        messageAttributes,
        messageData,
        formatAsJson,
        isPublishing,
        jsonValidationError,

        // Computed
        canPublish,

        // Methods
        publishMessage,
        loadFromTemplate,
        resetForm,
        validateJson
    }
}
