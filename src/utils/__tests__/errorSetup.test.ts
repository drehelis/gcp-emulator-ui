/**
 * Tests for errorSetup utility
 * Global error handling setup and utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('errorSetup', () => {
  let mockApp: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Vue app
    mockApp = {
      config: {
        errorHandler: null,
      },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('setupErrorHandling', () => {
    it('sets up Vue error handler', async () => {
      const { setupErrorHandling } = await import('../errorSetup')

      setupErrorHandling(mockApp)

      expect(mockApp.config.errorHandler).toBeInstanceOf(Function)
    })

    it('Vue error handler logs errors', async () => {
      const { setupErrorHandling } = await import('../errorSetup')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      setupErrorHandling(mockApp)

      const testError = new Error('Test error')
      const testInstance = { $options: { name: 'TestComponent' } }
      const testInfo = 'mounted hook'

      mockApp.config.errorHandler(testError, testInstance, testInfo)

      expect(consoleSpy).toHaveBeenCalledWith('Vue error:', testError)
      expect(consoleSpy).toHaveBeenCalledWith('Component instance:', testInstance)
      expect(consoleSpy).toHaveBeenCalledWith('Error info:', testInfo)
    })

    it('adds unhandledrejection event listener', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      const { setupErrorHandling } = await import('../errorSetup')

      setupErrorHandling(mockApp)

      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
    })

    it('adds global error event listener', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      const { setupErrorHandling } = await import('../errorSetup')

      setupErrorHandling(mockApp)

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('unhandledrejection handler logs and prevents default', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      let capturedHandler: ((_event: PromiseRejectionEvent) => void) | null = null

      vi.spyOn(window, 'addEventListener').mockImplementation((_event, handler) => {
        if (_event === 'unhandledrejection') {
          capturedHandler = handler as (_event: PromiseRejectionEvent) => void
        }
      })

      const { setupErrorHandling } = await import('../errorSetup')
      setupErrorHandling(mockApp)

      // Trigger the handler
      const mockEvent = {
        reason: new Error('Promise rejection'),
        preventDefault: vi.fn(),
      } as unknown as PromiseRejectionEvent

      capturedHandler?.(mockEvent)

      expect(consoleSpy).toHaveBeenCalledWith('Unhandled promise rejection:', mockEvent.reason)
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('global error handler logs error details', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      let capturedHandler: ((_event: ErrorEvent) => void) | null = null

      vi.spyOn(window, 'addEventListener').mockImplementation((_event, handler) => {
        if (_event === 'error') {
          capturedHandler = handler as (_event: ErrorEvent) => void
        }
      })

      const { setupErrorHandling } = await import('../errorSetup')
      setupErrorHandling(mockApp)

      // Trigger the handler
      const mockEvent = {
        error: new Error('Global error'),
        filename: 'test.js',
        lineno: 42,
        colno: 10,
      } as ErrorEvent

      capturedHandler?.(mockEvent)

      expect(consoleSpy).toHaveBeenCalledWith('Global error:', mockEvent.error)
    })
  })
})
