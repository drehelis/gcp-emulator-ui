/**
 * Error handling utilities
 * Global error handling setup and utilities
 */

import type { App } from 'vue'

export function setupErrorHandling(app: App) {
  // Vue error handler
  app.config.errorHandler = (error, instance, info) => {
    console.error('Vue error:', error)
    console.error('Component instance:', instance)
    console.error('Error info:', info)
  }

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason)

    if (import.meta.env.PROD) {
      reportError(event.reason, { context: 'promise' })
    }

    // Prevent the default browser error handling
    event.preventDefault()
  })

  // Global error handler
  window.addEventListener('error', event => {
    console.error('Global error:', event.error)

    if (import.meta.env.PROD) {
      reportError(event.error, {
        context: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    }
  })
}

function reportError(/* error: any, context: Record<string, any> = {} */) {
  // TODO: Implement actual error reporting (Sentry, LogRocket, etc.)
  // Example Sentry integration:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     extra: context,
  //     tags: {
  //       component: 'error-handler'
  //     }
  //   })
  // }
}
