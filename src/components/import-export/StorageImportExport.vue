<template>
  <div class="space-y-6">
    <!-- Export Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg theme-transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition-colors">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Export Storage Configuration
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Export all your current bucket configurations to JSON files
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <!-- Export Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="handleExportConfiguration"
              :disabled="isExporting"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon v-if="!isExporting" class="h-4 w-4 mr-2" />
              <ArrowPathIcon v-else class="h-4 w-4 mr-2 animate-spin" />
              {{ isExporting ? 'Exporting...' : 'Export Bucket Configurations' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Section -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
          Import Storage Data
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Import bucket configurations from JSON files
        </p>
      </div>
      <div class="p-6">
        <div class="space-y-6">
          <!-- Generic Import Component -->
          <ImportComponent
            :import-type="'storage'"
            :is-importing="isImporting"
            @import="handleImport"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useStorageImportExport } from '@/composables/useStorageImportExport'
import { useServiceConnections } from '@/composables/useServiceConnections'
import ImportComponent from '@/components/import-export/ImportComponent.vue'

const props = defineProps<{
  projectId: string
}>()

const { checkStorageConnection } = useServiceConnections()
const { isExporting, isImporting, loadData, exportConfiguration, importConfiguration } =
  useStorageImportExport()

const handleExportConfiguration = async () => {
  await loadData()
  await exportConfiguration(props.projectId)
}

const handleImport = async (data: { importData: any[]; options: any }) => {
  await importConfiguration(data.importData, data.options)
}

onMounted(async () => {
  const isConnected = await checkStorageConnection()
  if (isConnected) {
    await loadData()
  }
})
</script>
