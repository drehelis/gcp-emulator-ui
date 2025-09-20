export const useFieldNavigation = () => {
  const parseFieldPath = (path: string): string[] => {
    const pathParts = []
    let current = path

    while (current.length > 0) {
      const dotIndex = current.indexOf('.')
      const bracketIndex = current.indexOf('[')

      if (dotIndex === -1 && bracketIndex === -1) {
        if (current) pathParts.push(current)
        break
      } else if (bracketIndex !== -1 && (dotIndex === -1 || bracketIndex < dotIndex)) {
        const fieldName = current.substring(0, bracketIndex)
        const closingBracket = current.indexOf(']', bracketIndex)

        if (closingBracket === -1) {
          throw new Error(`Malformed path: missing closing bracket in "${path}"`)
        }

        const arrayIndex = current.substring(bracketIndex + 1, closingBracket)

        if (fieldName) pathParts.push(fieldName)
        pathParts.push(`[${arrayIndex}]`)

        current = current.substring(closingBracket + 1)
        if (current.startsWith('.')) current = current.substring(1)
      } else {
        const fieldName = current.substring(0, dotIndex)
        if (fieldName) pathParts.push(fieldName)
        current = current.substring(dotIndex + 1)
      }
    }

    return pathParts
  }

  const navigateWithParts = (currentRef: any, pathParts: string[], originalPath: string): any => {
    if (pathParts.length === 0) {
      return currentRef
    }

    const [currentPart, ...remainingParts] = pathParts

    if (currentPart.startsWith('[') && currentPart.endsWith(']')) {
      const index = parseInt(currentPart.substring(1, currentPart.length - 1))

      if (isNaN(index)) {
        throw new Error(`Invalid array index "${currentPart}" in path "${originalPath}"`)
      }

      if (!currentRef?.arrayValue?.values) {
        throw new Error(`Expected array at path part "${currentPart}" in "${originalPath}", but found: ${typeof currentRef}`)
      }

      if (index < 0 || index >= currentRef.arrayValue.values.length) {
        throw new Error(`Array index ${index} out of bounds in path "${originalPath}"`)
      }

      const arrayItem = currentRef.arrayValue.values[index]
      return navigateWithParts(arrayItem, remainingParts, originalPath)
    } else {
      let nextRef

      if (currentRef?.mapValue?.fields) {
        nextRef = currentRef.mapValue.fields[currentPart]
      } else if (currentRef && typeof currentRef === 'object' && currentPart in currentRef) {
        nextRef = currentRef[currentPart]
      } else {
        throw new Error(`Field "${currentPart}" not found in path "${originalPath}". Available fields: ${currentRef?.mapValue?.fields ? Object.keys(currentRef.mapValue.fields).join(', ') : Object.keys(currentRef || {}).join(', ')}`)
      }

      if (nextRef === undefined) {
        throw new Error(`Field "${currentPart}" is undefined in path "${originalPath}"`)
      }

      return navigateWithParts(nextRef, remainingParts, originalPath)
    }
  }

  const navigateToFieldPath = (fields: any, path: string) => {
    const pathParts = parseFieldPath(path)
    return navigateWithParts(fields, pathParts, path)
  }

  const navigateToParentPath = (fields: any, path: string) => {
    const pathParts = parseFieldPath(path)

    if (pathParts.length === 0) {
      throw new Error('Cannot navigate to parent of empty path')
    }

    if (pathParts.length === 1) {
      return {
        parent: fields,
        lastPart: pathParts[0]
      }
    }

    const parentParts = pathParts.slice(0, -1)
    const lastPart = pathParts[pathParts.length - 1]

    const parent = navigateWithParts(fields, parentParts, path)

    return {
      parent,
      lastPart
    }
  }

  return {
    parseFieldPath,
    navigateToFieldPath,
    navigateToParentPath,
    navigateWithParts
  }
}