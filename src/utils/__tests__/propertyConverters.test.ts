import { describe, it, expect } from 'vitest'
import { propertyFormToDatastoreValue, datastoreValueToPropertyForm } from '../propertyConverters'

describe('propertyConverters', () => {
  describe('propertyFormToDatastoreValue', () => {
    it('converts basic types', () => {
      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'string', value: 'val1', indexed: true })
      ).toEqual({ stringValue: 'val1', excludeFromIndexes: false })

      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'integer', value: '123', indexed: true })
      ).toEqual({ integerValue: '123', excludeFromIndexes: false })

      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'boolean', value: 'true', indexed: true })
      ).toEqual({ booleanValue: true, excludeFromIndexes: false })

      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'double', value: '1.5', indexed: true })
      ).toEqual({ doubleValue: 1.5, excludeFromIndexes: false })
    })

    it('handles special string types', () => {
      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'text',
          value: 'long text',
          indexed: true,
        })
      ).toEqual({ stringValue: 'long text', excludeFromIndexes: true })
    })

    it('handles timestamps', () => {
      // datetime-local format
      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'timestamp',
          value: '2026-04-08T18:00',
          indexed: true,
        })
      ).toEqual({ timestampValue: '2026-04-08T18:00:00Z', excludeFromIndexes: false })

      // with seconds
      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'timestamp',
          value: '2026-04-08T18:00:15',
          indexed: true,
        })
      ).toEqual({ timestampValue: '2026-04-08T18:00:15Z', excludeFromIndexes: false })

      // already has Z
      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'timestamp',
          value: '2026-04-08T18:00:00.123Z',
          indexed: true,
        })
      ).toEqual({ timestampValue: '2026-04-08T18:00:00.123Z', excludeFromIndexes: false })
    })

    it('handles geopoint', () => {
      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'geopoint',
          value: '10, 20',
          indexed: true,
        })
      ).toEqual({ geoPointValue: { latitude: 10, longitude: 20 }, excludeFromIndexes: false })
    })

    it('handles JSON types', () => {
      const arrayVal = { values: [{ stringValue: 'a' }] }
      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'array',
          value: JSON.stringify(arrayVal),
          indexed: true,
        })
      ).toEqual({ arrayValue: arrayVal, excludeFromIndexes: false })

      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'array', value: 'invalid', indexed: true })
      ).toEqual({ arrayValue: { values: [] }, excludeFromIndexes: false })

      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'key', value: 'invalid', indexed: true })
      ).toEqual({ keyValue: {}, excludeFromIndexes: false })

      expect(
        propertyFormToDatastoreValue({
          name: 'f1',
          type: 'entity',
          value: 'invalid',
          indexed: true,
        })
      ).toEqual({ entityValue: { properties: {} }, excludeFromIndexes: false })
    })

    it('handles null', () => {
      expect(
        propertyFormToDatastoreValue({ name: 'f1', type: 'null', value: '', indexed: true })
      ).toEqual({ nullValue: null, excludeFromIndexes: false })
    })
  })

  describe('datastoreValueToPropertyForm', () => {
    it('converts basic types back', () => {
      expect(datastoreValueToPropertyForm('f1', { stringValue: 'v1' })).toMatchObject({
        type: 'string',
        value: 'v1',
        indexed: true,
      })

      expect(
        datastoreValueToPropertyForm('f1', { stringValue: 'v1', excludeFromIndexes: true })
      ).toMatchObject({ type: 'text', value: 'v1', indexed: false })

      expect(datastoreValueToPropertyForm('f1', { integerValue: '123' })).toMatchObject({
        type: 'integer',
        value: '123',
      })

      expect(datastoreValueToPropertyForm('f1', { booleanValue: true })).toMatchObject({
        type: 'boolean',
        value: 'true',
      })

      expect(datastoreValueToPropertyForm('f1', { doubleValue: 1.5 })).toMatchObject({
        type: 'double',
        value: '1.5',
      })

      expect(datastoreValueToPropertyForm('f1', { nullValue: null })).toMatchObject({
        type: 'null',
        value: '',
      })
    })

    it('formats timestamp for datetime-local', () => {
      expect(
        datastoreValueToPropertyForm('f1', { timestampValue: '2026-04-08T18:00:15.123Z' })
      ).toMatchObject({ type: 'timestamp', value: '2026-04-08T18:00:15' })

      expect(
        datastoreValueToPropertyForm('f1', { timestampValue: '2026-04-08T18:00:15Z' })
      ).toMatchObject({ type: 'timestamp', value: '2026-04-08T18:00:15' })
    })

    it('formats geopoint', () => {
      expect(
        datastoreValueToPropertyForm('f1', { geoPointValue: { latitude: 1.2, longitude: 3.4 } })
      ).toMatchObject({ type: 'geopoint', value: '1.2,3.4' })
    })

    it('formats null', () => {
      expect(datastoreValueToPropertyForm('f1', { booleanValue: true })).toMatchObject({
        type: 'boolean',
        value: 'true',
      })
    })

    it('converts complex types back', () => {
      const keyVal = { partitionId: { projectId: 'p1' }, path: [] }
      expect(datastoreValueToPropertyForm('f1', { keyValue: keyVal })).toMatchObject({
        type: 'key',
        value: JSON.stringify(keyVal, null, 2),
      })

      const arrayVal = { values: [{ stringValue: 'a' }] }
      expect(datastoreValueToPropertyForm('f1', { arrayValue: arrayVal })).toMatchObject({
        type: 'array',
        value: JSON.stringify(arrayVal, null, 2),
      })

      const entityVal = { properties: { k: { stringValue: 'v' } } }
      expect(datastoreValueToPropertyForm('f1', { entityValue: entityVal })).toMatchObject({
        type: 'entity',
        value: JSON.stringify(entityVal, null, 2),
      })
    })
  })
})
