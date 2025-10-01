/**
 * Shared utilities for import/export functionality
 */

/**
 * Download a file to the user's device
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Extract topic name from full Pub/Sub topic path
 */
export function extractTopicName(fullName: string): string {
  if (fullName.includes('/topics/')) {
    return fullName.split('/topics/')[1]
  }
  return fullName
}

/**
 * Extract subscription name from full Pub/Sub subscription path
 */
export function extractSubscriptionName(fullName: string): string {
  if (fullName.includes('/subscriptions/')) {
    return fullName.split('/subscriptions/')[1]
  }
  return fullName
}
