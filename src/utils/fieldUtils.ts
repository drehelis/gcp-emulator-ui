/**
 * Utility functions for Firestore field handling
 */

export interface FieldTypeInfo {
  label: string
  defaultValue: any
}

export const FIELD_TYPES: Record<string, FieldTypeInfo> = {
  string: { label: 'String', defaultValue: '' },
  number: { label: 'Number', defaultValue: 0 },
  boolean: { label: 'Boolean', defaultValue: false },
  null: { label: 'Null', defaultValue: null },
  timestamp: { label: 'Timestamp', defaultValue: () => new Date().toISOString().slice(0, 16) },
  map: { label: 'Map', defaultValue: {} },
  array: { label: 'Array', defaultValue: [] },
  geopoint: { label: 'GeoPoint', defaultValue: { latitude: 0, longitude: 0 } },
  reference: { label: 'Reference', defaultValue: '' }
}

/**
 * Get default value for a field type
 */
export const getDefaultValue = (type: string): any => {
  const typeInfo = FIELD_TYPES[type]
  if (!typeInfo) return ''

  const defaultValue = typeInfo.defaultValue
  return typeof defaultValue === 'function' ? defaultValue() : defaultValue
}

/**
 * Convert JavaScript value to Firestore format
 */
export const createFirestoreValue = (type: string, value: any): any => {
  switch (type) {
    case 'string':
      return { stringValue: String(value || '') }

    case 'number': {
      const num = Number(value || 0)
      return Number.isInteger(num)
        ? { integerValue: num.toString() }
        : { doubleValue: num }
    }

    case 'boolean':
      return { booleanValue: Boolean(value) }

    case 'null':
      return { nullValue: null }

    case 'timestamp': {
      // Convert datetime-local format to ISO string
      let isoString = value || new Date().toISOString()

      // If value is from datetime-local input (YYYY-MM-DDTHH:mm), convert to full ISO
      if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Add seconds and timezone to make it a valid ISO string
        isoString = `${value  }:00.000Z`
      } else if (value && typeof value === 'string' && !value.endsWith('Z')) {
        // If it's a datetime string but missing timezone, add it
        const date = new Date(value)
        isoString = date.toISOString()
      }

      return { timestampValue: isoString }
    }

    case 'geopoint': {
      const geo = value || { latitude: 0, longitude: 0 }
      return {
        geoPointValue: {
          latitude: Number(geo.latitude || 0),
          longitude: Number(geo.longitude || 0)
        }
      }
    }

    case 'reference':
      return { referenceValue: String(value || '') }

    case 'map': {
      const fields: Record<string, any> = {}
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, val] of Object.entries(value)) {
          // Skip temporary keys (empty field names)
          if (!key.startsWith('_temp_')) {
            fields[key] = convertToFirestoreValue(val)
          }
        }
      }
      return { mapValue: { fields } }
    }

    case 'array': {
      const values = Array.isArray(value) ? value : []
      return {
        arrayValue: {
          values: values.map(item => convertToFirestoreValue(item))
        }
      }
    }

    default:
      return { stringValue: String(value || '') }
  }
}

/**
 * Smart conversion that detects type from value - used with FieldEditor
 */
export const convertToFirestoreValue = (value: any): any => {
  if (value === null || value === undefined) {
    return { nullValue: null }
  }

  if (typeof value === 'string') {
    return { stringValue: value }
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value }
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value }
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(item => convertToFirestoreValue(item))
      }
    }
  }

  if (typeof value === 'object') {
    const fields: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      // Skip temporary keys (empty field names)
      if (!key.startsWith('_temp_')) {
        fields[key] = convertToFirestoreValue(val)
      }
    }
    return { mapValue: { fields } }
  }

  return { stringValue: String(value) }
}

/**
 * Convert Firestore value to JavaScript format
 */
export const convertFromFirestoreValue = (firestoreValue: any): any => {
  if (!firestoreValue || typeof firestoreValue !== 'object') {
    return firestoreValue
  }

  if ('stringValue' in firestoreValue) {
    return firestoreValue.stringValue
  }

  if ('integerValue' in firestoreValue) {
    return parseInt(firestoreValue.integerValue, 10)
  }

  if ('doubleValue' in firestoreValue) {
    return firestoreValue.doubleValue
  }

  if ('booleanValue' in firestoreValue) {
    return firestoreValue.booleanValue
  }

  if ('nullValue' in firestoreValue) {
    return null
  }

  if ('timestampValue' in firestoreValue) {
    return firestoreValue.timestampValue
  }

  if ('geoPointValue' in firestoreValue) {
    return {
      latitude: firestoreValue.geoPointValue.latitude || 0,
      longitude: firestoreValue.geoPointValue.longitude || 0
    }
  }

  if ('referenceValue' in firestoreValue) {
    return firestoreValue.referenceValue
  }

  if ('mapValue' in firestoreValue && firestoreValue.mapValue.fields) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(firestoreValue.mapValue.fields)) {
      result[key] = convertFromFirestoreValue(value)
    }
    return result
  }

  if ('arrayValue' in firestoreValue && firestoreValue.arrayValue.values) {
    return firestoreValue.arrayValue.values.map((item: any) => convertFromFirestoreValue(item))
  }

  return firestoreValue
}


/**
 * Validate field name
 */
export const isValidFieldName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false

  // Firestore field names cannot be empty and have certain restrictions
  const trimmed = name.trim()
  if (trimmed.length === 0) return false
  if (trimmed.startsWith('_temp_')) return false

  return true
}

/**
 * Generate a temporary field name for new fields
 */
export const generateTempFieldName = (): string => {
  return `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}