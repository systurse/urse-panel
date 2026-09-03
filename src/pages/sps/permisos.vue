<template>
  <div class="permits-page">
    <v-card class="permits-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Pases y permisos</div>
          <h2 class="card-title">Permisos F011A</h2>

          <p class="card-subtitle">
            Permiso económico y no económico: captura, firma y descarga del formato.
          </p>
        </div>

        <v-btn
          v-if="canCreate"
          color="#c89215"
          prepend-icon="mdi-file-document-plus-outline"
          variant="flat"
          @click="openCreateDialog"
        >
          Nuevo permiso
        </v-btn>
      </div>

      <v-alert
        v-if="error"
        class="mt-6"
        closable
        color="error"
        variant="tonal"
        @click:close="clearError"
      >
        {{ error }}
      </v-alert>

      <div class="permits-toolbar">
        <v-text-field
          v-if="canFilterAll"
          v-model="searchInput"
          class="permits-toolbar__search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Buscar por empleado..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="onSearchInput"
        />

        <v-select
          v-if="canFilterAll"
          class="permits-toolbar__select"
          clearable
          density="comfortable"
          hide-details
          :items="KIND_OPTIONS"
          label="Tipo"
          :model-value="filters.kind ?? null"
          variant="outlined"
          @update:model-value="value => applyFilter('kind', value)"
        />

        <span class="permits-toolbar__count">
          {{ meta.total }} {{ meta.total === 1 ? 'permiso' : 'permisos' }}
        </span>
      </div>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#c89215" indeterminate />
        <span>Cargando permisos...</span>
      </div>

      <div v-else-if="permits.length === 0" class="state-box state-box--empty">
        <v-icon color="#c89215" icon="mdi-file-document-outline" size="32" />
        <span>No hay permisos registrados.</span>
      </div>

      <div v-else class="permit-list">
        <v-card
          v-for="permit in permits"
          :key="String(permit.id)"
          class="permit-item"
          rounded="lg"
          variant="outlined"
        >
          <div class="permit-item__head">
            <div>
              <div class="permit-item__name">
                {{ permit.employee?.name ?? 'Sin empleado' }}
              </div>

              <div class="permit-item__meta">
                #{{ permit.employee?.employeeNumber || 'N/A' }} · Solicitado el
                {{ formatDate(permit.requestDate) }}
              </div>
            </div>

            <v-chip :color="statusColor(permit.latestStatus)" size="small" variant="tonal">
              {{ statusLabel(permit.latestStatus) }}
            </v-chip>
          </div>

          <div class="permit-item__facts">
            <div>
              <span class="label">Tipo</span>
              <div>{{ kindLabel(permit.kind) }}</div>
            </div>

            <div>
              <span class="label">Turno</span>
              <div>{{ shiftLabel(permit.shift) }}</div>
            </div>

            <div>
              <span class="label">Periodo</span>
              <div>{{ formatDate(permit.startsOn) }} — {{ formatDate(permit.endsOn) }}</div>
            </div>

            <div>
              <span class="label">Días</span>
              <div>{{ permit.dayCount || '—' }}</div>
            </div>
          </div>

          <div class="permit-item__actions">
            <v-btn
              color="primary"
              prepend-icon="mdi-eye-outline"
              size="small"
              :to="`/sps/permisos/${permit.id}`"
              variant="text"
            >
              Ver detalle
            </v-btn>

            <v-btn
              prepend-icon="mdi-file-pdf-box"
              size="small"
              variant="text"
              @click="downloadPdf(permit.id)"
            >
              Formato PDF
            </v-btn>

            <v-btn
              color="#c89215"
              :loading="busyPermitId === permit.id"
              prepend-icon="mdi-draw-pen"
              size="small"
              variant="text"
              @click="startSigning(permit)"
            >
              Firmar
            </v-btn>

            <!-- A signed permit is frozen: the API answers 422 to an edit and
                 409 to a delete. The list resource carries no signature data,
                 so the progress is read when the action is used instead of
                 offering something the API will refuse. -->
            <v-btn
              v-if="canUpdate"
              color="#c89215"
              :loading="busyPermitId === permit.id"
              prepend-icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click="openEditDialog(permit)"
            >
              Editar
            </v-btn>

            <v-btn
              v-if="canDelete"
              color="error"
              :loading="busyPermitId === permit.id"
              prepend-icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="openDeleteDialog(permit)"
            >
              Eliminar
            </v-btn>
          </div>
        </v-card>
      </div>

      <div v-if="meta.lastPage > 1" class="permits-pagination">
        <v-pagination
          :length="meta.lastPage"
          :model-value="meta.currentPage"
          rounded="circle"
          total-visible="7"
          @update:model-value="setPage"
        />
      </div>
    </v-card>

    <v-dialog v-model="formDialog" max-width="640" persistent>
      <v-card :loading="saving">
        <v-card-title class="pt-6 pb-2">
          {{ isEditing ? 'Editar permiso' : 'Nuevo permiso' }}
        </v-card-title>

        <v-card-text>
          <v-alert
            class="mb-4"
            color="info"
            density="comfortable"
            icon="mdi-information-outline"
            variant="tonal"
          >
            Debe solicitarse con al menos 48 horas de anticipación y no puede iniciar ni terminar
            en sábado o domingo. Un periodo que abarque el fin de semana sí se acepta.
          </v-alert>

          <v-form ref="formRef" validate-on="input lazy">
            <v-row dense>
              <v-col cols="12">
                <v-autocomplete
                  v-if="canCaptureForOthers"
                  v-model="form.employee_id"
                  item-title="name"
                  item-value="id"
                  :items="employees"
                  label="Empleado"
                  :loading="employeesLoading"
                  no-data-text="No hay empleados disponibles"
                  :rules="requiredRules"
                  variant="outlined"
                />

                <!-- Everyone else captures for themselves, so the name is shown
                     rather than picked — and rather than left blank. -->
                <v-text-field
                  v-else
                  hint="El permiso se registra a tu nombre."
                  label="Empleado"
                  :loading="ownEmployeeLoading"
                  :model-value="ownEmployeeName"
                  persistent-hint
                  prepend-inner-icon="mdi-account-outline"
                  readonly
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="form.kind"
                  :items="KIND_OPTIONS"
                  label="Tipo de permiso"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="form.shift"
                  :items="SHIFT_OPTIONS"
                  label="Turno"
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.request_date"
                  label="Fecha de solicitud"
                  :rules="requiredRules"
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.starts_on"
                  :error-messages="dateErrors.starts_on ? [dateErrors.starts_on] : []"
                  label="Primer día"
                  :rules="requiredRules"
                  type="date"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.ends_on"
                  :error-messages="dateErrors.ends_on ? [dateErrors.ends_on] : []"
                  hint="Igual al primer día si el permiso es de un solo día."
                  label="Último día"
                  persistent-hint
                  :rules="requiredRules"
                  type="date"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" text="Cancelar" variant="text" @click="closeFormDialog" />

          <v-btn
            color="#c89215"
            :disabled="hasDateErrors"
            :loading="saving"
            text="Guardar"
            variant="flat"
            @click="submitForm"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="text-h6 pt-6 pb-2">Confirmar eliminación</v-card-title>

        <v-card-text class="pb-6">
          <p>
            ¿Eliminar el permiso de
            <strong>{{ selectedPermit?.employee?.name ?? 'este empleado' }}</strong>?
          </p>

          <p class="text-error mt-2">Esta acción no se puede deshacer.</p>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" variant="text" @click="deleteDialog = false" />

          <v-btn
            color="error"
            :loading="saving"
            text="Eliminar"
            variant="flat"
            @click="confirmDelete"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SignDialog
      v-if="signingPermit && signingRole"
      :key="signingPermit.id"
      v-model="signDialog"
      :document-id="signingPermit.id"
      resource="leave-permits"
      :role-label="signingRole === 'employee' ? 'Empleado' : 'Jefe inmediato'"
      :signer-role="signingRole"
      @signed="onPermitSigned"
    />

    <v-snackbar v-model="snackbar" color="success" location="top" :timeout="3500">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { Employee } from '@/modules/employees/port'
  import type {
    LeavePermit,
    LeavePermitFilters,
    LeavePermitPayload,
  } from '@/modules/leave-permits/port'
  import type { SignerRole } from '@/modules/signatures/port'
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import { useLeavePermits } from '@/modules/leave-permits/useLeavePermits'
  import { validateLeavePermitDates } from '@/modules/leave-permits/validation'
  import { signaturesAdapter } from '@/modules/signatures/adapter'
  import SignDialog from '@/modules/sps/components/SignDialog.vue'
  import { useAuthStore } from '@/stores/auth'
  import { isSameId } from '@/utils/identity'

  const authStore = useAuthStore()

  const {
    clearError,
    createPermit,
    downloadPdf,
    error,
    filters,
    loading,
    loadPermits,
    meta,
    permits,
    removePermit,
    saving,
    setFilters,
    setPage,
    updatePermit,
  } = useLeavePermits()

  const KIND_OPTIONS = [
    { title: 'Económico', value: 'economic' },
    { title: 'No económico', value: 'non_economic' },
  ]

  const SHIFT_OPTIONS = [
    { title: 'Completo', value: 'complete' },
    { title: 'Matutino', value: 'morning' },
    { title: 'Vespertino', value: 'afternoon' },
  ]

  const canFilterAll = computed(() => authStore.isAdmin || authStore.hasPermission('sps.permit.filter'))
  const canCaptureForOthers = canFilterAll
  const canCreate = computed(() => authStore.isAdmin || authStore.hasPermission('sps.permit.create'))
  const canUpdate = computed(() => authStore.isAdmin || authStore.hasPermission('sps.permit.update'))
  const canDelete = computed(() => authStore.isAdmin || authStore.hasPermission('sps.permit.delete'))

  const employees = ref<Employee[]>([])
  const employeesLoading = ref(false)

  const formDialog = ref(false)
  const formRef = ref()
  const isEditing = ref(false)
  const selectedPermit = ref<LeavePermit | null>(null)
  const deleteDialog = ref(false)

  const snackbar = ref(false)
  const snackbarText = ref('')

  const searchInput = ref('')
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  function todayInputValue () {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
  }

  const form = ref<LeavePermitPayload>({
    employee_id: '',
    ends_on: '',
    kind: 'economic',
    request_date: todayInputValue(),
    shift: 'complete',
    starts_on: '',
  })

  const requiredRules = [(v: unknown) => (v !== null && v !== undefined && v !== '') || 'Requerido']

  // The 48-hour rule only governs capture: an older permit stays correctable.
  const dateErrors = computed(() =>
    validateLeavePermitDates(form.value.starts_on, form.value.ends_on, {
      checkNotice: !isEditing.value,
    }),
  )

  const hasDateErrors = computed(() => Object.keys(dateErrors.value).length > 0)

  function formatDate (value: string) {
    if (!value) return '—'

    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const date = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function kindLabel (kind: string) {
    return kind === 'non_economic' ? 'No económico' : 'Económico'
  }

  function shiftLabel (shift: string) {
    if (shift === 'morning') return 'Matutino'
    if (shift === 'afternoon') return 'Vespertino'
    return 'Completo'
  }

  function statusLabel (status: string) {
    if (status === 'authorized') return 'Autorizado'
    if (status === 'refused') return 'Rechazado'
    if (status === 'pending') return 'Pendiente'
    return status.replaceAll('_', ' ')
  }

  function statusColor (status: string) {
    if (status === 'authorized') return 'success'
    if (status === 'refused') return 'error'
    return 'warning'
  }

  function applyFilter (key: keyof LeavePermitFilters, value: unknown) {
    const next: LeavePermitFilters = { ...filters.value }

    if (value === null || value === '') {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }

    void setFilters(next)
  }

  function onSearchInput (value: string | null) {
    if (searchTimer) clearTimeout(searchTimer)

    searchTimer = setTimeout(() => {
      searchTimer = undefined
      applyFilter('search', value)
    }, 400)
  }

  async function loadEmployees () {
    if (!canCaptureForOthers.value) return

    employeesLoading.value = true

    try {
      employees.value = await employeesAdapter.list()
    } catch {
      // The picker simply stays empty; the permit can still be captured for
      // oneself, which is what everyone without `sps.permit.filter` does.
    } finally {
      employeesLoading.value = false
    }
  }

  // Everyone else captures for themselves, so their own employee record is
  // resolved once: the id to send, and the name to show instead of a picker.
  const ownEmployeeId = ref<number | string | null>(null)
  const ownEmployeeName = ref('')
  const ownEmployeeLoading = ref(false)

  async function loadOwnEmployee () {
    const userId = authStore.user?.id
    if (!userId) return

    ownEmployeeLoading.value = true

    try {
      const employee = await employeesAdapter.getByUserId(userId)
      ownEmployeeId.value = employee?.id ?? null
      ownEmployeeName.value = employee
        ? [employee.first_name, employee.last_name, employee.second_last_name]
          .filter(Boolean)
          .join(' ')
        : ''
    } catch {
      ownEmployeeId.value = null
      ownEmployeeName.value = ''
    } finally {
      ownEmployeeLoading.value = false
    }
  }

  const signDialog = ref(false)
  const signingPermit = ref<LeavePermit | null>(null)
  const signingRole = ref<SignerRole | null>(null)
  const busyPermitId = ref<number | string | null>(null)

  /**
   * The list resource carries no signature data, so it is read on demand. The
   * API stays the authority; this only decides what to open.
   */
  async function readPendingRoles (permit: LeavePermit): Promise<SignerRole[] | null> {
    busyPermitId.value = permit.id

    try {
      const { progress } = await signaturesAdapter.list('leave-permits', permit.id)
      return progress.pendingRoles
    } catch {
      return null
    } finally {
      busyPermitId.value = null
    }
  }

  // Mirrors the panel's rule: the owner signs as employee, a supervisor of the
  // area signs as immediate supervisor, and nobody holds two roles on one
  // document.
  function resolveSignableRole (permit: LeavePermit, pending: SignerRole[]): SignerRole | null {
    const isOwner = isSameId(permit.employeeId, ownEmployeeId.value)

    if (isOwner && pending.includes('employee') && authStore.hasPermission('sps.pass-signature.sign')) {
      return 'employee'
    }

    if (
      !isOwner
      && pending.includes('immediate_supervisor')
      && authStore.hasRole('supervisor')
      && authStore.hasPermission('sps.pass-signature.sign-as-supervisor')
    ) {
      return 'immediate_supervisor'
    }

    return null
  }

  async function startSigning (permit: LeavePermit) {
    const pending = await readPendingRoles(permit)

    if (pending === null) {
      error.value = 'No fue posible consultar las firmas de este permiso.'
      return
    }

    if (pending.length === 0) {
      error.value = 'Este permiso ya tiene todas las firmas requeridas.'
      await loadPermits()
      return
    }

    const role = resolveSignableRole(permit, pending)

    if (!role) {
      error.value = 'No tienes un rol pendiente de firma en este permiso.'
      return
    }

    signingPermit.value = permit
    signingRole.value = role
    signDialog.value = true
  }

  async function onPermitSigned () {
    signingPermit.value = null
    signingRole.value = null
    snackbarText.value = 'Permiso firmado.'
    snackbar.value = true
    await loadPermits()
  }

  /** A signed permit is frozen, and the list cannot tell on its own. */
  async function isFrozen (permit: LeavePermit) {
    const pending = await readPendingRoles(permit)

    if (pending === null) return false

    const signedCount = 2 - pending.length

    if (signedCount > 0) {
      error.value = 'Este permiso ya tiene firmas, por lo que no puede editarse ni eliminarse.'
      return true
    }

    return false
  }

  function openCreateDialog () {
    isEditing.value = false
    selectedPermit.value = null
    form.value = {
      employee_id: canCaptureForOthers.value ? '' : (ownEmployeeId.value ?? ''),
      ends_on: '',
      kind: 'economic',
      request_date: todayInputValue(),
      shift: 'complete',
      starts_on: '',
    }
    formDialog.value = true
  }

  async function openEditDialog (permit: LeavePermit) {
    if (await isFrozen(permit)) return

    isEditing.value = true
    selectedPermit.value = permit
    form.value = {
      employee_id: permit.employeeId ?? '',
      ends_on: permit.endsOn,
      kind: permit.kind,
      request_date: permit.requestDate,
      shift: permit.shift,
      starts_on: permit.startsOn,
    }
    formDialog.value = true
  }

  function closeFormDialog () {
    formDialog.value = false
    formRef.value?.resetValidation()
  }

  async function submitForm () {
    const { valid } = await formRef.value.validate()

    if (!valid || hasDateErrors.value) return

    try {
      await (isEditing.value && selectedPermit.value
        ? updatePermit(selectedPermit.value.id, form.value)
        : createPermit(form.value))

      snackbarText.value = isEditing.value ? 'Permiso actualizado.' : 'Permiso registrado.'
      snackbar.value = true
      closeFormDialog()
    } catch {
      // The composable already put the API's reason in `error`.
    }
  }

  async function openDeleteDialog (permit: LeavePermit) {
    if (await isFrozen(permit)) return

    selectedPermit.value = permit
    deleteDialog.value = true
  }

  async function confirmDelete () {
    if (!selectedPermit.value) return

    try {
      await removePermit(selectedPermit.value.id)
      snackbarText.value = 'Permiso eliminado.'
      snackbar.value = true
      deleteDialog.value = false
    } catch {
      // Same as above.
    }
  }

  // Capturing for oneself needs the id resolved before the dialog is filled.
  watch(ownEmployeeId, id => {
    if (id !== null && !canCaptureForOthers.value && !form.value.employee_id) {
      form.value.employee_id = id
    }
  })

  onMounted(() => {
    void loadPermits()
    void loadEmployees()
    void loadOwnEmployee()
  })

  onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
  })
</script>

<style scoped>
.permits-page {
  display: grid;
}

.permits-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #5e5e5e;
}

.permits-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.permits-toolbar__search {
  max-width: 320px;
}

.permits-toolbar__select {
  max-width: 200px;
}

.permits-toolbar__count {
  margin-inline-start: auto;
  color: #5e5e5e;
  font-size: 0.85rem;
  font-weight: 600;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  color: #5e5e5e;
}

.state-box--empty {
  flex-direction: column;
}

.permit-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.permit-item {
  padding: 16px;
}

.permit-item__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.permit-item__name {
  color: #000000;
  font-weight: 700;
}

.permit-item__meta {
  color: #5e5e5e;
  font-size: 0.85rem;
}

.permit-item__facts {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.label {
  display: block;
  color: #5e5e5e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.permit-item__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.permits-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }

  .permit-item__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .permits-toolbar__search,
  .permits-toolbar__select {
    max-width: none;
    width: 100%;
  }

  .permits-toolbar__count {
    margin-inline-start: 0;
  }
}
</style>
