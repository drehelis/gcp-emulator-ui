import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMetricsStore } from '../metrics'

describe('useMetricsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('initializes with empty metrics', () => {
      const store = useMetricsStore()
      expect(store.topicMetrics.size).toBe(0)
      expect(store.subscriptionMetrics.size).toBe(0)
    })

    it('loads metrics from localStorage', () => {
      const savedData = {
        topics: [['topic1', { messagesPublished: 10, publishHistory: [] }]],
        subscriptions: [['sub1', { messagesReceived: 5, pullHistory: [] }]]
      }
      localStorage.setItem('emulator-ui-metrics', JSON.stringify(savedData))

      const store = useMetricsStore()
      expect(store.topicMetrics.get('topic1')?.messagesPublished).toBe(10)
      expect(store.subscriptionMetrics.get('sub1')?.messagesReceived).toBe(5)
    })
  })

  describe('tracking', () => {
    it('tracks message publish', () => {
      const store = useMetricsStore()
      store.trackMessagePublish('topic1', 5)

      const metrics = store.getTopicMetrics('topic1')
      expect(metrics).toBeDefined()
      expect(metrics?.messagesPublished).toBe(5)
      expect(metrics?.firstPublishTime).toBeInstanceOf(Date)
      expect(metrics?.lastPublishTime).toBeInstanceOf(Date)
      expect(metrics?.publishHistory).toHaveLength(1)
      expect(metrics?.publishHistory[0].messageCount).toBe(5)
    })

    it('accumulates published messages', () => {
      const store = useMetricsStore()
      store.trackMessagePublish('topic1', 5)
      store.trackMessagePublish('topic1', 3)

      expect(store.getTopicMetrics('topic1')?.messagesPublished).toBe(8)
      expect(store.getTopicMetrics('topic1')?.publishHistory).toHaveLength(2)
    })

    it('limits publish history to 100 entries', () => {
      const store = useMetricsStore()
      for (let i = 0; i < 105; i++) {
        store.trackMessagePublish('topic1', 1)
      }

      expect(store.getTopicMetrics('topic1')?.publishHistory).toHaveLength(100)
    })
    
    it('tracks message pull', () => {
      const store = useMetricsStore()
      store.trackMessagePull('sub1', 2)

      const metrics = store.getSubscriptionMetrics('sub1')
      expect(metrics).toBeDefined()
      expect(metrics?.messagesReceived).toBe(2)
      expect(metrics?.pullHistory).toHaveLength(1)
    })

    it('tracks message ack', () => {
      const store = useMetricsStore()
        store.trackMessagePull('sub1', 5) // ensure it exists
      store.trackMessageAck('sub1', 3)

      expect(store.getSubscriptionMetrics('sub1')?.messagesAcked).toBe(3)
    })
  })

  describe('getters', () => {
    it('calculates total messages published', () => {
      const store = useMetricsStore()
      store.trackMessagePublish('topic1', 10)
      store.trackMessagePublish('topic2', 5)
      
      expect(store.getTotalMessagesPublished).toBe(15)
    })

    it('sorts topics by activity', () => {
      const store = useMetricsStore()
      store.trackMessagePublish('topicA', 5)
      store.trackMessagePublish('topicB', 10)
      store.trackMessagePublish('topicC', 0) // Should be excluded

      const active = store.getTopicsWithActivity
      expect(active).toHaveLength(2)
      expect(active[0].topicName).toBe('topicB')
      expect(active[1].topicName).toBe('topicA')
    })
  })

  describe('persistence', () => {
    it('persists to localStorage on change', () => {
      const store = useMetricsStore()
      store.trackMessagePublish('topic1', 1)

      const saved = localStorage.getItem('emulator-ui-metrics')
      expect(saved).toBeTruthy()
      const data = JSON.parse(saved!)
      expect(data.topics).toBeDefined()
      // Map serialized as array of entries
      expect(data.topics[0][0]).toBe('topic1')
    })
    
    it('handles localStorage errors gracefully', () => {
        const store = useMetricsStore()
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full') })
        
        // Should not throw
        store.trackMessagePublish('topic1', 1)
    })
  })

  describe('reset', () => {
    it('resets all metrics', () => {
      const store = useMetricsStore()
      store.trackMessagePublish('topic1', 1)
      store.resetAllMetrics()
      
      expect(store.topicMetrics.size).toBe(0)
      expect(localStorage.getItem('emulator-ui-metrics')).toBeNull()
    })
  })
  
  describe('publish rate', () => {
      it('calculates rate correctly', () => {
          const store = useMetricsStore()
          
          // Mock Date to control time windows
          vi.useFakeTimers()
          const now = new Date()
          vi.setSystemTime(now)
          
          store.trackMessagePublish('topic1', 10) // T=0
          
          // Move forward 30 mins
          vi.advanceTimersByTime(30 * 60 * 1000)
          store.trackMessagePublish('topic1', 20) // T=30m
          
          // Rate in last hour: 30 messages / 1 hour = 30/hr
          const rate = store.getTopicPublishRate('topic1', 60)
          expect(rate).toBe(30)
          
          vi.useRealTimers()
      })
  })
})
