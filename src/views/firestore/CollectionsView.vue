<template>
  <div class="min-h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Page Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <!-- Navigation and Title -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <h1 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                    Collections ({{ collections.length }})
                  </h1>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="refreshCollections"
                :disabled="firestoreStore.loading"
                class="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ArrowPathIcon
                  :class="['w-4 h-4', firestoreStore.loading ? 'animate-spin' : '', 'sm:mr-2']"
                />
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Breadcrumb Navigator -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
        <span>/</span>
        <template v-if="selectedCollection">
          <ChevronRightIcon class="w-3 h-3 mx-1" />
          <span class="text-blue-600 dark:text-blue-400">{{ selectedCollection.id }}</span>
        </template>
        <template v-if="selectedDocument">
          <ChevronRightIcon class="w-3 h-3 mx-1" />
          <span class="text-blue-600 dark:text-blue-400">{{ getDocumentId(selectedDocument.name) }}</span>
        </template>
      </div>
    </div>

    <!-- Three Panel Layout -->
    <div class="flex h-screen-header">
      <!-- Left Panel - Collections List -->
      <div class="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div class="p-4">
          <!-- Database Name -->
          <div class="mb-3">
            <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 font-mono">
              <span>(default)</span>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
          </div>

          <div class="mb-4">
            <button
              @click="showCreateCollectionModal = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Start collection
            </button>
          </div>

          <!-- Collections Tree -->
          <div class="space-y-1">
            <div
              v-for="collection in collections"
              :key="collection.id"
              class="group"
            >
              <div
                :class="[
                  'flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200',
                  selectedCollection?.id === collection.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
                @click="selectCollection(collection)"
              >
                <ChevronRightIcon
                  :class="[
                    'w-4 h-4 mr-1 transition-transform duration-200',
                    collection.isExpanded ? 'rotate-90' : ''
                  ]"
                />
                <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
                <span class="truncate">{{ collection.id }}</span>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="collections.length === 0 && !firestoreStore.loading"
              class="text-center py-8"
            >
              <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No collections found
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Center Panel - Documents List -->
      <div class="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div class="p-4">
          <!-- Collection Header with Breadcrumb Style -->
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
              <span class="text-gray-900 dark:text-white">{{ selectedCollection ? selectedCollection.id : 'Select a collection' }}</span>
              <div v-if="selectedCollection" class="relative" data-collection-menu>
                <button
                  @click="showCollectionMenu = !showCollectionMenu"
                  class="p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <EllipsisVerticalIcon class="w-3 h-3" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="showCollectionMenu"
                  class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[160px]"
                  @click.stop
                >
                  <button
                    @click="handleDeleteCollection"
                    class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
                  >
                    Delete collection
                  </button>
                </div>
              </div>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
          </div>

          <div class="mb-4">
            <button
              v-if="selectedCollection"
              @click="showAddDocumentModal = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Add document
            </button>
          </div>

          <!-- Documents List -->
          <div v-if="selectedCollection" class="space-y-1">
            <div
              v-for="document in documents"
              :key="document.name"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
                selectedDocument?.name === document.name
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
              @click="selectDocument(document)"
            >
              <span class="truncate">{{ getDocumentId(document.name) }}</span>
            </div>

            <!-- Empty documents state -->
            <div
              v-if="documents.length === 0 && !firestoreStore.loading"
              class="text-center py-8"
            >
              <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No documents in this collection
              </p>
              <button
                @click="showAddDocumentModal = true"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
              >
                <PlusIcon class="w-4 h-4 mr-2" />
                Add your first document
              </button>
            </div>
          </div>

          <!-- No collection selected state -->
          <div
            v-else
            class="text-center py-16"
          >
            <CircleStackIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a collection
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Choose a collection from the left panel to view its documents
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Document Editor -->
      <div class="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
        <div class="p-4">
          <!-- Document Header -->
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
              <span class="text-gray-900 dark:text-white">{{ selectedDocument ? getDocumentId(selectedDocument.name) : 'Document' }}</span>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600"></div>
          </div>

          <div v-if="selectedCollection" class="mb-4">
            <button
              @click="showCreateCollectionModal = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Start collection
            </button>
          </div>

          <div v-if="selectedDocument" class="mb-4">
            <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
            <button
              @click="showAddFieldModal = true"
              class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Add field
            </button>
          </div>

          <!-- Document Fields -->
          <div v-if="selectedDocument" class="space-y-1">
            <template v-for="(value, fieldName) in selectedDocument.fields" :key="fieldName">
              <!-- Root level field -->
              <div
                class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div class="flex items-center min-w-0 flex-1">
                  <!-- Toggle button for map and array fields -->
                  <button
                    v-if="getFieldType(value) === 'map' || getFieldType(value) === 'array'"
                    @click="toggleMapField(fieldName)"
                    class="p-0.5 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                  >
                    <ChevronRightIcon
                      :class="[
                        'w-3 h-3 transition-transform duration-200',
                        isMapFieldExpanded(fieldName) ? 'rotate-90' : ''
                      ]"
                    />
                  </button>
                  <div v-else class="w-4 mr-1"></div>

                  <span class="text-blue-600 dark:text-blue-400 font-mono mr-1">{{ fieldName }}:</span>

                  <!-- For non-map/array fields, show the value -->
                  <span
                    v-if="getFieldType(value) !== 'map' && getFieldType(value) !== 'array'"
                    class="text-gray-900 dark:text-white font-mono truncate"
                  >
                    "{{ formatFieldValue(value) }}"
                  </span>

                  <!-- For map fields, show map indicator -->
                  <span
                    v-else-if="getFieldType(value) === 'map'"
                    class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                  >
                    {{ Object.keys(value.mapValue.fields).length }} fields
                  </span>

                  <!-- For array fields, show array indicator -->
                  <span
                    v-else-if="getFieldType(value) === 'array'"
                    class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                  >
                    {{ (value.arrayValue.values || []).length }} items
                  </span>
                </div>

                <!-- Hover Actions -->
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ getFieldType(value) }}</span>
                  <button
                    v-if="getFieldType(value) === 'map' || getFieldType(value) === 'array'"
                    @click="getFieldType(value) === 'map' ? handleAddToMap(fieldName) : handleAddToArray(fieldName)"
                    class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
                    :title="getFieldType(value) === 'map' ? 'Add field to map' : 'Add item to array'"
                  >
                    <PlusIcon class="w-3 h-3" />
                  </button>
                  <button
                    v-else
                    @click="handleEditField(fieldName, fieldName, value)"
                    class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
                    title="Edit field"
                  >
                    <PencilIcon class="w-3 h-3" />
                  </button>
                  <button
                    @click="handleDeleteField(fieldName, fieldName)"
                    class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors duration-150"
                    title="Delete field"
                  >
                    <TrashIcon class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <!-- Expanded map fields -->
              <div
                v-if="getFieldType(value) === 'map' && isMapFieldExpanded(fieldName)"
                class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
              >
                <div
                  v-for="(subValue, subFieldName) in value.mapValue.fields"
                  :key="`${fieldName}.${subFieldName}`"
                  class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div class="flex items-center min-w-0 flex-1">
                    <!-- Nested map support -->
                    <button
                      v-if="getFieldType(subValue) === 'map'"
                      @click="toggleMapField(`${fieldName}.${subFieldName}`)"
                      class="p-0.5 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                    >
                      <ChevronRightIcon
                        :class="[
                          'w-3 h-3 transition-transform duration-200',
                          isMapFieldExpanded(`${fieldName}.${subFieldName}`) ? 'rotate-90' : ''
                        ]"
                      />
                    </button>
                    <div v-else class="w-4 mr-1"></div>

                    <span class="text-blue-600 dark:text-blue-400 font-mono mr-1">{{ subFieldName }}:</span>

                    <!-- For non-map fields, show the value -->
                    <span
                      v-if="getFieldType(subValue) !== 'map'"
                      class="text-gray-900 dark:text-white font-mono truncate"
                    >
                      "{{ formatFieldValue(subValue) }}"
                    </span>

                    <!-- For map fields, show map indicator -->
                    <span
                      v-else
                      class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                    >
                      {{ Object.keys(subValue.mapValue.fields).length }} fields
                    </span>
                  </div>

                  <!-- Hover Actions for nested fields -->
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ getFieldType(subValue) }}</span>
                    <button
                      v-if="getFieldType(subValue) === 'map' || getFieldType(subValue) === 'array'"
                      @click="getFieldType(subValue) === 'map' ? handleAddToMap(`${fieldName}.${subFieldName}`) : handleAddToArray(`${fieldName}.${subFieldName}`)"
                      class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
                      :title="getFieldType(subValue) === 'map' ? 'Add field to map' : 'Add item to array'"
                    >
                      <PlusIcon class="w-3 h-3" />
                    </button>
                    <button
                      v-else
                      @click="handleEditField(`${fieldName}.${subFieldName}`, subFieldName, subValue)"
                      class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
                      title="Edit field"
                    >
                      <PencilIcon class="w-3 h-3" />
                    </button>
                    <button
                      @click="handleDeleteField(`${fieldName}.${subFieldName}`, `${fieldName}.${subFieldName}`)"
                      class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors duration-150"
                      title="Delete field"
                    >
                      <TrashIcon class="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <!-- Second level nested map expansion -->
                <template
                  v-for="(subValue, subFieldName) in value.mapValue.fields"
                  :key="`${fieldName}.${subFieldName}.nested`"
                >
                  <div
                    v-if="getFieldType(subValue) === 'map' && isMapFieldExpanded(`${fieldName}.${subFieldName}`)"
                    class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
                  >
                    <div
                      v-for="(nestedValue, nestedFieldName) in subValue.mapValue.fields"
                      :key="`${fieldName}.${subFieldName}.${nestedFieldName}`"
                      class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div class="flex items-center min-w-0 flex-1">
                        <div class="w-4 mr-1"></div>
                        <span class="text-blue-600 dark:text-blue-400 font-mono mr-1">{{ nestedFieldName }}:</span>
                        <span class="text-gray-900 dark:text-white font-mono truncate">"{{ formatFieldValue(nestedValue) }}"</span>
                      </div>

                      <!-- Hover Actions for double-nested fields -->
                      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ getFieldType(nestedValue) }}</span>
                        <button
                          v-if="getFieldType(nestedValue) === 'map' || getFieldType(nestedValue) === 'array'"
                          @click="getFieldType(nestedValue) === 'map' ? handleAddToMap(`${fieldName}.${subFieldName}.${nestedFieldName}`) : handleAddToArray(`${fieldName}.${subFieldName}.${nestedFieldName}`)"
                          class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
                          :title="getFieldType(nestedValue) === 'map' ? 'Add field to map' : 'Add item to array'"
                        >
                          <PlusIcon class="w-3 h-3" />
                        </button>
                        <button
                          v-else
                          @click="handleEditField(`${fieldName}.${subFieldName}.${nestedFieldName}`, nestedFieldName, nestedValue)"
                          class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
                          title="Edit field"
                        >
                          <PencilIcon class="w-3 h-3" />
                        </button>
                        <button
                          @click="handleDeleteField(`${fieldName}.${subFieldName}.${nestedFieldName}`, `${fieldName}.${subFieldName}.${nestedFieldName}`)"
                          class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors duration-150"
                          title="Delete field"
                        >
                          <TrashIcon class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Expanded array fields -->
              <div
                v-if="getFieldType(value) === 'array' && isMapFieldExpanded(fieldName)"
                class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
              >
                <div
                  v-for="(arrayItem, arrayIndex) in (value.arrayValue.values || [])"
                  :key="`${fieldName}[${arrayIndex}]`"
                  class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div class="flex items-center min-w-0 flex-1">
                    <!-- Toggle button for nested maps/arrays in array -->
                    <button
                      v-if="getFieldType(arrayItem) === 'map' || getFieldType(arrayItem) === 'array'"
                      @click="toggleMapField(`${fieldName}[${arrayIndex}]`)"
                      class="p-0.5 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                    >
                      <ChevronRightIcon
                        :class="[
                          'w-3 h-3 transition-transform duration-200',
                          isMapFieldExpanded(`${fieldName}[${arrayIndex}]`) ? 'rotate-90' : ''
                        ]"
                      />
                    </button>
                    <div v-else class="w-4 mr-1"></div>

                    <span class="text-purple-600 dark:text-purple-400 font-mono mr-1">[{{ arrayIndex }}]:</span>

                    <!-- For non-map/array items, show the value -->
                    <span
                      v-if="getFieldType(arrayItem) !== 'map' && getFieldType(arrayItem) !== 'array'"
                      class="text-gray-900 dark:text-white font-mono truncate"
                    >
                      "{{ formatFieldValue(arrayItem) }}"
                    </span>

                    <!-- For map items, show map indicator -->
                    <span
                      v-else-if="getFieldType(arrayItem) === 'map'"
                      class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                    >
                      {{ Object.keys(arrayItem.mapValue.fields).length }} fields
                    </span>

                    <!-- For nested array items, show array indicator -->
                    <span
                      v-else-if="getFieldType(arrayItem) === 'array'"
                      class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                    >
                      {{ (arrayItem.arrayValue.values || []).length }} items
                    </span>
                  </div>

                  <!-- Hover Actions for array items -->
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ getFieldType(arrayItem) }}</span>
                    <button
                      v-if="getFieldType(arrayItem) === 'map' || getFieldType(arrayItem) === 'array'"
                      @click="getFieldType(arrayItem) === 'map' ? handleAddToMap(`${fieldName}[${arrayIndex}]`) : handleAddToArray(`${fieldName}[${arrayIndex}]`)"
                      class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
                      :title="getFieldType(arrayItem) === 'map' ? 'Add field to map' : 'Add item to array'"
                    >
                      <PlusIcon class="w-3 h-3" />
                    </button>
                    <button
                      v-else
                      @click="handleEditField(`${fieldName}[${arrayIndex}]`, `[${arrayIndex}]`, arrayItem)"
                      class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
                      title="Edit item"
                    >
                      <PencilIcon class="w-3 h-3" />
                    </button>
                    <button
                      @click="handleDeleteField(`${fieldName}[${arrayIndex}]`, `${fieldName}[${arrayIndex}]`)"
                      class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors duration-150"
                      title="Delete item"
                    >
                      <TrashIcon class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- No document selected state -->
          <div
            v-else
            class="text-center py-16"
          >
            <DocumentIcon class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a document
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Choose a document from the center panel to view its fields
            </p>
            <div v-if="selectedCollection" class="mt-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                There's no document in this path yet
              </p>
              <a href="#" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Start Collection Modal -->
    <StartCollectionModal
      v-model="showCreateCollectionModal"
      :project-id="currentProjectId"
      @created="handleCollectionCreated"
    />

    <!-- Delete Collection Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteCollectionModal"
      title="Delete Collection"
      :message="`Are you sure you want to delete collection '${collectionToDelete ? collectionToDelete.id : ''}'?`"
      confirm-label="Delete Collection"
      :is-loading="isDeletingCollection"
      :details="{
        title: 'What will happen:',
        description: 'The collection and all its documents will be permanently deleted. This action cannot be undone.'
      }"
      @confirm="confirmDeleteCollection"
      @cancel="cancelDeleteCollection"
    />

    <!-- Delete Field Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteFieldModal"
      title="Delete Field"
      :message="`Are you sure you want to delete field '${fieldToDelete ? fieldToDelete.displayName : ''}'?`"
      confirm-label="Delete Field"
      :is-loading="isDeletingField"
      :details="{
        title: 'What will happen:',
        description: 'The field will be permanently removed from this document. This action cannot be undone.'
      }"
      @confirm="confirmDeleteField"
      @cancel="cancelDeleteField"
    />

    <!-- Simple Field Editor Modal -->
    <div
      v-if="showFieldEditor && fieldToEdit"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 backdrop-blur-[2px] bg-white/5 dark:bg-black/5" aria-hidden="true" @click="cancelFieldEditor"></div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-6 pt-6 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-6" id="modal-title">
              {{ getModalTitle() }}
            </h3>

            <div class="space-y-4">
              <!-- Field Name (only for new fields, not array items) -->
              <div v-if="fieldToEdit.isNew && !isAddingToArray()">
                <input
                  v-model="editFieldName"
                  type="text"
                  placeholder="Field name"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Field Type and Value in a row -->
              <div class="flex gap-4">
                <!-- Field Type -->
                <div class="flex-shrink-0">
                  <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Field type</label>
                  <select
                    v-model="editFieldType"
                    @change="handleTypeChange"
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="null">null</option>
                    <option value="timestamp">timestamp</option>
                    <option value="map">map</option>
                    <option value="array">array</option>
                    <option value="geopoint">geopoint</option>
                    <option value="reference">reference</option>
                  </select>
                </div>

                <!-- Field Value -->
                <div class="flex-1">
                  <label class="block text-sm text-blue-500 dark:text-blue-400 mb-1">Field value</label>

                  <!-- String/Text -->
                  <input
                    v-if="editFieldType === 'string'"
                    v-model="editFieldValue"
                    type="text"
                    class="w-full px-3 py-2 border-2 border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />

                  <!-- Number -->
                  <input
                    v-else-if="editFieldType === 'number'"
                    v-model.number="editFieldValue"
                    type="number"
                    step="any"
                    class="w-full px-3 py-2 border-2 border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />

                  <!-- Boolean -->
                  <select
                    v-else-if="editFieldType === 'boolean'"
                    v-model="editFieldValue"
                    class="w-full px-3 py-2 border-2 border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option :value="true">true</option>
                    <option :value="false">false</option>
                  </select>

                  <!-- Null -->
                  <div
                    v-else-if="editFieldType === 'null'"
                    class="w-full px-3 py-2 border-2 border-blue-500 rounded-md text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  >
                    null
                  </div>

                  <!-- Other types placeholder -->
                  <input
                    v-else
                    v-model="editFieldValue"
                    type="text"
                    :placeholder="`Enter ${editFieldType} value`"
                    class="w-full px-3 py-2 border-2 border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 mt-8">
            <button
              type="button"
              @click="cancelFieldEditor"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveFieldEdit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowPathIcon,
  ChevronRightIcon,
  CircleStackIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

import { useFirestoreStore } from '@/stores/firestore'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Reactive state
const showCreateCollectionModal = ref(false)
const showAddDocumentModal = ref(false)
const showAddFieldModal = ref(false)
const showCollectionMenu = ref(false)
const showDeleteCollectionModal = ref(false)
const isDeletingCollection = ref(false)
const collectionToDelete = ref<FirestoreCollectionWithMetadata | null>(null)
const selectedCollection = ref<FirestoreCollectionWithMetadata | null>(null)
const selectedDocument = ref<FirestoreDocument | null>(null)
const expandedMapFields = ref<Set<string>>(new Set())
const showDeleteFieldModal = ref(false)
const isDeletingField = ref(false)
const fieldToDelete = ref<{ path: string; displayName: string } | null>(null)
const showFieldEditor = ref(false)
const fieldToEdit = ref<{ path: string; fieldName: string; fieldValue: any; isNew: boolean; parentPath?: string } | null>(null)
const editFieldName = ref('')
const editFieldType = ref('string')
const editFieldValue = ref<any>('')

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)

const collections = computed(() => firestoreStore.collections)
const documents = computed(() => {
  if (!selectedCollection.value) return []
  return firestoreStore.getDocumentsByCollection(selectedCollection.value.id)
})

// Methods
const refreshCollections = async () => {
  await firestoreStore.loadCollections(currentProjectId.value)

  // If a collection is currently selected, reload its documents too
  if (selectedCollection.value) {
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)

    // Also reselect the first document if we had one selected
    await nextTick()
    if (selectedDocument.value) {
      const docs = documents.value
      const currentDocId = getDocumentId(selectedDocument.value.name)
      const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
      if (foundDoc) {
        selectDocument(foundDoc)
      } else if (docs.length > 0) {
        selectDocument(docs[0])
      }
    }
  }
}

const selectCollection = async (collection: FirestoreCollectionWithMetadata) => {
  selectedCollection.value = collection
  selectedDocument.value = null
  await firestoreStore.loadDocuments(currentProjectId.value, collection.id)

  // Auto-select the first document if available
  await nextTick()
  const docs = documents.value
  if (docs.length > 0) {
    selectDocument(docs[0])
  }
}

const selectDocument = (document: FirestoreDocument) => {
  selectedDocument.value = document
  expandedMapFields.value.clear()
}

const handleCollectionCreated = async (collectionId: string) => {
  // Refresh collections list
  await refreshCollections()

  // Auto-select the newly created collection
  const newCollection = collections.value.find(c => c.id === collectionId)
  if (newCollection) {
    await selectCollection(newCollection)

    // Wait for reactivity to update documents
    await nextTick()

    // Auto-select the first document to show its fields
    const docs = documents.value
    if (docs.length > 0) {
      selectDocument(docs[0])
    }
  }
}

const handleDeleteCollection = () => {
  showCollectionMenu.value = false
  if (selectedCollection.value) {
    collectionToDelete.value = selectedCollection.value
    showDeleteCollectionModal.value = true
  }
}

const confirmDeleteCollection = async () => {
  if (!collectionToDelete.value) return

  try {
    isDeletingCollection.value = true
    await firestoreStore.deleteCollection(currentProjectId.value, collectionToDelete.value.id)

    // Clear selection if we deleted the currently selected collection
    if (selectedCollection.value?.id === collectionToDelete.value.id) {
      selectedCollection.value = null
      selectedDocument.value = null
    }

    showDeleteCollectionModal.value = false
    collectionToDelete.value = null

    // Refresh collections list
    await refreshCollections()
  } catch (error) {
    console.error('Failed to delete collection:', error)
  } finally {
    isDeletingCollection.value = false
  }
}

const cancelDeleteCollection = () => {
  showDeleteCollectionModal.value = false
  collectionToDelete.value = null
}

// Click outside handler for collection menu
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-collection-menu]')) {
    showCollectionMenu.value = false
  }
}

const getDocumentId = (documentPath: string): string => {
  return documentPath.split('/').pop() || documentPath
}


const formatFieldValue = (value: any): string => {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return value.integerValue
  if (value.booleanValue !== undefined) return value.booleanValue.toString()
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.arrayValue !== undefined) {
    // For arrays, we'll show them in structured view, not as JSON
    const items = value.arrayValue.values || []
    return `Array (${items.length} items)`
  }
  if (value.mapValue !== undefined) return JSON.stringify(value.mapValue.fields, null, 2)
  if (value.referenceValue !== undefined) return value.referenceValue
  if (value.geoPointValue !== undefined) return `${value.geoPointValue.latitude}, ${value.geoPointValue.longitude}`
  if (value.bytesValue !== undefined) return value.bytesValue
  if (value.nullValue !== undefined) return 'null'
  return JSON.stringify(value, null, 2)
}

const getFieldType = (value: any): string => {
  if (value.stringValue !== undefined) return 'string'
  if (value.integerValue !== undefined) return 'number'
  if (value.booleanValue !== undefined) return 'boolean'
  if (value.timestampValue !== undefined) return 'timestamp'
  if (value.arrayValue !== undefined) return 'array'
  if (value.mapValue !== undefined) return 'map'
  if (value.referenceValue !== undefined) return 'reference'
  if (value.geoPointValue !== undefined) return 'geopoint'
  if (value.bytesValue !== undefined) return 'bytes'
  if (value.nullValue !== undefined) return 'null'
  return 'unknown'
}

const toggleMapField = (fieldName: string) => {
  if (expandedMapFields.value.has(fieldName)) {
    expandedMapFields.value.delete(fieldName)
  } else {
    expandedMapFields.value.add(fieldName)
  }
}

const isMapFieldExpanded = (fieldName: string): boolean => {
  return expandedMapFields.value.has(fieldName)
}


const handleDeleteField = (fieldPath: string, displayName: string) => {
  fieldToDelete.value = { path: fieldPath, displayName }
  showDeleteFieldModal.value = true
}

const confirmDeleteField = async () => {
  if (!fieldToDelete.value || !selectedDocument.value || !selectedCollection.value) return

  try {
    isDeletingField.value = true

    // Create a copy of the document fields
    const updatedFields = { ...selectedDocument.value.fields }

    // Handle different types of field deletion
    const fieldPath = fieldToDelete.value.path

    // Check if it's an array item deletion (contains [index])
    const arrayMatch = fieldPath.match(/^([^[]+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, arrayFieldName, indexStr] = arrayMatch
      const index = parseInt(indexStr)

      if (updatedFields[arrayFieldName]?.arrayValue?.values) {
        const newArray = JSON.parse(JSON.stringify(updatedFields[arrayFieldName]))
        newArray.arrayValue.values.splice(index, 1) // Remove item at index
        updatedFields[arrayFieldName] = newArray
      } else {
        throw new Error('Array field not found or invalid')
      }
    } else {
      // Handle regular field deletion
      const pathParts = fieldPath.split('.')
      if (pathParts.length === 1) {
        // Root level field
        delete updatedFields[pathParts[0]]
      } else {
        // Nested field - navigate to the parent and delete the child
        let current = updatedFields
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (current[pathParts[i]]?.mapValue?.fields) {
            current = current[pathParts[i]].mapValue.fields
          } else {
            throw new Error('Invalid field path')
          }
        }
        delete current[pathParts[pathParts.length - 1]]
      }
    }

    // Update the document with the new fields
    await firestoreStore.updateDocument(
      currentProjectId.value,
      selectedCollection.value.id,
      getDocumentId(selectedDocument.value.name),
      { fields: updatedFields }
    )

    // Save expanded state before refresh
    const expandedFieldsCopy = new Set(expandedMapFields.value)

    // Refresh the document to show updated fields
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)

    // Reselect the current document to update the display
    const docs = documents.value
    const currentDocId = getDocumentId(selectedDocument.value.name)
    const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
    if (foundDoc) {
      selectDocument(foundDoc)
      // Restore expanded state after deletion
      expandedMapFields.value = expandedFieldsCopy
    }

    showDeleteFieldModal.value = false
    fieldToDelete.value = null
  } catch (error) {
    console.error('Failed to delete field:', error)
  } finally {
    isDeletingField.value = false
  }
}

const cancelDeleteField = () => {
  showDeleteFieldModal.value = false
  fieldToDelete.value = null
}

const handleEditField = (fieldPath: string, fieldName: string, fieldValue: any) => {
  fieldToEdit.value = {
    path: fieldPath,
    fieldName,
    fieldValue,
    isNew: false
  }

  // Initialize edit form with current values
  editFieldName.value = fieldName
  editFieldType.value = getFieldType(fieldValue)
  editFieldValue.value = getEditableValue(fieldValue)

  showFieldEditor.value = true
}

const handleAddToMap = (fieldPath: string) => {
  fieldToEdit.value = {
    path: `${fieldPath}.newField`,
    fieldName: 'newField',
    fieldValue: { stringValue: '' },
    isNew: true,
    parentPath: fieldPath
  }

  // Initialize edit form for new field
  editFieldName.value = 'newField'
  editFieldType.value = 'string'
  editFieldValue.value = ''

  showFieldEditor.value = true
}

const handleAddToArray = (fieldPath: string) => {
  fieldToEdit.value = {
    path: `${fieldPath}[new]`,
    fieldName: 'newItem',
    fieldValue: { stringValue: '' },
    isNew: true,
    parentPath: fieldPath
  }

  // Initialize edit form for new array item
  editFieldName.value = 'newItem' // This won't be shown since we're adding to array
  editFieldType.value = 'string'
  editFieldValue.value = ''

  showFieldEditor.value = true
}


const cancelFieldEditor = () => {
  showFieldEditor.value = false
  fieldToEdit.value = null
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showFieldEditor.value) {
      cancelFieldEditor()
    }
  }
}

const getEditableValue = (firestoreValue: any): any => {
  if (firestoreValue.stringValue !== undefined) return firestoreValue.stringValue
  if (firestoreValue.integerValue !== undefined) return Number(firestoreValue.integerValue)
  if (firestoreValue.booleanValue !== undefined) return firestoreValue.booleanValue
  if (firestoreValue.timestampValue !== undefined) return firestoreValue.timestampValue
  if (firestoreValue.referenceValue !== undefined) return firestoreValue.referenceValue
  if (firestoreValue.nullValue !== undefined) return null
  if (firestoreValue.geoPointValue !== undefined) return `${firestoreValue.geoPointValue.latitude},${firestoreValue.geoPointValue.longitude}`
  return ''
}

const createFirestoreValue = (type: string, value: any): any => {
  switch (type) {
    case 'string':
      return { stringValue: String(value) }
    case 'number':
      return { integerValue: String(Number(value)) }
    case 'boolean':
      return { booleanValue: Boolean(value) }
    case 'null':
      return { nullValue: null }
    case 'timestamp':
      return { timestampValue: value }
    case 'reference':
      return { referenceValue: String(value) }
    case 'geopoint': {
      const [lat, lng] = String(value).split(',').map(v => Number(v.trim()))
      return { geoPointValue: { latitude: lat || 0, longitude: lng || 0 } }
    }
    case 'map':
      return { mapValue: { fields: {} } }
    case 'array':
      return { arrayValue: { values: [] } }
    default:
      return { stringValue: String(value) }
  }
}

const handleTypeChange = () => {
  // Reset value when type changes
  if (editFieldType.value === 'null') {
    editFieldValue.value = null
  } else if (editFieldType.value === 'boolean') {
    editFieldValue.value = false
  } else if (editFieldType.value === 'number') {
    editFieldValue.value = 0
  } else {
    editFieldValue.value = ''
  }
}

const isAddingToArray = (): boolean => {
  if (!fieldToEdit.value?.parentPath) return false

  // Check if we're adding to an array by looking at the parent field type
  const parentPath = fieldToEdit.value.parentPath
  if (!selectedDocument.value?.fields) return false

  // For root level arrays
  if (!parentPath.includes('.') && !parentPath.includes('[')) {
    const parentField = selectedDocument.value.fields[parentPath]
    return parentField?.arrayValue !== undefined
  }

  // For nested arrays (basic check)
  return parentPath.includes('[') || false
}

const getModalTitle = (): string => {
  if (!fieldToEdit.value) return 'Edit field'

  if (fieldToEdit.value.isNew) {
    if (isAddingToArray()) {
      return 'Add item to array'
    } else {
      return 'Add field'
    }
  } else {
    return 'Edit field'
  }
}

const saveFieldEdit = async () => {
  if (!fieldToEdit.value || !selectedDocument.value || !selectedCollection.value) return

  try {
    const updatedFields = { ...selectedDocument.value.fields }
    const firestoreValue = createFirestoreValue(editFieldType.value, editFieldValue.value)
    const path = fieldToEdit.value.path

    if (fieldToEdit.value.isNew) {
      // Handle adding new field
      if (fieldToEdit.value.parentPath) {
        const parentPath = fieldToEdit.value.parentPath

        if (parentPath.includes('[') && parentPath.includes(']')) {
          // Adding to a nested array (not implemented yet)
          console.log('Adding to nested array not fully implemented')
        } else if (parentPath.includes('.')) {
          // Adding to a nested map field
          const pathParts = parentPath.split('.')
          let current = updatedFields

          // Navigate to the target map
          for (const part of pathParts) {
            if (current[part]?.mapValue?.fields) {
              current = current[part].mapValue.fields
            }
          }

          // Add the new field to the map
          current[editFieldName.value] = firestoreValue
        } else {
          // Adding to root level array or map
          if (updatedFields[parentPath]?.arrayValue?.values) {
            // Adding to array - append new item
            const newArray = JSON.parse(JSON.stringify(updatedFields[parentPath]))
            newArray.arrayValue.values.push(firestoreValue)
            updatedFields[parentPath] = newArray
          } else if (updatedFields[parentPath]?.mapValue?.fields) {
            // Adding to map - add new field
            const newMap = JSON.parse(JSON.stringify(updatedFields[parentPath]))
            newMap.mapValue.fields[editFieldName.value] = firestoreValue
            updatedFields[parentPath] = newMap
          }
        }
      } else {
        // Adding to root level
        updatedFields[editFieldName.value] = firestoreValue
      }
    } else {
      // Handle editing existing field
      if (path.includes('[') && path.includes(']')) {
        // Array item editing
        const match = path.match(/^([^[]+)\[(\d+)\]$/)
        if (match) {
          const [, arrayFieldName, indexStr] = match
          const index = parseInt(indexStr)

          if (updatedFields[arrayFieldName]?.arrayValue?.values) {
            // Deep clone the array
            const newArray = JSON.parse(JSON.stringify(updatedFields[arrayFieldName]))
            newArray.arrayValue.values[index] = firestoreValue
            updatedFields[arrayFieldName] = newArray
          }
        }
      } else if (path.includes('.')) {
        // Nested field editing (for maps)
        const pathParts = path.split('.')
        let current = updatedFields

        // Navigate to parent
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (current[pathParts[i]]?.mapValue?.fields) {
            current = current[pathParts[i]].mapValue.fields
          }
        }

        // Update the field
        const finalKey = pathParts[pathParts.length - 1]
        current[finalKey] = firestoreValue
      } else {
        // Root level field
        updatedFields[path] = firestoreValue
      }
    }

    // Update the document
    await firestoreStore.updateDocument(
      currentProjectId.value,
      selectedCollection.value.id,
      getDocumentId(selectedDocument.value.name),
      { fields: updatedFields }
    )

    // Save expanded state before refresh
    const expandedFieldsCopy = new Set(expandedMapFields.value)

    // Refresh and reselect document
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    const docs = documents.value
    const currentDocId = getDocumentId(selectedDocument.value.name)
    const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
    if (foundDoc) {
      selectDocument(foundDoc)
      // Restore expanded state after editing/adding
      expandedMapFields.value = expandedFieldsCopy
    }

    showFieldEditor.value = false
    fieldToEdit.value = null
  } catch (error) {
    console.error('Failed to save field:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await refreshCollections()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.h-screen-header {
  height: calc(100vh - 130px); /* Adjust based on header height */
}
</style>