import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SubscriptionsListView from '@/views/subscriptions/SubscriptionsListView.vue'
import { subscriptionsApi } from '@/api/pubsub'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { projectId: 'test-project' },
    hash: '',
  }),
}))

vi.mock('@/utils/focusUtils', () => ({
  handleTopicFocus: vi.fn(),
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/pubsub', () => ({
  subscriptionsApi: {
    getSubscriptions: vi.fn(),
    deleteSubscription: vi.fn(),
    pullMessages: vi.fn(),
    acknowledgeMessages: vi.fn(),
  },
}))

const baseSubscriptions = [
  {
    name: 'projects/test-project/subscriptions/sub-a',
    topic: 'projects/test-project/topics/topic-a',
    ackDeadlineSeconds: 10,
  },
  {
    name: 'projects/test-project/subscriptions/sub-b',
    topic: 'projects/test-project/topics/topic-a',
    ackDeadlineSeconds: 10,
  },
]

const mountView = () =>
  mount(SubscriptionsListView, {
    global: {
      stubs: {
        SubscriptionMessagesModal: {
          name: 'SubscriptionMessagesModal',
          template: '<div />',
        },
        ConfirmationModal: {
          name: 'ConfirmationModal',
          template: '<div />',
          emits: ['confirm', 'cancel', 'update:modelValue'],
        },
        ArrowPathIcon: true,
        ExclamationCircleIcon: true,
        InboxStackIcon: true,
        QueueListIcon: true,
        ChevronDownIcon: true,
        ChevronRightIcon: true,
        TrashIcon: true,
        EyeIcon: true,
      },
    },
  })

const getRefreshButton = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('button').find(button => button.text().includes('Refresh'))

const getTopicHeader = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('#topic-topic-a').find('div.cursor-pointer')

const getDeleteButton = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('button').find(button => button.attributes('title') === 'Delete subscription')

describe('SubscriptionsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('keeps the topic expanded after refresh', async () => {
    const getSubscriptionsMock = vi.mocked(subscriptionsApi.getSubscriptions)

    getSubscriptionsMock.mockResolvedValue(baseSubscriptions)
    const wrapper = mountView()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#topic-topic-a').exists()).toBe(true)

    await getTopicHeader(wrapper).trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('sub-a')

    const refreshButton = getRefreshButton(wrapper)
    expect(refreshButton).toBeTruthy()
    await refreshButton!.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('sub-a')
  })

  it('keeps the topic expanded after deleting a subscription', async () => {
    const getSubscriptionsMock = vi.mocked(subscriptionsApi.getSubscriptions)
    const deleteSubscriptionMock = vi.mocked(subscriptionsApi.deleteSubscription)

    getSubscriptionsMock
      .mockResolvedValueOnce(baseSubscriptions)
      .mockResolvedValueOnce(baseSubscriptions)
      .mockResolvedValueOnce([baseSubscriptions[1]])
    deleteSubscriptionMock.mockResolvedValueOnce(undefined)

    const wrapper = mountView()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#topic-topic-a').exists()).toBe(true)

    await getTopicHeader(wrapper).trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    const deleteButton = getDeleteButton(wrapper)
    expect(deleteButton).toBeTruthy()
    await deleteButton!.trigger('click')

    const confirmationModal = wrapper.findComponent({ name: 'ConfirmationModal' })
    confirmationModal.vm.$emit('confirm')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(deleteSubscriptionMock).toHaveBeenCalled()
    expect(wrapper.text()).toContain('sub-b')
    expect(wrapper.text()).toContain('sub-b')
    expect(wrapper.text()).not.toContain('sub-a')
  })
})
