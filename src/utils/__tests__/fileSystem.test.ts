
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFileExtension, getFilesFromDataTransfer, readDirectoryEntries } from '../fileSystem'

describe('fileSystem utils', () => {
  describe('getFileExtension', () => {
    it('returns extension for filename with extension', () => {
      expect(getFileExtension('file.txt')).toBe('txt')
      expect(getFileExtension('IMAGE.JPG')).toBe('jpg')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('returns empty string for filename without extension', () => {
      expect(getFileExtension('README')).toBe('')
      expect(getFileExtension('.gitignore')).toBe('gitignore') // technically hidden file
    })

    it('returns empty string for empty input', () => {
      expect(getFileExtension('')).toBe('')
    })
  })

  describe('readDirectoryEntries', () => {
    it('reads files recursively from directory entry', async () => {
      // Mock FileSystemEntry structures
      const mockFile1 = {
        isFile: true,
        isDirectory: false,
        name: 'file1.txt',
        file: (cb: any) => cb(new File([''], 'file1.txt')),
      }

      const mockFile2 = {
        isFile: true,
        isDirectory: false,
        name: 'file2.txt',
        file: (cb: any) => cb(new File([''], 'file2.txt')),
      }

      const mockSubDir = {
        isFile: false,
        isDirectory: true,
        name: 'subdir',
        createReader: () => ({
          readEntries: (cb: any) => {
            // Return file2 on first call, then empty on second to stop
            cb([mockFile2])
          }
        })
      }

      const mockRootDir = {
        createReader: () => ({
          readEntries: (cb: any) => {
             // Mock returning one file and one directory
             // We need to handle the recursive nature: readEntries is called until empty
             let callCount = 0
             return {
               readEntries: (callback: any) => {
                  if (callCount === 0) {
                    callCount++
                    callback([mockFile1, mockSubDir])
                  } else {
                    callback([])
                  }
               }
             }
          }
        })
      }
      
      // Fix: The simplified mock above doesn't fully match the complex recursion in source.
      // Let's create a more robust mock structure.
      
      const createMockFileEntry = (name: string) => ({
        isFile: true,
        isDirectory: false,
        name,
        file: (success: any) => success(new File([''], name)),
      })

      const createMockDirEntry = (name: string, entries: any[]) => {
        let readCalled = false
        return {
          isFile: false,
          isDirectory: true,
          name,
          createReader: () => ({
            readEntries: (success: any) => {
              if (!readCalled) {
                readCalled = true
                success(entries)
              } else {
                success([])
              }
            },
          }),
        }
      }

      const subDir = createMockDirEntry('subdir', [createMockFileEntry('file2.txt')])
      const rootDir = createMockDirEntry('root', [createMockFileEntry('file1.txt'), subDir])

      // @ts-ignore - Mocking DOM types is tricky
      const files = await readDirectoryEntries(rootDir as any)

      expect(files).toHaveLength(2)
      expect(files.find(f => f.name === 'file1.txt')).toBeDefined()
      expect(files.find(f => f.name === 'file2.txt')).toBeDefined()
      // Verify filepath property is set
      const file2 = files.find(f => f.name === 'file2.txt')
      // @ts-ignore
      expect(file2?.filepath).toContain('subdir/file2.txt')
    })
  })

  describe('getFilesFromDataTransfer', () => {
    it('handles flat file drop', async () => {
      const mockFile = new File([''], 'test.txt')
      const mockDataTransfer = {
        items: [
          {
            kind: 'file',
            webkitGetAsEntry: () => ({ isFile: true, isDirectory: false }),
            getAsFile: () => mockFile,
          },
        ],
      }

      // @ts-ignore
      const files = await getFilesFromDataTransfer(mockDataTransfer)
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('test.txt')
    })
    
     it('handles fallback for no items support', async () => {
      const mockFile = new File([''], 'test.txt')
      const mockDataTransfer = {
        items: undefined,
        files: [mockFile]
      }

      // @ts-ignore
      const files = await getFilesFromDataTransfer(mockDataTransfer)
      expect(files).toHaveLength(1)
    })
  })
})
