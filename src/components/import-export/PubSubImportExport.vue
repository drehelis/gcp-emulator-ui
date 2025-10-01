<template>
  <div class="space-y-6">
    <!-- Export Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Export Pub/Sub Configuration
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Export all your current topics, subscriptions, and message templates to JSON files
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <!-- Export Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="handleExportConfiguration"
              :disabled="isExporting.pubsub"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExporting.pubsub" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExporting.pubsub ? 'Exporting...' : 'Export Topics & Subscriptions' }}
            </button>
            <button
              @click="handleExportTemplates"
              :disabled="isExporting.templates"
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExporting.templates" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExporting.templates ? 'Exporting...' : 'Export Message Templates' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Import Pub/Sub Data
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Import topics, subscriptions, or message templates from JSON files
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-6">
          <!-- Import Type Selection -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What would you like to import?
            </label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="import-pubsub-config"
                  v-model="importType"
                  value="config"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label for="import-pubsub-config" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                  Topics & Subscriptions
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="import-pubsub-templates"
                  v-model="importType"
                  value="templates"
                  type="radio"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <label for="import-pubsub-templates" class="ml-2 block text-xs sm:text-sm text-gray-900 dark:text-white">
                  Message Templates
                </label>
              </div>
            </div>
          </div>

          <!-- Generic Import Component -->
          <ImportComponent
            :import-type="importType"
            :is-importing="isImporting.pubsub || isImporting.templates"
            @import="handleImport"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { usePubSubImportExport } from '@/composables/usePubSubImportExport'
import { useServiceConnections } from '@/composables/useServiceConnections'
import ImportComponent from '@/components/import-export/ImportComponent.vue'

const props = defineProps<{
  projectId: string
}>()

const { checkPubSubConnection } = useServiceConnections()
const {
  isExporting,
  isImporting,
  loadData,
  exportConfiguration,
  exportTemplates,
  importConfiguration,
  importTemplates
} = usePubSubImportExport()

const importType = ref<'config' | 'templates'>('config')

const handleExportConfiguration = async () => {
  await loadData(props.projectId)
  await exportConfiguration(props.projectId)
}

const handleExportTemplates = async () => {
  await exportTemplates(props.projectId)
}

const handleImport = async (data: { importData: any[], options: any }) => {
  if (importType.value === 'templates') {
    await importTemplates(props.projectId, data.importData, data.options)
  } else {
    await importConfiguration(props.projectId, data.importData, data.options)
  }
}

onMounted(async () => {
  const isConnected = await checkPubSubConnection()
  if (isConnected) {
    await loadData(props.projectId)
  }
})
</script>
