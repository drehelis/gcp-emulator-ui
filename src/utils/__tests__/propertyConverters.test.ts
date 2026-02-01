/**
 * Tests for propertyConverters utility
 * Datastore value <-> PropertyForm conversions
 */

import { describe, it, expect } from 'vitest'
import { propertyFormToDatastoreValue, datastoreValueToPropertyForm } from '../propertyConverters'

describe('propertyFormToDatastoreValue', () => {
  describe('string types', () => {
    it('converts string type correctly', () => {
      const result = propertyFormToDatastoreValue({
        name: 'test',
        type: 'string',
        value: 'hello world',
        indexed: true,
        expanded: false
      })
      
      expect(result.stringValue).toBe('hello world')
      expect(result.excludeFromIndexes).toBe(false)
    })

    it('converts text type with excludeFromIndexes=true', () => {
      const result = propertyFormToDatastoreValue({
        name: 'description',
        type: 'text',
        value: 'long text here',
        indexed: false,
        expanded: false
      })
      
      expect(result.stringValue).toBe('long text here')
      expect(result.excludeFromIndexes).toBe(true)
    })
  })

  describe('numeric types', () => {
    it('converts integer type', () => {
      const result = propertyFormToDatastoreValue({
        name: 'count',
        type: 'integer',
        value: '42',
        indexed: true,
        expanded: false
      })
      
      expect(result.integerValue).toBe('42')
    })

    it('converts double type', () => {
      const result = propertyFormToDatastoreValue({
        name: 'price',
        type: 'double',
        value: '19.99',
        indexed: true,
        expanded: false
      })
      
      expect(result.doubleValue).toBe(19.99)
    })

    it('handles invalid double value', () => {
      const result = propertyFormToDatastoreValue({
        name: 'price',
        type: 'double',
        value: 'not a number',
        indexed: true,
        expanded: false
      })
      
      expect(result.doubleValue).toBe(0)
    })
  })

  describe('boolean type', () => {
    it('converts true boolean', () => {
      const result = propertyFormToDatastoreValue({
        name: 'active',
        type: 'boolean',
        value: 'true',
        indexed: true,
        expanded: false
      })
      
      expect(result.booleanValue).toBe(true)
    })

    it('converts false boolean', () => {
      const result = propertyFormToDatastoreValue({
        name: 'active',
        type: 'boolean',
        value: 'false',
        indexed: true,
        expanded: false
      })
      
      expect(result.booleanValue).toBe(false)
    })
  })

  describe('timestamp type', () => {
    it('converts datetime-local format to RFC3339', () => {
      const result = propertyFormToDatastoreValue({
        name: 'createdAt',
        type: 'timestamp',
        value: '2026-02-01T12:30',
        indexed: true,
        expanded: false
      })
      
      expect(result.timestampValue).toBe('2026-02-01T12:30:00Z')
    })

    it('converts datetime with seconds to RFC3339', () => {
      const result = propertyFormToDatastoreValue({
        name: 'createdAt',
        type: 'timestamp',
        value: '2026-02-01T12:30:45',
        indexed: true,
        expanded: false
      })
      
      expect(result.timestampValue).toBe('2026-02-01T12:30:45Z')
    })

    it('preserves RFC3339 format with Z', () => {
      const result = propertyFormToDatastoreValue({
        name: 'createdAt',
        type: 'timestamp',
        value: '2026-02-01T12:30:45.123456Z',
        indexed: true,
        expanded: false
      })
      
      expect(result.timestampValue).toBe('2026-02-01T12:30:45.123456Z')
    })
  })

  describe('null type', () => {
    it('converts null type', () => {
      const result = propertyFormToDatastoreValue({
        name: 'empty',
        type: 'null',
        value: '',
        indexed: true,
        expanded: false
      })
      
      expect(result.nullValue).toBe(null)
    })
  })

  describe('geopoint type', () => {
    it('converts geopoint coordinates', () => {
      const result = propertyFormToDatastoreValue({
        name: 'location',
        type: 'geopoint',
        value: '37.7749, -122.4194',
        indexed: true,
        expanded: false
      })
      
      expect(result.geoPointValue).toEqual({
        latitude: 37.7749,
        longitude: -122.4194
      })
    })

    it('handles invalid geopoint', () => {
      const result = propertyFormToDatastoreValue({
        name: 'location',
        type: 'geopoint',
        value: 'invalid',
        indexed: true,
        expanded: false
      })
      
      expect(result.geoPointValue).toEqual({
        latitude: 0,
        longitude: 0
      })
    })
  })

  describe('complex types', () => {
    it('converts array type from JSON', () => {
      const result = propertyFormToDatastoreValue({
        name: 'tags',
        type: 'array',
        value: '{"values": [{"stringValue": "tag1"}]}',
        indexed: true,
        expanded: false
      })
      
      expect(result.arrayValue).toEqual({ values: [{ stringValue: 'tag1' }] })
    })

    it('handles invalid array JSON', () => {
      const result = propertyFormToDatastoreValue({
        name: 'tags',
        type: 'array',
        value: 'invalid json',
        indexed: true,
        expanded: false
      })
      
      expect(result.arrayValue).toEqual({ values: [] })
    })

    it('converts entity type from JSON', () => {
      const result = propertyFormToDatastoreValue({
        name: 'nested',
        type: 'entity',
        value: '{"properties": {"name": {"stringValue": "test"}}}',
        indexed: true,
        expanded: false
      })
      
      expect(result.entityValue).toEqual({ properties: { name: { stringValue: 'test' } } })
    })

    it('handles invalid entity JSON', () => {
      const result = propertyFormToDatastoreValue({
        name: 'nested',
        type: 'entity',
        value: 'invalid',
        indexed: true,
        expanded: false
      })
      
      expect(result.entityValue).toEqual({ properties: {} })
    })

    it('converts key type from JSON', () => {
      const result = propertyFormToDatastoreValue({
        name: 'ref',
        type: 'key',
        value: '{"partitionId": {"projectId": "test"}}',
        indexed: true,
        expanded: false
      })
      
      expect(result.keyValue).toEqual({ partitionId: { projectId: 'test' } })
    })
  })
})

describe('datastoreValueToPropertyForm', () => {
  it('converts string value', () => {
    const result = datastoreValueToPropertyForm('name', {
      stringValue: 'hello',
      excludeFromIndexes: false
    })
    
    expect(result).toEqual({
      name: 'name',
      type: 'string',
      value: 'hello',
      indexed: true,
      expanded: false
    })
  })

  it('converts text value (string with excludeFromIndexes)', () => {
    const result = datastoreValueToPropertyForm('description', {
      stringValue: 'long text',
      excludeFromIndexes: true
    })
    
    expect(result.type).toBe('text')
    expect(result.indexed).toBe(false)
  })

  it('converts integer value', () => {
    const result = datastoreValueToPropertyForm('count', {
      integerValue: 42
    })
    
    expect(result.type).toBe('integer')
    expect(result.value).toBe('42')
  })

  it('converts double value', () => {
    const result = datastoreValueToPropertyForm('price', {
      doubleValue: 19.99
    })
    
    expect(result.type).toBe('double')
    expect(result.value).toBe('19.99')
  })

  it('converts boolean value', () => {
    const result = datastoreValueToPropertyForm('active', {
      booleanValue: true
    })
    
    expect(result.type).toBe('boolean')
    expect(result.value).toBe('true')
  })

  it('converts timestamp value, stripping milliseconds', () => {
    const result = datastoreValueToPropertyForm('createdAt', {
      timestampValue: '2026-02-06T08:39:28.026860Z'
    })
    
    expect(result.type).toBe('timestamp')
    expect(result.value).toBe('2026-02-06T08:39:28')
  })

  it('converts geopoint value', () => {
    const result = datastoreValueToPropertyForm('location', {
      geoPointValue: { latitude: 37.7749, longitude: -122.4194 }
    })
    
    expect(result.type).toBe('geopoint')
    expect(result.value).toBe('37.7749,-122.4194')
  })

  it('converts null value', () => {
    const result = datastoreValueToPropertyForm('empty', {
      nullValue: null
    })
    
    expect(result.type).toBe('null')
    expect(result.value).toBe('')
  })

  it('converts array value to JSON', () => {
    const result = datastoreValueToPropertyForm('tags', {
      arrayValue: { values: [{ stringValue: 'a' }] }
    })
    
    expect(result.type).toBe('array')
    expect(JSON.parse(result.value)).toEqual({ values: [{ stringValue: 'a' }] })
  })

  it('converts entity value to JSON', () => {
    const result = datastoreValueToPropertyForm('nested', {
      entityValue: { properties: { x: { integerValue: 1 } } }
    })
    
    expect(result.type).toBe('entity')
    expect(JSON.parse(result.value)).toEqual({ properties: { x: { integerValue: 1 } } })
  })

  it('converts key value to JSON', () => {
    const result = datastoreValueToPropertyForm('ref', {
      keyValue: { partitionId: { projectId: 'test' } }
    })
    
    expect(result.type).toBe('key')
    expect(JSON.parse(result.value)).toEqual({ partitionId: { projectId: 'test' } })
  })
})
