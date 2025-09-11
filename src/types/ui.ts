/**
 * UI-specific TypeScript definitions
 * Component props, state management, and UI interaction types
 */

import type { Component, ComponentPublicInstance } from 'vue'

// Theme types
export type Theme = 'light' | 'dark' | 'auto'
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'

export interface ThemeConfig {
  mode: Theme
  colorScheme: ColorScheme
  customColors?: Record<string, string>
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  density: 'compact' | 'comfortable' | 'spacious'
}

// Layout types
export interface LayoutConfig {
  sidebar: {
    collapsed: boolean
    width: number
    collapsedWidth: number
  }
  header: {
    height: number
    fixed: boolean
  }
  footer: {
    height: number
    visible: boolean
  }
}

// Navigation types
export interface NavigationItem {
  id: string
  label: string
  icon?: Component
  route?: string
  href?: string
  children?: NavigationItem[]
  badge?: string | number
  disabled?: boolean
  divider?: boolean
  external?: boolean
}

export interface BreadcrumbItem {
  label: string
  route?: string
  disabled?: boolean
}

// Modal and Dialog types
export interface ModalConfig {
  id: string
  component: Component
  props?: Record<string, any>
  options?: {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
    persistent?: boolean
    backdrop?: boolean
    keyboard?: boolean
    centered?: boolean
    scrollable?: boolean
    fullscreen?: boolean | 'sm' | 'md' | 'lg' | 'xl'
  }
}

export interface DialogAction {
  label: string
  action: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  disabled?: boolean
  loading?: boolean
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'datetime'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  options?: SelectOption[]
  validation?: ValidationRule[]
  help?: string
  prefix?: string
  suffix?: string
  rows?: number
  cols?: number
}

export interface SelectOption {
  label: string
  value: any
  disabled?: boolean
  group?: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: Function
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string[]>
  touched: Record<string, boolean>
  dirty: Record<string, boolean>
  valid: boolean
  loading: boolean
  submitting: boolean
}

// Table types
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  formatter?: Function
  component?: Component
  props?: Record<string, any>
  headerComponent?: Component
  headerProps?: Record<string, any>
}

export interface TableConfig {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  selectable?: boolean
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  pagination?: PaginationConfig
  actions?: TableAction[]
  emptyMessage?: string
  loadingMessage?: string
  errorMessage?: string
}

export interface TableAction {
  label: string
  icon?: string
  action: Function
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  disabled?: Function
  visible?: Function
  loading?: boolean
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  pageSizes?: number[]
}

// Toast notification types
export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  timestamp: Date
}

export interface NotificationAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary'
}

// Loading states
export interface LoadingState {
  global: boolean
  components: Record<string, boolean>
  operations: Record<string, boolean>
}

// Search and filter types
export interface SearchConfig {
  placeholder?: string
  debounce?: number
  minLength?: number
  suggestions?: string[]
  filters?: FilterConfig[]
}

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean'
  options?: SelectOption[]
  multiple?: boolean
  placeholder?: string
}

export interface FilterState {
  query: string
  filters: Record<string, any>
  active: boolean
  count: number
}

// Chart and visualization types
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter'
  data: ChartData
  options?: ChartOptions
  responsive?: boolean
  maintainAspectRatio?: boolean
  height?: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
}

export interface ChartOptions {
  plugins?: {
    legend?: {
      display?: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    tooltip?: {
      enabled?: boolean
      mode?: string
    }
  }
  scales?: {
    x?: ScaleConfig
    y?: ScaleConfig
  }
  animation?: {
    duration?: number
    easing?: string
  }
}

export interface ScaleConfig {
  type?: 'linear' | 'logarithmic' | 'category' | 'time'
  display?: boolean
  title?: {
    display?: boolean
    text?: string
  }
  ticks?: {
    stepSize?: number
    min?: number
    max?: number
  }
}

// Drag and drop types
export interface DragConfig {
  enabled: boolean
  handle?: string
  group?: string
  sort?: boolean
  animation?: number
  ghostClass?: string
  chosenClass?: string
  dragClass?: string
}

export interface DropZoneConfig {
  accept?: string[]
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
}

// Virtual scrolling types
export interface VirtualScrollConfig {
  itemHeight: number | Function
  buffer?: number
  threshold?: number
  enabled?: boolean
}

// Keyboard shortcuts types
export interface KeyboardShortcut {
  key: string
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  description: string
  action: () => void
  enabled?: boolean
  global?: boolean
}

// Context menu types
export interface ContextMenuItem {
  label: string
  icon?: string
  action: () => void
  disabled?: boolean
  divider?: boolean
  children?: ContextMenuItem[]
}

// Component state types
export interface ComponentState {
  mounted: boolean
  visible: boolean
  focused: boolean
  disabled: boolean
  loading: boolean
  error?: string | null
}

// Animation types
export interface AnimationConfig {
  enter?: string
  enterActive?: string
  enterTo?: string
  leave?: string
  leaveActive?: string
  leaveTo?: string
  duration?: number | { enter: number; leave: number }
  mode?: 'in-out' | 'out-in'
}

// Responsive design types
export interface Breakpoints {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface ResponsiveValue<T> {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}

// Accessibility types
export interface A11yConfig {
  announcements: boolean
  skipLinks: boolean
  focusManagement: boolean
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
}

// Error boundary types
export interface ErrorInfo {
  componentName: string
  componentStack: string
  errorBoundary: string
  props: Record<string, any>
}

export interface ErrorFallback {
  component: Component
  props?: Record<string, any>
}

// Router types extensions
export interface RouteMetadata {
  title?: string
  description?: string
  icon?: string
  badge?: string | number
  requiresAuth?: boolean
  roles?: string[]
  permissions?: string[]
  layout?: string
  breadcrumbs?: BreadcrumbItem[]
}

// Window/viewport types
export interface ViewportState {
  width: number
  height: number
  breakpoint: keyof Breakpoints
  mobile: boolean
  tablet: boolean
  desktop: boolean
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number
  loadTime: number
  memoryUsage: number
  bundleSize: number
  cacheHits: number
  apiCalls: number
}

// Feature flags for UI
export interface UIFeatureFlags {
  enableAdvancedSearch: boolean
  enableBulkOperations: boolean
  enableDragAndDrop: boolean
  enableVirtualScrolling: boolean
  enableRealTimeUpdates: boolean
  enableKeyboardShortcuts: boolean
  enableContextMenu: boolean
  maxTableRows: number
  maxChartDataPoints: number
}

// Component registry
export interface ComponentRegistry {
  [key: string]: {
    component: Component
    props?: Record<string, any>
    async?: boolean
    lazy?: boolean
  }
}

// Event types
export interface UIEvent<T = any> {
  type: string
  target?: ComponentPublicInstance | Element
  payload: T
  timestamp: Date
  bubbles?: boolean
  cancelable?: boolean
}