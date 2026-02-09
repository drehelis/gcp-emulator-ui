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
    resolve: vi.fn(to => {
      // Basic mock implementation to return a href that includes the query params
      const query = new URLSearchParams(to.query).toString()
      return { href: `${to.path}?${query}` }
    }),
  }),
  useRoute: () => useRouteMock(),
  RouterLink: { template: '<a><slot /></a>' },
}))

// Mock storage API
vi.mock('@/api/storage', () => ({
  default: {
    listObjects: vi.fn(),
    getObjectDownloadUrl: vi.fn(),
    getBucket: vi.fn(),
    downloadObjectsAsZip: vi.fn(),
    downloadObject: vi.fn(),
  },
}))

describe('BucketBrowserView Deep Linking', () => {
  let wrapper: any
  let storageStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    useRouteMock.mockReturnValue({
      params: { bucketName: 'test-bucket', projectId: 'test-project' },
      query: {},
    })
  })

  it('fetches objects with path from query on mount', async () => {
    useRouteMock.mockReturnValue({
      params: { bucketName: 'test-bucket', projectId: 'test-project' },
      query: { path: 'folder/subfolder/' },
    })

    wrapper = mount(BucketBrowserView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          ConfirmationModal: true,
        },
      },
    })

    storageStore = useStorageStore()

    await flushPromises()

    // Verify fetchObjects was called with the path from query
    expect(storageStore.fetchObjects).toHaveBeenCalledWith('test-bucket', 'folder/subfolder/', true)
  })

  it('updates router query when navigating to folder', async () => {
    wrapper = mount(BucketBrowserView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            // stubActions: true is default which is what we want
          }),
        ],
        stubs: {
          ConfirmationModal: true,
        },
      },
    })

    storageStore = useStorageStore()

    // Simulate clicking a folder
    // We need to trigger handleObjectClick via the component method or by clicking an element
    // Since we mocked objects as empty, let's populate them
    storageStore.objects = [{ name: 'test-folder', isFolder: true, fullPath: 'test-folder/' }]
    await wrapper.vm.$nextTick()

    // Call the method directly for simplicity as accessing via click requires rendering list/grid
    await wrapper.vm.handleObjectClick({
      name: 'test-folder',
      isFolder: true,
      fullPath: 'test-folder/',
    })

    expect(pushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          path: 'test-folder/',
        }),
      })
    )
  })

  it('navigates correctly using fallback when fullPath is missing', async () => {
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
        },
      },
    })

    storageStore = useStorageStore()
    // Mock current path
    storageStore.currentPath = 'parent/'

    // Object without fullPath
    const folderObj = { name: 'child', isFolder: true }
    // Manually add to objects to avoid type errors in test if strict
    // storageStore.objects = [folderObj]

    await wrapper.vm.handleObjectClick(folderObj)

    // Should append slash: parent/child/
    expect(storageStore.fetchObjects).toHaveBeenCalledWith('test-bucket', 'parent/child/', true)

    expect(pushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          path: 'parent/child/',
        }),
      })
    )
  })

  it('triggers download when download query param is present', async () => {
    vi.useFakeTimers()

    useRouteMock.mockReturnValue({
      params: { bucketName: 'test-bucket', projectId: 'test-project' },
      query: { path: 'folder/', download: 'true' },
    })

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
        },
      },
    })

    storageStore = useStorageStore()

    // Mock listObjects to return some files
    const storageApi = await import('@/api/storage')
    // @ts-ignore
    storageApi.default.listObjects.mockResolvedValue({
      items: [{ name: 'folder/file.txt' }],
    })
    // @ts-ignore
    storageApi.default.downloadObjectsAsZip.mockResolvedValue(new Blob())

    // Wait for initial mount and fetchObjects
    await flushPromises()

    // Advance time to get past the 500ms delay in downloadItemsAsZip
    vi.advanceTimersByTime(500)
    // Wait for the async logic after timeout to execute
    await flushPromises()

    // It should have called listObjects to prepare download
    expect(storageApi.default.listObjects).toHaveBeenCalled()
    // Ideally check if downloadObjectsAsZip was called, but that requires waiting for async internal logic
    // We can check if listObjects was called with prefix 'folder/'
    expect(storageApi.default.listObjects).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'folder/',
      })
    )

    vi.useRealTimers()
  })

  it('generates correct download link for folders', async () => {
    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

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
        },
      },
    })

    storageStore = useStorageStore()
    storageStore.selectedObjects = ['folder/']

    // Call copyLinkToClipboard directly as it is not exposed on vm but we can trigger button if we render it
    // But we need to make sure the button is rendered.
    // The button has v-if="storageStore.selectedObjects.length === 1"

    await wrapper.vm.$nextTick()

    // Find the button. It has Title "Copy link to file" in the template
    // <button title="Copy link to file" ...>
    // But wait, "Copy link to file" might be misleading for folder?
    // Template: title="Copy link to file"

    const copyButton = wrapper.find('button[title="Copy link to file"]')
    expect(copyButton.exists()).toBe(true)

    await copyButton.trigger('click')

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('?path=folder%2F&download=true')
    )
  })
})
