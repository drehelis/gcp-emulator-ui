<template>
  <BaseModal
    v-model="modelValue"
    title="Entity Details"
    size="5xl"
    :icon="CubeIcon"
    :actions="modalActions"
    @close="handleClose"
  >
    <div v-if="entity" class="space-y-6">
      <!-- Key Information -->
      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <span class="w-1 h-4 bg-blue-500 dark:bg-blue-400 rounded mr-2"></span>
          Key Information
        </h3>

        <div class="space-y-1.5 text-sm">
          <!-- Database ID -->
          <div v-if="entity.key?.partitionId?.databaseId" class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">Database ID:</span>
            <code class="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-gray-900/50 px-1.5 py-0.5 rounded break-all border border-gray-200 dark:border-gray-700">{{ entity.key.partitionId.databaseId }}</code>
          </div>

          <!-- Namespace -->
          <div v-if="entity.key?.partitionId?.namespaceId !== undefined" class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">Namespace:</span>
            <code class="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-gray-900/50 px-1.5 py-0.5 rounded break-all border border-gray-200 dark:border-gray-700">{{ entity.key.partitionId.namespaceId || '(default)' }}</code>
          </div>

          <!-- Entity Kind -->
          <div class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">Entity Kind:</span>
            <code class="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-gray-900/50 px-1.5 py-0.5 rounded break-all border border-gray-200 dark:border-gray-700">{{ getEntityKind(entity) }}</code>
          </div>

          <!-- Key / ID -->
          <div class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">Key / ID:</span>
            <code class="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-gray-900/50 px-1.5 py-0.5 rounded break-all border border-gray-200 dark:border-gray-700">{{ getEntityId(entity) }}</code>
          </div>

          <!-- Key literal -->
          <div class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">Key literal:</span>
            <code class="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-gray-900/50 px-1.5 py-0.5 rounded break-all border border-gray-200 dark:border-gray-700">{{ getKeyLiteral(entity) }}</code>
          </div>

          <!-- URL-safe key -->
          <div class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">URL-safe key:</span>
            <code class="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white dark:bg-gray-900/50 px-1.5 py-0.5 rounded break-all border border-gray-200 dark:border-gray-700">{{ getUrlSafeKey(entity) }}</code>
          </div>
        </div>
      </div>

      <!-- Properties -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <span class="w-1 h-4 bg-blue-500 dark:bg-blue-400 rounded mr-2"></span>
            Properties
          </h3>
          <button
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Add property"
          >
            <PlusIcon class="w-3.5 h-3.5 mr-1" />
            Add property
          </button>
        </div>

        <div v-if="!entity.properties || Object.keys(entity.properties).length === 0" class="text-center py-8">
          <InboxIcon class="mx-auto w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">No properties</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Value
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Indexed
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(value, key) in paginatedProperties"
                :key="key"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <!-- Name -->
                <td class="px-3 py-2 whitespace-nowrap">
                  <code class="text-xs font-mono text-gray-900 dark:text-gray-100">{{ key }}</code>
                </td>

                <!-- Type -->
                <td class="px-3 py-2 whitespace-nowrap">
                  <span class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                    {{ getPropertyType(value) }}
                  </span>
                </td>

                <!-- Value -->
                <td class="px-3 py-2">
                  <div class="max-w-md">
                    <!-- String value -->
                    <code v-if="value.stringValue !== undefined" class="text-xs font-mono text-gray-900 dark:text-gray-100 break-all">{{ value.stringValue }}</code>

                    <!-- Integer value -->
                    <code v-else-if="value.integerValue !== undefined" class="text-xs font-mono text-gray-900 dark:text-gray-100">{{ value.integerValue }}</code>

                    <!-- Double value -->
                    <code v-else-if="value.doubleValue !== undefined" class="text-xs font-mono text-gray-900 dark:text-gray-100">{{ value.doubleValue }}</code>

                    <!-- Boolean value -->
                    <code v-else-if="value.booleanValue !== undefined" class="text-xs font-mono text-gray-900 dark:text-gray-100">{{ value.booleanValue }}</code>

                    <!-- Timestamp value -->
                    <code v-else-if="value.timestampValue !== undefined" class="text-xs font-mono text-gray-900 dark:text-gray-100">{{ value.timestampValue }}</code>

                    <!-- Null value -->
                    <code v-else-if="value.nullValue !== undefined" class="text-xs font-mono text-gray-500 dark:text-gray-400 italic">null</code>

                    <!-- Array value -->
                    <code v-else-if="value.arrayValue" class="text-xs font-mono text-gray-900 dark:text-gray-100 block">
                      <pre class="whitespace-pre-wrap break-all">{{ formatArrayValue(value.arrayValue) }}</pre>
                    </code>

                    <!-- Entity value (nested) -->
                    <code v-else-if="value.entityValue" class="text-xs font-mono text-gray-900 dark:text-gray-100 block">
                      <pre class="whitespace-pre-wrap break-all">{{ formatEntityValue(value.entityValue) }}</pre>
                    </code>

                    <!-- Key value -->
                    <code v-else-if="value.keyValue" class="text-xs font-mono text-gray-900 dark:text-gray-100 block">
                      <pre class="whitespace-pre-wrap break-all">{{ JSON.stringify(value.keyValue, null, 2) }}</pre>
                    </code>

                    <!-- Blob value -->
                    <code v-else-if="value.blobValue !== undefined" class="text-xs font-mono text-gray-900 dark:text-gray-100 break-all">{{ value.blobValue }}</code>

                    <!-- GeoPoint value -->
                    <code v-else-if="value.geoPointValue" class="text-xs font-mono text-gray-900 dark:text-gray-100">{{ value.geoPointValue.latitude }}, {{ value.geoPointValue.longitude }}</code>

                    <!-- Unknown type -->
                    <code v-else class="text-xs font-mono text-gray-500 dark:text-gray-400 italic">Unknown type</code>
                  </div>
                </td>

                <!-- Indexed -->
                <td class="px-3 py-2 whitespace-nowrap">
                  <span v-if="!value.excludeFromIndexes" class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Yes
                  </span>
                  <span v-else class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    No
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <button
                      class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit property"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete property"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Table Footer -->
          <PaginationFooter
            v-model:limit="propertiesPagination.limit.value"
            :current-page="propertiesPagination.currentPage.value"
            :pagination-start="propertiesPaginatedData.paginationStart.value"
            :pagination-end="propertiesPaginatedData.paginationEnd.value"
            :has-more="propertiesPaginatedData.hasMore.value"
            :limit-options="propertiesPagination.defaultLimits"
            @limit-change="propertiesPagination.handleLimitChange"
            @next="propertiesPagination.nextPage"
            @previous="propertiesPagination.previousPage"
          />
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CubeIcon, InboxIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import type { DatastoreEntity, DatastoreValue } from '@/types'
import datastoreApi from '@/api/datastore'
import PaginationFooter from '@/components/ui/PaginationFooter.vue'
import { usePagination, usePaginatedData } from '@/composables/usePagination'

interface Props {
  modelValue: boolean
  entity: DatastoreEntity | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Close',
    handler: handleClose,
    variant: 'secondary'
  }
])

// Properties pagination
const propertiesPagination = usePagination({ initialLimit: 25 })

const propertiesArray = computed(() => {
  if (!props.entity?.properties) return []
  return Object.entries(props.entity.properties)
})

const totalPropertiesCount = computed(() => propertiesArray.value.length)

const propertiesPaginatedData = usePaginatedData(
  {
    items: propertiesArray,
    totalCount: totalPropertiesCount
  },
  propertiesPagination
)

const paginatedProperties = computed(() => {
  return Object.fromEntries(propertiesPaginatedData.paginatedItems.value)
})

const getEntityKind = (entity: DatastoreEntity): string => {
  return datastoreApi.getKeyKind(entity.key) || 'unknown'
}

const getEntityId = (entity: DatastoreEntity): string => {
  return datastoreApi.getKeyId(entity.key) || 'unknown'
}

const getEntityParent = (entity: DatastoreEntity): string | null => {
  if (!entity.key?.path || entity.key.path.length <= 1) {
    return null
  }

  const parentPath = entity.key.path.slice(0, -1)
  return parentPath.map(element => {
    const id = element.name || element.id || ''
    return `${element.kind}:${id}`
  }).join('/')
}

const getKeyLiteral = (entity: DatastoreEntity): string => {
  if (!entity.key?.path) return ''

  const parts = entity.key.path.map(element => {
    const id = element.name ? `'${element.name}'` : element.id || ''
    return `${element.kind}(${id})`
  })

  return `Key(${parts.join(', ')})`
}

const getUrlSafeKey = (entity: DatastoreEntity): string => {
  if (!entity.key) return ''

  try {
    // Encode the key path as base64 URL-safe string
    const keyString = JSON.stringify(entity.key)
    return btoa(keyString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  } catch (e) {
    return '[Encoding failed]'
  }
}

const getPropertyType = (value: DatastoreValue): string => {
  if (value.stringValue !== undefined) return 'STRING'
  if (value.integerValue !== undefined) return 'INTEGER'
  if (value.doubleValue !== undefined) return 'DOUBLE'
  if (value.booleanValue !== undefined) return 'BOOLEAN'
  if (value.timestampValue !== undefined) return 'TIMESTAMP'
  if (value.nullValue !== undefined) return 'NULL'
  if (value.arrayValue) return 'ARRAY'
  if (value.entityValue) return 'ENTITY'
  if (value.keyValue) return 'KEY'
  if (value.blobValue !== undefined) return 'BLOB'
  if (value.geoPointValue) return 'GEOPOINT'
  return 'UNKNOWN'
}

const formatArrayValue = (arrayValue: { values: DatastoreValue[] }): string => {
  try {
    const values = arrayValue.values?.map((v: DatastoreValue) => {
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
    return JSON.stringify(values, null, 2)
  } catch (e) {
    return '[Error formatting array]'
  }
}

const formatEntityValue = (entityValue: any): string => {
  try {
    return JSON.stringify(convertEntityToObject(entityValue), null, 2)
  } catch (e) {
    return '[Error formatting entity]'
  }
}

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

const handleClose = () => {
  modelValue.value = false
  emit('close')
}
</script>
