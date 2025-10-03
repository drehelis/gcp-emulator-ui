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

          <!-- Kind -->
          <div class="flex items-baseline hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
            <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs w-24 flex-shrink-0">Kind:</span>
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
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Properties</h3>

        <div v-if="!entity.properties || Object.keys(entity.properties).length === 0" class="text-center py-8">
          <InboxIcon class="mx-auto w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">No properties</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(value, key) in entity.properties"
            :key="key"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-900 dark:text-white font-mono">
                    {{ key }}
                  </label>
                  <span class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {{ getPropertyType(value) }}
                  </span>
                  <span v-if="value.excludeFromIndexes" class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Not indexed
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-2">
              <!-- String value -->
              <div v-if="value.stringValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                {{ value.stringValue }}
              </div>

              <!-- Integer value -->
              <div v-else-if="value.integerValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                {{ value.integerValue }}
              </div>

              <!-- Double value -->
              <div v-else-if="value.doubleValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                {{ value.doubleValue }}
              </div>

              <!-- Boolean value -->
              <div v-else-if="value.booleanValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                {{ value.booleanValue }}
              </div>

              <!-- Timestamp value -->
              <div v-else-if="value.timestampValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                {{ value.timestampValue }}
              </div>

              <!-- Null value -->
              <div v-else-if="value.nullValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-500 dark:text-gray-400 font-mono italic">
                null
              </div>

              <!-- Array value -->
              <div v-else-if="value.arrayValue" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                <pre class="whitespace-pre-wrap break-all">{{ formatArrayValue(value.arrayValue) }}</pre>
              </div>

              <!-- Entity value (nested) -->
              <div v-else-if="value.entityValue" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                <pre class="whitespace-pre-wrap break-all">{{ formatEntityValue(value.entityValue) }}</pre>
              </div>

              <!-- Key value -->
              <div v-else-if="value.keyValue" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                <pre class="whitespace-pre-wrap break-all">{{ JSON.stringify(value.keyValue, null, 2) }}</pre>
              </div>

              <!-- Blob value -->
              <div v-else-if="value.blobValue !== undefined" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                {{ value.blobValue }}
              </div>

              <!-- GeoPoint value -->
              <div v-else-if="value.geoPointValue" class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-gray-100 font-mono">
                {{ value.geoPointValue.latitude }}, {{ value.geoPointValue.longitude }}
              </div>

              <!-- Unknown type -->
              <div v-else class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-500 dark:text-gray-400 font-mono italic">
                Unknown type
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CubeIcon, InboxIcon } from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import type { DatastoreEntity, DatastoreValue } from '@/types'
import datastoreApi from '@/api/datastore'

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
