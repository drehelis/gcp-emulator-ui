import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupErrorHandling } from '../errorSetup'

describe('errorSetup', () => {
  const mockApp = {
    config: {
      errorHandler: null as any,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('console', {
      error: vi.fn(),
    })
  })

  it('sets up Vue error handler', () => {
    setupErrorHandling(mockApp as any)
    expect(mockApp.config.errorHandler).toBeTypeOf('function')

    const error = new Error('test')
    mockApp.config.errorHandler(error, {}, 'info')
    expect(console.error).toHaveBeenCalledWith('Vue error:', error)
  })

  it('sets up unhandledrejection listener', () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener')
    setupErrorHandling(mockApp as any)

    expect(addListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))

    const handler = addListenerSpy.mock.calls.find(
      c => c[0] === 'unhandledrejection'
    )![1] as Function
    const event = {
      reason: 'rejection',
      preventDefault: vi.fn(),
    }

    handler(event)
    expect(console.error).toHaveBeenCalledWith('Unhandled promise rejection:', 'rejection')
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('sets up global error listener', () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener')
    setupErrorHandling(mockApp as any)

    expect(addListenerSpy).toHaveBeenCalledWith('error', expect.any(Function))

    const handler = addListenerSpy.mock.calls.find(c => c[0] === 'error')![1] as Function
    const event = {
      error: 'global error',
    }

    handler(event)
    expect(console.error).toHaveBeenCalledWith('Global error:', 'global error')
  })
})
