<template>
  <div class="admin-passes-page">
    <v-card class="admin-passes-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Administración</div>
          <h2 class="card-title">Pases de salida</h2>
          <p class="card-subtitle">
            Consulta todos los pases y autoriza o rechaza los que estén en revisión.
          </p>
        </div>
        <v-btn
          color="#FAB21A"
          :loading="loading"
          prepend-icon="mdi-refresh"
          variant="flat"
          @click="loadExitPasses"
        >
          Actualizar
        </v-btn>
      </div>

      <v-alert
        v-if="errorMessage"
        class="mt-6"
        closable
        color="error"
        variant="tonal"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#FAB21A" indeterminate />
        <span>Cargando pases...</span>
      </div>

      <div v-else class="table-wrap mt-6">
        <table class="pass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>No. empleado</th>
              <th>Fecha uso</th>
              <th>Motivo</th>
              <th>Estatus</th>
              <th class="th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pass in exitPasses" :key="String(pass.id)">
              <td>{{ pass.id }}</td>
              <td>{{ pass.employeeName }}</td>
              <td>{{ pass.employeeNumber || '—' }}</td>
              <td>{{ formatDate(pass.usageDate) }}</td>
              <td>{{ reasonLabel(pass.reason) }}</td>
              <td>
                <v-chip :color="statusColor(pass.currentStatus)" size="small" variant="tonal">
                  {{ statusLabel(pass.currentStatus) }}
                </v-chip>
              </td>
              <td class="td-actions">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="openDetail(pass)"
                >
                  Ver detalle
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="exitPasses.length === 0" class="empty-hint">
          No hay pases registrados.
        </div>
      </div>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="920" scrollable>
      <v-card :loading="statusSubmitting">
        <v-card-title class="pt-6 pb-2">
          Detalle del pase #{{ selectedPass?.id }}
        </v-card-title>

        <v-card-text v-if="selectedPass">
          <div class="detail-meta mb-4">
            <v-chip :color="statusColor(selectedPass.currentStatus)" size="small" variant="tonal">
              {{ statusLabel(selectedPass.currentStatus) }}
            </v-chip>
            <span class="text-body-2 text-medium-emphasis ml-2">
              {{ selectedPass.employeeName }} · #{{ selectedPass.employeeNumber || 'N/A' }}
            </span>
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Fecha de uso"
                :model-value="selectedPass.usageDate"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Jornada laboral"
                :model-value="workScheduleLabel(selectedPass.workSchedule)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Entrada"
                :model-value="formatTimeDisplay(selectedPass.shiftStart)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Salida"
                :model-value="formatTimeDisplay(selectedPass.shiftEnd)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Inicio turno vespertino"
                :model-value="formatTimeDisplay(selectedPass.afternoonShiftStart)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Fin turno vespertino"
                :model-value="formatTimeDisplay(selectedPass.afternoonShiftEnd)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Motivo"
                :model-value="reasonLabel(selectedPass.reason)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Momento en horario"
                :model-value="scheduleTimingLabel(selectedPass.scheduleTiming)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                auto-grow
                density="comfortable"
                label="Asunto / descripción"
                :model-value="selectedPass.subject || '—'"
                readonly
                rows="2"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Salida dentro horario"
                :model-value="formatTimeDisplay(selectedPass.withinScheduleExitAt)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Regreso dentro horario"
                :model-value="formatTimeDisplay(selectedPass.withinScheduleReturnAt)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Duración dentro horario"
                :model-value="selectedPass.withinScheduleDuration || '—'"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Entrada antes del horario"
                :model-value="formatTimeDisplay(selectedPass.beforeScheduleEntryAt)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Salida antes del horario"
                :model-value="formatTimeDisplay(selectedPass.beforeScheduleExitAt)"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Duración antes del horario"
                :model-value="selectedPass.beforeScheduleDuration || '—'"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Jefe inmediato"
                :model-value="selectedPass.supervisorName"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Dirección administrativa"
                :model-value="selectedPass.directorName"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col v-if="selectedPass.notes" cols="12">
              <v-textarea
                auto-grow
                density="comfortable"
                label="Notas"
                :model-value="selectedPass.notes"
                readonly
                rows="2"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div v-if="canReviewPass" class="review-block mt-4">
            <v-divider class="mb-4" />
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
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="closeDetail">
            Cerrar
          </v-btn>
          <v-spacer />
          <template v-if="canReviewPass">
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
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top"
      :timeout="3500"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { AxiosError } from 'axios'
  import { computed, onMounted, ref } from 'vue'
  import { httpClient } from '@/services/http'

  interface ExitPassItem {
    id: number | string
    employeeId: number | string | null
    employeeName: string
    employeeNumber: string
    usageDate: string
    workSchedule: string
    shiftStart: string
    shiftEnd: string
    afternoonShiftStart: string
    afternoonShiftEnd: string
    reason: string
    subject: string
    scheduleTiming: string
    withinScheduleExitAt: string
    withinScheduleReturnAt: string
    withinScheduleDuration: string
    beforeScheduleEntryAt: string
    beforeScheduleExitAt: string
    beforeScheduleDuration: string
    supervisorName: string
    supervisorSignature: string
    directorName: string
    directorSignature: string
    employeeSignature: string
    notes: string
    currentStatus: string
    statuses: string[]
  }

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const exitPasses = ref<ExitPassItem[]>([])

  const detailDialog = ref(false)
  const selectedPass = ref<ExitPassItem | null>(null)
  const rejectNotes = ref('')
  const statusSubmitting = ref(false)

  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref<'success' | 'error' | 'info'>('success')

  const canReviewPass = computed(() => selectedPass.value?.currentStatus === 'revision')

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

  function mapStatusValue (statusEntry: unknown): string {
    if (typeof statusEntry === 'string') {
      return statusEntry.toLowerCase()
    }

    if (statusEntry && typeof statusEntry === 'object') {
      const record = statusEntry as Record<string, unknown>
      const rawStatus = record.status ?? record.name ?? record.value
      if (typeof rawStatus === 'string' && rawStatus.trim().length > 0) {
        return rawStatus.toLowerCase()
      }
    }

    return ''
  }

  function getStatuses (item: Record<string, unknown>) {
    const source = item.statuses
    if (!Array.isArray(source)) return []

    return source
      .map(statusEntry => mapStatusValue(statusEntry))
      .filter(status => status.length > 0)
  }

  function mapExitPass (rawItem: unknown): ExitPassItem {
    const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>
    const employee = (item.employee && typeof item.employee === 'object' ? item.employee : {}) as Record<string, unknown>
    const statuses = getStatuses(item)
    const fallbackStatus = readString(item, 'status').toLowerCase()
    const currentStatus = statuses.at(-1) ?? fallbackStatus ?? ''

    return {
      id: readId(item, 'id') ?? crypto.randomUUID(),
      employeeId: readId(item, 'employee_id') ?? readId(employee, 'id'),
      employeeName: readString(employee, 'full_name', 'name')
        || `${readString(employee, 'first_name')} ${readString(employee, 'last_name')}`.trim()
        || 'Sin nombre',
      employeeNumber: readString(employee, 'employee_number'),
      usageDate: readString(item, 'usage_date', 'date'),
      workSchedule: readString(item, 'work_schedule'),
      shiftStart: readString(item, 'shift_start'),
      shiftEnd: readString(item, 'shift_end'),
      afternoonShiftStart: readString(item, 'afternoon_shift_start'),
      afternoonShiftEnd: readString(item, 'afternoon_shift_end'),
      reason: readString(item, 'reason'),
      subject: readString(item, 'subject'),
      scheduleTiming: readString(item, 'schedule_timing'),
      withinScheduleExitAt: readString(item, 'within_schedule_exit_at'),
      withinScheduleReturnAt: readString(item, 'within_schedule_return_at'),
      withinScheduleDuration: readString(item, 'within_schedule_duration'),
      beforeScheduleEntryAt: readString(item, 'before_schedule_entry_at'),
      beforeScheduleExitAt: readString(item, 'before_schedule_exit_at'),
      beforeScheduleDuration: readString(item, 'before_schedule_duration'),
      supervisorName: readString(item, 'immediate_supervisor_name'),
      supervisorSignature: readString(item, 'immediate_supervisor_signature'),
      directorName: readString(item, 'administrative_director_name'),
      directorSignature: readString(item, 'administrative_director_signature'),
      employeeSignature: readString(item, 'employee_signature'),
      notes: readString(item, 'notes'),
      currentStatus,
      statuses,
    }
  }

  function parseCollection (response: unknown) {
    const source = Array.isArray(response)
      ? response
      : (response && typeof response === 'object' && 'data' in response
        ? (response as { data?: unknown }).data
        : [])

    if (!Array.isArray(source)) {
      return []
    }

    return source.map(item => mapExitPass(item))
  }

  function formatDate (value: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('es-MX')
  }

  function formatTimeDisplay (value: string) {
    if (!value) return '—'
    return value.length >= 5 ? value.slice(0, 5) : value
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
    return humanizeEnum(status)
  }

  function statusColor (status: string) {
    if (status === 'pending') return 'warning'
    if (status === 'revision') return 'info'
    if (status === 'authorized') return 'success'
    if (status === 'refused') return 'error'
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

  function scheduleTimingLabel (value: string) {
    if (value === 'within_schedule') return 'Dentro del horario'
    if (value === 'before_schedule') return 'Antes del horario'
    return humanizeEnum(value)
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  async function loadExitPasses () {
    loading.value = true
    errorMessage.value = null

    try {
      const response = await httpClient.get<unknown>('/api/v1/exit-passes')
      exitPasses.value = parseCollection(response)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible cargar los pases.')
    } finally {
      loading.value = false
    }
  }

  function openDetail (pass: ExitPassItem) {
    selectedPass.value = pass
    rejectNotes.value = ''
    detailDialog.value = true
  }

  function closeDetail () {
    detailDialog.value = false
    selectedPass.value = null
    rejectNotes.value = ''
  }

  async function submitStatus (status: 'authorized' | 'refused') {
    if (!selectedPass.value) return

    if (status === 'refused') {
      const notes = rejectNotes.value.trim()
      if (!notes) {
        showSnackbar('Debes escribir una anotación en notas para rechazar el pase.', 'error')
        return
      }
    }

    statusSubmitting.value = true
    errorMessage.value = null

    try {
      const payload = status === 'authorized'
        ? { status: 'authorized' }
        : { status: 'refused', notes: rejectNotes.value.trim() }

      await httpClient.post(`/api/v1/exit-passes/${selectedPass.value.id}/statuses`, payload)

      showSnackbar(
        status === 'authorized' ? 'Pase autorizado correctamente.' : 'Pase rechazado correctamente.',
        'success',
      )
      closeDetail()
      await loadExitPasses()
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible actualizar el estatus del pase.')
      showSnackbar(errorMessage.value, 'error')
    } finally {
      statusSubmitting.value = false
    }
  }

  onMounted(() => {
    void loadExitPasses()
  })
</script>

<style scoped>
.admin-passes-page {
  display: grid;
}

.admin-passes-card {
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
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 8px 0 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #000000;
}

.card-subtitle {
  margin: 8px 0 0;
  color: #5e5e5e;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  color: #5e5e5e;
}

.table-wrap {
  overflow-x: auto;
}

.pass-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.pass-table th,
.pass-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgb(0 0 0 / 0.08);
  text-align: left;
  vertical-align: middle;
}

.pass-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6f5a60;
  font-weight: 700;
}

.th-actions,
.td-actions {
  text-align: right;
  white-space: nowrap;
}

.empty-hint {
  padding: 16px 8px;
  color: #5e5e5e;
  text-align: center;
}

.detail-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
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
