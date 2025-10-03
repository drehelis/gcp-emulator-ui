<template>
  <div class="relative">
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 theme-transition-colors" />
      <input
        ref="searchInput"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="handleSearch"
        @keydown="handleKeydown"
        type="text"
        placeholder="Search..."
        class="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:bg-gray-800 dark:text-white dark:focus:bg-gray-700 theme-transition-colors"
      />
      <kbd class="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 theme-transition-colors">
        ⌘K
      </kbd>
    </div>

    <!-- Search Results Dropdown -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && (searchQuery || recentSearches.length > 0)"
        class="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-96 overflow-y-auto theme-transition-colors"
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
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 theme-transition-colors">
                {{ groupName }}
              </div>
              <button
                v-for="(result, index) in group"
                :key="`${groupName}-${index}`"
                @click="selectResult(result)"
                :class="{
                  'bg-gray-100 dark:bg-gray-700': index === selectedIndex && currentGroup === groupName
                }"
                class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 theme-transition-colors"
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
import { MagnifyingGlassIcon, ClockIcon, QueueListIcon, InboxStackIcon, DocumentTextIcon, ArchiveBoxIcon, DocumentIcon, CircleStackIcon } from '@heroicons/vue/24/outline'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import storageApi from '@/api/storage'
import firestoreApi from '@/api/firestore'
import { useMessageTemplatesStore } from '@/stores/messageTemplates'
import { useTopicsStore } from '@/stores/topics'
import { useStorageStore } from '@/stores/storage'
import { useFirestoreStore } from '@/stores/firestore'
import type { PubSubTopic, PubSubSubscription, MessageTemplate, StorageBucket, StorageObjectWithPreview } from '@/types'
import type { FirestoreCollectionWithMetadata } from '@/types/firestore'

interface SearchResult {
  title: string
  description?: string
  type: 'topic' | 'subscription' | 'template' | 'bucket' | 'object' | 'collection' | 'document'
  icon: any
  route: string
  focusTarget?: string
  bucket?: string
  objectPath?: string
  collectionId?: string
  documentPath?: string
  pathString?: string // For Firestore navigation path
}

const router = useRouter()
const route = useRoute()
const messageTemplatesStore = useMessageTemplatesStore()
const topicsStore = useTopicsStore()
const storageStore = useStorageStore()
const firestoreStore = useFirestoreStore()

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
const allBuckets = ref<StorageBucket[]>([])
const allObjects = ref<StorageObjectWithPreview[]>([])
const allCollections = ref<FirestoreCollectionWithMetadata[]>([])

// Configuration constants
const SEARCH_CONFIG = {
  CACHE_TTL: 30000, // 30 seconds cache
  DEBOUNCE_DELAY: 300, // 300ms search debounce
  REFRESH_INTERVAL: 30000, // 30 seconds refresh interval
  MIN_QUERY_LENGTH_FOR_OBJECTS: 2, // Minimum query length to search objects
  MIN_QUERY_LENGTH_FOR_PATTERNS: 3, // Minimum query length for pattern matching
  MIN_QUERY_LENGTH_FOR_DOCUMENTS: 3, // Minimum query length to search Firestore documents
  MAX_BUCKETS_TO_SEARCH: 3, // Maximum buckets to search per query
  MAX_OBJECTS_PER_BUCKET: 50, // Maximum objects to fetch per bucket
  MAX_COLLECTIONS_TO_SEARCH: 5, // Maximum collections to search for documents
  MAX_DOCUMENTS_PER_COLLECTION: 100, // Maximum documents to fetch per collection
  MAX_SUBCOLLECTION_DEPTH: 3, // Maximum depth to search in subcollections
  COMMON_BUCKET_PREFIXES: ['tmp', 'temp', 'data', 'files', 'uploads', 'assets', 'logs', 'backup', 'cache']
} as const

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

// Cache for loaded data with timestamps
const dataCache = ref<{
  topics: { data: PubSubTopic[], timestamp: number } | null
  subscriptions: { data: PubSubSubscription[], timestamp: number } | null
  templates: { data: MessageTemplate[], timestamp: number } | null
  buckets: { data: StorageBucket[], timestamp: number } | null
  collections: { data: FirestoreCollectionWithMetadata[], timestamp: number } | null
}>({
  topics: null,
  subscriptions: null,
  templates: null,
  buckets: null,
  collections: null
})

// Helper to check if cache is valid
const isCacheValid = (cacheEntry: { timestamp: number } | null): boolean => {
  if (!cacheEntry) return false
  return Date.now() - cacheEntry.timestamp < SEARCH_CONFIG.CACHE_TTL
}

// Load basic data for search (no objects initially)
const loadSearchData = async () => {
  if (!currentProjectId.value) return

  // Load topics (PubSub) with caching
  if (!isCacheValid(dataCache.value.topics)) {
    try {
      const topics = await topicsApi.getTopics(currentProjectId.value)
      dataCache.value.topics = { data: topics || [], timestamp: Date.now() }
      allTopics.value = dataCache.value.topics.data
    } catch (error) {
      console.warn('Failed to load topics:', error)
      allTopics.value = []
    }
  } else {
    allTopics.value = dataCache.value.topics.data
  }

  // Load subscriptions (PubSub) with caching
  if (!isCacheValid(dataCache.value.subscriptions)) {
    try {
      const subscriptions = await subscriptionsApi.getSubscriptions(currentProjectId.value)
      dataCache.value.subscriptions = { data: Array.isArray(subscriptions) ? subscriptions : [], timestamp: Date.now() }
      allSubscriptions.value = dataCache.value.subscriptions.data
    } catch (error) {
      console.warn('Failed to load subscriptions:', error)
      allSubscriptions.value = []
    }
  } else {
    allSubscriptions.value = dataCache.value.subscriptions.data
  }

  // Load message templates (local storage) with caching
  if (!isCacheValid(dataCache.value.templates)) {
    try {
      await messageTemplatesStore.loadTemplates()
      dataCache.value.templates = { data: messageTemplatesStore.templates || [], timestamp: Date.now() }
      allTemplates.value = dataCache.value.templates.data
    } catch (error) {
      console.warn('Failed to load templates:', error)
      allTemplates.value = []
    }
  } else {
    allTemplates.value = dataCache.value.templates.data
  }

  // Load storage buckets with caching
  if (!isCacheValid(dataCache.value.buckets)) {
    try {
      const bucketsResponse = await storageApi.listBuckets({
        project: currentProjectId.value
      })
      dataCache.value.buckets = { data: bucketsResponse.items || [], timestamp: Date.now() }
      allBuckets.value = dataCache.value.buckets.data
    } catch (error) {
      console.warn('Failed to load storage buckets:', error)
      allBuckets.value = []
    }
  } else {
    allBuckets.value = dataCache.value.buckets.data
  }

  // Load Firestore collections with caching
  if (!isCacheValid(dataCache.value.collections)) {
    try {
      await firestoreStore.loadCollections(currentProjectId.value)
      dataCache.value.collections = { data: firestoreStore.collections || [], timestamp: Date.now() }
      allCollections.value = dataCache.value.collections.data
    } catch (error) {
      console.warn('Failed to load Firestore collections:', error)
      allCollections.value = []
    }
  } else {
    allCollections.value = dataCache.value.collections.data
  }

  // DON'T load all objects immediately - only load when searching for objects
}

// Helper to recursively search through document fields
const searchInDocumentFields = (fields: any, query: string, path: string = ''): { found: boolean; matchedPath: string; matchedValue: string } | null => {
  if (!fields) return null

  const lowerQuery = query.toLowerCase()

  for (const [key, value] of Object.entries(fields)) {
    const currentPath = path ? `${path}.${key}` : key

    // Check if key matches
    if (key.toLowerCase().includes(lowerQuery)) {
      return {
        found: true,
        matchedPath: currentPath,
        matchedValue: `field: ${key}`
      }
    }

    // Check value based on type
    if (value && typeof value === 'object') {
      // Handle Firestore value types
      if ('stringValue' in value && typeof value.stringValue === 'string') {
        if (value.stringValue.toLowerCase().includes(lowerQuery)) {
          return {
            found: true,
            matchedPath: currentPath,
            matchedValue: value.stringValue
          }
        }
      } else if ('integerValue' in value && value.integerValue?.toString().includes(query)) {
        return {
          found: true,
          matchedPath: currentPath,
          matchedValue: value.integerValue.toString()
        }
      } else if ('doubleValue' in value && value.doubleValue?.toString().includes(query)) {
        return {
          found: true,
          matchedPath: currentPath,
          matchedValue: value.doubleValue.toString()
        }
      } else if ('booleanValue' in value && value.booleanValue?.toString().toLowerCase().includes(lowerQuery)) {
        return {
          found: true,
          matchedPath: currentPath,
          matchedValue: value.booleanValue.toString()
        }
      } else if ('mapValue' in value && value.mapValue?.fields) {
        // Recursively search nested maps
        const nestedResult = searchInDocumentFields(value.mapValue.fields, query, currentPath)
        if (nestedResult) return nestedResult
      } else if ('arrayValue' in value && value.arrayValue?.values) {
        // Search through array values
        for (let i = 0; i < value.arrayValue.values.length; i++) {
          const arrayItem = value.arrayValue.values[i]
          const arrayPath = `${currentPath}[${i}]`

          if (arrayItem && typeof arrayItem === 'object') {
            if ('stringValue' in arrayItem && arrayItem.stringValue?.toLowerCase().includes(lowerQuery)) {
              return {
                found: true,
                matchedPath: arrayPath,
                matchedValue: arrayItem.stringValue
              }
            } else if ('mapValue' in arrayItem && arrayItem.mapValue?.fields) {
              const nestedResult = searchInDocumentFields(arrayItem.mapValue.fields, query, arrayPath)
              if (nestedResult) return nestedResult
            }
          }
        }
      }
    }
  }

  return null
}

// Lazy load and search Firestore documents deeply
const loadDocumentsForSearch = async (query: string): Promise<SearchResult[]> => {
  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()
  const databasePath = firestoreStore.getCurrentDatabasePath(currentProjectId.value)

  // Get collections to search (all collections or filtered by query)
  const collectionsToSearch = allCollections.value
    .filter(col => {
      const colId = col.id || col.name || ''
      // Search all collections if query is generic, or filter if query seems specific
      return colId.toLowerCase().includes(lowerQuery) || allCollections.value.length <= SEARCH_CONFIG.MAX_COLLECTIONS_TO_SEARCH
    })
    .slice(0, SEARCH_CONFIG.MAX_COLLECTIONS_TO_SEARCH)

  // Recursive function to search documents in a collection/subcollection
  const searchCollectionDocuments = async (
    parentPath: string,
    collectionId: string,
    depth: number,
    breadcrumb: string[],
    isSubcollection: boolean = false
  ): Promise<void> => {
    if (depth > SEARCH_CONFIG.MAX_SUBCOLLECTION_DEPTH) return

    try {
      // Use different API methods for top-level vs subcollections
      const response = isSubcollection
        ? await firestoreApi.listSubcollectionDocuments(parentPath, collectionId)
        : await firestoreApi.listDocuments(parentPath, collectionId)

      for (const doc of response.documents.slice(0, SEARCH_CONFIG.MAX_DOCUMENTS_PER_COLLECTION)) {
        const docId = doc.name.split('/').pop() || ''
        const docPath = [...breadcrumb, collectionId, docId].join(' > ')
        // Build navigation path string (e.g., "/ > collection-1 > doc-id > sub-collection > doc-id2")
        const pathString = `/ > ${docPath}`

        // Search in document ID
        if (docId.toLowerCase().includes(lowerQuery)) {
          results.push({
            title: docId,
            description: `Document ID in ${docPath}`,
            type: 'document',
            icon: DocumentIcon,
            route: `/projects/${currentProjectId.value}/firestore/collections`,
            focusTarget: docId,
            collectionId,
            documentPath: doc.name,
            pathString
          })
        }

        // Search in document fields
        if (doc.fields) {
          const fieldMatch = searchInDocumentFields(doc.fields, query)
          if (fieldMatch) {
            results.push({
              title: docId,
              description: `${fieldMatch.matchedPath}: "${fieldMatch.matchedValue.substring(0, 50)}${fieldMatch.matchedValue.length > 50 ? '...' : ''}" in ${docPath}`,
              type: 'document',
              icon: DocumentIcon,
              route: `/projects/${currentProjectId.value}/firestore/collections`,
              focusTarget: docId,
              collectionId,
              documentPath: doc.name,
              pathString
            })
          }
        }

        // Search subcollections recursively
        if (depth < SEARCH_CONFIG.MAX_SUBCOLLECTION_DEPTH) {
          try {
            const subcollectionsResponse = await firestoreApi.listSubcollections(doc.name)

            for (const subcollection of subcollectionsResponse.collections) {
              const subCollectionId = subcollection.id || subcollection.name.split('/').pop() || ''
              await searchCollectionDocuments(
                doc.name,
                subCollectionId,
                depth + 1,
                [...breadcrumb, collectionId, docId],
                true  // This is a subcollection
              )
            }
          } catch {
            // No subcollections or error, continue
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to search collection ${collectionId}:`, error)
    }
  }

  // Search each top-level collection
  for (const collection of collectionsToSearch) {
    await searchCollectionDocuments(databasePath, collection.id, 0, [], false)
  }

  return results
}

// Helper functions for bucket filtering logic
const isDirectBucketMatch = (bucketName: string, query: string): boolean => {
  return bucketName.toLowerCase().includes(query.toLowerCase())
}

const isPathBasedMatch = (bucketName: string, query: string): boolean => {
  if (!query.includes('/')) return false

  const pathParts = query.split('/')
  const possibleBucket = pathParts[0]
  return bucketName.toLowerCase().includes(possibleBucket.toLowerCase())
}

const isQueryTooShort = (query: string): boolean => {
  return query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH_FOR_PATTERNS
}

const isOnStoragePage = (): boolean => {
  return router.currentRoute.value.path.includes('/storage/')
}

const hasCommonPatternMatch = (bucketName: string, query: string): boolean => {
  const lowerBucket = bucketName.toLowerCase()
  const lowerQuery = query.toLowerCase()

  return SEARCH_CONFIG.COMMON_BUCKET_PREFIXES.some(prefix =>
    lowerBucket.includes(prefix) && lowerQuery.includes(prefix)
  )
}

const shouldSearchBucket = (bucket: StorageBucket, query: string): boolean => {
  const bucketName = bucket.name || ''

  // Direct bucket name match
  if (isDirectBucketMatch(bucketName, query)) {
    return true
  }

  // Path-based search (e.g., "mybucket/folder/file")
  if (isPathBasedMatch(bucketName, query)) {
    return true
  }

  // Skip object search for very short queries
  if (isQueryTooShort(query)) {
    return false
  }

  // Search all buckets when on storage page with meaningful query
  if (isOnStoragePage() && query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH_FOR_PATTERNS) {
    return true
  }

  // Pattern-based matching for common bucket naming conventions
  return hasCommonPatternMatch(bucketName, query)
}

const getRelevantBuckets = (buckets: StorageBucket[], query: string): StorageBucket[] => {
  return buckets
    .filter(bucket => shouldSearchBucket(bucket, query))
    .slice(0, SEARCH_CONFIG.MAX_BUCKETS_TO_SEARCH)
}

// Lazy load storage objects only when needed
const loadObjectsForSearch = async (query: string): Promise<StorageObjectWithPreview[]> => {
  const objects: StorageObjectWithPreview[] = []
  const lowerQuery = query.toLowerCase()
  const bucketsToSearch = getRelevantBuckets(allBuckets.value, query)

  for (const bucket of bucketsToSearch) {
    try {
      const objectsResponse = await storageApi.listObjects({
        bucket: bucket.name,
        maxResults: SEARCH_CONFIG.MAX_OBJECTS_PER_BUCKET,
        prefix: lowerQuery.includes('/') ? lowerQuery : undefined // Use query as prefix if it contains '/'
      })

      if (objectsResponse.items) {
        const objectsWithBucket = objectsResponse.items.map(obj => ({
          ...obj,
          bucket: bucket.name,
          isFolder: obj.name.endsWith('/'),
          downloadUrl: storageApi.getObjectDownloadUrl(bucket.name, obj.name)
        } as StorageObjectWithPreview))

        objects.push(...objectsWithBucket)
      }
    } catch (error) {
      console.warn(`Failed to load objects from bucket ${bucket.name}:`, error)
    }
  }

  return objects
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

  // Search through storage buckets
  allBuckets.value.forEach(bucket => {
    const bucketName = bucket.name || ''
    const location = bucket.location || ''
    const storageClass = bucket.storageClass || ''

    if (bucketName.toLowerCase().includes(lowerQuery) ||
        location.toLowerCase().includes(lowerQuery) ||
        storageClass.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: bucketName,
        description: `Bucket in ${location} (${storageClass})`,
        type: 'bucket',
        icon: ArchiveBoxIcon,
        route: `/projects/${currentProjectId.value}/storage/buckets`,
        focusTarget: bucketName,
        bucket: bucketName
      })
    }
  })

  // Search through storage objects (lazy loaded)
  if (query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH_FOR_OBJECTS) { // Only search objects for queries with 2+ characters
    try {
      const objectsToSearch = await loadObjectsForSearch(query)
      objectsToSearch.forEach(obj => {
        const objectName = obj.name || ''
        const bucketName = obj.bucket || ''
        const contentType = obj.contentType || ''
        const fullPath = `${bucketName}/${objectName}`

        if (objectName.toLowerCase().includes(lowerQuery) ||
            contentType.toLowerCase().includes(lowerQuery) ||
            fullPath.toLowerCase().includes(lowerQuery)) {

          // Get just the filename for display
          const fileName = objectName.split('/').pop() || objectName

          results.push({
            title: fileName,
            description: `Object in ${bucketName}${obj.isFolder ? ' (folder)' : ` (${contentType || 'unknown type'})`}`,
            type: 'object',
            icon: obj.isFolder ? ArchiveBoxIcon : DocumentIcon,
            route: `/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName)}/objects`,
            focusTarget: objectName,
            bucket: bucketName,
            objectPath: objectName
          })
        }
      })
    } catch (error) {
      console.warn('Failed to search storage objects:', error)
    }
  }

  // Search through Firestore collections
  allCollections.value.forEach(collection => {
    const collectionId = collection.id || collection.name || ''
    const documentCount = collection.documentCount || 0
    // Build navigation path string for root collections
    const pathString = `/ > ${collectionId}`

    if (collectionId.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: collectionId,
        description: `Collection with ${documentCount} document${documentCount === 1 ? '' : 's'}`,
        type: 'collection',
        icon: CircleStackIcon,
        route: `/projects/${currentProjectId.value}/firestore/collections`,
        focusTarget: collectionId,
        collectionId,
        pathString
      })
    }
  })

  // Deep search through Firestore documents and fields (lazy loaded)
  if (query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH_FOR_DOCUMENTS) {
    try {
      const documentResults = await loadDocumentsForSearch(query)
      results.push(...documentResults)
    } catch (error) {
      console.warn('Failed to search Firestore documents:', error)
    }
  }

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
      case 'bucket':
        groupName = 'Storage Buckets'
        break
      case 'object':
        groupName = 'Storage Objects'
        break
      case 'collection':
        groupName = 'Firestore Collections'
        break
      case 'document':
        groupName = 'Firestore Documents'
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

// Debounce search to avoid excessive API calls
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const handleSearch = () => {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Debounce search by configured delay
  searchTimeout = setTimeout(() => {
    performSearch(searchQuery.value)
  }, SEARCH_CONFIG.DEBOUNCE_DELAY)
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
    } else if (result.type === 'bucket') {
      // For buckets, navigate to bucket list and focus on the bucket
      targetRoute = `${result.route}#${result.focusTarget}`
    } else if (result.type === 'object') {
      // For objects, navigate based on whether it's a file or folder
      if (result.bucket && result.objectPath) {
        if (result.objectPath.endsWith('/')) {
          // For folders, navigate to bucket browser with the folder as prefix
          targetRoute = `/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(result.bucket)}?prefix=${encodeURIComponent(result.objectPath)}`
        } else {
          // For files, navigate to the object details view
          targetRoute = `/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(result.bucket)}/objects/${encodeURIComponent(result.objectPath)}`
        }
      }
    } else if (result.type === 'collection') {
      // For collections, navigate to Firestore collections page with path navigation
      targetRoute = `/projects/${currentProjectId.value}/firestore/collections`
    } else if (result.type === 'document') {
      // For documents, navigate to Firestore collections page with path navigation
      targetRoute = `/projects/${currentProjectId.value}/firestore/collections`
    }
  }

  // For Firestore results, pass the pathString via router state to trigger auto-navigation
  if ((result.type === 'collection' || result.type === 'document') && result.pathString) {
    router.push({
      path: targetRoute,
      state: { navigateToPath: result.pathString }
    })
  } else {
    router.push(targetRoute)
  }

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

  // Clean up refresh interval
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }

  // Clean up search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

// Watch for project changes and reload data
watch(currentProjectId, (newProjectId) => {
  if (newProjectId) {
    // Invalidate cache for new project
    dataCache.value = {
      topics: null,
      subscriptions: null,
      templates: null,
      buckets: null
    }
    loadSearchData()
  } else {
    // Clear data when no project is selected
    allTopics.value = []
    allSubscriptions.value = []
    allTemplates.value = []
    allBuckets.value = []
    allObjects.value = []
    allCollections.value = []
    searchResults.value = []
    // Clear cache
    dataCache.value = {
      topics: null,
      subscriptions: null,
      templates: null,
      buckets: null,
      collections: null
    }
  }
}, { immediate: true })

// Watch for store changes to keep search data in sync
watch(() => topicsStore.topics, (newTopics) => {
  if (newTopics) {
    allTopics.value = newTopics
  }
}, { deep: true })

watch(() => storageStore.buckets, (newBuckets) => {
  if (newBuckets) {
    allBuckets.value = newBuckets
  }
}, { deep: true })

watch(() => storageStore.objects, (newObjects) => {
  if (newObjects) {
    // Transform storage objects to search format
    allObjects.value = newObjects.map(obj => ({
      ...obj,
      bucket: storageStore.currentBucket?.name || '',
      downloadUrl: obj.downloadUrl || ''
    }))
  }
}, { deep: true })

watch(() => messageTemplatesStore.templates, (newTemplates) => {
  if (newTemplates) {
    allTemplates.value = newTemplates
  }
}, { deep: true })

watch(() => firestoreStore.collections, (newCollections) => {
  if (newCollections) {
    allCollections.value = newCollections
  }
}, { deep: true })

// Refresh PubSub data when search is opened (reduced frequency)
let refreshInterval: ReturnType<typeof setInterval> | null = null
watch(isOpen, (open) => {
  if (open && currentProjectId.value) {
    // Only refresh if cache is stale
    if (!isCacheValid(dataCache.value.topics) || !isCacheValid(dataCache.value.subscriptions)) {
      refreshPubSubData()
    }

    // Set up less aggressive refresh while search is open
    if (!refreshInterval) {
      refreshInterval = setInterval(() => {
        if (isOpen.value && currentProjectId.value) {
          // Only refresh if cache is really stale (longer than cache TTL)
          if (!isCacheValid(dataCache.value.topics) || !isCacheValid(dataCache.value.subscriptions)) {
            refreshPubSubData()
          }
        }
      }, SEARCH_CONFIG.REFRESH_INTERVAL) // Refresh every 30 seconds
    }
  } else if (refreshInterval) {
    // Clean up interval when search is closed
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})

// Helper function to refresh topics and subscriptions data
const refreshPubSubData = async () => {
  if (!currentProjectId.value) return

  try {
    // Refresh both topics and subscriptions since they're created via direct API calls
    const [topics, subscriptions] = await Promise.all([
      topicsApi.getTopics(currentProjectId.value),
      subscriptionsApi.getSubscriptions(currentProjectId.value)
    ])

    allTopics.value = topics || []
    allSubscriptions.value = Array.isArray(subscriptions) ? subscriptions : []
  } catch (error) {
    console.warn('Failed to refresh topics and subscriptions:', error)
  }
}
</script>
