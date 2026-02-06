<template>
  <div
    class="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="GCP Emulator UI" />
        <h1 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">GCP Emulator UI</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your Google Cloud Emulator resources
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Authentication layout for login/signup pages
</script>

<style scoped>
/* Any specific auth layout styles */
</style>
