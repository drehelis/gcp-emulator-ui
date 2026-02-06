/**
 * Tests for focusUtils utility
 * Focus and highlight utilities for navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Vue's nextTick
vi.mock('vue', () => ({
  nextTick: vi.fn(() => Promise.resolve()),
}))

describe('focusUtils', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Create mock element
    mockElement = document.createElement('div')
    mockElement.id = 'test-element'
    document.body.appendChild(mockElement)

    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: vi.fn((prop: string) => {
        if (prop === '--highlight-transition-duration') return '1.5s'
        if (prop === '--highlight-transition-timing') return 'ease-out'
        return ''
      }),
    } as unknown as CSSStyleDeclaration)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('applyFocusHighlight', () => {
    it('applies initial highlight styles', async () => {
      const { applyFocusHighlight } = await import('../focusUtils')

      applyFocusHighlight(mockElement)

      expect(mockElement.style.transition).toContain('background-color')
      expect(mockElement.style.backgroundColor).toBe('rgba(59, 130, 246, 0.25)')
    })

    it('fades highlight after 500ms', async () => {
      const { applyFocusHighlight } = await import('../focusUtils')

      applyFocusHighlight(mockElement)

      vi.advanceTimersByTime(500)

      expect(mockElement.style.backgroundColor).toBe('rgba(59, 130, 246, 0.08)')
    })

    it('removes highlight after 3000ms', async () => {
      const { applyFocusHighlight } = await import('../focusUtils')

      applyFocusHighlight(mockElement)

      vi.advanceTimersByTime(3000)

      expect(mockElement.style.backgroundColor).toBe('')
    })

    it('cleans up transition after 4000ms', async () => {
      const { applyFocusHighlight } = await import('../focusUtils')

      applyFocusHighlight(mockElement)

      vi.advanceTimersByTime(4000)

      expect(mockElement.style.transition).toBe('')
    })

    it('uses CSS variables for timing', async () => {
      const { applyFocusHighlight } = await import('../focusUtils')

      applyFocusHighlight(mockElement)

      expect(window.getComputedStyle).toHaveBeenCalled()
      expect(mockElement.style.transition).toContain('1.5s')
      expect(mockElement.style.transition).toContain('ease-out')
    })
  })

  describe('handleFocusTarget', () => {
    it('scrolls to element and applies highlight', async () => {
      const { handleFocusTarget } = await import('../focusUtils')

      // Create the target element
      const targetElement = document.createElement('div')
      targetElement.id = 'topic-test-topic'
      document.body.appendChild(targetElement)
      targetElement.scrollIntoView = vi.fn()

      handleFocusTarget('test-topic', 'topic')

      // Wait for nextTick and setTimeout
      await vi.advanceTimersByTimeAsync(300)

      expect(targetElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
    })

    it('uses subscription prefix for subscription type', async () => {
      const { handleFocusTarget } = await import('../focusUtils')

      const targetElement = document.createElement('div')
      targetElement.id = 'subscription-test-sub'
      document.body.appendChild(targetElement)
      targetElement.scrollIntoView = vi.fn()

      handleFocusTarget('test-sub', 'subscription')

      await vi.advanceTimersByTimeAsync(300)

      expect(targetElement.scrollIntoView).toHaveBeenCalled()
    })

    it('uses bucket prefix for bucket type', async () => {
      const { handleFocusTarget } = await import('../focusUtils')

      const targetElement = document.createElement('div')
      targetElement.id = 'bucket-my-bucket'
      document.body.appendChild(targetElement)
      targetElement.scrollIntoView = vi.fn()

      handleFocusTarget('my-bucket', 'bucket')

      await vi.advanceTimersByTimeAsync(300)

      expect(targetElement.scrollIntoView).toHaveBeenCalled()
    })

    it('handles missing element gracefully', async () => {
      const { handleFocusTarget } = await import('../focusUtils')

      // No element with this ID exists
      handleFocusTarget('non-existent', 'topic')

      await vi.advanceTimersByTimeAsync(300)

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('handleTopicFocus', () => {
    it('returns early if hash is empty', async () => {
      const { handleTopicFocus } = await import('../focusUtils')

      const subscriptionsByTopic = new Map([['topic1', []]])
      const expandedTopics = new Set<string>()
      const getTopicDisplayName = (name: string) => name

      await handleTopicFocus('', subscriptionsByTopic, expandedTopics, getTopicDisplayName)

      expect(expandedTopics.size).toBe(0)
    })

    it('returns early if subscriptionsByTopic is empty', async () => {
      const { handleTopicFocus } = await import('../focusUtils')

      const subscriptionsByTopic = new Map()
      const expandedTopics = new Set<string>()
      const getTopicDisplayName = (name: string) => name

      await handleTopicFocus('topic1', subscriptionsByTopic, expandedTopics, getTopicDisplayName)

      expect(expandedTopics.size).toBe(0)
    })

    it('expands topic on exact match', async () => {
      const { handleTopicFocus } = await import('../focusUtils')

      const subscriptionsByTopic = new Map([['projects/test/topics/topic1', [{ name: 'sub1' }]]])
      const expandedTopics = new Set<string>()
      const getTopicDisplayName = (name: string) => name.split('/').pop() || name

      await handleTopicFocus('topic1', subscriptionsByTopic, expandedTopics, getTopicDisplayName)

      await vi.advanceTimersByTimeAsync(300)

      expect(expandedTopics.has('projects/test/topics/topic1')).toBe(true)
    })

    it('expands topic on partial match', async () => {
      const { handleTopicFocus } = await import('../focusUtils')

      const subscriptionsByTopic = new Map([
        ['projects/test/topics/my-topic-name', [{ name: 'sub1' }]],
      ])
      const expandedTopics = new Set<string>()
      const getTopicDisplayName = (name: string) => name.split('/').pop() || name

      // Partial match - searching for 'topic' which is contained in 'my-topic-name'
      await handleTopicFocus('topic', subscriptionsByTopic, expandedTopics, getTopicDisplayName)

      await vi.advanceTimersByTimeAsync(300)

      expect(expandedTopics.has('projects/test/topics/my-topic-name')).toBe(true)
    })

    it('does nothing when no match found', async () => {
      const { handleTopicFocus } = await import('../focusUtils')

      const subscriptionsByTopic = new Map([['projects/test/topics/topic1', [{ name: 'sub1' }]]])
      const expandedTopics = new Set<string>()
      const getTopicDisplayName = (name: string) => name.split('/').pop() || name

      await handleTopicFocus('no-match', subscriptionsByTopic, expandedTopics, getTopicDisplayName)

      await vi.advanceTimersByTimeAsync(300)

      expect(expandedTopics.size).toBe(0)
    })
  })
})
