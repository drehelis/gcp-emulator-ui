/**
 * Focus and highlight utilities for navigation
 */
import { nextTick } from 'vue'

/**
 * Applies a smooth fade-out highlight effect to an element
 */
export const applyFocusHighlight = async (element: HTMLElement) => {
  // Add a smooth fade-out highlight effect using CSS variable
  const duration = getComputedStyle(document.documentElement).getPropertyValue('--highlight-transition-duration').trim() || '1.5s'
  const timing = getComputedStyle(document.documentElement).getPropertyValue('--highlight-transition-timing').trim() || 'ease-out'
  element.style.transition = `background-color ${duration} ${timing}`
  element.style.backgroundColor = 'rgba(59, 130, 246, 0.25)'

  // Start fading out after a brief moment
  setTimeout(() => {
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'
  }, 500)

  // Complete fade out
  setTimeout(() => {
    element.style.backgroundColor = ''
  }, 3000)

  // Clean up transition
  setTimeout(() => {
    element.style.transition = ''
  }, 4000)
}

/**
 * Handles focus targeting for topics, subscriptions, and buckets
 */
export const handleFocusTarget = async (targetName: string, targetType: 'topic' | 'subscription' | 'bucket' = 'topic') => {
  // Wait for DOM to be ready
  await nextTick()

  // Give minimal time for page to load
  setTimeout(async () => {
    const elementId = `${targetType}-${targetName}`
    const targetElement = document.getElementById(elementId)

    if (targetElement) {
      // Scroll to the element immediately
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Apply highlight effect
      await applyFocusHighlight(targetElement)
    }
  }, 300)
}

// eslint-disable-next-line no-unused-vars
type TopicNameExtractor = (name: string) => string

/**
 * Handles focus for collapsed topics in subscriptions view
 */
export const handleTopicFocus = async (
  hash: string,
  subscriptionsByTopic: Map<string, any[]>,
  expandedTopics: Set<string>,
  getTopicDisplayName: TopicNameExtractor
) => {
 
  if (!hash || subscriptionsByTopic.size === 0) {
    return
  }

  // Find the topic that matches the hash
  let targetTopicEntry = Array.from(subscriptionsByTopic).find(([topicName]) => {
    const displayName = getTopicDisplayName(topicName)
    return displayName === hash
  })

  // If exact match fails, try partial match
  if (!targetTopicEntry) {
    targetTopicEntry = Array.from(subscriptionsByTopic).find(([topicName]) => {
      const displayName = getTopicDisplayName(topicName)
      return displayName.includes(hash) || hash.includes(displayName)
    })
  }

  if (targetTopicEntry) {
    const [topicName] = targetTopicEntry

    // Expand the target topic
    expandedTopics.add(topicName)

    // Wait for DOM update and apply focus
    await handleFocusTarget(getTopicDisplayName(topicName), 'topic')
  }
}