<template>
  <BaseModal
    v-model="modelValue"
    :title="`Edit ${topic?.name ? getTopicDisplayName(topic.name) : 'Loading...'}`"
    size="5xl"
    :actions="modalActions"
    @close="handleClose"
  >
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading topic details...</span>
    </div>

    <div v-else-if="topic" class="space-y-6">
      <!-- Topic Configuration -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Topic Configuration</h3>
        
        <div class="space-y-4">
          <!-- Topic Name (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic Name
            </label>
            <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
              {{ getTopicDisplayName(topic.name) }}
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Full path: {{ topic.name }}
            </p>
          </div>

          <!-- Message Retention -->
          <div>
            <label for="retention" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message Retention Duration
            </label>
            <input
              id="retention"
              v-model="editForm.messageRetentionDuration"
              type="text"
              placeholder="7d (e.g., 1h, 24h, 7d)"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
            <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Limitation: Configurable message retention is not supported - emulator retains all messages indefinitely
            </p>
          </div>

          <!-- Schema Settings -->
          <div>
            <label class="flex items-center mb-2">
              <input
                v-model="editForm.useSchema"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Avro Schema</span>
            </label>
            
            <div v-if="editForm.useSchema" class="mt-2">
              <input
                v-model="editForm.schemaName"
                type="text"
                placeholder="Schema name"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Limitation: Only Avro schemas are supported - Protocol Buffers are not supported in the emulator
              </p>
            </div>
          </div>
        </div>
      </div>


      <!-- Subscriptions Management -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">Subscriptions</h3>
          <button
            @click="addSubscription"
            class="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Add Subscription
          </button>
        </div>

        <div v-if="isLoadingSubscriptions" class="flex items-center justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading subscriptions...</span>
        </div>

        <div v-else-if="subscriptions.length === 0 && !showNewSubscriptionForm" class="text-center py-4">
          <InboxStackIcon class="mx-auto w-8 h-8 text-gray-400 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">No subscriptions found</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">Create a subscription to start receiving messages</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(subscription, index) in subscriptions"
            :key="subscription.name || index"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800"
          >
            <!-- Show edit form if this subscription is being edited -->
            <div v-if="editingSubscription && getSubscriptionDisplayName(editingSubscription.name) === getSubscriptionDisplayName(subscription.name)" class="space-y-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Edit Subscription</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Subscription Name (Read-only in edit mode) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
                    {{ newSubscription.name }}
                  </div>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Subscription names cannot be changed after creation
                  </p>
                </div>

                <!-- Delivery Type (Read-only in edit mode) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Type
                  </label>
                  <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
                    {{ newSubscription.deliveryType.charAt(0).toUpperCase() + newSubscription.deliveryType.slice(1) }}
                  </div>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Delivery type cannot be changed after creation
                  </p>
                </div>

                <!-- Push Endpoint (if push and editable) -->
                <div v-if="newSubscription.deliveryType === 'push'" class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Push Endpoint *
                  </label>
                  <input
                    v-model="newSubscription.pushEndpoint"
                    type="url"
                    placeholder="https://example.com/webhook"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>

                <!-- BigQuery Config (if bigquery and mostly read-only) -->
                <div v-if="newSubscription.deliveryType === 'bigquery'" class="md:col-span-2 space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      BigQuery Table
                    </label>
                    <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
                      {{ newSubscription.bigqueryTable }}
                    </div>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      BigQuery table cannot be changed after creation
                    </p>
                  </div>
                  
                  <div class="flex items-center space-x-4">
                    <label class="flex items-center">
                      <input
                        v-model="newSubscription.useTopicSchema"
                        type="checkbox"
                        class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Topic Schema</span>
                    </label>
                    
                    <label class="flex items-center">
                      <input
                        v-model="newSubscription.writeMetadata"
                        type="checkbox"
                        class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Write Metadata</span>
                    </label>
                  </div>
                </div>

                <!-- Ack Deadline -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ack Deadline (seconds)
                  </label>
                  <input
                    v-model.number="newSubscription.ackDeadlineSeconds"
                    type="number"
                    min="10"
                    max="600"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': newSubscription.errors?.ackDeadlineSeconds }"
                  />
                  <p v-if="newSubscription.errors?.ackDeadlineSeconds" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    {{ newSubscription.errors.ackDeadlineSeconds }}
                  </p>
                </div>

                <!-- Message Ordering -->
                <div class="md:col-span-2 flex items-center">
                  <label class="flex items-center mb-2">
                    <input
                      v-model="newSubscription.enableMessageOrdering"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Message Ordering</span>
                  </label>
                </div>

                <!-- Dead Letter Policy -->
                <div class="md:col-span-2">
                  <label class="flex items-center mb-2">
                    <input
                      v-model="newSubscription.enableDeadLetter"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Dead Letter Policy</span>
                  </label>
                  
                  <div v-if="newSubscription.enableDeadLetter" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dead Letter Topic
                      </label>
                      <input
                        v-model="newSubscription.deadLetterTopic"
                        type="text"
                        placeholder="dead-letter-topic"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Delivery Attempts
                      </label>
                      <input
                        v-model.number="newSubscription.maxDeliveryAttempts"
                        type="number"
                        min="1"
                        max="100"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <!-- Retry Policy -->
                <div class="md:col-span-2">
                  <label class="flex items-center mb-2">
                    <input
                      v-model="newSubscription.enableRetryPolicy"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Retry Policy</span>
                  </label>
                  
                  <div v-if="newSubscription.enableRetryPolicy" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Backoff
                      </label>
                      <input
                        v-model="newSubscription.minimumBackoff"
                        type="text"
                        placeholder="10s (e.g., 1s, 30s, 5m)"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum Backoff
                      </label>
                      <input
                        v-model="newSubscription.maximumBackoff"
                        type="text"
                        placeholder="600s (e.g., 1m, 10m, 1h)"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Show normal subscription details if not being edited -->
            <div v-else>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <InboxStackIcon class="w-4 h-4 text-green-500" />
                <button
                  @click.stop="editSubscription(subscription)"
                  :disabled="isUpdatingSubscription || !subscription?.name"
                  class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit subscription"
                >
                  <span>{{ getSubscriptionDisplayName(subscription.name) }}</span>
                  <svg class="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              </div>
              <button
                @click.stop="showDeleteSubscriptionConfirmation(subscription)"
                :disabled="isDeletingSubscription || !subscription?.name"
                class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete subscription"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div class="flex items-center justify-center">
                <span class="font-medium">Type:</span> 
                <span class="inline-flex items-center px-1.5 py-0.5 ml-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {{ subscription.pushConfig?.pushEndpoint ? 'Push' : subscription.bigqueryConfig ? 'BigQuery' : 'Pull' }}
                </span>
              </div>
              <div class="flex items-center justify-center">
                <span class="font-medium">Ack Deadline:</span> {{ subscription?.ackDeadlineSeconds || 60 }}s
              </div>
              <div v-if="subscription?.pushConfig?.pushEndpoint" class="flex items-center justify-center">
                <span class="font-medium">Endpoint:</span> {{ subscription.pushConfig.pushEndpoint }}
              </div>
              <div v-else-if="subscription?.bigqueryConfig" class="flex items-center justify-center">
                <span class="font-medium">BigQuery Table:</span> {{ subscription.bigqueryConfig.table }}
              </div>
              <div class="flex items-center justify-center">
                <span class="font-medium">Ordering:</span> {{ subscription?.enableMessageOrdering ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
            
            <!-- Additional configuration details -->
            <div v-if="subscription?.deadLetterPolicy || subscription?.retryPolicy" class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div v-if="subscription?.deadLetterPolicy">
                <span class="font-medium">Dead Letter:</span> {{ getTopicDisplayName(subscription.deadLetterPolicy.deadLetterTopic || '') }} ({{ subscription.deadLetterPolicy.maxDeliveryAttempts }} attempts)
              </div>
              <div v-if="subscription?.retryPolicy">
                <span class="font-medium">Retry:</span> {{ subscription.retryPolicy.minimumBackoff }} - {{ subscription.retryPolicy.maximumBackoff }}
              </div>
            </div>
            
            </div> <!-- Close normal subscription details -->
          </div>
        </div>

        <!-- Edit Subscription Form (hidden - now shows inline) -->
        <div v-if="false" class="mt-4 border border-orange-200 dark:border-orange-600 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Edit Subscription</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Subscription Name (Read-only in edit mode) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
                {{ newSubscription.name }}
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Subscription names cannot be changed after creation
              </p>
            </div>

            <!-- Delivery Type (Read-only in edit mode) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Type
              </label>
              <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
                {{ newSubscription.deliveryType.charAt(0).toUpperCase() + newSubscription.deliveryType.slice(1) }}
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Delivery type cannot be changed after creation
              </p>
            </div>

            <!-- Push Endpoint (if push and editable) -->
            <div v-if="newSubscription.deliveryType === 'push'" class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Push Endpoint *
              </label>
              <input
                v-model="newSubscription.pushEndpoint"
                type="url"
                placeholder="https://example.com/webhook"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <!-- BigQuery Config (if bigquery and mostly read-only) -->
            <div v-if="newSubscription.deliveryType === 'bigquery'" class="md:col-span-2 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BigQuery Table
                </label>
                <div class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
                  {{ newSubscription.bigqueryTable }}
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  BigQuery table cannot be changed after creation
                </p>
              </div>
              
              <div class="flex items-center space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="newSubscription.useTopicSchema"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Topic Schema</span>
                </label>
                
                <label class="flex items-center">
                  <input
                    v-model="newSubscription.writeMetadata"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Write Metadata</span>
                </label>
              </div>
            </div>

            <!-- Ack Deadline -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ack Deadline (seconds)
              </label>
              <input
                v-model.number="newSubscription.ackDeadlineSeconds"
                type="number"
                min="10"
                max="600"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <!-- Message Ordering -->
            <div class="md:col-span-2 flex items-center">
              <label class="flex items-center mb-2">
                <input
                  v-model="newSubscription.enableMessageOrdering"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Message Ordering</span>
              </label>
            </div>
            
            <!-- Dead Letter Policy -->
            <div class="md:col-span-2">
              <label class="flex items-center mb-2">
                <input
                  v-model="newSubscription.enableDeadLetter"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Dead Letter Policy</span>
              </label>
              
              <div v-if="newSubscription.enableDeadLetter" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dead Letter Topic
                  </label>
                  <input
                    v-model="newSubscription.deadLetterTopic"
                    type="text"
                    placeholder="projects/project/topics/dead-letter-topic"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Delivery Attempts
                  </label>
                  <input
                    v-model.number="newSubscription.maxDeliveryAttempts"
                    type="number"
                    min="5"
                    max="100"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            <!-- Retry Policy -->
            <div class="md:col-span-2">
              <label class="flex items-center mb-2">
                <input
                  v-model="newSubscription.enableRetryPolicy"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Retry Policy</span>
              </label>
              
              <div v-if="newSubscription.enableRetryPolicy" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Backoff
                  </label>
                  <input
                    v-model="newSubscription.minimumBackoff"
                    type="text"
                    placeholder="10s (e.g., 1s, 30s, 5m)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Backoff
                  </label>
                  <input
                    v-model="newSubscription.maximumBackoff"
                    type="text"
                    placeholder="600s (e.g., 1m, 10m, 1h)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- New/Edit Subscription Form -->
        <div v-if="showNewSubscriptionForm || showEditSubscriptionForm" class="mt-4 border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {{ editingSubscription ? 'Edit Subscription' : 'Create New Subscription' }}
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Subscription Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                v-model="newSubscription.name"
                type="text"
                placeholder="subscription-name"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': newSubscription.errors?.name }"
              />
              <p v-if="newSubscription.errors?.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ newSubscription.errors.name }}
              </p>
            </div>

            <!-- Delivery Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Type
              </label>
              <select
                v-model="newSubscription.deliveryType"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="pull">Pull</option>
                <option value="push">Push</option>
                <option value="bigquery">BigQuery</option>
              </select>
            </div>

            <!-- Push Endpoint (if push) -->
            <div v-if="newSubscription.deliveryType === 'push'" class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Push Endpoint *
              </label>
              <input
                v-model="newSubscription.pushEndpoint"
                type="url"
                placeholder="https://example.com/webhook"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <!-- BigQuery Config (if bigquery) -->
            <div v-if="newSubscription.deliveryType === 'bigquery'" class="md:col-span-2 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BigQuery Table *
                </label>
                <input
                  v-model="newSubscription.bigqueryTable"
                  type="text"
                  placeholder="project.dataset.table"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              
              <div class="flex items-center space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="newSubscription.useTopicSchema"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Topic Schema</span>
                </label>
                
                <label class="flex items-center">
                  <input
                    v-model="newSubscription.writeMetadata"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Write Metadata</span>
                </label>
              </div>
              
              <p class="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Note: BigQuery subscriptions can be created but don't send messages to BigQuery in the emulator
              </p>
            </div>

            <!-- Ack Deadline -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ack Deadline (seconds)
              </label>
              <input
                v-model.number="newSubscription.ackDeadlineSeconds"
                type="number"
                min="10"
                max="600"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <!-- Message Ordering -->
            <div class="md:col-span-2 flex items-center">
              <label class="flex items-center mb-2">
                <input
                  v-model="newSubscription.enableMessageOrdering"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Message Ordering</span>
              </label>
            </div>
            
            <!-- Dead Letter Policy -->
            <div class="md:col-span-2">
              <label class="flex items-center mb-2">
                <input
                  v-model="newSubscription.enableDeadLetter"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Dead Letter Policy</span>
              </label>
              
              <div v-if="newSubscription.enableDeadLetter" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dead Letter Topic
                  </label>
                  <input
                    v-model="newSubscription.deadLetterTopic"
                    type="text"
                    placeholder="projects/project/topics/dead-letter-topic"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Delivery Attempts
                  </label>
                  <input
                    v-model.number="newSubscription.maxDeliveryAttempts"
                    type="number"
                    min="5"
                    max="100"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            <!-- Retry Policy -->
            <div class="md:col-span-2">
              <label class="flex items-center mb-2">
                <input
                  v-model="newSubscription.enableRetryPolicy"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Retry Policy</span>
              </label>
              
              <div v-if="newSubscription.enableRetryPolicy" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Backoff
                  </label>
                  <input
                    v-model="newSubscription.minimumBackoff"
                    type="text"
                    placeholder="10s (e.g., 1s, 30s, 5m)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Backoff
                  </label>
                  <input
                    v-model="newSubscription.maximumBackoff"
                    type="text"
                    placeholder="600s (e.g., 1m, 10m, 1h)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    
    
    <!-- Delete Subscription Confirmation Modal -->
    <ConfirmationModal
      v-model="showDeleteSubscriptionModal"
      title="Delete Subscription"
      :message="`Are you sure you want to delete subscription '${subscriptionToDelete ? getSubscriptionDisplayName(subscriptionToDelete.name) : ''}'?`"
      confirm-label="Delete Subscription"
      :is-loading="isDeletingSubscription"
      :details="{
        title: 'What will happen:',
        description: 'The subscription will be permanently deleted and will stop receiving messages from this topic.'
      }"
      @confirm="deleteSubscription"
      @cancel="cancelDeleteSubscription"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  PlusIcon, 
  InboxStackIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue'
import { topicsApi, subscriptionsApi } from '@/api/pubsub'
import { useAppStore } from '@/stores/app'
import { useTopicsStore } from '@/stores/topics'
import { useToast } from 'vue-toastification'
import type { ModalAction } from '@/components/ui/BaseModal.vue'
import type { PubSubTopic, PubSubSubscription } from '@/types'
import { getMeaningfulErrorMessage } from '@/utils/errorHandling'

interface Props {
  modelValue: boolean
  topicName?: string
  projectId?: string
}

interface SubscriptionForm {
  name: string
  deliveryType: 'pull' | 'push' | 'bigquery'
  pushEndpoint?: string
  bigqueryTable?: string
  useTopicSchema?: boolean
  writeMetadata?: boolean
  ackDeadlineSeconds: number
  enableMessageOrdering: boolean
  enableDeadLetter: boolean
  deadLetterTopic?: string
  maxDeliveryAttempts?: number
  enableRetryPolicy: boolean
  minimumBackoff?: string
  maximumBackoff?: string
  errors?: Record<string, string>
}


const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'topic-updated': []
  'subscriptions-changed': []
}>()

const route = useRoute()
const appStore = useAppStore()
const topicsStore = useTopicsStore()
const toast = useToast()

const isLoading = ref(false)
const isLoadingSubscriptions = ref(false)
const isUpdating = ref(false)
const isCreatingSubscription = ref(false)
const isDeletingSubscription = ref(false)
const isUpdatingSubscription = ref(false)

const topic = ref<PubSubTopic | null>(null)
const subscriptions = ref<PubSubSubscription[]>([])
const showNewSubscriptionForm = ref(false)
const showEditSubscriptionForm = ref(false)
const editingSubscription = ref<PubSubSubscription | null>(null)
const showDeleteSubscriptionModal = ref(false)
const subscriptionToDelete = ref<PubSubSubscription | null>(null)

const editForm = ref({
  messageRetentionDuration: '7d',
  useSchema: false,
  schemaName: ''
})

const newSubscription = ref<SubscriptionForm>({
  name: '',
  deliveryType: 'pull',
  ackDeadlineSeconds: 60,
  enableMessageOrdering: false,
  enableDeadLetter: false,
  maxDeliveryAttempts: 5,
  enableRetryPolicy: false,
  minimumBackoff: '10s',
  maximumBackoff: '600s'
})

const modelValue = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const currentProjectId = computed(() => props.projectId || route.params.projectId as string)

const modalActions = computed<ModalAction[]>(() => [
  {
    label: 'Cancel',
    handler: handleClose,
    variant: 'secondary'
  },
  {
    label: 'Update',
    handler: handleUpdate,
    variant: 'primary',
    loading: isUpdating.value || isUpdatingSubscription.value,
    disabled: isUpdating.value || isUpdatingSubscription.value
  }
])

const getTopicDisplayName = (fullName: string): string => {
  const parts = fullName.split('/')
  return parts[parts.length - 1] || fullName
}

const getSubscriptionDisplayName = (fullName: string | undefined): string => {
  if (!fullName) {
    return 'Unknown'
  }
  
  // Handle different possible formats:
  // 1. Full resource path: projects/project-id/subscriptions/sub-name
  // 2. Just the name: sub-name
  // 3. Other formats
  
  if (typeof fullName !== 'string') {
    return 'Unknown'
  }
  
  const parts = fullName.split('/')
  const displayName = parts[parts.length - 1] || fullName
  
  return displayName
}


const formatDate = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

const loadTopic = async () => {
  if (!props.topicName || !currentProjectId.value) return
  
  isLoading.value = true
  try {
    // First, try to get the topic from the store (which may have updated data)
    let topicData = topicsStore.getTopicByName(props.topicName, currentProjectId.value)
    
    // If not found in store, fetch from API
    if (!topicData) {
      topicData = await topicsApi.getTopic(currentProjectId.value, props.topicName)
      // Add some default values since the emulator response is minimal
      topicData = {
        ...topicData,
        messageRetentionDuration: topicData.messageRetentionDuration || '7d',
        labels: topicData.labels || {},
        messageCount: topicData.messageCount || 0,
        subscriptionsCount: topicData.subscriptionsCount || 0,
        createdAt: topicData.createdAt || new Date(),
        updatedAt: topicData.updatedAt || new Date()
      }
    }
    
    topic.value = topicData
    
    // Populate edit form
    editForm.value = {
      messageRetentionDuration: topicData.messageRetentionDuration || '7d',
      useSchema: !!topicData.schemaSettings,
      schemaName: topicData.schemaSettings?.schema ? getTopicDisplayName(topicData.schemaSettings.schema) : ''
    }
  } catch (error) {
    console.error('Error loading topic:', error)
    appStore.showToast({
      type: 'error',
      title: 'Error',
      message: 'Failed to load topic details'
    })
  } finally {
    isLoading.value = false
  }
}

const loadSubscriptions = async () => {
  if (!props.topicName || !currentProjectId.value) return
  
  isLoadingSubscriptions.value = true
  try {
    // Get all subscriptions for the project
    const allSubs = await subscriptionsApi.getSubscriptions(currentProjectId.value)
    
    // Filter subscriptions for this specific topic
    const topicPath = `projects/${currentProjectId.value}/topics/${props.topicName}`
    const safeAllSubs = Array.isArray(allSubs) ? allSubs : []
    const filteredSubs = safeAllSubs.filter(sub => {
      // Try different possible field names for the topic reference
      const subTopic = sub.topicName || sub.topic || sub.topicId || sub.topicPath
      
      // Check multiple possible matches
      return subTopic === topicPath || 
             subTopic === props.topicName ||
             subTopic?.endsWith(`/topics/${props.topicName}`) ||
             false
    })
    
    subscriptions.value = filteredSubs
    
    // Update the topic's subscription count
    if (topic.value) {
      topic.value.subscriptionsCount = filteredSubs.length
    }
  } catch (error) {
    console.error('Error loading subscriptions:', error)
  } finally {
    isLoadingSubscriptions.value = false
  }
}

const handleUpdate = async () => {
  
  if (!topic.value || !currentProjectId.value) return
  
  // If we're editing a subscription OR creating a new one, handle subscription operations
  if (editingSubscription.value || showNewSubscriptionForm.value) {
    console.log('Calling saveSubscription')
    await saveSubscription()
    return
  }
  
  isUpdating.value = true
  try {
    // Prepare update data
    const updateData = {
      labels: {},
      messageRetentionDuration: editForm.value.messageRetentionDuration,
      schemaSettings: editForm.value.useSchema && editForm.value.schemaName ? {
        schema: `projects/${currentProjectId.value}/schemas/${editForm.value.schemaName}`,
        encoding: 'JSON' as const
      } : undefined,
      // Preserve existing data
      createdAt: topic.value.createdAt,
      messageCount: topic.value.messageCount,
      subscriptionsCount: topic.value.subscriptionsCount
    }

    // Call the update API
    const updatedTopic = await topicsApi.updateTopic(
      currentProjectId.value, 
      getTopicDisplayName(topic.value.name), 
      updateData
    )
    
    // Update the local topic data
    const mergedTopic = { ...topic.value, ...updatedTopic }
    topic.value = mergedTopic
    
    // Update the topic in the topics store so it persists
    const existingTopics = topicsStore.topics
    const topicIndex = existingTopics.findIndex(t => 
      getTopicDisplayName(t.name) === getTopicDisplayName(topic.value!.name) && 
      t.projectId === currentProjectId.value
    )
    
    if (topicIndex !== -1) {
      // Update existing topic in store
      existingTopics[topicIndex] = mergedTopic
    } else {
      // Add new topic to store if not found
      existingTopics.push(mergedTopic)
    }
    
    appStore.showToast({
      type: 'success',
      title: 'Topic Updated',
      message: `Topic "${getTopicDisplayName(topic.value.name)}" has been updated successfully`
    })
    
    emit('topic-updated')
    
    // Close the modal after successful update
    modelValue.value = false
  } catch (error) {
    console.error('Error updating topic:', error)
    appStore.showToast({
      type: 'error',
      title: 'Update Failed',
      message: 'Failed to update topic'
    })
  } finally {
    isUpdating.value = false
  }
}

const handleClose = () => {
  if (!isUpdating.value && !isCreatingSubscription.value && !isUpdatingSubscription.value) {
    modelValue.value = false
    showNewSubscriptionForm.value = false
    showEditSubscriptionForm.value = false
    editingSubscription.value = null
  }
}

const editSubscription = (subscription: PubSubSubscription) => {
  editingSubscription.value = subscription
  showNewSubscriptionForm.value = false
  const displayName = getSubscriptionDisplayName(subscription.name)
  
  // Determine delivery type based on subscription config
  let deliveryType: 'pull' | 'push' | 'bigquery' = 'pull'
  if (subscription.pushConfig?.pushEndpoint) {
    deliveryType = 'push'
  } else if (subscription.bigqueryConfig) {
    deliveryType = 'bigquery'
  }
  
  // Pre-fill the form with existing subscription data
  newSubscription.value = {
    name: displayName,
    deliveryType,
    ackDeadlineSeconds: subscription.ackDeadlineSeconds || 60,
    enableMessageOrdering: subscription.enableMessageOrdering || false,
    pushEndpoint: subscription.pushConfig?.pushEndpoint || '',
    bigqueryTable: subscription.bigqueryConfig?.table || '',
    useTopicSchema: subscription.bigqueryConfig?.useTopicSchema || false,
    writeMetadata: subscription.bigqueryConfig?.writeMetadata || false,
    deadLetterTopic: subscription.deadLetterPolicy?.deadLetterTopic ? 
      getTopicDisplayName(subscription.deadLetterPolicy.deadLetterTopic) : '',
    maxDeliveryAttempts: subscription.deadLetterPolicy?.maxDeliveryAttempts || 5,
    minimumBackoff: subscription.retryPolicy?.minimumBackoff || '',
    maximumBackoff: subscription.retryPolicy?.maximumBackoff || '',
    enableDeadLetter: !!subscription.deadLetterPolicy,
    enableRetryPolicy: !!subscription.retryPolicy
  }
  
  // showEditSubscriptionForm.value = true  // Don't show separate form anymore
}

const addSubscription = () => {
  editingSubscription.value = null
  showEditSubscriptionForm.value = false
  showNewSubscriptionForm.value = true
  newSubscription.value = {
    name: '',
    deliveryType: 'pull',
    ackDeadlineSeconds: 60,
    enableMessageOrdering: false,
    enableDeadLetter: false,
    maxDeliveryAttempts: 5,
    enableRetryPolicy: false,
    minimumBackoff: '10s',
    maximumBackoff: '600s'
  }
}

const cancelSubscriptionForm = () => {
  showNewSubscriptionForm.value = false
  showEditSubscriptionForm.value = false
  editingSubscription.value = null
  newSubscription.value = {
    name: '',
    deliveryType: 'pull',
    ackDeadlineSeconds: 60,
    enableMessageOrdering: false,
    enableDeadLetter: false,
    maxDeliveryAttempts: 5,
    enableRetryPolicy: false,
    minimumBackoff: '10s',
    maximumBackoff: '600s'
  }
}


const saveNewSubscription = async () => {
  if (!topic.value || !currentProjectId.value) return
  
  // Validate
  const errors: Record<string, string> = {}
  if (!newSubscription.value.name.trim()) {
    errors.name = 'Subscription name is required'
  }
  
  // Validate ack deadline range
  if (newSubscription.value.ackDeadlineSeconds < 10 || newSubscription.value.ackDeadlineSeconds > 600) {
    errors.ackDeadlineSeconds = 'Ack deadline must be between 10 and 600 seconds'
  }
  if (newSubscription.value.deliveryType === 'push' && !newSubscription.value.pushEndpoint?.trim()) {
    errors.pushEndpoint = 'Push endpoint is required for push subscriptions'
  }
  if (newSubscription.value.deliveryType === 'bigquery' && !newSubscription.value.bigqueryTable?.trim()) {
    errors.bigqueryTable = 'BigQuery table is required for BigQuery subscriptions'
  }
  if (newSubscription.value.enableDeadLetter && !newSubscription.value.deadLetterTopic?.trim()) {
    errors.deadLetterTopic = 'Dead letter topic is required when dead letter policy is enabled'
  }
  if (newSubscription.value.enableRetryPolicy) {
    if (!newSubscription.value.minimumBackoff?.trim()) {
      errors.minimumBackoff = 'Minimum backoff is required when retry policy is enabled'
    }
    if (!newSubscription.value.maximumBackoff?.trim()) {
      errors.maximumBackoff = 'Maximum backoff is required when retry policy is enabled'
    }
  }
  
  if (Object.keys(errors).length > 0) {
    newSubscription.value.errors = errors
    
    // Show specific validation errors
    const errorMessages = Object.values(errors)
    const errorMessage = errorMessages.length === 1 
      ? errorMessages[0] 
      : `Validation errors: ${errorMessages.join(', ')}`
    
    toast.error(errorMessage, {
      timeout: 6000
    })
    return
  }
  
  isCreatingSubscription.value = true
  try {
    const subRequest: any = {
      name: newSubscription.value.name.trim(),
      topic: topic.value.name,
      ackDeadlineSeconds: newSubscription.value.ackDeadlineSeconds,
      enableMessageOrdering: newSubscription.value.enableMessageOrdering
    }
    
    if (newSubscription.value.deliveryType === 'push' && newSubscription.value.pushEndpoint) {
      subRequest.pushConfig = {
        pushEndpoint: newSubscription.value.pushEndpoint
      }
    }
    
    if (newSubscription.value.deliveryType === 'bigquery' && newSubscription.value.bigqueryTable) {
      subRequest.bigqueryConfig = {
        table: newSubscription.value.bigqueryTable,
        useTopicSchema: newSubscription.value.useTopicSchema,
        writeMetadata: newSubscription.value.writeMetadata
      }
    }
    
    if (newSubscription.value.enableDeadLetter && newSubscription.value.deadLetterTopic) {
      subRequest.deadLetterPolicy = {
        deadLetterTopic: newSubscription.value.deadLetterTopic,
        maxDeliveryAttempts: newSubscription.value.maxDeliveryAttempts
      }
    }
    
    if (newSubscription.value.enableRetryPolicy && newSubscription.value.minimumBackoff && newSubscription.value.maximumBackoff) {
      subRequest.retryPolicy = {
        minimumBackoff: newSubscription.value.minimumBackoff,
        maximumBackoff: newSubscription.value.maximumBackoff
      }
    }
    
    await subscriptionsApi.createSubscription(currentProjectId.value, subRequest)
    
    appStore.showToast({
      type: 'success',
      title: 'Subscription Created',
      message: `Subscription "${newSubscription.value.name}" created successfully`
    })
    
    // Refresh subscriptions list
    await loadSubscriptions()
    cancelSubscriptionForm()
    
    // Emit event to refresh topics list with updated subscription count
    emit('subscriptions-changed')
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    console.error('Error details:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      fullError: error
    })
    
    
    // Handle specific error cases for subscription creation
    if (error.response?.status === 409 || error.message?.includes('ALREADY_EXISTS') || error.response?.data?.message?.includes('ALREADY_EXISTS')) {
      toast.warning(`A subscription named "${newSubscription.value.name}" already exists for this topic. Please choose a different name.`, {
        timeout: 8000
      })
    } else if (error.response?.status === 404 || error.message?.includes('NOT_FOUND')) {
      toast.error('The topic no longer exists. Please refresh the page to see the current state.', {
        timeout: 6000
      })
    } else if (error.response?.status === 400) {
      toast.error('The subscription configuration is invalid. Please check your settings and try again.', {
        timeout: 5000
      })
    } else {
      toast.error(`Failed to create subscription: ${getMeaningfulErrorMessage(error)}`, {
        timeout: 5000
      })
    }
  } finally {
    isCreatingSubscription.value = false
  }
}

const saveSubscription = async () => {
  console.log('saveSubscription called - editingSubscription.value:', editingSubscription.value)
  console.log('showNewSubscriptionForm.value:', showNewSubscriptionForm.value)
  
  if (editingSubscription.value) {
    await saveEditedSubscription()
  } else {
    await saveNewSubscription()
  }
}

const saveEditedSubscription = async () => {
  console.log('saveEditedSubscription called')
  console.log('editingSubscription.value:', editingSubscription.value)
  console.log('currentProjectId.value:', currentProjectId.value)
  console.log('newSubscription.value:', newSubscription.value)
  
  if (!editingSubscription.value || !currentProjectId.value) return
  
  // Validate form data BEFORE deleting the subscription
  const errors: Record<string, string> = {}
  
  // Validate ack deadline range
  if (newSubscription.value.ackDeadlineSeconds < 10 || newSubscription.value.ackDeadlineSeconds > 600) {
    errors.ackDeadlineSeconds = 'Ack deadline must be between 10 and 600 seconds'
  }
  
  // For editing existing subscriptions, be more lenient with validation
  // Only require push endpoint if this is a new push subscription
  console.log('editingSubscription pushConfig:', editingSubscription.value.pushConfig)
  console.log('Has existing pushEndpoint?', editingSubscription.value.pushConfig?.pushEndpoint)
  
  // Skip push endpoint validation for existing push subscriptions during edit
  const isEditingExistingPushSub = editingSubscription.value.pushConfig?.pushEndpoint && typeof editingSubscription.value.pushConfig === 'object'
  if (newSubscription.value.deliveryType === 'push' && !newSubscription.value.pushEndpoint?.trim() && !isEditingExistingPushSub) {
    errors.pushEndpoint = 'Push endpoint is required for push subscriptions'
  }
  if (newSubscription.value.enableDeadLetter && !newSubscription.value.deadLetterTopic?.trim()) {
    errors.deadLetterTopic = 'Dead letter topic is required when dead letter policy is enabled'
  }
  if (newSubscription.value.enableRetryPolicy) {
    if (!newSubscription.value.minimumBackoff?.trim()) {
      errors.minimumBackoff = 'Minimum backoff is required when retry policy is enabled'
    }
    if (!newSubscription.value.maximumBackoff?.trim()) {
      errors.maximumBackoff = 'Maximum backoff is required when retry policy is enabled'
    }
  }
  
  console.log('Validation errors:', errors)
  if (Object.keys(errors).length > 0) {
    newSubscription.value.errors = errors
    console.log('Validation failed, returning early - subscription not deleted')
    
    // Show specific validation errors
    const errorMessages = Object.values(errors)
    const errorMessage = errorMessages.length === 1 
      ? errorMessages[0] 
      : `Validation errors: ${errorMessages.join(', ')}`
    
    toast.error(errorMessage, {
      timeout: 6000
    })
    return
  }
  console.log('Validation passed, proceeding with delete+recreate')
  
  isUpdatingSubscription.value = true
  try {
    const subscriptionName = getSubscriptionDisplayName(editingSubscription.value.name)
    
    // Prepare update data - include full subscription data with updates
    const updateData: any = {
      name: editingSubscription.value.name,
      topic: editingSubscription.value.topic,
      ackDeadlineSeconds: newSubscription.value.ackDeadlineSeconds,
      enableMessageOrdering: newSubscription.value.enableMessageOrdering
    }
    
    // Add push config if it's a push subscription
    if (newSubscription.value.deliveryType === 'push') {
      updateData.pushConfig = {
        pushEndpoint: newSubscription.value.pushEndpoint || editingSubscription.value.pushConfig?.pushEndpoint || ''
      }
    } else if (editingSubscription.value.pushConfig?.pushEndpoint) {
      // Preserve existing push config for existing push subscriptions
      updateData.pushConfig = editingSubscription.value.pushConfig
    }
    
    // Add BigQuery config if it's a BigQuery subscription  
    if (newSubscription.value.deliveryType === 'bigquery') {
      updateData.bigqueryConfig = {
        table: newSubscription.value.bigqueryTable,
        useTopicSchema: newSubscription.value.useTopicSchema,
        writeMetadata: newSubscription.value.writeMetadata
      }
    }
    
    // Add dead letter policy if enabled
    if (newSubscription.value.enableDeadLetter) {
      updateData.deadLetterPolicy = {
        deadLetterTopic: newSubscription.value.deadLetterTopic,
        maxDeliveryAttempts: newSubscription.value.maxDeliveryAttempts
      }
    } else {
      // Explicitly remove dead letter policy if disabled
      updateData.deadLetterPolicy = null
    }
    
    // Add retry policy if enabled
    if (newSubscription.value.enableRetryPolicy) {
      updateData.retryPolicy = {
        minimumBackoff: newSubscription.value.minimumBackoff,
        maximumBackoff: newSubscription.value.maximumBackoff
      }
    } else {
      // Explicitly remove retry policy if disabled
      updateData.retryPolicy = null
    }
    
    console.log('Deleting and recreating subscription with data:', updateData)
    
    // Since emulator doesn't support updates, delete and recreate the subscription
    console.log('Step 1: Deleting existing subscription...')
    await subscriptionsApi.deleteSubscription(currentProjectId.value, subscriptionName)
    console.log('Step 2: Creating new subscription with updated settings...')
    
    // Prepare creation request
    const createRequest = {
      name: subscriptionName, // Just the name, not the full path
      topic: editingSubscription.value.topic,
      ackDeadlineSeconds: newSubscription.value.ackDeadlineSeconds,
      enableMessageOrdering: newSubscription.value.enableMessageOrdering
    }
    
    // Add delivery-specific config
    if (newSubscription.value.deliveryType === 'push') {
      createRequest.pushConfig = {
        pushEndpoint: newSubscription.value.pushEndpoint || editingSubscription.value.pushConfig?.pushEndpoint || ''
      }
    }
    
    if (newSubscription.value.deliveryType === 'bigquery') {
      createRequest.bigqueryConfig = {
        table: newSubscription.value.bigqueryTable,
        useTopicSchema: newSubscription.value.useTopicSchema,
        writeMetadata: newSubscription.value.writeMetadata
      }
    }
    
    // Add dead letter policy if enabled
    if (newSubscription.value.enableDeadLetter) {
      createRequest.deadLetterPolicy = {
        deadLetterTopic: newSubscription.value.deadLetterTopic,
        maxDeliveryAttempts: newSubscription.value.maxDeliveryAttempts
      }
    }
    
    // Add retry policy if enabled
    if (newSubscription.value.enableRetryPolicy) {
      createRequest.retryPolicy = {
        minimumBackoff: newSubscription.value.minimumBackoff,
        maximumBackoff: newSubscription.value.maximumBackoff
      }
    }
    
    console.log('Creating subscription with request:', createRequest)
    await subscriptionsApi.createSubscription(currentProjectId.value, createRequest)
    console.log('Subscription updated successfully')
    
    appStore.showToast({
      type: 'success',
      title: 'Subscription Updated',
      message: `Subscription "${newSubscription.value.name}" updated successfully`
    })
    
    // Refresh subscriptions list
    await loadSubscriptions()
    cancelSubscriptionForm()
    
    // Emit event to refresh topics list with updated subscription data
    emit('subscriptions-changed')
  } catch (error: any) {
    console.error('Error updating subscription (delete+create):', error)
    
    // Handle specific error cases
    if (error.response?.status === 409 || error.message?.includes('ALREADY_EXISTS')) {
      toast.warning('The subscription could not be updated because it still exists. The delete operation may have failed. Please try refreshing the page and try again.', {
        timeout: 8000
      })
    } else if (error.response?.status === 404 || error.message?.includes('NOT_FOUND')) {
      toast.error('The topic no longer exists. Please refresh the page to see the current state.', {
        timeout: 6000
      })
    } else {
      toast.error(`Failed to update subscription: ${getMeaningfulErrorMessage(error)}`, {
        timeout: 5000
      })
    }
  } finally {
    isUpdatingSubscription.value = false
  }
}

const showDeleteSubscriptionConfirmation = (subscription: PubSubSubscription) => {
  subscriptionToDelete.value = subscription
  showDeleteSubscriptionModal.value = true
}

const deleteSubscription = async () => {
  if (!subscriptionToDelete.value || !currentProjectId.value || isDeletingSubscription.value) {
    return
  }
  
  const subscription = subscriptionToDelete.value
  const displayName = getSubscriptionDisplayName(subscription.name)
  
  isDeletingSubscription.value = true
  try {
    console.log('Attempting to delete subscription:', displayName)
    await subscriptionsApi.deleteSubscription(currentProjectId.value, displayName)
    console.log('Delete API call successful')
    
    appStore.showToast({
      type: 'success',
      title: 'Subscription Deleted',
      message: `Subscription "${displayName}" deleted successfully`
    })
    
    // Also remove from local array immediately for better UX
    subscriptions.value = subscriptions.value.filter(sub => 
      getSubscriptionDisplayName(sub.name) !== displayName
    )
    
    // Refresh subscriptions list from API
    await loadSubscriptions()
  } catch (error: any) {
    console.error('Error deleting subscription:', error)
    
    // Try to remove locally anyway if it's a 404 (subscription doesn't exist)
    if (error.response?.status === 404) {
      subscriptions.value = subscriptions.value.filter(sub => 
        getSubscriptionDisplayName(sub.name) !== displayName
      )
      appStore.showToast({
        type: 'info',
        title: 'Subscription Removed',
        message: `Subscription "${displayName}" was already deleted or doesn't exist`
      })
    } else {
      toast.error(`Failed to delete subscription: ${getMeaningfulErrorMessage(error)}`, {
        timeout: 5000
      })
    }
  } finally {
    isDeletingSubscription.value = false
    showDeleteSubscriptionModal.value = false
    subscriptionToDelete.value = null
  }
  
  // Emit event to refresh topics list with updated subscription count
  emit('subscriptions-changed')
}

const cancelDeleteSubscription = () => {
  showDeleteSubscriptionModal.value = false
  subscriptionToDelete.value = null
}





// Load data when modal opens or props change
watch(() => [props.modelValue, props.topicName, currentProjectId.value], async ([isOpen]) => {
  if (isOpen && props.topicName) {
    await loadTopic()
    await loadSubscriptions()
  }
}, { immediate: true })
</script>