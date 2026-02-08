<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Select a project to manage its services</p>
      </div>

      <!-- Loading state -->
      <div v-if="projectsStore.isLoading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4"
          >
            <svg
              class="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400 font-medium">Loading projects...</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="projectsStore.hasError"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load projects
            </h3>
            <p v-if="projectsStore.state.error" class="text-red-600 dark:text-red-300 text-sm mt-1">
              {{ projectsStore.state.error }}
            </p>
            <button
              @click="loadProjects"
              class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="projectsStore.projectList.length === 0"
        class="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2m0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No projects available
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select a project to get started managing your GCP emulator services
        </p>
      </div>

      <!-- Projects list -->
      <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Available Projects</h2>
        </div>

        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          <li
            v-for="projectId in projectsStore.projectList"
            :key="projectId"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <router-link
              :to="{ name: 'project-services', params: { projectId } }"
              @click="() => projectsStore.selectProject(projectId)"
              class="flex items-center justify-between px-6 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 block"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ projectId }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Click to manage services</p>
                </div>
              </div>
              <svg
                class="w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'

const projectsStore = useProjectsStore()

async function loadProjects() {
  try {
    await projectsStore.fetchProjects()
  } catch (err) {
    console.error('Failed to load projects:', err)
  }
}

onMounted(loadProjects)
</script>
