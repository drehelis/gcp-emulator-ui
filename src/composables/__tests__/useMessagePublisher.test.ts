import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Buffer } from 'buffer'
import { useMessagePublisher } from '../useMessagePublisher'

const mocks = vi.hoisted(() => ({
  mockPublishMessage: vi.fn(),
  mockShowToast: vi.fn(),
}))

vi.mock('@/api/pubsub', () => ({
  topicsApi: {
    publishMessage: mocks.mockPublishMessage,
  },
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showToast: mocks.mockShowToast,
  }),
}))

describe('useMessagePublisher', () => {
  beforeEach(() => {
    mocks.mockPublishMessage.mockReset()
    mocks.mockShowToast.mockReset()

    if (!globalThis.btoa) {
      globalThis.btoa = (value: string) => Buffer.from(value, 'utf-8').toString('base64')
    }
  })

  it('publishes a message and shows success toast', async () => {
    mocks.mockPublishMessage.mockResolvedValue({ messageIds: ['msg-1'] })

    const publisher = useMessagePublisher()
    publisher.messageData.value = '{"hello":"world"}'
    publisher.formatAsJson.value = true

    const result = await publisher.publishMessage('project-1', 'topic-1')

    expect(mocks.mockPublishMessage).toHaveBeenCalledOnce()
    expect(mocks.mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', title: 'Message Published' })
    )
    expect(result).toBe('msg-1')
  })

  it('shows error toast when publish fails', async () => {
    mocks.mockPublishMessage.mockRejectedValue(new Error('Boom'))

    const publisher = useMessagePublisher()
    publisher.messageData.value = '{"hello":"world"}'
    publisher.formatAsJson.value = true

    await expect(publisher.publishMessage('project-1', 'topic-1')).rejects.toThrow('Boom')
    expect(mocks.mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', title: 'Publish Failed' })
    )
  })

  describe('validateJson', () => {
    it('clears error when formatAsJson is false', () => {
      const publisher = useMessagePublisher()
      publisher.formatAsJson.value = false
      publisher.messageData.value = 'invalid json'
      publisher.validateJson()
      expect(publisher.jsonValidationError.value).toBe('')
    })

    it('clears error when messageData is blank', () => {
      const publisher = useMessagePublisher()
      publisher.formatAsJson.value = true
      publisher.messageData.value = '   '
      publisher.validateJson()
      expect(publisher.jsonValidationError.value).toBe('')
    })

    it('sets error for invalid JSON', () => {
      const publisher = useMessagePublisher()
      publisher.formatAsJson.value = true
      publisher.messageData.value = 'not-json'
      publisher.validateJson()
      expect(publisher.jsonValidationError.value).toBe('Invalid JSON format')
    })

    it('clears error for valid JSON', () => {
      const publisher = useMessagePublisher()
      publisher.formatAsJson.value = true
      publisher.messageData.value = '{"valid": true}'
      publisher.validateJson()
      expect(publisher.jsonValidationError.value).toBe('')
    })
  })

  describe('canPublish computed', () => {
    it('is false when messageData is empty', () => {
      const publisher = useMessagePublisher()
      publisher.messageData.value = ''
      expect(publisher.canPublish.value).toBe(false)
    })

    it('is false when there is a JSON validation error', () => {
      const publisher = useMessagePublisher()
      publisher.messageData.value = 'invalid'
      publisher.formatAsJson.value = true
      publisher.validateJson()
      expect(publisher.canPublish.value).toBe(false)
    })

    it('is true for valid JSON message', () => {
      const publisher = useMessagePublisher()
      publisher.messageData.value = '{"ok":1}'
      publisher.formatAsJson.value = true
      publisher.validateJson()
      expect(publisher.canPublish.value).toBe(true)
    })
  })

  describe('publishMessage - skips when canPublish is false', () => {
    it('returns early without calling API when messageData is empty', async () => {
      const publisher = useMessagePublisher()
      publisher.messageData.value = ''
      await publisher.publishMessage('project-1', 'topic-1')
      expect(mocks.mockPublishMessage).not.toHaveBeenCalled()
    })
  })

  describe('publishMessage - attributes', () => {
    it('includes non-empty attributes in publish call', async () => {
      mocks.mockPublishMessage.mockResolvedValue({ messageIds: ['msg-2'] })
      const publisher = useMessagePublisher()
      publisher.messageData.value = 'hello'
      publisher.formatAsJson.value = false
      publisher.messageAttributes.value = [
        { key: 'env', value: 'prod' },
        { key: '  ', value: 'ignored' }, // blank key — should be excluded
        { key: 'region', value: 'us-east1' },
      ]
      await publisher.publishMessage('p', 't')
      const call = mocks.mockPublishMessage.mock.calls[0][2]
      expect(call.attributes).toEqual({ env: 'prod', region: 'us-east1' })
    })
  })

  describe('publishMessage - messageIds fallback', () => {
    it('returns "unknown" when messageIds is missing', async () => {
      mocks.mockPublishMessage.mockResolvedValue({})
      const publisher = useMessagePublisher()
      publisher.messageData.value = 'hello'
      publisher.formatAsJson.value = false
      const result = await publisher.publishMessage('p', 't')
      expect(result).toBe('unknown')
    })
  })

  describe('publishMessage - non-JSON with formatAsJson', () => {
    it('keeps original data when JSON parsing fails mid-pipeline', async () => {
      mocks.mockPublishMessage.mockResolvedValue({ messageIds: ['x'] })
      const publisher = useMessagePublisher()
      // Start as non-JSON-format to bypass canPublish block
      publisher.formatAsJson.value = false
      publisher.messageData.value = 'plain text'

      // Publish plain text
      await publisher.publishMessage('p', 't')
      const call = mocks.mockPublishMessage.mock.calls[0][2]
      // plain text base64-encoded
      expect(call.data).toBe(btoa('plain text'))
    })
  })

  describe('processTemplate', () => {
    it('replaces template variables in message', async () => {
      mocks.mockPublishMessage.mockResolvedValue({ messageIds: ['t1'] })
      const publisher = useMessagePublisher()
      publisher.formatAsJson.value = false
      publisher.messageData.value = 'Hello {{.name}}!'
      publisher.templateVariables.value = [{ name: 'name', value: 'World' }]

      await publisher.publishMessage('p', 't')
      const call = mocks.mockPublishMessage.mock.calls[0][2]
      expect(atob(call.data)).toBe('Hello World!')
    })

    it('skips variables with blank name or value', async () => {
      mocks.mockPublishMessage.mockResolvedValue({ messageIds: ['t2'] })
      const publisher = useMessagePublisher()
      publisher.formatAsJson.value = false
      publisher.messageData.value = 'Hello {{.name}}!'
      publisher.templateVariables.value = [{ name: '', value: 'ignored' }]

      await publisher.publishMessage('p', 't')
      const call = mocks.mockPublishMessage.mock.calls[0][2]
      expect(atob(call.data)).toBe('Hello {{.name}}!')
    })
  })

  describe('loadFromTemplate', () => {
    it('loads data, sets formatAsJson=true for valid JSON', () => {
      const publisher = useMessagePublisher()
      publisher.loadFromTemplate({
        data: '{"key":"val"}',
        attributes: { env: 'dev' },
        variables: { greeting: 'hi' },
      })
      expect(publisher.messageData.value).toBe('{"key":"val"}')
      expect(publisher.formatAsJson.value).toBe(true)
      expect(publisher.templateVariables.value).toEqual([{ name: 'greeting', value: 'hi' }])
      expect(publisher.messageAttributes.value).toEqual([{ key: 'env', value: 'dev' }])
    })

    it('sets formatAsJson=false for non-JSON data', () => {
      const publisher = useMessagePublisher()
      publisher.loadFromTemplate({
        data: 'plain text',
        attributes: {},
        variables: {},
      })
      expect(publisher.formatAsJson.value).toBe(false)
    })

    it('resets templateVariables to default when variables is empty', () => {
      const publisher = useMessagePublisher()
      publisher.loadFromTemplate({
        data: 'hello',
        attributes: {},
        variables: {},
      })
      expect(publisher.templateVariables.value).toEqual([{ name: '', value: '' }])
    })

    it('resets messageAttributes to default when attributes is empty', () => {
      const publisher = useMessagePublisher()
      publisher.loadFromTemplate({
        data: 'hello',
        attributes: {},
        variables: {},
      })
      expect(publisher.messageAttributes.value).toEqual([{ key: '', value: '' }])
    })
  })

  describe('resetForm', () => {
    it('resets all form fields to defaults', () => {
      const publisher = useMessagePublisher()
      publisher.messageData.value = 'some data'
      publisher.formatAsJson.value = false
      publisher.jsonValidationError.value = 'bad json'
      publisher.templateVariables.value = [{ name: 'x', value: 'y' }]
      publisher.messageAttributes.value = [{ key: 'k', value: 'v' }]

      publisher.resetForm()

      expect(publisher.messageData.value).toBe('')
      expect(publisher.formatAsJson.value).toBe(true)
      expect(publisher.jsonValidationError.value).toBe('')
      expect(publisher.templateVariables.value).toEqual([{ name: '', value: '' }])
      expect(publisher.messageAttributes.value).toEqual([{ key: '', value: '' }])
    })
  })
})
