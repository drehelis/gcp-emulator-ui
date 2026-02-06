<template>
  <BaseModal
    v-model="modelValue"
    title="Create Bucket"
    size="lg"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-4 sm:space-y-6">
      <!-- Bucket Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
          Bucket Configuration
        </h3>

        <div class="space-y-3 sm:space-y-4">
          <!-- Bucket Name -->
          <div>
            <label
              for="bucket-name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Bucket Name *
            </label>
            <input
              id="bucket-name"
              ref="bucketNameInput"
              v-model="bucketForm.name"
              type="text"
              placeholder="Enter bucket name (e.g., my-storage-bucket)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              :class="{
                'border-red-300 focus:border-red-500 focus:ring-red-500': bucketErrors.name,
              }"
              @input="clearBucketError('name')"
            />
            <p v-if="bucketErrors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ bucketErrors.name }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Bucket names must be globally unique and follow naming conventions
            </p>
          </div>

          <!-- Location -->
          <div>
            <label
              for="location"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Location
            </label>
            <select
              id="location"
              v-model="bucketForm.location"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="US">US (Multi-region)</option>
              <option value="US-CENTRAL1">us-central1</option>
              <option value="US-EAST1">us-east1</option>
              <option value="US-WEST1">us-west1</option>
              <option value="EUROPE">EUROPE (Multi-region)</option>
              <option value="EUROPE-WEST1">europe-west1</option>
              <option value="ASIA">ASIA (Multi-region)</option>
              <option value="ASIA-EAST1">asia-east1</option>
            </select>
          </div>

          <!-- Storage Class -->
          <div>
            <label
              for="storage-class"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Default Storage Class
            </label>
            <select
              id="storage-class"
              v-model="bucketForm.storageClass"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="STANDARD">Standard</option>
              <option value="NEARLINE">Nearline</option>
              <option value="COLDLINE">Coldline</option>
              <option value="ARCHIVE">Archive</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: Emulator behavior may not reflect actual storage class features
            </p>
          </div>

          <!-- Public Access Prevention -->
          <div>
            <label class="flex items-center">
              <input
                v-model="bucketForm.publicAccessPrevention"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >Enable public access prevention</span
              >
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Prevents public access to bucket objects
            </p>
          </div>

          <!-- Uniform Bucket Level Access -->
          <div>
            <label class="flex items-center">
              <input
                v-model="bucketForm.uniformBucketLevelAccess"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >Enable uniform bucket-level access</span
              >
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Disables ACLs for all objects in this bucket
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { storageApi } from '@/api/storage'
import { useAppStore } from '@/stores/app'
import { getStorageErrorMessage } from '@/utils/errorMessages'
import type { ModalAction } from '@/components/ui/BaseModal.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'bucket-created': []
}>()

const appStore = useAppStore()

const bucketNameInput = ref<HTMLInputElement>()
const isSubmitting = ref(false)

const bucketForm = ref({
  name: '',
  location: 'US',
  storageClass: 'STANDARD',
  publicAccessPrevention: true,
  uniformBucketLevelAccess: true,
})

const bucketErrors = ref<Record<string, string>>({})

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleClose,
    variant: 'secondary',
  },
  {
    label: 'Create Bucket',
    handler: handleSubmit,
    variant: 'primary',
    loading: isSubmitting.value,
    disabled: !bucketForm.value.name.trim() || isSubmitting.value,
  },
])

const validateBucketName = (name: string): string => {
  if (!name.trim()) {
    return 'Bucket name is required'
  }

  // Basic bucket name validation (simplified for emulator)
  if (name.length < 3 || name.length > 63) {
    return 'Bucket name must be between 3 and 63 characters'
  }

  if (!/^[a-z0-9][a-z0-9-._]*[a-z0-9]$/.test(name)) {
    return 'Bucket name must start and end with a letter or number, and contain only lowercase letters, numbers, hyphens, periods, and underscores'
  }

  if (name.includes('..')) {
    return 'Bucket name cannot contain consecutive periods'
  }

  return ''
}

const handleSubmit = async () => {
  const nameError = validateBucketName(bucketForm.value.name)
  if (nameError) {
    bucketErrors.value.name = nameError
    return
  }

  isSubmitting.value = true

  try {
    // Prepare bucket data
    const bucketRequest = {
      name: bucketForm.value.name.trim(),
      location: bucketForm.value.location,
      storageClass: bucketForm.value.storageClass,
      iamConfiguration: {
        uniformBucketLevelAccess: {
          enabled: bucketForm.value.uniformBucketLevelAccess,
        },
        publicAccessPrevention: bucketForm.value.publicAccessPrevention ? 'enforced' : 'inherited',
      },
    }

    // Create bucket
    await storageApi.createBucket(bucketRequest)

    appStore.showToast({
      type: 'success',
      title: 'Bucket Created',
      message: `Bucket "${bucketForm.value.name}" created successfully`,
    })

    // Close modal and emit success
    modelValue.value = false
    emit('bucket-created')
    resetForm()
  } catch (err: any) {
    console.error('Error creating bucket:', err)
    appStore.showToast({
      type: 'error',
      title: 'Creation Failed',
      message: getStorageErrorMessage(err, 'create bucket'),
    })
  } finally {
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
  bucketForm.value = {
    name: '',
    location: 'US',
    storageClass: 'STANDARD',
    publicAccessPrevention: true,
    uniformBucketLevelAccess: true,
  }
  bucketErrors.value = {}
  isSubmitting.value = false
}

const clearBucketError = (field: string) => {
  if (bucketErrors.value[field]) {
    delete bucketErrors.value[field]
  }
}

const handleEnterKey = (event: KeyboardEvent) => {
  // Only handle Enter key when modal is open
  if (event.key === 'Enter' && props.modelValue) {
    const target = event.target as HTMLElement

    // Only handle Enter if it's from a text input, not from buttons or other elements
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') {
      // Only submit if the form is valid and not currently submitting
      if (bucketForm.value.name.trim() && !isSubmitting.value) {
        event.preventDefault()
        event.stopPropagation()
        handleSubmit()
      }
    }
  }
}

// Set up keyboard event listeners
onMounted(() => {
  document.addEventListener('keydown', handleEnterKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEnterKey)
})

// Focus input when modal opens
watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen) {
      await nextTick()
      bucketNameInput.value?.focus()
    }
  }
)
</script>
