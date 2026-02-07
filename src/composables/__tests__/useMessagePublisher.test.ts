import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})
