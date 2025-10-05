/**
 * Main types export file
 * Central location for all TypeScript type definitions
 */

// Re-export all types
export * from './pubsub'
export * from './storage'
export * from './firestore'
export * from './datastore'
export * from './api'
export * from './ui'

// Global type augmentations
declare global {
  interface Window {
    __APP_VERSION__: string
  }
}

// Vue type augmentations
declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: {
      success: Function
      error: Function
      warning: Function
      info: Function
      clear: () => void
    }
    $modal: {
      open: Function
      close: Function
      closeAll: () => void
    }
    $loading: {
      show: Function
      hide: () => void
    }
    $APP_VERSION: string
  }

  interface ComponentCustomProps {
    loading?: boolean
    disabled?: boolean
    readonly?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  }
}

// Vue Router type augmentations
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    icon?: string
    requiresAuth?: boolean
    roles?: string[]
    permissions?: string[]
    layout?: string
    breadcrumbs?: Array<{
      label: string
      route?: string
      disabled?: boolean
    }>
  }
}

// Pinia type augmentations (removed problematic interface)

// Environment variables
export interface ImportMetaEnv {
  readonly PUBSUB_PROXY_BASE_URL: string
  readonly VITE_VERSION: string
}

export interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybeNull<T> = T | null | undefined

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type KeyOf<T> = keyof T
export type ValueOf<T> = T[keyof T]

export type Awaited<T> = T extends Promise<infer U> ? U : T

export type NonEmptyArray<T> = [T, ...T[]]

export type Flatten<T> = T extends (infer U)[] ? U : T

// Function types
export type EventHandler = Function
export type ErrorHandler = Function

// Component types
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type ComponentState = 'idle' | 'loading' | 'success' | 'error'

// Generic event types
export interface BaseEvent {
  type: string
  timestamp: Date
  source?: string
}

export interface ErrorEvent extends BaseEvent {
  type: 'error'
  error: Error
  context?: Record<string, any>
}

export interface SuccessEvent extends BaseEvent {
  type: 'success'
  message: string
  data?: any
}

export interface WarningEvent extends BaseEvent {
  type: 'warning'
  message: string
  context?: Record<string, any>
}

// Store types
export type StoreState = 'idle' | 'loading' | 'success' | 'error'

export interface BaseStoreState {
  state: StoreState
  error: string | null
  lastUpdated: Date | null
}

// API types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type ContentType = 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data'

// Date/Time types
export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'iso' | 'relative'
export type TimeZone = string // IANA timezone identifier

// File types
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

export type FileAccept = string | string[]

// Color types
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'

// Animation easing types
export type EasingFunction = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | string

// Sorting types
export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: string
  order: SortOrder
}

// Generic CRUD operations (removed problematic generics)

// Feature flag types
export type FeatureFlag = boolean | string | number | Record<string, any>

export interface FeatureFlagConfig {
  [key: string]: FeatureFlag
}

// Localization types
export type LocaleCode = string // e.g., 'en-US', 'fr-FR', 'ja-JP'

export interface LocaleConfig {
  code: LocaleCode
  name: string
  flag?: string
  rtl?: boolean
}

// Generic configuration
export interface Config {
  [key: string]: any
}

// Version information
export interface VersionInfo {
  version: string
  buildDate: string
  gitCommit: string
  environment: 'development' | 'staging' | 'production'
}