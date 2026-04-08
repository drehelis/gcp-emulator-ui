import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDocumentForm } from '../useDocumentForm'

describe('useDocumentForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-08T18:00:00Z'))
  })

  it('initializes with one empty field', () => {
    const { fields, documentId } = useDocumentForm()
    expect(documentId.value).toBe('')
    expect(fields.value).toHaveLength(1)
    expect(fields.value[0].name).toBe('')
  })

  it('addField adds a new field with unique id', () => {
    const { fields, addField } = useDocumentForm()
    addField()
    expect(fields.value).toHaveLength(2)
    expect(fields.value[0].id).not.toBe(fields.value[1].id)
  })

  it('updateFieldValue updates specific field', () => {
    const { fields, updateFieldValue } = useDocumentForm()
    const fieldId = fields.value[0].id
    updateFieldValue(fieldId, { name: 'new_name', value: 'new_val' })
    expect(fields.value[0].name).toBe('new_name')
    expect(fields.value[0].value).toBe('new_val')
  })

  it('removeField removes field and ensures at least one exists', () => {
    const { fields, removeField, addField } = useDocumentForm()
    const firstId = fields.value[0].id

    // Add another so we can remove one without triggering "ensure at least one" logic immediately
    addField()
    expect(fields.value).toHaveLength(2)

    removeField(firstId)
    expect(fields.value).toHaveLength(1)
    expect(fields.value[0].id).not.toBe(firstId)

    // Remove the last one
    const lastId = fields.value[0].id
    removeField(lastId)
    expect(fields.value).toHaveLength(1) // Should still have 1
    expect(fields.value[0].id).not.toBe(lastId)
  })

  describe('buildFirestoreValue', () => {
    const { buildFirestoreValue } = useDocumentForm()

    it('handles various types', () => {
      expect(buildFirestoreValue(null)).toEqual({ nullValue: null })
      expect(buildFirestoreValue('hello')).toEqual({ stringValue: 'hello' })
      expect(buildFirestoreValue(123)).toEqual({ integerValue: '123' })
      expect(buildFirestoreValue(12.3)).toEqual({ doubleValue: 12.3 })
      expect(buildFirestoreValue(true)).toEqual({ booleanValue: true })
    })

    it('handles arrays', () => {
      expect(buildFirestoreValue(['a', 1])).toEqual({
        arrayValue: {
          values: [{ stringValue: 'a' }, { integerValue: '1' }],
        },
      })
    })

    it('handles nested objects (maps)', () => {
      expect(buildFirestoreValue({ k1: 'v1', _temp_key: 'ignore' })).toEqual({
        mapValue: {
          fields: {
            k1: { stringValue: 'v1' },
          },
        },
      })
    })
  })

  describe('buildDocumentFields', () => {
    it('builds final payload', () => {
      const { fields, buildDocumentFields } = useDocumentForm()
      fields.value = [
        { id: '1', name: 'f1', type: 'string', value: 'v1' },
        { id: '2', name: 'f2', type: 'number', value: 42 },
      ]

      const result = buildDocumentFields()
      expect(result).toEqual({
        f1: { stringValue: 'v1' },
        f2: { integerValue: '42' },
      })
    })

    it('adds created_at if no named fields exist', () => {
      const { fields, buildDocumentFields } = useDocumentForm()
      fields.value = [{ id: '1', name: '', type: 'string', value: '' }]

      const result = buildDocumentFields()
      expect(result).toHaveProperty('created_at')
      expect(result.created_at.stringValue).toBe('2026-04-08T18:00:00.000Z')
    })
  })
})
