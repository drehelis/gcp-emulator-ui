<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="text-center">
        <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error Loading Templates</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ templatesStore.state.error }}</p>
        <div class="mt-4">
          <button
            @click="loadData"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon class="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Templates List -->
    <div v-else-if="filteredTemplates.length > 0" class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Templates ({{ templateStats.total }})
            </h2>
            <div class="flex items-center space-x-3">
              <button
                @click="loadData"
                :disabled="isLoading"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': isLoading }" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates Table -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <!-- Template Rows -->
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Mobile Card Layout -->
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="group block sm:hidden px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            @click="useTemplate(template)"
          >
            <div class="space-y-3">
              <!-- Header with icon, name and actions -->
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 min-w-0 flex-1">
                  <DocumentDuplicateIcon class="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ template.name }}
                    </div>
                    <div v-if="template.description" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ template.description }}
                    </div>
                  </div>
                </div>
                <!-- Mobile Actions -->
                <div class="flex items-center space-x-1 ml-2">
                  <button
                    @click.stop="useTemplate(template)"
                    class="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                    title="Use template"
                  >
                    <PaperAirplaneIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="duplicateTemplate(template)"
                    class="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-all"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="deleteTemplate(template)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    title="Delete"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <!-- Topic -->
              <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <QueueListIcon class="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                <span>{{ template.topicName }}</span>
              </div>
              
              <!-- Variables, Attributes & Tags -->
              <div class="space-y-2">
                <!-- Variables -->
                <div v-if="Object.keys(template.variables).length > 0" class="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">Variables:</span>
                  <span 
                    v-for="(value, key) in template.variables" 
                    :key="key"
                    class="text-xs"
                  >
                    <span class="font-medium text-gray-900 dark:text-white">{{ key }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-1">{{ value }}</span>
                  </span>
                </div>
                
                <!-- Attributes -->
                <div v-if="Object.keys(template.attributes).length > 0" class="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">Attributes:</span>
                  <span 
                    v-for="(value, key) in template.attributes" 
                    :key="key"
                    class="text-xs"
                  >
                    <span class="font-medium text-gray-900 dark:text-white">{{ key }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-1">{{ value }}</span>
                  </span>
                </div>
                
                <!-- Tags -->
                <div v-if="template.tags && template.tags.length > 0" class="flex items-center flex-wrap gap-1">
                  <span class="text-xs text-green-600 dark:text-green-400 font-medium">Tags:</span>
                  <span 
                    v-for="tag in template.tags" 
                    :key="tag"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              
              <!-- Date -->
              <div class="text-xs text-gray-400 dark:text-gray-500">
                {{ formatDate(template.updatedAt > template.createdAt ? template.updatedAt : template.createdAt) }}
              </div>
            </div>
          </div>

          <!-- Desktop Grid Layout -->
          <div
            v-for="template in filteredTemplates"
            :key="`desktop-${template.id}`"
            class="group hidden sm:grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            @click="useTemplate(template)"
          >
            <!-- Template Name & Description -->
            <div class="col-span-4 min-w-0">
              <div class="flex items-start space-x-3">
                <DocumentDuplicateIcon class="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ template.name }}
                  </div>
                  <div v-if="template.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ template.description }}
                  </div>
                  <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ formatDate(template.updatedAt > template.createdAt ? template.updatedAt : template.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Topic -->
            <div class="col-span-2 min-w-0">
              <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <QueueListIcon class="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                <span class="truncate">{{ template.topicName }}</span>
              </div>
            </div>
            
            <!-- Variables & Attributes -->
            <div class="col-span-5 min-w-0">
              <div class="space-y-1">
                <!-- Variables -->
                <div v-if="Object.keys(template.variables).length > 0" class="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">Variables:</span>
                  <span 
                    v-for="(value, key) in template.variables" 
                    :key="key"
                    class="text-xs"
                  >
                    <span class="font-medium text-gray-900 dark:text-white">{{ key }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-1">{{ value }}</span>
                  </span>
                </div>
                
                <!-- Attributes -->
                <div v-if="Object.keys(template.attributes).length > 0" class="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">Attributes:</span>
                  <span 
                    v-for="(value, key) in template.attributes" 
                    :key="key"
                    class="text-xs"
                  >
                    <span class="font-medium text-gray-900 dark:text-white">{{ key }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-1">{{ value }}</span>
                  </span>
                </div>
                
                <!-- Tags -->
                <div v-if="template.tags && template.tags.length > 0" class="flex items-center flex-wrap gap-1">
                  <span class="text-xs text-green-600 dark:text-green-400 font-medium">Tags:</span>
                  <span 
                    v-for="tag in template.tags" 
                    :key="tag"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="col-span-1 text-right">
              <div class="flex items-center justify-end space-x-1">
                <button
                  @click.stop="useTemplate(template)"
                  class="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                  title="Use template"
                >
                  <PaperAirplaneIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="duplicateTemplate(template)"
                  class="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-all"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="deleteTemplate(template)"
                  class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                  title="Delete"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">
              Templates (0)
            </h2>
            <div class="flex items-center space-x-3">
              <button
                @click="loadData"
                :disabled="isLoading"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': isLoading }" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State Content -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="text-center py-12">
          <DocumentDuplicateIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No templates yet
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Create templates by using "Save as Template" when publishing messages to topics
          </p>
        </div>
      </div>
    </div>
    <!-- Duplicate Template Modal -->
    <BaseModal
      v-model="showDuplicateTemplateModal"
      title="Duplicate Template"
      :icon="DocumentDuplicateIcon"
      icon-color="primary"
      size="md"
      :actions="duplicateModalActions"
      @close="handleDuplicateModalClose"
    >
      <form @submit.prevent="confirmDuplicateTemplate" class="space-y-4">
        <div>
          <label for="duplicate-template-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Template Name
          </label>
          <input
            id="duplicate-template-name"
            ref="duplicateTemplateNameInput"
            v-model="duplicateTemplateName"
            type="text"
            placeholder="Enter name for the duplicated template..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': duplicateTemplateNameError }"
            @input="clearDuplicateTemplateNameError"
          />
          <p v-if="duplicateTemplateNameError" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ duplicateTemplateNameError }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will create a copy of "{{ templateToDuplicate?.name }}" with all its data, attributes, and variables.
          </p>
        </div>
      </form>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteTemplateModal"
      title="Delete Template"
      :message="`Are you sure you want to delete the template '${templateToDelete?.name}'?`"
      confirm-label="Delete Template"
      :is-loading="isDeletingTemplate"
      :details="{
        title: 'What will happen:',
        description: 'The template will be permanently deleted from your saved templates.'
      }"
      @confirm="confirmDeleteTemplate"
      @cancel="cancelDeleteTemplate"
    />

    <!-- Publish Message Modal (for using templates) -->
    <PublishMessageModal
      v-model="showPublishModal"
      :topic-name="publishModalData.topicName"
      :project-id="publishModalData.projectId"
      :initial-template="publishModalData.initialTemplate"
      @message-published="onMessagePublished"
      @update:model-value="onPublishModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  DocumentDuplicateIcon,
  QueueListIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

import { useMessageTemplatesStore, type MessageTemplate } from '@/stores/messageTemplates'
import { useTopicsStore } from '@/stores/topics'
import { useAppStore } from '@/stores/app'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import PublishMessageModal from '@/components/modals/PublishMessageModal.vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'

const route = useRoute()
const templatesStore = useMessageTemplatesStore()
const topicsStore = useTopicsStore()
const appStore = useAppStore()

// Component state
const showPublishModal = ref(false)
const showDeleteTemplateModal = ref(false)
const templateToDelete = ref<MessageTemplate | null>(null)
const isDeletingTemplate = ref(false)
const showDuplicateTemplateModal = ref(false)
const templateToDuplicate = ref<MessageTemplate | null>(null)
const duplicateTemplateName = ref('')
const duplicateTemplateNameError = ref('')
const isDuplicatingTemplate = ref(false)
const duplicateTemplateNameInput = ref<HTMLInputElement | null>(null)
const publishModalData = ref({
  topicName: '',
  projectId: '',
  initialTemplate: null as {
    data: string
    attributes: Record<string, string>
    variables: Record<string, string>
    originalTemplate?: MessageTemplate
  } | null
})

// Computed properties
const projectId = computed(() => route.params.projectId as string)

// Get templates for current project from route
const currentProjectTemplates = computed(() => {
  return templatesStore.templates.filter(template => 
    template.projectId === projectId.value
  )
})

const templateStats = computed(() => {
  const topics = new Set<string>()
  currentProjectTemplates.value.forEach(template => {
    topics.add(template.topicName)
  })
  
  return {
    total: currentProjectTemplates.value.length,
    byTopic: topics.size,
    withVariables: currentProjectTemplates.value.filter(t => 
      Object.keys(t.variables).length > 0
    ).length,
    withAttributes: currentProjectTemplates.value.filter(t => 
      Object.keys(t.attributes).length > 0
    ).length,
  }
})
const isLoading = computed(() => templatesStore.isLoading)
const hasError = computed(() => templatesStore.hasError)

const filteredTemplates = computed(() => {
  // Sort by updated date (most recent first) - create a copy to avoid side effects
  return [...currentProjectTemplates.value].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
})

// Duplicate modal actions
const duplicateModalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleDuplicateModalClose,
    variant: 'secondary'
  },
  {
    label: 'Duplicate Template',
    handler: confirmDuplicateTemplate,
    variant: 'primary',
    loading: isDuplicatingTemplate.value,
    disabled: !duplicateTemplateName.value.trim() || isDuplicatingTemplate.value
  }
])

// Methods
async function loadData() {
  try {
    await Promise.all([
      templatesStore.loadTemplates(),
      topicsStore.fetchTopics(projectId.value)
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}


async function useTemplate(template: MessageTemplate) {
  publishModalData.value = {
    topicName: template.topicName,
    projectId: template.projectId,
    initialTemplate: {
      data: template.data,
      attributes: { ...template.attributes },
      variables: { ...template.variables },
      originalTemplate: template
    }
  }
  
  showPublishModal.value = true
}

function duplicateTemplate(template: MessageTemplate) {
  templateToDuplicate.value = template
  duplicateTemplateName.value = `${template.name} (Copy)`
  duplicateTemplateNameError.value = ''
  showDuplicateTemplateModal.value = true
  
  // Focus the input after the modal is shown
  setTimeout(() => {
    duplicateTemplateNameInput.value?.focus()
  }, 100)
}

async function confirmDuplicateTemplate() {
  if (!templateToDuplicate.value) return
  
  if (!duplicateTemplateName.value.trim()) {
    duplicateTemplateNameError.value = 'Template name is required'
    return
  }

  try {
    isDuplicatingTemplate.value = true
    
    await templatesStore.duplicateTemplate(templateToDuplicate.value.id, duplicateTemplateName.value.trim())
    
    appStore.showToast({
      type: 'success',
      title: 'Template Duplicated',
      message: `Template "${duplicateTemplateName.value}" has been created`
    })
    
    handleDuplicateModalClose()
  } catch (error) {
    appStore.showToast({
      type: 'error',
      title: 'Duplication Failed',
      message: (error as Error).message
    })
  } finally {
    isDuplicatingTemplate.value = false
  }
}

function handleDuplicateModalClose() {
  showDuplicateTemplateModal.value = false
  templateToDuplicate.value = null
  duplicateTemplateName.value = ''
  duplicateTemplateNameError.value = ''
  isDuplicatingTemplate.value = false
}

function clearDuplicateTemplateNameError() {
  duplicateTemplateNameError.value = ''
}

function deleteTemplate(template: MessageTemplate) {
  templateToDelete.value = template
  showDeleteTemplateModal.value = true
}

async function confirmDeleteTemplate() {
  if (!templateToDelete.value) return

  try {
    isDeletingTemplate.value = true
    await templatesStore.deleteTemplate(templateToDelete.value.id)
    
    appStore.showToast({
      type: 'success',
      title: 'Template Deleted',
      message: `Template "${templateToDelete.value.name}" has been deleted`
    })
    
    cancelDeleteTemplate()
  } catch (error) {
    appStore.showToast({
      type: 'error',
      title: 'Deletion Failed',
      message: (error as Error).message
    })
  } finally {
    isDeletingTemplate.value = false
  }
}

function cancelDeleteTemplate() {
  showDeleteTemplateModal.value = false
  templateToDelete.value = null
  isDeletingTemplate.value = false
}


function onPublishModalClose(isOpen: boolean) {
  if (!isOpen) {
    publishModalData.value.initialTemplate = null
  }
}

 
function onMessagePublished() {
  showPublishModal.value = false
  publishModalData.value.initialTemplate = null
  
  // Toast notification is already handled by PublishMessageModal component
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return 'Today'
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Watch for project changes
watch(() => projectId.value, () => {
  if (projectId.value) {
    loadData()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (projectId.value) {
    loadData()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>