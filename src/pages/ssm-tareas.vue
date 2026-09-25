<template>
  <div class="tasks-page">
    <div class="tasks-toolbar">
      <div class="tasks-toolbar-left">
        <v-switch
          v-model="onlyMine"
          color="#1a1a1a"
          density="compact"
          hide-details
          label="Solo mis tareas"
          @update:model-value="loadTasks"
        />
      </div>

      <div class="tasks-toolbar-right">
        <v-btn v-if="canCreateProject" prepend-icon="mdi-folder-plus-outline" variant="outlined" @click="showNewProject = true">
          Nuevo proyecto
        </v-btn>

        <v-btn
          v-if="canCreate"
          color="#1a1a1a"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="showNewTask = true"
        >
          Nueva tarea
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" rounded="xl" type="error" variant="tonal">{{ error }}</v-alert>

    <section class="projects-rail">
      <button
        class="project-card project-card-all"
        :class="{ 'project-card-active': activeProjectId === null }"
        type="button"
        @click="selectProject(null)"
      >
        <v-icon icon="mdi-view-dashboard-outline" size="18" />
        <span class="project-name">Todas las tareas</span>
      </button>

      <article
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        :class="{ 'project-card-active': activeProjectId === project.id }"
        @click="selectProject(project.id)"
      >
        <div class="project-card-head">
          <v-icon icon="mdi-folder-outline" size="18" />
          <span class="project-name">{{ project.name }}</span>
          <v-chip size="x-small" variant="tonal">{{ project.tasks_count ?? 0 }}</v-chip>
        </div>

        <p v-if="project.description" class="project-description">{{ project.description }}</p>

        <v-btn
          v-if="canDeleteProject"
          density="comfortable"
          icon="mdi-trash-can-outline"
          size="x-small"
          title="Eliminar proyecto"
          variant="text"
          @click.stop="askRemoveProject(project)"
        />
      </article>

      <p v-if="projects.length === 0" class="projects-empty">
        Aún no hay proyectos. Crea uno para agrupar las tareas del equipo.
      </p>
    </section>

    <div class="tasks-board">
      <div
        v-for="column in TASK_COLUMNS"
        :key="column.status"
        class="tasks-column"
        @dragover.prevent
        @drop.prevent="onDrop(column.status, $event)"
      >
        <div class="tasks-column-header" :style="{ borderTopColor: column.color }">
          <span>{{ column.title }}</span>
          <v-chip size="x-small" variant="tonal">{{ tasksByStatus[column.status].length }}</v-chip>
        </div>

        <div class="tasks-column-body">
          <v-card
            v-for="task in tasksByStatus[column.status]"
            :key="task.id"
            class="task-card"
            draggable="true"
            rounded="lg"
            @click="openDetail(task)"
            @dragstart="onDragStart(task, $event)"
          >
            <v-card-text class="task-card-body">
              <p class="task-title">{{ task.title }}</p>

              <p v-if="task.project" class="task-project">
                <v-icon icon="mdi-folder-outline" size="12" /> {{ task.project.name }}
              </p>

              <p v-if="task.deal_title" class="task-project">
                <v-icon icon="mdi-handshake-outline" size="12" /> {{ task.deal_title }}
              </p>

              <div class="task-meta">
                <span>{{ task.assignee?.name ?? 'Sin asignar' }}</span>
                <span v-if="task.due_date">vence {{ task.due_date }}</span>
              </div>

              <div class="task-actions" @click.stop>
                <v-chip
                  v-if="task.comments_count"
                  prepend-icon="mdi-comment-text-outline"
                  size="x-small"
                  variant="tonal"
                >{{ task.comments_count }}</v-chip>

                <v-btn
                  density="comfortable"
                  icon="mdi-pencil-outline"
                  size="x-small"
                  title="Abrir tarea"
                  variant="text"
                  @click="openDetail(task)"
                />

                <v-btn
                  v-if="canDelete"
                  density="comfortable"
                  icon="mdi-delete-outline"
                  size="x-small"
                  variant="text"
                  @click="removeTask(task.id)"
                />
              </div>
            </v-card-text>
          </v-card>

          <p v-if="tasksByStatus[column.status].length === 0" class="tasks-empty">Arrastra aquí una tarea</p>
        </div>
      </div>
    </div>

    <!-- Nuevo proyecto -->
    <v-dialog v-model="showNewProject" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">Nuevo proyecto</v-card-title>

        <v-card-text class="px-6">
          <v-text-field v-model="projectForm.name" label="Nombre del proyecto *" />
          <v-textarea v-model="projectForm.description" auto-grow label="Descripción" rows="2" />
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showNewProject = false">Cancelar</v-btn>
          <v-btn color="#1a1a1a" :disabled="!projectForm.name" variant="flat" @click="submitProject">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Eliminar proyecto -->
    <v-dialog v-model="showRemoveProject" max-width="460" @after-leave="projectToRemove = null">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">Eliminar proyecto</v-card-title>

        <v-card-text class="px-6">
          Se eliminará «{{ projectToRemove?.name }}» junto con sus
          {{ projectToRemove?.tasks_count ?? 0 }} tarea(s). Esta acción no se puede deshacer.
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showRemoveProject = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="confirmRemoveProject">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <TaskDetailDialog
      v-model="showDetail"
      :assignables="assignables"
      :can-comment="selectedCanComment"
      :can-manage="selectedCanManage"
      :can-reassign="canReassign"
      :task="selectedTask"
      @saved="loadTasks"
    />

    <!-- Nueva tarea -->
    <v-dialog v-model="showNewTask" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">Nueva tarea</v-card-title>

        <v-card-text class="px-6">
          <v-text-field v-model="taskForm.title" label="Título *" />
          <v-textarea v-model="taskForm.description" auto-grow label="Descripción" rows="2" />

          <v-select
            v-model="taskForm.project_id"
            clearable
            item-title="name"
            item-value="id"
            :items="projects"
            label="Proyecto"
          />

          <v-select
            v-model="taskForm.assigned_to"
            clearable
            item-title="name"
            item-value="id"
            :items="assignables"
            label="Asignar a"
          />

          <v-text-field v-model="taskForm.due_date" label="Fecha límite" type="date" />
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showNewTask = false">Cancelar</v-btn>
          <v-btn color="#1a1a1a" :disabled="!taskForm.title" variant="flat" @click="submitTask">Crear tarea</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import type { Project, Task, TaskStatus } from '@/modules/crm/types'
  import { computed, reactive, ref } from 'vue'
  import TaskDetailDialog from '@/modules/crm/components/TaskDetailDialog.vue'
  import { TASK_COLUMNS, useTasksBoard } from '@/modules/crm/useTasksBoard'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  const {
    activeProjectId,
    assignables,
    createProject,
    createTask,
    error,
    loadTasks,
    moveTask,
    onlyMine,
    projects,
    removeProject,
    removeTask,
    selectProject,
    tasks,
    tasksByStatus,
  } = useTasksBoard()

  const showNewProject = ref(false)
  const showNewTask = ref(false)
  const showRemoveProject = ref(false)
  const projectToRemove = ref<Project | null>(null)

  const projectForm = reactive({ name: '', description: '' })
  const taskForm = reactive({
    title: '',
    description: '',
    project_id: null as number | null,
    assigned_to: null as number | null,
    due_date: '',
  })

  const canCreate = computed(() => authStore.isAdmin || authStore.hasPermission('crm.tasks.create'))
  const canDelete = computed(() => authStore.isAdmin || authStore.hasPermission('crm.tasks.delete'))
  const canCreateProject = computed(() => authStore.isAdmin || authStore.hasPermission('crm.projects.create'))
  const canDeleteProject = computed(() => authStore.isAdmin || authStore.hasPermission('crm.projects.delete'))
  const canReassign = computed(() => authStore.isAdmin || authStore.hasPermission('crm.tasks.update'))

  const showDetail = ref(false)
  const selectedTask = ref<Task | null>(null)

  // Agentes gestionan cualquier tarea; el asignado la suya; el creador comenta
  const selectedCanManage = computed(() => {
    const task = selectedTask.value
    if (!task) {
      return false
    }
    return canReassign.value
      || (authStore.hasPermission('crm.tasks.update-own') && task.assignee?.id === authStore.user?.id)
  })

  const selectedCanComment = computed(() =>
    selectedCanManage.value || selectedTask.value?.creator?.id === authStore.user?.id,
  )

  function openDetail (task: Task) {
    selectedTask.value = task
    showDetail.value = true
  }

  function onDragStart (task: Task, event: DragEvent) {
    event.dataTransfer?.setData('text/task-id', String(task.id))
  }

  function onDrop (status: TaskStatus, event: DragEvent) {
    const taskId = Number(event.dataTransfer?.getData('text/task-id'))
    const task = tasks.value.find(item => item.id === taskId)

    if (task && task.status !== status) {
      moveTask(task, status)
    }
  }

  async function submitProject () {
    try {
      await createProject({ name: projectForm.name, description: projectForm.description || null })
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible crear el proyecto'
      return
    }

    showNewProject.value = false
    projectForm.name = ''
    projectForm.description = ''
  }

  function askRemoveProject (project: Project) {
    projectToRemove.value = project
    showRemoveProject.value = true
  }

  async function confirmRemoveProject () {
    const project = projectToRemove.value

    if (!project) {
      return
    }

    try {
      await removeProject(project.id)
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible eliminar el proyecto'
    }

    showRemoveProject.value = false
  }

  async function submitTask () {
    await createTask({
      title: taskForm.title,
      description: taskForm.description || null,
      project_id: taskForm.project_id,
      assigned_to: taskForm.assigned_to,
      due_date: taskForm.due_date || null,
    })
    showNewTask.value = false
    Object.assign(taskForm, { title: '', description: '', project_id: null, assigned_to: null, due_date: '' })
  }
</script>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tasks-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tasks-toolbar-left,
.tasks-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.projects-rail {
  display: flex;
  align-items: stretch;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.project-card {
  position: relative;
  flex: 0 0 auto;
  min-width: 190px;
  max-width: 260px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.project-card:hover {
  border-color: rgba(0, 0, 0, 0.35);
}

.project-card-active {
  border-color: #1a1a1a;
  box-shadow: inset 0 0 0 1px #1a1a1a;
}

.project-card-all {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.project-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 24px;
}

.project-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-description {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.project-card .v-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}

.projects-empty {
  align-self: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.tasks-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-items: start;
}

.tasks-column {
  background: rgba(0, 0, 0, 0.035);
  border-radius: 12px;
}

.tasks-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 4px solid;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 700;
}

.tasks-column-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}

.task-card {
  cursor: grab;
}

.task-card-body {
  padding: 10px 12px;
}

.task-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 4px;
}

.task-project {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  margin: 0 0 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 6px;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

.tasks-empty {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 14px 8px;
  margin: 0;
}

@media (max-width: 960px) {
  .tasks-board {
    grid-template-columns: 1fr;
  }
}
</style>
