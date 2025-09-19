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
        <button @click="navigateToRoot" class="text-blue-600 dark:text-blue-400 hover:underline">/</button>

        <!-- Show navigation path for subcollections -->
        <template v-if="isInSubcollectionMode">
          <template v-for="(segment, index) in navigationPath" :key="`${segment.type}-${segment.id}-${index}`">
            <ChevronRightIcon class="w-3 h-3 mx-1" />
            <button
              @click="navigateToSegment(index)"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ segment.name }}
            </button>
          </template>
          <!-- Show current subcollection document if selected -->
          <template v-if="selectedSubcollectionDocument">
            <ChevronRightIcon class="w-3 h-3 mx-1" />
            <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ getDocumentId(selectedSubcollectionDocument.name) }}</span>
          </template>
        </template>

        <!-- Show current selection for root mode -->
        <template v-else>
          <template v-if="selectedCollection">
            <ChevronRightIcon class="w-3 h-3 mx-1" />
            <button
              @click="navigateToCollection"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ selectedCollection.id }}
            </button>
          </template>
          <template v-if="selectedDocument">
            <ChevronRightIcon class="w-3 h-3 mx-1" />
            <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ getDocumentId(selectedDocument.name) }}</span>
          </template>
        </template>
      </div>
    </div>

    <!-- Sliding Panel Layout -->
    <div class="h-screen-header overflow-hidden">
      <div
        class="flex transition-transform duration-300 ease-in-out"
        :style="{ transform: `translateX(${slideOffset}%)` }"
      >
        <!-- Root Level (Level 0) -->
        <div class="flex-shrink-0 w-full flex">
          <!-- Root Collections -->
          <div class="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
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
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <!-- Root Documents -->
          <div :class="[
            'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto',
            selectedDocument ? 'w-1/3' : 'w-2/3'
          ]">
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
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <!-- Root Document Editor -->
          <div v-if="selectedDocument" class="w-1/3 bg-white dark:bg-gray-800 overflow-y-auto">
        <div class="p-4">
          <!-- Document Header -->
          <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
              <span class="text-gray-900 dark:text-white">{{ selectedDocument ? getDocumentId(selectedDocument.name) : 'Document' }}</span>
              <div v-if="selectedDocument" class="relative" data-document-menu>
                <button
                  @click="showDocumentMenu = !showDocumentMenu"
                  class="p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <EllipsisVerticalIcon class="w-3 h-3" />
                </button>
                <!-- Dropdown Menu -->
                <div
                  v-if="showDocumentMenu"
                  class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl min-w-[160px]"
                  @click.stop
                >
                  <button
                    @click="handleAddSimilarDocument"
                    class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
                  >
                    Clone document
                  </button>
                  <button
                    @click="handleDeleteAllFields"
                    class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
                  >
                    Clear all fields
                  </button>
                  <button
                    @click="handleDeleteDocument"
                    class="w-full px-3 py-2 text-left text-sm font-sans font-normal text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 rounded-lg"
                  >
                    Delete document
                  </button>
                </div>
              </div>
            </div>
            <div class="border-b border-gray-200 dark:border-gray-600"></div>
          </div>

          <div v-if="selectedCollection" class="mb-4">
            <button
              @click="handleStartSubcollection"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon class="w-3 h-3 mr-1" />
              Start collection
            </button>

            <!-- Display subcollections for current document -->
            <div v-if="selectedDocument && currentDocumentSubcollections.length > 0" class="mt-3 space-y-1">
              <div
                v-for="subcollection in currentDocumentSubcollections"
                :key="subcollection.id"
                class="group"
              >
                <button
                  @click="navigateToSubcollection(subcollection)"
                  class="flex items-center w-full px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRightIcon class="w-4 h-4 mr-1 flex-shrink-0" />
                  <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
                  <span class="truncate">{{ subcollection.id }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="selectedDocument" class="mb-4">
            <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
            <button
              @click="handleShowAddFieldModal"
              class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {{ Object.keys(value.mapValue.fields || {}).length }} fields
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
                <template
                  v-for="(subValue, subFieldName) in (value.mapValue.fields || {})"
                  :key="`${fieldName}.${subFieldName}`"
                >
                  <!-- Main sub-field -->
                  <div class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
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

                  <!-- Nested map expansion for this specific sub-field -->
                  <!-- Recursive nested content for second level maps and arrays -->
                  <div
                    v-if="(getFieldType(subValue) === 'map' || getFieldType(subValue) === 'array') && isMapFieldExpanded(`${fieldName}.${subFieldName}`)"
                    class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
                  >
                    <template v-if="getFieldType(subValue) === 'map'">
                      <RecursiveFieldViewer
                        v-for="(nestedValue, nestedFieldName) in subValue.mapValue.fields"
                        :key="nestedFieldName"
                        :field-name="nestedFieldName"
                        :field-value="nestedValue"
                        :field-path="`${fieldName}.${subFieldName}.${nestedFieldName}`"
                        :expanded-fields="expandedMapFields"
                        @toggle-field="toggleMapField"
                        @edit-field="(data) => handleEditField(data.path, data.fieldName, data.fieldValue)"
                        @delete-field="(data) => handleDeleteField(data.path, data.displayName)"
                        @add-to-map="handleAddToMap"
                        @add-to-array="handleAddToArray"
                      />
                    </template>
                    <template v-else-if="getFieldType(subValue) === 'array'">
                      <RecursiveFieldViewer
                        v-for="(arrayItem, arrayIndex) in subValue.arrayValue.values"
                        :key="arrayIndex"
                        :field-name="`[${arrayIndex}]`"
                        :field-value="arrayItem"
                        :field-path="`${fieldName}.${subFieldName}[${arrayIndex}]`"
                        :expanded-fields="expandedMapFields"
                        @toggle-field="toggleMapField"
                        @edit-field="(data) => handleEditField(data.path, data.fieldName, data.fieldValue)"
                        @delete-field="(data) => handleDeleteField(data.path, data.displayName)"
                        @add-to-map="handleAddToMap"
                        @add-to-array="handleAddToArray"
                      />
                    </template>
                  </div>

                </template>
              </div>

              <!-- Recursive array field expansion -->
              <div
                v-if="getFieldType(value) === 'array' && isMapFieldExpanded(fieldName)"
                class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
              >
                <RecursiveFieldViewer
                  v-for="(arrayItem, arrayIndex) in (value.arrayValue.values || [])"
                  :key="arrayIndex"
                  :field-name="`[${arrayIndex}]`"
                  :field-value="arrayItem"
                  :field-path="`${fieldName}[${arrayIndex}]`"
                  :expanded-fields="expandedMapFields"
                  @toggle-field="toggleMapField"
                  @edit-field="(data) => handleEditField(data.path, data.fieldName, data.fieldValue)"
                  @delete-field="(data) => handleDeleteField(data.path, data.displayName)"
                  @add-to-map="handleAddToMap"
                  @add-to-array="handleAddToArray"
                />
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

        <!-- Subcollection Level (Level 1) -->
        <div class="flex-shrink-0 w-full flex">
          <!-- Subcollection Details (was 3rd pane) -->
          <div class="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div class="p-4">
              <!-- Parent Document Header -->
              <div class="mb-3">
                <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
                  <span class="text-gray-900 dark:text-white">{{ selectedDocument ? getDocumentId(selectedDocument.name) : 'Parent Document' }}</span>
                </div>
                <div class="border-b border-gray-200 dark:border-gray-600"></div>
              </div>

              <!-- Start Collection Button -->
              <div v-if="selectedDocument" class="mb-4">
                <button
                  @click="handleStartSubcollection"
                  class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon class="w-3 h-3 mr-1" />
                  Start collection
                </button>
              </div>

              <!-- Display subcollections for current parent document -->
              <div v-if="selectedDocument && currentDocumentSubcollections.length > 0" class="mt-3 space-y-1">
                <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
                <div
                  v-for="subcollection in currentDocumentSubcollections"
                  :key="subcollection.id"
                  class="group"
                >
                  <button
                    @click="navigateToSubcollection(subcollection)"
                    :class="[
                      'flex items-center w-full px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors duration-200',
                      selectedSubcollection?.id === subcollection.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    ]"
                  >
                    <ChevronRightIcon class="w-4 h-4 mr-1 flex-shrink-0" />
                    <CircleStackIcon class="w-4 h-4 mr-2 flex-shrink-0" />
                    <span class="truncate">{{ subcollection.id }}</span>
                  </button>
                </div>
              </div>

              <!-- Add Field Button -->
              <div v-if="selectedSubcollectionDocument" class="mb-4">
                <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
                <button
                  @click="handleShowAddFieldModal"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon class="w-3 h-3 mr-1" />
                  Add field
                </button>
              </div>

              <!-- Subcollection Document Fields -->
              <div v-if="selectedSubcollectionDocument" class="space-y-1">
                <!-- Fields would be displayed here -->
              </div>

              <!-- No subcollection selected state -->
              <div v-if="!selectedSubcollection" class="text-center py-16">
                <CircleStackIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Subcollection details will be shown here
                </p>
              </div>
            </div>
          </div>

          <!-- Subcollection Documents (middle pane) -->
          <div class="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div class="p-4">
              <div class="mb-3">
                <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
                  <span class="text-gray-900 dark:text-white">{{ selectedSubcollection ? selectedSubcollection.id : 'Select a subcollection' }}</span>
                </div>
                <div class="border-b border-gray-200 dark:border-gray-600 mt-3"></div>
              </div>

              <!-- Add Document Button -->
              <div v-if="selectedSubcollection" class="mb-4">
                <button
                  @click="showAddDocumentModal = true"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon class="w-3 h-3 mr-1" />
                  Add document
                </button>
              </div>

              <!-- Subcollection Documents List -->
              <div v-if="selectedSubcollection && subcollectionDocuments.length > 0" class="space-y-1">
                <div
                  v-for="document in subcollectionDocuments"
                  :key="document.name"
                  :class="[
                    'flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-200',
                    selectedSubcollectionDocument?.name === document.name
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]"
                  @click="selectSubcollectionDocument(document)"
                >
                  <span class="truncate">{{ getDocumentId(document.name) }}</span>
                </div>
              </div>

              <!-- Empty subcollection documents state -->
              <div
                v-else-if="selectedSubcollection && subcollectionDocuments.length === 0"
                class="text-center py-8"
              >
                <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No documents in this subcollection
                </p>
                <button
                  @click="showAddDocumentModal = true"
                  class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                >
                  <PlusIcon class="w-4 h-4 mr-2" />
                  Add your first document
                </button>
              </div>

              <!-- No subcollection selected placeholder -->
              <div
                v-else
                class="text-center py-16"
              >
                <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Select a subcollection to view its documents
                </p>
              </div>
            </div>
          </div>

          <!-- New Document Editor (3rd pane) -->
          <div class="w-1/3 bg-white dark:bg-gray-800 overflow-y-auto">
            <div class="p-4">
              <!-- Subcollection Document Header -->
              <div class="mb-3">
                <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono mb-3">
                  <span class="text-gray-900 dark:text-white">{{ selectedSubcollectionDocument ? getDocumentId(selectedSubcollectionDocument.name) : 'Select a document' }}</span>
                </div>
                <div class="border-b border-gray-200 dark:border-gray-600"></div>
              </div>

              <!-- Start Collection Button -->
              <div v-if="selectedSubcollectionDocument" class="mb-4">
                <button
                  @click="handleStartSubcollection"
                  class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon class="w-3 h-3 mr-1" />
                  Start collection
                </button>
              </div>

              <!-- Add Field Button -->
              <div v-if="selectedSubcollectionDocument" class="mb-4">
                <div class="border-b border-gray-200 dark:border-gray-600 mb-3"></div>
                <button
                  @click="handleShowAddFieldModal"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon class="w-3 h-3 mr-1" />
                  Add field
                </button>
              </div>

              <!-- Subcollection Document Fields -->
              <div v-if="selectedSubcollectionDocument" class="space-y-1">
                <template v-for="(value, fieldName) in selectedSubcollectionDocument.fields" :key="fieldName">
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
                        {{ Object.keys(value.mapValue.fields || {}).length }} fields
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

                  <!-- Expanded fields (maps/arrays) for subcollection documents -->
                  <div
                    v-if="getFieldType(value) === 'map' && isMapFieldExpanded(fieldName)"
                    class="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3"
                  >
                    <template
                      v-for="(subValue, subFieldName) in (value.mapValue.fields || {})"
                      :key="`${fieldName}.${subFieldName}`"
                    >
                      <div class="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        <div class="flex items-center min-w-0 flex-1">
                          <div class="w-4 mr-1"></div>
                          <span class="text-blue-600 dark:text-blue-400 font-mono mr-1">{{ subFieldName }}:</span>
                          <span class="text-gray-900 dark:text-white font-mono truncate">
                            "{{ formatFieldValue(subValue) }}"
                          </span>
                        </div>
                        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ getFieldType(subValue) }}</span>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </div>

              <!-- No subcollection document selected state -->
              <div
                v-else
                class="text-center py-16"
              >
                <PencilIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Select a subcollection document to view its fields
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Start Collection Modal -->
    <StartCollectionModal
      v-model="showCreateCollectionModal"
      :project-id="currentProjectId"
      :parent-document-path="currentDocumentPath"
      @created="handleCollectionCreated"
    />

    <!-- Add Document Modal -->
    <AddDocumentModal
      v-model="showAddDocumentModal"
      :project-id="currentProjectId"
      :collection-id="selectedCollection?.id || ''"
      :clone-document="cloneDocumentData"
      @created="handleDocumentCreated"
      @close="cloneDocumentData = null"
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

    <!-- Delete Document Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteDocumentModal"
      title="Delete Document"
      :message="`Are you sure you want to delete document '${documentToDelete ? getDocumentId(documentToDelete.name) : ''}'?`"
      confirm-label="Delete Document"
      :is-loading="isDeletingDocument"
      :details="{
        title: 'What will happen:',
        description: 'The document will be permanently deleted. This action cannot be undone.'
      }"
      @confirm="confirmDeleteDocument"
      @cancel="cancelDeleteDocument"
    />

    <!-- Delete All Fields Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteAllFieldsModal"
      title="Delete All Fields"
      :message="`Are you sure you want to delete all fields from document '${selectedDocument ? getDocumentId(selectedDocument.name) : ''}'?`"
      confirm-label="Delete All Fields"
      :is-loading="isDeletingAllFields"
      :details="{
        title: 'What will happen:',
        description: 'All fields in the document will be deleted, leaving an empty document. This action cannot be undone.'
      }"
      @confirm="confirmDeleteAllFields"
      @cancel="cancelDeleteAllFields"
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
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
import firestoreApi from '@/api/firestore'
import type { FirestoreDocument, FirestoreCollectionWithMetadata } from '@/types'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import FieldModal from '@/components/firestore/FieldModal.vue'
import StartCollectionModal from '@/components/firestore/StartCollectionModal.vue'
import AddDocumentModal from '@/components/firestore/AddDocumentModal.vue'
import RecursiveFieldViewer from '@/components/firestore/RecursiveFieldViewer.vue'
import { createFirestoreValue } from '@/utils/fieldUtils'

const route = useRoute()
const firestoreStore = useFirestoreStore()

// Reactive state
const showCreateCollectionModal = ref(false)
const showAddDocumentModal = ref(false)
const cloneDocumentData = ref<FirestoreDocument | null>(null)
const showCollectionMenu = ref(false)
const showDeleteCollectionModal = ref(false)
const isDeletingCollection = ref(false)
const collectionToDelete = ref<FirestoreCollectionWithMetadata | null>(null)
const showDocumentMenu = ref(false)
const showDeleteDocumentModal = ref(false)
const isDeletingDocument = ref(false)
const documentToDelete = ref<FirestoreDocument | null>(null)
const showDeleteAllFieldsModal = ref(false)
const isDeletingAllFields = ref(false)
const selectedCollection = ref<FirestoreCollectionWithMetadata | null>(null)
const selectedDocument = ref<FirestoreDocument | null>(null)
const expandedMapFields = ref<Set<string>>(new Set())
const showDeleteFieldModal = ref(false)
const isDeletingField = ref(false)
const fieldToDelete = ref<{ path: string; displayName: string } | null>(null)

// Subcollection navigation state
const slideOffset = ref(0)
const navigationPath = ref<Array<{type: 'collection' | 'document', id: string, name: string}>>([])
const currentSubcollections = ref<FirestoreCollectionWithMetadata[]>([])
const selectedSubcollection = ref<FirestoreCollectionWithMetadata | null>(null)
const selectedSubcollectionDocument = ref<FirestoreDocument | null>(null)
const subcollectionDocuments = ref<FirestoreDocument[]>([])
// Track subcollections by document path
const documentSubcollections = ref<Map<string, FirestoreCollectionWithMetadata[]>>(new Map())

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

// Computed properties
const currentProjectId = computed(() => route.params.projectId as string)

const collections = computed(() => firestoreStore.collections)
const documents = computed(() => {
  if (!selectedCollection.value) return []
  return firestoreStore.getDocumentsByCollection(selectedCollection.value.id)
})

const currentDocumentPath = computed(() => {
  if (!selectedDocument.value || !selectedCollection.value) return undefined
  const databasePath = `projects/${currentProjectId.value}/databases/(default)`
  return `${databasePath}/documents/${selectedCollection.value.id}/${getDocumentId(selectedDocument.value.name)}`
})

const isInSubcollectionMode = computed(() => {
  return navigationPath.value.length > 0
})

const currentDocumentSubcollections = computed(() => {
  if (!selectedDocument.value || !currentDocumentPath.value) return []
  return documentSubcollections.value.get(currentDocumentPath.value) || []
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

const selectDocument = async (document: FirestoreDocument) => {
  selectedDocument.value = document
  expandedMapFields.value.clear()

  // Load subcollections for the selected document
  await loadDocumentSubcollections(document)
}

// Load subcollections for a specific document from the API
const loadDocumentSubcollections = async (document: FirestoreDocument) => {
  if (!currentDocumentPath.value) return

  try {
    console.log('Loading subcollections for document:', document.name)
    const subcollections = await firestoreStore.loadSubcollections(document.name)

    // Update local state with fetched subcollections
    documentSubcollections.value.set(currentDocumentPath.value, subcollections)

    console.log('Loaded subcollections for document:', subcollections)
  } catch (error) {
    console.error('Failed to load subcollections for document:', error)
    // Set empty array on error
    documentSubcollections.value.set(currentDocumentPath.value, [])
  }
}

const handleCollectionCreated = async (collectionId: string) => {
  // Check if we're creating a subcollection (when we have a selected document)
  if (selectedDocument.value && selectedCollection.value) {
    // This is a subcollection creation
    console.log('Creating subcollection:', collectionId)

    // Set up navigation path to track where we are
    navigationPath.value = [
      { type: 'collection', id: selectedCollection.value.id, name: selectedCollection.value.id },
      { type: 'document', id: getDocumentId(selectedDocument.value.name), name: getDocumentId(selectedDocument.value.name) }
    ]

    // Add the subcollection to our local state
    const newSubcollection: FirestoreCollectionWithMetadata = {
      id: collectionId,
      name: `${currentDocumentPath.value}/${collectionId}`,
      path: `${currentDocumentPath.value}/${collectionId}`,
      documentCount: 1,
      isExpanded: false,
      statistics: {
        name: `${currentDocumentPath.value}/${collectionId}`,
        documentCount: 1,
        totalSize: 0,
        lastModified: new Date()
      }
    }

    currentSubcollections.value = [newSubcollection]

    // Refresh subcollections list from the API after creation
    if (selectedDocument.value) {
      await loadDocumentSubcollections(selectedDocument.value)
    }

    // Auto-select the newly created subcollection
    selectedSubcollection.value = newSubcollection

    // Load documents for the newly created subcollection
    await loadSubcollectionDocuments(newSubcollection.path)

    // Trigger slide to subcollection view
    slideToSubcollectionLevel()

  } else {
    // This is a root-level collection creation
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
}

const handleDocumentCreated = async (documentId: string) => {
  // Refresh documents in the current collection
  if (selectedCollection.value) {
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)
    // Wait for reactivity to update documents
    await nextTick()
    // Auto-select the newly created document
    const docs = documents.value
    const newDocument = docs.find(doc => getDocumentId(doc.name) === documentId)
    if (newDocument) {
      selectDocument(newDocument)
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

// Sliding navigation functions
const slideToSubcollectionLevel = () => {
  slideOffset.value = -100 // Slide one full width to the left (in percentage)
}

const slideToRootLevel = () => {
  slideOffset.value = 0
}

const navigateToRoot = () => {
  navigationPath.value = []
  currentSubcollections.value = []
  selectedSubcollection.value = null
  selectedSubcollectionDocument.value = null
  subcollectionDocuments.value = []
  // Clear collection and document selections to make middle and right panes blank
  selectedCollection.value = null
  selectedDocument.value = null
  // Don't clear documentSubcollections - we want to preserve them when navigating
  slideToRootLevel()
}

const navigateToCollection = () => {
  // Clear document selection to show only collection (2 panes)
  selectedDocument.value = null
  // Clear subcollection state
  navigationPath.value = []
  currentSubcollections.value = []
  selectedSubcollection.value = null
  selectedSubcollectionDocument.value = null
  subcollectionDocuments.value = []
  slideToRootLevel()
}

const navigateToSegment = async (segmentIndex: number) => {
  const segment = navigationPath.value[segmentIndex]

  if (segment.type === 'collection') {
    // If clicking on the root collection (index 0), go to root level
    if (segmentIndex === 0) {
      // Clear subcollection state but keep root level state
      navigationPath.value = []
      currentSubcollections.value = []
      selectedSubcollection.value = null
      selectedSubcollectionDocument.value = null
      subcollectionDocuments.value = []
      selectedDocument.value = null // Clear document to make right pane blank
      slideToRootLevel()

      // Find and select the collection
      const collection = collections.value.find(c => c.id === segment.id)
      if (collection) {
        await selectCollection(collection)
      }
    } else {
      // For subcollections, navigate to that specific level
      // Truncate navigation path to the clicked segment
      navigationPath.value = navigationPath.value.slice(0, segmentIndex + 1)

      // Clear state beyond this level
      selectedSubcollectionDocument.value = null

      // Load the subcollection at this level
      const parentDocument = navigationPath.value[segmentIndex - 1]
      if (parentDocument && parentDocument.type === 'document') {
        // Build the subcollection path up to this point
        let subcollectionPath = `projects/${firestoreStore.projectId}/databases/(default)/documents`
        for (let i = 0; i < segmentIndex; i += 2) {
          const col = navigationPath.value[i]
          const doc = navigationPath.value[i + 1]
          if (col && doc) {
            subcollectionPath += `/${col.id}/${doc.id}`
          }
        }
        subcollectionPath += `/${segment.id}`

        // Load documents for this subcollection
        await loadSubcollectionDocuments(subcollectionPath)
        selectedSubcollection.value = { id: segment.id, path: subcollectionPath }
      }
    }
  } else if (segment.type === 'document') {
    // Truncate navigation path to include this document
    navigationPath.value = navigationPath.value.slice(0, segmentIndex + 1)

    // Clear state beyond this level
    selectedSubcollectionDocument.value = null
    currentSubcollections.value = []
    selectedSubcollection.value = null

    // If this is a root-level document
    if (segmentIndex === 1) {
      const collectionSegment = navigationPath.value[0]
      if (collectionSegment && collectionSegment.type === 'collection') {
        const collection = collections.value.find(c => c.id === collectionSegment.id)
        if (collection) {
          await selectCollection(collection)
          await nextTick()
          const docs = documents.value
          const document = docs.find(doc => getDocumentId(doc.name) === segment.id)
          if (document) {
            selectDocument(document)
          }
        }
      }
    } else {
      // For subcollection documents, load the document and its subcollections
      const parentCollectionSegment = navigationPath.value[segmentIndex - 1]
      if (parentCollectionSegment && parentCollectionSegment.type === 'collection') {
        // Build document path
        let documentPath = `projects/${firestoreStore.projectId}/databases/(default)/documents`
        for (let i = 0; i < segmentIndex; i += 2) {
          const col = navigationPath.value[i]
          const doc = navigationPath.value[i + 1]
          if (col && doc) {
            documentPath += `/${col.id}/${doc.id}`
          }
        }

        // Load subcollections for this document
        const subcollections = await firestoreStore.loadSubcollections(documentPath)
        currentSubcollections.value = subcollections
        selectedSubcollectionDocument.value = { id: segment.id, path: documentPath }
      }
    }
  }
}

// Subcollection document management
const loadSubcollectionDocuments = async (subcollectionPath: string) => {
  try {
    console.log('Loading documents for subcollection:', subcollectionPath)

    // Extract collection ID from path (last part after the last slash)
    const pathParts = subcollectionPath.split('/')
    const collectionId = pathParts[pathParts.length - 1]

    // For subcollections, we need to construct the parent path differently
    // The subcollectionPath is like: projects/x/databases/(default)/documents/collection-1/doc-id/subcollection-id
    // We need to remove the subcollection-id and call the API with: projects/x/databases/(default)/documents/collection-1/doc-id
    const parentDocumentPath = pathParts.slice(0, -1).join('/')

    console.log('Subcollection parent document path:', parentDocumentPath, 'Collection ID:', collectionId)

    // Use the dedicated API method for subcollection documents
    const response = await firestoreApi.listSubcollectionDocuments(parentDocumentPath, collectionId)
    subcollectionDocuments.value = response.documents

    console.log('Loaded subcollection documents:', response.documents)

    // Auto-select the first document
    if (subcollectionDocuments.value.length > 0) {
      selectedSubcollectionDocument.value = subcollectionDocuments.value[0]
    } else {
      selectedSubcollectionDocument.value = null
    }
  } catch (error) {
    console.error('Failed to load subcollection documents:', error)
    subcollectionDocuments.value = []
    selectedSubcollectionDocument.value = null
  }
}

const selectSubcollectionDocument = (document: FirestoreDocument) => {
  selectedSubcollectionDocument.value = document
}

const navigateToSubcollection = async (subcollection: FirestoreCollectionWithMetadata) => {
  // Update navigation path to include the subcollection
  if (selectedCollection.value && selectedDocument.value) {
    navigationPath.value = [
      { type: 'collection', id: selectedCollection.value.id, name: selectedCollection.value.id },
      { type: 'document', id: getDocumentId(selectedDocument.value.name), name: getDocumentId(selectedDocument.value.name) },
      { type: 'collection', id: subcollection.id, name: subcollection.id }
    ]
  }

  // Set up the subcollection navigation
  selectedSubcollection.value = subcollection
  currentSubcollections.value = [subcollection]

  // Load documents for the subcollection
  await loadSubcollectionDocuments(subcollection.path)

  // Trigger slide to subcollection view
  slideToSubcollectionLevel()
}

// Document handlers
const handleAddSimilarDocument = () => {
  showDocumentMenu.value = false
  if (selectedDocument.value) {
    cloneDocumentData.value = selectedDocument.value
    showAddDocumentModal.value = true
  }
}

const handleStartSubcollection = () => {
  showCreateCollectionModal.value = true
}

const handleDeleteDocument = () => {
  showDocumentMenu.value = false
  if (selectedDocument.value) {
    documentToDelete.value = selectedDocument.value
    showDeleteDocumentModal.value = true
  }
}

const confirmDeleteDocument = async () => {
  if (!documentToDelete.value || !selectedCollection.value) return

  try {
    isDeletingDocument.value = true

    // Delete the document using store method
    const documentPath = documentToDelete.value.name
    await firestoreStore.deleteDocument(documentPath, selectedCollection.value.id)

    // Clear selection if we deleted the currently selected document
    if (selectedDocument.value?.name === documentToDelete.value.name) {
      selectedDocument.value = null
    }

    showDeleteDocumentModal.value = false
    documentToDelete.value = null
  } catch (error) {
    console.error('Failed to delete document:', error)
  } finally {
    isDeletingDocument.value = false
  }
}

const cancelDeleteDocument = () => {
  showDeleteDocumentModal.value = false
  documentToDelete.value = null
}

// Delete all fields handlers
const handleDeleteAllFields = () => {
  showDocumentMenu.value = false
  if (selectedDocument.value) {
    showDeleteAllFieldsModal.value = true
  }
}

const confirmDeleteAllFields = async () => {
  if (!selectedDocument.value || !selectedCollection.value) return

  try {
    isDeletingAllFields.value = true

    const documentPath = selectedDocument.value.name
    const documentId = getDocumentId(documentPath)

    // Delete the document and recreate it empty
    await firestoreStore.deleteDocument(documentPath, selectedCollection.value.id)

    // Create a new empty document with the same ID
    await firestoreStore.createDocument(
      currentProjectId.value,
      selectedCollection.value.id,
      { fields: {} },
      documentId
    )

    // Refresh documents list and reselect the document
    await firestoreStore.loadDocuments(currentProjectId.value, selectedCollection.value.id)

    // Reselect the document to show it's now empty
    const documents = firestoreStore.getDocumentsByCollection(selectedCollection.value.id)
    const recreatedDoc = documents.find(doc => getDocumentId(doc.name) === documentId)
    if (recreatedDoc) {
      selectedDocument.value = recreatedDoc
    }

    showDeleteAllFieldsModal.value = false
  } catch (error) {
    console.error('Failed to delete all fields:', error)
  } finally {
    isDeletingAllFields.value = false
  }
}

const cancelDeleteAllFields = () => {
  showDeleteAllFieldsModal.value = false
}

// Click outside handler for menus
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-collection-menu]')) {
    showCollectionMenu.value = false
  }
  if (!target.closest('[data-document-menu]')) {
    showDocumentMenu.value = false
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
  if (value.mapValue !== undefined) {
    // Maps should not be formatted as string values - they should use the structured view
    const fields = Object.keys(value.mapValue.fields || {})
    return `${fields.length} fields`
  }
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

    // Handle field deletion using enhanced navigation
    const fieldPath = fieldToDelete.value.path

    try {
      if (fieldPath.includes('.') || fieldPath.includes('[')) {
        // Complex path (nested field or array item)
        const { parent, lastPart } = navigateToParentPath(updatedFields, fieldPath)

        if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
          // Array item deletion
          const index = parseInt(lastPart.substring(1, lastPart.length - 1))
          if (parent.arrayValue?.values) {
            parent.arrayValue.values.splice(index, 1) // Remove item at index
          } else {
            throw new Error(`Expected array at parent for deletion of "${fieldPath}"`)
          }
        } else {
          // Map field deletion
          if (parent.mapValue?.fields) {
            delete parent.mapValue.fields[lastPart]
          } else {
            throw new Error(`Expected map at parent for deletion of "${fieldPath}"`)
          }
        }
      } else {
        // Root level field
        delete updatedFields[fieldPath]
      }
    } catch (navigationError) {
      console.error('Navigation error during field deletion:', {
        fieldPath,
        error: navigationError.message,
        availableFields: Object.keys(updatedFields)
      })
      throw new Error(`Failed to navigate to field for deletion: ${navigationError.message}`)
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

// Enhanced helper function to parse complex paths with unlimited nesting
const parseFieldPath = (path: string): string[] => {
  const pathParts = []
  let current = path

  while (current.length > 0) {
    const dotIndex = current.indexOf('.')
    const bracketIndex = current.indexOf('[')

    if (dotIndex === -1 && bracketIndex === -1) {
      // No more separators, add the rest
      if (current) pathParts.push(current)
      break
    } else if (bracketIndex !== -1 && (dotIndex === -1 || bracketIndex < dotIndex)) {
      // Array index comes first
      const fieldName = current.substring(0, bracketIndex)
      const closingBracket = current.indexOf(']', bracketIndex)

      if (closingBracket === -1) {
        throw new Error(`Malformed path: missing closing bracket in "${path}"`)
      }

      const arrayIndex = current.substring(bracketIndex + 1, closingBracket)

      if (fieldName) pathParts.push(fieldName)
      pathParts.push(`[${arrayIndex}]`)

      current = current.substring(closingBracket + 1)
      if (current.startsWith('.')) current = current.substring(1)
    } else {
      // Dot comes first
      const fieldName = current.substring(0, dotIndex)
      if (fieldName) pathParts.push(fieldName)
      current = current.substring(dotIndex + 1)
    }
  }

  return pathParts
}

// Recursive helper function to navigate through deeply nested structures
const navigateToFieldPath = (fields: any, path: string) => {
  const pathParts = parseFieldPath(path)
  return navigateWithParts(fields, pathParts, path)
}

const navigateWithParts = (currentRef: any, pathParts: string[], originalPath: string) => {
  if (pathParts.length === 0) {
    return currentRef
  }

  const [currentPart, ...remainingParts] = pathParts

  if (currentPart.startsWith('[') && currentPart.endsWith(']')) {
    // Array index
    const index = parseInt(currentPart.substring(1, currentPart.length - 1))

    if (isNaN(index)) {
      throw new Error(`Invalid array index "${currentPart}" in path "${originalPath}"`)
    }

    if (!currentRef?.arrayValue?.values) {
      throw new Error(`Expected array at path part "${currentPart}" in "${originalPath}", but found: ${typeof currentRef}`)
    }

    if (index < 0 || index >= currentRef.arrayValue.values.length) {
      throw new Error(`Array index ${index} out of bounds in path "${originalPath}"`)
    }

    const arrayItem = currentRef.arrayValue.values[index]
    return navigateWithParts(arrayItem, remainingParts, originalPath)
  } else {
    // Object field
    let nextRef

    if (currentRef?.mapValue?.fields) {
      // We're in a map structure
      nextRef = currentRef.mapValue.fields[currentPart]
    } else if (currentRef && typeof currentRef === 'object' && currentPart in currentRef) {
      // We're in a root-level fields object
      nextRef = currentRef[currentPart]
    } else {
      throw new Error(`Field "${currentPart}" not found in path "${originalPath}". Available fields: ${currentRef?.mapValue?.fields ? Object.keys(currentRef.mapValue.fields).join(', ') : Object.keys(currentRef || {}).join(', ')}`)
    }

    if (nextRef === undefined) {
      throw new Error(`Field "${currentPart}" is undefined in path "${originalPath}"`)
    }

    return navigateWithParts(nextRef, remainingParts, originalPath)
  }
}

// Enhanced helper function to navigate to parent with unlimited nesting support
const navigateToParentPath = (fields: any, path: string) => {
  const pathParts = parseFieldPath(path)

  if (pathParts.length === 0) {
    throw new Error('Cannot navigate to parent of empty path')
  }

  if (pathParts.length === 1) {
    // Root level field - parent is the fields object itself
    return {
      parent: fields,
      lastPart: pathParts[0]
    }
  }

  // Navigate to the parent (all parts except the last one)
  const parentParts = pathParts.slice(0, -1)
  const lastPart = pathParts[pathParts.length - 1]

  const parent = navigateWithParts(fields, parentParts, path)

  return {
    parent,
    lastPart
  }
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
          try {
            const arrayContainer = navigateToFieldPath(updatedFields, data.parentPath)

            if (arrayContainer?.arrayValue?.values) {
              // Add the new item to the array
              const newArray = JSON.parse(JSON.stringify(arrayContainer))
              newArray.arrayValue.values.push(firestoreValue)

              // Navigate to parent and update the array
              const { parent, lastPart } = navigateToParentPath(updatedFields, data.parentPath)

              if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
                // Array item within another structure
                const index = parseInt(lastPart.substring(1, lastPart.length - 1))
                if (parent.arrayValue?.values) {
                  parent.arrayValue.values[index] = newArray
                }
              } else {
                // Array field in a map
                if (parent.mapValue?.fields) {
                  parent.mapValue.fields[lastPart] = newArray
                } else if (parent[lastPart]) {
                  parent[lastPart] = newArray
                }
              }
            }
          } catch (error) {
            console.error('Error navigating to array path:', {
              parentPath: data.parentPath,
              fieldPath: data.fieldPath,
              error: error.message,
              availableFields: Object.keys(updatedFields)
            })
            throw new Error(`Failed to add item to array at path "${data.parentPath}": ${error.message}`)
          }
        } else {
          // Adding to a nested map
          try {
            // Navigate directly to the target map (not its parent)
            const targetMap = navigateToFieldPath(updatedFields, data.parentPath)

            // Ensure the target is a map with fields
            if (targetMap?.mapValue) {
              if (!targetMap.mapValue.fields) {
                targetMap.mapValue.fields = {}
              }
              targetMap.mapValue.fields[data.fieldName] = firestoreValue
            } else {
              throw new Error(`Target is not a map at path "${data.parentPath}". Found: ${JSON.stringify(targetMap)}`)
            }
          } catch (error) {
            console.error('Error navigating to target map for field addition:', {
              parentPath: data.parentPath,
              fieldName: data.fieldName,
              error: error.message
            })
            throw new Error(`Failed to add field to map at path "${data.parentPath}": ${error.message}`)
          }
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
      if (fieldPath.includes('.') || fieldPath.includes('[')) {
        // Complex path (nested field or array item)
        try {
          const { parent, lastPart } = navigateToParentPath(updatedFields, fieldPath)

          if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
            // Array item editing
            const index = parseInt(lastPart.substring(1, lastPart.length - 1))
            if (parent.arrayValue?.values) {
              parent.arrayValue.values[index] = firestoreValue
            }
          } else {
            // Map field editing
            if (parent.mapValue?.fields) {
              parent.mapValue.fields[lastPart] = firestoreValue
            } else {
              throw new Error('Parent is not a map')
            }
          }
        } catch (error) {
          console.error('Error navigating to field path for editing:', error)
          throw error
        }
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

    // If we're adding a field to a map, ensure the parent map is expanded
    if (fieldModalMode.value === 'add' && data.parentPath) {
      expandedFieldsCopy.add(data.parentPath)
    }

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

// Watch for project changes and clear data
watch(currentProjectId, async (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId && oldProjectId) {
    // Clear Firestore data when project changes
    firestoreStore.clearData()
    selectedCollection.value = null
    selectedDocument.value = null
    expandedMapFields.value.clear()

    // Load collections for the new project
    if (newProjectId) {
      await refreshCollections()
    }
  }
}, { immediate: false })

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