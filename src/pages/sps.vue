<template>
  <div class="sps-page">
    <v-card class="sps-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">SPS</div>
          <h2 class="card-title">Solicitud de pase de salida</h2>
          <p class="card-subtitle">
            Captura de empleado y pase en dos secciones.
          </p>
        </div>
        <v-chip color="#c89215" variant="tonal">
          Paso {{ currentStep }}
        </v-chip>
      </div>

      <v-alert
        v-if="!canRequestPass"
        class="mt-4"
        color="warning"
        icon="mdi-lock-outline"
        variant="tonal"
      >
        No cuentas con el permiso <strong>sps.pass.create</strong> para registrar pases.
      </v-alert>

      <v-alert
        v-else-if="errorMessage"
        class="mt-4"
        closable
        color="error"
        variant="tonal"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>
      <v-alert
        v-else-if="employeePrefilled"
        class="mt-4"
        color="success"
        icon="mdi-check-circle-outline"
        variant="tonal"
      >
        Datos del empleado cargados automáticamente. Puedes continuar con el pase.
      </v-alert>

      <v-stepper
        v-if="canRequestPass"
        v-model="currentStep"
        alt-labels
        class="mt-6"
        flat
        :items="stepItems"
      >
        <template #item.1>
          <v-form ref="employeeFormRef" v-model="employeeValid" class="pt-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="employeeForm.first_name"
                  label="Nombre(s)"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="employeeForm.last_name"
                  label="Apellido paterno"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="employeeForm.second_last_name"
                  label="Apellido materno (opcional)"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="employeeForm.employee_number"
                  label="Número de empleado"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="employeeForm.category"
                  label="Categoría"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="employeeForm.assignment_area"
                  label="Área de adscripción"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <div class="actions-row">
              <v-spacer />
              <v-btn
                color="#c89215"
                :loading="submittingEmployee || loadingEmployee"
                variant="flat"
                @click="submitEmployee"
              >
                Guardar empleado y continuar
              </v-btn>
            </div>
          </v-form>
        </template>

        <template #item.2>
          <v-form ref="passFormRef" v-model="passValid" class="pt-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.usage_date"
                  label="Fecha de uso"
                  :rules="requiredRules"
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="passForm.work_schedule"
                  :items="workScheduleOptions"
                  label="Jornada laboral"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.shift_start"
                  label="Entrada"
                  :rules="requiredRules"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.shift_end"
                  label="Salida"
                  :rules="requiredRules"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.afternoon_shift_start"
                  label="Inicio turno vespertino (opcional)"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.afternoon_shift_end"
                  label="Fin turno vespertino (opcional)"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="passForm.reason"
                  :items="reasonOptions"
                  label="Motivo"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="passForm.schedule_timing"
                  :items="scheduleTimingOptions"
                  label="Momento en horario"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="passForm.subject"
                  auto-grow
                  label="Asunto / descripción (opcional)"
                  rows="2"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="passForm.within_schedule_exit_at"
                  label="Salida dentro horario"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="passForm.within_schedule_return_at"
                  label="Regreso dentro horario"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="passForm.within_schedule_duration"
                  label="Duración dentro horario"
                  placeholder="Ej. 01:30"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="passForm.before_schedule_entry_at"
                  label="Entrada antes del horario"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="passForm.before_schedule_exit_at"
                  label="Salida antes del horario"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="passForm.before_schedule_duration"
                  label="Duración antes del horario"
                  placeholder="Ej. 00:45"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.immediate_supervisor_name"
                  label="Nombre jefe inmediato"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="passForm.administrative_director_name"
                  label="Nombre dirección administrativa"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <div class="actions-row">
              <v-btn variant="text" @click="currentStep = 1">
                Volver
              </v-btn>
              <v-spacer />
              <v-btn
                color="#c89215"
                :loading="submittingPass"
                variant="flat"
                @click="submitExitPass"
              >
                Enviar pase
              </v-btn>
            </div>
          </v-form>
        </template>
      </v-stepper>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import type { AxiosError } from 'axios'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { httpClient } from '@/services/http'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const canRequestPass = computed(() => authStore.hasPermission('sps.pass.create'))
  const currentStep = ref(1)
  const stepItems = [
    'Datos del empleado',
    'Datos del pase',
  ]

  const errorMessage = ref<string | null>(null)
  const submittingEmployee = ref(false)
  const submittingPass = ref(false)
  const loadingEmployee = ref(false)
  const createdEmployeeId = ref<number | string | null>(null)
  const employeePrefilled = ref(false)

  const employeeFormRef = ref()
  const employeeValid = ref(false)
  const employeeForm = ref({
    first_name: '',
    last_name: '',
    second_last_name: '',
    employee_number: '',
    category: '',
    assignment_area: '',
  })

  const passFormRef = ref()
  const passValid = ref(false)
  const passForm = ref({
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
    immediate_supervisor_signature: '',
    administrative_director_name: '',
    administrative_director_signature: '',
    employee_signature: '',
  })

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

  const requiredRules = [
    (v: string) => !!v || 'Este campo es requerido',
  ]

  function normalizeOptional (value: string) {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  function normalizeTimeToApi (value: string) {
    const trimmed = value.trim()
    if (!trimmed) return null
    return trimmed.length === 5 ? `${trimmed}:00` : trimmed
  }

  function resolveApiMessage (error: unknown, fallback: string) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
  }

  function parseEmployeeResponse (response: unknown) {
    if (!response || typeof response !== 'object') {
      return null
    }

    const source = 'data' in response
      ? (response as { data?: unknown }).data
      : response

    if (!source || typeof source !== 'object') {
      return null
    }

    return source as {
      id?: number | string
      first_name?: string
      last_name?: string
      second_last_name?: string | null
      employee_number?: string
      category?: string
      assignment_area?: string
    }
  }

  async function preloadEmployeeByUserId () {
    const userId = authStore.user?.id
    if (!userId || !canRequestPass.value) {
      return
    }

    loadingEmployee.value = true

    try {
      const response = await httpClient.get<unknown>('/api/v1/employee', {
        params: { user_id: userId },
      })
      const employee = parseEmployeeResponse(response)

      if (!employee) {
        return
      }

      employeeForm.value = {
        first_name: employee.first_name ?? '',
        last_name: employee.last_name ?? '',
        second_last_name: employee.second_last_name ?? '',
        employee_number: employee.employee_number ?? '',
        category: employee.category ?? '',
        assignment_area: employee.assignment_area ?? '',
      }

      if (employee.id) {
        createdEmployeeId.value = employee.id
        employeePrefilled.value = true
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const status = axiosError.response?.status

      if (status === 404) {
        // No existe empleado para este usuario: se captura manualmente.
        return
      }

      if (status === 422) {
        errorMessage.value = resolveApiMessage(error, 'El parámetro user_id no es válido.')
        return
      }

      errorMessage.value = resolveApiMessage(error, 'No fue posible precargar los datos del empleado.')
    } finally {
      loadingEmployee.value = false
    }
  }

  async function submitEmployee () {
    if (createdEmployeeId.value) {
      currentStep.value = 2
      return
    }

    const { valid } = await employeeFormRef.value.validate()
    if (!valid) return

    submittingEmployee.value = true
    errorMessage.value = null

    try {
      const payload = {
        first_name: employeeForm.value.first_name,
        last_name: employeeForm.value.last_name,
        second_last_name: normalizeOptional(employeeForm.value.second_last_name),
        employee_number: employeeForm.value.employee_number,
        category: employeeForm.value.category,
        assignment_area: employeeForm.value.assignment_area,
        user_id: authStore.user?.id ?? null,
      }

      const response = await httpClient.post<{ data?: { id?: number | string, employee_id?: number | string } } | { id?: number | string, employee_id?: number | string }, typeof payload>(
        '/api/v1/employees',
        payload,
      )

      const responseRecord = response && typeof response === 'object' && 'data' in response
        ? response.data as { id?: number | string, employee_id?: number | string } | undefined
        : response as { id?: number | string, employee_id?: number | string } | undefined

      const employeeId = responseRecord?.id ?? responseRecord?.employee_id

      if (!employeeId) {
        throw new Error('No se recibió el ID del empleado creado.')
      }

      createdEmployeeId.value = employeeId
      currentStep.value = 2
    } catch (error) {
      errorMessage.value = resolveApiMessage(error, 'No fue posible registrar el empleado.')
    } finally {
      submittingEmployee.value = false
    }
  }

  async function submitExitPass () {
    const { valid } = await passFormRef.value.validate()
    if (!valid || !createdEmployeeId.value) return

    submittingPass.value = true
    errorMessage.value = null

    try {
      const payload = {
        employee_id: createdEmployeeId.value,
        usage_date: passForm.value.usage_date,
        work_schedule: passForm.value.work_schedule,
        shift_start: normalizeTimeToApi(passForm.value.shift_start),
        shift_end: normalizeTimeToApi(passForm.value.shift_end),
        afternoon_shift_start: normalizeTimeToApi(passForm.value.afternoon_shift_start),
        afternoon_shift_end: normalizeTimeToApi(passForm.value.afternoon_shift_end),
        reason: passForm.value.reason,
        subject: normalizeOptional(passForm.value.subject),
        schedule_timing: passForm.value.schedule_timing,
        within_schedule_exit_at: normalizeTimeToApi(passForm.value.within_schedule_exit_at),
        within_schedule_return_at: normalizeTimeToApi(passForm.value.within_schedule_return_at),
        within_schedule_duration: normalizeOptional(passForm.value.within_schedule_duration),
        before_schedule_entry_at: normalizeTimeToApi(passForm.value.before_schedule_entry_at),
        before_schedule_exit_at: normalizeTimeToApi(passForm.value.before_schedule_exit_at),
        before_schedule_duration: normalizeOptional(passForm.value.before_schedule_duration),
        immediate_supervisor_name: passForm.value.immediate_supervisor_name,
        immediate_supervisor_signature: normalizeOptional(passForm.value.immediate_supervisor_signature),
        administrative_director_name: passForm.value.administrative_director_name,
        administrative_director_signature: normalizeOptional(passForm.value.administrative_director_signature),
        employee_signature: normalizeOptional(passForm.value.employee_signature),
      }

      await httpClient.post('/api/v1/exit-passes', payload)
      router.push('/sps/pases')
    } catch (error) {
      errorMessage.value = resolveApiMessage(error, 'No fue posible registrar el pase de salida.')
    } finally {
      submittingPass.value = false
    }
  }

  onMounted(() => {
    void preloadEmployeeByUserId()
  })
</script>

<style scoped>
.sps-page {
  display: grid;
}

.sps-card {
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

.actions-row {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
