<template>
  <div class="relative">
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        ref="searchInput"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="handleSearch"
        @keydown="handleKeydown"
        type="text"
        placeholder="Search..."
        class="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:bg-gray-800 dark:text-white dark:focus:bg-gray-700"
      />
      <kbd class="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
        ⌘K
      </kbd>
    </div>

    <!-- Search Results Dropdown -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && (searchQuery || recentSearches.length > 0)"
        class="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-96 overflow-y-auto"
      >
        <div v-if="isLoading" class="p-4">
          <div class="flex items-center space-x-2">
            <div class="spinner"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
          </div>
        </div>

        <div v-else-if="searchQuery && searchResults.length === 0" class="p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">No results found for "{{ searchQuery }}"</div>
        </div>

        <div v-else>
          <!-- Recent searches when no query -->
          <div v-if="!searchQuery && recentSearches.length > 0">
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              Recent Searches
            </div>
            <button
              v-for="(search, index) in recentSearches"
              :key="index"
              @click="selectResult(search)"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ClockIcon class="w-4 h-4 mr-3 text-gray-400" />
              {{ search.title }}
            </button>
          </div>

          <!-- Search results -->
          <div v-if="searchQuery && searchResults.length > 0">
            <div
              v-for="(group, groupName) in groupedResults"
              :key="groupName"
            >
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                {{ groupName }}
              </div>
              <button
                v-for="(result, index) in group"
                :key="`${groupName}-${index}`"
                @click="selectResult(result)"
                :class="{
                  'bg-gray-100 dark:bg-gray-700': index === selectedIndex && currentGroup === groupName
                }"
                class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <component :is="result.icon" class="w-4 h-4 mr-3 text-gray-400" />
                <div class="flex-1 text-left">
                  <div class="font-medium">{{ result.title }}</div>
                  <div v-if="result.description" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ result.description }}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MagnifyingGlassIcon, ClockIcon, QueueListIcon, InboxStackIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import { useMessageTemplatesStore } from '@/stores/messageTemplates'
import type { PubSubTopic, PubSubSubscription, MessageTemplate } from '@/types'

interface SearchResult {
  title: string
  description?: string
  type: 'topic' | 'subscription' | 'template'
  icon: any
  route: string
  focusTarget?: string
}

const router = useRouter()
const route = useRoute()
const messageTemplatesStore = useMessageTemplatesStore()

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const isOpen = ref(false)
const isLoading = ref(false)
const selectedIndex = ref(0)
const currentGroup = ref('')

const recentSearches = ref<SearchResult[]>([])
const searchResults = ref<SearchResult[]>([])
const allTopics = ref<PubSubTopic[]>([])
const allSubscriptions = ref<PubSubSubscription[]>([])
const allTemplates = ref<MessageTemplate[]>([])

// Get current project ID from route
const currentProjectId = computed(() => route.params.projectId as string)

// Helper functions
const getTopicDisplayName = (fullName: string): string => {
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

const getSubscriptionDisplayName = (fullName: string): string => {
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

// Load data for search
const loadSearchData = async () => {
  if (!currentProjectId.value) return
  
  try {
    // Load topics
    const topics = await topicsApi.getTopics(currentProjectId.value)
    allTopics.value = topics || []
    
    // Load subscriptions
    const subscriptions = await subscriptionsApi.getSubscriptions(currentProjectId.value)
    allSubscriptions.value = Array.isArray(subscriptions) ? subscriptions : []
    
    // Load message templates from store
    await messageTemplatesStore.loadTemplates()
    allTemplates.value = messageTemplatesStore.templates || []
  } catch (error) {
    console.warn('Failed to load search data:', error)
    allTopics.value = []
    allSubscriptions.value = []
    allTemplates.value = []
  }
}

// Real search function using actual data
const performSearch = async (query: string) => {
  if (!query.trim()) {
    searchResults.value = []
    return
  }

  isLoading.value = true
  
  // Simulate slight delay for better UX
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()
  
  // Search through topics
  allTopics.value.forEach(topic => {
    const displayName = getTopicDisplayName(topic.name)
    const fullName = topic.name
    
    if (displayName.toLowerCase().includes(lowerQuery) || 
        fullName.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: displayName,
        description: `Topic: ${fullName}`,
        type: 'topic',
        icon: QueueListIcon,
        route: `/projects/${currentProjectId.value}/pubsub/topics`,
        focusTarget: displayName
      })
    }
  })
  
  // Search through subscriptions
  allSubscriptions.value.forEach(subscription => {
    const displayName = getSubscriptionDisplayName(subscription.name)
    const fullName = subscription.name
    const topicName = subscription.topic || subscription.topicName || 'unknown'
    
    if (displayName.toLowerCase().includes(lowerQuery) || 
        fullName.toLowerCase().includes(lowerQuery) ||
        topicName.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: displayName,
        description: `Subscription for topic: ${getTopicDisplayName(topicName)}`,
        type: 'subscription',
        icon: InboxStackIcon,
        route: `/projects/${currentProjectId.value}/pubsub/subscriptions`,
        focusTarget: getTopicDisplayName(topicName)
      })
    }
  })
  
  // Search through message templates
  allTemplates.value.forEach(template => {
    const name = template.name || 'Untitled Template'
    const description = template.description || ''
    const data = template.data || ''
    
    if (name.toLowerCase().includes(lowerQuery) || 
        description.toLowerCase().includes(lowerQuery) ||
        data.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: name,
        description: description || `Template with ${template.data?.length || 0} characters`,
        type: 'template',
        icon: DocumentTextIcon,
        route: `/projects/${currentProjectId.value}/pubsub/message-templates`
      })
    }
  })
  
  // Sort results by relevance (exact matches first)
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === lowerQuery
    const bExact = b.title.toLowerCase() === lowerQuery
    if (aExact && !bExact) return -1
    if (!aExact && bExact) return 1
    return a.title.localeCompare(b.title)
  })

  searchResults.value = results.slice(0, 20) // Limit to 20 results
  isLoading.value = false
}

const groupedResults = computed(() => {
  const groups: Record<string, SearchResult[]> = {}
  
  searchResults.value.forEach(result => {
    let groupName = ''
    switch (result.type) {
      case 'topic':
        groupName = 'Topics'
        break
      case 'subscription':
        groupName = 'Subscriptions'
        break
      case 'template':
        groupName = 'Message Templates'
        break
      default:
        groupName = 'Other'
    }
    
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(result)
  })
  
  return groups
})

const handleSearch = () => {
  performSearch(searchQuery.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isOpen.value = false
    searchInput.value?.blur()
  } else if (event.key === 'Enter') {
    // Handle selection
    const allResults = Object.values(groupedResults.value).flat()
    if (allResults[selectedIndex.value]) {
      selectResult(allResults[selectedIndex.value])
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    // Navigate down
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    // Navigate up
  }
}

const selectResult = (result: SearchResult) => {
  // Add to recent searches
  recentSearches.value = [result, ...recentSearches.value.filter(r => r.title !== result.title)].slice(0, 5)
  
  // Navigate to result with focus target
  let targetRoute = result.route
  if (result.focusTarget) {
    if (result.type === 'topic') {
      // For topics, focus on the topic itself
      targetRoute = `${result.route}#${result.focusTarget}`
    } else if (result.type === 'subscription') {
      // For subscriptions, focus on the topic that contains the subscription
      targetRoute = `${result.route}#${result.focusTarget}`
    }
  }
  
  router.push(targetRoute)
  
  // Close search
  isOpen.value = false
  searchQuery.value = ''
  searchInput.value?.blur()
}

// Global keyboard shortcut
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('click', handleClickOutside)
  
  // Load initial search data
  loadSearchData()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('click', handleClickOutside)
})

// Watch for project changes and reload data
watch(currentProjectId, (newProjectId) => {
  if (newProjectId) {
    loadSearchData()
  } else {
    // Clear data when no project is selected
    allTopics.value = []
    allSubscriptions.value = []
    allTemplates.value = []
    searchResults.value = []
  }
}, { immediate: true })
</script>