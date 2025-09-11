/**
 * Metrics store
 * Client-side tracking of Pub/Sub operations since emulator doesn't provide metrics
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface TopicMetrics {
  topicName: string
  messagesPublished: number
  lastPublishTime: Date | null
  firstPublishTime: Date | null
  publishHistory: Array<{
    timestamp: Date
    messageCount: number
  }>
}

interface SubscriptionMetrics {
  subscriptionName: string
  messagesReceived: number
  messagesAcked: number
  lastPullTime: Date | null
  pullHistory: Array<{
    timestamp: Date
    messageCount: number
  }>
}

export const useMetricsStore = defineStore('metrics', () => {
  // State
  const topicMetrics = ref<Map<string, TopicMetrics>>(new Map())
  const subscriptionMetrics = ref<Map<string, SubscriptionMetrics>>(new Map())
  
  // Getters
  const getTopicMetrics = computed(() => (topicName: string): TopicMetrics | null => {
    return topicMetrics.value.get(topicName) || null
  })
  
  const getSubscriptionMetrics = computed(() => (subscriptionName: string): SubscriptionMetrics | null => {
    return subscriptionMetrics.value.get(subscriptionName) || null
  })
  
  const getTotalMessagesPublished = computed(() => {
    return Array.from(topicMetrics.value.values())
      .reduce((total, metrics) => total + metrics.messagesPublished, 0)
  })
  
  const getTopicsWithActivity = computed(() => {
    return Array.from(topicMetrics.value.values())
      .filter(metrics => metrics.messagesPublished > 0)
      .sort((a, b) => b.messagesPublished - a.messagesPublished)
  })

  // Actions
  function trackMessagePublish(topicName: string, messageCount: number = 1) {
    const existing = topicMetrics.value.get(topicName) || {
      topicName,
      messagesPublished: 0,
      lastPublishTime: null,
      firstPublishTime: null,
      publishHistory: []
    }
    
    const now = new Date()
    
    existing.messagesPublished += messageCount
    existing.lastPublishTime = now
    
    if (!existing.firstPublishTime) {
      existing.firstPublishTime = now
    }
    
    // Add to history (keep last 100 entries)
    existing.publishHistory.push({
      timestamp: now,
      messageCount
    })
    
    if (existing.publishHistory.length > 100) {
      existing.publishHistory = existing.publishHistory.slice(-100)
    }
    
    topicMetrics.value.set(topicName, existing)
    
    // Persist to localStorage
    persistMetrics()
  }
  
  function trackMessagePull(subscriptionName: string, messageCount: number = 0) {
    const existing = subscriptionMetrics.value.get(subscriptionName) || {
      subscriptionName,
      messagesReceived: 0,
      messagesAcked: 0,
      lastPullTime: null,
      pullHistory: []
    }
    
    const now = new Date()
    
    existing.messagesReceived += messageCount
    existing.lastPullTime = now
    
    // Add to history (keep last 100 entries)
    existing.pullHistory.push({
      timestamp: now,
      messageCount
    })
    
    if (existing.pullHistory.length > 100) {
      existing.pullHistory = existing.pullHistory.slice(-100)
    }
    
    subscriptionMetrics.value.set(subscriptionName, existing)
    
    // Persist to localStorage
    persistMetrics()
  }
  
  function trackMessageAck(subscriptionName: string, messageCount: number = 1) {
    const existing = subscriptionMetrics.value.get(subscriptionName)
    if (existing) {
      existing.messagesAcked += messageCount
      subscriptionMetrics.value.set(subscriptionName, existing)
      persistMetrics()
    }
  }
  
  function getTopicPublishRate(topicName: string, windowMinutes: number = 60): number {
    const metrics = topicMetrics.value.get(topicName)
    if (!metrics || metrics.publishHistory.length === 0) return 0
    
    const now = new Date()
    const windowStart = new Date(now.getTime() - (windowMinutes * 60 * 1000))
    
    const recentPublishes = metrics.publishHistory.filter(
      entry => entry.timestamp >= windowStart
    )
    
    const totalMessages = recentPublishes.reduce(
      (sum, entry) => sum + entry.messageCount, 0
    )
    
    return totalMessages / (windowMinutes / 60) // messages per hour
  }
  
  function resetTopicMetrics(topicName: string) {
    topicMetrics.value.delete(topicName)
    persistMetrics()
  }
  
  function resetSubscriptionMetrics(subscriptionName: string) {
    subscriptionMetrics.value.delete(subscriptionName)
    persistMetrics()
  }
  
  function resetAllMetrics() {
    topicMetrics.value.clear()
    subscriptionMetrics.value.clear()
    localStorage.removeItem('emulator-ui-metrics')
  }
  
  function persistMetrics() {
    try {
      const data = {
        topics: Array.from(topicMetrics.value.entries()).map(([key, value]) => [
          key, 
          {
            ...value,
            lastPublishTime: value.lastPublishTime?.toISOString(),
            firstPublishTime: value.firstPublishTime?.toISOString(),
            publishHistory: value.publishHistory.map(h => ({
              ...h,
              timestamp: h.timestamp.toISOString()
            }))
          }
        ]),
        subscriptions: Array.from(subscriptionMetrics.value.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            lastPullTime: value.lastPullTime?.toISOString(),
            pullHistory: value.pullHistory.map(h => ({
              ...h,
              timestamp: h.timestamp.toISOString()
            }))
          }
        ])
      }
      
      localStorage.setItem('emulator-ui-metrics', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist metrics:', error)
    }
  }
  
  function loadMetrics() {
    try {
      const saved = localStorage.getItem('emulator-ui-metrics')
      if (!saved) return
      
      const data = JSON.parse(saved)
      
      // Restore topic metrics
      if (data.topics) {
        data.topics.forEach(([key, value]: [string, any]) => {
          topicMetrics.value.set(key, {
            ...value,
            lastPublishTime: value.lastPublishTime ? new Date(value.lastPublishTime) : null,
            firstPublishTime: value.firstPublishTime ? new Date(value.firstPublishTime) : null,
            publishHistory: value.publishHistory?.map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp)
            })) || []
          })
        })
      }
      
      // Restore subscription metrics
      if (data.subscriptions) {
        data.subscriptions.forEach(([key, value]: [string, any]) => {
          subscriptionMetrics.value.set(key, {
            ...value,
            lastPullTime: value.lastPullTime ? new Date(value.lastPullTime) : null,
            pullHistory: value.pullHistory?.map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp)
            })) || []
          })
        })
      }
    } catch (error) {
      console.warn('Failed to load metrics:', error)
    }
  }
  
  // Initialize
  loadMetrics()
  
  return {
    // State
    topicMetrics: computed(() => topicMetrics.value),
    subscriptionMetrics: computed(() => subscriptionMetrics.value),
    
    // Getters
    getTopicMetrics,
    getSubscriptionMetrics,
    getTotalMessagesPublished,
    getTopicsWithActivity,
    
    // Actions
    trackMessagePublish,
    trackMessagePull,
    trackMessageAck,
    getTopicPublishRate,
    resetTopicMetrics,
    resetSubscriptionMetrics,
    resetAllMetrics,
    loadMetrics
  }
}, {
  persist: {
    key: 'emulator-ui-metrics',
    storage: localStorage
  }
})