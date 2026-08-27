<template>
  <v-dialog v-model="open" max-width="640">
    <v-card v-if="task" rounded="xl">
      <v-card-title class="pt-5 px-6 d-flex align-center">
        Tarea #{{ task.id }}
        <v-chip class="ml-3" :color="statusColor" size="small" variant="tonal">{{ task.status_label }}</v-chip>
        <v-spacer />
        <span v-if="task.project" class="task-context"><v-icon icon="mdi-folder-outline" size="14" /> {{ task.project.name }}</span>
      </v-card-title>

      <v-card-text class="px-6 task-dialog-body">
        <v-alert
          v-if="error"
          class="mb-3"
          closable
          density="compact"
          rounded="lg"
          type="error"
          variant="tonal"
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Edición: agentes cualquier tarea; el asignado la suya -->
        <template v-if="canManage">
          <v-text-field v-model="form.title" label="Título" />
          <v-textarea v-model="form.description" auto-grow label="Descripción" rows="2" />

          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="form.status"
                item-title="label"
                item-value="value"
                :items="statusOptions"
                label="Estado"
              />
            </v-col>

            <v-col cols="6">
              <v-text-field v-model="form.due_date" label="Fecha límite" type="date" />
            </v-col>

            <v-col v-if="canReassign" cols="12">
              <v-select
                v-model="form.assigned_to"
                clearable
                item-title="name"
                item-value="id"
                :items="assignables"
                label="Asignada a"
              />
            </v-col>
          </v-row>

          <v-btn color="#1a1a1a" :loading="saving" variant="flat" @click="save">Guardar tarea</v-btn>
        </template>

        <template v-else>
          <p class="task-title-ro">{{ task.title }}</p>
          <p v-if="task.description" class="task-desc-ro">{{ task.description }}</p>

          <p class="task-meta-ro">
            {{ task.assignee?.name ?? 'Sin asignar' }}{{ task.due_date ? ' · vence ' + task.due_date : '' }}
          </p>
        </template>

        <v-divider class="my-4" />

        <h3 class="comments-title">Comentarios y evidencias</h3>

        <form v-if="canComment" class="comment-form" @submit.prevent="submitComment">
          <v-textarea v-model="commentBody" auto-grow label="Escribe un comentario de avance" rows="2" />

          <v-file-input
            v-model="commentFiles"
            accept=".pdf,.jpg,.jpeg,.png"
            chips
            density="comfortable"
            label="Adjuntar evidencias (pdf, imágenes)"
            multiple
            prepend-icon="mdi-paperclip"
            show-size
          />

          <v-btn
            color="#1a1a1a"
            :disabled="!commentBody"
            :loading="commenting"
            type="submit"
            variant="flat"
          >
            Comentar
          </v-btn>
        </form>

        <div v-if="loadingComments" class="comments-loading">
          <v-progress-circular indeterminate size="24" />
        </div>

        <div v-else-if="comments.length > 0" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-head">
              <span class="comment-user">{{ comment.user?.name ?? 'Usuario' }}</span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>

            <p class="comment-body">{{ comment.body }}</p>

            <div v-if="comment.attachments?.length" class="comment-attachments">
              <v-chip
                v-for="attachment in comment.attachments"
                :key="attachment.id"
                :prepend-icon="attachment.mime_type?.includes('pdf') ? 'mdi-file-pdf-box' : 'mdi-image-outline'"
                size="small"
                variant="outlined"
                @click="download(attachment.download_url, attachment.original_name)"
              >{{ attachment.original_name }}</v-chip>
            </div>
          </div>
        </div>

        <p v-else class="comments-empty">Sin comentarios todavía.</p>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { CrmUser, Task, TaskComment, TaskStatus } from '@/modules/crm/types'
  import { computed, reactive, ref, watch } from 'vue'
  import * as crm from '@/modules/crm/service'

  const props = defineProps<{
    task: Task | null
    assignables: CrmUser[]
    canManage: boolean
    canReassign: boolean
    canComment: boolean
  }>()

  const emit = defineEmits<{ saved: [] }>()

  const open = defineModel<boolean>({ default: false })

  const statusOptions: Array<{ value: TaskStatus, label: string }> = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'done', label: 'Hecha' },
  ]

  const form = reactive({
    title: '',
    description: '',
    status: 'pending' as TaskStatus,
    due_date: '',
    assigned_to: null as number | null,
  })

  const saving = ref(false)
  const commenting = ref(false)
  const loadingComments = ref(false)
  const error = ref<string | null>(null)
  const comments = ref<TaskComment[]>([])
  const commentBody = ref('')
  const commentFiles = ref<File[]>([])

  const statusColor = computed(() =>
    props.task?.status === 'done' ? 'success' : (props.task?.status === 'in_progress' ? 'info' : 'warning'),
  )

  watch([open, () => props.task?.id], async ([isOpen]) => {
    if (!isOpen || !props.task) {
      return
    }

    form.title = props.task.title
    form.description = props.task.description ?? ''
    form.status = props.task.status
    form.due_date = props.task.due_date ?? ''
    form.assigned_to = props.task.assignee?.id ?? null
    error.value = null
    commentBody.value = ''
    commentFiles.value = []

    loadingComments.value = true
    try {
      comments.value = await crm.listTaskComments(props.task.id)
    } catch {
      comments.value = []
    } finally {
      loadingComments.value = false
    }
  })

  function extractError (error_: any, fallback: string) {
    const data = error_?.response?.data
    const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
    return validation ?? data?.message ?? fallback
  }

  async function save () {
    if (!props.task) {
      return
    }

    saving.value = true
    error.value = null

    try {
      await crm.updateTask(props.task.id, {
        title: form.title,
        description: form.description || null,
        status: form.status,
        due_date: form.due_date || null,
        ...(props.canReassign ? { assigned_to: form.assigned_to } : {}),
      })
      emit('saved')
      open.value = false
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible guardar la tarea')
    } finally {
      saving.value = false
    }
  }

  async function submitComment () {
    if (!props.task) {
      return
    }

    commenting.value = true
    error.value = null

    try {
      const comment = await crm.createTaskComment(props.task.id, {
        body: commentBody.value,
        attachments: commentFiles.value,
      })
      comments.value = [comment, ...comments.value]
      commentBody.value = ''
      commentFiles.value = []
      emit('saved')
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible registrar el comentario')
    } finally {
      commenting.value = false
    }
  }

  async function download (url: string, name: string) {
    const blob = await crm.downloadAttachment(url)
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  }

  function formatDate (value: string) {
    return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
</script>

<style scoped>
.task-dialog-body {
  max-height: 70vh;
  overflow-y: auto;
}

.task-context {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.task-title-ro {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 6px;
}

.task-desc-ro {
  font-size: 13px;
  margin: 0 0 6px;
  white-space: pre-wrap;
}

.task-meta-ro {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin: 0;
}

.comments-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.comment-form > * {
  width: 100%;
}

.comment-form .v-btn {
  width: auto;
}

.comments-loading {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
  padding-bottom: 10px;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.comment-user {
  font-size: 12px;
  font-weight: 700;
}

.comment-date {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
}

.comment-body {
  font-size: 13px;
  margin: 4px 0 0;
  white-space: pre-wrap;
}

.comment-attachments {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.comments-empty {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}
</style>
