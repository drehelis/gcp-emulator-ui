export const getDocumentId = (documentPath: string): string => {
  return documentPath.split('/').pop() || documentPath
}

export const formatFieldValue = (value: any): string => {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return value.integerValue
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
  if (value.geoPointValue !== undefined) return `${value.geoPointValue.latitude}, ${value.geoPointValue.longitude}`
  if (value.bytesValue !== undefined) return value.bytesValue
  if (value.nullValue !== undefined) return 'null'
  return JSON.stringify(value, null, 2)
}

export const getFieldType = (value: any): string => {
  if (value.stringValue !== undefined) return 'string'
  if (value.integerValue !== undefined) return 'number'
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

export const getEditableValue = (firestoreValue: any): any => {
  if (firestoreValue.stringValue !== undefined) return firestoreValue.stringValue
  if (firestoreValue.integerValue !== undefined) return Number(firestoreValue.integerValue)
  if (firestoreValue.booleanValue !== undefined) return firestoreValue.booleanValue
  if (firestoreValue.timestampValue !== undefined) return firestoreValue.timestampValue
  if (firestoreValue.referenceValue !== undefined) return firestoreValue.referenceValue
  if (firestoreValue.nullValue !== undefined) return null
  if (firestoreValue.geoPointValue !== undefined) return `${firestoreValue.geoPointValue.latitude},${firestoreValue.geoPointValue.longitude}`
  return ''
}