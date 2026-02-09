<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <!-- Navigation and Title -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets`"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon class="w-5 h-5" />
              </router-link>

              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <ArchiveBoxIcon
                    class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
                  />
                  <h1 class="text-sm sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {{ bucketName }}
                  </h1>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="refreshObjects"
                :disabled="storageStore.loading.objects"
                class="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon
                  :class="[
                    'w-4 h-4',
                    storageStore.loading.objects ? 'animate-spin' : '',
                    'sm:mr-2',
                  ]"
                />
                <span class="hidden sm:inline">Refresh</span>
              </button>

              <button
                @click="showUploadModal = true"
                class="inline-flex items-center px-2 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <ArrowUpTrayIcon class="w-4 h-4 sm:mr-2" />
                <span class="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-4 sm:px-6 lg:px-8 py-6">
      <!-- Breadcrumbs -->
      <nav class="mb-6 flex items-center justify-between" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <!-- Always show Home icon -->
          <li>
            <button
              @click="navigateToPath('')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <HomeIcon class="w-4 h-4 translate-y-0.5" />
              <span class="sr-only">Home</span>
            </button>
          </li>

          <!-- Show folder breadcrumbs only when in subfolders -->
          <template v-if="storageStore.breadcrumbs.length > 0">
            <li
              v-for="(breadcrumb, index) in storageStore.breadcrumbs"
              :key="index"
              class="flex items-baseline"
            >
              <ChevronRightIcon class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
              <button
                v-if="!breadcrumb.isLast"
                @click="navigateToPath(breadcrumb.path)"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate transition-colors"
              >
                {{ breadcrumb.name }}
              </button>
              <span v-else class="text-gray-500 dark:text-gray-400 truncate">
                {{ breadcrumb.name }}
              </span>
            </li>
          </template>
        </ol>

        <!-- Selection actions -->
        <div
          v-if="storageStore.selectedObjects.length > 0 || downloadingZip"
          class="flex items-center space-x-2"
        >
          <button
            @click="downloadSelectedAsZip"
            :disabled="downloadingZip"
            class="inline-flex items-center px-1 sm:px-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon
              :class="['w-3 h-3 sm:w-4 sm:h-4 sm:mr-1', downloadingZip ? 'animate-pulse' : '']"
            />
            <span class="hidden sm:inline">{{
              downloadingZip
                ? (downloadContext?.count || storageStore.selectedObjects.length) === 1
                  ? 'Downloading...'
                  : 'Creating ZIP...'
                : `Download (${downloadContext?.count || storageStore.selectedObjects.length})`
            }}</span>
          </button>
          <button
            v-if="storageStore.selectedObjects.length === 1 && !downloadingZip"
            @click="copyLinkToClipboard"
            class="inline-flex items-center px-1 sm:px-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded focus:outline-none transition-colors"
            title="Copy link to file"
          >
            <LinkIcon class="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span class="hidden sm:inline">Copy Link</span>
          </button>
          <button
            @click="confirmBulkDelete"
            :disabled="storageStore.loading.delete"
            class="inline-flex items-center px-1 sm:px-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TrashIcon class="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span class="hidden sm:inline">Delete</span>
          </button>
          <button
            @click="storageStore.clearSelection"
            :disabled="downloadingZip"
            class="inline-flex items-center px-1 sm:px-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XMarkIcon class="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span class="hidden sm:inline">Clear</span>
          </button>
        </div>
      </nav>

      <!-- Loading State -->
      <div
        v-if="storageStore.loading.objects && !storageStore.objects.length"
        class="text-center py-12"
      >
        <div
          class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600 dark:text-blue-400 transition"
        >
          <ArrowPathIcon class="animate-spin -ml-1 mr-3 h-5 w-5" />
          Loading objects...
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="storageStore.hasError" class="text-center py-12">
        <div
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto"
        >
          <ExclamationTriangleIcon class="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Error Loading Objects
          </h3>
          <p class="text-red-700 dark:text-red-300 mb-4">
            {{ storageStore.state.error }}
          </p>
          <button
            @click="refreshObjects"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>

      <!-- Empty State with Drag & Drop -->
      <div v-else-if="!storageStore.objects.length" class="text-center py-12">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 max-w-2xl mx-auto transition-colors"
          :class="{
            'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10': isDragOver,
          }"
          @dragover.prevent="handleDragOver"
          @dragenter.prevent="handleDragEnter"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <!-- Upload Icon -->
          <div
            class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto"
          >
            <ArrowUpTrayIcon
              v-if="!storageStore.loading.upload"
              class="w-8 h-8 text-blue-600 dark:text-blue-400"
            />
            <ArrowPathIcon v-else class="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>

          <!-- Upload Text -->
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            <span v-if="!storageStore.loading.upload">No Objects Found</span>
            <span v-else>Uploading Files...</span>
          </h3>

          <p
            v-if="!storageStore.loading.upload"
            class="text-gray-600 dark:text-gray-400 text-sm mb-6"
          >
            <span v-if="!isDragOver">
              This {{ currentPath ? 'folder' : 'bucket' }} is empty.
              <strong>Drag and drop files here</strong> or click to upload.
            </span>
            <span v-else class="text-blue-600 dark:text-blue-400 font-medium">
              Drop files here to upload
            </span>
          </p>

          <!-- Upload Progress -->
          <div
            v-if="storageStore.loading.upload && storageStore.uploadProgress.length > 0"
            class="mb-6"
          >
            <div class="space-y-2">
              <div
                v-for="progress in storageStore.uploadProgress"
                :key="progress.file.name"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-gray-600 dark:text-gray-400 truncate mr-4">{{
                  progress.file.name
                }}</span>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      class="bg-blue-600 h-1.5 rounded-full transition-all"
                      :style="{ width: `${progress.percentage}%` }"
                    ></div>
                  </div>
                  <span class="text-gray-500 dark:text-gray-400 w-8 text-right"
                    >{{ progress.percentage }}%</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Buttons -->
          <div
            v-if="!storageStore.loading.upload"
            class="flex flex-col items-center justify-center"
          >
            <div class="flex flex-col sm:flex-row gap-3 items-center justify-center mb-3">
              <button
                @click="showCreateFolderModal = true"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <FolderPlusIcon class="w-4 h-4 mr-2" />
                Create Folder
              </button>
              <button
                @click="showCreateFileModal = true"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <DocumentTextIcon class="w-4 h-4 mr-2" />
                Create File
              </button>
              <button
                @click="triggerFileInput"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
                Choose Files
              </button>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                or drag and drop files here
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Multiple files supported • Max 100MB per file
              </div>
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInput"
            type="file"
            multiple
            class="hidden"
            @change="handleFileSelect"
            accept="*/*"
          />
        </div>
      </div>

      <!-- Objects List View -->
      <div
        v-else-if="storageStore.viewMode === 'list'"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full">
            <thead
              class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
            >
              <tr>
                <th class="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    :checked="allObjectsSelected"
                    :indeterminate="someObjectsSelected"
                    @change="toggleSelectAll"
                    class="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
                <th scope="col" class="px-3 py-2 text-left">
                  <button
                    @click="handleSort('name')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Name
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'name' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="
                        storageStore.sortBy === 'name' && storageStore.sortOrder === 'desc'
                      "
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-24">
                  <button
                    @click="handleSort('size')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Size
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'size' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="
                        storageStore.sortBy === 'size' && storageStore.sortOrder === 'desc'
                      "
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-32">
                  <button
                    @click="handleSort('type')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Type
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'type' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="
                        storageStore.sortBy === 'type' && storageStore.sortOrder === 'desc'
                      "
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-36">
                  <button
                    @click="handleSort('modified')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Modified
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'modified' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="
                        storageStore.sortBy === 'modified' && storageStore.sortOrder === 'desc'
                      "
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="w-16 px-3 py-2"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800">
              <tr
                v-for="(object, index) in storageStore.objects"
                :key="object.name"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                :class="[
                  {
                    'bg-blue-50 dark:bg-blue-900/20': storageStore.selectedObjects.includes(
                      object.fullPath || object.name
                    ),
                  },
                  index !== storageStore.objects.length - 1
                    ? 'border-b border-gray-100 dark:border-gray-700/50'
                    : '',
                ]"
                @click="handleObjectClick(object)"
              >
                <td class="px-3 py-1.5">
                  <input
                    v-if="!object.isFolder"
                    type="checkbox"
                    :checked="storageStore.selectedObjects.includes(object.fullPath || object.name)"
                    @click.stop="storageStore.selectObject(object.fullPath || object.name)"
                    @change="() => {}"
                    class="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <input
                    v-else
                    type="checkbox"
                    :checked="storageStore.selectedObjects.includes(object.fullPath || object.name)"
                    @click.stop="storageStore.selectObject(object.fullPath || object.name)"
                    @change="() => {}"
                    class="w-3.5 h-3.5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                </td>
                <td class="px-3 py-1.5">
                  <div class="flex items-center min-w-0">
                    <FolderIcon
                      v-if="object.isFolder"
                      class="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0"
                    />
                    <DocumentIcon
                      v-else
                      class="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0"
                    />
                    <span
                      class="text-xs font-medium text-gray-900 dark:text-white truncate"
                      :title="object.isFolder ? object.name : getFileName(object.name)"
                    >
                      {{ object.isFolder ? object.name : getFileName(object.name) }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ object.isFolder ? '—' : formatFileSize(parseInt(object.size || '0')) }}
                </td>
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span
                    class="truncate"
                    :title="object.isFolder ? 'Folder' : object.contentType || 'Unknown'"
                  >
                    {{ object.isFolder ? 'Folder' : object.contentType || 'Unknown' }}
                  </span>
                </td>
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ object.isFolder ? '—' : formatDate(object.updated || object.timeCreated) }}
                </td>
                <td class="px-3 py-1.5 text-right">
                  <button
                    v-if="!object.isFolder"
                    @click.stop="downloadObject(object)"
                    :disabled="storageStore.loading.download"
                    class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    ↓
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden">
          <!-- Mobile Header with Sort -->
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <input
                  type="checkbox"
                  :checked="allObjectsSelected"
                  :indeterminate="someObjectsSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ storageStore.selectedObjects.length }} selected
                </span>
              </div>
              <select
                @change="handleMobileSortChange"
                class="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-asc">Size (Small)</option>
                <option value="size-desc">Size (Large)</option>
                <option value="modified-desc">Modified (Newest)</option>
                <option value="modified-asc">Modified (Oldest)</option>
              </select>
            </div>
          </div>

          <!-- Mobile Objects List -->
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="object in storageStore.objects"
              :key="object.name"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20': storageStore.selectedObjects.includes(
                  object.fullPath || object.name
                ),
              }"
              @click="handleObjectClick(object)"
            >
              <div class="flex items-start space-x-3">
                <input
                  v-if="!object.isFolder"
                  type="checkbox"
                  :checked="storageStore.selectedObjects.includes(object.fullPath || object.name)"
                  @click.stop="storageStore.selectObject(object.fullPath || object.name)"
                  @change="() => {}"
                  class="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  v-else
                  type="checkbox"
                  :checked="storageStore.selectedObjects.includes(object.fullPath || object.name)"
                  @click.stop="storageStore.selectObject(object.fullPath || object.name)"
                  @change="() => {}"
                  class="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                />

                <FolderIcon
                  v-if="object.isFolder"
                  class="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
                />
                <DocumentIcon
                  v-else
                  class="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0"
                />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ object.isFolder ? object.name : getFileName(object.name) }}
                    </h4>
                    <button
                      v-if="!object.isFolder"
                      @click.stop="downloadObject(object)"
                      :disabled="storageStore.loading.download"
                      class="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDownTrayIcon class="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    class="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                  >
                    <div class="flex items-center space-x-4">
                      <span v-if="!object.isFolder">
                        {{ formatFileSize(parseInt(object.size || '0')) }}
                      </span>
                      <span v-if="!object.isFolder" class="truncate max-w-24">
                        {{ object.contentType || 'Unknown' }}
                      </span>
                    </div>
                    <span v-if="!object.isFolder" class="whitespace-nowrap">
                      {{ formatDate(object.updated || object.timeCreated) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Objects Grid View -->
      <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <div
          v-for="object in storageStore.objects"
          :key="object.name"
          class="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/10 transition-all cursor-pointer"
          :class="{
            'ring-2 ring-blue-500 dark:ring-blue-400': storageStore.selectedObjects.includes(
              object.fullPath || object.name
            ),
          }"
          @click="handleObjectClick(object)"
        >
          <!-- Selection checkbox -->
          <div
            v-if="!object.isFolder"
            class="absolute top-2 left-2 transition-opacity"
            :class="[
              storageStore.selectedObjects.includes(object.fullPath || object.name)
                ? 'opacity-100'
                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            ]"
          >
            <input
              type="checkbox"
              :checked="storageStore.selectedObjects.includes(object.fullPath || object.name)"
              @click.stop="storageStore.selectObject(object.fullPath || object.name)"
              @change="() => {}"
              class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <!-- Folder checkbox -->
          <div
            v-else
            class="absolute top-2 left-2 transition-opacity"
            :class="[
              storageStore.selectedObjects.includes(object.fullPath || object.name)
                ? 'opacity-100'
                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            ]"
          >
            <input
              type="checkbox"
              :checked="storageStore.selectedObjects.includes(object.fullPath || object.name)"
              @click.stop="storageStore.selectObject(object.fullPath || object.name)"
              @change="() => {}"
              class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <!-- Object icon/preview -->
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 mb-2 flex items-center justify-center">
              <img
                v-if="object.preview && object.contentType?.startsWith('image/')"
                :src="object.preview"
                :alt="object.name"
                class="w-12 h-12 object-cover rounded"
                @error="$event.target.style.display = 'none'"
              />
              <FolderIcon
                v-else-if="object.isFolder"
                class="w-12 h-12 text-blue-500 dark:text-blue-400"
              />
              <DocumentIcon v-else class="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>

            <p
              class="text-xs font-medium text-gray-900 dark:text-white truncate w-full"
              :title="object.name"
            >
              {{ object.isFolder ? object.name : getFileName(object.name) }}
            </p>

            <p v-if="!object.isFolder" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ formatFileSize(parseInt(object.size || '0')) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Load more button -->
      <div v-if="storageStore.pagination.hasMore" class="text-center mt-6">
        <button
          @click="loadMore"
          :disabled="storageStore.loading.objects"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowPathIcon
            v-if="storageStore.loading.objects"
            class="animate-spin -ml-1 mr-2 h-4 w-4"
          />
          {{ storageStore.loading.objects ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-model="deleteModal.show"
      :title="deleteModal.objects.length === 1 ? 'Delete Object' : 'Delete Objects'"
      :message="`Are you sure you want to delete ${deleteModal.objects.length} object${deleteModal.objects.length === 1 ? '' : 's'}?`"
      :confirm-label="deleteModal.objects.length === 1 ? 'Delete Object' : 'Delete Objects'"
      :is-loading="storageStore.loading.delete"
      :details="{
        title: deleteModal.objects.length === 1 ? 'Object Details' : 'Objects to Delete',
        description:
          deleteModal.objects.length === 1
            ? deleteModal.objects[0]
            : `${deleteModal.objects.length} selected objects`,
      }"
      @confirm="handleBulkDelete"
      @cancel="cancelDelete"
    />

    <!-- Upload Modal -->
    <TransitionRoot as="template" :show="showUploadModal">
      <Dialog as="div" class="relative z-50" @close="handleUploadModalClose">
        <TransitionChild
          as="template"
          enter=""
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave=""
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 backdrop-blur-[2px] bg-white/5 dark:bg-black/5 transition-opacity"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter=""
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave=""
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6"
              >
                <div>
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
                  >
                    <ArrowUpTrayIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="mt-3 text-center sm:mt-5">
                    <DialogTitle
                      as="h3"
                      class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                    >
                      Upload Files
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Upload files to <span class="font-medium">{{ bucketName }}</span
                        >{{ currentPath ? `/${currentPath}` : '' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Upload Area -->
                <div class="mt-6">
                  <div
                    @drop.prevent="handleModalDrop"
                    @dragover.prevent="isDragOver = true"
                    @dragleave.prevent="isDragOver = false"
                    :class="[
                      'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                      isDragOver
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                    ]"
                  >
                    <ArrowUpTrayIcon class="mx-auto h-12 w-12 text-gray-400" />
                    <div class="mt-4">
                      <div class="flex flex-col sm:flex-row gap-3 items-center justify-center">
                        <button
                          @click="openCreateFileFromUpload"
                          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                        >
                          <DocumentTextIcon class="w-4 h-4 mr-2" />
                          Create File
                        </button>
                        <button
                          @click="openCreateFolderFromUpload"
                          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                        >
                          <FolderPlusIcon class="w-4 h-4 mr-2" />
                          Create Folder
                        </button>
                        <label for="upload-files" class="cursor-pointer">
                          <span
                            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                          >
                            <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
                            Choose Files
                          </span>
                          <input
                            id="upload-files"
                            ref="modalFileInput"
                            type="file"
                            multiple
                            class="sr-only"
                            @change="handleModalFileSelect"
                          />
                        </label>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        or drag and drop files here
                      </p>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Multiple files supported • Max 100MB per file
                    </p>
                  </div>
                </div>

                <!-- Selected Files -->
                <div v-if="selectedFiles.length > 0" class="mt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Selected Files ({{ selectedFiles.length }})
                  </h4>
                  <div class="max-h-40 overflow-y-auto">
                    <div
                      v-for="(file, index) in selectedFiles"
                      :key="index"
                      class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2"
                    >
                      <div class="flex items-center space-x-3">
                        <DocumentIcon class="w-4 h-4 text-gray-400" />
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {{ file.name }}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ formatFileSize(file.size) }}
                          </p>
                        </div>
                      </div>
                      <button
                        @click="removeFile(index)"
                        class="text-red-400 hover:text-red-600 p-1"
                      >
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Upload Progress -->
                <div v-if="uploadProgress.length > 0" class="mt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Upload Progress
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="progress in uploadProgress"
                      :key="progress.fileName"
                      class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-sm text-gray-900 dark:text-white">{{
                          progress.fileName
                        }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400"
                          >{{ Math.round(progress.progress * 100) }}%</span
                        >
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          class="bg-blue-600 h-2 rounded-full transition-all"
                          :style="{ width: `${progress.progress * 100}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Actions -->
                <div class="mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    @click="handleUpload"
                    :disabled="selectedFiles.length === 0 || isUploading"
                    class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  >
                    <ArrowPathIcon v-if="isUploading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {{
                      isUploading
                        ? 'Uploading...'
                        : `Upload ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}`
                    }}
                  </button>
                  <button
                    @click="closeUploadModal"
                    :disabled="isUploading"
                    class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
                  >
                    {{ isUploading ? 'Cancel' : 'Close' }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Create File Modal -->
    <TransitionRoot as="template" :show="showCreateFileModal">
      <Dialog as="div" class="relative z-50" @close="showCreateFileModal = false">
        <TransitionChild
          as="template"
          enter=""
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave=""
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 backdrop-blur-[2px] bg-white/5 dark:bg-black/5 transition-opacity"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter=""
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave=""
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6"
              >
                <div>
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
                  >
                    <DocumentTextIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="mt-3 text-center sm:mt-5">
                    <DialogTitle
                      as="h3"
                      class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                    >
                      Create New File
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Create a new file in <span class="font-medium">{{ bucketName }}</span
                        >{{ currentPath ? `/${currentPath}` : '' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- File Details Form -->
                <div class="mt-6">
                  <div class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6 space-y-6">
                    <!-- Filename Input -->
                    <div class="space-y-2">
                      <label
                        for="fileName"
                        class="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        <DocumentTextIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        File Name
                      </label>
                      <div class="relative">
                        <input
                          v-model="fileName"
                          type="text"
                          id="fileName"
                          placeholder="example.json"
                          class="block w-full rounded-lg border-0 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-sm"
                          :class="{
                            'ring-red-500 dark:ring-red-400':
                              createFileValidationError && fileName.trim(),
                            'ring-green-500 dark:ring-green-400':
                              !createFileValidationError && fileName.trim(),
                          }"
                          @input="validateCreateFile"
                        />
                        <div
                          v-if="!createFileValidationError && fileName.trim()"
                          class="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          <svg
                            class="h-4 w-4 text-green-500 dark:text-green-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <!-- Auto-detected Content Type Display -->
                      <div
                        v-if="fileName.trim()"
                        class="flex items-center text-xs text-gray-500 dark:text-gray-400"
                      >
                        <span
                          >{{ getContentTypeLabel(autoDetectedContentType) }} will be
                          auto-detected</span
                        >
                      </div>
                    </div>

                    <!-- Validation Error -->
                    <div
                      v-if="createFileValidationError"
                      class="flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                    >
                      <ExclamationTriangleIcon
                        class="w-5 h-5 mr-2 text-red-600 dark:text-red-400"
                      />
                      <span class="text-sm font-medium text-red-700 dark:text-red-300">{{
                        createFileValidationError
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Content Editor -->
                <div class="mt-6">
                  <label
                    for="fileContent"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    File Content
                  </label>
                  <div
                    class="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div class="flex">
                      <!-- Line Numbers -->
                      <div
                        class="bg-gray-100 dark:bg-gray-800 px-3 py-4 border-r border-gray-200 dark:border-gray-700 select-none"
                      >
                        <div class="text-xs font-mono text-gray-500 dark:text-gray-400 leading-6">
                          <div
                            v-for="lineNum in Math.max(1, fileContent.split('\n').length)"
                            :key="lineNum"
                            class="h-6 text-right"
                          >
                            {{ lineNum }}
                          </div>
                        </div>
                      </div>
                      <!-- Editor Area -->
                      <div class="flex-1">
                        <textarea
                          v-model="fileContent"
                          @input="validateCreateFile"
                          class="w-full h-80 p-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-0 resize-none font-mono focus:outline-none leading-6"
                          :class="{ 'bg-red-50 dark:bg-red-900/10': createFileValidationError }"
                          placeholder="Enter your file content here..."
                          spellcheck="false"
                          style="line-height: 1.5rem"
                        ></textarea>
                      </div>
                    </div>

                    <!-- Status Bar -->
                    <div
                      class="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div
                        class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400"
                      >
                        <div class="flex items-center space-x-4">
                          <span>Lines: {{ Math.max(1, fileContent.split('\n').length) }}</span>
                          <span>Characters: {{ fileContent.length }}</span>
                          <span
                            >Type: {{ getFileExtension(fileName).toUpperCase() || 'Text' }}</span
                          >
                        </div>
                        <div class="flex items-center space-x-2">
                          <span
                            v-if="!createFileValidationError && fileContent.trim()"
                            class="text-green-600 dark:text-green-400"
                            >✓ Valid</span
                          >
                          <span
                            v-else-if="createFileValidationError"
                            class="text-red-600 dark:text-red-400"
                            >✗ Invalid</span
                          >
                          <span class="text-gray-500">{{ autoDetectedContentType }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Actions -->
                <div class="mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    @click="handleCreateFile"
                    :disabled="!fileName.trim() || isCreatingFile || !!createFileValidationError"
                    class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  >
                    <ArrowPathIcon v-if="isCreatingFile" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {{ isCreatingFile ? 'Creating...' : 'Create File' }}
                  </button>
                  <button
                    @click="closeCreateFileModal"
                    :disabled="isCreatingFile"
                    class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Create Folder Modal -->
    <TransitionRoot as="template" :show="showCreateFolderModal">
      <Dialog as="div" class="relative z-50" @close="showCreateFolderModal = false">
        <TransitionChild
          as="template"
          enter=""
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave=""
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 backdrop-blur-[2px] bg-white/5 dark:bg-black/5 transition-opacity"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter=""
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave=""
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
              >
                <div class="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div
                      class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10"
                    >
                      <FolderPlusIcon
                        class="h-6 w-6 text-blue-600 dark:text-blue-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <DialogTitle
                        as="h3"
                        class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
                      >
                        Create New Folder
                      </DialogTitle>
                      <div class="mt-4">
                        <div>
                          <label
                            for="folder-name"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            Folder Name
                          </label>
                          <input
                            id="folder-name"
                            v-model="folderName"
                            type="text"
                            placeholder="Enter folder name..."
                            class="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-colors text-sm"
                            :class="{
                              'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400':
                                createFolderValidationError,
                              'focus:ring-blue-500 dark:focus:ring-blue-400':
                                !createFolderValidationError,
                            }"
                            @input="createFolderValidationError = ''"
                          />
                          <div
                            v-if="createFolderValidationError"
                            class="mt-2 flex items-center text-sm text-red-600 dark:text-red-400"
                          >
                            <svg
                              class="w-4 h-4 mr-1 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            {{ createFolderValidationError }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6"
                >
                  <button
                    type="button"
                    @click="handleCreateFolder"
                    :disabled="!folderName.trim() || storageStore.loading.upload"
                    class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                  >
                    <ArrowPathIcon
                      v-if="storageStore.loading.upload"
                      class="w-4 h-4 mr-2 animate-spin"
                    />
                    <FolderPlusIcon v-else class="w-4 h-4 mr-2" />
                    {{ storageStore.loading.upload ? 'Creating...' : 'Create Folder' }}
                  </button>
                  <button
                    type="button"
                    @click="closeCreateFolderModal"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// TypeScript declarations for webkit File System API
declare global {
  interface DataTransferItem {
    webkitGetAsEntry(): FileSystemEntry | null
  }

  interface FileSystemEntry {
    isFile: boolean
    isDirectory: boolean
    name: string
  }

  interface FileSystemFileEntry extends FileSystemEntry {
    file(): void
  }

  interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader(): FileSystemDirectoryReader
  }

  interface FileSystemDirectoryReader {
    readEntries(): void
  }

  interface HTMLSelectElement extends HTMLElement {
    value: string
  }

  interface Node {
    contains(): boolean
  }

  interface DataTransferItemList {
    length: number
  }

  interface FileList {
    length: number
  }

  interface DataTransfer {
    items: DataTransferItemList
    files: FileList
  }

  interface Window {
    DOMParser: {
      new (): {
        parseFromString(): {
          getElementsByTagName(): {
            length: number
          }
        }
      }
    }
  }
}
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  HomeIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderPlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'
import storageApi from '@/api/storage'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import type { StorageObjectWithPreview } from '@/types'

const router = useRouter()
const route = useRoute()
const storageStore = useStorageStore()
const projectsStore = useProjectsStore()

// Local state
const deleteModal = ref<{
  show: boolean
  objects: string[]
}>({
  show: false,
  objects: [],
})

// Drag and drop state
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const showUploadModal = ref(false)
const showCreateFileModal = ref(false)
const showCreateFolderModal = ref(false)
const downloadingZip = ref(false)
const downloadContext = ref<{ count: number; objects: string[] } | null>(null)

// Upload modal state
const selectedFiles = ref<File[]>([])
const modalFileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref<Array<{ fileName: string; progress: number }>>([])
const appStore = useAppStore()

// Create file modal state
const fileName = ref('')
const fileContent = ref('')
const isCreatingFile = ref(false)
const createFileValidationError = ref('')

// Create folder modal state
const folderName = ref('')
const createFolderValidationError = ref('')

// Props from route
const bucketName = computed(() => decodeURIComponent(route.params.bucketName as string))
const currentProjectId = computed(
  () => (route.params.projectId as string) || projectsStore.selectedProjectId || 'Unknown'
)
const currentPath = computed(() => storageStore.currentPath)

// Computed
const allObjectsSelected = computed(() => {
  return (
    storageStore.objects.length > 0 &&
    storageStore.objects.every(obj =>
      storageStore.selectedObjects.includes(obj.fullPath || obj.name)
    )
  )
})

const someObjectsSelected = computed(() => {
  return (
    storageStore.selectedObjects.length > 0 &&
    storageStore.selectedObjects.length < storageStore.objects.length
  )
})

// Auto-detect content type from file extension
const autoDetectedContentType = computed(() => {
  if (!fileName.value.trim()) return 'text/plain'
  return getContentTypeFromExtension(fileName.value)
})

// Methods
async function refreshObjects(): Promise<void> {
  await storageStore.fetchObjects(bucketName.value, currentPath.value, true)
}

async function copyLinkToClipboard(): Promise<void> {
  const selectedObjects = [...storageStore.selectedObjects]
  if (selectedObjects.length !== 1) return

  const objectName = selectedObjects[0]

  // Check if it's a folder (folders end with /)
  const isFolder = objectName.endsWith('/')

  let urlToCopy = ''

  if (isFolder) {
    // Generate deep link to folder
    const baseUrl = window.location.origin
    const projectPart = `/projects/${currentProjectId.value}`
    const bucketPart = `/storage/buckets/${bucketName.value}`
    // We need to encode the path parameter
    const queryPart = `?path=${encodeURIComponent(objectName)}&download=true`

    urlToCopy = `${baseUrl}${projectPart}${bucketPart}${queryPart}`
  } else {
    // Use existing download URL for files
    urlToCopy = storageApi.getObjectDownloadUrl(bucketName.value, objectName)
  }

  try {
    await navigator.clipboard.writeText(urlToCopy)
    appStore.showToast({
      type: 'success',
      title: 'Link Copied',
      message: isFolder ? 'Folder link copied to clipboard' : 'Download link copied to clipboard',
    })
  } catch (error: any) {
    console.error('Failed to copy link:', error)
    appStore.showToast({
      type: 'error',
      title: 'Copy Failed',
      message: 'Failed to copy link to clipboard',
    })
  }
}

async function downloadSelectedAsZip(): Promise<void> {
  await downloadItemsAsZip([...storageStore.selectedObjects])
}

async function downloadItemsAsZip(items: string[]): Promise<void> {
  if (items.length === 0) return

  try {
    downloadingZip.value = true
    downloadContext.value = { count: items.length, objects: items }

    // Add a small delay to ensure loading state is visible
    await new Promise(resolve => setTimeout(resolve, 500))

    // Expand non-folders and folders
    const filesToDownload: string[] = []

    // Helper to list all files recursively in a folder
    const listAllFiles = async (prefix: string): Promise<string[]> => {
      const allFiles: string[] = []
      let pageToken: string | undefined = undefined

      do {
        const response = await storageApi.listObjects({
          bucket: bucketName.value,
          prefix: prefix,
          // No delimiter means recursive listing
          maxResults: 1000,
          pageToken,
        })

        if (response.items) {
          // Add files, ignore the folder placeholder itself if it exists (0-byte object ending in /)
          const fileNames = response.items
            .filter(item => !item.name.endsWith('/'))
            .map(item => item.name)
          allFiles.push(...fileNames)
        }

        pageToken = response.nextPageToken
      } while (pageToken)

      return allFiles
    }

    // Process all items
    for (const item of items) {
      // Check if it's a folder in the current view
      // We need to look up in the store because items only has the identifier
      const obj = storageStore.objects.find(o => (o.fullPath || o.name) === item)

      if (obj && obj.isFolder) {
        // It is a folder, fetch all contents recursively
        // Use fullPath which includes the trailing slash
        const folderPath = obj.fullPath || obj.name
        const folderFiles = await listAllFiles(folderPath)
        filesToDownload.push(...folderFiles)
      } else {
        // It's a file (or we can't find it, assume file)
        // Check if it ends in / just in case
        if (item.endsWith('/')) {
          const folderFiles = await listAllFiles(item)
          filesToDownload.push(...folderFiles)
        } else {
          filesToDownload.push(item)
        }
      }
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(filesToDownload)]

    if (uniqueFiles.length === 0) {
      appStore.showToast({
        type: 'warning',
        title: 'No Files',
        message: 'No actual files found to download.',
      })
      return
    }

    if (uniqueFiles.length === 1) {
      // Single file - download directly without zipping
      const objectName = uniqueFiles[0]
      const blob = await storageApi.downloadObject({
        bucket: bucketName.value,
        object: objectName,
      })

      // Create download link and trigger download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = objectName.split('/').pop() || objectName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      appStore.showToast({
        type: 'success',
        title: 'Download Complete',
        message: `Successfully downloaded "${objectName}"`,
      })
    } else {
      // Multiple files - create ZIP
      const fileName = `${bucketName.value}-selected-${uniqueFiles.length}-files.zip`
      const zipBlob = await storageApi.downloadObjectsAsZip(bucketName.value, uniqueFiles)

      // Create download link and trigger download
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      appStore.showToast({
        type: 'success',
        title: 'Download Complete',
        message: `Successfully downloaded ${uniqueFiles.length} files`,
      })
    }
  } catch (error: any) {
    console.error('Failed to download selected files:', error)
    appStore.showToast({
      type: 'error',
      title: 'Download Failed',
      message: error.message || 'Failed to download file(s)',
    })
  } finally {
    downloadingZip.value = false
    downloadContext.value = null
    // Clear selection after download completes (success or failure)
    storageStore.clearSelection()
  }
}

function handleSort(field: 'name' | 'size' | 'type' | 'modified'): void {
  // Map field names to storage store sort fields
  const sortFieldMap: Record<string, 'name' | 'size' | 'modified'> = {
    name: 'name',
    size: 'size',
    type: 'name', // For now, sort by name for type column
    modified: 'modified',
  }

  const storeField = sortFieldMap[field]
  storageStore.setSortBy(storeField)
}

function handleMobileSortChange(event: Event): void {
  const target = event.target as any
  const [field, order] = target.value.split('-')

  const sortFieldMap: Record<string, 'name' | 'size' | 'modified'> = {
    name: 'name',
    size: 'size',
    modified: 'modified',
  }

  const storeField = sortFieldMap[field] || 'name'
  storageStore.setSortBy(storeField, order as 'asc' | 'desc')
}

async function loadMore(): Promise<void> {
  await storageStore.fetchObjects(bucketName.value, currentPath.value, false)
}

function navigateToPath(path: string): void {
  storageStore.clearSelection()
  storageStore.fetchObjects(bucketName.value, path, true)

  // Update URL query parameter
  router.push({
    query: {
      ...route.query,
      path: path || undefined,
    },
  })
}

function handleObjectClick(object: StorageObjectWithPreview): void {
  if (object.isFolder) {
    // Prefer fullPath which includes the trailing slash
    if (object.fullPath) {
      navigateToPath(object.fullPath)
      return
    }

    // Fallback: manually construct path ensuring trailing slash
    // object.name is relative name without slash
    const folderName = object.name
    const parentPath = currentPath.value || ''
    const newPath = `${parentPath}${folderName}/`
    navigateToPath(newPath)
  } else {
    // Navigate to object details using fullPath if available, otherwise use name
    const objectPath = encodeURIComponent(object.fullPath || object.name)
    router.push(
      `/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName.value)}/objects/${objectPath}`
    )
  }
}

function toggleSelectAll(): void {
  if (allObjectsSelected.value) {
    storageStore.clearSelection()
  } else {
    storageStore.selectAllObjects()
  }
}

async function downloadObject(object: StorageObjectWithPreview): Promise<void> {
  if (object.isFolder) return
  await storageStore.downloadObject(bucketName.value, object.name)
}

function confirmBulkDelete(): void {
  deleteModal.value = {
    show: true,
    objects: [...storageStore.selectedObjects],
  }
}

async function handleBulkDelete(): Promise<void> {
  try {
    await storageStore.deleteObjects(bucketName.value, deleteModal.value.objects)
    deleteModal.value.show = false
  } catch {
    // Error is handled in the store
  }
}

function cancelDelete(): void {
  deleteModal.value = {
    show: false,
    objects: [],
  }
}

function getFileName(fullPath: string): string {
  const parts = fullPath.split('/')
  return parts[parts.length - 1] || fullPath
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)

  // Format as: "Dec 13, 2023 14:25"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Upload modal functions
function handleModalFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(files)]
  }
}

async function handleModalDrop(event: DragEvent): Promise<void> {
  isDragOver.value = false

  try {
    const files = await getFilesFromDataTransfer(event.dataTransfer!)
    if (files.length > 0) {
      selectedFiles.value = [...selectedFiles.value, ...files]
    }
  } catch (error) {
    console.error('Error processing dropped files/folders in modal:', error)
    appStore.showToast({
      type: 'error',
      title: 'Upload Error',
      message: 'Failed to process dropped files or folders',
    })
  }
}

function removeFile(index: number): void {
  selectedFiles.value.splice(index, 1)
}

async function handleUpload(): Promise<void> {
  if (selectedFiles.value.length === 0) return

  try {
    isUploading.value = true
    uploadProgress.value = selectedFiles.value.map(file => ({
      fileName: file.name,
      progress: 0,
    }))

    // Upload all files at once (uploadFiles handles success toast and refresh)
    await storageStore.uploadFiles(selectedFiles.value, bucketName.value, currentPath.value)

    // Mark all files as complete for UI
    uploadProgress.value.forEach(progress => {
      progress.progress = 1
    })

    // Close modal (uploadFiles already shows success toast and refreshes objects)
    closeUploadModal()
  } catch (error: any) {
    console.error('Upload failed:', error)
    appStore.showToast({
      type: 'error',
      title: 'Upload Failed',
      message: error.message || 'Failed to upload files',
    })
  } finally {
    isUploading.value = false
  }
}

function handleUploadModalClose(): void {
  // Allow closing unless currently uploading
  if (!isUploading.value) {
    closeUploadModal()
  }
}

function closeUploadModal(): void {
  showUploadModal.value = false
  selectedFiles.value = []
  uploadProgress.value = []
  isDragOver.value = false
  if (modalFileInput.value) {
    modalFileInput.value.value = ''
  }
}

function openCreateFileFromUpload(): void {
  showUploadModal.value = false
  showCreateFileModal.value = true
}

function openCreateFolderFromUpload(): void {
  showUploadModal.value = false
  showCreateFolderModal.value = true
}

// Handle ESC key for upload modal
const handleUploadModalEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showUploadModal.value && !isUploading.value) {
    event.preventDefault()
    event.stopPropagation()
    closeUploadModal()
  }
}

// Create file functions
function getFileExtension(filename: string): string {
  if (!filename) return ''
  return filename.split('.').pop()?.toLowerCase() || ''
}

function getContentTypeFromExtension(filename: string): string {
  const extension = getFileExtension(filename)
  const contentTypeMap: Record<string, string> = {
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    mjs: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    jsx: 'text/javascript',
    md: 'text/markdown',
    csv: 'text/csv',
    txt: 'text/plain',
    log: 'text/plain',
    conf: 'text/plain',
    ini: 'text/plain',
    sh: 'text/x-shellscript',
    py: 'text/x-python',
    rb: 'text/x-ruby',
    php: 'text/x-php',
    go: 'text/x-go',
    java: 'text/x-java-source',
    c: 'text/x-csrc',
    cpp: 'text/x-c++src',
    h: 'text/x-chdr',
    hpp: 'text/x-c++hdr',
  }

  return contentTypeMap[extension] || 'text/plain'
}

function getContentTypeLabel(contentType: string): string {
  const labelMap: Record<string, string> = {
    'application/json': 'JSON',
    'application/xml': 'XML',
    'application/yaml': 'YAML',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JavaScript',
    'text/typescript': 'TypeScript',
    'text/markdown': 'Markdown',
    'text/csv': 'CSV',
    'text/x-shellscript': 'Shell Script',
    'text/x-python': 'Python',
    'text/x-ruby': 'Ruby',
    'text/x-php': 'PHP',
    'text/x-go': 'Go',
    'text/x-java-source': 'Java',
    'text/x-csrc': 'C Source',
    'text/x-c++src': 'C++ Source',
    'text/plain': 'Plain Text',
  }

  return labelMap[contentType] || 'Plain Text'
}

function validateCreateFile(): void {
  createFileValidationError.value = ''

  if (!fileName.value.trim()) {
    return
  }

  // Validate filename
  if (fileName.value.includes('/') || fileName.value.includes('\\')) {
    createFileValidationError.value = 'Filename cannot contain slashes'
    return
  }

  if (!fileContent.value.trim()) {
    return // Empty content is valid
  }

  // Validate content based on auto-detected type
  try {
    const extension = getFileExtension(fileName.value)
    const detectedType = autoDetectedContentType.value

    if (extension === 'json' || detectedType === 'application/json') {
      JSON.parse(fileContent.value)
    } else if (extension === 'xml' || detectedType === 'application/xml') {
      const parser = new window.DOMParser()
      const xmlDoc = parser.parseFromString(fileContent.value, 'text/xml')
      const parseError = xmlDoc.getElementsByTagName('parsererror')
      if (parseError.length > 0) {
        throw new Error('Invalid XML format')
      }
    }
  } catch (error: any) {
    createFileValidationError.value = error.message || 'Invalid format'
  }
}

async function handleCreateFile(): Promise<void> {
  if (!fileName.value.trim()) return

  try {
    isCreatingFile.value = true

    // Auto-detect content type from file extension
    const detectedContentType = autoDetectedContentType.value

    // Create file content as blob
    const blob = new Blob([fileContent.value], {
      type: detectedContentType,
    })

    // Create File object
    const file = new File([blob], fileName.value, {
      type: detectedContentType,
    })

    // Upload the file using uploadFiles
    await storageStore.uploadFiles([file], bucketName.value, currentPath.value)

    // Close modal (uploadFiles already shows success toast and refreshes objects)
    closeCreateFileModal()
  } catch (error: any) {
    console.error('Create file failed:', error)
    appStore.showToast({
      type: 'error',
      title: 'Create Failed',
      message: error.message || 'Failed to create file',
    })
  } finally {
    isCreatingFile.value = false
  }
}

function closeCreateFileModal(): void {
  showCreateFileModal.value = false
  fileName.value = ''
  fileContent.value = ''
  createFileValidationError.value = ''
}

// Create folder modal functions
function closeCreateFolderModal(): void {
  showCreateFolderModal.value = false
  folderName.value = ''
  createFolderValidationError.value = ''
}

async function handleCreateFolder(): Promise<void> {
  if (!folderName.value.trim()) {
    createFolderValidationError.value = 'Folder name is required'
    return
  }

  // Validate folder name
  if (folderName.value.includes('/') || folderName.value.includes('\\')) {
    createFolderValidationError.value = 'Folder name cannot contain slashes'
    return
  }

  if (folderName.value.includes('..') || folderName.value.startsWith('.')) {
    createFolderValidationError.value = 'Invalid folder name'
    return
  }

  try {
    // Create folder by uploading a placeholder file
    const folderPath = currentPath.value
      ? `${currentPath.value}${folderName.value.trim()}/`
      : `${folderName.value.trim()}/`
    const placeholderFileName = '.keep'

    // Create a placeholder file to represent the folder
    const placeholderFile = new File([''], placeholderFileName, { type: 'text/plain' })

    await storageStore.uploadFiles([placeholderFile], bucketName.value, folderPath, true)

    // Refresh objects to show the new folder
    await refreshObjects()

    appStore.showToast({
      type: 'success',
      title: 'Folder created',
      message: `Folder "${folderName.value}" has been created successfully`,
    })

    closeCreateFolderModal()
  } catch (error) {
    console.error('Error creating folder:', error)
    createFolderValidationError.value =
      error instanceof Error ? error.message : 'Failed to create folder'

    appStore.showToast({
      type: 'error',
      title: 'Folder creation failed',
      message: error instanceof Error ? error.message : 'Failed to create folder',
    })
  }
}

// Drag and drop functions
function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragEnter(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault()
  // Only set isDragOver to false if we're actually leaving the drop zone
  if (!event.currentTarget?.contains(event.relatedTarget as any)) {
    isDragOver.value = false
  }
}

// Helper function to read directory entries recursively
async function readDirectoryEntries(directoryEntry: any, path = ''): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const reader = directoryEntry.createReader()
    const allFiles: File[] = []

    const readEntries = () => {
      reader.readEntries(async entries => {
        if (entries.length === 0) {
          resolve(allFiles)
          return
        }

        const promises = entries.map(async entry => {
          const currentPath = path ? `${path}/${entry.name}` : entry.name

          if (entry.isFile) {
            return new Promise<File>((fileResolve, fileReject) => {
              ;(entry as any).file((file: any) => {
                // Create a new File with the full path
                const fileWithPath = new File([file], currentPath, { type: file.type })
                fileResolve(fileWithPath)
              }, fileReject)
            })
          } else if (entry.isDirectory) {
            return readDirectoryEntries(entry as any, currentPath)
          }
          return []
        })

        try {
          const results = await Promise.all(promises)
          results.forEach(result => {
            if (Array.isArray(result)) {
              allFiles.push(...result)
            } else if (result) {
              allFiles.push(result)
            }
          })
          readEntries() // Continue reading more entries
        } catch (error) {
          reject(error)
        }
      }, reject)
    }

    readEntries()
  })
}

// Helper function to get all files from DataTransferItems (supports both files and folders)
async function getFilesFromDataTransfer(dataTransfer: any): Promise<File[]> {
  const allFiles: File[] = []

  if (dataTransfer.items) {
    // Use DataTransferItems API for folder support
    const items = Array.from(dataTransfer.items)

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()

        if (entry?.isFile) {
          const file = item.getAsFile()
          if (file) {
            allFiles.push(file)
          }
        } else if (entry?.isDirectory) {
          // Include the root folder name in the path
          const directoryFiles = await readDirectoryEntries(entry as any, entry.name)
          allFiles.push(...directoryFiles)
        }
      }
    }
  } else {
    // Fallback to files API (files only, no folders)
    allFiles.push(...Array.from(dataTransfer.files))
  }

  return allFiles
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  isDragOver.value = false

  try {
    const files = await getFilesFromDataTransfer(event.dataTransfer!)
    if (files.length > 0) {
      await uploadFiles(files)
    }
  } catch (error) {
    console.error('Error processing dropped files/folders:', error)
    appStore.showToast({
      type: 'error',
      title: 'Upload Error',
      message: 'Failed to process dropped files or folders',
    })
  }
}

function triggerFileInput(): void {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length > 0) {
    await uploadFiles(files)
    // Clear the input so the same files can be selected again
    target.value = ''
  }
}

async function uploadFiles(files: File[]): Promise<void> {
  try {
    await storageStore.uploadFiles(files, bucketName.value, currentPath.value)
    // Files list will be refreshed automatically by the store
  } catch (error) {
    console.error('Upload error:', error)
    // Error handling is done in the store
  }
}

// Lifecycle
onMounted(async () => {
  // Add ESC key listener for upload modal
  document.addEventListener('keydown', handleUploadModalEscKey)

  if (bucketName.value) {
    try {
      await storageStore.fetchBucket(bucketName.value)

      // Check if we're switching to a different bucket
      if (
        storageStore.currentBucket?.name &&
        storageStore.currentBucket.name !== bucketName.value
      ) {
        // Clear path when switching buckets
        storageStore.clearCurrentPath()
      }

      // Use existing currentPath from store, or check query param, or default to root
      const queryPath = route.query.path as string
      const pathToLoad = queryPath || storageStore.currentPath || ''
      await storageStore.fetchObjects(bucketName.value, pathToLoad, true)

      // Handle deep link download
      if (route.query.download === 'true' && queryPath) {
        // Automatically start download for the specified path
        // Ensure it ends with / so it's treated as a folder if it is one
        const path = queryPath.endsWith('/') ? queryPath : `${queryPath}/`
        await downloadItemsAsZip([path])
      }
    } catch (error) {
      console.error('Error loading bucket:', error)
    }
  }
})

onUnmounted(() => {
  // Remove ESC key listener
  document.removeEventListener('keydown', handleUploadModalEscKey)
})
</script>
