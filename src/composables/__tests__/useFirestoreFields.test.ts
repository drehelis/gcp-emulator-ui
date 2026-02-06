/**
 * Tests for useFirestoreFields composable
 * Firestore field type handling and value conversion
 */

import { describe, it, expect } from 'vitest'
import { useFirestoreFields } from '../useFirestoreFields'

describe('useFirestoreFields', () => {
  const fields = useFirestoreFields()

  describe('getDefaultValue', () => {
    it('returns empty string for string type', () => {
      expect(fields.getDefaultValue('string')).toBe('')
    })

    it('returns 0 for number type', () => {
      expect(fields.getDefaultValue('number')).toBe(0)
    })

    it('returns false for boolean type', () => {
      expect(fields.getDefaultValue('boolean')).toBe(false)
    })

    it('returns null for null type', () => {
      expect(fields.getDefaultValue('null')).toBeNull()
    })

    it('returns empty object for map type', () => {
      expect(fields.getDefaultValue('map')).toEqual({})
    })

    it('returns empty array for array type', () => {
      expect(fields.getDefaultValue('array')).toEqual([])
    })

    it('returns empty string for reference type', () => {
      expect(fields.getDefaultValue('reference')).toBe('')
    })

    it('returns empty string for unknown types', () => {
      expect(fields.getDefaultValue('unknown')).toBe('')
    })
  })

  describe('getFieldType', () => {
    it('identifies string value', () => {
      expect(fields.getFieldType({ stringValue: 'hello' })).toBe('string')
    })

    it('identifies integer value as number', () => {
      expect(fields.getFieldType({ integerValue: 42 })).toBe('number')
    })

    it('identifies boolean value', () => {
      expect(fields.getFieldType({ booleanValue: true })).toBe('boolean')
    })

    it('identifies null value', () => {
      expect(fields.getFieldType({ nullValue: null })).toBe('null')
    })

    it('identifies timestamp value', () => {
      expect(fields.getFieldType({ timestampValue: '2026-01-01T00:00:00Z' })).toBe('timestamp')
    })

    it('identifies geopoint value', () => {
      expect(fields.getFieldType({ geoPointValue: { latitude: 0, longitude: 0 } })).toBe('geopoint')
    })

    it('identifies reference value', () => {
      expect(fields.getFieldType({ referenceValue: 'projects/p/databases/d/documents/c/d' })).toBe(
        'reference'
      )
    })

    it('identifies map value', () => {
      expect(fields.getFieldType({ mapValue: { fields: {} } })).toBe('map')
    })

    it('identifies array value', () => {
      expect(fields.getFieldType({ arrayValue: { values: [] } })).toBe('array')
    })

    it('identifies bytes value', () => {
      expect(fields.getFieldType({ bytesValue: 'base64data' })).toBe('bytes')
    })

    it('returns unknown for unrecognized values', () => {
      expect(fields.getFieldType({})).toBe('unknown')
    })
  })

  describe('formatFieldValue', () => {
    it('formats string value (raw, not quoted)', () => {
      expect(fields.formatFieldValue({ stringValue: 'hello' })).toBe('hello')
    })

    it('formats integer value', () => {
      expect(fields.formatFieldValue({ integerValue: 42 })).toBe(42)
    })

    it('formats boolean true', () => {
      expect(fields.formatFieldValue({ booleanValue: true })).toBe('true')
    })

    it('formats boolean false', () => {
      expect(fields.formatFieldValue({ booleanValue: false })).toBe('false')
    })

    it('formats null value', () => {
      expect(fields.formatFieldValue({ nullValue: null })).toBe('null')
    })

    it('formats map value with field count', () => {
      const result = fields.formatFieldValue({ mapValue: { fields: { a: { stringValue: 'b' } } } })
      expect(result).toBe('1 fields')
    })

    it('formats array value with item count', () => {
      const result = fields.formatFieldValue({
        arrayValue: { values: [{ stringValue: 'a' }, { stringValue: 'b' }] },
      })
      expect(result).toBe('2 items')
    })
  })

  describe('getEditableValue', () => {
    it('extracts string value', () => {
      expect(fields.getEditableValue({ stringValue: 'test' })).toBe('test')
    })

    it('extracts integer value as number', () => {
      expect(fields.getEditableValue({ integerValue: '42' })).toBe(42)
    })

    it('extracts boolean value', () => {
      expect(fields.getEditableValue({ booleanValue: true })).toBe(true)
    })

    it('returns null for null value', () => {
      expect(fields.getEditableValue({ nullValue: null })).toBeNull()
    })

    it('returns geopoint as string', () => {
      const result = fields.getEditableValue({ geoPointValue: { latitude: 37, longitude: -122 } })
      expect(result).toBe('37,-122')
    })
  })

  describe('createFirestoreValue', () => {
    it('creates string value', () => {
      expect(fields.createFirestoreValue('string', 'hello')).toEqual({ stringValue: 'hello' })
    })

    it('creates integer value for whole numbers', () => {
      const result = fields.createFirestoreValue('number', 42)
      expect(result.integerValue).toBe('42')
    })

    it('creates double value for decimals', () => {
      const result = fields.createFirestoreValue('number', 3.14)
      expect(result.doubleValue).toBe(3.14)
    })

    it('creates boolean value from truthy value', () => {
      expect(fields.createFirestoreValue('boolean', true)).toEqual({ booleanValue: true })
    })

    it('creates boolean value from falsy value', () => {
      expect(fields.createFirestoreValue('boolean', false)).toEqual({ booleanValue: false })
    })

    it('creates null value', () => {
      expect(fields.createFirestoreValue('null', null)).toEqual({ nullValue: null })
    })

    it('creates geopoint value', () => {
      const result = fields.createFirestoreValue('geopoint', {
        latitude: 37.77,
        longitude: -122.42,
      })
      expect(result.geoPointValue).toEqual({ latitude: 37.77, longitude: -122.42 })
    })
  })

  describe('convertFromFirestoreValue', () => {
    it('converts string value', () => {
      expect(fields.convertFromFirestoreValue({ stringValue: 'test' })).toBe('test')
    })

    it('converts integer value', () => {
      expect(fields.convertFromFirestoreValue({ integerValue: '42' })).toBe(42)
    })

    it('converts double value', () => {
      expect(fields.convertFromFirestoreValue({ doubleValue: 3.14 })).toBe(3.14)
    })

    it('converts boolean value', () => {
      expect(fields.convertFromFirestoreValue({ booleanValue: true })).toBe(true)
    })

    it('converts null value', () => {
      expect(fields.convertFromFirestoreValue({ nullValue: null })).toBeNull()
    })

    it('converts array value', () => {
      const input = {
        arrayValue: {
          values: [{ stringValue: 'a' }, { integerValue: '1' }],
        },
      }
      const result = fields.convertFromFirestoreValue(input)
      expect(result).toEqual(['a', 1])
    })

    it('converts map value', () => {
      const input = {
        mapValue: {
          fields: {
            name: { stringValue: 'test' },
            count: { integerValue: '5' },
          },
        },
      }
      const result = fields.convertFromFirestoreValue(input)
      expect(result).toEqual({ name: 'test', count: 5 })
    })
  })

  describe('isValidFieldName', () => {
    it('accepts valid field names', () => {
      expect(fields.isValidFieldName('name')).toBe(true)
      expect(fields.isValidFieldName('firstName')).toBe(true)
      expect(fields.isValidFieldName('field_name')).toBe(true)
      expect(fields.isValidFieldName('field123')).toBe(true)
      expect(fields.isValidFieldName('123field')).toBe(true) // Actually allowed
    })

    it('rejects empty names', () => {
      expect(fields.isValidFieldName('')).toBe(false)
    })

    it('rejects names starting with _temp_', () => {
      expect(fields.isValidFieldName('_temp_123')).toBe(false)
    })

    it('accepts names with dots and slashes (allowed in practice)', () => {
      // The implementation doesn't restrict these
      expect(fields.isValidFieldName('field.name')).toBe(true)
      expect(fields.isValidFieldName('field/name')).toBe(true)
    })

    it('accepts names starting with __ (not restricted)', () => {
      // Only _temp_ is restricted, not __
      expect(fields.isValidFieldName('__name__')).toBe(true)
    })
  })

  describe('getAvailableFieldTypes', () => {
    it('returns array of field types', () => {
      const types = fields.getAvailableFieldTypes()
      expect(Array.isArray(types)).toBe(true)
      expect(types).toContain('string')
      expect(types).toContain('number')
      expect(types).toContain('boolean')
      expect(types).toContain('map')
      expect(types).toContain('array')
    })
  })

  describe('getFieldTypeInfo', () => {
    it('returns info for valid type', () => {
      const info = fields.getFieldTypeInfo('string')
      expect(info).toHaveProperty('label')
      expect(info).toHaveProperty('defaultValue')
    })

    it('returns null for invalid type', () => {
      expect(fields.getFieldTypeInfo('invalid')).toBeNull()
    })
  })

  describe('generateTempFieldName', () => {
    it('generates names starting with _temp_', () => {
      const name = fields.generateTempFieldName()
      expect(name.startsWith('_temp_')).toBe(true)
    })

    it('generates unique field names', () => {
      const name1 = fields.generateTempFieldName()
      // Add small delay to ensure different timestamp
      const name2 = fields.generateTempFieldName()
      expect(name1).not.toBe(name2)
    })
  })

  describe('createFirestoreValue - edge cases', () => {
    it('creates timestamp value from datetime-local format', () => {
      const result = fields.createFirestoreValue('timestamp', '2026-01-15T10:30')
      expect(result.timestampValue).toBe('2026-01-15T10:30:00.000Z')
    })

    it('creates timestamp value from ISO string', () => {
      const result = fields.createFirestoreValue('timestamp', '2026-01-15T10:30:00.000Z')
      expect(result.timestampValue).toBe('2026-01-15T10:30:00.000Z')
    })

    it('creates timestamp value with default when empty', () => {
      const result = fields.createFirestoreValue('timestamp', '')
      expect(result.timestampValue).toBeDefined()
    })

    it('creates reference value', () => {
      const result = fields.createFirestoreValue(
        'reference',
        'projects/p/databases/d/documents/c/d'
      )
      expect(result.referenceValue).toBe('projects/p/databases/d/documents/c/d')
    })

    it('creates map value from object', () => {
      const result = fields.createFirestoreValue('map', { name: 'test' })
      expect(result.mapValue).toBeDefined()
      expect(result.mapValue.fields).toBeDefined()
    })

    it('creates map value with default for null', () => {
      const result = fields.createFirestoreValue('map', null)
      expect(result.mapValue).toBeDefined()
    })

    it('creates array value', () => {
      const result = fields.createFirestoreValue('array', ['a', 'b'])
      expect(result.arrayValue.values).toHaveLength(2)
    })

    it('creates array value with default for non-array', () => {
      const result = fields.createFirestoreValue('array', 'not-an-array')
      expect(result.arrayValue.values).toEqual([])
    })

    it('creates geopoint with default values', () => {
      const result = fields.createFirestoreValue('geopoint', null)
      expect(result.geoPointValue.latitude).toBe(0)
      expect(result.geoPointValue.longitude).toBe(0)
    })

    it('defaults unknown types to string', () => {
      const result = fields.createFirestoreValue('unknown_type', 'value')
      expect(result.stringValue).toBe('value')
    })
  })

  describe('convertToFirestoreValue - auto-detection', () => {
    it('converts null to nullValue', () => {
      const result = fields.convertToFirestoreValue(null)
      expect(result.nullValue).toBeNull()
    })

    it('converts undefined to nullValue', () => {
      const result = fields.convertToFirestoreValue(undefined)
      expect(result.nullValue).toBeNull()
    })

    it('converts string', () => {
      const result = fields.convertToFirestoreValue('hello')
      expect(result.stringValue).toBe('hello')
    })

    it('converts integer', () => {
      const result = fields.convertToFirestoreValue(42)
      expect(result.integerValue).toBe('42')
    })

    it('converts decimal to double', () => {
      const result = fields.convertToFirestoreValue(3.14)
      expect(result.doubleValue).toBe(3.14)
    })

    it('converts boolean', () => {
      const result = fields.convertToFirestoreValue(true)
      expect(result.booleanValue).toBe(true)
    })

    it('converts array recursively', () => {
      const result = fields.convertToFirestoreValue(['a', 1])
      expect(result.arrayValue.values).toHaveLength(2)
      expect(result.arrayValue.values[0].stringValue).toBe('a')
      expect(result.arrayValue.values[1].integerValue).toBe('1')
    })

    it('converts object to map recursively', () => {
      const result = fields.convertToFirestoreValue({ name: 'test', count: 5 })
      expect(result.mapValue.fields.name.stringValue).toBe('test')
      expect(result.mapValue.fields.count.integerValue).toBe('5')
    })

    it('skips _temp_ keys in object', () => {
      const result = fields.convertToFirestoreValue({ name: 'test', _temp_123: 'skip' })
      expect(result.mapValue.fields.name).toBeDefined()
      expect(result.mapValue.fields._temp_123).toBeUndefined()
    })
  })

  describe('convertFromFirestoreValue - edge cases', () => {
    it('converts timestamp value', () => {
      const result = fields.convertFromFirestoreValue({ timestampValue: '2026-01-15T10:30:00Z' })
      expect(result).toBe('2026-01-15T10:30:00Z')
    })

    it('converts geopoint value', () => {
      const result = fields.convertFromFirestoreValue({
        geoPointValue: { latitude: 37, longitude: -122 },
      })
      expect(result.latitude).toBe(37)
      expect(result.longitude).toBe(-122)
    })

    it('converts geopoint with missing coords', () => {
      const result = fields.convertFromFirestoreValue({ geoPointValue: {} })
      expect(result.latitude).toBe(0)
      expect(result.longitude).toBe(0)
    })

    it('converts reference value', () => {
      const result = fields.convertFromFirestoreValue({
        referenceValue: 'projects/p/databases/d/documents/c/d',
      })
      expect(result).toBe('projects/p/databases/d/documents/c/d')
    })

    it('returns primitive values unchanged', () => {
      expect(fields.convertFromFirestoreValue(null)).toBeNull()
      expect(fields.convertFromFirestoreValue('string')).toBe('string')
      expect(fields.convertFromFirestoreValue(123)).toBe(123)
    })

    it('returns unrecognized objects unchanged', () => {
      const obj = { unknownField: 'value' }
      expect(fields.convertFromFirestoreValue(obj)).toBe(obj)
    })
  })

  describe('formatFieldValue - edge cases', () => {
    it('formats double value', () => {
      const result = fields.formatFieldValue({ doubleValue: 3.14 })
      expect(result).toContain('3.14')
    })

    it('formats unknown value as JSON', () => {
      const result = fields.formatFieldValue({ unknownType: 'value' })
      expect(result).toContain('unknownType')
    })
  })

  describe('getDefaultValue - timestamp', () => {
    it('returns current timestamp as datetime-local format', () => {
      const result = fields.getDefaultValue('timestamp')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })
  })
})
