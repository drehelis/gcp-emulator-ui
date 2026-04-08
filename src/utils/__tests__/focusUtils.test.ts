import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyFocusHighlight, handleFocusTarget, handleTopicFocus } from '../focusUtils'
import { nextTick } from 'vue'

describe('focusUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock getComputedStyle
    const mockStyle = {
      getPropertyValue: vi.fn().mockImplementation(prop => {
        if (prop === '--highlight-transition-duration') return '1s'
        if (prop === '--highlight-transition-timing') return 'ease'
        return ''
      }),
    }
    vi.stubGlobal('getComputedStyle', () => mockStyle)

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('applyFocusHighlight', () => {
    it('applies styles and transitions through timeouts', async () => {
      const element = document.createElement('div')
      await applyFocusHighlight(element)

      expect(element.style.transition).toBe('background-color 1s ease')
      expect(element.style.backgroundColor).toBe('rgba(59, 130, 246, 0.25)')

      vi.advanceTimersByTime(501)
      expect(element.style.backgroundColor).toBe('rgba(59, 130, 246, 0.08)')

      vi.advanceTimersByTime(2500)
      expect(element.style.backgroundColor).toBe('')

      vi.advanceTimersByTime(1001)
      expect(element.style.transition).toBe('')
    })
  })

  describe('handleFocusTarget', () => {
    it('finds element and scrolls to it', async () => {
      const element = document.createElement('div')
      element.id = 'topic-test'
      document.body.appendChild(element)

      handleFocusTarget('test', 'topic')

      await nextTick()
      vi.advanceTimersByTime(301)

      expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
      document.body.removeChild(element)
    })
  })

  describe('handleTopicFocus', () => {
    const getTopicDisplayName = (n: string) => n.split('/').pop() || n
    const subsByTopic = new Map([
      ['projects/p/topics/topic-a', []],
      ['projects/p/topics/topic-b', []],
    ])

    it('expands topic if hash matches', async () => {
      const expanded = new Set<string>()
      await handleTopicFocus('topic-a', subsByTopic, expanded, getTopicDisplayName)

      expect(expanded.has('projects/p/topics/topic-a')).toBe(true)
    })

    it('returns early if hash or map is empty', async () => {
      const expanded = new Set<string>()
      await handleTopicFocus('', subsByTopic, expanded, getTopicDisplayName)
      expect(expanded.size).toBe(0)

      await handleTopicFocus('a', new Map(), expanded, getTopicDisplayName)
      expect(expanded.size).toBe(0)
    })

    it('tries partial match if exact fails', async () => {
      const expanded = new Set<string>()
      await handleTopicFocus('topic-a-extra', subsByTopic, expanded, getTopicDisplayName)
      expect(expanded.has('projects/p/topics/topic-a')).toBe(true)
    })
  })
})
