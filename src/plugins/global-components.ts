/**
 * Global components plugin
 * Registers commonly used components globally
 */

import type { App } from 'vue'

// Import commonly used icons from Heroicons
import {
  // Navigation icons
  HomeIcon,
  ChartBarIcon,
  QueueListIcon,
  InboxStackIcon,
  DocumentTextIcon,
  CogIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  FolderIcon,
  
  // Action icons
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  XMarkIcon,
  
  // Status icons
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  
  // Arrow icons
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  
  // Other common icons
  UserIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/vue/24/outline'

// Import filled versions for active states
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  QueueListIcon as QueueListIconSolid,
  InboxStackIcon as InboxStackIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CogIcon as CogIconSolid,
  PresentationChartLineIcon as PresentationChartLineIconSolid,
  ChartPieIcon as ChartPieIconSolid,
  FolderIcon as FolderIconSolid
} from '@heroicons/vue/24/solid'

export default {
  install(app: App) {
    // Register outline icons
    app.component('HomeIcon', HomeIcon)
    app.component('ChartBarIcon', ChartBarIcon)
    app.component('QueueListIcon', QueueListIcon)
    app.component('InboxStackIcon', InboxStackIcon)
    app.component('DocumentTextIcon', DocumentTextIcon)
    app.component('CogIcon', CogIcon)
    app.component('PresentationChartLineIcon', PresentationChartLineIcon)
    app.component('ChartPieIcon', ChartPieIcon)
    app.component('FolderIcon', FolderIcon)
    
    app.component('PlusIcon', PlusIcon)
    app.component('TrashIcon', TrashIcon)
    app.component('PencilIcon', PencilIcon)
    app.component('EyeIcon', EyeIcon)
    app.component('ArrowPathIcon', ArrowPathIcon)
    app.component('MagnifyingGlassIcon', MagnifyingGlassIcon)
    app.component('FunnelIcon', FunnelIcon)
    app.component('Bars3Icon', Bars3Icon)
    app.component('XMarkIcon', XMarkIcon)
    
    app.component('CheckCircleIcon', CheckCircleIcon)
    app.component('ExclamationCircleIcon', ExclamationCircleIcon)
    app.component('ExclamationTriangleIcon', ExclamationTriangleIcon)
    app.component('InformationCircleIcon', InformationCircleIcon)
    app.component('ClockIcon', ClockIcon)
    
    app.component('ChevronLeftIcon', ChevronLeftIcon)
    app.component('ChevronRightIcon', ChevronRightIcon)
    app.component('ChevronUpIcon', ChevronUpIcon)
    app.component('ChevronDownIcon', ChevronDownIcon)
    app.component('ArrowUpIcon', ArrowUpIcon)
    app.component('ArrowDownIcon', ArrowDownIcon)
    
    app.component('UserIcon', UserIcon)
    app.component('BellIcon', BellIcon)
    app.component('SunIcon', SunIcon)
    app.component('MoonIcon', MoonIcon)
    app.component('ComputerDesktopIcon', ComputerDesktopIcon)
    app.component('EllipsisVerticalIcon', EllipsisVerticalIcon)
    app.component('ArrowRightOnRectangleIcon', ArrowRightOnRectangleIcon)
    app.component('PaperAirplaneIcon', PaperAirplaneIcon)
    app.component('ArrowDownTrayIcon', ArrowDownTrayIcon)
    app.component('ArrowsPointingOutIcon', ArrowsPointingOutIcon)
    app.component('ArrowsPointingInIcon', ArrowsPointingInIcon)
    
    // Register solid icons with 'Solid' suffix
    app.component('HomeIconSolid', HomeIconSolid)
    app.component('ChartBarIconSolid', ChartBarIconSolid)
    app.component('QueueListIconSolid', QueueListIconSolid)
    app.component('InboxStackIconSolid', InboxStackIconSolid)
    app.component('DocumentTextIconSolid', DocumentTextIconSolid)
    app.component('CogIconSolid', CogIconSolid)
    app.component('PresentationChartLineIconSolid', PresentationChartLineIconSolid)
    app.component('ChartPieIconSolid', ChartPieIconSolid)
    app.component('FolderIconSolid', FolderIconSolid)
  }
}