/**
 * Consolidated Firestore field utilities composable
 * Combines functionality from firestoreHelpers.ts and fieldUtils.ts
 */

export interface FieldTypeInfo {
  label: string
  defaultValue: any
}

export const useFirestoreFields = () => {
  // Field type definitions and metadata
  const FIELD_TYPES: Record<string, FieldTypeInfo> = {
    string: { label: 'String', defaultValue: '' },
    number: { label: 'Number', defaultValue: 0 },
    boolean: { label: 'Boolean', defaultValue: false },
    null: { label: 'Null', defaultValue: null },
    timestamp: { label: 'Timestamp', defaultValue: () => new Date().toISOString().slice(0, 16) },
    map: { label: 'Map', defaultValue: {} },
    array: { label: 'Array', defaultValue: [] },
    geopoint: { label: 'GeoPoint', defaultValue: { latitude: 0, longitude: 0 } },
    reference: { label: 'Reference', defaultValue: '' },
    bytes: { label: 'Bytes', defaultValue: '' },
    vector: { label: 'Vector', defaultValue: '0, 0' },
    decimal128: { label: 'Decimal128', defaultValue: '0' },
  }

  /**
   * Detects Firestore Vector values in either wire representation:
   * - Standard map wrapper: `{ mapValue: { fields: { __type__: { stringValue: '__vector__' }, value: { arrayValue: ... } } } }`
   * - Direct proto wrapper: `{ vectorValue: { values: [...] } }`
   */
  const isVectorValue = (value: any): boolean => {
    if (!value || typeof value !== 'object') return false
    if (value.vectorValue !== undefined) return true
    return value.mapValue?.fields?.__type__?.stringValue === '__vector__'
  }

  /**
   * Extracts numeric coordinates from a Firestore Vector value.
   */
  const extractVectorNumbers = (value: any): number[] => {
    if (!value || typeof value !== 'object') return []

    const rawValues =
      value.vectorValue?.values || value.mapValue?.fields?.value?.arrayValue?.values || []

    return rawValues
      .map((item: any) => {
        if (typeof item === 'number') return item
        if (item?.doubleValue !== undefined) return Number(item.doubleValue)
        if (item?.integerValue !== undefined) return Number(item.integerValue)
        return Number.NaN
      })
      .filter((n: number) => !Number.isNaN(n))
  }

  /**
   * Parses a comma-separated string or numeric array into a vector of finite numbers.
   * Returns null if input contains non-numeric or non-finite entries.
   */
  const parseVectorInput = (input: string | number[]): number[] | null => {
    if (Array.isArray(input)) {
      const nums = input.map(Number)
      return nums.every(n => Number.isFinite(n)) ? nums : null
    }

    if (typeof input !== 'string') return null
    const trimmed = input
      .trim()
      .replace(/^\[|\]$/g, '')
      .trim()
    if (!trimmed) return []

    const parts = trimmed.split(',').map(p => p.trim())
    const nums = parts.map(p => (p === '' ? Number.NaN : Number(p)))
    return nums.every(n => Number.isFinite(n)) ? nums : null
  }

  /**
   * Detects Firestore Enterprise Decimal128 values in either direct or typed-map format.
   */
  const isDecimal128Value = (value: any): boolean => {
    if (!value || typeof value !== 'object') return false
    if (value.decimal128Value !== undefined) return true
    return value.mapValue?.fields?.__type__?.stringValue === '__decimal128__'
  }

  /**
   * Extracts string representation of a Decimal128 value without losing precision.
   */
  const extractDecimal128String = (value: any): string => {
    if (!value || typeof value !== 'object') return ''
    if (value.decimal128Value !== undefined) return String(value.decimal128Value)
    if (value.mapValue?.fields?.__type__?.stringValue === '__decimal128__') {
      return String(value.mapValue.fields.value?.stringValue ?? '')
    }
    return ''
  }

  /**
   * Validates IEEE 754 Decimal128 string representation (decimal, scientific notation, NaN, +/-Infinity).
   */
  const isValidDecimal128 = (val: string): boolean => {
    if (typeof val !== 'string') return false
    const trimmed = val.trim()
    if (!trimmed) return false
    return (
      /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(trimmed) ||
      /^[+-]?(Infinity|NaN)$/.test(trimmed)
    )
  }

  /**
   * Get default value for a field type
   * @param type - Field type (string, number, boolean, etc.)
   * @returns Default value for the type
   */
  const getDefaultValue = (type: string): any => {
    const typeInfo = FIELD_TYPES[type]
    if (!typeInfo) return ''

    const defaultValue = typeInfo.defaultValue
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue
  }

  /**
   * Get human-readable field type from Firestore value
   * @param value - Firestore value object
   * @returns Field type string
   */
  const getFieldType = (value: any): string => {
    if (!value || typeof value !== 'object') return 'unknown'
    if (value.stringValue !== undefined) return 'string'
    if (value.integerValue !== undefined || value.doubleValue !== undefined) return 'number'
    if (isDecimal128Value(value)) return 'decimal128'
    if (isVectorValue(value)) return 'vector'
    if (value.booleanValue !== undefined) return 'boolean'
    if (value.timestampValue !== undefined) return 'timestamp'
    if (value.arrayValue !== undefined) return 'array'
    if (value.mapValue !== undefined) return 'map'
    if (value.referenceValue !== undefined) return 'reference'
    if (value.geoPointValue !== undefined) return 'geopoint'
    if (value.bytesValue !== undefined) return 'bytes'
    if (value.nullValue !== undefined) return 'null'
    return 'unknown'
  }

  /**
   * Format Firestore value for display
   * @param value - Firestore value object
   * @returns Formatted string for display
   */
  const formatFieldValue = (value: any): string => {
    if (!value || typeof value !== 'object') return String(value ?? '')
    if (value.stringValue !== undefined) return value.stringValue
    if (value.integerValue !== undefined) return value.integerValue
    if (value.doubleValue !== undefined) return String(value.doubleValue)
    if (isDecimal128Value(value)) return extractDecimal128String(value)
    if (isVectorValue(value)) {
      const nums = extractVectorNumbers(value)
      const preview = nums.slice(0, 6).join(', ')
      const suffix = nums.length > 6 ? `, … (${nums.length}d)` : ''
      return `[${preview}${suffix}]`
    }
    if (value.booleanValue !== undefined) return value.booleanValue.toString()
    if (value.timestampValue !== undefined) return value.timestampValue
    if (value.arrayValue !== undefined) {
      const items = value.arrayValue.values || []
      return `${items.length} items`
    }
    if (value.mapValue !== undefined) {
      const fields = Object.keys(value.mapValue.fields || {})
      return `${fields.length} fields`
    }
    if (value.referenceValue !== undefined) return value.referenceValue
    if (value.geoPointValue !== undefined)
      return `${value.geoPointValue.latitude}, ${value.geoPointValue.longitude}`
    if (value.bytesValue !== undefined) return value.bytesValue
    if (value.nullValue !== undefined) return 'null'
    return JSON.stringify(value, null, 2)
  }

  /**
   * Get editable value from Firestore value (for form inputs)
   * @param firestoreValue - Firestore value object
   * @returns Editable value for form inputs
   */
  const getEditableValue = (firestoreValue: any): any => {
    if (!firestoreValue || typeof firestoreValue !== 'object') return ''
    if (firestoreValue.stringValue !== undefined) return firestoreValue.stringValue
    if (firestoreValue.integerValue !== undefined) return Number(firestoreValue.integerValue)
    if (firestoreValue.doubleValue !== undefined) return Number(firestoreValue.doubleValue)
    if (isDecimal128Value(firestoreValue)) return extractDecimal128String(firestoreValue)
    if (isVectorValue(firestoreValue)) return extractVectorNumbers(firestoreValue).join(', ')
    if (firestoreValue.booleanValue !== undefined) return firestoreValue.booleanValue
    if (firestoreValue.timestampValue !== undefined) return firestoreValue.timestampValue
    if (firestoreValue.referenceValue !== undefined) return firestoreValue.referenceValue
    if (firestoreValue.bytesValue !== undefined) return firestoreValue.bytesValue
    if (firestoreValue.nullValue !== undefined) return null
    if (firestoreValue.geoPointValue !== undefined)
      return `${firestoreValue.geoPointValue.latitude},${firestoreValue.geoPointValue.longitude}`
    return ''
  }

  /**
   * Convert JavaScript value to Firestore format
   * @param type - Field type
   * @param value - JavaScript value to convert
   * @returns Firestore value object
   */
  const createFirestoreValue = (type: string, value: any): any => {
    switch (type) {
      case 'string':
        return { stringValue: String(value || '') }

      case 'number': {
        const num = Number(value || 0)
        return Number.isInteger(num) ? { integerValue: num.toString() } : { doubleValue: num }
      }

      case 'decimal128': {
        const str = value !== undefined && value !== null ? String(value).trim() : '0'
        return { decimal128Value: str || '0' }
      }

      case 'vector': {
        const nums = parseVectorInput(value) ?? []
        return {
          mapValue: {
            fields: {
              __type__: { stringValue: '__vector__' },
              value: {
                arrayValue: {
                  values: nums.map(n => ({ doubleValue: n })),
                },
              },
            },
          },
        }
      }

      case 'bytes':
        return { bytesValue: String(value || '') }

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
          isoString = `${value}:00.000Z`
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
            longitude: Number(geo.longitude || 0),
          },
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
            values: values.map(item => convertToFirestoreValue(item)),
          },
        }
      }

      default:
        return { stringValue: String(value || '') }
    }
  }

  /**
   * Smart conversion that detects type from value - used with FieldEditor
   * @param value - JavaScript value to convert
   * @returns Firestore value object
   */
  const convertToFirestoreValue = (value: any): any => {
    if (value === null || value === undefined) {
      return { nullValue: null }
    }

    if (typeof value === 'string') {
      return { stringValue: value }
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? { integerValue: value.toString() } : { doubleValue: value }
    }

    if (typeof value === 'boolean') {
      return { booleanValue: value }
    }

    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(item => convertToFirestoreValue(item)),
        },
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
   * @param firestoreValue - Firestore value object
   * @returns JavaScript value
   */
  const convertFromFirestoreValue = (firestoreValue: any): any => {
    if (!firestoreValue || typeof firestoreValue !== 'object') {
      return firestoreValue
    }

    if (isDecimal128Value(firestoreValue)) {
      return extractDecimal128String(firestoreValue)
    }

    if (isVectorValue(firestoreValue)) {
      return extractVectorNumbers(firestoreValue)
    }

    if ('bytesValue' in firestoreValue) {
      return firestoreValue.bytesValue
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
        longitude: firestoreValue.geoPointValue.longitude || 0,
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
   * @param name - Field name to validate
   * @returns True if valid field name
   */
  const isValidFieldName = (name: string): boolean => {
    if (!name || typeof name !== 'string') return false

    // Firestore field names cannot be empty and have certain restrictions
    const trimmed = name.trim()
    if (trimmed.length === 0) return false
    if (trimmed.startsWith('_temp_')) return false

    return true
  }

  /**
   * Generate a temporary field name for new fields
   * @returns Temporary field name
   */
  const generateTempFieldName = (): string => {
    return `_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get all available field types
   * @returns Array of field type keys
   */
  const getAvailableFieldTypes = (): string[] => {
    return Object.keys(FIELD_TYPES)
  }

  /**
   * Get field type info (label and default value)
   * @param type - Field type
   * @returns Field type information
   */
  const getFieldTypeInfo = (type: string): FieldTypeInfo | null => {
    return FIELD_TYPES[type] || null
  }

  return {
    // Constants
    FIELD_TYPES,

    // Type utilities
    getFieldType,
    getAvailableFieldTypes,
    getFieldTypeInfo,
    getDefaultValue,

    // Value formatting and conversion
    formatFieldValue,
    getEditableValue,
    createFirestoreValue,
    convertToFirestoreValue,
    convertFromFirestoreValue,

    // Validation and utilities
    isValidFieldName,
    generateTempFieldName,
    isVectorValue,
    extractVectorNumbers,
    parseVectorInput,
    isDecimal128Value,
    extractDecimal128String,
    isValidDecimal128,
  }
}
