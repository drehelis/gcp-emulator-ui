/**
 * Utility functions for handling Pub/Sub pre-configured message attributes
 */

import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'

interface MessageAttribute {
  key: string
  value: string
}

/**
 * Gets pre-configured message attributes from runtime configuration (reactive)
 * Returns a computed ref with array of key-value pairs that can be used in the PublishMessageModal
 *
 * @returns Computed ref of MessageAttribute objects array
 */
export function usePreconfiguredMessageAttributes() {
  const configStore = useConfigStore()
  return computed(() => {
    const attributes = configStore.pubsubPreConfiguredAttributes || {}
    return convertObjectToMessageAttributes(attributes)
  })
}

/**
 * Converts an object to MessageAttribute array with validation
 */
function convertObjectToMessageAttributes(
  attributesObj: Record<string, string>
): MessageAttribute[] {
  try {
    if (!attributesObj || typeof attributesObj !== 'object' || Array.isArray(attributesObj)) {
      return []
    }

    // Convert object to array of MessageAttribute objects
    const attributes: MessageAttribute[] = Object.entries(attributesObj)
      .filter(([key, value]) => {
        // Ensure both key and value are strings
        if (typeof key !== 'string' || typeof value !== 'string') {
          console.warn(`Ignoring attribute with invalid key or value: ${key}=${value}`)
          return false
        }
        // Only require key to be non-empty, allow empty values
        return key.trim() !== ''
      })
      .map(([key, value]) => ({
        key: key.trim(),
        value: value.trim(),
      }))

    return attributes
  } catch (error) {
    console.warn('Failed to process pre-configured message attributes:', error)
    return []
  }
}
