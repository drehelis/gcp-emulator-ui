/**
 * Vue Router configuration
 * Comprehensive routing with guards, lazy loading, and metadata
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useAppStore } from '@/stores/app'

// Layout imports
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const FullscreenLayout = () => import('@/layouts/FullscreenLayout.vue')

// Route definitions with lazy loading
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: {
          title: 'Home',
          description: 'Home',
          icon: 'HomeIcon',
          requiresAuth: true,
          breadcrumbs: [{ label: 'Home', route: '/' }],
        },
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/ProjectsView.vue'),
        meta: {
          title: 'Projects',
          description: 'Manage your Google Cloud projects',
          icon: 'FolderIcon',
          requiresAuth: true,
          breadcrumbs: [{ label: 'Home', route: '/' }, { label: 'Projects' }],
        },
      },
      {
        path: 'projects/:projectId',
        children: [
          {
            path: '',
            name: 'project-services',
            component: () => import('@/views/ProjectServicesView.vue'),
            props: true,
            meta: {
              title: 'Project Services',
              description: 'Choose which emulator service to manage',
              icon: 'QueueListIcon',
              requiresAuth: true,
              requiresProject: true,
              breadcrumbs: [{ label: 'Home', route: '/' }, { label: ':projectId' }],
            },
          },
          {
            path: 'pubsub/topics',
            children: [
              {
                path: '',
                name: 'project-topics',
                component: () => import('@/views/topics/TopicsListView.vue'),
                props: true,
                meta: {
                  title: 'Topics',
                  description: 'Manage Pub/Sub topics',
                  icon: 'QueueListIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Topics' },
                  ],
                },
              },
              {
                path: 'create',
                name: 'create-topic',
                component: () => import('@/views/topics/CreateTopicView.vue'),
                props: true,
                meta: {
                  title: 'Create Topic',
                  description: 'Create a new Pub/Sub topic',
                  icon: 'PlusIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Topics', route: '/projects/:projectId/pubsub/topics' },
                    { label: 'Create Topic' },
                  ],
                },
              },
              {
                path: ':topicName',
                name: 'topic-details',
                component: () => import('@/views/topics/TopicDetailsView.vue'),
                props: true,
                meta: {
                  title: 'Topic Details',
                  description: 'View and manage topic details',
                  icon: 'InformationCircleIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Topics', route: '/projects/:projectId/pubsub/topics' },
                    { label: 'Topic Details' },
                  ],
                },
              },
              {
                path: ':topicName/publish',
                name: 'publish-messages',
                component: () => import('@/views/topics/PublishMessagesView.vue'),
                props: true,
                meta: {
                  title: 'Publish Messages',
                  description: 'Publish messages to topic',
                  icon: 'PaperAirplaneIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Topics', route: '/projects/:projectId/pubsub/topics' },
                    { label: 'Publish Messages' },
                  ],
                },
              },
            ],
          },
          {
            path: 'pubsub/subscriptions',
            children: [
              {
                path: '',
                name: 'project-subscriptions',
                component: () => import('@/views/subscriptions/SubscriptionsListView.vue'),
                props: true,
                meta: {
                  title: 'Subscriptions',
                  description: 'Manage Pub/Sub subscriptions',
                  icon: 'InboxStackIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Subscriptions' },
                  ],
                },
              },
              {
                path: 'create',
                name: 'create-subscription',
                component: () => import('@/views/subscriptions/CreateSubscriptionView.vue'),
                props: true,
                meta: {
                  title: 'Create Subscription',
                  description: 'Create a new Pub/Sub subscription',
                  icon: 'PlusIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Subscriptions', route: '/projects/:projectId/pubsub/subscriptions' },
                    { label: 'Create Subscription' },
                  ],
                },
              },
              {
                path: ':subscriptionName',
                name: 'subscription-details',
                component: () => import('@/views/subscriptions/SubscriptionDetailsView.vue'),
                props: true,
                meta: {
                  title: 'Subscription Details',
                  description: 'View and manage subscription details',
                  icon: 'InformationCircleIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Subscriptions', route: '/projects/:projectId/pubsub/subscriptions' },
                    { label: 'Subscription Details' },
                  ],
                },
              },
              {
                path: ':subscriptionName/consume',
                name: 'consume-messages',
                component: () => import('@/views/subscriptions/ConsumeMessagesView.vue'),
                props: true,
                meta: {
                  title: 'Consume Messages',
                  description: 'Pull and consume messages from subscription',
                  icon: 'ArrowDownTrayIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Subscriptions', route: '/projects/:projectId/pubsub/subscriptions' },
                    { label: 'Consume Messages' },
                  ],
                },
              },
            ],
          },
          {
            path: 'pubsub/message-templates',
            children: [
              {
                path: '',
                name: 'project-message-templates',
                component: () => import('@/views/messageTemplates/MessageTemplatesView.vue'),
                props: true,
                meta: {
                  title: 'Message Templates',
                  description: 'Manage reusable message templates',
                  icon: 'DocumentDuplicateIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Pub/Sub' },
                    { label: 'Message Templates' },
                  ],
                },
              },
            ],
          },
          {
            path: 'import-export',
            name: 'project-unified-import-export',
            component: () => import('@/views/ImportExportView.vue'),
            props: true,
            meta: {
              title: 'Import/Export',
              description: 'Import and export configurations for all emulator services',
              icon: 'ArrowsRightLeftIcon',
              requiresAuth: true,
              requiresProject: true,
              breadcrumbs: [
                { label: 'Home', route: '/' },
                { label: ':projectId', route: '/projects/:projectId' },
                { label: 'Import/Export' },
              ],
            },
          },
          // Cloud Storage routes
          {
            path: 'storage/buckets',
            children: [
              {
                path: '',
                name: 'project-storage-buckets',
                component: () => import('@/views/storage/BucketsListView.vue'),
                props: true,
                meta: {
                  title: 'Buckets',
                  description: 'Manage Cloud Storage buckets',
                  icon: 'ArchiveBoxIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Cloud Storage' },
                    { label: 'Buckets' },
                  ],
                },
              },
              {
                path: 'create',
                name: 'create-storage-bucket',
                component: () => import('@/views/storage/CreateBucketView.vue'),
                props: true,
                meta: {
                  title: 'Create Bucket',
                  description: 'Create a new Cloud Storage bucket',
                  icon: 'PlusIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Cloud Storage' },
                    { label: 'Buckets', route: '/projects/:projectId/storage/buckets' },
                    { label: 'Create Bucket' },
                  ],
                },
              },
              {
                path: ':bucketName',
                children: [
                  {
                    path: '',
                    name: 'storage-bucket-browser',
                    component: () => import('@/views/storage/BucketBrowserView.vue'),
                    props: true,
                    meta: {
                      title: 'Bucket Browser',
                      description: 'Browse and manage objects in bucket',
                      icon: 'FolderIcon',
                      requiresAuth: true,
                      requiresProject: true,
                      breadcrumbs: [
                        { label: 'Home', route: '/' },
                        { label: ':projectId', route: '/projects/:projectId' },
                        { label: 'Cloud Storage' },
                        { label: 'Buckets', route: '/projects/:projectId/storage/buckets' },
                        { label: ':bucketName' },
                      ],
                    },
                  },
                  {
                    path: 'objects/:objectPath*',
                    name: 'storage-object-details',
                    component: () => import('@/views/storage/ObjectDetailsView.vue'),
                    props: true,
                    meta: {
                      title: 'Object Details',
                      description: 'View and manage object details',
                      icon: 'DocumentIcon',
                      requiresAuth: true,
                      requiresProject: true,
                      breadcrumbs: [
                        { label: 'Home', route: '/' },
                        { label: ':projectId', route: '/projects/:projectId' },
                        { label: 'Cloud Storage' },
                        { label: 'Buckets', route: '/projects/:projectId/storage/buckets' },
                        {
                          label: ':bucketName',
                          route: '/projects/:projectId/storage/buckets/:bucketName',
                        },
                        { label: 'Object Details' },
                      ],
                    },
                  },
                  {
                    path: 'upload',
                    name: 'storage-upload-objects',
                    component: () => import('@/views/storage/UploadObjectsView.vue'),
                    props: true,
                    meta: {
                      title: 'Upload Objects',
                      description: 'Upload files to the bucket',
                      icon: 'ArrowUpTrayIcon',
                      requiresAuth: true,
                      requiresProject: true,
                      breadcrumbs: [
                        { label: 'Home', route: '/' },
                        { label: ':projectId', route: '/projects/:projectId' },
                        { label: 'Cloud Storage' },
                        { label: 'Buckets', route: '/projects/:projectId/storage/buckets' },
                        {
                          label: ':bucketName',
                          route: '/projects/:projectId/storage/buckets/:bucketName',
                        },
                        { label: 'Upload' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          // Firestore routes
          {
            path: 'firestore/collections',
            children: [
              {
                path: '',
                name: 'project-firestore-collections',
                component: () => import('@/views/firestore/CollectionsView.vue'),
                props: true,
                meta: {
                  title: 'Collections',
                  description: 'Manage Firestore collections and documents',
                  icon: 'CircleStackIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Firestore' },
                    { label: 'Collections' },
                  ],
                },
              },
            ],
          },
          // Datastore routes
          {
            path: 'datastore/namespaces',
            children: [
              {
                path: '',
                name: 'project-datastore-namespaces',
                component: () => import('@/views/datastore/KindsView.vue'),
                props: true,
                meta: {
                  title: 'Namespaces',
                  description: 'Manage Datastore namespaces',
                  icon: 'FolderIcon',
                  requiresAuth: true,
                  requiresProject: true,
                  breadcrumbs: [
                    { label: 'Home', route: '/' },
                    { label: ':projectId', route: '/projects/:projectId' },
                    { label: 'Datastore' },
                    { label: 'Namespaces' },
                  ],
                },
              },
            ],
          },
        ],
      },
      // Legacy redirects for backward compatibility
      {
        path: 'topics',
        redirect: () => {
          const projectsStore = useProjectsStore()
          const selectedProject = projectsStore.selectedProjectId
          if (selectedProject) {
            return `/projects/${selectedProject}/pubsub/topics`
          }
          return '/'
        },
      },
      {
        path: 'subscriptions',
        redirect: () => {
          const projectsStore = useProjectsStore()
          const selectedProject = projectsStore.selectedProjectId
          if (selectedProject) {
            return `/projects/${selectedProject}/pubsub/subscriptions`
          }
          return '/'
        },
      },
      {
        path: 'schemas',
        children: [
          {
            path: '',
            name: 'schemas',
            component: () => import('@/views/schemas/SchemasListView.vue'),
            meta: {
              title: 'Schemas',
              description: 'Manage Pub/Sub schemas',
              icon: 'DocumentTextIcon',
              requiresAuth: true,
              requiresProject: true,
              breadcrumbs: [{ label: 'Home', route: '/' }, { label: 'Schemas' }],
            },
          },
          {
            path: 'create',
            name: 'create-schema',
            component: () => import('@/views/schemas/CreateSchemaView.vue'),
            meta: {
              title: 'Create Schema',
              description: 'Create a new Pub/Sub schema',
              icon: 'PlusIcon',
              requiresAuth: true,
              requiresProject: true,
              breadcrumbs: [
                { label: 'Home', route: '/' },
                { label: 'Schemas', route: '/schemas' },
                { label: 'Create Schema' },
              ],
            },
          },
          {
            path: ':schemaName',
            name: 'schema-details',
            component: () => import('@/views/schemas/SchemaDetailsView.vue'),
            props: true,
            meta: {
              title: 'Schema Details',
              description: 'View and manage schema details',
              icon: 'InformationCircleIcon',
              requiresAuth: true,
              requiresProject: true,
              breadcrumbs: [
                { label: 'Home', route: '/' },
                { label: 'Schemas', route: '/schemas' },
                { label: 'Schema Details' },
              ],
            },
          },
        ],
      },
    ],
  },
  // Authentication routes
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: {
          title: 'Sign In',
          description: 'Sign in to your account',
          requiresAuth: false,
        },
      },
      {
        path: 'callback',
        name: 'auth-callback',
        component: () => import('@/views/auth/CallbackView.vue'),
        meta: {
          title: 'Authentication',
          description: 'Processing authentication...',
          requiresAuth: false,
        },
      },
    ],
  },
  // Fullscreen routes
  {
    path: '/fullscreen',
    component: FullscreenLayout,
    children: [
      {
        path: 'message-viewer/:messageId',
        name: 'fullscreen-message-viewer',
        component: () => import('@/views/fullscreen/MessageViewerView.vue'),
        props: true,
        meta: {
          title: 'Message Viewer',
          description: 'Fullscreen message viewer',
          requiresAuth: true,
        },
      },
    ],
  },
  // Error pages
  {
    path: '/error',
    component: DefaultLayout,
    children: [
      {
        path: '404',
        name: 'not-found',
        component: () => import('@/views/error/NotFoundView.vue'),
        meta: {
          title: 'Page Not Found',
          description: 'The page you are looking for does not exist',
        },
      },
      {
        path: '403',
        name: 'forbidden',
        component: () => import('@/views/error/ForbiddenView.vue'),
        meta: {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource',
        },
      },
      {
        path: '500',
        name: 'server-error',
        component: () => import('@/views/error/ServerErrorView.vue'),
        meta: {
          title: 'Server Error',
          description: 'An unexpected error occurred',
        },
      },
    ],
  },
  // Catch all route - redirect to 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/error/404',
  },
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    } else {
      return { top: 0 }
    }
  },
})

// Global navigation guards
router.beforeEach(async (to, _from) => {
  const appStore = useAppStore()
  const projectsStore = useProjectsStore()

  // Set loading state
  appStore.setGlobalLoading(true, 'Navigating...')

  // Sync project selection from route parameters
  if (to.params.projectId && typeof to.params.projectId === 'string') {
    if (projectsStore.selectedProjectId !== to.params.projectId) {
      projectsStore.selectProject(to.params.projectId)
    }
  }

  // Update page title and breadcrumbs
  if (to.meta.title) {
    appStore.setPageTitle(to.meta.title as string)
  }

  if (to.meta.description) {
    appStore.setPageDescription(to.meta.description as string)
  }

  if (to.meta.breadcrumbs) {
    // Process breadcrumbs to replace :projectId and :bucketName with actual values
    const projectId = (to.params.projectId as string) || projectsStore.selectedProjectId
    const bucketName = to.params.bucketName as string
    const breadcrumbs = (to.meta.breadcrumbs as any[]).map(breadcrumb => ({
      ...breadcrumb,
      label: breadcrumb.label
        .replace(':projectId', projectId || 'Project')
        .replace(':bucketName', bucketName || 'Bucket'),
      route: breadcrumb.route
        ?.replace(':projectId', projectId || 'project')
        ?.replace(':bucketName', bucketName || 'bucket'),
    }))
    appStore.setBreadcrumbs(breadcrumbs)
  }

  // Authentication check
  if (to.meta.requiresAuth) {
    const isAuthenticated = checkAuthentication() // TODO: Implement actual auth check

    if (!isAuthenticated) {
      appStore.setGlobalLoading(false)
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  // Project requirement check
  if (to.meta.requiresProject && !to.params.projectId && !projectsStore.selectedProjectId) {
    appStore.showToast({
      type: 'warning',
      title: 'Project Required',
      message: 'Please select a project to continue',
    })

    appStore.setGlobalLoading(false)
    return { name: 'projects' }
  }

  // Role-based access control
  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRoles = getUserRoles() // TODO: Implement actual role check
    const hasRequiredRole = (to.meta.roles as string[]).some(role => userRoles.includes(role))

    if (!hasRequiredRole) {
      appStore.setGlobalLoading(false)
      return { name: 'forbidden' }
    }
  }

  // Permission check
  if (to.meta.permissions && to.meta.permissions.length > 0) {
    const userPermissions = getUserPermissions() // TODO: Implement actual permission check
    const hasRequiredPermission = (to.meta.permissions as string[]).some(permission =>
      userPermissions.includes(permission)
    )

    if (!hasRequiredPermission) {
      appStore.setGlobalLoading(false)
      return { name: 'forbidden' }
    }
  }

  return true
})

router.afterEach((to, from) => {
  const appStore = useAppStore()

  // Clear loading state
  appStore.setGlobalLoading(false)

  // Log route changes in development
  if (import.meta.env.DEV) {
    console.log(`Route changed: ${from.path} → ${to.path}`)
  }
})

// Error handling
router.onError(error => {
  const appStore = useAppStore()

  console.error('Router error:', error)

  appStore.setGlobalLoading(false)
  appStore.showToast({
    type: 'error',
    title: 'Navigation Error',
    message: 'An error occurred while navigating. Please try again.',
  })
})

// Helper functions (TODO: Implement actual authentication logic)
function checkAuthentication(): boolean {
  // TODO: Implement actual authentication check
  // For now, return true to allow access
  return true
}

function getUserRoles(): string[] {
  // TODO: Implement actual role retrieval
  return ['user', 'developer']
}

function getUserPermissions(): string[] {
  // TODO: Implement actual permission retrieval
  return ['read', 'write', 'admin']
}

export default router
