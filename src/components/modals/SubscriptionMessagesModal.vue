<template>
  <BaseModal
    v-model="internalModelValue"
    :title="`Pull Messages`"
    size="full"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Header with subscription info and actions -->
      <div class="flex flex-col space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div class="flex items-center space-x-3 min-w-0">
          <InboxStackIcon class="h-6 w-6 text-green-500 flex-shrink-0" />
          <div class="min-w-0">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
              {{ subscriptionDisplayName }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ subscription?.name }}
            </p>
          </div>
        </div>
        <div class="flex items-center justify-between space-x-3 sm:justify-end">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {{ messages.length }} messages
          </span>
          <button
            @click="$emit('pull-messages')"
            :disabled="isPulling"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 sm:px-4"
          >
            <ArrowDownTrayIcon :class="['h-4 w-4 mr-1 sm:mr-2', { 'animate-pulse': isPulling }]" />
            <span v-if="!isPulling" class="hidden sm:inline">Pull Messages</span>
            <span v-if="!isPulling" class="sm:hidden">Pull</span>
            <span v-else class="flex items-center">
              <span class="hidden sm:inline">Pulling...</span>
              <span class="sm:hidden">...</span>
              <span class="ml-2 text-xs opacity-75 hidden sm:inline">(may take up to 3min)</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Messages list -->
      <div v-if="messages.length > 0" class="space-y-4">
        <!-- Bulk actions -->
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            Messages ({{ messages.length }})
          </h4>
          <button
            @click="subscription?.name && $emit('acknowledge-all', subscription.name)"
            :disabled="isAcknowledging"
            class="inline-flex items-center px-3 py-1.5 border border-green-300 dark:border-green-600 rounded-md text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckIcon :class="['h-3 w-3 mr-1', { 'animate-pulse': isAcknowledging }]" />
            {{ isAcknowledging ? 'Acknowledging...' : 'Acknowledge All' }}
          </button>
        </div>

        <!-- Messages table -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message ID</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Preview</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attributes</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Published</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attempt</th>
                <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <template v-for="receivedMessage in messages" :key="receivedMessage.ackId">
                <!-- Main row (always visible, clickable) -->
                <tr 
                  @click="toggleMessageExpansion(receivedMessage.ackId)"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <!-- Expand/Collapse Icon -->
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                      <svg 
                        :class="['w-4 h-4 text-gray-400 transition-transform', expandedMessages.has(receivedMessage.ackId) ? 'rotate-90' : '']"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                      <code class="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        {{ receivedMessage.message.messageId.length > 8 ? receivedMessage.message.messageId.substring(0, 8) + '...' : receivedMessage.message.messageId }}
                      </code>
                    </div>
                  </td>
                  
                  <!-- Data Preview -->
                  <td class="px-3 py-2 max-w-xs">
                    <div class="text-xs font-mono text-gray-900 dark:text-gray-200 truncate">
                      <span v-if="receivedMessage.message.data">{{ decodeBase64(receivedMessage.message.data).substring(0, 50) }}...</span>
                      <span v-else class="italic text-gray-400">(empty)</span>
                    </div>
                  </td>
                  
                  <!-- Size -->
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getDataSize(receivedMessage.message.data) }}
                    </span>
                  </td>
                  
                  <!-- Attributes -->
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span v-if="receivedMessage.message.attributes && Object.keys(receivedMessage.message.attributes).length > 0" 
                          class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      {{ Object.keys(receivedMessage.message.attributes).length }} attr{{ Object.keys(receivedMessage.message.attributes).length !== 1 ? 's' : '' }}
                    </span>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </td>
                  
                  <!-- Published Time -->
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatRelativeTime(new Date(receivedMessage.message.publishTime)) }}
                    </span>
                  </td>
                  
                  <!-- Delivery Attempt -->
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span v-if="receivedMessage.deliveryAttempt > 1" 
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                      {{ receivedMessage.deliveryAttempt }}
                    </span>
                    <span v-else class="text-xs text-gray-400">1</span>
                  </td>
                  
                  <!-- Action -->
                  <td class="px-3 py-2 whitespace-nowrap text-right">
                    <button
                      @click.stop="subscription?.name && $emit('acknowledge-message', subscription.name, receivedMessage.ackId)"
                      :disabled="isAcknowledging"
                      class="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition-colors"
                    >
                      <CheckIcon class="h-3 w-3 mr-1" />
                      Ack
                    </button>
                  </td>
                </tr>

                <!-- Expanded details row (only when expanded) -->
                <tr v-if="expandedMessages.has(receivedMessage.ackId)" class="bg-gray-50 dark:bg-gray-700/50">
                  <td colspan="7" class="px-6 py-4 border-l-4 border-blue-500">
                    <div class="space-y-4">
                      <!-- Full Message Data -->
                      <div>
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Full Message Data</label>
                        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3 font-mono text-sm max-h-48 overflow-y-auto">
                          <span v-if="receivedMessage.message.data" class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">{{ decodeBase64(receivedMessage.message.data) }}</span>
                          <span v-else class="text-gray-400 dark:text-gray-500 italic">(empty)</span>
                        </div>
                      </div>

                      <!-- Message Attributes (if any) -->
                      <div v-if="receivedMessage.message.attributes && Object.keys(receivedMessage.message.attributes).length > 0">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          Message Attributes ({{ Object.keys(receivedMessage.message.attributes).length }})
                        </label>
                        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3 space-y-2">
                          <div
                            v-for="[key, value] in Object.entries(receivedMessage.message.attributes)"
                            :key="key"
                            class="flex items-start text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0"
                          >
                            <span class="font-mono text-blue-600 dark:text-blue-400 min-w-0 flex-shrink-0 mr-3 font-medium">{{ key }}:</span>
                            <span class="font-mono text-gray-800 dark:text-gray-200 break-all">{{ value }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Detailed Metadata -->
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block">Message ID</label>
                          <div class="text-gray-900 dark:text-white font-mono">{{ receivedMessage.message.messageId }}</div>
                        </div>
                        <div>
                          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block">Published At</label>
                          <div class="text-gray-900 dark:text-white">{{ new Date(receivedMessage.message.publishTime).toLocaleString() }}</div>
                        </div>
                        <div>
                          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block">Ack ID</label>
                          <div class="text-gray-900 dark:text-white font-mono text-xs truncate">{{ receivedMessage.ackId }}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">No messages</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-2">
          Pull messages to see them here
        </p>
        <button
          @click="$emit('pull-messages')"
          :disabled="isPulling"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowDownTrayIcon :class="['h-4 w-4 mr-2', { 'animate-pulse': isPulling }]" />
          <span v-if="!isPulling">Pull Messages</span>
          <span v-else class="flex items-center">
            Pulling...
            <span class="ml-2 text-xs opacity-75">(may take up to 3min)</span>
          </span>
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  InboxStackIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { PubSubSubscription, ReceivedMessage } from '@/types/pubsub'

interface Props {
  modelValue: boolean
  subscription: PubSubSubscription | null
  projectId: string
  messages: ReceivedMessage[]
  isPulling: boolean
  isAcknowledging: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  'pull-messages': []
  'acknowledge-message': [subscriptionName: string, ackId: string]
  'acknowledge-all': [subscriptionName: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Expanded messages state
const expandedMessages = ref(new Set<string>())

const internalModelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const subscriptionDisplayName = computed(() => {
  if (!props.subscription?.name) return ''
  const parts = props.subscription.name.split('/')
  return parts[parts.length - 1]
})

const handleClose = () => {
  emit('update:modelValue', false)
}

const toggleMessageExpansion = (ackId: string) => {
  if (expandedMessages.value.has(ackId)) {
    expandedMessages.value.delete(ackId)
  } else {
    expandedMessages.value.add(ackId)
  }
}

const decodeBase64 = (data: string | Uint8Array): string => {
  try {
    if (typeof data === 'string') {
      return window.atob(data)
    } else {
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(data)
    }
  } catch {
    return '(invalid data)'
  }
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return `${diffDays}d ago`
  }
}

const getDataSize = (data: string | Uint8Array | null): string => {
  if (!data) return '0 bytes'
  
  let size = 0
  if (typeof data === 'string') {
    size = Math.floor(data.length * 3/4)
  } else {
    size = data.byteLength
  }
  
  if (size < 1024) return `${size} bytes`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${Math.round(size / (1024 * 1024))} MB`
}
</script>