<template>
  <div>
    <!-- Main page content removed for now -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'

const appStore = useAppStore()
const projectsStore = useProjectsStore()

const isLoading = ref(false)

const stats = ref({
  topics: 0,
  subscriptions: 0,
  schemas: 0,
  messagestoday: 0
})

const recentActivity = ref<Array<{
  id: string
  description: string
  timestamp: string
}>>([])

const refreshData = async () => {
  isLoading.value = true
  
  try {
    if (projectsStore.selectedProject) {
      // Load real data from the emulator
      await Promise.all([
        // TODO: Implement actual API calls to get real data from the emulator
        // For now, just initialize with zero values
        Promise.resolve(0), // topicsApi.getTopics(projectsStore.selectedProject)
        Promise.resolve(0)  // subscriptionsApi.getSubscriptions(projectsStore.selectedProject)
      ])
      
      stats.value.topics = 0 // topics.length
      stats.value.subscriptions = 0 // subscriptions.length
      stats.value.schemas = 0
      stats.value.messagestoday = 0
      
      recentActivity.value = []
    } else {
      // Reset stats when no project selected
      stats.value.topics = 0
      stats.value.subscriptions = 0
      stats.value.schemas = 0
      stats.value.messagestoday = 0
      recentActivity.value = []
    }
  } catch (error) {
    console.error('Error refreshing dashboard data:', error)
    appStore.showToast({
      type: 'error',
      title: 'Error',
      message: 'Failed to refresh dashboard data'
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>