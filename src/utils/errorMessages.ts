/**
 * Error handling utilities
 * Provides meaningful error messages for HTTP errors and API responses
 */

/**
 * Converts generic HTTP errors into meaningful error messages
 * @param error - The error object from axios or other HTTP client
 * @returns A meaningful error message string
 */
export const getMeaningfulErrorMessage = (error: any): string => {
  // Check for specific status codes and provide meaningful messages
  if (error.response?.status === 409) {
    return 'ALREADY_EXISTS: Resource already exists'
  }
  if (error.response?.status === 404) {
    return 'NOT_FOUND: Resource not found'
  }
  if (error.response?.status === 400) {
    return 'INVALID_REQUEST: Invalid request parameters'
  }
  if (error.response?.status === 403) {
    return 'PERMISSION_DENIED: Access denied'
  }
  if (error.response?.status === 500) {
    return 'INTERNAL_ERROR: Server internal error'
  }
  
  // Check if the error message already contains meaningful information
  if (error.message?.includes('ALREADY_EXISTS')) {
    return error.message
  }
  if (error.message?.includes('NOT_FOUND')) {
    return error.message
  }
  if (error.message?.includes('PERMISSION_DENIED')) {
    return error.message
  }
  if (error.message?.includes('INVALID_')) {
    return error.message
  }
  
  // For generic HTTP errors, provide meaningful alternatives
  if (error.message?.includes('Request failed with status code')) {
    const statusMatch = error.message.match(/status code (\d+)/)
    if (statusMatch) {
      const status = parseInt(statusMatch[1])
      switch (status) {
        case 409: return 'ALREADY_EXISTS: Resource already exists'
        case 404: return 'NOT_FOUND: Resource not found'  
        case 400: return 'INVALID_REQUEST: Invalid request parameters'
        case 403: return 'PERMISSION_DENIED: Access denied'
        case 500: return 'INTERNAL_ERROR: Server internal error'
        default: return `HTTP_ERROR: Request failed (${status})`
      }
    }
  }
  
  // Return original message or fallback
  return error.message || 'Unknown error occurred'
}

/**
 * Gets a user-friendly error message for PubSub specific operations
 * @param error - The error object
 * @param operation - The operation that failed (e.g., 'create subscription', 'delete topic')
 * @returns A user-friendly error message
 */
export const getPubSubErrorMessage = (error: any, operation: string): string => {
  const baseMessage = getMeaningfulErrorMessage(error)
  
  // Add context for specific PubSub operations
  if (baseMessage.includes('ALREADY_EXISTS')) {
    if (operation.includes('subscription')) {
      return 'ALREADY_EXISTS: A subscription with this name already exists for this topic. Please choose a different name.'
    }
    if (operation.includes('topic')) {
      return 'ALREADY_EXISTS: A topic with this name already exists. Please choose a different name.'
    }
  }
  
  if (baseMessage.includes('NOT_FOUND')) {
    if (operation.includes('subscription')) {
      return 'NOT_FOUND: The subscription no longer exists. It may have been deleted by another process.'
    }
    if (operation.includes('topic')) {
      return 'NOT_FOUND: The topic no longer exists. Please refresh the page to see the current state.'
    }
  }
  
  return baseMessage
}

/**
 * Gets a user-friendly error message for Storage specific operations
 * @param error - The error object
 * @param operation - The operation that failed (e.g., 'create bucket', 'upload file')
 * @returns A user-friendly error message
 */
export const getStorageErrorMessage = (error: any, operation: string): string => {
  const baseMessage = getMeaningfulErrorMessage(error)

  // Add context for specific Storage operations
  if (baseMessage.includes('ALREADY_EXISTS')) {
    if (operation.includes('bucket')) {
      return 'A bucket with this name already exists. Bucket names must be globally unique. Please choose a different name.'
    }
    if (operation.includes('object') || operation.includes('file')) {
      return 'A file with this name already exists in this location. Please choose a different name or delete the existing file first.'
    }
    return 'This resource already exists. Please choose a different name.'
  }

  if (baseMessage.includes('NOT_FOUND')) {
    if (operation.includes('bucket')) {
      return 'The bucket no longer exists. It may have been deleted by another process.'
    }
    if (operation.includes('object') || operation.includes('file')) {
      return 'The file no longer exists. It may have been deleted or moved.'
    }
  }

  if (baseMessage.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to perform this operation. Please check your access rights.'
  }

  if (baseMessage.includes('INVALID_REQUEST')) {
    if (operation.includes('bucket')) {
      return 'Invalid bucket configuration. Please check the bucket name and settings.'
    }
    return 'Invalid request. Please check your input and try again.'
  }

  return baseMessage
}