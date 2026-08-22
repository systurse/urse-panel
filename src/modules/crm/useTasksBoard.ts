import type { CrmUser, Project, Task, TaskStatus } from '@/modules/crm/types'
import { computed, onMounted, ref } from 'vue'
import * as crm from '@/modules/crm/service'

export const TASK_COLUMNS: Array<{ status: TaskStatus, title: string, color: string }> = [
  { status: 'pending', title: 'Pendientes', color: '#ff9800' },
  { status: 'in_progress', title: 'En progreso', color: '#2196f3' },
  { status: 'done', title: 'Hechas', color: '#4caf50' },
]

/**
 * Tablero de Tareas y Proyectos del equipo.
 */
export function useTasksBoard () {
  const projects = ref<Project[]>([])
  const tasks = ref<Task[]>([])
  const assignables = ref<CrmUser[]>([])
  const activeProjectId = ref<number | null>(null)
  const onlyMine = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const tasksByStatus = computed<Record<TaskStatus, Task[]>>(() => {
    const groups: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], done: [] }

    for (const task of tasks.value) {
      groups[task.status].push(task)
    }

    return groups
  })

  async function loadTasks () {
    loading.value = true
    error.value = null

    try {
      tasks.value = await crm.listTasks({
        project_id: activeProjectId.value ?? undefined,
        mine: onlyMine.value || undefined,
      })
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar las tareas'
    } finally {
      loading.value = false
    }
  }

  async function load () {
    loading.value = true
    error.value = null

    try {
      const [projectList, assignableList] = await Promise.all([crm.listProjects(), crm.listAssignables()])
      projects.value = projectList
      assignables.value = assignableList
      await loadTasks()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar el tablero de tareas'
    } finally {
      loading.value = false
    }
  }

  async function selectProject (projectId: number | null) {
    activeProjectId.value = projectId
    await loadTasks()
  }

  async function moveTask (task: Task, status: TaskStatus) {
    const previous = task.status
    task.status = status

    try {
      await crm.moveTask(task.id, status)
      await loadTasks()
    } catch (error_: any) {
      task.status = previous
      error.value = error_?.response?.data?.message ?? 'No fue posible mover la tarea'
    }
  }

  async function createProject (payload: { name: string, description?: string | null }) {
    const project = await crm.createProject(payload)
    projects.value = [project, ...projects.value]
    return project
  }

  async function createTask (payload: Parameters<typeof crm.createTask>[0]) {
    const task = await crm.createTask(payload)
    await loadTasks()
    return task
  }

  async function removeTask (taskId: number) {
    await crm.deleteTask(taskId)
    await loadTasks()
  }

  async function removeProject (projectId: number) {
    await crm.deleteProject(projectId)
    projects.value = projects.value.filter(project => project.id !== projectId)

    await (activeProjectId.value === projectId ? selectProject(null) : loadTasks())
  }

  onMounted(load)

  return {
    activeProjectId,
    assignables,
    createProject,
    createTask,
    error,
    load,
    loading,
    loadTasks,
    moveTask,
    onlyMine,
    projects,
    removeProject,
    removeTask,
    selectProject,
    tasks,
    tasksByStatus,
  }
}
