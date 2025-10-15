<template>
  <!-- Main Publish Message Modal -->
  <BaseModal
    v-model="isOpen"
    title="Publish Message"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-6 sm:space-y-8">
      <!-- Topic Selection Section -->
      <section class="space-y-3 sm:space-y-4">
        <div>
          <h4 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <QueueListIcon class="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 flex-shrink-0" />
            Target Topic
          </h4>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select the topic where this message will be published
          </p>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <!-- Custom Topic Dropdown -->
          <div class="relative">
            <button
              @click="showTopicDropdown = !showTopicDropdown"
              type="button"
              class="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'text-gray-500 dark:text-gray-400': !selectedTopic }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center min-w-0">
                  <QueueListIcon class="h-4 w-4 text-blue-500 mr-2 shrink-0" />
                  <span class="truncate">
                    {{ selectedTopic || 'Select a topic...' }}
                  </span>
                </div>
                <ChevronUpDownIcon class="h-4 w-4 text-gray-400 shrink-0" />
              </div>
            </button>
            
            <!-- Dropdown Menu -->
            <div 
              v-if="showTopicDropdown" 
              class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg"
            >
              <!-- Search Input -->
              <div v-if="availableTopics.length > 5" class="p-2 border-b border-gray-200 dark:border-gray-600">
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    ref="topicSearchInput"
                    v-model="topicSearchQuery"
                    type="text"
                    placeholder="Search topics..."
                    class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    @click.stop
                  />
                </div>
              </div>
              
              <!-- Topics List -->
              <div class="max-h-48 overflow-auto">
                <div v-if="filteredTopics.length === 0" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {{ topicSearchQuery ? 'No topics match your search' : 'No topics available' }}
                </div>
                <button
                  v-for="topic in filteredTopics"
                  :key="topic"
                  @click="selectTopic(topic)"
                  type="button"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-600 transition-colors"
                  :class="{
                    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': selectedTopic === topic,
                    'text-gray-900 dark:text-white': selectedTopic !== topic
                  }"
                >
                  <div class="flex items-center">
                    <QueueListIcon class="h-4 w-4 text-blue-500 mr-2 shrink-0" />
                    <span class="truncate">{{ topic }}</span>
                    <CheckIcon 
                      v-if="selectedTopic === topic" 
                      class="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto shrink-0" 
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Template Variables Section -->
      <section class="space-y-3 sm:space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <h4 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <svg class="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              Template Variables
            </h4>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Define variables to use in your message data with 
              <code class="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-md font-mono text-xs" v-text="'{{.variableName}}'"></code> 
              syntax
            </p>
          </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <TemplateVariableInput
            :variables="templateVariables"
            @update:variables="templateVariables = $event"
          />
        </div>
      </section>

      <!-- Message Attributes Section -->
      <section class="space-y-3 sm:space-y-4">
        <div>
          <h4 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <svg class="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            Message Attributes
          </h4>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add key-value pairs as message attributes
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <MessageAttributeInput
            :attributes="messageAttributes"
            @update:attributes="messageAttributes = $event"
          />
        </div>
      </section>

      <!-- Message Data Section -->
      <section class="space-y-3 sm:space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <div class="flex-1 min-w-0">
            <h4 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <svg class="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Message Data
            </h4>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enter your message data as JSON or plain text
            </p>
          </div>
        </div>
        
        <!-- Message Editor -->
        <div class="space-y-3">
          <div class="relative">
            <textarea
              id="message-data"
              v-model="messageData"
              rows="10"
              placeholder="Enter JSON or plain text..."
              class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-mono px-3 sm:px-4 py-2 sm:py-3 resize-vertical placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div class="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-2 py-1">
              <span>{{ messageData.length }} chars</span>
              <div class="hidden sm:block w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
              <span>{{ messageData.split('\n').length }} lines</span>
            </div>
          </div>
          
          <!-- JSON Options & Validation -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 gap-3 sm:gap-0">
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div class="flex items-center">
                <input
                  id="format-json"
                  v-model="formatAsJson"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label for="format-json" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Validate and format as JSON
                </label>
              </div>
              
              <div v-if="formatAsJson && !jsonValidationError && messageData.trim()" class="flex items-center text-xs text-green-600 dark:text-green-400">
                <svg class="h-4 w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Valid JSON
              </div>
              
              <div v-if="formatAsJson && jsonValidationError" class="flex items-center text-xs text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                {{ jsonValidationError }}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
    
    <!-- Custom footer with publish button dropdown -->
    <template #footer>
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <!-- Save button with dropdown -->
        <div class="relative inline-flex rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0 dark:focus-within:ring-offset-0 transition-colors w-full sm:w-auto" :class="{ 'opacity-50 cursor-not-allowed': !messageData.trim() || !selectedTopic || (formatAsJson && !!jsonValidationError) || isUpdatingTemplate }">
          <button
            @click="hasOriginalTemplate ? handleUpdateTemplate() : handleSaveAsTemplate()"
            :disabled="!messageData.trim() || !selectedTopic || (formatAsJson && !!jsonValidationError) || isUpdatingTemplate"
            class="flex-1 inline-flex justify-center items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none disabled:cursor-not-allowed min-w-0"
          >
            <svg
              v-if="isUpdatingTemplate"
              class="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ hasOriginalTemplate ? 'Save' : 'Save as Template' }}
          </button>
          <div class="w-px bg-gray-300 dark:bg-gray-600"></div>
          <button
            @click="showSaveOptions = !showSaveOptions"
            :disabled="!messageData.trim() || !selectedTopic || (formatAsJson && !!jsonValidationError) || isUpdatingTemplate"
            class="inline-flex items-center justify-center px-2 sm:px-2 py-2 text-gray-700 dark:text-gray-300 focus:outline-none disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg class="h-4 w-4 transition-transform" :class="{ 'rotate-180': showSaveOptions }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <!-- Save dropdown menu -->
          <div 
            v-if="showSaveOptions" 
            class="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50"
          >
            <div class="py-1">
              <button
                @click="handleSaveAsTemplate(); showSaveOptions = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              >
                Save as Template
              </button>
            </div>
          </div>
        </div>
        
        <!-- Publish button with dropdown -->
        <div class="relative inline-flex rounded-md bg-blue-600 hover:bg-blue-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0 transition-colors w-full sm:w-auto" :class="{ 'opacity-50 cursor-not-allowed': !messageData.trim() || !selectedTopic || (formatAsJson && !!jsonValidationError) || isPublishing }">
          <button
            @click="handlePublishMessage"
            :disabled="!messageData.trim() || !selectedTopic || (formatAsJson && !!jsonValidationError) || isPublishing"
            class="flex-1 inline-flex justify-center items-center px-3 sm:px-4 py-2 text-sm font-medium text-white focus:outline-none disabled:cursor-not-allowed min-w-0"
          >
            <svg
              v-if="isPublishing"
              class="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ publishCount > 1 ? `Publish ${publishCount} Messages` : 'Publish Message' }}
          </button>
          <div class="w-px bg-blue-500"></div>
          <button
            @click="showPublishOptions = !showPublishOptions"
            :disabled="!messageData.trim() || !selectedTopic || (formatAsJson && !!jsonValidationError) || isPublishing"
            class="inline-flex items-center justify-center px-2 sm:px-2 py-2 text-white focus:outline-none disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg class="h-4 w-4 transition-transform" :class="{ 'rotate-180': showPublishOptions }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <!-- Dropdown menu -->
          <div 
            v-if="showPublishOptions" 
            class="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50"
          >
            <div class="py-1">
              <button
                @click="publishCount = 1; showPublishOptions = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                :class="{ 'bg-gray-100 dark:bg-gray-700': publishCount === 1 }"
              >
                Publish 1 Message
              </button>
              <button
                @click="publishCount = 10; showPublishOptions = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                :class="{ 'bg-gray-100 dark:bg-gray-700': publishCount === 10 }"
              >
                Publish 10 Messages
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- Template Name Modal -->
  <BaseModal
    v-model="showTemplateNameModal"
    title="Save as Template"
    :icon="DocumentDuplicateIcon"
    icon-color="primary"
    size="md"
    :z-index="60"
    :actions="templateModalActions"
    @close="handleTemplateModalClose"
  >
    <form @submit.prevent="confirmSaveTemplate" class="space-y-4">
      <div>
        <label for="template-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Template Name
        </label>
        <input
          id="template-name"
          ref="templateNameInput"
          v-model="templateName"
          type="text"
          placeholder="Enter template name"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': templateError }"
          @input="clearTemplateError"
        />
        <p v-if="templateError" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ templateError }}
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Save your message configuration for future use
        </p>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import {
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  QueueListIcon,
  ChevronUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'
import { topicsApi } from '@/api/pubsub'
import { useMessageTemplatesStore } from '@/stores/messageTemplates'
import { useTopicsStore } from '@/stores/topics'
import { useToast } from 'vue-toastification'
import BaseModal from '@/components/ui/BaseModal.vue'
import TemplateVariableInput from '@/components/ui/TemplateVariableInput.vue'
import MessageAttributeInput from '@/components/ui/MessageAttributeInput.vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import { usePreconfiguredMessageAttributes } from '@/utils/pubsubAttributes'

interface Props {
  modelValue: boolean
  topicName: string
  projectId: string
  initialTemplate?: {
    data: string
    attributes: Record<string, string>
    variables: Record<string, string>
    originalTemplate?: any
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'message-published': []
}>()

// Stores
const templatesStore = useMessageTemplatesStore()
const topicsStore = useTopicsStore()
const toast = useToast()

// Main modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Message state
const messageData = ref('')
const messageAttributes = ref<Array<{ key: string, value: string }>>([])
const templateVariables = ref<Array<{ name: string, value: string }>>([{ name: '', value: '' }])
const formatAsJson = ref(true)
const publishCount = ref(1)
const showPublishOptions = ref(false)
const showSaveOptions = ref(false)
const selectedTopic = ref('')
const showTopicDropdown = ref(false)
const topicSearchQuery = ref('')

// Publishing state
const isPublishing = ref(false)

// Template modal state
const showTemplateNameModal = ref(false)
const templateName = ref('')
const templateError = ref('')
const isSavingTemplate = ref(false)
const isUpdatingTemplate = ref(false)
const templateNameInput = ref<HTMLInputElement>()
const topicSearchInput = ref<HTMLInputElement>()

// Validation
const jsonValidationError = computed(() => {
  if (!formatAsJson.value || !messageData.value.trim()) return null
  
  try {
    JSON.parse(messageData.value)
    return null
  } catch {
    return 'Invalid JSON format'
  }
})

// Reactive pre-configured attributes
const preconfiguredAttributes = usePreconfiguredMessageAttributes()

// Check if we have an original template to update
const hasOriginalTemplate = computed(() => !!props.initialTemplate?.originalTemplate)

// Get available topics for the dropdown
const availableTopics = computed(() => {
  // Filter topics by the current project ID from props, not from the store's selectedProject
  const projectTopics = topicsStore.topics.filter(topic => topic.projectId === props.projectId)
  
  
  // Extract just the topic names for display in dropdown
  const topicNames = projectTopics.map(topic => topic.name)
  
  return topicNames
})

// Filter topics based on search query
const filteredTopics = computed(() => {
  if (!topicSearchQuery.value.trim()) {
    return availableTopics.value
  }
  
  const query = topicSearchQuery.value.toLowerCase()
  return availableTopics.value.filter(topic => 
    topic.toLowerCase().includes(query)
  )
})

// Modal actions
const modalActions = computed<ModalAction[]>(() => {
  const actions: ModalAction[] = []
  
  // Add "Publish Message" button (primary action)
  actions.push({
    label: 'Publish Message',
    handler: handlePublishMessage,
    variant: 'primary',
    loading: isPublishing.value,
    disabled: !messageData.value.trim() || !selectedTopic.value || (formatAsJson.value && !!jsonValidationError.value) || isPublishing.value
  })
  
  // Always add "Save as Template" button
  actions.push({
    label: 'Save as Template',
    handler: handleSaveAsTemplate,
    variant: 'secondary',
    disabled: !messageData.value.trim() || !selectedTopic.value || (formatAsJson.value && !!jsonValidationError.value)
  })
  
  return actions
})

// Template modal actions
const templateModalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleTemplateModalClose,
    variant: 'secondary'
  },
  {
    label: 'Save Template',
    handler: confirmSaveTemplate,
    variant: 'primary',
    loading: isSavingTemplate.value,
    disabled: !templateName.value.trim() || isSavingTemplate.value
  }
])

// Initialize from template
const initializeFromTemplate = async () => {
  // Always set the selected topic from props
  selectedTopic.value = props.topicName
  
  // Always ensure topics are loaded for the dropdown
  if (props.projectId) {
    try {
      await topicsStore.fetchTopics(props.projectId)
    } catch (error) {
      console.error('Failed to load topics:', error)
    }
  }
  
  if (props.initialTemplate) {
    messageData.value = props.initialTemplate.data
    
    // Convert attributes object to array
    messageAttributes.value = Object.entries(props.initialTemplate.attributes)
      .map(([key, value]) => ({ key, value }))
    if (messageAttributes.value.length === 0) {
      // Use reactive pre-configured attributes
      const preconfiguredAttrs = preconfiguredAttributes.value
      if (preconfiguredAttrs.length > 0) {
        messageAttributes.value = [...preconfiguredAttrs, { key: '', value: '' }]
      } else {
        messageAttributes.value = [{ key: '', value: '' }]
      }
    }
    
    // Convert variables object to array  
    templateVariables.value = Object.entries(props.initialTemplate.variables)
      .map(([name, value]) => ({ name, value }))
    if (templateVariables.value.length === 0) {
      templateVariables.value = [{ name: '', value: '' }]
    }
    
    // Try to detect if it's JSON
    try {
      JSON.parse(props.initialTemplate.data)
      formatAsJson.value = true
    } catch {
      formatAsJson.value = false
    }
  } else {
    // No template provided, use reactive pre-configured attributes
    const preconfiguredAttrs = preconfiguredAttributes.value
    if (preconfiguredAttrs.length > 0) {
      messageAttributes.value = [...preconfiguredAttrs, { key: '', value: '' }]
    } else {
      messageAttributes.value = [{ key: '', value: '' }]
    }
  }
}

// Initialize messageAttributes with preconfigured values when available
watchEffect(() => {
  if (messageAttributes.value.length === 0) {
    const attrs = preconfiguredAttributes.value
    messageAttributes.value = attrs.length > 0 ? [...attrs, { key: '', value: '' }] : [{ key: '', value: '' }]
  }
})

const processMessageData = (data: string): string => {
  if (!data.trim()) return data
  
  let processedData = data
  
  // Replace template variables
  templateVariables.value.forEach(variable => {
    if (variable.name.trim() && variable.value.trim()) {
      const pattern = new RegExp(`{{\\s*\\.${variable.name.trim()}\\s*}}`, 'g')
      processedData = processedData.replace(pattern, variable.value.trim())
    }
  })
  
  return processedData
}

const handlePublishMessage = async () => {
  if (!messageData.value.trim()) return
  
  isPublishing.value = true
  
  try {
    const processedData = processMessageData(messageData.value)
    
    // Convert attributes array to object
    const attributes: Record<string, string> = {}
    messageAttributes.value.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        attributes[attr.key.trim()] = attr.value.trim()
      }
    })
    
    if (publishCount.value > 1) {
      for (let i = 0; i < publishCount.value; i++) {
        await topicsApi.publishMessage(props.projectId, selectedTopic.value, {
          data: btoa(processedData),
          attributes
        })
        
        if (i < publishCount.value - 1) {
          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      toast.success(`Published ${publishCount.value} messages successfully!`, {
        timeout: 3000
      })
      
      emit('message-published')
    } else {
      await topicsApi.publishMessage(props.projectId, selectedTopic.value, {
        data: btoa(processedData),
        attributes
      })
      
      toast.success(`Message published successfully!`, {
        timeout: 2000
      })
      
      emit('message-published')
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to publish message', {
      timeout: 4000
    })
  } finally {
    isPublishing.value = false
  }
}

// Topic selection
const selectTopic = (topic: string) => {
  selectedTopic.value = topic
  showTopicDropdown.value = false
  topicSearchQuery.value = ''
}

const handleSaveAsTemplate = () => {
  if (!messageData.value.trim() || (formatAsJson.value && jsonValidationError.value)) {
    return
  }
  
  templateName.value = ''
  templateError.value = ''
  showTemplateNameModal.value = true
}

const handleUpdateTemplate = async () => {
  if (!messageData.value.trim() || (formatAsJson.value && jsonValidationError.value)) {
    return
  }
  
  const originalTemplate = props.initialTemplate?.originalTemplate
  if (!originalTemplate) return
  
  isUpdatingTemplate.value = true
  
  try {
    // Collect current attributes
    const attributes: Record<string, string> = {}
    messageAttributes.value.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        attributes[attr.key.trim()] = attr.value.trim()
      }
    })
    
    // Collect current variables
    const variables: Record<string, string> = {}
    templateVariables.value.forEach(variable => {
      if (variable.name.trim() && variable.value.trim()) {
        variables[variable.name.trim()] = variable.value.trim()
      }
    })
    
    // Update the template
    await templatesStore.updateTemplate(originalTemplate.id, {
      data: messageData.value,
      attributes,
      variables,
      topicName: selectedTopic.value
    })
    
    toast.success(`Template "${originalTemplate.name}" has been updated successfully`, {
      timeout: 3000
    })
  } catch (error) {
    toast.error((error as Error).message || 'Failed to update template', {
      timeout: 4000
    })
  } finally {
    isUpdatingTemplate.value = false
  }
}


const confirmSaveTemplate = async () => {
  const name = templateName.value.trim()
  
  if (!name) {
    templateError.value = 'Template name is required'
    return
  }
  
  if (templatesStore.templates.some(t => t.name === name)) {
    templateError.value = 'A template with this name already exists'
    return
  }
  
  isSavingTemplate.value = true
  
  try {
    // Convert arrays to objects for storage
    const attributes: Record<string, string> = {}
    messageAttributes.value.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        attributes[attr.key.trim()] = attr.value.trim()
      }
    })
    
    const variables: Record<string, string> = {}
    templateVariables.value.forEach(variable => {
      if (variable.name.trim() && variable.value.trim()) {
        variables[variable.name.trim()] = variable.value.trim()
      }
    })
    
    await templatesStore.saveTemplate({
      name,
      data: messageData.value,
      attributes,
      variables,
      topicName: selectedTopic.value,
      projectId: props.projectId
    })
    
    toast.success(`Template "${name}" has been saved successfully`, {
      timeout: 3000
    })
    
    handleTemplateModalClose()
  } catch (error) {
    toast.error((error as Error).message || 'Failed to save template', {
      timeout: 4000
    })
  } finally {
    isSavingTemplate.value = false
  }
}

const handleClose = () => {
  isOpen.value = false
  resetForm()
}

const handleTemplateModalClose = () => {
  showTemplateNameModal.value = false
  templateName.value = ''
  templateError.value = ''
  isSavingTemplate.value = false
}

const clearTemplateError = () => {
  if (templateError.value) {
    templateError.value = ''
  }
}

const resetForm = () => {
  messageData.value = ''
  // Use reactive pre-configured attributes when available
  const preconfiguredAttrs = preconfiguredAttributes.value
  if (preconfiguredAttrs.length > 0) {
    messageAttributes.value = [...preconfiguredAttrs, { key: '', value: '' }]
  } else {
    messageAttributes.value = [{ key: '', value: '' }]
  }
  templateVariables.value = [{ name: '', value: '' }]
  formatAsJson.value = false
  publishCount.value = 1
  showPublishOptions.value = false
  showSaveOptions.value = false
  selectedTopic.value = props.topicName
}

// Watch for modal opening to initialize
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await initializeFromTemplate()
  }
}, { immediate: true })

// Focus template name input when template modal opens
watch(() => showTemplateNameModal.value, async (isOpen) => {
  if (isOpen) {
    await new Promise(resolve => setTimeout(resolve, 100))
    templateNameInput.value?.focus()
  }
})

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  if (showTopicDropdown.value) {
    const target = event.target as Element
    const dropdown = target.closest('.relative')
    if (!dropdown || !dropdown.contains(target)) {
      showTopicDropdown.value = false
      topicSearchQuery.value = ''
    }
  }
}

// Focus search input when dropdown opens
watch(() => showTopicDropdown.value, async (isOpen) => {
  if (isOpen && availableTopics.value.length > 5) {
    await new Promise(resolve => setTimeout(resolve, 100))
    topicSearchInput.value?.focus()
  }
})

onMounted(async () => {
  await initializeFromTemplate()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>