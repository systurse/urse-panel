<template>
  <v-card class="passes-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">SPS</div>
        <h2 class="card-title">Pases registrados</h2>

        <p class="card-subtitle">
          Historial de pases de salida registrados en el sistema.
        </p>
      </div>

      <v-btn
        color="#c89215"
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
      <v-progress-circular color="#c89215" indeterminate />
      <span>Cargando pases...</span>
    </div>

    <div v-else-if="exitPasses.length === 0" class="state-box state-box--empty">
      <v-icon color="#c89215" icon="mdi-file-document-outline" size="32" />
      <span>No hay pases registrados.</span>
    </div>

    <div v-else class="passes-list">
      <v-card
        v-for="exitPass in exitPasses"
        :key="String(exitPass.id)"
        class="pass-row"
        rounded="lg"
        variant="outlined"
      >
        <v-card-text>
          <div class="pass-row-head">
            <div>
              <div class="pass-employee">{{ exitPass.employeeName }}</div>

              <div class="pass-meta">
                #{{ exitPass.employeeNumber || 'N/A' }} · {{ formatDate(exitPass.usageDate) }}
              </div>
            </div>

            <div class="pass-head-badges">
              <v-chip :color="statusColor(exitPass.currentStatus)" size="small" variant="tonal">
                {{ statusLabel(exitPass.currentStatus) }}
              </v-chip>

              <v-chip color="#c89215" size="small" variant="tonal">
                {{ optionLabel(reasonOptions, exitPass.reason, 'Sin motivo') }}
              </v-chip>
            </div>
          </div>

          <div class="pass-grid">
            <div>
              <span class="label">Jornada</span>
              <span>{{ optionLabel(workScheduleOptions, exitPass.workSchedule) }}</span>
            </div>

            <div>
              <span class="label">Horario</span>
              <span>{{ exitPass.shiftStart || '—' }} - {{ exitPass.shiftEnd || '—' }}</span>
            </div>

            <div>
              <span class="label">Jefe inmediato</span>
              <span>{{ exitPass.supervisorName || '—' }}</span>
            </div>

            <div>
              <span class="label">Director administrativo</span>
              <span>{{ exitPass.directorName || '—' }}</span>
            </div>
          </div>

          <div v-if="exitPass.subject" class="pass-subject">
            <span class="label">Asunto</span>
            <p>{{ exitPass.subject }}</p>
          </div>

          <div class="pass-actions">
            <v-btn
              color="#1e3a5f"
              prepend-icon="mdi-eye-outline"
              size="small"
              :to="`/sps/pases/${exitPass.id}`"
              variant="text"
            >
              Ver detalle
            </v-btn>

            <v-btn
              v-if="exitPass.currentStatus === 'pending' && exitPass.signedRoleCount === 0"
              color="#c89215"
              prepend-icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click="openEditDialog(exitPass)"
            >
              Editar
            </v-btn>

            <v-chip
              v-else-if="exitPass.signedRoleCount > 0"
              color="success"
              prepend-icon="mdi-draw-pen"
              size="small"
              title="Un pase firmado ya no puede editarse"
              variant="tonal"
            >
              Firmado
            </v-chip>

            <v-btn
              v-if="exitPass.currentStatus === 'pending'"
              color="primary"
              :loading="isActionLoading(exitPass.id, 'revision')"
              prepend-icon="mdi-send-outline"
              size="small"
              variant="text"
              @click="sendToRevision(exitPass.id)"
            >
              Enviar a revisión
            </v-btn>

            <v-btn
              v-if="exitPass.currentStatus === 'authorized'"
              color="success"
              :loading="isActionLoading(exitPass.id, 'pdf')"
              prepend-icon="mdi-printer-outline"
              size="small"
              variant="text"
              @click="printPassPdf(exitPass.id)"
            >
              Imprimir
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-card>

  <v-dialog v-model="editDialog" max-width="920" persistent>
    <v-card :loading="editingLoading">
      <v-card-title class="pt-6 pb-2">Actualizar pase</v-card-title>

      <v-card-text>
        <v-form ref="editFormRef" v-model="editValid" class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.usage_date"
                label="Fecha de uso"
                :rules="requiredRules"
                type="date"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="editForm.work_schedule"
                :items="workScheduleOptions"
                label="Jornada laboral"
                :rules="requiredRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.shift_start"
                label="Entrada"
                :rules="requiredRules"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.shift_end"
                label="Salida"
                :rules="requiredRules"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.afternoon_shift_start"
                label="Inicio turno vespertino (opcional)"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.afternoon_shift_end"
                label="Fin turno vespertino (opcional)"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="editForm.reason"
                :items="reasonOptions"
                label="Motivo"
                :rules="requiredRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="editForm.schedule_timing"
                :items="scheduleTimingOptions"
                label="Momento en horario"
                :rules="requiredRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="editForm.subject"
                auto-grow
                label="Asunto / descripción (opcional)"
                rows="2"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="editForm.within_schedule_exit_at"
                label="Salida dentro horario"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="editForm.within_schedule_return_at"
                label="Regreso dentro horario"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="editForm.within_schedule_duration"
                label="Duración dentro horario"
                placeholder="Ej. 01:30"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="editForm.before_schedule_entry_at"
                label="Entrada antes del horario"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="editForm.before_schedule_exit_at"
                label="Salida antes del horario"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="editForm.before_schedule_duration"
                label="Duración antes del horario"
                placeholder="Ej. 00:45"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.immediate_supervisor_name"
                label="Nombre jefe inmediato"
                :rules="requiredRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="editForm.administrative_director_name"
                label="Nombre dirección administrativa"
                :rules="requiredRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancelar" variant="text" @click="closeEditDialog" />

        <v-btn
          color="#c89215"
          :loading="editingLoading"
          text="Guardar cambios"
          variant="flat"
          @click="savePassUpdate"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { AxiosError } from 'axios'
  import { onMounted, ref } from 'vue'
  import { http, httpClient } from '@/services/http'

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
    directorName: string
    signedRoleCount: number
    currentStatus: string
    statuses: string[]
  }

  type ActionType = 'revision' | 'pdf'
  interface ActionLoadingState {
    id: number | string | null
    type: ActionType | null
  }

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const exitPasses = ref<ExitPassItem[]>([])
  const actionLoading = ref<ActionLoadingState>({ id: null, type: null })

  const editDialog = ref(false)
  const editFormRef = ref()
  const editValid = ref(false)
  const editingLoading = ref(false)
  const editingPassId = ref<number | string | null>(null)
  const editingEmployeeId = ref<number | string | null>(null)

  const editForm = ref({
    usage_date: '',
    work_schedule: '',
    shift_start: '',
    shift_end: '',
    afternoon_shift_start: '',
    afternoon_shift_end: '',
    reason: '',
    subject: '',
    schedule_timing: '',
    within_schedule_exit_at: '',
    within_schedule_return_at: '',
    within_schedule_duration: '',
    before_schedule_entry_at: '',
    before_schedule_exit_at: '',
    before_schedule_duration: '',
    immediate_supervisor_name: '',
    administrative_director_name: '',
  })

  const requiredRules = [
    (v: string) => !!v || 'Este campo es requerido',
  ]

  const workScheduleOptions = [
    { title: 'Jornada continua', value: 'continuous' },
    { title: 'Jornada partida', value: 'split' },
  ]

  const reasonOptions = [
    { title: 'Personal', value: 'personal' },
    { title: 'Cita médica IMSS empleado', value: 'employee_imss_medical_visit' },
    { title: 'Oficial', value: 'official' },
  ]

  const scheduleTimingOptions = [
    { title: 'Dentro del horario', value: 'within_schedule' },
    { title: 'Antes del horario', value: 'before_schedule' },
  ]

  // The pass resource may carry either the progress object or the signature
  // list depending on the endpoint; a pass with no signature data reads as 0 and
  // the API remains the authority.
  function getSignedRoleCount (item: Record<string, unknown>) {
    const progress = item.signature_progress
    if (progress && typeof progress === 'object') {
      const signed = (progress as Record<string, unknown>).signed_roles
      if (Array.isArray(signed)) {
        return signed.length
      }
    }

    return Array.isArray(item.signatures) ? item.signatures.length : 0
  }

  function resolveMessage (error: unknown, fallback: string) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
  }

  // A signed pass rejects content changes with 422 and the reason under the
  // `signatures` key; that message explains which signature blocks the edit.
  function resolveSignatureBlock (error: unknown): string | null {
    const errors = (error as { response?: { data?: { errors?: Record<string, string[] | string> } } })
      ?.response
      ?.data
      ?.errors
      ?.signatures

    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0]
    }

    return typeof errors === 'string' && errors.trim().length > 0 ? errors : null
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
      directorName: readString(item, 'administrative_director_name'),
      signedRoleCount: getSignedRoleCount(item),
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

  function normalizeOptional (value: string) {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  function normalizeTimeToApi (value: string) {
    const trimmed = value.trim()
    if (!trimmed) return null
    return trimmed.length === 5 ? `${trimmed}:00` : trimmed
  }

  function normalizeTimeToInput (value: string) {
    if (!value) return ''
    return value.slice(0, 5)
  }

  function humanizeEnum (value: string) {
    if (!value) return '—'
    return value.replaceAll('_', ' ')
  }

  function optionLabel (options: Array<{ title: string, value: string }>, value: string, fallback = '—') {
    if (!value) return fallback
    return options.find(option => option.value === value)?.title ?? humanizeEnum(value)
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

  function isActionLoading (id: number | string, type: ActionType) {
    return actionLoading.value.id === id && actionLoading.value.type === type
  }

  function openEditDialog (pass: ExitPassItem) {
    editingPassId.value = pass.id
    editingEmployeeId.value = pass.employeeId
    editForm.value = {
      usage_date: pass.usageDate,
      work_schedule: pass.workSchedule,
      shift_start: normalizeTimeToInput(pass.shiftStart),
      shift_end: normalizeTimeToInput(pass.shiftEnd),
      afternoon_shift_start: normalizeTimeToInput(pass.afternoonShiftStart),
      afternoon_shift_end: normalizeTimeToInput(pass.afternoonShiftEnd),
      reason: pass.reason,
      subject: pass.subject,
      schedule_timing: pass.scheduleTiming,
      within_schedule_exit_at: normalizeTimeToInput(pass.withinScheduleExitAt),
      within_schedule_return_at: normalizeTimeToInput(pass.withinScheduleReturnAt),
      within_schedule_duration: pass.withinScheduleDuration,
      before_schedule_entry_at: normalizeTimeToInput(pass.beforeScheduleEntryAt),
      before_schedule_exit_at: normalizeTimeToInput(pass.beforeScheduleExitAt),
      before_schedule_duration: pass.beforeScheduleDuration,
      immediate_supervisor_name: pass.supervisorName,
      administrative_director_name: pass.directorName,
    }
    editDialog.value = true
  }

  function closeEditDialog () {
    editDialog.value = false
    editingPassId.value = null
    editingEmployeeId.value = null
    editFormRef.value?.resetValidation()
  }

  async function savePassUpdate () {
    const { valid } = await editFormRef.value.validate()
    if (!valid || !editingPassId.value || !editingEmployeeId.value) return

    editingLoading.value = true
    errorMessage.value = null

    try {
      const payload = {
        employee_id: editingEmployeeId.value,
        usage_date: editForm.value.usage_date,
        work_schedule: editForm.value.work_schedule,
        shift_start: normalizeTimeToApi(editForm.value.shift_start),
        shift_end: normalizeTimeToApi(editForm.value.shift_end),
        afternoon_shift_start: normalizeTimeToApi(editForm.value.afternoon_shift_start),
        afternoon_shift_end: normalizeTimeToApi(editForm.value.afternoon_shift_end),
        reason: editForm.value.reason,
        subject: normalizeOptional(editForm.value.subject),
        schedule_timing: editForm.value.schedule_timing,
        within_schedule_exit_at: normalizeTimeToApi(editForm.value.within_schedule_exit_at),
        within_schedule_return_at: normalizeTimeToApi(editForm.value.within_schedule_return_at),
        within_schedule_duration: normalizeOptional(editForm.value.within_schedule_duration),
        before_schedule_entry_at: normalizeTimeToApi(editForm.value.before_schedule_entry_at),
        before_schedule_exit_at: normalizeTimeToApi(editForm.value.before_schedule_exit_at),
        before_schedule_duration: normalizeOptional(editForm.value.before_schedule_duration),
        immediate_supervisor_name: editForm.value.immediate_supervisor_name,
        administrative_director_name: editForm.value.administrative_director_name,
      }

      await httpClient.put(`/api/v1/exit-passes/${editingPassId.value}`, payload)
      closeEditDialog()
      await loadExitPasses()
    } catch (error) {
      errorMessage.value = resolveSignatureBlock(error)
        ?? resolveMessage(error, 'No fue posible actualizar el pase.')
    } finally {
      editingLoading.value = false
    }
  }

  async function sendToRevision (id: number | string) {
    actionLoading.value = { id, type: 'revision' }
    errorMessage.value = null

    try {
      await httpClient.post(`/api/v1/exit-passes/${id}/statuses`, { status: 'revision' })
      await loadExitPasses()
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible enviar el pase a revisión.')
    } finally {
      actionLoading.value = { id: null, type: null }
    }
  }

  async function printPassPdf (id: number | string) {
    actionLoading.value = { id, type: 'pdf' }
    errorMessage.value = null

    try {
      const response = await http.get(`/api/v1/exit-passes/${id}/pdf`, {
        responseType: 'blob',
      })

      const fileBlob = new Blob([response.data], { type: 'application/pdf' })
      const fileUrl = URL.createObjectURL(fileBlob)
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible generar el PDF del pase.')
    } finally {
      actionLoading.value = { id: null, type: null }
    }
  }

  async function loadExitPasses () {
    loading.value = true
    errorMessage.value = null

    try {
      const response = await httpClient.get<unknown>('/api/v1/exit-passes')
      exitPasses.value = parseCollection(response)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible cargar los pases registrados.')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadExitPasses()
  })
</script>

<style scoped>
.passes-card {
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
  min-height: 180px;
  margin-top: 24px;
  color: #5e5e5e;
}

.state-box--empty {
  flex-direction: column;
}

.passes-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.pass-row-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.pass-head-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pass-employee {
  font-weight: 700;
  color: #000000;
}

.pass-meta {
  color: #5e5e5e;
  font-size: 0.9rem;
  margin-top: 2px;
}

.pass-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pass-grid div {
  display: grid;
  gap: 2px;
}

.label {
  font-size: 0.8rem;
  color: #6f5a60;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pass-subject {
  margin-top: 12px;
}

.pass-subject p {
  margin: 4px 0 0;
}

.pass-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .card-head,
  .pass-row-head {
    flex-direction: column;
  }

  .pass-grid {
    grid-template-columns: 1fr;
  }

  .pass-actions,
  .pass-head-badges {
    justify-content: flex-start;
  }
}
</style>
