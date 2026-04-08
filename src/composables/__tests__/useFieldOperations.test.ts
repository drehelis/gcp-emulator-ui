import { describe, it, expect, vi } from 'vitest'
import { useFieldOperations } from '../useFieldOperations'

// Mock useFirestoreFields
vi.mock('@/composables/useFirestoreFields', () => ({
  useFirestoreFields: () => ({
    formatFieldValue: vi.fn(),
    getFieldType: vi.fn(),
    getEditableValue: vi.fn(),
  }),
}))

describe('useFieldOperations', () => {
  it('should initialize with empty expandedMapFields', () => {
    const { expandedMapFields } = useFieldOperations()
    expect(expandedMapFields.value.size).toBe(0)
  })

  it('toggleMapField should add/remove field from set', () => {
    const { toggleMapField, isMapFieldExpanded } = useFieldOperations()

    toggleMapField('field1')
    expect(isMapFieldExpanded('field1')).toBe(true)

    toggleMapField('field1')
    expect(isMapFieldExpanded('field1')).toBe(false)
  })

  it('clearExpandedFields should empty the set', () => {
    const { toggleMapField, clearExpandedFields, expandedMapFields } = useFieldOperations()

    toggleMapField('field1')
    toggleMapField('field2')
    expect(expandedMapFields.value.size).toBe(2)

    clearExpandedFields()
    expect(expandedMapFields.value.size).toBe(0)
  })

  it('restoreExpandedFields should set the expandedMapFields', () => {
    const { restoreExpandedFields, expandedMapFields } = useFieldOperations()
    const newSet = new Set(['field3', 'field4'])

    restoreExpandedFields(newSet)
    expect(expandedMapFields.value).toEqual(newSet)
  })
})
