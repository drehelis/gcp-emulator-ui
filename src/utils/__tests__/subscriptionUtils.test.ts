/**
 * Tests for subscriptionUtils
 * Covers validation, normalization, and request building for Pub/Sub subscriptions
 */

import { describe, it, expect } from 'vitest'
import {
  validateResourceName,
  validateSubscriptionName,
  normalizeSubscriptionName,
  validateSubscriptionForm,
  buildSubscriptionRequest,
  type SubscriptionForm,
} from '@/utils/subscriptionUtils'

// Helper to create a valid base form for testing
const createBaseForm = (overrides: Partial<SubscriptionForm> = {}): SubscriptionForm => ({
  name: 'test-subscription',
  deliveryType: 'pull',
  ackDeadlineSeconds: 30,
  enableMessageOrdering: false,
  enableDeadLetter: false,
  enableRetryPolicy: false,
  ...overrides,
})

describe('subscriptionUtils', () => {
  // ── validateResourceName ──────────────────────────────────────────────

  describe('validateResourceName', () => {
    it('returns error when name is empty', () => {
      expect(validateResourceName('', 'Subscription')).toBe('Subscription name is required')
    })

    it('returns error when name is only whitespace', () => {
      expect(validateResourceName('   ', 'Subscription')).toBe('Subscription name is required')
    })

    it('returns error when name is less than 3 characters', () => {
      expect(validateResourceName('ab', 'Subscription')).toBe(
        'Subscription name must be at least 3 characters',
      )
    })

    it('returns error when name starts with a number', () => {
      expect(validateResourceName('1abc', 'Topic')).toBe(
        'Topic name must start with a letter and contain only letters, numbers, hyphens, and underscores',
      )
    })

    it('returns error when name starts with a hyphen', () => {
      expect(validateResourceName('-abc', 'Subscription')).toBe(
        'Subscription name must start with a letter and contain only letters, numbers, hyphens, and underscores',
      )
    })

    it('returns error when name contains special characters', () => {
      expect(validateResourceName('abc@def', 'Subscription')).toBe(
        'Subscription name must start with a letter and contain only letters, numbers, hyphens, and underscores',
      )
    })

    it('returns error when name contains spaces', () => {
      expect(validateResourceName('abc def', 'Subscription')).toBe(
        'Subscription name must start with a letter and contain only letters, numbers, hyphens, and underscores',
      )
    })

    it('returns error when name exceeds 255 characters', () => {
      const longName = 'a' + 'b'.repeat(255)
      expect(validateResourceName(longName, 'Subscription')).toBe(
        'Subscription name must be less than 255 characters',
      )
    })

    it('returns empty string for valid name', () => {
      expect(validateResourceName('valid-name', 'Subscription')).toBe('')
    })

    it('accepts names with letters, numbers, hyphens, and underscores', () => {
      expect(validateResourceName('my-sub_123', 'Subscription')).toBe('')
    })

    it('accepts uppercase letters', () => {
      expect(validateResourceName('MySubscription', 'Subscription')).toBe('')
    })

    it('uses the provided resource label in error messages', () => {
      expect(validateResourceName('', 'Topic')).toBe('Topic name is required')
    })

    it('accepts a name with exactly 3 characters', () => {
      expect(validateResourceName('abc', 'Subscription')).toBe('')
    })

    it('accepts a name with exactly 255 characters', () => {
      const name = 'a' + 'b'.repeat(254)
      expect(validateResourceName(name, 'Subscription')).toBe('')
    })
  })

  // ── validateSubscriptionName ──────────────────────────────────────────

  describe('validateSubscriptionName', () => {
    it('delegates to validateResourceName with "Subscription" label', () => {
      expect(validateSubscriptionName('')).toBe('Subscription name is required')
    })

    it('returns empty string for valid subscription name', () => {
      expect(validateSubscriptionName('my-sub')).toBe('')
    })
  })

  // ── normalizeSubscriptionName ─────────────────────────────────────────

  describe('normalizeSubscriptionName', () => {
    it('returns empty string for empty input', () => {
      expect(normalizeSubscriptionName('')).toBe('')
    })

    it('returns empty string for whitespace-only input', () => {
      expect(normalizeSubscriptionName('   ')).toBe('')
    })

    it('replaces invalid characters with hyphens', () => {
      expect(normalizeSubscriptionName('my sub!name')).toBe('my-sub-name')
    })

    it('collapses multiple consecutive hyphens', () => {
      expect(normalizeSubscriptionName('my---sub')).toBe('my-sub')
    })

    it('removes leading hyphens', () => {
      expect(normalizeSubscriptionName('--my-sub')).toBe('my-sub')
    })

    it('removes trailing hyphens', () => {
      expect(normalizeSubscriptionName('my-sub--')).toBe('my-sub')
    })

    it('prepends "sub-" when name starts with a number', () => {
      expect(normalizeSubscriptionName('123abc')).toBe('sub-123abc')
    })

    it('trims whitespace before normalizing', () => {
      expect(normalizeSubscriptionName('  my-sub  ')).toBe('my-sub')
    })

    it('keeps valid names unchanged', () => {
      expect(normalizeSubscriptionName('valid-name')).toBe('valid-name')
    })

    it('handles underscores correctly', () => {
      expect(normalizeSubscriptionName('my_sub_name')).toBe('my_sub_name')
    })
  })

  // ── validateSubscriptionForm ──────────────────────────────────────────

  describe('validateSubscriptionForm', () => {
    it('returns no errors for a valid pull subscription', () => {
      const form = createBaseForm()
      expect(validateSubscriptionForm(form)).toEqual({})
    })

    // Name validation
    it('validates name when validateName option is true', () => {
      const form = createBaseForm({ name: '' })
      const errors = validateSubscriptionForm(form, { validateName: true })
      expect(errors.name).toBe('Subscription name is required')
    })

    it('skips name validation when validateName is false', () => {
      const form = createBaseForm({ name: '' })
      const errors = validateSubscriptionForm(form)
      expect(errors.name).toBeUndefined()
    })

    // Ack deadline validation
    it('returns error when ack deadline is below 10', () => {
      const form = createBaseForm({ ackDeadlineSeconds: 5 })
      const errors = validateSubscriptionForm(form)
      expect(errors.ackDeadlineSeconds).toBe('Ack deadline must be between 10 and 600 seconds')
    })

    it('returns error when ack deadline is above 600', () => {
      const form = createBaseForm({ ackDeadlineSeconds: 601 })
      const errors = validateSubscriptionForm(form)
      expect(errors.ackDeadlineSeconds).toBe('Ack deadline must be between 10 and 600 seconds')
    })

    it('accepts ack deadline at lower boundary (10)', () => {
      const form = createBaseForm({ ackDeadlineSeconds: 10 })
      const errors = validateSubscriptionForm(form)
      expect(errors.ackDeadlineSeconds).toBeUndefined()
    })

    it('accepts ack deadline at upper boundary (600)', () => {
      const form = createBaseForm({ ackDeadlineSeconds: 600 })
      const errors = validateSubscriptionForm(form)
      expect(errors.ackDeadlineSeconds).toBeUndefined()
    })

    // Push endpoint validation
    it('returns error when push subscription has no endpoint', () => {
      const form = createBaseForm({ deliveryType: 'push', pushEndpoint: '' })
      const errors = validateSubscriptionForm(form)
      expect(errors.pushEndpoint).toBe('Push endpoint is required for push subscriptions')
    })

    it('returns error when push endpoint is only whitespace', () => {
      const form = createBaseForm({ deliveryType: 'push', pushEndpoint: '   ' })
      const errors = validateSubscriptionForm(form)
      expect(errors.pushEndpoint).toBe('Push endpoint is required for push subscriptions')
    })

    it('skips push validation when existing endpoint is provided', () => {
      const form = createBaseForm({ deliveryType: 'push', pushEndpoint: '' })
      const errors = validateSubscriptionForm(form, {
        skipPushEndpointIfExists: true,
        existingPushEndpoint: 'https://example.com/push',
      })
      expect(errors.pushEndpoint).toBeUndefined()
    })

    it('does not require push endpoint for pull subscriptions', () => {
      const form = createBaseForm({ deliveryType: 'pull', pushEndpoint: '' })
      const errors = validateSubscriptionForm(form)
      expect(errors.pushEndpoint).toBeUndefined()
    })

    // BigQuery validation
    it('returns error when bigquery subscription has no table', () => {
      const form = createBaseForm({ deliveryType: 'bigquery', bigqueryTable: '' })
      const errors = validateSubscriptionForm(form, { validateBigQuery: true })
      expect(errors.bigqueryTable).toBe('BigQuery table is required for BigQuery subscriptions')
    })

    it('skips bigquery validation when validateBigQuery is false', () => {
      const form = createBaseForm({ deliveryType: 'bigquery', bigqueryTable: '' })
      const errors = validateSubscriptionForm(form)
      expect(errors.bigqueryTable).toBeUndefined()
    })

    // Dead letter validation
    it('returns error when dead letter is enabled but no topic specified', () => {
      const form = createBaseForm({ enableDeadLetter: true, deadLetterTopic: '' })
      const errors = validateSubscriptionForm(form)
      expect(errors.deadLetterTopic).toBe(
        'Dead letter topic is required when dead letter policy is enabled',
      )
    })

    it('returns error when dead letter topic is only whitespace', () => {
      const form = createBaseForm({ enableDeadLetter: true, deadLetterTopic: '   ' })
      const errors = validateSubscriptionForm(form)
      expect(errors.deadLetterTopic).toBe(
        'Dead letter topic is required when dead letter policy is enabled',
      )
    })

    it('accepts valid dead letter topic', () => {
      const form = createBaseForm({ enableDeadLetter: true, deadLetterTopic: 'dl-topic' })
      const errors = validateSubscriptionForm(form)
      expect(errors.deadLetterTopic).toBeUndefined()
    })

    // Retry policy validation
    it('returns errors when retry policy enabled but backoffs missing', () => {
      const form = createBaseForm({
        enableRetryPolicy: true,
        minimumBackoff: '',
        maximumBackoff: '',
      })
      const errors = validateSubscriptionForm(form)
      expect(errors.minimumBackoff).toBe('Minimum backoff is required when retry policy is enabled')
      expect(errors.maximumBackoff).toBe('Maximum backoff is required when retry policy is enabled')
    })

    it('accepts valid retry policy configuration', () => {
      const form = createBaseForm({
        enableRetryPolicy: true,
        minimumBackoff: '10s',
        maximumBackoff: '600s',
      })
      const errors = validateSubscriptionForm(form)
      expect(errors.minimumBackoff).toBeUndefined()
      expect(errors.maximumBackoff).toBeUndefined()
    })

    it('does not validate retry backoffs when retry policy is disabled', () => {
      const form = createBaseForm({
        enableRetryPolicy: false,
        minimumBackoff: '',
        maximumBackoff: '',
      })
      const errors = validateSubscriptionForm(form)
      expect(errors.minimumBackoff).toBeUndefined()
      expect(errors.maximumBackoff).toBeUndefined()
    })

    // Multiple errors
    it('can return multiple errors at once', () => {
      const form = createBaseForm({
        name: '',
        ackDeadlineSeconds: 5,
        enableDeadLetter: true,
        deadLetterTopic: '',
      })
      const errors = validateSubscriptionForm(form, { validateName: true })
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(3)
      expect(errors.name).toBeDefined()
      expect(errors.ackDeadlineSeconds).toBeDefined()
      expect(errors.deadLetterTopic).toBeDefined()
    })
  })

  // ── buildSubscriptionRequest ──────────────────────────────────────────

  describe('buildSubscriptionRequest', () => {
    const projectId = 'test-project'
    const topicFullName = 'projects/test-project/topics/test-topic'

    it('builds a basic pull subscription request', () => {
      const form = createBaseForm()
      const request = buildSubscriptionRequest(projectId, topicFullName, form)

      expect(request.name).toBe('test-subscription')
      expect(request.topic).toBe(topicFullName)
      expect(request.ackDeadlineSeconds).toBe(30)
      expect(request.enableMessageOrdering).toBe(false)
      expect(request.pushConfig).toBeUndefined()
      expect(request.bigqueryConfig).toBeUndefined()
      expect(request.deadLetterPolicy).toBeUndefined()
      expect(request.retryPolicy).toBeUndefined()
      expect(request.filter).toBeUndefined()
    })

    it('includes filter when provided', () => {
      const form = createBaseForm({ filter: 'attributes.type = "important"' })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.filter).toBe('attributes.type = "important"')
    })

    it('trims filter whitespace', () => {
      const form = createBaseForm({ filter: '  attributes.type = "important"  ' })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.filter).toBe('attributes.type = "important"')
    })

    it('does not include filter when empty', () => {
      const form = createBaseForm({ filter: '' })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.filter).toBeUndefined()
    })

    it('does not include filter when only whitespace', () => {
      const form = createBaseForm({ filter: '   ' })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.filter).toBeUndefined()
    })

    // Push config
    it('includes pushConfig for push delivery type', () => {
      const form = createBaseForm({
        deliveryType: 'push',
        pushEndpoint: 'https://example.com/push',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.pushConfig).toEqual({ pushEndpoint: 'https://example.com/push' })
    })

    it('trims push endpoint whitespace', () => {
      const form = createBaseForm({
        deliveryType: 'push',
        pushEndpoint: '  https://example.com/push  ',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.pushConfig?.pushEndpoint).toBe('https://example.com/push')
    })

    it('does not include pushConfig for pull delivery type', () => {
      const form = createBaseForm({ deliveryType: 'pull', pushEndpoint: 'https://example.com' })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.pushConfig).toBeUndefined()
    })

    // BigQuery config
    it('includes bigqueryConfig for bigquery delivery type', () => {
      const form = createBaseForm({
        deliveryType: 'bigquery',
        bigqueryTable: 'project.dataset.table',
        useTopicSchema: true,
        writeMetadata: true,
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.bigqueryConfig).toEqual({
        table: 'project.dataset.table',
        useTopicSchema: true,
        writeMetadata: true,
      })
    })

    it('defaults useTopicSchema and writeMetadata to false', () => {
      const form = createBaseForm({
        deliveryType: 'bigquery',
        bigqueryTable: 'project.dataset.table',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.bigqueryConfig?.useTopicSchema).toBe(false)
      expect(request.bigqueryConfig?.writeMetadata).toBe(false)
    })

    it('does not include bigqueryConfig for pull delivery type', () => {
      const form = createBaseForm({
        deliveryType: 'pull',
        bigqueryTable: 'project.dataset.table',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.bigqueryConfig).toBeUndefined()
    })

    // Dead letter policy
    it('includes deadLetterPolicy with short topic name', () => {
      const form = createBaseForm({
        enableDeadLetter: true,
        deadLetterTopic: 'dl-topic',
        maxDeliveryAttempts: 10,
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.deadLetterPolicy).toEqual({
        deadLetterTopic: 'projects/test-project/topics/dl-topic',
        maxDeliveryAttempts: 10,
      })
    })

    it('uses full path for dead letter topic when already provided', () => {
      const fullPath = 'projects/other-project/topics/dl-topic'
      const form = createBaseForm({
        enableDeadLetter: true,
        deadLetterTopic: fullPath,
        maxDeliveryAttempts: 7,
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.deadLetterPolicy?.deadLetterTopic).toBe(fullPath)
    })

    it('defaults maxDeliveryAttempts to 5', () => {
      const form = createBaseForm({
        enableDeadLetter: true,
        deadLetterTopic: 'dl-topic',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.deadLetterPolicy?.maxDeliveryAttempts).toBe(5)
    })

    it('does not include deadLetterPolicy when disabled', () => {
      const form = createBaseForm({
        enableDeadLetter: false,
        deadLetterTopic: 'dl-topic',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.deadLetterPolicy).toBeUndefined()
    })

    // Retry policy
    it('includes retryPolicy when enabled', () => {
      const form = createBaseForm({
        enableRetryPolicy: true,
        minimumBackoff: '10s',
        maximumBackoff: '600s',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.retryPolicy).toEqual({
        minimumBackoff: '10s',
        maximumBackoff: '600s',
      })
    })

    it('trims retry policy backoff values', () => {
      const form = createBaseForm({
        enableRetryPolicy: true,
        minimumBackoff: '  10s  ',
        maximumBackoff: '  600s  ',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.retryPolicy?.minimumBackoff).toBe('10s')
      expect(request.retryPolicy?.maximumBackoff).toBe('600s')
    })

    it('does not include retryPolicy when disabled', () => {
      const form = createBaseForm({
        enableRetryPolicy: false,
        minimumBackoff: '10s',
        maximumBackoff: '600s',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.retryPolicy).toBeUndefined()
    })

    // Normalization
    it('normalizes the subscription name in the request', () => {
      const form = createBaseForm({ name: 'my sub name!' })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)
      expect(request.name).toBe('my-sub-name')
    })

    // Full config
    it('builds a fully-configured subscription request', () => {
      const form = createBaseForm({
        name: 'full-sub',
        deliveryType: 'push',
        pushEndpoint: 'https://example.com/push',
        ackDeadlineSeconds: 60,
        enableMessageOrdering: true,
        filter: 'attributes.priority = "high"',
        enableDeadLetter: true,
        deadLetterTopic: 'dl-topic',
        maxDeliveryAttempts: 10,
        enableRetryPolicy: true,
        minimumBackoff: '10s',
        maximumBackoff: '600s',
      })
      const request = buildSubscriptionRequest(projectId, topicFullName, form)

      expect(request.name).toBe('full-sub')
      expect(request.topic).toBe(topicFullName)
      expect(request.ackDeadlineSeconds).toBe(60)
      expect(request.enableMessageOrdering).toBe(true)
      expect(request.filter).toBe('attributes.priority = "high"')
      expect(request.pushConfig?.pushEndpoint).toBe('https://example.com/push')
      expect(request.deadLetterPolicy?.deadLetterTopic).toBe(
        'projects/test-project/topics/dl-topic',
      )
      expect(request.deadLetterPolicy?.maxDeliveryAttempts).toBe(10)
      expect(request.retryPolicy?.minimumBackoff).toBe('10s')
      expect(request.retryPolicy?.maximumBackoff).toBe('600s')
    })
  })
})
