<template>
  <div class="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- Page Header with Database Selector -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Datastore</h1>
          <button
            @click="refreshData"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon :class="['w-4 h-4 mr-2', loading ? 'animate-spin' : '']" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <!-- Namespace Selector - PRIMARY FILTER -->
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Namespace
            </label>
            <CustomSelect
              v-model="selectedNamespace"
              :options="namespaceOptions"
              :icon="FolderIcon"
              :badge="`${namespaces.length}`"
              placeholder="Select namespace..."
              searchable
              @update:model-value="handleNamespaceChange"
            />
          </div>

          <!-- Arrow Separator -->
          <div class="flex md:items-center justify-center md:pt-5">
            <ChevronDownIcon class="w-5 h-5 text-gray-400 dark:text-gray-600 md:hidden" />
            <ChevronRightIcon class="w-5 h-5 text-gray-400 dark:text-gray-600 hidden md:block" />
          </div>

          <!-- Database Selector - SECONDARY FILTER -->
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Database
            </label>
            <CustomSelect
              v-model="selectedDatabase"
              :options="databaseOptions"
              :icon="CircleStackIcon"
              :badge="`${databases.length}`"
              :disabled="databases.length === 0 && namespaces.length === 0"
              placeholder="Select database..."
              searchable
              :empty-text="databases.length === 0 ? 'No databases in this namespace' : 'Select database...'"
              :empty-icon="InboxIcon"
              @update:model-value="handleDatabaseChange"
            />
          </div>

          <!-- Arrow Separator -->
          <div class="flex md:items-center justify-center md:pt-5">
            <ChevronDownIcon class="w-5 h-5 text-gray-400 dark:text-gray-600 md:hidden" />
            <ChevronRightIcon class="w-5 h-5 text-gray-400 dark:text-gray-600 hidden md:block" />
          </div>

          <!-- Kind Selector - TERTIARY FILTER -->
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Entity Kind
            </label>
            <CustomSelect
              v-model="selectedKind"
              :options="kindOptions"
              :icon="CubeIcon"
              :badge="`${kinds.length}`"
              :disabled="kinds.length === 0 || !selectedDatabase"
              placeholder="Select entity kind..."
              searchable
              :empty-text="selectedDatabase ? 'No kinds in this database' : 'Select database first'"
              :empty-icon="InboxIcon"
              @update:model-value="handleKindChange"
            />
          </div>
        </div>

        <!-- Info Banner - No databases in namespace -->
        <div v-if="selectedNamespace && databases.length === 0 && !loading" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex">
            <InformationCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
            <div class="text-sm text-blue-700 dark:text-blue-300">
              <p class="font-medium">No databases found in this namespace</p>
              <p class="mt-1">Databases are auto-discovered from entities. Click <strong>Refresh</strong> or ensure entities exist in namespace "{{ selectedNamespace || '(default)' }}".</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-hidden">
      <!-- No Kind Selected State -->
      <div v-if="!selectedKind" class="h-full flex items-center justify-center">
        <div class="text-center max-w-md px-4">
          <CubeIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select an entity kind
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Choose a namespace, database, and entity kind from the filters above to view and manage entities.
          </p>
        </div>
      </div>

      <!-- Entities Table -->
      <div v-else class="h-full flex flex-col bg-white dark:bg-gray-800">
        <!-- Table Header with Actions -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ selectedKind }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ entities.length }} entities
                <span v-if="selectedDatabase"> in database "{{ selectedDatabase || '(default)' }}"</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Column Picker Dropdown -->
              <Menu as="div" class="relative inline-block text-left">
                <MenuButton class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors">
                  <ViewColumnsIcon class="w-4 h-4 mr-2" />
                  Columns
                  <ChevronDownIcon class="w-4 h-4 ml-1" />
                </MenuButton>

                <transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems class="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg focus:!outline-none border !border-gray-200 dark:!border-gray-700">
                    <div class="p-3">
                      <!-- Header with actions -->
                      <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                        <h3 class="text-sm font-medium text-gray-900 dark:text-white">Display Columns</h3>
                        <div class="flex items-center gap-2">
                          <button
                            @click="toggleAllColumns(true)"
                            class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            All
                          </button>
                          <span class="text-gray-400">|</span>
                          <button
                            @click="toggleAllColumns(false)"
                            class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            None
                          </button>
                        </div>
                      </div>

                      <!-- Scrollable column list -->
                      <div class="max-h-96 overflow-y-auto space-y-1">
                        <!-- Fixed columns section -->
                        <div class="mb-2">
                          <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 px-1">Fixed</h4>
                          <label class="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              v-model="showParentColumn"
                              class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Parent</span>
                          </label>
                        </div>

                        <!-- Property columns section -->
                        <div v-if="columns.length > 0">
                          <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 px-1">Properties</h4>
                          <label
                            v-for="col in columns"
                            :key="col.key"
                            class="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              v-model="col.visible"
                              class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ col.label }}</span>
                          </label>
                        </div>

                        <div v-if="columns.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No property columns
                        </div>
                      </div>
                    </div>
                  </MenuItems>
                </transition>
              </Menu>

              <button
                @click="createEntity"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon class="w-4 h-4 mr-2" />
                New Entity
              </button>
            </div>
          </div>
        </div>

        <!-- Table Content -->
        <div class="flex-1 overflow-auto">
          <div v-if="loading" class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Loading entities...</p>
            </div>
          </div>

          <div v-else-if="entities.length === 0" class="flex items-center justify-center h-64">
            <div class="text-center">
              <InboxIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No entities found
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This kind has no entities in the selected database and namespace.
              </p>
              <button
                @click="createEntity"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon class="w-4 h-4 mr-2" />
                Create First Entity
              </button>
            </div>
          </div>

          <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Key / ID
                </th>
                <th v-if="showParentColumn" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Parent
                </th>
                <th
                  v-for="col in visibleColumns"
                  :key="col.key"
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  @click="sortByColumn(col.key)"
                >
                  <div class="flex items-center">
                    {{ col.label }}
                    <ChevronUpDownIcon class="w-4 h-4 ml-1" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="entity in entities"
                :key="getEntityId(entity)"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td class="px-3 py-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :checked="selectedEntities.includes(getEntityId(entity))"
                    @change="toggleEntitySelection(getEntityId(entity))"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <div
                    class="text-sm font-mono font-medium text-gray-900 dark:text-white cursor-help"
                    :title="getEntityId(entity)"
                  >
                    {{ getDisplayEntityId(entity) }}
                  </div>
                </td>
                <td v-if="showParentColumn" class="px-3 py-2 whitespace-nowrap">
                  <div
                    v-if="getEntityParent(entity)"
                    class="text-sm font-mono text-gray-600 dark:text-gray-400 cursor-help"
                    :title="getEntityParent(entity)"
                  >
                    {{ getDisplayEntityParent(entity) }}
                  </div>
                  <div v-else class="text-sm text-gray-400 dark:text-gray-600">
                    —
                  </div>
                </td>
                <td
                  v-for="col in visibleColumns"
                  :key="col.key"
                  class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white max-w-xs truncate"
                  :title="getEntityColumnValue(entity, col.key)"
                >
                  {{ getEntityColumnValue(entity, col.key) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bulk Actions Footer -->
        <div
          v-if="selectedEntities.length > 0"
          class="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-700 dark:text-blue-300">
              {{ selectedEntities.length }} entity(ies) selected
            </span>
            <button
              @click="deleteSelectedEntities"
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              <TrashIcon class="w-4 h-4 mr-2" />
              Delete Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import {
  ArrowPathIcon,
  CircleStackIcon,
  FolderIcon,
  CubeIcon,
  InformationCircleIcon,
  PlusIcon,
  InboxIcon,
  TrashIcon,
  ChevronUpDownIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ViewColumnsIcon
} from '@heroicons/vue/24/outline'
import { useDatastoreStore } from '@/stores/datastore'
import type { DatastoreEntity } from '@/types'
import type { SelectOption } from '@/components/ui/CustomSelect.vue'
import datastoreApi from '@/api/datastore'
import CustomSelect from '@/components/ui/CustomSelect.vue'

const route = useRoute()
const router = useRouter()
const datastoreStore = useDatastoreStore()

// State
const selectedKind = ref<string>('')
const entities = ref<DatastoreEntity[]>([])
const loading = ref(false)
const queryLimit = ref<number>(100)
const selectedEntities = ref<string[]>([])
const columns = ref<{ key: string; label: string; visible: boolean; fixed?: boolean }[]>([])
const showParentColumn = ref(true)

// Computed
const currentProjectId = computed(() => route.params.projectId as string)
const databases = computed(() => datastoreStore.databases)
const namespaces = computed(() => datastoreStore.namespaces)
const kinds = computed(() => datastoreStore.kinds)

const selectedDatabase = computed({
  get: () => datastoreStore.selectedDatabase,
  set: (value) => {
    datastoreStore.setSelectedDatabase(value)
  }
})

const selectedNamespace = computed({
  get: () => datastoreStore.selectedNamespace,
  set: (value) => {
    datastoreStore.setSelectedNamespace(value)
  }
})

const visibleColumns = computed(() => columns.value.filter(col => col.visible))

const allSelected = computed(() =>
  entities.value.length > 0 &&
  selectedEntities.value.length === entities.value.length
)

// Select options for custom dropdowns
const namespaceOptions = computed<SelectOption[]>(() =>
  namespaces.value.map(ns => ({
    value: ns,
    label: ns || '(default)',
    icon: FolderIcon
  }))
)

const databaseOptions = computed<SelectOption[]>(() =>
  databases.value.map(db => ({
    value: db,
    label: db || '(default)',
    icon: CircleStackIcon
  }))
)

const kindOptions = computed<SelectOption[]>(() =>
  kinds.value.map(kind => ({
    value: kind.name,
    label: kind.name,
    badge: `${kind.entityCount}`,
    icon: CubeIcon
  }))
)

// Methods
const initializeData = async () => {
  if (!currentProjectId.value) return

  loading.value = true
  try {
    // Step 1: Load namespaces first (primary filter)
    await datastoreStore.loadNamespaces(currentProjectId.value)

    // Restore namespace from URL query param or select first available
    const nsParam = route.query.ns as string | undefined
    if (nsParam !== undefined) {
      datastoreStore.setSelectedNamespace(nsParam)
    } else if (namespaces.value.length > 0 && !selectedNamespace.value) {
      datastoreStore.setSelectedNamespace(namespaces.value[0])
    }

    // Step 2: If we have a namespace selected, load databases for it
    if (selectedNamespace.value !== undefined) {
      await datastoreStore.loadDatabases(currentProjectId.value)

      // Restore database from query param or use first available
      const dbParam = route.query.db as string | undefined
      if (dbParam !== undefined) {
        datastoreStore.setSelectedDatabase(dbParam)
      } else if (databases.value.length > 0 && !selectedDatabase.value) {
        datastoreStore.setSelectedDatabase(databases.value[0])
      }

      // Step 3: If we have a database selected, load kinds
      if (selectedDatabase.value !== undefined) {
        await datastoreStore.loadKinds(currentProjectId.value)

        // Restore kind from query param
        const kindParam = route.query.kind as string | undefined
        if (kindParam && kinds.value.some(k => k.name === kindParam)) {
          selectedKind.value = kindParam
          await loadEntities()
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await initializeData()
  if (selectedKind.value) {
    await loadEntities()
  }
}

const handleNamespaceChange = async () => {
  console.log('[KindsView] Namespace changed to:', selectedNamespace.value)

  // Reset downstream selections
  datastoreStore.setSelectedDatabase('')
  selectedKind.value = ''
  entities.value = []
  columns.value = []

  // Update URL to remove database and kind when namespace changes
  router.push({
    query: {
      ns: selectedNamespace.value || undefined
    }
  })

  // Load databases for the selected namespace
  if (selectedNamespace.value !== undefined) {
    loading.value = true
    try {
      console.log('[KindsView] Loading databases for namespace:', selectedNamespace.value)
      await datastoreStore.loadDatabases(currentProjectId.value)
      console.log('[KindsView] Loaded databases:', databases.value)
      console.log('[KindsView] Database options:', databaseOptions.value)

      // Don't auto-select database - let user choose from the dropdown
    } catch (error) {
      console.error('Failed to load databases:', error)
    } finally {
      loading.value = false
    }
  }
}

const handleDatabaseChange = async () => {
  console.log('[KindsView] Database changed to:', selectedDatabase.value)

  // Reset downstream selections
  selectedKind.value = ''
  entities.value = []
  columns.value = []

  // Update URL with namespace and database, clear kind
  router.push({
    query: {
      ns: selectedNamespace.value || undefined,
      db: selectedDatabase.value || undefined
    }
  })

  // Load kinds for the selected database
  if (selectedDatabase.value !== undefined) {
    loading.value = true
    try {
      console.log('[KindsView] Loading kinds for:', {
        project: currentProjectId.value,
        namespace: selectedNamespace.value,
        database: selectedDatabase.value
      })
      await datastoreStore.loadKinds(currentProjectId.value)
      console.log('[KindsView] Kinds loaded:', kinds.value.length)
    } catch (error) {
      console.error('[KindsView] Failed to load kinds:', error)
    } finally {
      loading.value = false
    }
  }
}

const handleKindChange = async () => {
  // Update URL with all three filters
  router.push({
    query: {
      ns: selectedNamespace.value || undefined,
      db: selectedDatabase.value || undefined,
      kind: selectedKind.value || undefined
    }
  })

  if (selectedKind.value) {
    await loadEntities()
  } else {
    entities.value = []
    columns.value = []
  }
}

const loadEntities = async () => {
  if (!selectedKind.value) return

  loading.value = true
  try {
    const kindEntities = await datastoreApi.getEntitiesByKind(
      currentProjectId.value,
      selectedKind.value,
      selectedNamespace.value,
      queryLimit.value,
      undefined,
      selectedDatabase.value
    )
    entities.value = kindEntities

    // Build columns from entity properties
    if (kindEntities.length > 0) {
      const allProperties = new Set<string>()
      kindEntities.forEach(entity => {
        Object.keys(entity.properties || {}).forEach(prop => allProperties.add(prop))
      })

      // Sort columns alphabetically
      columns.value = Array.from(allProperties)
        .sort((a, b) => a.localeCompare(b))
        .map(prop => ({
          key: prop,
          label: prop,
          visible: true
        }))
    }
  } catch (error) {
    console.error('Failed to load entities:', error)
    entities.value = []
  } finally {
    loading.value = false
  }
}

const createEntity = () => {
  // TODO: Open create entity modal
  console.log('Create entity')
}

const editEntity = (entity: DatastoreEntity) => {
  // TODO: Open edit entity modal
  console.log('Edit entity:', entity)
}

const deleteEntityConfirm = async (entity: DatastoreEntity) => {
  if (!confirm('Are you sure you want to delete this entity?')) return

  try {
    await datastoreApi.deleteEntity(currentProjectId.value, entity.key)
    await loadEntities()
  } catch (error) {
    console.error('Failed to delete entity:', error)
  }
}

const deleteSelectedEntities = async () => {
  if (!confirm(`Delete ${selectedEntities.value.length} selected entity(ies)?`)) return

  // TODO: Implement bulk delete
  console.log('Delete selected:', selectedEntities.value)
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedEntities.value = []
  } else {
    selectedEntities.value = entities.value.map(e => getEntityId(e))
  }
}

const toggleEntitySelection = (entityId: string) => {
  const index = selectedEntities.value.indexOf(entityId)
  if (index > -1) {
    selectedEntities.value.splice(index, 1)
  } else {
    selectedEntities.value.push(entityId)
  }
}

const sortByColumn = (columnKey: string) => {
  // TODO: Implement sorting
  console.log('Sort by:', columnKey)
}

const toggleAllColumns = (visible: boolean) => {
  columns.value.forEach(col => {
    col.visible = visible
  })
}

const getEntityId = (entity: DatastoreEntity): string => {
  return datastoreApi.getKeyId(entity.key) || 'unknown'
}

const getDisplayEntityId = (entity: DatastoreEntity): string => {
  const id = getEntityId(entity)
  // Truncate long IDs for display (show first 20 chars + ellipsis)
  if (id.length > 30) {
    return id.substring(0, 30) + '...'
  }
  return id
}

const getEntityParent = (entity: DatastoreEntity): string | null => {
  // If path has more than 1 element, there's a parent
  if (!entity.key?.path || entity.key.path.length <= 1) {
    return null
  }

  // Build parent path from all elements except the last one
  const parentPath = entity.key.path.slice(0, -1)
  return parentPath.map(element => {
    const id = element.name || element.id || ''
    return `${element.kind}:${id}`
  }).join('/')
}

const getDisplayEntityParent = (entity: DatastoreEntity): string => {
  const parent = getEntityParent(entity)
  if (!parent) return ''

  // Truncate long parent paths for display
  if (parent.length > 30) {
    return parent.substring(0, 30) + '...'
  }
  return parent
}

const getEntityKind = (entity: DatastoreEntity): string => {
  return datastoreApi.getKeyKind(entity.key) || 'unknown'
}

const getEntityColumnValue = (entity: DatastoreEntity, columnKey: string): string => {
  const prop = entity.properties?.[columnKey]
  if (!prop) return '-'

  if (prop.stringValue !== undefined) return prop.stringValue
  if (prop.integerValue !== undefined) return prop.integerValue
  if (prop.doubleValue !== undefined) return String(prop.doubleValue)
  if (prop.booleanValue !== undefined) return String(prop.booleanValue)
  if (prop.timestampValue !== undefined) return prop.timestampValue
  if (prop.nullValue !== undefined) return 'null'

  // Convert array to JSON string to show full content
  if (prop.arrayValue) {
    try {
      const arrayContent = prop.arrayValue.values?.map((v: any) => {
        if (v.stringValue !== undefined) return v.stringValue
        if (v.integerValue !== undefined) return v.integerValue
        if (v.doubleValue !== undefined) return v.doubleValue
        if (v.booleanValue !== undefined) return v.booleanValue
        if (v.timestampValue !== undefined) return v.timestampValue
        if (v.nullValue !== undefined) return null
        if (v.entityValue) return convertEntityToObject(v.entityValue)
        if (v.keyValue) return v.keyValue
        return v
      }) || []
      return JSON.stringify(arrayContent)
    } catch (e) {
      return `[${prop.arrayValue.values?.length || 0} items]`
    }
  }

  // Convert nested entity to JSON string
  if (prop.entityValue) {
    try {
      return JSON.stringify(convertEntityToObject(prop.entityValue))
    } catch (e) {
      return '[Entity]'
    }
  }

  if (prop.keyValue) {
    try {
      return JSON.stringify(prop.keyValue)
    } catch (e) {
      return '[Key]'
    }
  }

  return '[Complex]'
}

// Helper to convert Datastore entity value to plain object
const convertEntityToObject = (entityValue: any): any => {
  if (!entityValue.properties) return {}

  const result: any = {}
  for (const [key, value] of Object.entries(entityValue.properties)) {
    const val = value as any

    if (val.stringValue !== undefined) result[key] = val.stringValue
    else if (val.integerValue !== undefined) result[key] = val.integerValue
    else if (val.doubleValue !== undefined) result[key] = val.doubleValue
    else if (val.booleanValue !== undefined) result[key] = val.booleanValue
    else if (val.timestampValue !== undefined) result[key] = val.timestampValue
    else if (val.nullValue !== undefined) result[key] = null
    else if (val.arrayValue) result[key] = val.arrayValue.values?.map((v: any) => {
      if (v.stringValue !== undefined) return v.stringValue
      if (v.integerValue !== undefined) return v.integerValue
      if (v.doubleValue !== undefined) return v.doubleValue
      if (v.booleanValue !== undefined) return v.booleanValue
      if (v.entityValue) return convertEntityToObject(v.entityValue)
      return v
    }) || []
    else if (val.entityValue) result[key] = convertEntityToObject(val.entityValue)
    else if (val.keyValue) result[key] = val.keyValue
    else result[key] = val
  }

  return result
}

// Watchers
watch(() => currentProjectId.value, async (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId && oldProjectId) {
    datastoreStore.clearData()
    selectedKind.value = ''
    entities.value = []
    if (newProjectId) {
      await initializeData()
    }
  }
}, { immediate: false })

// Watch for URL changes and sync to store (but don't trigger handlers that update URL)
watch(() => route.query.ns, (newNs, oldNs) => {
  const nsValue = newNs !== undefined ? String(newNs) : ''
  // Only update store if value actually changed and differs from store
  if (newNs !== oldNs && datastoreStore.selectedNamespace !== nsValue) {
    datastoreStore.setSelectedNamespace(nsValue)
  }
})

watch(() => route.query.db, (newDb, oldDb) => {
  const dbValue = newDb !== undefined ? String(newDb) : ''
  // Only update store if value actually changed and differs from store
  if (newDb !== oldDb && datastoreStore.selectedDatabase !== dbValue) {
    datastoreStore.setSelectedDatabase(dbValue)
  }
})

watch(() => route.query.kind, (newKind, oldKind) => {
  const kindValue = newKind !== undefined ? String(newKind) : ''
  // Only update selectedKind if value actually changed
  if (newKind !== oldKind && selectedKind.value !== kindValue) {
    selectedKind.value = kindValue
  }
})

// Lifecycle
onMounted(async () => {
  await initializeData()
})
</script>
