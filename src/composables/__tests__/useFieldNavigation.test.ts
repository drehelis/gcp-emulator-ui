import { describe, it, expect } from 'vitest'
import { useFieldNavigation } from '../useFieldNavigation'

describe('useFieldNavigation', () => {
  const { parseFieldPath, navigateToFieldPath, navigateToParentPath } = useFieldNavigation()

  describe('parseFieldPath', () => {
    it('parses dot notation', () => {
      expect(parseFieldPath('a.b.c')).toEqual(['a', 'b', 'c'])
    })

    it('parses array brackets', () => {
      expect(parseFieldPath('a[0].b')).toEqual(['a', '[0]', 'b'])
      expect(parseFieldPath('arr[10]')).toEqual(['arr', '[10]'])
    })

    it('throws on missing closing bracket', () => {
      expect(() => parseFieldPath('a[0')).toThrow('Malformed path')
    })
  })

  describe('navigateToFieldPath', () => {
    const mockData = {
      mapValue: {
        fields: {
          user: {
            mapValue: {
              fields: {
                name: { stringValue: 'John' },
                tags: {
                  arrayValue: {
                    values: [{ stringValue: 'dev' }, { stringValue: 'admin' }],
                  },
                },
              },
            },
          },
        },
      },
    }

    it('navigates through maps and arrays', () => {
      expect(navigateToFieldPath(mockData, 'user.name')).toEqual({ stringValue: 'John' })
      expect(navigateToFieldPath(mockData, 'user.tags[1]')).toEqual({ stringValue: 'admin' })
    })

    it('throws if field not found', () => {
      expect(() => navigateToFieldPath(mockData, 'user.age')).toThrow('Field "age" is undefined')
    })

    it('throws if index out of bounds', () => {
      expect(() => navigateToFieldPath(mockData, 'user.tags[5]')).toThrow('out of bounds')
    })

    it('throws if expected array but found something else', () => {
      expect(() => navigateToFieldPath(mockData, 'user.name[0]')).toThrow('Expected array')
    })
  })

  describe('navigateToParentPath', () => {
    const mockData = {
      mapValue: {
        fields: {
          a: {
            mapValue: {
              fields: {
                b: { stringValue: 'val' },
              },
            },
          },
        },
      },
    }

    it('returns parent and last part', () => {
      const result = navigateToParentPath(mockData, 'a.b')
      expect(result.lastPart).toBe('b')
      expect(result.parent).toEqual(mockData.mapValue.fields.a)
    })

    it('handles top level fields', () => {
      const result = navigateToParentPath(mockData, 'a')
      expect(result.lastPart).toBe('a')
      expect(result.parent).toBe(mockData)
    })

    it('throws for empty path', () => {
      expect(() => navigateToParentPath(mockData, '')).toThrow('empty path')
    })
  })
})
