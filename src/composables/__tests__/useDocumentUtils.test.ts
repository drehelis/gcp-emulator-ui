/**
 * Tests for useDocumentUtils composable
 * Firestore document path utilities
 */

import { describe, it, expect } from 'vitest'
import { useDocumentUtils } from '../useDocumentUtils'

describe('useDocumentUtils', () => {
  const utils = useDocumentUtils()

  describe('getDocumentId', () => {
    it('extracts document ID from full path', () => {
      const path = 'projects/my-project/databases/(default)/documents/users/user123'
      expect(utils.getDocumentId(path)).toBe('user123')
    })

    it('handles simple path', () => {
      expect(utils.getDocumentId('users/doc-id')).toBe('doc-id')
    })

    it('returns original string if no slashes', () => {
      expect(utils.getDocumentId('simple-doc')).toBe('simple-doc')
    })

    it('handles subcollection paths', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1/posts/post1'
      expect(utils.getDocumentId(path)).toBe('post1')
    })
  })

  describe('findDocumentById', () => {
    const mockDocuments = [
      { name: 'projects/p/databases/(default)/documents/users/user1', fields: {} },
      { name: 'projects/p/databases/(default)/documents/users/user2', fields: {} },
      { name: 'projects/p/databases/(default)/documents/users/user3', fields: {} }
    ]

    it('finds document by ID', () => {
      const result = utils.findDocumentById(mockDocuments, 'user2')
      expect(result?.name).toContain('user2')
    })

    it('returns undefined for non-existent ID', () => {
      const result = utils.findDocumentById(mockDocuments, 'user99')
      expect(result).toBeUndefined()
    })

    it('handles empty array', () => {
      const result = utils.findDocumentById([], 'user1')
      expect(result).toBeUndefined()
    })
  })

  describe('findDocumentByPath', () => {
    const mockDocuments = [
      { name: 'projects/p/databases/(default)/documents/users/user1', fields: {} },
      { name: 'projects/p/databases/(default)/documents/posts/post1', fields: {} }
    ]

    it('finds document by full path', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1'
      const result = utils.findDocumentByPath(mockDocuments, path)
      expect(result?.name).toBe(path)
    })

    it('returns undefined for non-existent path', () => {
      const result = utils.findDocumentByPath(mockDocuments, 'nonexistent/path')
      expect(result).toBeUndefined()
    })
  })

  describe('getCollectionIdFromPath', () => {
    it('extracts collection ID from document path', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1'
      expect(utils.getCollectionIdFromPath(path)).toBe('users')
    })

    it('extracts top-level collection from subcollection path', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1/posts/post1'
      expect(utils.getCollectionIdFromPath(path)).toBe('users')
    })

    it('returns empty string for invalid path', () => {
      expect(utils.getCollectionIdFromPath('invalid')).toBe('')
    })

    it('returns empty string for path without documents segment', () => {
      expect(utils.getCollectionIdFromPath('projects/p/databases')).toBe('')
    })
  })

  describe('buildDocumentPath', () => {
    it('builds full document path', () => {
      const result = utils.buildDocumentPath('my-project', '(default)', 'users', 'user123')
      expect(result).toBe('projects/my-project/databases/(default)/documents/users/user123')
    })

    it('uses default database ID when not provided', () => {
      const result = utils.buildDocumentPath('my-project', '(default)', 'users', 'user123')
      expect(result).toContain('databases/(default)')
    })
  })

  describe('getParentCollectionPath', () => {
    it('returns parent path for document', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1'
      expect(utils.getParentCollectionPath(path)).toBe('projects/p/databases/(default)/documents/users')
    })

    it('handles subcollection document', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1/posts/post1'
      expect(utils.getParentCollectionPath(path)).toBe('projects/p/databases/(default)/documents/users/user1/posts')
    })
  })

  describe('isSubcollectionDocument', () => {
    it('returns false for top-level document', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1'
      expect(utils.isSubcollectionDocument(path)).toBe(false)
    })

    it('returns true for subcollection document', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1/posts/post1'
      expect(utils.isSubcollectionDocument(path)).toBe(true)
    })

    it('returns true for deeply nested document', () => {
      const path = 'projects/p/databases/(default)/documents/a/b/c/d/e/f'
      expect(utils.isSubcollectionDocument(path)).toBe(true)
    })

    it('returns false for invalid path', () => {
      expect(utils.isSubcollectionDocument('invalid')).toBe(false)
    })
  })

  describe('getBreadcrumbSegments', () => {
    it('returns collection and document segments', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1'
      const result = utils.getBreadcrumbSegments(path)
      
      expect(result).toEqual([
        { type: 'collection', name: 'users' },
        { type: 'document', name: 'user1' }
      ])
    })

    it('handles subcollection paths', () => {
      const path = 'projects/p/databases/(default)/documents/users/user1/posts/post1'
      const result = utils.getBreadcrumbSegments(path)
      
      expect(result).toEqual([
        { type: 'collection', name: 'users' },
        { type: 'document', name: 'user1' },
        { type: 'collection', name: 'posts' },
        { type: 'document', name: 'post1' }
      ])
    })

    it('returns empty array for invalid path', () => {
      expect(utils.getBreadcrumbSegments('invalid')).toEqual([])
    })

    it('handles collection-only path', () => {
      const path = 'projects/p/databases/(default)/documents/users'
      const result = utils.getBreadcrumbSegments(path)
      
      expect(result).toEqual([
        { type: 'collection', name: 'users' }
      ])
    })
  })

  describe('isValidDocumentId', () => {
    it('accepts valid document IDs', () => {
      expect(utils.isValidDocumentId('user123')).toBe(true)
      expect(utils.isValidDocumentId('doc-with-dashes')).toBe(true)
      expect(utils.isValidDocumentId('doc_with_underscores')).toBe(true)
      expect(utils.isValidDocumentId('MixedCase123')).toBe(true)
    })

    it('rejects empty or whitespace-only IDs', () => {
      expect(utils.isValidDocumentId('')).toBe(false)
      expect(utils.isValidDocumentId('   ')).toBe(false)
    })

    it('rejects IDs with forward slashes', () => {
      expect(utils.isValidDocumentId('path/to/doc')).toBe(false)
    })

    it('rejects null and undefined', () => {
      expect(utils.isValidDocumentId(null as any)).toBe(false)
      expect(utils.isValidDocumentId(undefined as any)).toBe(false)
    })

    it('rejects IDs with control characters', () => {
      expect(utils.isValidDocumentId('doc\x00id')).toBe(false)
      expect(utils.isValidDocumentId('doc\x1Fid')).toBe(false)
    })

    it('rejects IDs longer than 1500 characters', () => {
      const longId = 'a'.repeat(1501)
      expect(utils.isValidDocumentId(longId)).toBe(false)
    })

    it('accepts IDs at the 1500 character limit', () => {
      const maxId = 'a'.repeat(1500)
      expect(utils.isValidDocumentId(maxId)).toBe(true)
    })
  })
})
