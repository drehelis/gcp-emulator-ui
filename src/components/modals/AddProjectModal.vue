<template>
  <BaseModal
    v-model="modelValue"
    title="Add New Project"
    :icon="FolderIcon"
    icon-color="primary"
    size="md"
    :actions="modalActions"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="project-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project ID
        </label>
        <input
          id="project-name"
          ref="nameInput"
          v-model="projectName"
          type="text"
          placeholder="Enter Google Cloud project ID"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': error }"
          @input="clearError"
        />
        <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter your Google Cloud project ID. This will connect to your Pub/Sub emulator.
        </p>
      </div>

      <!-- Advanced options (expandable) -->
      <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
        <button
          type="button"
          @click="showAdvanced = !showAdvanced"
          class="flex items-center justify-between w-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <span>Advanced Options</span>
          <ChevronDownIcon
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-180': showAdvanced }"
          />
        </button>
        
        <Transition
          enter-active-class="transition-all"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-96"
          leave-active-class="transition-all"
          leave-from-class="opacity-100 max-h-96"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="showAdvanced" class="mt-3 space-y-3 overflow-hidden">
            <div>
              <label for="project-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="project-description"
                v-model="projectDescription"
                rows="2"
                placeholder="Brief description of this project"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm resize-none"
              />
            </div>
          </div>
        </Transition>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FolderIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useProjectsStore } from '@/stores/projects'
import type { ModalAction } from '@/components/ui/BaseModal.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const projectsStore = useProjectsStore()

const nameInput = ref<HTMLInputElement>()
const projectName = ref('')
const projectDescription = ref('')
const showAdvanced = ref(false)
const error = ref('')
const isSubmitting = ref(false)

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleClose,
    variant: 'secondary'
  },
  {
    label: 'Add Project',
    handler: handleSubmit,
    variant: 'primary',
    loading: isSubmitting.value,
    disabled: !projectName.value.trim() || isSubmitting.value
  }
])

const validateProjectName = (name: string): string => {
  if (!name.trim()) {
    return 'Project ID is required'
  }
  
  // Basic Google Cloud project ID validation
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) && name.length > 1) {
    return 'Project ID must start with a lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with a letter or number'
  }
  
  if (name.length < 6 || name.length > 30) {
    return 'Project ID must be between 6 and 30 characters'
  }
  
  if (projectsStore.projectList.includes(name)) {
    return 'This project is already added'
  }
  
  return ''
}

const handleSubmit = async () => {
  const validationError = validateProjectName(projectName.value)
  if (validationError) {
    error.value = validationError
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const addedProjectId = projectName.value.trim()
    await projectsStore.addProject(addedProjectId)
    
    // Close modal after successful submission (store already shows success toast)
    isSubmitting.value = false
    modelValue.value = false
    resetForm()
    
    // Navigate to the project services page where user can select emulator
    router.push(`/projects/${addedProjectId}`)
  } catch (err: any) {
    // Display error in the modal form (store already shows error toast)
    error.value = err.message || 'Failed to add project. Please check if the project exists and the emulator is running.'
    console.error('Error adding project:', err)
    isSubmitting.value = false
  }
}

const handleClose = () => {
  if (!isSubmitting.value) {
    modelValue.value = false
    resetForm()
  }
}

const resetForm = () => {
  projectName.value = ''
  projectDescription.value = ''
  showAdvanced.value = false
  error.value = ''
  isSubmitting.value = false
}

const clearError = () => {
  if (error.value) {
    error.value = ''
  }
}

// Focus input when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    nameInput.value?.focus()
  }
})
</script>