/**
 * Tests for usePagination composable
 * Pagination state management and data slicing
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { usePagination, usePaginatedData } from '../usePagination'

describe('usePagination', () => {
  describe('initialization', () => {
    it('uses default options', () => {
      const pagination = usePagination()

      expect(pagination.limit.value).toBe(25)
      expect(pagination.currentPage.value).toBe(1)
      expect(pagination.defaultLimits).toEqual([10, 25, 50, 100])
    })

    it('accepts custom initial limit', () => {
      const pagination = usePagination({ initialLimit: 50 })

      expect(pagination.limit.value).toBe(50)
    })

    it('accepts custom default limits', () => {
      const customLimits = [5, 10, 20]
      const pagination = usePagination({ defaultLimits: customLimits })

      expect(pagination.defaultLimits).toEqual(customLimits)
    })
  })

  describe('computed pagination bounds', () => {
    it('calculates paginationStart correctly', () => {
      const pagination = usePagination({ initialLimit: 10 })

      expect(pagination.paginationStart.value).toBe(1) // Page 1: 1

      pagination.currentPage.value = 2
      expect(pagination.paginationStart.value).toBe(11) // Page 2: 11

      pagination.currentPage.value = 3
      expect(pagination.paginationStart.value).toBe(21) // Page 3: 21
    })

    it('calculates paginationEnd correctly', () => {
      const pagination = usePagination({ initialLimit: 10 })

      expect(pagination.paginationEnd.value).toBe(10) // Page 1: 10

      pagination.currentPage.value = 2
      expect(pagination.paginationEnd.value).toBe(20) // Page 2: 20
    })
  })

  describe('page navigation', () => {
    it('nextPage increments current page', () => {
      const pagination = usePagination()

      expect(pagination.currentPage.value).toBe(1)
      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(2)
      pagination.nextPage()
      expect(pagination.currentPage.value).toBe(3)
    })

    it('previousPage decrements current page', () => {
      const pagination = usePagination()
      pagination.currentPage.value = 3

      pagination.previousPage()
      expect(pagination.currentPage.value).toBe(2)
      pagination.previousPage()
      expect(pagination.currentPage.value).toBe(1)
    })

    it('previousPage does not go below 1', () => {
      const pagination = usePagination()

      expect(pagination.currentPage.value).toBe(1)
      pagination.previousPage()
      expect(pagination.currentPage.value).toBe(1)
    })

    it('resetPage sets current page to 1', () => {
      const pagination = usePagination()
      pagination.currentPage.value = 5

      pagination.resetPage()
      expect(pagination.currentPage.value).toBe(1)
    })
  })

  describe('limit change handling', () => {
    it('handleLimitChange resets page to 1', () => {
      const pagination = usePagination()
      pagination.currentPage.value = 5

      pagination.limit.value = 50
      pagination.handleLimitChange()

      expect(pagination.currentPage.value).toBe(1)
    })
  })
})

describe('usePaginatedData', () => {
  const createMockData = (count: number) => ({
    items: ref(Array.from({ length: count }, (_, i) => ({ id: i + 1 }))),
    totalCount: ref(count),
  })

  it('slices items based on current page and limit', () => {
    const data = createMockData(50)
    const pagination = usePagination({ initialLimit: 10 })
    const paginated = usePaginatedData(data, pagination)

    expect(paginated.paginatedItems.value).toHaveLength(10)
    expect(paginated.paginatedItems.value[0]).toEqual({ id: 1 })
    expect(paginated.paginatedItems.value[9]).toEqual({ id: 10 })
  })

  it('returns correct items for page 2', () => {
    const data = createMockData(50)
    const pagination = usePagination({ initialLimit: 10 })
    pagination.currentPage.value = 2
    const paginated = usePaginatedData(data, pagination)

    expect(paginated.paginatedItems.value[0]).toEqual({ id: 11 })
    expect(paginated.paginatedItems.value[9]).toEqual({ id: 20 })
  })

  it('hasMore is true when more items exist', () => {
    const data = createMockData(50)
    const pagination = usePagination({ initialLimit: 10 })
    const paginated = usePaginatedData(data, pagination)

    expect(paginated.hasMore.value).toBe(true)
  })

  it('hasMore is false on last page', () => {
    const data = createMockData(25)
    const pagination = usePagination({ initialLimit: 10 })
    pagination.currentPage.value = 3 // Items 21-30, but only 25 total
    const paginated = usePaginatedData(data, pagination)

    expect(paginated.hasMore.value).toBe(false)
  })

  it('actualPaginationEnd is clamped to total count', () => {
    const data = createMockData(25)
    const pagination = usePagination({ initialLimit: 10 })
    pagination.currentPage.value = 3
    const paginated = usePaginatedData(data, pagination)

    expect(paginated.paginationEnd.value).toBe(25)
  })

  it('returns 0 for empty data', () => {
    const data = createMockData(0)
    const pagination = usePagination({ initialLimit: 10 })
    const paginated = usePaginatedData(data, pagination)

    expect(paginated.paginationStart.value).toBe(0)
    expect(paginated.paginationEnd.value).toBe(0)
    expect(paginated.paginatedItems.value).toHaveLength(0)
  })
})
