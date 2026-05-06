<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <h1 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                    Firestore Query Builder
                  </h1>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <router-link
                :to="`/projects/${$route.params.projectId}/firestore/collections`"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm"
              >
                <CircleStackIcon class="w-4 h-4 sm:mr-2" />
                <span class="hidden sm:inline">Collections</span>
              </router-link>

              <button
                @click="runQuery"
                :disabled="loading || !selectedCollection"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <PlayIcon v-if="!loading" class="w-4 h-4 mr-2" />
                <ArrowPathIcon v-else class="w-4 h-4 mr-2 animate-spin" />
                Run Query
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden">
      <div
        class="grid grid-cols-1 lg:grid-cols-4 h-full divide-x divide-gray-200 dark:divide-gray-700"
      >
        <!-- Left: Query Configuration -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-800 overflow-auto">
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Collection Selection -->
            <div class="p-5 hover:bg-gray-50/30 dark:hover:bg-gray-900/10 transition-colors">
              <div class="mb-4">
                <h3
                  class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                >
                  Collection
                </h3>
              </div>
              <CustomSelect
                v-model="selectedCollection"
                :options="collectionOptions"
                placeholder="Select a collection..."
                searchable
              />
              <div class="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="allDescendants"
                  id="all-descendants"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  for="all-descendants"
                  class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  >Include all descendants (Collection Group)</label
                >
              </div>
            </div>

            <!-- Standard Clauses -->
            <div class="p-5">
              <div class="flex items-center justify-between mb-4">
                <h3
                  class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                >
                  Filters & Sorting
                </h3>
                <div class="flex gap-2">
                  <button
                    @click="addWhere"
                    class="text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold"
                  >
                    + WHERE
                  </button>
                  <button
                    @click="addOrderBy"
                    class="text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold"
                  >
                    + ORDER BY
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                <!-- Where Clauses -->
                <div
                  v-for="(clause, idx) in whereClauses"
                  :key="'w-' + idx"
                  class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 relative group"
                >
                  <button
                    @click="removeWhere(idx)"
                    class="absolute -top-2 -right-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  >
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                  <div class="grid grid-cols-1 gap-2">
                    <input
                      v-model="clause.field"
                      placeholder="Field path (e.g. user.name)"
                      class="text-xs p-1.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-colors"
                    />
                    <div class="flex gap-2">
                      <select
                        v-model="clause.op"
                        class="text-xs p-1 bg-transparent border-none focus:ring-0 text-gray-600 dark:text-gray-400 font-bold"
                      >
                        <option value="EQUAL">==</option>
                        <option value="NOT_EQUAL">!=</option>
                        <option value="LESS_THAN">&lt;</option>
                        <option value="LESS_THAN_OR_EQUAL">&lt;=</option>
                        <option value="GREATER_THAN">&gt;</option>
                        <option value="GREATER_THAN_OR_EQUAL">&gt;=</option>
                        <option value="ARRAY_CONTAINS">array-contains</option>
                        <option value="IN">in</option>
                        <option value="NOT_IN">not-in</option>
                      </select>
                      <input
                        v-model="clause.value"
                        placeholder="Value"
                        class="flex-1 text-xs p-1.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <!-- Order By -->
                <div
                  v-for="(clause, idx) in orderByClauses"
                  :key="'o-' + idx"
                  class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 relative group"
                >
                  <input
                    v-model="clause.field"
                    placeholder="Field path"
                    class="flex-1 text-xs p-1.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-colors"
                  />
                  <select
                    v-model="clause.direction"
                    class="text-xs p-1 bg-transparent border-none focus:ring-0 text-gray-500"
                  >
                    <option value="ASCENDING">ASC</option>
                    <option value="DESCENDING">DESC</option>
                  </select>
                  <button @click="removeOrderBy(idx)" class="text-gray-400 hover:text-red-500">
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                </div>

                <!-- Limit -->
                <div class="flex items-center gap-3 pt-2">
                  <span class="text-[10px] font-bold text-gray-400 uppercase">LIMIT</span>
                  <input
                    type="number"
                    v-model="limit"
                    class="w-20 text-xs p-1.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Pipeline Stages (Advanced) -->
            <div class="p-5">
              <div class="flex items-center justify-between mb-4">
                <h3
                  class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                >
                  Aggregation Pipeline
                </h3>
                <button
                  @click="addPipelineStage"
                  class="text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold"
                >
                  + STAGE
                </button>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(stage, idx) in pipelineStages"
                  :key="'s-' + idx"
                  class="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 relative group"
                >
                  <button
                    @click="removePipelineStage(idx)"
                    class="absolute -top-2 -right-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  >
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                  <div class="space-y-2">
                    <select
                      v-model="stage.type"
                      class="text-xs font-bold text-gray-600 dark:text-gray-400 bg-transparent border-none focus:ring-0 w-full"
                    >
                      <option value="count">COUNT</option>
                      <option value="sum">SUM</option>
                      <option value="avg">AVG</option>
                      <option value="add_fields">ADD FIELDS</option>
                      <option value="let">LET</option>
                    </select>
                    <div class="flex gap-2">
                      <input
                        v-model="stage.alias"
                        placeholder="Alias (e.g. total)"
                        class="flex-1 text-xs p-1.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none"
                      />
                      <input
                        v-if="['sum', 'avg', 'add_fields'].includes(stage.type)"
                        v-model="stage.field"
                        :placeholder="stage.type === 'add_fields' ? 'Expression' : 'Field path'"
                        class="flex-[2] text-xs p-1.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div
                  v-if="pipelineStages.length === 0"
                  class="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg"
                >
                  <div class="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                    No stages added. Results will return a standard list of documents.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Results -->
        <div class="lg:col-span-3 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
          <!-- Results Header -->
          <div
            class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20"
          >
            <div class="flex items-center gap-3">
              <h3
                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
              >
                Query Results
              </h3>
              <span
                v-if="results.length > 0"
                class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] rounded-full uppercase"
              >
                {{ results.length }} items
              </span>
            </div>
            <div class="flex items-center gap-4 text-xs">
              <div
                v-if="aggregationResult"
                class="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-900/50 font-mono text-[10px] flex items-center gap-2 shadow-sm"
              >
                <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                {{ aggregationResult }}
              </div>
            </div>
          </div>

          <!-- Results Content -->
          <div class="flex-1 overflow-auto relative">
            <div
              v-if="loading"
              class="absolute inset-0 bg-white/60 dark:bg-gray-800/60 flex items-center justify-center z-20 backdrop-blur-[2px]"
            >
              <div class="flex flex-col items-center">
                <ArrowPathIcon class="w-10 h-10 text-orange-500 animate-spin mb-2" />
                <span class="text-xs font-bold text-gray-500 dark:text-gray-400 animate-pulse"
                  >Executing Pipeline...</span
                >
              </div>
            </div>

            <div v-if="results.length > 0" class="p-0 overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50/80 dark:bg-gray-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                    >
                      Document ID
                    </th>
                    <th
                      v-for="col in columns"
                      :key="col"
                      class="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                    >
                      {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800"
                >
                  <tr
                    v-for="doc in results"
                    :key="doc.name"
                    class="hover:bg-orange-50/30 dark:hover:bg-orange-900/5 transition-colors group"
                  >
                    <td
                      class="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[150px]"
                    >
                      {{ doc.name.split('/').pop() }}
                    </td>
                    <td
                      v-for="col in columns"
                      :key="col"
                      class="px-4 py-3 text-xs text-gray-900 dark:text-gray-200"
                    >
                      <div
                        v-if="doc.fields[col]"
                        class="truncate max-w-[250px]"
                        :title="JSON.stringify(formatValue(doc.fields[col]))"
                      >
                        <span
                          v-if="typeof formatValue(doc.fields[col]) === 'string'"
                          class="text-gray-900 dark:text-gray-100"
                        >
                          {{ formatValue(doc.fields[col]) }}
                        </span>
                        <span
                          v-else-if="typeof formatValue(doc.fields[col]) === 'number'"
                          class="text-blue-600 dark:text-blue-400 font-mono"
                        >
                          {{ formatValue(doc.fields[col]) }}
                        </span>
                        <span
                          v-else-if="typeof formatValue(doc.fields[col]) === 'boolean'"
                          class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                          :class="
                            formatValue(doc.fields[col])
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          "
                        >
                          {{ formatValue(doc.fields[col]) }}
                        </span>
                        <span v-else class="text-gray-400 dark:text-gray-500 italic">
                          {{ formatValue(doc.fields[col]) }}
                        </span>
                      </div>
                      <span v-else class="text-gray-200 dark:text-gray-700">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-else-if="!loading"
              class="h-full flex flex-col items-center justify-center py-20 text-center"
            >
              <div
                class="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner"
              >
                <DocumentIcon class="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3
                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
              >
                No documents found
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  PlayIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentIcon,
  CircleStackIcon,
} from '@heroicons/vue/24/outline'
import { useFirestoreStore } from '@/stores/firestore'
import firestoreApi from '@/api/firestore'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import type { FirestoreDocument, FirestoreQuery, FirestoreAggregation } from '@/types'

const route = useRoute()
const firestoreStore = useFirestoreStore()

const currentProjectId = computed(() => route.params.projectId as string)
const loading = ref(false)
const selectedCollection = ref('')
const allDescendants = ref(false)
const results = ref<FirestoreDocument[]>([])
const aggregationResult = ref<string | null>(null)
const limit = ref(50)

// Standard Clauses
const whereClauses = ref<{ field: string; op: string; value: string }[]>([])
const orderByClauses = ref<{ field: string; direction: 'ASCENDING' | 'DESCENDING' }[]>([])

// Pipeline Stages
const pipelineStages = ref<{ type: string; alias: string; field?: string }[]>([])

const collectionOptions = computed(() => {
  return firestoreStore.collections.map(c => ({
    label: c.id,
    value: c.id,
  }))
})

const columns = computed(() => {
  if (results.value.length === 0) return []
  const cols = new Set<string>()
  results.value.forEach(doc => {
    Object.keys(doc.fields).forEach(k => cols.add(k))
  })
  return Array.from(cols).sort()
})

function addWhere() {
  whereClauses.value.push({ field: '', op: 'EQUAL', value: '' })
}
function removeWhere(idx: number) {
  whereClauses.value.splice(idx, 1)
}
function addOrderBy() {
  orderByClauses.value.push({ field: '', direction: 'ASCENDING' })
}
function removeOrderBy(idx: number) {
  orderByClauses.value.splice(idx, 1)
}
function addPipelineStage() {
  const nextAlias = `stage_${pipelineStages.value.length + 1}`
  pipelineStages.value.push({ type: 'count', alias: nextAlias })
}
function removePipelineStage(idx: number) {
  pipelineStages.value.splice(idx, 1)
}

function formatValue(v: any): any {
  if (!v) return null
  if (v.stringValue !== undefined) return v.stringValue
  if (v.integerValue !== undefined) return parseInt(v.integerValue)
  if (v.doubleValue !== undefined) return parseFloat(v.doubleValue)
  if (v.booleanValue !== undefined) return v.booleanValue
  if (v.timestampValue !== undefined) return v.timestampValue
  if (v.nullValue !== undefined) return 'null'
  if (v.mapValue) return '{...}'
  if (v.arrayValue) return '[...]'
  if (v.referenceValue) return v.referenceValue.split('/').pop()
  return JSON.stringify(v)
}

function parseValue(val: string): any {
  const trimmed = val.trim()
  if (trimmed.toLowerCase() === 'true') return { booleanValue: true }
  if (trimmed.toLowerCase() === 'false') return { booleanValue: false }
  if (trimmed.toLowerCase() === 'null') return { nullValue: null }
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    if (trimmed.includes('.')) return { doubleValue: parseFloat(trimmed) }
    return { integerValue: trimmed }
  }
  return { stringValue: val }
}

async function runQuery() {
  if (!selectedCollection.value) return

  loading.value = true
  results.value = []
  aggregationResult.value = null

  try {
    const parent = `${firestoreStore.getCurrentDatabasePath(currentProjectId.value)}/documents`

    // Build StructuredQuery
    const query: FirestoreQuery = {
      from: [
        {
          collectionId: selectedCollection.value,
          allDescendants: allDescendants.value,
        },
      ],
      limit: limit.value,
    }

    if (whereClauses.value.length > 0) {
      const filters = whereClauses.value
        .filter(w => w.field)
        .map(w => ({
          fieldFilter: {
            field: { fieldPath: w.field },
            op: w.op as any,
            value: parseValue(w.value),
          },
        }))

      if (filters.length === 1) {
        query.where = filters[0] as any
      } else if (filters.length > 1) {
        query.where = {
          compositeFilter: {
            op: 'AND',
            filters: filters as any,
          },
        }
      }
    }

    if (orderByClauses.value.length > 0) {
      query.orderBy = orderByClauses.value
        .filter(o => o.field)
        .map(o => ({
          field: { fieldPath: o.field },
          direction: o.direction,
        }))
    }

    // Check if we have aggregation stages
    if (pipelineStages.value.length > 0) {
      const aggregations: FirestoreAggregation[] = pipelineStages.value.map(s => {
        const agg: FirestoreAggregation = { alias: s.alias }
        if (s.type === 'count') agg.count = {}
        else if (s.type === 'sum') agg.sum = { field: { fieldPath: s.field || '' } }
        else if (s.type === 'avg') agg.avg = { field: { fieldPath: s.field || '' } }
        // Note: add_fields and let are handled differently in some SDKs/REST versions
        // but here we map them to the basic aggregation types supported by our types
        return agg
      })

      const res = await firestoreApi.runAggregationQuery(parent, {
        structuredAggregationQuery: {
          structuredQuery: query,
          aggregations,
        },
      })

      if (res.result) {
        aggregationResult.value = Object.entries(res.result.aggregateFields)
          .map(([alias, val]) => `${alias}: ${formatValue(val)}`)
          .join(' | ')
      }
    } else {
      const res = await firestoreApi.runQuery(parent, query)
      results.value = res.map(r => r.document).filter(Boolean) as FirestoreDocument[]
    }
  } catch (error) {
    console.error('Query failed:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (firestoreStore.collections.length === 0) {
    firestoreStore.loadCollections(currentProjectId.value)
  }
})
</script>

<style scoped>
/* Smooth transitions for list items */
.space-y-4 > * {
  transition: all 0.2s ease-in-out;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
