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
              @click="handleShowAddFieldModal"
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
                  v-for="(subValue, subFieldName) in (value.mapValue.fields || {})"
                  :key="`${fieldName}.${subFieldName}`"
                  class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div class="flex items-center min-w-0 flex-1">
                    <!-- Nested map and array support -->
                    <button
                      v-if="getFieldType(subValue) === 'map' || getFieldType(subValue) === 'array'"
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

                    <!-- For non-map/array fields, show the value -->
                    <span
                      v-if="getFieldType(subValue) !== 'map' && getFieldType(subValue) !== 'array'"
                      class="text-gray-900 dark:text-white font-mono truncate"
                    >
                      "{{ formatFieldValue(subValue) }}"
                    </span>

                    <!-- For map fields, show map indicator -->
                    <span
                      v-else-if="getFieldType(subValue) === 'map'"
                      class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                    >
                      {{ Object.keys(subValue.mapValue.fields || {}).length }} fields
                    </span>

                    <!-- For array fields, show array indicator -->
                    <span
                      v-else-if="getFieldType(subValue) === 'array'"
                      class="text-gray-500 dark:text-gray-400 font-mono text-xs"
                    >
                      {{ (subValue.arrayValue.values || []).length }} items
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
                  v-for="(subValue, subFieldName) in (value.mapValue.fields || {})"
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

                <!-- Second level nested array expansion -->
                <template
                  v-for="(subValue, subFieldName) in (value.mapValue.fields || {})"
                  :key="`${fieldName}.${subFieldName}.array`"
                >
                  <div
                    v-if="getFieldType(subValue) === 'array' && isMapFieldExpanded(`${fieldName}.${subFieldName}`)"
                    class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
                  >
                    <div
                      v-for="(arrayItem, arrayIndex) in (subValue.arrayValue.values || [])"
                      :key="`${fieldName}.${subFieldName}[${arrayIndex}]`"
                      class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div class="flex items-center min-w-0 flex-1">
                        <!-- Toggle button for nested maps/arrays in array -->
                        <button
                          v-if="getFieldType(arrayItem) === 'map' || getFieldType(arrayItem) === 'array'"
                          @click="toggleMapField(`${fieldName}.${subFieldName}[${arrayIndex}]`)"
                          class="p-0.5 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                        >
                          <ChevronRightIcon
                            :class="[
                              'w-3 h-3 transition-transform duration-200',
                              isMapFieldExpanded(`${fieldName}.${subFieldName}[${arrayIndex}]`) ? 'rotate-90' : ''
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

                      <!-- Hover Actions for nested array items -->
                      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          v-if="getFieldType(arrayItem) === 'map' || getFieldType(arrayItem) === 'array'"
                          @click="getFieldType(arrayItem) === 'map' ? handleAddToMap(`${fieldName}.${subFieldName}[${arrayIndex}]`) : handleAddToArray(`${fieldName}.${subFieldName}[${arrayIndex}]`)"
                          class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors duration-150"
                          :title="getFieldType(arrayItem) === 'map' ? 'Add field to map' : 'Add item to array'"
                        >
                          <PlusIcon class="w-3 h-3" />
                        </button>
                        <button
                          v-else
                          @click="handleEditField(`${fieldName}.${subFieldName}[${arrayIndex}]`, `[${arrayIndex}]`, arrayItem)"
                          class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors duration-150"
                          title="Edit item"
                        >
                          <PencilIcon class="w-3 h-3" />
                        </button>
                        <button
                          @click="handleDeleteField(`${fieldName}.${subFieldName}[${arrayIndex}]`, `${fieldName}.${subFieldName}[${arrayIndex}]`)"
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

    <!-- Unified Field Modal -->
    <FieldModal
      v-model="showFieldModal"
      :mode="fieldModalMode"
      :initial-field-name="fieldModalData.fieldName"
      :initial-field-type="fieldModalData.fieldType"
      :initial-field-value="fieldModalData.fieldValue"
      :field-path="fieldModalData.fieldPath"
      :is-new-field="fieldModalData.isNew"
      :parent-path="fieldModalData.parentPath"
      @save="handleFieldModalSave"
      @close="handleFieldModalClose"
    />
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
import FieldModal from '@/components/firestore/FieldModal.vue'
import StartCollectionModal from '@/components/firestore/StartCollectionModal.vue'
import { createFirestoreValue } from '@/utils/fieldUtils'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Reactive state
const showCreateCollectionModal = ref(false)
const showAddDocumentModal = ref(false)
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

// Unified field modal state
const showFieldModal = ref(false)
const fieldModalMode = ref<'add' | 'edit'>('add')
const fieldModalData = ref({
  fieldName: '',
  fieldType: 'string',
  fieldValue: '',
  fieldPath: '',
  isNew: false,
  parentPath: ''
})

// Legacy field editor state (still needed for some functions)
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
    // Arrays should not be formatted as string values - they should use the structured view
    const items = value.arrayValue.values || []
    return `${items.length} items`
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
  fieldModalMode.value = 'edit'
  fieldModalData.value = {
    fieldName,
    fieldType: getFieldType(fieldValue),
    fieldValue: getEditableValue(fieldValue),
    fieldPath,
    isNew: false,
    parentPath: ''
  }
  showFieldModal.value = true
}

const handleAddToMap = (fieldPath: string) => {
  fieldModalMode.value = 'add'
  fieldModalData.value = {
    fieldName: '',
    fieldType: 'string',
    fieldValue: '',
    fieldPath: `${fieldPath}.newField`,
    isNew: true,
    parentPath: fieldPath
  }
  showFieldModal.value = true
}

const handleAddToArray = (fieldPath: string) => {
  fieldModalMode.value = 'add'
  fieldModalData.value = {
    fieldName: '', // Array items don't need field names
    fieldType: 'string',
    fieldValue: '',
    fieldPath: `${fieldPath}[new]`,
    isNew: true,
    parentPath: fieldPath
  }
  showFieldModal.value = true
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

// Lifecycle

// Unified Field Modal handlers
const handleShowAddFieldModal = () => {
  fieldModalMode.value = 'add'
  fieldModalData.value = {
    fieldName: '',
    fieldType: 'string',
    fieldValue: '',
    fieldPath: '',
    isNew: true,
    parentPath: ''
  }
  showFieldModal.value = true
}

const handleFieldModalSave = async (data: {
  fieldName: string
  fieldType: string
  fieldValue: any
  fieldPath?: string
  isNewField?: boolean
  parentPath?: string
}) => {
  if (!selectedDocument.value || !selectedCollection.value) return

  try {
    if (fieldModalMode.value === 'add') {
      // Handle add field
      const firestoreValue = createFirestoreValue(data.fieldType, data.fieldValue)
      const updatedFields = { ...selectedDocument.value.fields }

      if (data.parentPath) {
        // Check if adding to an array or map
        if (data.fieldPath?.includes('[new]')) {
          // Adding to an array
          const pathParts = data.parentPath.split('.')
          let current = updatedFields

          // Navigate to the array
          for (let i = 0; i < pathParts.length - 1; i++) {
            if (current[pathParts[i]]?.mapValue?.fields) {
              current = current[pathParts[i]].mapValue.fields
            }
          }

          const arrayFieldName = pathParts[pathParts.length - 1]
          if (current[arrayFieldName]?.arrayValue?.values) {
            // Add the new item to the array
            const newArray = JSON.parse(JSON.stringify(current[arrayFieldName]))
            newArray.arrayValue.values.push(firestoreValue)
            current[arrayFieldName] = newArray
          }
        } else {
          // Adding to a nested map
          const pathParts = data.parentPath.split('.')
          let current = updatedFields

          // Navigate to the target map
          for (const part of pathParts) {
            if (current[part]?.mapValue?.fields) {
              current = current[part].mapValue.fields
            }
          }

          // Add the new field to the map
          current[data.fieldName] = firestoreValue
        }
      } else {
        // Adding to root document
        updatedFields[data.fieldName] = firestoreValue
      }

      await firestoreStore.updateDocument(
        currentProjectId.value,
        selectedCollection.value.id,
        getDocumentId(selectedDocument.value.name),
        { fields: updatedFields }
      )
    } else {
      // Handle edit field
      const firestoreValue = createFirestoreValue(data.fieldType, data.fieldValue)
      const updatedFields = { ...selectedDocument.value.fields }
      const fieldPath = data.fieldPath!

      // Handle different field path types
      if (fieldPath.includes('[') && fieldPath.includes(']')) {
        // Array item editing
        const match = fieldPath.match(/^([^[]+)\[(\d+)\]$/)
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
      } else if (fieldPath.includes('.')) {
        // Nested field editing (for maps)
        const pathParts = fieldPath.split('.')
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
        updatedFields[fieldPath] = firestoreValue
      }

      await firestoreStore.updateDocument(
        currentProjectId.value,
        selectedCollection.value.id,
        getDocumentId(selectedDocument.value.name),
        { fields: updatedFields }
      )
    }

    // Save expanded state before refresh
    const expandedFieldsCopy = new Set(expandedMapFields.value)

    // Refresh document
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    const docs = documents.value
    const currentDocId = getDocumentId(selectedDocument.value.name)
    const foundDoc = docs.find(doc => getDocumentId(doc.name) === currentDocId)
    if (foundDoc) {
      selectDocument(foundDoc)
      // Restore expanded state after refresh
      expandedMapFields.value = expandedFieldsCopy
    }

    showFieldModal.value = false
  } catch (error) {
    console.error('Failed to save field:', error)
  }
}

const handleFieldModalClose = () => {
  showFieldModal.value = false
}

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