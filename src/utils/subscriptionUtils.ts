import type { CreateSubscriptionRequest } from '@/types/pubsub'

export interface SubscriptionForm {
  name: string
  deliveryType: 'pull' | 'push' | 'bigquery'
  pushEndpoint?: string
  bigqueryTable?: string
  useTopicSchema?: boolean
  writeMetadata?: boolean
  ackDeadlineSeconds: number
  enableMessageOrdering: boolean
  filter?: string
  enableDeadLetter: boolean
  deadLetterTopic?: string
  maxDeliveryAttempts?: number
  enableRetryPolicy: boolean
  minimumBackoff?: string
  maximumBackoff?: string
  errors?: Record<string, string>
}

export const validateSubscriptionForm = (
  subscription: SubscriptionForm,
  options: {
    validateName?: boolean
    validateBigQuery?: boolean
    skipPushEndpointIfExists?: boolean
    existingPushEndpoint?: string
  } = {}
): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Name validation (only for new subscriptions)
  if (options.validateName) {
    const nameError = validateSubscriptionName(subscription.name)
    if (nameError) {
      errors.name = nameError
    }
  }

  // Ack deadline range validation
  if (subscription.ackDeadlineSeconds < 10 || subscription.ackDeadlineSeconds > 600) {
    errors.ackDeadlineSeconds = 'Ack deadline must be between 10 and 600 seconds'
  }

  // Push endpoint validation
  if (subscription.deliveryType === 'push') {
    const hasExistingEndpoint = options.skipPushEndpointIfExists && options.existingPushEndpoint
    if (!subscription.pushEndpoint?.trim() && !hasExistingEndpoint) {
      errors.pushEndpoint = 'Push endpoint is required for push subscriptions'
    }
  }

  // BigQuery validation (only for new subscriptions)
  if (
    options.validateBigQuery &&
    subscription.deliveryType === 'bigquery' &&
    !subscription.bigqueryTable?.trim()
  ) {
    errors.bigqueryTable = 'BigQuery table is required for BigQuery subscriptions'
  }

  // Dead letter policy validation
  if (subscription.enableDeadLetter && !subscription.deadLetterTopic?.trim()) {
    errors.deadLetterTopic = 'Dead letter topic is required when dead letter policy is enabled'
  }

  // Retry policy validation
  if (subscription.enableRetryPolicy) {
    if (!subscription.minimumBackoff?.trim()) {
      errors.minimumBackoff = 'Minimum backoff is required when retry policy is enabled'
    }
    if (!subscription.maximumBackoff?.trim()) {
      errors.maximumBackoff = 'Maximum backoff is required when retry policy is enabled'
    }
  }

  return errors
}

export const validateSubscriptionName = (name: string): string => {
  if (!name.trim()) {
    return 'Subscription name is required'
  }

  if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(name)) {
    return 'Subscription name must start with a letter and contain only letters, numbers, hyphens, and underscores'
  }

  if (name.length > 255) {
    return 'Subscription name must be less than 255 characters'
  }

  return ''
}

export const normalizeSubscriptionName = (name: string): string => {
  const trimmed = name.trim()
  if (!trimmed) return ''

  let normalized = trimmed.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-')
  normalized = normalized.replace(/^-+/, '').replace(/-+$/, '')

  if (!/^[a-zA-Z]/.test(normalized)) {
    normalized = `sub-${normalized}`
  }

  return normalized
}

export const buildSubscriptionRequest = (
  projectId: string,
  topicFullName: string,
  form: SubscriptionForm
): CreateSubscriptionRequest => {
  const request: CreateSubscriptionRequest = {
    name: normalizeSubscriptionName(form.name),
    topic: topicFullName,
    ackDeadlineSeconds: form.ackDeadlineSeconds,
    enableMessageOrdering: form.enableMessageOrdering,
  }

  if (form.filter && form.filter.trim()) {
    request.filter = form.filter.trim()
  }

  if (form.deliveryType === 'push' && form.pushEndpoint?.trim()) {
    request.pushConfig = {
      pushEndpoint: form.pushEndpoint.trim(),
    }
  }

  if (form.deliveryType === 'bigquery' && form.bigqueryTable?.trim()) {
    request.bigqueryConfig = {
      table: form.bigqueryTable.trim(),
      useTopicSchema: form.useTopicSchema || false,
      writeMetadata: form.writeMetadata || false,
    }
  }

  if ((form.enableDeadLetter || (form as any).useDeadLetter) && form.deadLetterTopic?.trim()) {
    // If user provided a short topic name, format it to full path. If it's already a full path, use it.
    const dlTopicPath = form.deadLetterTopic.includes('/')
      ? form.deadLetterTopic
      : `projects/${projectId}/topics/${form.deadLetterTopic.trim()}`

    request.deadLetterPolicy = {
      deadLetterTopic: dlTopicPath,
      maxDeliveryAttempts: form.maxDeliveryAttempts || 5,
    }
  }

  if (
    (form.enableRetryPolicy || (form as any).useRetryPolicy) &&
    form.minimumBackoff &&
    form.maximumBackoff
  ) {
    request.retryPolicy = {
      minimumBackoff: form.minimumBackoff.trim(),
      maximumBackoff: form.maximumBackoff.trim(),
    }
  }

  return request
}
