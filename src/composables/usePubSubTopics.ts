import { ref } from 'vue'
import { topicsApi } from '@/api/pubsub'
import { useFeatureStore } from '@/stores/features'

export function usePubSubTopics() {
  const availableTopics = ref<any[]>([])
  const isLoadingTopics = ref(false)
  const featureStore = useFeatureStore()

  /**
   * Fetches topics for a given project.
   * Skips fetching if storage notifications are disabled or projectId is invalid.
   */
  const fetchTopics = async (projectId: string | null | undefined) => {
    if (!featureStore.storageNotifications || !projectId || projectId === 'Unknown') {
      return
    }

    isLoadingTopics.value = true
    try {
      availableTopics.value = await topicsApi.getTopics(projectId)
    } catch (error) {
      console.error('Failed to load topics', error)
      availableTopics.value = []
    } finally {
      isLoadingTopics.value = false
    }
  }

  return {
    availableTopics,
    isLoadingTopics,
    fetchTopics,
  }
}
