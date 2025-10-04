import type { DatastoreValue } from '@/types/datastore'
import type { PropertyForm } from '@/components/datastore/PropertyEditor.vue'

/**
 * Convert PropertyForm to Datastore value
 */
export function propertyFormToDatastoreValue(property: PropertyForm): DatastoreValue {
  const datastoreValue: DatastoreValue = {
    excludeFromIndexes: !property.indexed
  }

  switch (property.type) {
    case 'string':
      datastoreValue.stringValue = property.value
      break
    case 'text':
      datastoreValue.stringValue = property.value
      datastoreValue.excludeFromIndexes = true // Text is not indexed by default
      break
    case 'integer':
      datastoreValue.integerValue = property.value
      break
    case 'double':
      datastoreValue.doubleValue = parseFloat(property.value) || 0
      break
    case 'boolean':
      datastoreValue.booleanValue = property.value === 'true'
      break
    case 'timestamp':
      // Convert datetime-local format to RFC 3339 with timezone
      if (property.value) {
        // datetime-local gives us "2025-01-11T11:11", we need "2025-01-11T11:11:00Z"
        const dateTime = property.value.includes(':00') ? property.value : property.value + ':00'
        datastoreValue.timestampValue = dateTime.endsWith('Z') ? dateTime : dateTime + 'Z'
      }
      break
    case 'key':
      try {
        datastoreValue.keyValue = JSON.parse(property.value)
      } catch (e) {
        console.error('Invalid key JSON:', e)
        datastoreValue.keyValue = {}
      }
      break
    case 'geopoint':
      const [lat, lng] = property.value.split(',').map(v => parseFloat(v.trim()))
      datastoreValue.geoPointValue = {
        latitude: lat || 0,
        longitude: lng || 0
      }
      break
    case 'array':
      try {
        datastoreValue.arrayValue = JSON.parse(property.value)
      } catch (e) {
        console.error('Invalid array JSON:', e)
        datastoreValue.arrayValue = { values: [] }
      }
      break
    case 'entity':
      try {
        datastoreValue.entityValue = JSON.parse(property.value)
      } catch (e) {
        console.error('Invalid entity JSON:', e)
        datastoreValue.entityValue = { properties: {} }
      }
      break
    case 'null':
      datastoreValue.nullValue = null
      break
  }

  return datastoreValue
}

/**
 * Convert Datastore value to PropertyForm
 */
export function datastoreValueToPropertyForm(key: string, value: DatastoreValue): PropertyForm {
  let type: PropertyForm['type'] = 'string'
  let val = ''

  if (value.stringValue !== undefined) {
    // Distinguish between string and text based on excludeFromIndexes
    type = value.excludeFromIndexes ? 'text' : 'string'
    val = value.stringValue
  } else if (value.integerValue !== undefined) {
    type = 'integer'
    val = String(value.integerValue)
  } else if (value.doubleValue !== undefined) {
    type = 'double'
    val = String(value.doubleValue)
  } else if (value.booleanValue !== undefined) {
    type = 'boolean'
    val = String(value.booleanValue)
  } else if (value.timestampValue !== undefined) {
    type = 'timestamp'
    // Convert RFC 3339 timestamp to datetime-local format
    // "2025-01-11T11:11:00Z" -> "2025-01-11T11:11"
    val = value.timestampValue.replace(/:\d{2}Z?$/, '').replace(/Z$/, '')
  } else if (value.keyValue !== undefined) {
    type = 'key'
    val = JSON.stringify(value.keyValue, null, 2)
  } else if (value.geoPointValue !== undefined) {
    type = 'geopoint'
    val = `${value.geoPointValue.latitude},${value.geoPointValue.longitude}`
  } else if (value.arrayValue !== undefined) {
    type = 'array'
    val = JSON.stringify(value.arrayValue, null, 2)
  } else if (value.entityValue !== undefined) {
    type = 'entity'
    val = JSON.stringify(value.entityValue, null, 2)
  } else if (value.nullValue !== undefined) {
    type = 'null'
    val = ''
  }

  return {
    name: key,
    type,
    value: val,
    indexed: !value.excludeFromIndexes,
    expanded: false
  }
}
