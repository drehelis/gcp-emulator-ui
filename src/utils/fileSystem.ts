/* eslint-disable no-undef, @typescript-eslint/no-unused-vars, no-unused-vars */
// Use declare global to augment existing DOM types or define missing ones
declare global {
  interface DataTransferItem {
    webkitGetAsEntry(): FileSystemEntry | null
  }

  interface FileSystemEntry {
    readonly isFile: boolean
    readonly isDirectory: boolean
    readonly name: string
    readonly fullPath: string
  }

  interface FileSystemFileEntry extends FileSystemEntry {
    file(successCallback: (file: File) => void, errorCallback?: (error: any) => void): void
  }

  interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader(): FileSystemDirectoryReader
  }

  interface FileSystemDirectoryReader {
    readEntries(
      successCallback: (entries: FileSystemEntry[]) => void,
      errorCallback?: (error: any) => void
    ): void
  }
}

/**
 * Reads directory entries recursively from a FileSystemDirectoryEntry.
 * @param directoryEntry The directory entry to read from.
 * @param path The current path (prefix) for files found within this directory.
 * @returns A promise that resolves to an array of File objects.
 */
export async function readDirectoryEntries(
  directoryEntry: FileSystemDirectoryEntry,
  path = ''
): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const reader = directoryEntry.createReader()
    const allFiles: File[] = []

    const readEntries = () => {
      reader.readEntries(async entries => {
        if (entries.length === 0) {
          resolve(allFiles)
          return
        }

        const promises = entries.map(async entry => {
          const currentPath = path ? `${path}/${entry.name}` : entry.name

          if (entry.isFile) {
            return new Promise<File>((fileResolve, fileReject) => {
              ;(entry as FileSystemFileEntry).file((file: File) => {
                // Attach path info if needed, or just return file
                try {
                  Object.defineProperty(file, 'filepath', {
                    value: currentPath,
                    writable: true,
                  })
                } catch (e) {
                  // ignore
                }
                fileResolve(file)
              }, fileReject)
            })
          } else if (entry.isDirectory) {
            return readDirectoryEntries(entry as FileSystemDirectoryEntry, currentPath)
          }
          return [] as File[]
        })

        try {
          const results = await Promise.all(promises)
          results.forEach(result => {
            if (Array.isArray(result)) {
              allFiles.push(...result)
            } else {
              allFiles.push(result)
            }
          })
          readEntries() // Continue reading until no more entries
        } catch (error) {
          reject(error)
        }
      }, reject)
    }

    readEntries()
  })
}

/**
 * Extracts files from a DragEvent's DataTransfer object, handling both files and folders.
 * @param dataTransfer The DataTransfer object from the drag event.
 * @returns A promise that resolves to an array of File objects.
 */
export async function getFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const allFiles: File[] = []

  if (dataTransfer.items) {
    // Use DataTransferItems API for folder support
    const items = Array.from(dataTransfer.items)

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()

        if (entry?.isFile) {
          const file = item.getAsFile()
          if (file) {
            allFiles.push(file)
          }
        } else if (entry?.isDirectory) {
          // Include the root folder name in the path
          const directoryFiles = await readDirectoryEntries(
            entry as FileSystemDirectoryEntry,
            entry.name
          )
          allFiles.push(...directoryFiles)
        }
      }
    }
  } else {
    // Fallback to files API (files only, no folders)
    allFiles.push(...Array.from(dataTransfer.files))
  }

  return allFiles
}

/**
 * Gets the file extension from a filename.
 * @param filename The filename to extract the extension from.
 * @returns The lowercase file extension, or empty string.
 */
export function getFileExtension(filename: string): string {
  if (!filename) return ''
  const parts = filename.split('.')
  if (parts.length === 1) return ''
  return parts.pop()?.toLowerCase() || ''
}
