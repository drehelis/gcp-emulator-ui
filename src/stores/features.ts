import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFeatureStore = defineStore('features', () => {
  // Flag state
  const flags = ref({
    /**
     * This is a new feature in fake-gcs-server.
     * See: https://github.com/fsouza/fake-gcs-server/pull/2157
     */
    storageNotifications: true,
  })

  // Computed for easy access
  const storageNotifications = computed(() => flags.value.storageNotifications)

  // Actions to disable features upon 404/501
  function disableStorageNotifications() {
    if (flags.value.storageNotifications) {
      console.warn('Storage emulator does not support notifications. Disabling feature.')
      flags.value.storageNotifications = false
    }
  }

  return {
    storageNotifications,
    disableStorageNotifications,
  }
})
