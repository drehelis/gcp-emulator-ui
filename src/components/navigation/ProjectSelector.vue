<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
      :class="{ 'justify-center px-2': collapsed }"
    >
      <div class="flex items-center" :class="{ 'justify-center': collapsed }">
        <FolderIcon class="w-4 h-4" :class="collapsed ? '' : 'mr-2'" />
        <span v-if="!collapsed" class="truncate">
          {{ selectedProject || 'Select project...' }}
        </span>
      </div>
      <ChevronDownIcon v-if="!collapsed" class="w-4 h-4 ml-4" />
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600"
          :class="collapsed ? 'w-48' : 'w-80'"
          :style="dropdownStyles"
        >
        <div class="py-1">
          <div v-if="projects.length === 0" class="px-4 py-2 text-sm text-gray-500">
            No projects available
          </div>
          <div
            v-for="project in projects"
            :key="project"
            class="group flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            :class="{ 'bg-gray-100 dark:bg-gray-700': project === selectedProject }"
          >
            <button
              @click="selectProject(project)"
              class="flex-1 text-left hover:text-gray-900 dark:hover:text-white"
            >
              {{ project }}
            </button>
            <button
              @click.stop="deleteProjectConfirm(project)"
              class="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Delete project"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-600">
            <button
              @click="openAddProjectModal"
              class="block w-full px-4 py-2 text-sm text-left text-blue-600 hover:bg-gray-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-gray-700"
            >
              <PlusIcon class="inline w-4 h-4 mr-2" />
              Add New Project
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>

    <!-- Add Project Modal -->
    <AddProjectModal v-model="showAddProjectModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { FolderIcon, ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import AddProjectModal from '@/components/modals/AddProjectModal.vue'

interface Props {
  collapsed?: boolean
}

withDefaults(defineProps<Props>(), {
  collapsed: false
})

const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()
const isOpen = ref(false)
const showAddProjectModal = ref(false)
const dropdownRef = ref<HTMLElement>()

const selectedProject = computed(() => projectsStore.selectedProjectId)
const projects = computed(() => projectsStore.projectList)

const dropdownStyles = computed(() => {
  if (!dropdownRef.value) return {}
  
  const rect = dropdownRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`
  }
})

const selectProject = async (project: string) => {
  projectsStore.selectProject(project)
  isOpen.value = false

  // Preserve the current route structure but change the project ID
  const currentPath = route.path
  const currentProjectId = route.params.projectId as string

  if (currentProjectId && currentPath.includes(`/projects/${currentProjectId}`)) {
    // Replace the current project ID with the new one in the path
    const newPath = currentPath.replace(`/projects/${currentProjectId}`, `/projects/${project}`)
    await router.push(newPath)
  } else {
    // Fallback to project root if we can't determine the current structure
    await router.push(`/projects/${project}`)
  }
}

const openAddProjectModal = () => {
  showAddProjectModal.value = true
  isOpen.value = false
}

const deleteProjectConfirm = (project: string) => {
  projectsStore.deleteProject(project)
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>