<template>
  <div class="authorization-page">
    <v-card class="authorization-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Supervisión</div>
          <h2 class="card-title">Autorización de permisos</h2>

          <p class="card-subtitle">
            Permisos F011A de tus empleados: consulta el formato y fírmalo como jefe inmediato.
          </p>
        </div>

        <v-btn
          color="#FAB21A"
          :loading="loading"
          prepend-icon="mdi-refresh"
          variant="flat"
          @click="loadPermits"
        >
          Actualizar
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

      <div v-if="canFilterAll" class="toolbar">
        <v-text-field
          v-model="searchInput"
          class="toolbar__search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Buscar por empleado..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="onSearchInput"
        />

        <v-select
          class="toolbar__select"
          clearable
          density="comfortable"
          hide-details
          :items="KIND_OPTIONS"
          label="Tipo"
          :model-value="filters.kind ?? null"
          variant="outlined"
          @update:model-value="value => applyFilter('kind', value)"
        />

        <v-select
          class="toolbar__select"
          clearable
          density="comfortable"
          hide-details
          :items="STATUS_OPTIONS"
          label="Estatus"
          :model-value="filters.status ?? null"
          variant="outlined"
          @update:model-value="value => applyFilter('status', value)"
        />

        <span class="toolbar__count">
          {{ meta.total }} {{ meta.total === 1 ? 'permiso' : 'permisos' }}
        </span>
      </div>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#FAB21A" indeterminate />
        <span>Cargando permisos...</span>
      </div>

      <div v-else class="table-wrap mt-6">
        <table class="permit-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>No. empleado</th>
              <th>Tipo</th>
              <th>Turno</th>
              <th>Periodo</th>
              <th>Días</th>
              <th>Estatus</th>
              <th>Firmas</th>
              <th class="th-actions">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="permit in permits" :key="String(permit.id)">
              <td>{{ permit.id }}</td>

              <td>
                {{ permit.employee?.name ?? 'Sin empleado' }}

                <v-chip
                  v-if="isOwnPermit(permit)"
                  class="ml-1"
                  color="#c89215"
                  size="x-small"
                  variant="tonal"
                >
                  Tuyo
                </v-chip>
              </td>

              <td>{{ permit.employee?.employeeNumber || '—' }}</td>
              <td>{{ kindLabel(permit.kind) }}</td>
              <td>{{ shiftLabel(permit.shift) }}</td>
              <td>{{ formatDate(permit.startsOn) }} — {{ formatDate(permit.endsOn) }}</td>
              <td>{{ permit.dayCount || '—' }}</td>

              <td>
                <v-chip :color="statusColor(permit.latestStatus)" size="small" variant="tonal">
                  {{ statusLabel(permit.latestStatus) }}
                </v-chip>
              </td>

              <td>
                <v-chip
                  :color="signatureChip(permit).color"
                  size="small"
                  variant="tonal"
                >
                  {{ signatureChip(permit).text }}
                </v-chip>
              </td>

              <td class="td-actions">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="openDetail(permit)"
                >
                  Ver detalle
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="permits.length === 0" class="empty-hint">
          No hay permisos por autorizar.
        </div>
      </div>

      <div v-if="meta.lastPage > 1" class="pagination">
        <v-pagination
          :length="meta.lastPage"
          :model-value="meta.currentPage"
          rounded="circle"
          total-visible="7"
          @update:model-value="setPage"
        />
      </div>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="820" scrollable>
      <v-card>
        <v-card-title class="pt-6 pb-2">
          Permiso F011A #{{ selectedPermit?.id }}
        </v-card-title>

        <v-card-text v-if="selectedPermit">
          <div class="detail-meta mb-4">
            <v-chip :color="statusColor(selectedPermit.latestStatus)" size="small" variant="tonal">
              {{ statusLabel(selectedPermit.latestStatus) }}
            </v-chip>

            <span class="text-body-2 text-medium-emphasis ml-2">
              {{ selectedPermit.employee?.name ?? 'Sin empleado' }} ·
              #{{ selectedPermit.employee?.employeeNumber || 'N/A' }}
            </span>
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Tipo de permiso"
                :model-value="kindLabel(selectedPermit.kind)"
                readonly
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                density="comfortable"
                label="Turno"
                :model-value="shiftLabel(selectedPermit.shift)"
                readonly
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Fecha de solicitud"
                :model-value="formatDate(selectedPermit.requestDate)"
                readonly
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Primer día"
                :model-value="formatDate(selectedPermit.startsOn)"
                readonly
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Último día"
                :model-value="formatDate(selectedPermit.endsOn)"
                readonly
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                density="comfortable"
                label="Días"
                :model-value="String(selectedPermit.dayCount || '—')"
                readonly
                variant="outlined"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <SignaturePanel
            :key="String(selectedPermit.id)"
            :document-id="selectedPermit.id"
            :is-owner="isOwnPermit(selectedPermit)"
            resource="leave-permits"
            @signed="onPermitSigned"
          />

          <p class="detail-note mt-4">
            El permiso queda autorizado cuando se completan las firmas requeridas; no se resuelve
            desde aquí con un botón aparte.
          </p>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="closeDetail">
            Cerrar
          </v-btn>

          <v-btn
            v-if="selectedPermit"
            prepend-icon="mdi-file-pdf-box"
            variant="text"
            @click="downloadPdf(selectedPermit.id)"
          >
            Formato PDF
          </v-btn>

          <v-btn
            v-if="selectedPermit"
            prepend-icon="mdi-open-in-new"
            :to="`/sps/permisos/${selectedPermit.id}`"
            variant="text"
          >
            Ver detalle completo
          </v-btn>

          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      color="success"
      location="top"
      :timeout="3500"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { LeavePermit, LeavePermitFilters } from '@/modules/leave-permits/port'
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import { useLeavePermits } from '@/modules/leave-permits/useLeavePermits'
  import SignaturePanel from '@/modules/sps/components/SignaturePanel.vue'
  import { useAuthStore } from '@/stores/auth'
  import { isSameId } from '@/utils/identity'

  const authStore = useAuthStore()

  const {
    clearError,
    downloadPdf,
    error,
    filters,
    loading,
    loadPermits,
    meta,
    permits,
    setFilters,
    setPage,
  } = useLeavePermits()

  const KIND_OPTIONS = [
    { title: 'Económico', value: 'economic' },
    { title: 'No económico', value: 'non_economic' },
  ]

  const STATUS_OPTIONS = [
    { title: 'Pendiente', value: 'pending' },
    { title: 'Autorizado', value: 'authorized' },
    { title: 'Rechazado', value: 'refused' },
  ]

  const canFilterAll = computed(() => authStore.isAdmin || authStore.hasPermission('sps.permit.filter'))

  const detailDialog = ref(false)
  const selectedPermit = ref<LeavePermit | null>(null)

  const snackbar = ref(false)
  const snackbarText = ref('')

  const searchInput = ref('')
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  // A supervisor's own permit can surface here too, and nobody holds two roles
  // on one document: the signature panel needs to know so it offers the
  // employee block instead of the supervisor one.
  const ownEmployeeId = ref<number | string | null>(null)

  function isOwnPermit (permit: LeavePermit) {
    return isSameId(permit.employeeId, ownEmployeeId.value)
  }

  // The progress object is what the list carries; when the endpoint omits it
  // the count is all there is to report, so the chip says that much rather than
  // claiming a signature is or is not pending.
  function signatureChip (permit: LeavePermit) {
    const { isComplete, pendingRoles, signedRoles } = permit.signatureProgress

    if (isComplete) {
      return { color: 'success', text: 'Completa' }
    }

    if (pendingRoles.includes('immediate_supervisor') && !isOwnPermit(permit)) {
      return { color: 'warning', text: 'Pendiente de tu firma' }
    }

    if (pendingRoles.length > 0) {
      return { color: 'info', text: `${signedRoles.length} de ${signedRoles.length + pendingRoles.length}` }
    }

    return { color: 'default', text: `${permit.signedRoleCount} firma(s)` }
  }

  function formatDate (value: string) {
    if (!value) return '—'

    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const date = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(value)

    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-MX')
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

  async function loadOwnEmployee () {
    const userId = authStore.user?.id
    if (!userId) return

    try {
      const employee = await employeesAdapter.getByUserId(userId)
      ownEmployeeId.value = employee?.id ?? null
    } catch {
      // A supervisor may have no employee record of their own; a failed lookup
      // just means none of these permits is theirs.
      ownEmployeeId.value = null
    }
  }

  function openDetail (permit: LeavePermit) {
    selectedPermit.value = permit
    detailDialog.value = true
  }

  function closeDetail () {
    detailDialog.value = false
    selectedPermit.value = null
  }

  // The last required signature flips the permit to `authorized` on its own, so
  // the row behind the dialog is stale until the list is refetched.
  async function onPermitSigned () {
    snackbarText.value = 'Firma registrada.'
    snackbar.value = true

    await loadPermits()

    if (selectedPermit.value) {
      const refreshed = permits.value.find(permit => permit.id === selectedPermit.value?.id)
      if (refreshed) {
        selectedPermit.value = refreshed
      }
    }
  }

  onMounted(() => {
    void loadPermits()
    void loadOwnEmployee()
  })

  onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
  })
</script>

<style scoped>
.authorization-page {
  display: grid;
}

.authorization-card {
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
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 8px 0 0;
  color: #000000;
  font-size: 1.6rem;
  font-weight: 800;
}

.card-subtitle {
  margin: 8px 0 0;
  color: #5e5e5e;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.toolbar__search {
  max-width: 320px;
}

.toolbar__select {
  max-width: 200px;
}

.toolbar__count {
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
  min-height: 160px;
  color: #5e5e5e;
}

.table-wrap {
  overflow-x: auto;
}

.permit-table {
  width: 100%;
  font-size: 0.95rem;
  border-collapse: collapse;
}

.permit-table th,
.permit-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgb(0 0 0 / 0.08);
  text-align: left;
  vertical-align: middle;
}

.permit-table th {
  color: #6f5a60;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.detail-note {
  color: #5e5e5e;
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }

  .toolbar__search,
  .toolbar__select {
    max-width: none;
    width: 100%;
  }

  .toolbar__count {
    margin-inline-start: 0;
  }
}
</style>
