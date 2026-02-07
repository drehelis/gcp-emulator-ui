import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useServiceConnections } from '../useServiceConnections'
import { createPinia, setActivePinia } from 'pinia'

// Mock fetch
const fetchSpy = vi.fn()
vi.stubGlobal('fetch', fetchSpy)

// Mock app store to intercept toasts
const mockShowToast = vi.fn()
vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showToast: mockShowToast,
  }),
}))

describe('useServiceConnections', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchSpy.mockReset()
    mockShowToast.mockReset()
    // Reset global state
    const { reset } = useServiceConnections()
    reset()
  })

  afterEach(() => {
    const { stopPeriodicCheck } = useServiceConnections()
    stopPeriodicCheck()
    vi.useRealTimers()
  })

  describe('checkConnection', () => {
    it('updates status on success', async () => {
      fetchSpy.mockResolvedValue({ ok: true })
      const { checkConnection, serviceConnected } = useServiceConnections()

      await checkConnection('pubsub', true)
      expect(serviceConnected.pubsub.value).toBe(true)
    })

    it('updates status on failure', async () => {
      fetchSpy.mockResolvedValue({ ok: false })
      const { checkConnection, serviceConnected } = useServiceConnections()

      await checkConnection('pubsub', true)
      expect(serviceConnected.pubsub.value).toBe(false)
    })

    it('skips check if previously failed and not forced', async () => {
      fetchSpy.mockRejectedValue(new Error('fail'))
      const { checkConnection, skipPeriodicCheck } = useServiceConnections()

      // First check fails
      await checkConnection('pubsub', true)
      expect(skipPeriodicCheck.value.pubsub).toBe(true)

      fetchSpy.mockClear()

      // Second check skipped
      await checkConnection('pubsub', false)
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('checkAllConnections', () => {
    it('aggregates status correctly', async () => {
      fetchSpy.mockResolvedValue({ ok: true })
      const { checkAllConnections, connectionState } = useServiceConnections()

      await checkAllConnections(true)

      expect(connectionState.value.status).toBe('connected')
      expect(connectionState.value.services.pubsub).toBe(true)
    })

    it('handles partial connection', async () => {
      // Mock fetch to fail for one service
      fetchSpy.mockImplementation(async input => {
        const url = String(input)
        // console.log('DEBUG: Fetching URL:', url)
        // Fail for Storage to create partial state (Storage path always includes 'healthcheck')
        if (url.includes('healthcheck')) return { ok: false }
        return { ok: true }
      })

      const { checkAllConnections, connectionState } = useServiceConnections()

      await checkAllConnections(true)

      expect(connectionState.value.status).toBe('partial')
    })

    it('handles disconnected state', async () => {
      fetchSpy.mockResolvedValue({ ok: false })
      const { checkAllConnections, connectionState } = useServiceConnections()

      await checkAllConnections(true)

      expect(connectionState.value.status).toBe('disconnected')
    })
  })

  describe('periodicCheck', () => {
    it('runs check on interval', () => {
      vi.useFakeTimers()
      const { startPeriodicCheck } = useServiceConnections()

      startPeriodicCheck(1000)

      // Advance timer
      vi.advanceTimersByTime(1100)

      // Since checkAllConnections calls checkConnection which calls fetch
      // But checkAllConnections is async. calling it from interval doesn't await.
      // We can check if fetch was called.
      expect(fetchSpy).toHaveBeenCalled()
    })
  })

  describe('retryConnection', () => {
    it('shows toast and forces check', async () => {
      fetchSpy.mockResolvedValue({ ok: true })
      const { retryConnection } = useServiceConnections()

      const result = await retryConnection()

      expect(result).toBe(true)
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }))
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })
  })
})
