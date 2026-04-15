import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { ApiResponse, ApiError } from '@/types'

let apiClient: AxiosInstance

export function setupApiClient() {
  apiClient = axios.create({
    baseURL: import.meta.env.VITE_PUBSUB_BASE_URL || '/pubsub',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  apiClient.interceptors.request.use(
    config => {
      const token = localStorage.getItem('auth-token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      config.headers['X-Request-ID'] = generateRequestId()

      return config
    },
    error => Promise.reject(error)
  )

  apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => response,
    error => {
      // Handle different error types
      if (error.response) {
        // Server responded with error status
        const apiError: ApiError = {
          code: error.response.status,
          message:
            error.response.data?.error?.message || error.response.data?.message || error.message,
          details: error.response.data?.details || [],
          timestamp: new Date(),
          requestId: error.config?.headers?.['X-Request-ID'],
        }

        // Handle specific status codes
        switch (error.response.status) {
          case 401:
            // Unauthorized - clear auth and redirect to login
            localStorage.removeItem('auth-token')
            window.location.href = '/auth/login'
            break
          case 403:
            // Forbidden
            break
          case 429:
            // Rate limited
            break
          case 500:
            // Server error
            break
        }

        return Promise.reject(apiError)
      } else if (error.request) {
        // Network error
        const networkError: ApiError = {
          code: 0,
          message: 'Network error - please check your connection',
          details: [],
          timestamp: new Date(),
        }

        return Promise.reject(networkError)
      } else {
        // Other error
        const unknownError: ApiError = {
          code: -1,
          message: error.message || 'Unknown error occurred',
          details: [],
          timestamp: new Date(),
        }

        return Promise.reject(unknownError)
      }
    }
  )
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    throw new Error('API client not initialized. Call setupApiClient() first.')
  }
  return apiClient
}

export function createLongRunningRequest(timeoutMs: number = 300000) {
  if (!apiClient) {
    throw new Error('API client not initialized. Call setupApiClient() first.')
  }

  return {
    get: (url: string, config = {}) => apiClient.get(url, { ...config, timeout: timeoutMs }),
    post: (url: string, data?: any, config = {}) =>
      apiClient.post(url, data, { ...config, timeout: timeoutMs }),
    put: (url: string, data?: any, config = {}) =>
      apiClient.put(url, data, { ...config, timeout: timeoutMs }),
    delete: (url: string, config = {}) => apiClient.delete(url, { ...config, timeout: timeoutMs }),
    patch: (url: string, data?: any, config = {}) =>
      apiClient.patch(url, data, { ...config, timeout: timeoutMs }),
  }
}

export { apiClient as default }
