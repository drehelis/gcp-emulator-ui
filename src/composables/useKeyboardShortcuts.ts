/**
 * Keyboard shortcuts composable
 * Provides a unified way to register and manage keyboard shortcuts
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { KeyboardShortcut } from '@/types'
import hotkeys from 'hotkeys-js'

export function useKeyboardShortcuts() {
  const registeredShortcuts = ref<Map<string, KeyboardShortcut>>(new Map())
  const enabled = ref(true)

  function registerShortcut(shortcut: KeyboardShortcut) {
    const key = formatShortcutKey(shortcut)

    registeredShortcuts.value.set(key, shortcut)

    // Configure hotkeys scope
    const scope = shortcut.global ? 'global' : 'local'

    // Register with hotkeys library
    hotkeys(key, { scope }, event => {
      if (!enabled.value || (shortcut.enabled !== undefined && !shortcut.enabled)) {
        return
      }

      // Prevent default behavior
      event.preventDefault()

      // Execute action
      try {
        shortcut.action()
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error)
      }
    })

    console.log(`Registered keyboard shortcut: ${key} - ${shortcut.description}`)
  }

  function registerShortcuts(shortcuts: KeyboardShortcut[]) {
    shortcuts.forEach(registerShortcut)
  }

  function unregisterShortcut(shortcut: KeyboardShortcut) {
    const key = formatShortcutKey(shortcut)

    if (registeredShortcuts.value.has(key)) {
      hotkeys.unbind(key)
      registeredShortcuts.value.delete(key)
      console.log(`Unregistered keyboard shortcut: ${key}`)
    }
  }

  function unregisterShortcuts(shortcuts?: KeyboardShortcut[]) {
    if (shortcuts) {
      shortcuts.forEach(unregisterShortcut)
    } else {
      // Unregister all shortcuts
      registeredShortcuts.value.forEach(shortcut => {
        const key = formatShortcutKey(shortcut)
        hotkeys.unbind(key)
      })
      registeredShortcuts.value.clear()
    }
  }

  function enableShortcuts() {
    enabled.value = true
  }

  function disableShortcuts() {
    enabled.value = false
  }

  function toggleShortcuts() {
    enabled.value = !enabled.value
  }

  function getRegisteredShortcuts(): KeyboardShortcut[] {
    return Array.from(registeredShortcuts.value.values())
  }

  function formatShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = shortcut.modifiers || []
    const parts = [...modifiers, shortcut.key.toLowerCase()]

    // Normalize modifier names for hotkeys library
    const normalizedParts = parts.map(part => {
      switch (part) {
        case 'ctrl':
        case 'control':
          return 'ctrl'
        case 'alt':
        case 'option':
          return 'alt'
        case 'shift':
          return 'shift'
        case 'meta':
        case 'cmd':
        case 'command':
          return 'cmd'
        default:
          return part
      }
    })

    return normalizedParts.join('+')
  }

  function formatDisplayKey(shortcut: KeyboardShortcut): string {
    const modifiers = shortcut.modifiers || []
    const parts = [...modifiers, shortcut.key]

    // Format for display (with proper symbols)
    const displayParts = parts.map(part => {
      switch (part.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return '⌃'
        case 'alt':
        case 'option':
          return '⌥'
        case 'shift':
          return '⇧'
        case 'meta':
        case 'cmd':
        case 'command':
          return '⌘'
        case 'enter':
        case 'return':
          return '↩'
        case 'escape':
        case 'esc':
          return '⎋'
        case 'space':
          return '␣'
        case 'tab':
          return '⇥'
        case 'backspace':
          return '⌫'
        case 'delete':
          return '⌦'
        case 'arrowup':
        case 'up':
          return '↑'
        case 'arrowdown':
        case 'down':
          return '↓'
        case 'arrowleft':
        case 'left':
          return '←'
        case 'arrowright':
        case 'right':
          return '→'
        default:
          return part.toUpperCase()
      }
    })

    return displayParts.join(' + ')
  }

  // Set global scope by default
  onMounted(() => {
    hotkeys.setScope('global')
  })

  // Cleanup on unmount
  onUnmounted(() => {
    unregisterShortcuts()
  })

  return {
    registeredShortcuts: registeredShortcuts.value,
    enabled,
    registerShortcut,
    registerShortcuts,
    unregisterShortcut,
    unregisterShortcuts,
    enableShortcuts,
    disableShortcuts,
    toggleShortcuts,
    getRegisteredShortcuts,
    formatShortcutKey,
    formatDisplayKey,
  }
}
