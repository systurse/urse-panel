<template>
  <div class="pass-detail-page">
    <v-card class="detail-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Pases de salida</div>
          <h2 class="card-title">Detalle del pase #{{ passId }}</h2>
        </div>

        <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="goBackToList">
          {{ backLabel }}
        </v-btn>
      </div>

      <v-alert
        v-if="errorMessage"
        class="mt-4"
        closable
        color="error"
        variant="tonal"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#c89215" indeterminate />
        <span>Cargando pase...</span>
      </div>

      <template v-else-if="pass">
        <div class="detail-meta mt-4">
          <v-chip :color="statusColor(pass.currentStatus)" size="small" variant="tonal">
            {{ statusLabel(pass.currentStatus) }}
          </v-chip>

          <span class="text-body-2 text-medium-emphasis ml-2">
            {{ pass.employeeName }} · #{{ pass.employeeNumber || 'N/A' }}
          </span>
        </div>

        <v-row class="mt-4" dense>
          <v-col cols="12" md="4">
            <span class="label">Fecha de uso</span>
            <div>{{ formatDate(pass.usageDate) }}</div>
          </v-col>

          <v-col cols="12" md="4">
            <span class="label">Motivo</span>
            <div>{{ reasonLabel(pass.reason) }}</div>
          </v-col>

          <v-col cols="12" md="4">
            <span class="label">Jornada laboral</span>
            <div>{{ workScheduleLabel(pass.workSchedule) }}</div>
          </v-col>
        </v-row>

        <div v-if="pass.subject" class="mt-3">
          <span class="label">Asunto</span>
          <p class="mb-0">{{ pass.subject }}</p>
        </div>

        <v-divider class="my-4" />

        <div class="text-subtitle-2 font-weight-bold mb-3">Histórico de estatus</div>

        <div v-if="timeline.length === 0" class="text-medium-emphasis">
          Sin histórico disponible.
        </div>

        <v-timeline v-else density="compact" side="end">
          <v-timeline-item
            v-for="(entry, index) in timeline"
            :key="index"
            :dot-color="entry.color"
            :icon="entry.icon"
            size="small"
          >
            <div class="timeline-status">{{ entry.title }}</div>
            <div v-if="entry.at" class="timeline-date">{{ formatDateTime(entry.at) }}</div>
            <div v-if="entry.detail" class="timeline-notes">{{ entry.detail }}</div>
          </v-timeline-item>
        </v-timeline>

        <v-divider class="my-4" />

        <SignaturePanel
          :document-id="passId"
          :is-owner="isOwner"
          resource="exit-passes"
          @loaded="signatures = $event"
          @signed="loadPass"
        />

        <div v-if="canSendToRevision" class="revision-block">
          <div class="text-body-2">
            <template v-if="employeeSigned">
              El pase ya lleva tu firma. Envíalo a tu jefe inmediato para que lo firme y quede
              autorizado.
            </template>

            <template v-else>
              Firma el pase arriba como empleado; después podrás enviarlo a tu jefe inmediato.
            </template>
          </div>

          <v-btn
            class="mt-3"
            color="primary"
            :disabled="!employeeSigned"
            :loading="revisionSubmitting"
            prepend-icon="mdi-send-outline"
            variant="flat"
            @click="sendToRevision"
          >
            Enviar a revisión
          </v-btn>
        </div>

        <v-divider class="my-4" />

        <div class="actions-row">
          <v-btn
            :loading="pdfLoading"
            prepend-icon="mdi-printer-outline"
            variant="text"
            @click="downloadPdf"
          >
            Descargar PDF
          </v-btn>

          <v-btn
            v-if="isOwner && pass.currentStatus === 'authorized'"
            color="primary"
            prepend-icon="mdi-login-variant"
            :to="`/sps/pases/${passId}/regreso`"
            variant="text"
          >
            Confirmar regreso
          </v-btn>

          <v-btn
            v-if="canSeeBackupCode"
            color="secondary"
            prepend-icon="mdi-key-outline"
            :to="`/sps/pases/${passId}/codigo`"
            variant="text"
          >
            Código de regreso
          </v-btn>
        </div>

        <div v-if="canReview" class="review-block mt-4">
          <div class="text-subtitle-2 font-weight-bold mb-2">
            Resolución
          </div>

          <p class="text-body-2 text-medium-emphasis mb-3">
            El pase se autoriza al firmarlo como jefe inmediato, arriba. Este bloque solo sirve
            para rechazarlo.
          </p>

          <v-textarea
            v-model="rejectNotes"
            density="comfortable"
            hint="Obligatorio al rechazar el pase."
            label="Notas (rechazo)"
            persistent-hint
            rows="3"
            variant="outlined"
          />

          <div class="actions-row mt-2">
            <v-btn
              color="error"
              :disabled="statusSubmitting"
              prepend-icon="mdi-close-circle-outline"
              variant="tonal"
              @click="refusePass"
            >
              Rechazar
            </v-btn>

          </div>
        </div>
      </template>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top" :timeout="3500">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { DocumentSignature } from '@/modules/signatures/port'
  import type { AxiosError } from 'axios'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import SignaturePanel from '@/modules/sps/components/SignaturePanel.vue'
  import { httpClient } from '@/services/http'
  import { useAuthStore } from '@/stores/auth'
  import { isSameId } from '@/utils/identity'

  interface StatusEntry {
    status: string
    notes: string
    created_at: string
  }

  interface ExitPassDetail {
    id: number | string
    employeeId: number | string | null
    employeeName: string
    employeeNumber: string
    usageDate: string
    workSchedule: string
    reason: string
    subject: string
    currentStatus: string
    statuses: StatusEntry[]
  }

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const passId = String(route.params.id)

  // Supervisors reach this screen from their own list, and used to be dropped
  // into the employee's one on the way back. The origin travels in the query so
  // the destination does not have to be guessed from roles.
  const cameFromAdminList = computed(() => route.query.from === 'admin')

  const backLabel = computed(() =>
    cameFromAdminList.value ? 'Volver a pases de salida' : 'Volver al listado',
  )

  function goBackToList () {
    void router.push(cameFromAdminList.value ? '/sps/administracion/pases-salida' : '/sps/pases')
  }

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const pass = ref<ExitPassDetail | null>(null)
  const myEmployeeId = ref<number | string | null>(null)

  const pdfLoading = ref(false)
  const rejectNotes = ref('')
  const statusSubmitting = ref(false)

  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref<'success' | 'error' | 'info'>('success')

  const isOwner = computed(() =>
    isSameId(pass.value?.employeeId, myEmployeeId.value),
  )

  const canSeeBackupCode = computed(() =>
    authStore.isAdmin || authStore.hasRole('supervisor'),
  )

  const signatures = ref<DocumentSignature[]>([])

  const ROLE_LABELS: Record<string, string> = {
    administrative_director: 'Dirección de Asuntos Administrativos',
    employee: 'Empleado',
    immediate_supervisor: 'Jefe inmediato',
  }

  interface TimelineEntry {
    at: string
    color: string
    detail: string
    icon: string
    title: string
  }

  // Status changes alone read as a near-empty history, because most of what
  // happens to a pass now is signatures. Both are shown on one line, ordered by
  // when they happened; entries without a date keep their original order at the
  // front, since that is the sequence the API returned them in.
  const timeline = computed<TimelineEntry[]>(() => {
    const statusEntries: TimelineEntry[] = (pass.value?.statuses ?? []).map(entry => ({
      at: entry.created_at,
      color: statusColor(entry.status),
      detail: entry.notes,
      icon: '',
      title: statusLabel(entry.status),
    }))

    const signatureEntries: TimelineEntry[] = signatures.value.map(signature => ({
      at: signature.signedAt,
      color: 'success',
      detail: `Firmado por ${signature.signerName}`,
      icon: 'mdi-draw-pen',
      title: `Firma · ${signature.roleLabel || ROLE_LABELS[signature.role] || signature.role}`,
    }))

    // Sorting in place is safe here: the array was just built by the spread,
    // and sort is stable, so entries sharing a timestamp keep the order they
    // came in. `toSorted` is not available at this project's TS lib level.
    // eslint-disable-next-line unicorn/no-array-sort
    return [...statusEntries, ...signatureEntries].sort((a, b) => {
      const timeA = Date.parse(a.at)
      const timeB = Date.parse(b.at)

      if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0
      if (Number.isNaN(timeA)) return -1
      if (Number.isNaN(timeB)) return 1

      return timeA - timeB
    })
  })

  const revisionSubmitting = ref(false)

  const employeeSigned = computed(() =>
    signatures.value.some(signature => signature.role === 'employee'),
  )

  // Only the requester moves their own pass forward, and only while it is still
  // waiting to be sent.
  const canSendToRevision = computed(() =>
    isOwner.value && pass.value?.currentStatus === 'pending',
  )

  async function sendToRevision () {
    revisionSubmitting.value = true
    errorMessage.value = null

    try {
      await httpClient.post(`/api/v1/exit-passes/${passId}/statuses`, { status: 'revision' })
      showSnackbar('Pase enviado a tu jefe inmediato.', 'success')
      await loadPass()
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible enviar el pase a revisión.')
    } finally {
      revisionSubmitting.value = false
    }
  }

  const canReview = computed(() =>
    authStore.isAdmin && pass.value?.currentStatus === 'revision',
  )

  function resolveMessage (error: unknown, fallback: string) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
  }

  function readString (source: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = source[key]
      if (typeof value === 'string' && value.trim().length > 0) {
        return value
      }
    }
    return ''
  }

  function readId (source: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = source[key]
      if (typeof value === 'number' || typeof value === 'string') {
        return value
      }
    }
    return null
  }

  function mapStatusEntry (entry: unknown): StatusEntry | null {
    if (typeof entry === 'string') {
      return entry ? { created_at: '', notes: '', status: entry.toLowerCase() } : null
    }

    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>
      const status = readString(record, 'status', 'name', 'value').toLowerCase()
      if (!status) return null
      return {
        created_at: readString(record, 'created_at', 'date'),
        notes: readString(record, 'notes'),
        status,
      }
    }

    return null
  }

  function mapExitPass (rawItem: unknown): ExitPassDetail {
    const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>
    const employee = (item.employee && typeof item.employee === 'object' ? item.employee : {}) as Record<string, unknown>
    const statuses = Array.isArray(item.statuses)
      ? item.statuses.map(entry => mapStatusEntry(entry)).filter((entry): entry is StatusEntry => entry !== null)
      : []
    const fallbackStatus = readString(item, 'status').toLowerCase()
    // The backend creates a pass without a status row, so an empty history
    // means it was just captured. Reading that as blank hid every action
    // that waits on a pending pass.
    const currentStatus = statuses.at(-1)?.status || fallbackStatus || 'pending'

    return {
      currentStatus,
      employeeId: readId(item, 'employee_id') ?? readId(employee, 'id'),
      employeeName: readString(employee, 'full_name', 'name')
        || `${readString(employee, 'first_name')} ${readString(employee, 'last_name')}`.trim()
        || 'Sin nombre',
      employeeNumber: readString(employee, 'employee_number'),
      id: readId(item, 'id') ?? passId,
      reason: readString(item, 'reason'),
      statuses,
      subject: readString(item, 'subject'),
      usageDate: readString(item, 'usage_date', 'date'),
      workSchedule: readString(item, 'work_schedule'),
    }
  }

  function unwrapSingle (response: unknown): Record<string, unknown> {
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data?: unknown }).data
      return data && typeof data === 'object' ? data as Record<string, unknown> : {}
    }
    return response && typeof response === 'object' ? response as Record<string, unknown> : {}
  }

  function formatDate (value: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('es-MX')
  }

  function formatDateTime (value: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('es-MX')
  }

  function humanizeEnum (value: string) {
    if (!value) return '—'
    return value.replaceAll('_', ' ')
  }

  function statusLabel (status: string) {
    if (status === 'pending') return 'Pendiente'
    if (status === 'revision') return 'En revisión'
    if (status === 'authorized') return 'Autorizado'
    if (status === 'refused') return 'Rechazado'
    if (status === 'returned') return 'Regresó'
    return humanizeEnum(status)
  }

  function statusColor (status: string) {
    if (status === 'pending') return 'warning'
    if (status === 'revision') return 'info'
    if (status === 'authorized') return 'success'
    if (status === 'refused') return 'error'
    if (status === 'returned') return 'primary'
    return 'default'
  }

  function reasonLabel (reason: string) {
    if (reason === 'personal') return 'Personal'
    if (reason === 'employee_imss_medical_visit') return 'Cita médica IMSS'
    if (reason === 'official') return 'Oficial'
    return humanizeEnum(reason)
  }

  function workScheduleLabel (value: string) {
    if (value === 'continuous') return 'Jornada continua'
    if (value === 'split') return 'Jornada partida'
    return humanizeEnum(value)
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  async function loadPass () {
    loading.value = true
    errorMessage.value = null

    try {
      const response = await httpClient.get<unknown>(`/api/v1/exit-passes/${passId}`)
      pass.value = mapExitPass(unwrapSingle(response))
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible cargar el pase.')
    } finally {
      loading.value = false
    }
  }

  async function loadMyEmployee () {
    const userId = authStore.user?.id
    if (!userId) return

    try {
      const employee = await employeesAdapter.getByUserId(userId)
      myEmployeeId.value = employee?.id ?? null
    } catch {
      myEmployeeId.value = null
    }
  }

  async function downloadPdf () {
    pdfLoading.value = true

    try {
      const response = await httpClient.get<Blob>(`/api/v1/exit-passes/${passId}/pdf`, {
        responseType: 'blob',
      })
      const fileUrl = URL.createObjectURL(response as unknown as Blob)
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000)
    } catch (error) {
      showSnackbar(resolveMessage(error, 'No fue posible generar el PDF del pase.'), 'error')
    } finally {
      pdfLoading.value = false
    }
  }

  async function refusePass () {
    if (!pass.value) return

    if (!rejectNotes.value.trim()) {
      showSnackbar('Debes escribir una anotación en notas para rechazar el pase.', 'error')
      return
    }

    statusSubmitting.value = true

    try {
      await httpClient.post(`/api/v1/exit-passes/${passId}/statuses`, {
        notes: rejectNotes.value.trim(),
        status: 'refused',
      })
      showSnackbar('Pase rechazado correctamente.', 'success')
      rejectNotes.value = ''
      await loadPass()
    } catch (error) {
      showSnackbar(resolveMessage(error, 'No fue posible actualizar el estatus del pase.'), 'error')
    } finally {
      statusSubmitting.value = false
    }
  }

  onMounted(() => {
    void loadPass()
    void loadMyEmployee()
  })
</script>

<style scoped>
.pass-detail-page {
  display: grid;
}

.detail-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.section-kicker {
  color: #c89215;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 8px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #000000;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  color: #5e5e5e;
}

.label {
  font-size: 0.8rem;
  color: #6f5a60;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.timeline-status {
  font-weight: 700;
  color: #000000;
}

.timeline-date {
  color: #5e5e5e;
  font-size: 0.85rem;
}

.timeline-notes {
  color: #5e5e5e;
  font-size: 0.9rem;
  margin-top: 2px;
}

.revision-block {
  padding: 16px;
  border-radius: 12px;
  background: rgb(30 58 95 / 0.06);
}

.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-block {
  border-radius: 12px;
  background: rgb(250 178 26 / 0.06);
  padding: 12px;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
