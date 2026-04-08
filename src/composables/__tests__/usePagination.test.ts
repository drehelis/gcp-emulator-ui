import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { usePagination, usePaginatedData } from '../usePagination'

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { limit, currentPage, defaultLimits } = usePagination()
    expect(limit.value).toBe(25)
    expect(currentPage.value).toBe(1)
    expect(defaultLimits).toEqual([10, 25, 50, 100])
  })

  it('paginationStart and paginationEnd should compute correctly', () => {
    const { paginationStart, paginationEnd, currentPage } = usePagination({
      initialLimit: 10,
    })

    expect(paginationStart.value).toBe(1)
    expect(paginationEnd.value).toBe(10)

    currentPage.value = 2
    expect(paginationStart.value).toBe(11)
    expect(paginationEnd.value).toBe(20)
  })

  it('handleLimitChange should reset page to 1', () => {
    const { limit, currentPage, handleLimitChange } = usePagination()
    currentPage.value = 5
    limit.value = 50
    handleLimitChange()
    expect(currentPage.value).toBe(1)
  })

  it('nextPage and previousPage should work', () => {
    const { currentPage, nextPage, previousPage } = usePagination()
    nextPage()
    expect(currentPage.value).toBe(2)
    previousPage()
    expect(currentPage.value).toBe(1)
    previousPage()
    expect(currentPage.value).toBe(1) // should not go below 1
  })

  it('resetPage should work', () => {
    const { currentPage, resetPage } = usePagination()
    currentPage.value = 10
    resetPage()
    expect(currentPage.value).toBe(1)
  })
})

describe('usePaginatedData', () => {
  const items = ref(Array.from({ length: 100 }, (_, i) => i))
  const totalCount = ref(100)

  it('paginatedItems should return correct slice', () => {
    const pagination = usePagination({ initialLimit: 10 })
    const { paginatedItems } = usePaginatedData({ items, totalCount }, pagination)

    expect(paginatedItems.value).toHaveLength(10)
    expect(paginatedItems.value[0]).toBe(0)
    expect(paginatedItems.value[9]).toBe(9)

    pagination.nextPage()
    expect(paginatedItems.value[0]).toBe(10)
  })

  it('hasMore should reflect if more data exists', () => {
    const pagination = usePagination({ initialLimit: 50 })
    const { hasMore } = usePaginatedData({ items, totalCount }, pagination)

    expect(hasMore.value).toBe(true)

    pagination.nextPage()
    expect(hasMore.value).toBe(false) // 2 * 50 = 100, which is totalCount
  })

  it('actualPaginationStart and actualPaginationEnd handle boundary checks', () => {
    const pagination = usePagination({ initialLimit: 30 })
    const { paginationStart, paginationEnd } = usePaginatedData({ items, totalCount }, pagination)

    expect(paginationStart.value).toBe(1)
    expect(paginationEnd.value).toBe(30)

    pagination.currentPage.value = 4 // 91 to 120
    expect(paginationStart.value).toBe(91)
    expect(paginationEnd.value).toBe(100) // capped at totalCount
  })

  it('actualPaginationStart and actualPaginationEnd return 0 for empty data', () => {
    const emptyItems = ref([])
    const emptyTotal = ref(0)
    const pagination = usePagination()
    const { paginationStart, paginationEnd } = usePaginatedData(
      { items: emptyItems, totalCount: emptyTotal },
      pagination
    )

    expect(paginationStart.value).toBe(0)
    expect(paginationEnd.value).toBe(0)
  })
})
