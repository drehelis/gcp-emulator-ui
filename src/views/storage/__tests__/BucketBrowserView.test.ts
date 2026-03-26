import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BucketBrowserView from '../BucketBrowserView.vue'
import { useStorageStore } from '@/stores/storage'

// Mock icons
vi.mock('@heroicons/vue/24/outline', () => ({
  ArchiveBoxIcon: { template: '<svg></svg>' },
  ArrowLeftIcon: { template: '<svg></svg>' },
  ArrowPathIcon: { template: '<svg></svg>' },
  ArrowUpTrayIcon: { template: '<svg></svg>' },
  ArrowDownTrayIcon: { template: '<svg></svg>' },
  HomeIcon: { template: '<svg></svg>' },
  ChevronRightIcon: { template: '<svg></svg>' },
  ChevronUpIcon: { template: '<svg></svg>' },
  ChevronDownIcon: { template: '<svg></svg>' },
  DocumentIcon: { template: '<svg></svg>' },
  DocumentTextIcon: { template: '<svg></svg>' },
  FolderIcon: { template: '<svg></svg>' },
  FolderPlusIcon: { template: '<svg></svg>' },
  TrashIcon: { template: '<svg></svg>' },
  ExclamationTriangleIcon: { template: '<svg></svg>' },
  XMarkIcon: { template: '<svg></svg>' },
  LinkIcon: { template: '<svg></svg>' },
}))

// Mock headlessui
vi.mock('@headlessui/vue', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogPanel: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  TransitionRoot: { template: '<div><slot /></div>' },
  TransitionChild: { template: '<div><slot /></div>' },
}))

const pushMock = vi.fn()
const useRouteMock = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
    resolve: vi.fn(),
  }),
  useRoute: () => useRouteMock(),
  RouterLink: { template: '<a><slot /></a>' },
}))

describe('BucketBrowserView Download Fix', () => {
  let wrapper: any
  let storageStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    useRouteMock.mockReturnValue({
      params: { bucketName: 'test-bucket', projectId: 'test-project' },
      query: {},
    })
  })

  it('uses fullPath when downloading an object from a folder', async () => {
    wrapper = mount(BucketBrowserView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: true,
          }),
        ],
        stubs: {
          ConfirmationModal: true,
          FileDropZone: true,
        },
      },
    })

    storageStore = useStorageStore()

    // Setup objects in a folder
    storageStore.objects = [
      {
        name: 'data.json',
        fullPath: 'folder/data.json',
        isFolder: false,
        size: '100',
        contentType: 'application/json',
      },
    ]
    storageStore.viewMode = 'list'

    await wrapper.vm.$nextTick()

    // Find the download button (it's the ⇅ button in the list)
    // The button text is "↓"
    const downloadButton = wrapper.findAll('button').find((b: any) => b.text() === '↓')
    expect(downloadButton?.exists()).toBe(true)

    // Click it
    await downloadButton?.trigger('click')

    // Verify it called downloadObject with the fullPath
    expect(storageStore.downloadObject).toHaveBeenCalledWith('test-bucket', 'folder/data.json')
  })

  it('falls back to name if fullPath is missing', async () => {
    wrapper = mount(BucketBrowserView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: true,
          }),
        ],
        stubs: {
          ConfirmationModal: true,
          FileDropZone: true,
        },
      },
    })

    storageStore = useStorageStore()

    // Setup object without fullPath
    storageStore.objects = [
      {
        name: 'root-file.json',
        isFolder: false,
        size: '100',
        contentType: 'application/json',
      },
    ]
    storageStore.viewMode = 'list'

    await wrapper.vm.$nextTick()

    // Find the download button
    const downloadButton = wrapper.findAll('button').find((b: any) => b.text() === '↓')
    expect(downloadButton?.exists()).toBe(true)

    await downloadButton?.trigger('click')

    // Verify it called downloadObject with the name
    expect(storageStore.downloadObject).toHaveBeenCalledWith('test-bucket', 'root-file.json')
  })
})
