<template>
  <BaseModal
    v-model="isOpen"
    title="Create Entity"
    size="4xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Entity Information Section -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <span class="w-1 h-4 bg-blue-500 dark:bg-blue-400 rounded mr-2"></span>
          Entity Information
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Namespace -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Namespace
              </label>
              <button
                @click="useManualNamespace = !useManualNamespace"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {{ useManualNamespace ? 'Select' : 'Enter' }}
              </button>
            </div>
            <CustomSelect
              v-if="!useManualNamespace"
              v-model="form.namespace"
              :options="namespaceOptions"
              :icon="FolderIcon"
              placeholder="Select namespace..."
              searchable
            />
            <input
              v-else
              v-model="form.namespace"
              type="text"
              placeholder="Enter namespace..."
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Database -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Database
              </label>
              <button
                @click="useManualDatabase = !useManualDatabase"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {{ useManualDatabase ? 'Select' : 'Enter' }}
              </button>
            </div>
            <CustomSelect
              v-if="!useManualDatabase"
              v-model="form.database"
              :options="databaseOptions"
              :icon="CircleStackIcon"
              placeholder="Select database..."
              searchable
            />
            <input
              v-else
              v-model="form.database"
              type="text"
              placeholder="Enter database..."
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Entity Kind -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Entity Kind <span class="text-red-500">*</span>
              </label>
              <button
                @click="useManualKind = !useManualKind"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {{ useManualKind ? 'Select' : 'Enter' }}
              </button>
            </div>
            <CustomSelect
              v-if="!useManualKind"
              v-model="form.kind"
              :options="kindOptions"
              :icon="CubeIcon"
              placeholder="Select kind..."
              searchable
            />
            <input
              v-else
              v-model="form.kind"
              type="text"
              placeholder="Enter kind..."
              :class="[
                'w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent',
                hasValidationError && !form.kind.trim()
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              ]"
              @input="hasValidationError = false"
            />
            <p v-if="hasValidationError && !form.kind.trim()" class="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
              <ExclamationCircleIcon class="w-3.5 h-3.5 mr-1" />
              Entity Kind is required
            </p>
          </div>
        </div>
      </div>

      <!-- Key Identifier Section -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <span class="w-1 h-4 bg-blue-500 dark:bg-blue-400 rounded mr-2"></span>
          Key Identifier
        </h3>

        <div class="space-y-3">
          <CustomSelect
            v-model="form.keyType"
            :options="keyTypeOptions"
            placeholder="Select key type..."
          />

          <div v-if="form.keyType === 'custom'" class="animate-fadeIn">
            <input
              v-model="form.customKey"
              type="text"
              placeholder="Enter custom key name"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Parent Entity (Optional) - Collapsible -->
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          @click="showParentSection = !showParentSection"
          class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
            <ChevronDownIcon v-if="showParentSection" class="w-4 h-4 mr-2 text-gray-500" />
            <ChevronRightIcon v-else class="w-4 h-4 mr-2 text-gray-500" />
            Parent Entity (Optional)
          </span>
        </button>

        <div v-if="showParentSection" class="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Specify a parent entity to create an ancestor relationship
          </p>
          <input
            v-model="form.parentKey"
            type="text"
            placeholder="Parent entity key (optional)"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Properties Section -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <span class="w-1 h-4 bg-purple-500 dark:bg-purple-400 rounded mr-2"></span>
            Properties
          </h3>
          <button
            @click="addProperty"
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-3.5 h-3.5 mr-1.5" />
            Add property
          </button>
        </div>

        <div v-if="form.properties.length === 0" class="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <InboxIcon class="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">No properties yet</p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Click "Add property" to create your first property</p>
        </div>

        <div v-else class="space-y-3">
          <PropertyEditor
            v-for="(property, index) in form.properties"
            :key="index"
            :property="property"
            :property-id="`create-${index}`"
            @remove="removeProperty(index)"
          />
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  PlusIcon,
  InboxIcon,
  ExclamationCircleIcon,
  FolderIcon,
  CircleStackIcon,
  CubeIcon
} from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import PropertyEditor from '@/components/datastore/PropertyEditor.vue'
import type { ModalAction } from '@/types/ui'
import type { SelectOption } from '@/components/ui/CustomSelect.vue'
import { useDatastoreStore } from '@/stores/datastore'
import { useAppStore } from '@/stores/app'
import datastoreApi from '@/api/datastore'
import type { DatastoreEntity, DatastoreValue } from '@/types/datastore'
import { propertyFormToDatastoreValue } from '@/utils/propertyConverters'

interface Props {
  modelValue: boolean
  projectId: string
  namespace?: string
  database?: string
  kind?: string
}

interface PropertyForm {
  name: string
  type: 'string' | 'integer' | 'double' | 'boolean' | 'timestamp' | 'blob' | 'null'
  value: string
  indexed: boolean
  expanded: boolean
}

interface EntityForm {
  namespace: string
  database: string
  kind: string
  keyType: 'auto' | 'custom'
  customKey: string
  parentKey: string
  properties: PropertyForm[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [entity: DatastoreEntity]
}>()

const datastoreStore = useDatastoreStore()
const appStore = useAppStore()

// Form state
const form = ref<EntityForm>({
  namespace: '',
  database: '',
  kind: '',
  keyType: 'auto',
  customKey: '',
  parentKey: '',
  properties: []
})

const hasValidationError = ref(false)
const showParentSection = ref(false)
const isLoading = ref(false)
const isLoadingCascade = ref(false)

// Toggle between dropdown and manual input
const useManualNamespace = ref(false)
const useManualDatabase = ref(false)
const useManualKind = ref(false)

// Available options - use store for namespaces, local state for databases/kinds
const availableNamespaces = computed(() => datastoreStore.namespaces || [])
const availableDatabases = computed(() => localDatabases.value)
const availableKinds = computed(() => localKinds.value)

// Options for CustomSelect
const namespaceOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = [{ label: '(default)', value: '' }]
  const uniqueNamespaces = availableNamespaces.value.filter(ns => ns !== '')
  uniqueNamespaces.forEach(ns => {
    options.push({ label: ns, value: ns })
  })
  return options
})

const databaseOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = [{ label: '(default)', value: '' }]
  const uniqueDatabases = availableDatabases.value.filter(db => db !== '')
  uniqueDatabases.forEach(db => {
    options.push({ label: db, value: db })
  })
  return options
})

const kindOptions = computed<SelectOption[]>(() =>
  availableKinds.value.map(kind => ({
    label: kind,
    value: kind
  }))
)

const keyTypeOptions = computed<SelectOption[]>(() => [
  { label: 'Numeric ID (auto-generated)', value: 'auto' },
  { label: 'Custom name', value: 'custom' }
])

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const isFormValid = computed(() => {
  return form.value.kind.trim() !== ''
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleCancel,
    variant: 'secondary'
  },
  {
    label: 'Create',
    handler: handleCreate,
    variant: 'primary',
    disabled: !isFormValid.value,
    loading: isLoading.value
  }
])

// Watch for prop changes - only update when modal first opens, not during user interaction
watch(() => props.namespace, (newNamespace) => {
  if (newNamespace !== undefined && !isLoadingCascade.value) {
    form.value.namespace = newNamespace
  }
}, { immediate: true })

watch(() => props.database, (newDatabase) => {
  if (newDatabase !== undefined && !isLoadingCascade.value) {
    form.value.database = newDatabase
  }
}, { immediate: true })

watch(() => props.kind, (newKind) => {
  if (newKind && !isLoadingCascade.value) {
    form.value.kind = newKind
  }
}, { immediate: true })

// Local state for modal-specific databases and kinds (don't use store)
const localDatabases = ref<string[]>([])
const localKinds = ref<string[]>([])

// Handle cascading changes when namespace changes
watch(() => form.value.namespace, async (newNamespace, oldNamespace) => {
  // Only trigger if the modal is open, value actually changed, and not during initial load
  if (isOpen.value && newNamespace !== oldNamespace && !isLoadingCascade.value) {
    isLoadingCascade.value = true

    // Reset downstream selections
    form.value.database = ''
    form.value.kind = ''
    localDatabases.value = []
    localKinds.value = []

    try {
      // Load databases for the selected namespace directly from API
      const databases = await datastoreApi.listDatabases(props.projectId, newNamespace)
      localDatabases.value = databases
    } catch (error) {
      localDatabases.value = ['']
    } finally {
      isLoadingCascade.value = false
    }
  }
})

// Handle cascading changes when database changes
watch(() => form.value.database, async (newDatabase, oldDatabase) => {
  // Only trigger if the modal is open, value actually changed, and not during cascade loading
  if (isOpen.value && newDatabase !== oldDatabase && !isLoadingCascade.value) {
    isLoadingCascade.value = true

    // Reset kind selection
    form.value.kind = ''
    localKinds.value = []

    try {
      // Load kinds for the selected database directly from API
      const kinds = await datastoreApi.listKinds(props.projectId, form.value.namespace, newDatabase)
      localKinds.value = kinds
    } catch (error) {
      localKinds.value = []
    } finally {
      isLoadingCascade.value = false
    }
  }
})

// Methods
const resetForm = () => {
  form.value = {
    namespace: props.namespace || '',
    database: props.database || '',
    kind: props.kind || '',
    keyType: 'auto',
    customKey: '',
    parentKey: '',
    properties: []
  }
  hasValidationError.value = false
  showParentSection.value = false
}

const addProperty = () => {
  form.value.properties.push({
    name: '',
    type: 'string',
    value: '',
    indexed: true,
    expanded: true
  })
}

const removeProperty = (index: number) => {
  form.value.properties.splice(index, 1)
}

const buildDatastoreEntity = (): DatastoreEntity => {
  const properties: Record<string, DatastoreValue> = {}

  // Build properties
  form.value.properties.forEach(prop => {
    if (!prop.name.trim()) return
    properties[prop.name] = propertyFormToDatastoreValue(prop)
  })
  
  // Build entity
  const entity: DatastoreEntity = {
    key: {
      path: [{
        kind: form.value.kind.trim(),
        ...(form.value.keyType === 'custom' && form.value.customKey.trim() ? 
           { name: form.value.customKey.trim() } : {})
      }],
      partitionId: {
        projectId: props.projectId,
        ...(form.value.namespace.trim() ? { namespaceId: form.value.namespace.trim() } : {}),
        ...(form.value.database.trim() ? { databaseId: form.value.database.trim() } : {})
      }
    },
    properties
  }
  
  return entity
}

const handleCreate = async () => {
  hasValidationError.value = true
  if (!isFormValid.value) return

  // Check for named database limitation
  const databaseId = form.value.database
  if (databaseId && databaseId !== '' && databaseId !== '(default)') {
    appStore.showToast({
      type: 'error',
      title: 'Named Database Limitation',
      message: `Cannot create entities in named database "${databaseId}". This is a known limitation of the Datastore emulator. Please use the default database instead.`
    })
    return
  }

  try {
    isLoading.value = true

    const entity = buildDatastoreEntity()
    const createdEntity = await datastoreStore.createEntity(props.projectId, entity)

    // Show success message
    appStore.showToast({
      type: 'success',
      title: 'Entity Created',
      message: `Successfully created entity in kind "${form.value.kind}"`
    })

    // Emit created event and close modal
    emit('created', createdEntity)
    handleClose()

  } catch (error: any) {
    // Check if it's a named database error
    const errorMsg = error.response?.data?.error?.message || error.message || ''
    const isNamedDatabaseError = errorMsg.includes('mismatched databases') || errorMsg.includes('database')

    appStore.showToast({
      type: 'error',
      title: 'Creation Failed',
      message: isNamedDatabaseError
        ? 'Cannot create entities in named databases. This is a Datastore emulator limitation. Use the default database instead.'
        : 'Failed to create entity. Please check your inputs and try again.'
    })
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  handleClose()
}

const handleClose = () => {
  isOpen.value = false
  resetForm()
}

// Initialize form when modal opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    resetForm()

    // Load initial databases and kinds if namespace and database are already set
    if (form.value.namespace !== undefined) {
      try {
        const databases = await datastoreApi.listDatabases(props.projectId, form.value.namespace)
        localDatabases.value = databases

        // If database is also set, load kinds
        if (form.value.database !== undefined) {
          const kinds = await datastoreApi.listKinds(props.projectId, form.value.namespace, form.value.database)
          localKinds.value = kinds
        }
      } catch (error) {
        // Silently fail - user can manually select
      }
    }
  }
})
</script>