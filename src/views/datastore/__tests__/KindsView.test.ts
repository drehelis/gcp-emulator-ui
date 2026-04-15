import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import KindsView from '../KindsView.vue'
import { useDatastoreStore } from '@/stores/datastore'

// Mock icons
vi.mock('@heroicons/vue/24/outline', () => ({
  ArrowPathIcon: { template: '<svg></svg>' },
  CircleStackIcon: { template: '<svg></svg>' },
  FolderIcon: { template: '<svg></svg>' },
  CubeIcon: { template: '<svg></svg>' },
  InformationCircleIcon: { template: '<svg></svg>' },
  PlusIcon: { template: '<svg></svg>' },
  InboxIcon: { template: '<svg></svg>' },
  TrashIcon: { template: '<svg></svg>' },
  ChevronUpDownIcon: { template: '<svg></svg>' },
  ChevronRightIcon: { template: '<svg></svg>' },
  ChevronLeftIcon: { template: '<svg></svg>' },
  ChevronDownIcon: { template: '<svg></svg>' },
  ViewColumnsIcon: { template: '<svg></svg>' },
  FunnelIcon: { template: '<svg></svg>' },
  XMarkIcon: { template: '<svg></svg>' },
  PlayIcon: { template: '<svg></svg>' },
  ClipboardIcon: { template: '<svg></svg>' },
  CheckIcon: { template: '<svg></svg>' },
}))

// Mock headlessui
vi.mock('@headlessui/vue', () => ({
  Menu: { template: '<div><slot /></div>' },
  MenuButton: { template: '<button><slot /></button>' },
  MenuItem: { template: '<div><slot /></div>' },
  MenuItems: { template: '<div><slot /></div>' },
  Dialog: { template: '<div><slot /></div>' },
  DialogPanel: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  TransitionRoot: { template: '<div><slot /></div>' },
  TransitionChild: { template: '<div><slot /></div>' },
}))

const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useRoute: () => ({
    params: { projectId: 'test-project' },
    query: {},
  }),
  RouterLink: { template: '<a><slot /></a>' },
}))

describe('KindsView', () => {
  let wrapper: any
  let datastoreStore: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows delete all modal when clicking Delete All button', async () => {
    wrapper = mount(KindsView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: true,
          }),
        ],
        stubs: {
          ConfirmationModal: true,
          CreateEntityModal: true,
          EntityDetailsModal: true,
          CustomSelect: true,
        },
      },
    })

    datastoreStore = useDatastoreStore()

    // Find the Delete All button
    const deleteAllButton = wrapper
      .findAll('button')
      .find((b: any) => b.text().includes('Delete All'))
    expect(deleteAllButton?.exists()).toBe(true)

    // Click it
    await deleteAllButton?.trigger('click')

    // Check if showDeleteAllModal is true
    expect(wrapper.vm.showDeleteAllModal).toBe(true)
  })

  it('calls deleteAllContent when confirming delete all', async () => {
    wrapper = mount(KindsView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: true,
          }),
        ],
        stubs: {
          ConfirmationModal: {
            template:
              '<div v-if="modelValue"><button id="confirm-delete" @click="$emit(\'confirm\')">Confirm</button></div>',
            props: ['modelValue'],
          },
          CreateEntityModal: true,
          EntityDetailsModal: true,
          CustomSelect: true,
        },
      },
    })

    datastoreStore = useDatastoreStore()

    // Open the modal
    wrapper.vm.showDeleteAllModal = true
    await wrapper.vm.$nextTick()

    // Find and click confirm
    const confirmButton = wrapper.find('#confirm-delete')
    await confirmButton.trigger('click')

    // Verify store call
    expect(datastoreStore.deleteAllContent).toHaveBeenCalled()
  })

  it('preserves query parameters like db when changing namespace', async () => {
    wrapper = mount(KindsView, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              datastore: { selectedNamespace: 'new-ns' },
            },
            createSpy: vi.fn,
            stubActions: true,
          }),
        ],
        stubs: {
          ConfirmationModal: true,
          CreateEntityModal: true,
          EntityDetailsModal: true,
          CustomSelect: true,
        },
      },
    })

    datastoreStore = useDatastoreStore()
    await wrapper.vm.handleNamespaceChange()

    expect(pushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          ns: 'new-ns',
          kind: undefined,
        }),
      })
    )
  })
})
