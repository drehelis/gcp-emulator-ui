<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <!-- Navigation and Title -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets`"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeftIcon class="w-5 h-5" />
              </router-link>
              
              <div>
                <div class="flex items-center space-x-2">
                  <ArchiveBoxIcon class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {{ bucketName }}
                  </h1>
                </div>
                <p v-if="currentPath" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ currentPath }}
                </p>
              </div>
            </div>
            
            <!-- Action buttons -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="refreshObjects"
                :disabled="storageStore.loading.objects"
                class="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ArrowPathIcon
                  :class="['w-4 h-4', storageStore.loading.objects ? 'animate-spin' : '', 'sm:mr-2']"
                />
                <span class="hidden sm:inline">Refresh</span>
              </button>

              <router-link
                :to="`/projects/${currentProjectId}/storage/buckets/${encodeURIComponent(bucketName)}/upload`"
                class="inline-flex items-center px-2 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                <ArrowUpTrayIcon class="w-4 h-4 sm:mr-2" />
                <span class="hidden sm:inline">Upload</span>
              </router-link>
            </div>
          </div>

          <!-- Breadcrumbs -->
          <nav v-if="storageStore.breadcrumbs.length > 0" class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2 text-sm">
              <li>
                <button
                  @click="navigateToPath('')"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <HomeIcon class="w-4 h-4" />
                  <span class="sr-only">Home</span>
                </button>
              </li>
              <li v-for="(breadcrumb, index) in storageStore.breadcrumbs" :key="index" class="flex items-center">
                <ChevronRightIcon class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
                <button
                  v-if="!breadcrumb.isLast"
                  @click="navigateToPath(breadcrumb.path)"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate transition-colors duration-200"
                >
                  {{ breadcrumb.name }}
                </button>
                <span v-else class="text-gray-500 dark:text-gray-400 truncate">
                  {{ breadcrumb.name }}
                </span>
              </li>
            </ol>
          </nav>

          <!-- Selection actions -->
          <div v-if="storageStore.selectedObjects.length > 0" class="flex items-center justify-end space-x-2 mt-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ storageStore.selectedObjects.length }} selected
            </span>
            <button
              @click="handleBulkDownload"
              :disabled="storageStore.loading.download"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-transparent rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              @click="confirmBulkDelete"
              :disabled="storageStore.loading.delete"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-transparent rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <TrashIcon class="w-4 h-4 mr-2" />
              Delete
            </button>
            <button
              @click="storageStore.clearSelection"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading State -->
      <div v-if="storageStore.loading.objects && !storageStore.objects.length" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-blue-600 dark:text-blue-400 transition ease-in-out duration-150">
          <ArrowPathIcon class="animate-spin -ml-1 mr-3 h-5 w-5" />
          Loading objects...
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="storageStore.hasError" class="text-center py-12">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <ExclamationTriangleIcon class="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Error Loading Objects
          </h3>
          <p class="text-red-700 dark:text-red-300 mb-4">
            {{ storageStore.state.error }}
          </p>
          <button
            @click="refreshObjects"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>

      <!-- Empty State with Drag & Drop -->
      <div v-else-if="!storageStore.objects.length" class="text-center py-12">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 max-w-2xl mx-auto transition-colors duration-200"
          :class="{
            'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10': isDragOver
          }"
          @dragover.prevent="handleDragOver"
          @dragenter.prevent="handleDragEnter"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <!-- Upload Icon -->
          <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <ArrowUpTrayIcon v-if="!storageStore.loading.upload" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <ArrowPathIcon v-else class="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>

          <!-- Upload Text -->
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            <span v-if="!storageStore.loading.upload">No Objects Found</span>
            <span v-else>Uploading Files...</span>
          </h3>

          <p v-if="!storageStore.loading.upload" class="text-gray-600 dark:text-gray-400 text-sm mb-6">
            <span v-if="!isDragOver">
              This {{ currentPath ? 'folder' : 'bucket' }} is empty.
              <strong>Drag and drop files here</strong> or click to upload.
            </span>
            <span v-else class="text-blue-600 dark:text-blue-400 font-medium">
              Drop files here to upload
            </span>
          </p>

          <!-- Upload Progress -->
          <div v-if="storageStore.loading.upload && storageStore.uploadProgress.length > 0" class="mb-6">
            <div class="space-y-2">
              <div
                v-for="progress in storageStore.uploadProgress"
                :key="progress.file.name"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-gray-600 dark:text-gray-400 truncate mr-4">{{ progress.file.name }}</span>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      :style="{ width: `${progress.percentage}%` }"
                    ></div>
                  </div>
                  <span class="text-gray-500 dark:text-gray-400 w-8 text-right">{{ progress.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Button -->
          <div v-if="!storageStore.loading.upload" class="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <button
              @click="triggerFileInput"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
              Choose Files
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">or drag and drop files here</span>
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
      <div v-else-if="storageStore.viewMode === 'list'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
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
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Name
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'name' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="storageStore.sortBy === 'name' && storageStore.sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-24">
                  <button
                    @click="handleSort('size')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Size
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'size' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="storageStore.sortBy === 'size' && storageStore.sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-32">
                  <button
                    @click="handleSort('type')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Type
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'type' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="storageStore.sortBy === 'type' && storageStore.sortOrder === 'desc'"
                      class="w-3 h-3 ml-1"
                    />
                    <div v-else class="w-3 h-3 ml-1"></div>
                  </button>
                </th>
                <th scope="col" class="px-3 py-2 text-left w-36">
                  <button
                    @click="handleSort('modified')"
                    class="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150"
                  >
                    Modified
                    <ChevronUpIcon
                      v-if="storageStore.sortBy === 'modified' && storageStore.sortOrder === 'asc'"
                      class="w-3 h-3 ml-1"
                    />
                    <ChevronDownIcon
                      v-else-if="storageStore.sortBy === 'modified' && storageStore.sortOrder === 'desc'"
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
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer"
                :class="[
                  { 'bg-blue-50 dark:bg-blue-900/20': storageStore.selectedObjects.includes(object.name) },
                  index !== storageStore.objects.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                ]"
                @click="handleObjectClick(object)"
              >
                <td class="px-3 py-1.5">
                  <input
                    v-if="!object.isFolder"
                    type="checkbox"
                    :checked="storageStore.selectedObjects.includes(object.name)"
                    @click.stop="storageStore.selectObject(object.name)"
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
                    <span class="text-xs font-medium text-gray-900 dark:text-white truncate" :title="object.isFolder ? object.name : getFileName(object.name)">
                      {{ object.isFolder ? object.name : getFileName(object.name) }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ object.isFolder ? '—' : formatFileSize(parseInt(object.size || '0')) }}
                </td>
                <td class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span class="truncate" :title="object.isFolder ? 'Folder' : (object.contentType || 'Unknown')">
                    {{ object.isFolder ? 'Folder' : (object.contentType || 'Unknown') }}
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
                    class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20': storageStore.selectedObjects.includes(object.name) }"
              @click="handleObjectClick(object)"
            >
              <div class="flex items-start space-x-3">
                <input
                  v-if="!object.isFolder"
                  type="checkbox"
                  :checked="storageStore.selectedObjects.includes(object.name)"
                  @click.stop
                  @change="toggleObjectSelection(object.name)"
                  class="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                />
                <div class="w-4 h-4 mt-1" v-else></div>

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
                      class="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      <ArrowDownTrayIcon class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex items-center space-x-4">
                      <span v-if="!object.isFolder">
                        {{ formatFileSize(parseInt(object.size || '0')) }}
                      </span>
                      <span class="truncate max-w-24">
                        {{ object.isFolder ? 'Folder' : (object.contentType || 'Unknown') }}
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
          class="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/10 transition-all duration-200 cursor-pointer"
          :class="{ 'ring-2 ring-blue-500 dark:ring-blue-400': storageStore.selectedObjects.includes(object.name) }"
          @click="handleObjectClick(object)"
        >
          <!-- Selection checkbox -->
          <div
            v-if="!object.isFolder"
            class="absolute top-2 left-2 transition-opacity duration-200"
            :class="[
              storageStore.selectedObjects.includes(object.name)
                ? 'opacity-100'
                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            ]"
          >
            <input
              type="checkbox"
              :checked="storageStore.selectedObjects.includes(object.name)"
              @click.stop="storageStore.selectObject(object.name)"
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
              <DocumentIcon
                v-else
                class="w-12 h-12 text-gray-400 dark:text-gray-500"
              />
            </div>
            
            <p class="text-xs font-medium text-gray-900 dark:text-white truncate w-full" :title="object.name">
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
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ArrowPathIcon v-if="storageStore.loading.objects" class="animate-spin -ml-1 mr-2 h-4 w-4" />
          {{ storageStore.loading.objects ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <TransitionRoot as="template" :show="deleteModal.show">
      <Dialog as="div" class="relative z-50" @close="deleteModal.show = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div class="sm:flex sm:items-start">
                  <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Delete Objects
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete {{ deleteModal.objects.length }} object{{ deleteModal.objects.length === 1 ? '' : 's' }}? 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    @click="handleBulkDelete"
                    :disabled="storageStore.loading.delete"
                    class="inline-flex w-full justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  >
                    <ArrowPathIcon v-if="storageStore.loading.delete" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {{ storageStore.loading.delete ? 'Deleting...' : 'Delete' }}
                  </button>
                  <button
                    @click="deleteModal.show = false"
                    :disabled="storageStore.loading.delete"
                    class="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-200"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
  FolderIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue'
import { useStorageStore } from '@/stores/storage'
import { useProjectsStore } from '@/stores/projects'
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
  objects: []
})

// Drag and drop state
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Props from route
const bucketName = computed(() => decodeURIComponent(route.params.bucketName as string))
const currentProjectId = computed(() => route.params.projectId as string || projectsStore.selectedProjectId || 'Unknown')
const currentPath = computed(() => storageStore.currentPath)

// Computed
const allObjectsSelected = computed(() => {
  const nonFolderObjects = storageStore.objects.filter(obj => !obj.isFolder)
  return nonFolderObjects.length > 0 && nonFolderObjects.every(obj => 
    storageStore.selectedObjects.includes(obj.name)
  )
})

const someObjectsSelected = computed(() => {
  const nonFolderObjects = storageStore.objects.filter(obj => !obj.isFolder)
  return storageStore.selectedObjects.length > 0 && 
         storageStore.selectedObjects.length < nonFolderObjects.length
})

// Methods
async function refreshObjects(): Promise<void> {
  await storageStore.fetchObjects(bucketName.value, currentPath.value, true)
}

function handleSort(field: 'name' | 'size' | 'type' | 'modified'): void {
  // Map field names to storage store sort fields
  const sortFieldMap: Record<string, 'name' | 'size' | 'modified'> = {
    name: 'name',
    size: 'size',
    type: 'name', // For now, sort by name for type column
    modified: 'modified'
  }

  const storeField = sortFieldMap[field]
  storageStore.setSortBy(storeField)
}

function handleMobileSortChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  const [field, order] = target.value.split('-')

  const sortFieldMap: Record<string, 'name' | 'size' | 'modified'> = {
    name: 'name',
    size: 'size',
    modified: 'modified'
  }

  const storeField = sortFieldMap[field] || 'name'
  storageStore.setSortBy(storeField, order as 'asc' | 'desc')
}

async function loadMore(): Promise<void> {
  await storageStore.fetchObjects(bucketName.value, currentPath.value, false)
}

function navigateToPath(path: string): void {
  storageStore.fetchObjects(bucketName.value, path, true)
}

function handleObjectClick(object: StorageObjectWithPreview): void {
  if (object.isFolder) {
    const newPath = currentPath.value + object.name + '/'
    navigateToPath(newPath)
  } else {
    // Navigate to object details
    const objectPath = encodeURIComponent(object.name)
    router.push(`/projects/${currentProjectId.value}/storage/buckets/${encodeURIComponent(bucketName.value)}/objects/${objectPath}`)
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

async function handleBulkDownload(): Promise<void> {
  for (const objectName of storageStore.selectedObjects) {
    await storageStore.downloadObject(bucketName.value, objectName)
  }
}

function confirmBulkDelete(): void {
  deleteModal.value = {
    show: true,
    objects: [...storageStore.selectedObjects]
  }
}

async function handleBulkDelete(): Promise<void> {
  try {
    await storageStore.deleteObjects(bucketName.value, deleteModal.value.objects)
    deleteModal.value.show = false
  } catch (error) {
    // Error is handled in the store
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    hour12: false
  })
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
  if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  isDragOver.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0) {
    await uploadFiles(files)
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
  if (bucketName.value) {
    try {
      await storageStore.fetchBucket(bucketName.value)
      await storageStore.fetchObjects(bucketName.value, '', true)
    } catch (error) {
      console.error('Error loading bucket:', error)
    }
  }
})
</script>