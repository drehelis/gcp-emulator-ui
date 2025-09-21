/**
 * Firestore localStorage management composable
 * Centralized handling of firestore-related browser storage operations
 */

export const useFirestoreStorage = () => {
  // Storage keys
  const STORAGE_KEY_DATABASES = 'firestore-databases'
  const STORAGE_KEY_SELECTED_DB = 'firestore-selected-database'

  /**
   * Load databases list from localStorage
   * @returns Array of database IDs
   */
  const loadDatabasesFromStorage = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DATABASES)
      return stored ? JSON.parse(stored) : ['(default)']
    } catch (error) {
      console.warn('Failed to load databases from localStorage:', error)
      return ['(default)']
    }
  }

  /**
   * Save databases list to localStorage
   * @param databaseList - Array of database IDs to save
   */
  const saveDatabasesToStorage = (databaseList: string[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY_DATABASES, JSON.stringify(databaseList))
    } catch (error) {
      console.warn('Failed to save databases to localStorage:', error)
    }
  }

  /**
   * Load selected database from localStorage
   * @returns Selected database ID
   */
  const loadSelectedDatabaseFromStorage = (): string => {
    try {
      return localStorage.getItem(STORAGE_KEY_SELECTED_DB) || '(default)'
    } catch (error) {
      console.warn('Failed to load selected database from localStorage:', error)
      return '(default)'
    }
  }

  /**
   * Save selected database to localStorage
   * @param databaseId - Database ID to save as selected
   */
  const saveSelectedDatabaseToStorage = (databaseId: string): void => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_DB, databaseId)
    } catch (error) {
      console.warn('Failed to save selected database to localStorage:', error)
    }
  }

  /**
   * Add a database to the stored list if not already present
   * @param databaseId - Database ID to add
   * @returns Updated databases list
   */
  const addDatabaseToStorage = (databaseId: string): string[] => {
    const currentDatabases = loadDatabasesFromStorage()

    if (!currentDatabases.includes(databaseId)) {
      const updatedDatabases = [...currentDatabases, databaseId]

      // Sort with (default) first, then alphabetically
      updatedDatabases.sort((a, b) => {
        if (a === '(default)') return -1
        if (b === '(default)') return 1
        return a.localeCompare(b)
      })

      saveDatabasesToStorage(updatedDatabases)
      return updatedDatabases
    }

    return currentDatabases
  }

  /**
   * Remove a database from the stored list
   * @param databaseId - Database ID to remove
   * @returns Updated databases list
   */
  const removeDatabaseFromStorage = (databaseId: string): string[] => {
    // Cannot remove the default database
    if (databaseId === '(default)') {
      const currentDatabases = loadDatabasesFromStorage()
      return currentDatabases
    }

    const currentDatabases = loadDatabasesFromStorage()
    const updatedDatabases = currentDatabases.filter(db => db !== databaseId)

    saveDatabasesToStorage(updatedDatabases)

    // If the removed database was selected, switch to default
    const selectedDb = loadSelectedDatabaseFromStorage()
    if (selectedDb === databaseId) {
      saveSelectedDatabaseToStorage('(default)')
    }

    return updatedDatabases
  }

  /**
   * Clear all firestore storage data
   */
  const clearFirestoreStorage = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY_DATABASES)
      localStorage.removeItem(STORAGE_KEY_SELECTED_DB)
    } catch (error) {
      console.warn('Failed to clear firestore storage:', error)
    }
  }

  /**
   * Get all firestore storage data
   * @returns Object with all stored data
   */
  const getFirestoreStorageData = () => {
    return {
      databases: loadDatabasesFromStorage(),
      selectedDatabase: loadSelectedDatabaseFromStorage()
    }
  }

  /**
   * Check if localStorage is available
   * @returns True if localStorage is available
   */
  const isStorageAvailable = (): boolean => {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  return {
    // Core storage operations
    loadDatabasesFromStorage,
    saveDatabasesToStorage,
    loadSelectedDatabaseFromStorage,
    saveSelectedDatabaseToStorage,

    // Database management
    addDatabaseToStorage,
    removeDatabaseFromStorage,

    // Utility functions
    clearFirestoreStorage,
    getFirestoreStorageData,
    isStorageAvailable,

    // Storage keys (for external use if needed)
    STORAGE_KEY_DATABASES,
    STORAGE_KEY_SELECTED_DB
  }
}
