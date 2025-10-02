<template>
  <div class="h-full bg-white dark:bg-gray-800 transition-colors duration-200 flex flex-col">
    <!-- Page Header -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <h1 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                    Entities
                  </h1>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="refreshData"
                :disabled="datastoreStore.loading"
                class="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ArrowPathIcon
                  :class="['w-4 h-4', datastoreStore.loading ? 'animate-spin' : '', 'sm:mr-2']"
                />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Namespace and Kind Selection -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="px-4 sm:px-6 lg:px-8 py-6">
        <!-- Action Buttons -->
        <div class="mb-6 flex items-center gap-3">
          <button
            @click="runQuery"
            :disabled="!selectedKind || datastoreStore.loading"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <PlayIcon class="w-4 h-4 mr-2" />
            Run
          </button>

          <button
            @click="createEntity"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create entity
          </button>

          <button
            @click="deleteEntity"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Namespace Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Namespace
            </label>
            <div class="relative" v-click-outside="() => showNamespaceDropdown = false">
              <button
                @click="showNamespaceDropdown = !showNamespaceDropdown"
                type="button"
                class="relative w-full pl-3 pr-10 py-2.5 text-left text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                <span class="block truncate">{{ selectedNamespace || '(default)' }}</span>
                <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDownIcon
                    class="h-5 w-5 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': showNamespaceDropdown }"
                  />
                </span>
              </button>

              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showNamespaceDropdown"
                  class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  <ul class="py-1">
                    <li
                      v-for="ns in namespaces"
                      :key="ns"
                      @click="selectNamespaceOption(ns)"
                      class="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors duration-150"
                      :class="{ 'bg-blue-100 dark:bg-blue-900/50': selectedNamespace === ns }"
                    >
                      {{ ns || '(default)' }}
                    </li>
                  </ul>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Kind Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kind
            </label>
            <div class="relative" v-click-outside="() => showKindDropdown = false">
              <button
                @click="kinds.length > 0 && (showKindDropdown = !showKindDropdown)"
                type="button"
                :disabled="kinds.length === 0"
                class="relative w-full pl-3 pr-10 py-2.5 text-left text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:shadow-none"
              >
                <span class="block truncate" :class="{ 'text-gray-400': !selectedKind }">
                  {{ selectedKind || 'Select a kind...' }}
                </span>
                <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDownIcon
                    class="h-5 w-5 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': showKindDropdown }"
                  />
                </span>
              </button>

              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showKindDropdown"
                  class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  <ul class="py-1">
                    <li
                      v-for="kind in kinds"
                      :key="kind.name"
                      @click="selectKindOption(kind.name)"
                      class="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors duration-150"
                      :class="{ 'bg-blue-100 dark:bg-blue-900/50': selectedKind === kind.name }"
                    >
                      {{ kind.name }}
                    </li>
                  </ul>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Query Builder -->
        <div class="mt-6 space-y-4">
          <!-- WHERE Clauses -->
          <div v-for="(whereClause, index) in whereClauses" :key="`where-${index}`" class="flex items-start gap-2">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
              <!-- Selection Type -->
              <select
                v-model="whereClause.selection"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WHERE">WHERE</option>
              </select>

              <!-- Property -->
              <input
                v-model="whereClause.property"
                type="text"
                placeholder="Property"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <!-- Operator -->
              <select
                v-model="whereClause.operator"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="==">=</option>
                <option value="!=">!=</option>
                <option value="<">&lt;</option>
                <option value="<=">&lt;=</option>
                <option value=">">&gt;</option>
                <option value=">=">&gt;=</option>
              </select>

              <!-- Value -->
              <input
                v-model="whereClause.value"
                type="text"
                placeholder="Value *"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Delete Button -->
            <button
              @click="removeWhereClause(index)"
              class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Remove clause"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- ORDER BY Clauses -->
          <div v-for="(orderClause, index) in orderByClauses" :key="`order-${index}`" class="flex items-start gap-2">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <!-- Selection Type -->
              <select
                v-model="orderClause.selection"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ORDER BY">ORDER BY</option>
              </select>

              <!-- Property -->
              <input
                v-model="orderClause.property"
                type="text"
                placeholder="Property"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <!-- Order Direction -->
              <select
                v-model="orderClause.direction"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ascending">ascending</option>
                <option value="descending">descending</option>
              </select>
            </div>

            <!-- Delete Button -->
            <button
              @click="removeOrderByClause(index)"
              class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Remove clause"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Add to Query Button -->
          <div class="relative">
            <button
              @click="toggleQueryMenu"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add to query
              <ChevronDownIcon class="ml-2 w-4 h-4" />
            </button>

            <!-- Query Menu Dropdown -->
            <div
              v-if="showQueryMenu"
              class="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
            >
              <div class="p-4 space-y-3">
                <div class="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selection</h4>
                  <button
                    @click="addWhereClause"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <div class="font-medium">WHERE</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Use specific operators to match conditions</div>
                  </button>
                  <button
                    @click="addOrderByClause"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded mt-2"
                  >
                    <div class="font-medium">ORDER BY</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Sort results in ascending or descending order by property</div>
                  </button>
                  <button
                    @click="toggleLimitInput"
                    class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded mt-2"
                  >
                    <div class="font-medium">LIMIT</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Return up to a specific number of results</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Limit Input -->
          <div v-if="showLimitInput" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">LIMIT</label>
            <input
              v-model.number="queryLimit"
              type="number"
              min="1"
              placeholder="Number of results"
              class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              @click="removeLimitInput"
              class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Remove limit"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-white dark:bg-gray-800">
      <!-- Loading State -->
      <div v-if="datastoreStore.loading && !selectedKind" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>

      <!-- No Kind Selected State -->
      <div v-else-if="!selectedKind" class="flex items-center justify-center h-full">
        <div class="text-center max-w-md">
          <CircleStackIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select a kind to view entities</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a namespace and kind from the dropdowns above to display entities.
          </p>
        </div>
      </div>

      <!-- Entities List -->
      <div v-else-if="entities.length > 0" class="h-full flex flex-col">
        <!-- Query Results Header -->
        <div class="px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Query results</h3>
            <div class="relative" v-click-outside="() => showColumnSelector = false">
              <button
                @click="toggleColumnSelector"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Select columns to display"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4h6M9 8h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                </svg>
              </button>

              <!-- Column Selector Dropdown -->
              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showColumnSelector"
                  class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-96 overflow-auto"
                >
                  <div class="p-3">
                    <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Select columns</div>
                    <div class="space-y-1">
                      <label
                        v-for="column in columns"
                        :key="column.key"
                        class="flex items-center px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          v-model="column.visible"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <span class="text-sm text-gray-700 dark:text-gray-200">{{ column.label }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="flex-1 overflow-auto">
          <div class="inline-block min-w-full align-middle">
            <table class="min-w-full border-collapse">
              <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th scope="col" class="w-12 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      @change="toggleSelectAll"
                      :checked="allSelected"
                    />
                  </th>
                  <th
                    v-for="column in visibleColumns"
                    :key="column.key"
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                  >
                    <div class="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" @click="sortByColumn(column.key)">
                      {{ column.label }}
                      <svg v-if="sortColumn === column.key" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path v-if="sortDirection === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="entity in entities"
                  :key="getEntityId(entity)"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  @click="viewEntity(entity)"
                >
                  <td class="w-12 px-4 py-3" @click.stop>
                    <input
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      :checked="selectedEntities.includes(getEntityId(entity))"
                      @change="toggleEntitySelection(getEntityId(entity))"
                    />
                  </td>
                  <td
                    v-for="column in visibleColumns"
                    :key="column.key"
                    class="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap"
                  >
                    <div class="truncate max-w-xs">
                      {{ getEntityColumnValue(entity, column.key) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty Entities State -->
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center max-w-md">
          <CircleStackIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No entities found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No entities exist for kind "{{ selectedKind }}" in namespace "{{ selectedNamespace || '(default)' }}".
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowPathIcon,
  CircleStackIcon,
  TrashIcon,
  ChevronDownIcon,
  PlayIcon
} from '@heroicons/vue/24/outline'
import { useDatastoreStore } from '@/stores/datastore'
import type { DatastoreEntity } from '@/types'
import datastoreApi from '@/api/datastore'

const route = useRoute()
const router = useRouter()
const datastoreStore = useDatastoreStore()

// Query Builder Types
interface WhereClause {
  selection: string
  property: string
  operator: string
  value: string
}

interface OrderByClause {
  selection: string
  property: string
  direction: 'ascending' | 'descending'
}

// Column configuration
interface TableColumn {
  key: string
  label: string
  visible: boolean
}

// State
const selectedKind = ref<string>('')
const entities = ref<DatastoreEntity[]>([])
const whereClauses = ref<WhereClause[]>([])
const orderByClauses = ref<OrderByClause[]>([])
const showQueryMenu = ref(false)
const showLimitInput = ref(false)
const queryLimit = ref<number | undefined>(undefined)
const showNamespaceDropdown = ref(false)
const showKindDropdown = ref(false)

// Table state
const columns = ref<TableColumn[]>([])
const selectedEntities = ref<string[]>([])
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')
const showColumnSelector = ref(false)

// Computed
const currentProjectId = computed(() => route.params.projectId as string)
const namespaces = computed(() => datastoreStore.namespaces)
const kinds = computed(() => datastoreStore.kinds)
const selectedNamespace = computed({
  get: () => datastoreStore.selectedNamespace,
  set: (value) => datastoreStore.setSelectedNamespace(value)
})

const visibleColumns = computed(() => columns.value.filter(col => col.visible))

const allSelected = computed(() =>
  entities.value.length > 0 &&
  selectedEntities.value.length === entities.value.length
)

// Custom Dropdown Methods
const selectNamespaceOption = (ns: string) => {
  selectedNamespace.value = ns
  showNamespaceDropdown.value = false
  handleNamespaceChange()
}

const selectKindOption = (kind: string) => {
  selectedKind.value = kind
  showKindDropdown.value = false
  handleKindChange()
}

// Query Builder Methods
const toggleQueryMenu = () => {
  showQueryMenu.value = !showQueryMenu.value
}

const addWhereClause = () => {
  whereClauses.value.push({
    selection: 'WHERE',
    property: '',
    operator: '==',
    value: ''
  })
  showQueryMenu.value = false
}

const removeWhereClause = (index: number) => {
  whereClauses.value.splice(index, 1)
}

const addOrderByClause = () => {
  orderByClauses.value.push({
    selection: 'ORDER BY',
    property: '',
    direction: 'ascending'
  })
  showQueryMenu.value = false
}

const removeOrderByClause = (index: number) => {
  orderByClauses.value.splice(index, 1)
}

const toggleLimitInput = () => {
  showLimitInput.value = !showLimitInput.value
  if (!showLimitInput.value) {
    queryLimit.value = undefined
  }
  showQueryMenu.value = false
}

const removeLimitInput = () => {
  showLimitInput.value = false
  queryLimit.value = undefined
}

const runQuery = async () => {
  await loadEntities()
}

// Methods
const refreshData = async () => {
  await datastoreStore.loadNamespaces(currentProjectId.value)
  if (selectedNamespace.value) {
    await datastoreStore.loadKinds(currentProjectId.value)
  }
  if (selectedKind.value) {
    await loadEntities()
  }
}

const handleNamespaceChange = async () => {
  selectedKind.value = ''
  entities.value = []
  await datastoreStore.loadKinds(currentProjectId.value)
}

const handleKindChange = async () => {
  if (selectedKind.value) {
    await loadEntities()
  } else {
    entities.value = []
  }
}

const loadEntities = async () => {
  if (!selectedKind.value) return

  datastoreStore.loading = true
  try {
    const result = await datastoreApi.getEntitiesByKind(
      currentProjectId.value,
      selectedKind.value,
      selectedNamespace.value
    )
    entities.value = result

    // Build columns from entity properties
    if (result.length > 0) {
      const propertyKeys = new Set<string>()

      // Collect all unique property keys from all entities
      result.forEach(entity => {
        Object.keys(entity.properties).forEach(key => propertyKeys.add(key))
      })

      // Create columns array with Name/ID first, then all properties
      const newColumns: TableColumn[] = [
        { key: 'name', label: 'Name/ID', visible: true }
      ]

      // Add property columns
      Array.from(propertyKeys).sort().forEach(key => {
        newColumns.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
          visible: true
        })
      })

      columns.value = newColumns
    }
  } catch (error) {
    console.error('Failed to load entities:', error)
    entities.value = []
    columns.value = []
  } finally {
    datastoreStore.loading = false
  }
}

const getEntityId = (entity: DatastoreEntity): string => {
  return datastoreApi.getKeyId(entity.key)
}

const viewEntity = (entity: DatastoreEntity) => {
  // TODO: Open entity detail modal or navigate to detail view
  console.log('View entity:', entity)
}

const createEntity = () => {
  // TODO: Open create entity modal
  console.log('Create entity')
}

const deleteEntity = () => {
  // TODO: Open delete entity modal or confirmation
  console.log('Delete entity')
}

// Table methods
const toggleColumnSelector = () => {
  showColumnSelector.value = !showColumnSelector.value
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
  if (sortColumn.value === columnKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = columnKey
    sortDirection.value = 'asc'
  }
  // TODO: Implement actual sorting logic
}

const getEntityColumnValue = (entity: DatastoreEntity, columnKey: string): string => {
  // Handle Name/ID column specially
  if (columnKey === 'name') {
    return getEntityId(entity)
  }

  // Extract value from entity properties
  const prop = entity.properties[columnKey]
  if (!prop) return '-'

  // Handle different value types
  if (prop.nullValue !== undefined) return 'null'
  if (prop.stringValue !== undefined) return prop.stringValue
  if (prop.integerValue !== undefined) return prop.integerValue
  if (prop.booleanValue !== undefined) return String(prop.booleanValue)
  if (prop.doubleValue !== undefined) return String(prop.doubleValue)
  if (prop.timestampValue !== undefined) return prop.timestampValue
  if (prop.blobValue !== undefined) return '[Blob]'
  if (prop.entityValue !== undefined) return '[Entity]'
  if (prop.arrayValue !== undefined) return `[Array (${prop.arrayValue.values.length})]`
  if (prop.keyValue !== undefined) return '[Key]'
  if (prop.geoPointValue !== undefined) return `[${prop.geoPointValue.latitude}, ${prop.geoPointValue.longitude}]`

  return '-'
}

// Initialize data
const initializeData = async () => {
  await datastoreStore.loadDatabases(currentProjectId.value)
  await datastoreStore.loadNamespaces(currentProjectId.value)
  if (datastoreStore.namespaces.length > 0 && !datastoreStore.selectedNamespace) {
    datastoreStore.setSelectedNamespace(datastoreStore.namespaces[0])
  }
  if (selectedNamespace.value) {
    await datastoreStore.loadKinds(currentProjectId.value)
  }
}

// Watch for project changes
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

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any).clickOutsideEvent)
  }
}

// Lifecycle
onMounted(async () => {
  await initializeData()
})
</script>
