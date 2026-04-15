import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { setupApiClient, getApiClient, createLongRunningRequest } from '../client'

vi.mock('axios')

describe('api client', () => {
  let mockAxiosInstance: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock instance
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    }

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance)

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      removeItem: vi.fn(),
    })

    // Mock window.location
    const mockLocation = new URL('http://localhost')
    vi.stubGlobal('location', {
      ...mockLocation,
      href: '',
    })

    setupApiClient()
  })

  it('getApiClient returns the instance', () => {
    expect(getApiClient()).toBe(mockAxiosInstance)
  })

  it('setupApiClient configures interceptors', () => {
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
  })

  // Skip initialization error tests as apiClient is not easily resettable

  describe('request interceptor', () => {
    it('adds auth token and requestId', () => {
      const interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0]
      vi.mocked(localStorage.getItem).mockReturnValue('test-token')

      const config = { headers: {} }
      const result = interceptor(config)

      expect(result.headers.Authorization).toBe('Bearer test-token')
      expect(result.headers['X-Request-ID']).toMatch(/^req_/)
    })

    it('rejects on request error', async () => {
      const errorInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][1]
      const error = new Error('request failed')
      await expect(errorInterceptor(error)).rejects.toThrow('request failed')
    })
  })

  describe('response interceptor errors', () => {
    it('handles 401 unauthorized', async () => {
      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1]
      const error = {
        response: {
          status: 401,
          data: { error: { message: 'Unauthorized' } },
        },
        config: { headers: { 'X-Request-ID': 'req-1' } },
      }

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        code: 401,
        message: 'Unauthorized',
      })

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth-token')
      expect(window.location.href).toBe('/auth/login')
    })

    it('handles 500 server error', async () => {
      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1]
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      }

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        code: 500,
        message: 'Internal Server Error',
      })
    })

    it('handles network error (no response)', async () => {
      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1]
      const error = {
        request: {},
      }

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        code: 0,
        message: 'Network error - please check your connection',
      })
    })

    it('handles unknown error', async () => {
      const errorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1]
      const error = new Error('Random failure')

      await expect(errorInterceptor(error)).rejects.toMatchObject({
        code: -1,
        message: 'Random failure',
      })
    })
  })

  describe('createLongRunningRequest', () => {
    it('calls axios methods with extended timeout', () => {
      const longReq = createLongRunningRequest(10000)

      longReq.get('/test')
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({ timeout: 10000 })
      )

      longReq.post('/test', { data: 1 })
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test',
        { data: 1 },
        expect.objectContaining({ timeout: 10000 })
      )

      longReq.put('/test', { data: 2 })
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/test',
        { data: 2 },
        expect.objectContaining({ timeout: 10000 })
      )

      longReq.delete('/test')
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({ timeout: 10000 })
      )

      longReq.patch('/test', { data: 3 })
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test',
        { data: 3 },
        expect.objectContaining({ timeout: 10000 })
      )
    })
  })
})
