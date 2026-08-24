<template>
  <div class="deal-detail">
    <div class="detail-topbar">
      <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="router.push('/ssm/crm')">Tablero</v-btn>

      <template v-if="deal">
        <v-chip v-if="deal.status !== 'open'" class="ml-2" :color="deal.status === 'won' ? 'success' : 'error'" variant="tonal">
          {{ deal.status_label }} {{ formatDate(deal.closed_at) }}
        </v-chip>

        <v-spacer />

        <v-btn
          v-if="deal.status === 'open' && canClose"
          color="#1a1a1a"
          prepend-icon="mdi-flag-checkered"
          variant="flat"
          @click="showClose = true"
        >Cerrar</v-btn>

        <v-btn
          v-if="canDelete"
          class="ml-2"
          color="error"
          prepend-icon="mdi-delete-outline"
          variant="tonal"
          @click="showDelete = true"
        >Eliminar</v-btn>
      </template>
    </div>

    <v-alert
      v-if="error"
      class="mb-3"
      closable
      rounded="xl"
      type="error"
      variant="tonal"
      @click:close="error = null"
    >{{ error }}</v-alert>

    <v-alert
      v-if="success"
      class="mb-3"
      closable
      rounded="xl"
      type="success"
      variant="tonal"
      @click:close="success = null"
    >{{ success }}</v-alert>

    <div v-if="loading && !deal" class="detail-loading">
      <v-progress-circular indeterminate size="40" />
    </div>

    <div v-else-if="deal" class="detail-grid">
      <!-- Columna izquierda -->
      <div class="detail-left">
        <v-card rounded="xl">
          <v-card-text>
            <h2 class="section-title">General</h2>

            <v-textarea
              v-model="general.description"
              auto-grow
              :disabled="isClosed"
              label="Solicitud o reporte"
              rows="2"
            />

            <v-select
              :disabled="isClosed"
              hide-details
              item-title="name"
              item-value="id"
              :items="stageOptions"
              label="Etapa actual"
              :model-value="deal.stage_id"
              @update:model-value="moveToStage($event as number)"
            />

            <v-text-field
              v-model="general.due_date"
              class="mt-4"
              :disabled="isClosed"
              label="Fecha final"
              type="date"
            />

            <div v-if="deal.contact" class="contact-block">
              <p class="contact-name">
                <v-icon icon="mdi-account-circle-outline" size="18" />
                {{ deal.contact.full_name }}
              </p>

              <p class="contact-line">{{ deal.contact.email ?? 'Sin correo' }}</p>
              <p class="contact-line">{{ deal.contact.faculty ?? '' }} {{ deal.contact.location ? '· ' + deal.contact.location : '' }}</p>

              <div class="contact-actions">
                <v-btn
                  color="success"
                  :disabled="!deal.contact.phone"
                  prepend-icon="mdi-whatsapp"
                  size="small"
                  variant="tonal"
                  @click="openWhatsapp"
                >Mensaje</v-btn>

                <v-btn
                  :disabled="!deal.contact.email"
                  prepend-icon="mdi-email-outline"
                  size="small"
                  variant="tonal"
                  @click="tab = 'mensaje'"
                >Correo</v-btn>
              </div>
            </div>

            <v-btn
              block
              class="mt-4"
              :disabled="isClosed"
              :loading="saving"
              variant="outlined"
              @click="saveGeneral"
            >
              Guardar cambios
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card rounded="xl">
          <v-card-text>
            <h2 class="section-title">Detalles</h2>

            <v-text-field v-model="details.type" :disabled="isClosed" label="Tipo de negociación" />

            <v-select
              v-model="details.channel"
              :disabled="isClosed"
              item-title="label"
              item-value="value"
              :items="channelOptions"
              label="Origen del canal"
            />

            <v-text-field v-model="details.started_at" :disabled="isClosed" label="Fecha de inicio de la negociación" type="date" />

            <v-switch
              v-model="details.visible_to_all"
              color="#1a1a1a"
              :disabled="isClosed"
              hide-details
              label="Disponible para todos los usuarios"
            />

            <v-select
              class="mt-3"
              clearable
              :disabled="!canAssign"
              hide-details
              item-title="name"
              item-value="id"
              :items="assignables"
              label="Responsable"
              :model-value="deal.assignee?.id ?? null"
              @update:model-value="assign(($event as number | null) ?? null)"
            />

            <v-btn
              block
              class="mt-4"
              :disabled="isClosed"
              :loading="saving"
              variant="outlined"
              @click="saveDetails"
            >
              Guardar detalles
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card rounded="xl">
          <v-card-text>
            <div class="order-header">
              <h2 class="section-title mb-0">Orden de servicio</h2>

              <v-chip v-if="order" :color="orderStatusColor" size="small" variant="tonal">
                {{ deal.service_order?.status_label ?? 'Sin orden' }}
              </v-chip>
            </div>

            <p v-if="deal.service_order?.folio" class="order-folio">Folio: <strong>{{ deal.service_order.folio }}</strong></p>

            <v-textarea
              v-model="order.solution"
              auto-grow
              :disabled="orderLocked"
              label="Solución"
              rows="2"
            />

            <v-textarea
              v-model="order.diagnosis"
              auto-grow
              :disabled="orderLocked"
              label="Diagnóstico"
              rows="2"
            />

            <v-textarea
              v-model="order.requirements"
              auto-grow
              :disabled="orderLocked"
              label="Requerimientos"
              rows="2"
            />

            <v-text-field v-model="order.service_type" :disabled="orderLocked" label="Tipo de servicio" />
            <v-text-field v-model="order.team_manager" :disabled="orderLocked" label="Responsable de equipo" />

            <p class="order-hint">
              Los campos son opcionales; solo se exigen al generar la orden o solicitar su aprobación.
            </p>

            <div class="order-actions">
              <v-btn
                :disabled="orderLocked"
                :loading="saving"
                size="small"
                variant="outlined"
                @click="saveOrder"
              >
                Guardar borrador
              </v-btn>

              <v-btn
                color="#1a1a1a"
                :disabled="orderLocked"
                :loading="saving"
                size="small"
                variant="flat"
                @click="generateOrder"
              >Generar orden de servicio</v-btn>

              <v-btn
                v-if="deal.service_order && !orderLocked"
                color="primary"
                :loading="saving"
                size="small"
                variant="tonal"
                @click="requestOrderApproval"
              >Solicitar aprobación</v-btn>

              <v-btn
                v-if="deal.service_order?.folio"
                prepend-icon="mdi-file-pdf-box"
                size="small"
                variant="text"
                @click="downloadPdf"
              >PDF</v-btn>

              <v-btn
                v-if="deal.service_order?.signed_pdf_available"
                color="success"
                prepend-icon="mdi-file-check-outline"
                size="small"
                variant="tonal"
                @click="downloadSignedPdf"
              >Firmada</v-btn>
            </div>

            <v-alert
              v-if="latestModification"
              class="mt-3"
              density="compact"
              rounded="lg"
              type="warning"
              variant="tonal"
            >
              <strong>Modificaciones solicitadas:</strong> {{ latestModification.notes }}
            </v-alert>
          </v-card-text>
        </v-card>
      </div>

      <!-- Columna derecha -->
      <div class="detail-right">
        <v-card class="right-card" rounded="xl">
          <v-tabs v-model="tab" color="#1a1a1a" density="comfortable">
            <v-tab value="actividad">Actividad</v-tab>
            <v-tab value="comentarios">Comentarios</v-tab>
            <v-tab value="mensaje">Mensaje</v-tab>
            <v-tab value="tarea">Tarea</v-tab>
          </v-tabs>

          <v-divider />

          <v-card-text class="right-body">
            <!-- Actividad: recordatorios -->
            <template v-if="tab === 'actividad'">
              <form class="inline-form" @submit.prevent="submitReminder">
                <v-textarea v-model="reminderBody" auto-grow label="Recordatorio para comunicarte con el cliente" rows="2" />
                <v-text-field v-model="reminderAt" label="Recordar el" type="datetime-local" />

                <v-btn
                  color="#1a1a1a"
                  :disabled="!reminderBody || !reminderAt"
                  :loading="saving"
                  type="submit"
                  variant="flat"
                >
                  Agregar recordatorio
                </v-btn>
              </form>

              <v-divider class="my-4" />
              <TimelineList empty-text="Sin actividades registradas." :items="timelineFor(['reminder', 'system'])" />
            </template>

            <!-- Comentarios con adjuntos -->
            <template v-else-if="tab === 'comentarios'">
              <form class="inline-form" @submit.prevent="submitComment">
                <v-textarea v-model="commentBody" auto-grow label="Escribe un comentario de la actividad" rows="3" />

                <v-file-input
                  v-model="commentFiles"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  chips
                  density="comfortable"
                  label="Adjuntar pdf, docx, jpg o png"
                  multiple
                  prepend-icon="mdi-paperclip"
                  show-size
                />

                <v-btn
                  color="#1a1a1a"
                  :disabled="!commentBody"
                  :loading="saving"
                  type="submit"
                  variant="flat"
                >
                  Comentar
                </v-btn>
              </form>

              <v-divider class="my-4" />
              <TimelineList empty-text="Sin comentarios." :items="timelineFor(['comment'])" @download="downloadAttachment" />
            </template>

            <!-- Mensaje: correo al contacto -->
            <template v-else-if="tab === 'mensaje'">
              <form class="inline-form" @submit.prevent="submitMessage">
                <v-text-field v-model="messageSubject" label="Asunto" />
                <v-textarea v-model="messageBody" auto-grow label="Mensaje para el contacto" rows="4" />

                <v-btn
                  color="#1a1a1a"
                  :disabled="!messageSubject || !messageBody || !deal.contact?.email"
                  :loading="saving"
                  prepend-icon="mdi-send-outline"
                  type="submit"
                  variant="flat"
                >Enviar correo</v-btn>

                <p v-if="!deal.contact?.email" class="hint-error">El contacto no tiene correo registrado.</p>
              </form>

              <v-divider class="my-4" />
              <TimelineList empty-text="Sin correos enviados." :items="timelineFor(['email'])" />
            </template>

            <!-- Tarea: colaboración entre usuarios -->
            <template v-else>
              <form class="inline-form" @submit.prevent="submitTask">
                <v-text-field v-model="taskTitle" label="Tarea de colaboración" />

                <v-select
                  v-model="taskAssignee"
                  clearable
                  item-title="name"
                  item-value="id"
                  :items="assignables"
                  label="Asignar a"
                />

                <v-text-field v-model="taskDueDate" label="Fecha límite" type="date" />

                <v-btn
                  color="#1a1a1a"
                  :disabled="!taskTitle"
                  :loading="saving"
                  type="submit"
                  variant="flat"
                >
                  Crear tarea
                </v-btn>
              </form>

              <v-divider class="my-4" />

              <v-list v-if="deal.tasks?.length" density="compact">
                <v-list-item
                  v-for="task in deal.tasks"
                  :key="task.id"
                  :subtitle="`${task.assignee?.name ?? 'Sin asignar'}${task.due_date ? ' · vence ' + task.due_date : ''}`"
                  :title="task.title"
                >
                  <template #append>
                    <v-chip :color="task.status === 'done' ? 'success' : (task.status === 'in_progress' ? 'info' : 'warning')" size="x-small" variant="tonal">
                      {{ task.status_label }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>

              <p v-else class="empty-text">Sin tareas ligadas a esta negociación.</p>
            </template>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <CloseDealDialog v-model="showClose" :closing="saving" :error="error" @confirm="confirmClose" />

    <v-dialog v-model="showDelete" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">Eliminar negociación</v-card-title>

        <v-card-text class="px-6">
          Se eliminará la negociación <strong>#{{ deal?.id }}</strong> del tablero. ¿Continuar?
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showDelete = false">Cancelar</v-btn>
          <v-btn color="error" :loading="saving" variant="flat" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import CloseDealDialog from '@/modules/crm/components/CloseDealDialog.vue'
  import TimelineList from '@/modules/crm/components/TimelineList.vue'
  import * as crm from '@/modules/crm/service'
  import { useDealDetail } from '@/modules/crm/useDealDetail'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const dealId = Number(route.params.id)

  const {
    addActivity,
    addTask,
    assign,
    close,
    deal,
    destroy,
    error,
    generateOrder: generateOrderAction,
    load,
    loading,
    moveToStage,
    requestOrderApproval: requestOrderApprovalAction,
    saveServiceOrder,
    saving,
    sendMessage,
    success,
    updateDeal,
  } = useDealDetail(dealId)

  const assignables = ref<Awaited<ReturnType<typeof crm.listAssignables>>>([])
  const stageOptions = ref<Array<{ id: number, name: string }>>([])

  const tab = ref<string>(typeof route.query.tab === 'string' ? route.query.tab : 'actividad')
  const showClose = ref(false)
  const showDelete = ref(false)

  const general = reactive({ description: '', due_date: '' })
  const details = reactive({ type: '', channel: 'manual' as string, started_at: '', visible_to_all: true })
  const order = reactive({ solution: '', diagnosis: '', requirements: '', recommendations: '', service_type: '', team_manager: '' })

  const reminderBody = ref('')
  const reminderAt = ref('')
  const commentBody = ref('')
  const commentFiles = ref<File[]>([])
  const messageSubject = ref('')
  const messageBody = ref('')
  const taskTitle = ref('')
  const taskAssignee = ref<number | null>(null)
  const taskDueDate = ref('')

  const channelOptions = [
    { value: 'contact_form', label: 'Formulario de contacto' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Correo electrónico' },
    { value: 'manual', label: 'Registro manual' },
  ]

  const isClosed = computed(() => deal.value?.status !== 'open')
  const canAssign = computed(() => authStore.isAdmin || authStore.hasPermission('crm.deals.assign'))
  const canClose = computed(() => authStore.isAdmin || authStore.hasPermission('crm.deals.close'))
  const canDelete = computed(() => authStore.isAdmin || authStore.hasPermission('crm.deals.delete'))

  const orderLocked = computed(() => {
    const status = deal.value?.service_order?.status
    return isClosed.value && !status
      ? true
      : status === 'approval_requested' || status === 'signed'
  })

  const orderStatusColor = computed(() => {
    switch (deal.value?.service_order?.status) {
      case 'signed': {
        return 'success'
      }
      case 'approval_requested': {
        return 'info'
      }
      case 'modifications_requested': {
        return 'warning'
      }
      default: {
        return undefined
      }
    }
  })

  const latestModification = computed(() =>
    deal.value?.service_order?.status === 'modifications_requested'
      ? deal.value.service_order.modification_requests?.[0] ?? null
      : null,
  )

  watch(deal, value => {
    if (!value) {
      return
    }

    general.description = value.description ?? ''
    general.due_date = value.due_date ?? ''
    details.type = value.type ?? ''
    details.channel = value.channel
    details.started_at = value.started_at ?? ''
    details.visible_to_all = value.visible_to_all
    order.solution = value.service_order?.solution ?? ''
    order.diagnosis = value.service_order?.diagnosis ?? ''
    order.requirements = value.service_order?.requirements ?? ''
    order.recommendations = value.service_order?.recommendations ?? ''
    order.service_type = value.service_order?.service_type ?? ''
    order.team_manager = value.service_order?.team_manager ?? ''
  }, { immediate: true })

  onMounted(async () => {
    await load()

    try {
      assignables.value = await crm.listAssignables()
      const pipelines = await crm.listPipelines()
      const pipeline = pipelines.find(item => item.id === deal.value?.pipeline_id)
      stageOptions.value = pipeline?.stages ?? []
    } catch {
      // los selects quedan vacíos pero el detalle sigue siendo usable
    }
  })

  function timelineFor (types: string[]) {
    return (deal.value?.activities ?? []).filter(activity => types.includes(activity.type))
  }

  function formatDate (value: string | null | undefined) {
    return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  }

  function openWhatsapp () {
    const phone = deal.value?.contact?.phone?.replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank', 'noopener')
    }
  }

  function saveGeneral () {
    updateDeal({ description: general.description || null, due_date: general.due_date || null })
  }

  function saveDetails () {
    updateDeal({
      type: details.type || null,
      channel: details.channel as never,
      started_at: details.started_at || null,
      visible_to_all: details.visible_to_all,
    })
  }

  function saveOrder () {
    saveServiceOrder({
      solution: order.solution || null,
      diagnosis: order.diagnosis || null,
      requirements: order.requirements || null,
      recommendations: order.recommendations || null,
      service_type: order.service_type || null,
      team_manager: order.team_manager || null,
    })
  }

  async function generateOrder () {
    await saveServiceOrder({
      solution: order.solution || null,
      diagnosis: order.diagnosis || null,
      requirements: order.requirements || null,
      recommendations: order.recommendations || null,
      service_type: order.service_type || null,
      team_manager: order.team_manager || null,
    })
    await generateOrderAction()
  }

  async function requestOrderApproval () {
    await saveServiceOrder({
      solution: order.solution || null,
      diagnosis: order.diagnosis || null,
      requirements: order.requirements || null,
      recommendations: order.recommendations || null,
      service_type: order.service_type || null,
      team_manager: order.team_manager || null,
    })
    await requestOrderApprovalAction()
  }

  async function submitReminder () {
    const created = await addActivity({ type: 'reminder', body: reminderBody.value, remind_at: reminderAt.value })
    if (created) {
      reminderBody.value = ''
      reminderAt.value = ''
    }
  }

  async function submitComment () {
    const created = await addActivity({ type: 'comment', body: commentBody.value, attachments: commentFiles.value })
    if (created) {
      commentBody.value = ''
      commentFiles.value = []
    }
  }

  async function submitMessage () {
    const sent = await sendMessage({ subject: messageSubject.value, body: messageBody.value })
    if (sent) {
      messageSubject.value = ''
      messageBody.value = ''
    }
  }

  async function submitTask () {
    const created = await addTask({
      title: taskTitle.value,
      assigned_to: taskAssignee.value,
      due_date: taskDueDate.value || null,
    })
    if (created) {
      taskTitle.value = ''
      taskAssignee.value = null
      taskDueDate.value = ''
    }
  }

  async function confirmClose (result: 'won' | 'lost', generateServiceOrder: boolean) {
    const closed = await close(result, generateServiceOrder)
    if (closed) {
      showClose.value = false
    }
  }

  async function confirmDelete () {
    const deleted = await destroy()
    if (deleted !== null) {
      router.push('/ssm/crm')
    }
  }

  function triggerBlobDownload (blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPdf () {
    if (deal.value?.service_order) {
      const blob = await crm.downloadOrderPdf(deal.value.service_order.id)
      triggerBlobDownload(blob, `orden-servicio-${deal.value.service_order.folio ?? deal.value.service_order.id}.pdf`)
    }
  }

  async function downloadSignedPdf () {
    if (deal.value?.service_order) {
      const blob = await crm.downloadSignedOrderPdf(deal.value.service_order.id)
      triggerBlobDownload(blob, `orden-servicio-${deal.value.service_order.folio ?? deal.value.service_order.id}-firmada.pdf`)
    }
  }

  async function downloadAttachment (url: string, name: string) {
    const blob = await crm.downloadAttachment(url)
    triggerBlobDownload(blob, name)
  }
</script>

<style scoped>
.deal-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-topbar {
  display: flex;
  align-items: center;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(340px, 420px) 1fr;
  gap: 16px;
  align-items: start;
}

.detail-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.contact-block {
  margin-top: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px;
}

.contact-name {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
}

.contact-line {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0 0 2px;
}

.contact-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.order-folio {
  font-size: 13px;
  margin: 0 0 12px;
}

.order-hint {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  margin: 0 0 10px;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.right-card {
  position: sticky;
  top: 0;
}

.right-body {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.inline-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.inline-form > * {
  width: 100%;
}

.inline-form .v-btn {
  width: auto;
}

.hint-error {
  font-size: 12px;
  color: #c62828;
  margin: 4px 0 0;
}

.empty-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}

@media (max-width: 1100px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
