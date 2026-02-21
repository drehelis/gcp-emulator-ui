<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" :class="containerClass">
    <!-- Subscription Name -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Name *
      </label>
      <template v-if="readOnlyName">
        <div
          class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
        >
          {{ modelValue.name }}
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Subscription names cannot be changed after creation
        </p>
      </template>
      <template v-else>
        <input
          :value="modelValue.name"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="subscription-name"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': modelValue.errors?.name,
          }"
        />
        <p v-if="modelValue.errors?.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ modelValue.errors.name }}
        </p>
      </template>
    </div>

    <!-- Delivery Type -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Delivery Type
      </label>
      <template v-if="readOnlyDeliveryType">
        <div
          class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
        >
          {{ modelValue.deliveryType.charAt(0).toUpperCase() + modelValue.deliveryType.slice(1) }}
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Delivery type cannot be changed after creation
        </p>
      </template>
      <template v-else>
        <select
          :value="modelValue.deliveryType"
          @change="updateField('deliveryType', ($event.target as HTMLSelectElement).value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
        >
          <option value="pull">Pull</option>
          <option value="push">Push</option>
          <option value="bigquery">BigQuery</option>
        </select>
      </template>
    </div>

    <!-- Push Endpoint (if push) -->
    <div v-if="modelValue.deliveryType === 'push'" class="lg:col-span-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Push Endpoint *
      </label>
      <input
        :value="modelValue.pushEndpoint"
        @input="updateField('pushEndpoint', ($event.target as HTMLInputElement).value)"
        type="url"
        placeholder="https://example.com/webhook"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
      />
    </div>

    <!-- BigQuery Config (if bigquery) -->
    <div v-if="modelValue.deliveryType === 'bigquery'" class="lg:col-span-2 space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          BigQuery Table *
        </label>
        <template v-if="readOnlyBigQueryTable">
          <div
            class="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
          >
            {{ modelValue.bigqueryTable }}
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            BigQuery table cannot be changed after creation
          </p>
        </template>
        <template v-else>
          <input
            :value="modelValue.bigqueryTable"
            @input="updateField('bigqueryTable', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="project.dataset.table"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </template>
      </div>

      <div class="flex items-center space-x-4">
        <label class="flex items-center">
          <input
            :checked="modelValue.useTopicSchema"
            @change="updateField('useTopicSchema', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
          />
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Topic Schema</span>
        </label>

        <label class="flex items-center">
          <input
            :checked="modelValue.writeMetadata"
            @change="updateField('writeMetadata', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
          />
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Write Metadata</span>
        </label>
      </div>

      <p class="text-xs text-amber-600 dark:text-amber-400">
        ⚠️ Note: BigQuery subscriptions can be created but don't send messages to BigQuery in the
        emulator
      </p>
    </div>

    <!-- Ack Deadline -->
    <div class="lg:col-span-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Ack Deadline (seconds)
      </label>
      <input
        :value="modelValue.ackDeadlineSeconds"
        @input="updateNumericField('ackDeadlineSeconds', ($event.target as HTMLInputElement).value)"
        type="number"
        min="10"
        max="600"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
        :class="{
          'border-red-300 focus:border-red-500 focus:ring-red-500':
            modelValue.errors?.ackDeadlineSeconds,
        }"
      />
      <p
        v-if="modelValue.errors?.ackDeadlineSeconds"
        class="mt-1 text-sm text-red-600 dark:text-red-400"
      >
        {{ modelValue.errors.ackDeadlineSeconds }}
      </p>
    </div>

    <!-- Message Ordering -->
    <div class="lg:col-span-2 flex items-center">
      <label class="flex items-center mb-2">
        <input
          :checked="modelValue.enableMessageOrdering"
          @change="
            updateField('enableMessageOrdering', ($event.target as HTMLInputElement).checked)
          "
          type="checkbox"
          class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
        />
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Message Ordering</span>
      </label>
    </div>

    <!-- Filter Expression -->
    <div class="lg:col-span-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Filter Expression (Optional)
      </label>
      <textarea
        :value="modelValue.filter ?? ''"
        @input="updateField('filter', ($event.target as HTMLTextAreaElement).value)"
        rows="2"
        placeholder='e.g., attributes.region = "us-west" AND attributes.priority = "high"'
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm font-mono text-xs"
      ></textarea>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Filter messages based on attributes. Only matching messages will be delivered to this
        subscription.
      </p>
    </div>

    <!-- Dead Letter Policy -->
    <div class="lg:col-span-2">
      <label class="flex items-center mb-2">
        <input
          :checked="modelValue.enableDeadLetter || modelValue.useDeadLetter"
          @change="updateField(enableDeadLetterField, ($event.target as HTMLInputElement).checked)"
          type="checkbox"
          class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
        />
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ deadLetterLabel }}</span>
      </label>

      <div
        v-if="modelValue.enableDeadLetter || modelValue.useDeadLetter"
        class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dead Letter Topic
          </label>
          <!-- Searchable dropdown when topics are available -->
          <SearchableDropdown
            v-if="availableTopics && availableTopics.length > 0"
            :model-value="modelValue.deadLetterTopic ?? ''"
            @update:model-value="updateField('deadLetterTopic', $event)"
            :options="availableTopicsAsOptions"
            placeholder="Select a topic..."
            search-placeholder="Search topics..."
            :clearable="true"
            clear-label="None"
            empty-text="No topics available"
            no-results-text="No topics match your search"
          >
            <template #icon>
              <svg class="h-4 w-4 text-blue-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </template>
            <template #option-icon>
              <svg class="h-4 w-4 text-blue-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </template>
          </SearchableDropdown>
          <!-- Fallback text input when no topics provided -->
          <input
            v-else
            :value="modelValue.deadLetterTopic"
            @input="updateField('deadLetterTopic', ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="deadLetterPlaceholder"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Delivery Attempts
          </label>
          <input
            :value="modelValue.maxDeliveryAttempts"
            @input="
              updateNumericField('maxDeliveryAttempts', ($event.target as HTMLInputElement).value)
            "
            type="number"
            min="1"
            max="100"
            placeholder="Max delivery attempts (5)"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Retry Policy -->
    <div class="lg:col-span-2">
      <label class="flex items-center mb-2">
        <input
          :checked="modelValue.enableRetryPolicy || modelValue.useRetryPolicy"
          @change="updateField(enableRetryPolicyField, ($event.target as HTMLInputElement).checked)"
          type="checkbox"
          class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
        />
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ retryPolicyLabel }}</span>
      </label>

      <div
        v-if="modelValue.enableRetryPolicy || modelValue.useRetryPolicy"
        class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum Backoff
          </label>
          <input
            :value="modelValue.minimumBackoff"
            @input="updateField('minimumBackoff', ($event.target as HTMLInputElement).value)"
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
            :value="modelValue.maximumBackoff"
            @input="updateField('maximumBackoff', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="600s (e.g., 1m, 10m, 1h)"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SearchableDropdown from '@/components/ui/SearchableDropdown.vue'

interface SubscriptionForm {
  name: string
  deliveryType: 'pull' | 'push' | 'bigquery'
  pushEndpoint?: string
  bigqueryTable?: string
  useTopicSchema?: boolean
  writeMetadata?: boolean
  ackDeadlineSeconds: number
  enableMessageOrdering: boolean
  filter?: string
  enableDeadLetter?: boolean
  useDeadLetter?: boolean
  deadLetterTopic?: string
  maxDeliveryAttempts?: number
  enableRetryPolicy?: boolean
  useRetryPolicy?: boolean
  minimumBackoff?: string
  maximumBackoff?: string
  errors?: Record<string, string>
}

interface Props {
  modelValue: SubscriptionForm
  containerClass?: string
  readOnlyName?: boolean
  readOnlyDeliveryType?: boolean
  readOnlyBigQueryTable?: boolean
  mode?: 'create' | 'edit'
  availableTopics?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  readOnlyName: false,
  readOnlyDeliveryType: false,
  readOnlyBigQueryTable: false,
  mode: 'create',
  availableTopics: () => [],
})

// Transform availableTopics into { value, label } options for SearchableDropdown
const availableTopicsAsOptions = computed(() =>
  props.availableTopics.map(t => ({
    value: t,
    label: t.split('/topics/').pop() ?? t,
  }))
)

const emit = defineEmits<{
  'update:modelValue': [value: SubscriptionForm]
}>()

const enableDeadLetterField = computed(() =>
  props.mode === 'create' ? 'useDeadLetter' : 'enableDeadLetter'
)

const enableRetryPolicyField = computed(() =>
  props.mode === 'create' ? 'useRetryPolicy' : 'enableRetryPolicy'
)

const deadLetterLabel = computed(() =>
  props.mode === 'create' ? 'Use Dead Letter Topic' : 'Enable Dead Letter Policy'
)

const retryPolicyLabel = computed(() =>
  props.mode === 'create' ? 'Use Retry Policy' : 'Enable Retry Policy'
)

const deadLetterPlaceholder = computed(() =>
  props.mode === 'create' ? 'dead-letter-topic-name' : 'dead-letter-topic'
)

const updateField = (field: string, value: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}

const updateNumericField = (field: string, value: string) => {
  const numValue = parseInt(value, 10)
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: isNaN(numValue) ? undefined : numValue,
  })
}
</script>
