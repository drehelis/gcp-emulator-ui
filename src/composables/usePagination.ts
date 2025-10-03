import { ref, computed, type Ref } from 'vue'

export interface PaginationOptions {
  initialLimit?: number
  defaultLimits?: number[]
}

export function usePagination(options: PaginationOptions = {}) {
  const {
    initialLimit = 25,
    defaultLimits = [10, 25, 50, 100]
  } = options

  const limit = ref(initialLimit)
  const currentPage = ref(1)

  const paginationStart = computed(() => {
    return (currentPage.value - 1) * limit.value + 1
  })

  const paginationEnd = computed(() => {
    return currentPage.value * limit.value
  })

  const handleLimitChange = () => {
    currentPage.value = 1
  }

  const nextPage = () => {
    currentPage.value++
  }

  const previousPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return {
    limit,
    currentPage,
    paginationStart,
    paginationEnd,
    defaultLimits,
    handleLimitChange,
    nextPage,
    previousPage,
    resetPage
  }
}

export interface PaginatedData<T> {
  items: Ref<T[]>
  totalCount: Ref<number>
}

export function usePaginatedData<T>(
  data: PaginatedData<T>,
  pagination: ReturnType<typeof usePagination>
) {
  const paginatedItems = computed(() => {
    const startIndex = (pagination.currentPage.value - 1) * pagination.limit.value
    const endIndex = startIndex + pagination.limit.value
    return data.items.value.slice(startIndex, endIndex)
  })

  const hasMore = computed(() => {
    return data.totalCount.value > pagination.currentPage.value * pagination.limit.value
  })

  const actualPaginationEnd = computed(() => {
    if (data.totalCount.value === 0) return 0
    return Math.min(pagination.currentPage.value * pagination.limit.value, data.totalCount.value)
  })

  const actualPaginationStart = computed(() => {
    if (data.totalCount.value === 0) return 0
    return pagination.paginationStart.value
  })

  return {
    paginatedItems,
    hasMore,
    paginationStart: actualPaginationStart,
    paginationEnd: actualPaginationEnd
  }
}
