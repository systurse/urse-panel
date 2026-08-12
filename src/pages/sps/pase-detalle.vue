<template>
  <div class="pass-detail-page">
    <v-card class="detail-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Pases de salida</div>
          <h2 class="card-title">Detalle del pase #{{ passId }}</h2>
        </div>

        <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="router.push('/sps/pases')">
          Volver al listado
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

        <div v-if="pass.statuses.length === 0" class="text-medium-emphasis">
          Sin histórico disponible.
        </div>

        <v-timeline v-else density="compact" side="end">
          <v-timeline-item v-for="(entry, index) in pass.statuses" :key="index" :dot-color="statusColor(entry.status)" size="small">
            <div class="timeline-status">{{ statusLabel(entry.status) }}</div>
            <div v-if="entry.created_at" class="timeline-date">{{ formatDateTime(entry.created_at) }}</div>
            <div v-if="entry.notes" class="timeline-notes">{{ entry.notes }}</div>
          </v-timeline-item>
        </v-timeline>

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
            v-if="isOwner"
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
              @click="submitStatus('refused')"
            >
              Rechazar
            </v-btn>

            <v-btn
              color="success"
              :disabled="statusSubmitting"
              prepend-icon="mdi-check-decagram"
              variant="flat"
              @click="submitStatus('authorized')"
            >
              Autorizar
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
  import type { AxiosError } from 'axios'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import { httpClient } from '@/services/http'
  import { useAuthStore } from '@/stores/auth'

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
    myEmployeeId.value !== null && pass.value?.employeeId === myEmployeeId.value,
  )

  const canSeeBackupCode = computed(() =>
    authStore.isAdmin || authStore.hasRole('supervisor'),
  )

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
    const currentStatus = statuses.at(-1)?.status ?? fallbackStatus

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

  async function submitStatus (status: 'authorized' | 'refused') {
    if (!pass.value) return

    if (status === 'refused' && !rejectNotes.value.trim()) {
      showSnackbar('Debes escribir una anotación en notas para rechazar el pase.', 'error')
      return
    }

    statusSubmitting.value = true

    try {
      const payload = status === 'authorized'
        ? { status: 'authorized' }
        : { status: 'refused', notes: rejectNotes.value.trim() }

      await httpClient.post(`/api/v1/exit-passes/${passId}/statuses`, payload)
      showSnackbar(
        status === 'authorized' ? 'Pase autorizado correctamente.' : 'Pase rechazado correctamente.',
        'success',
      )
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
