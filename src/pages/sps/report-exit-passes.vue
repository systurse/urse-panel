<template>
  <v-card class="report-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">SPS</div>
        <h2 class="card-title">Reporte de pases de salida</h2>
        <p class="card-subtitle">Búsqueda, filtrado y exportación para análisis.</p>
      </div>
      <v-btn
        color="#c89215"
        :loading="exporting"
        prepend-icon="mdi-file-excel-outline"
        variant="flat"
        @click="exportReport"
      >
        Exportar Excel (CSV)
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

    <v-row class="mt-2" dense>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="filters.search"
          clearable
          label="Buscar"
          placeholder="correo, no. empleado, nombre o apellidos"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filters.status"
          clearable
          :items="statusOptions"
          label="Estatus"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model="filters.usage_date_from"
          label="Fecha inicial"
          type="date"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model="filters.usage_date_to"
          label="Fecha final"
          type="date"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filters.per_page"
          :items="perPageOptions"
          label="Registros"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <div class="filters-actions">
      <v-btn :loading="loading" variant="text" @click="resetFilters">
        Limpiar filtros
      </v-btn>
      <v-spacer />
      <v-btn color="#c89215" :loading="loading" variant="flat" @click="applyFilters">
        Buscar
      </v-btn>
    </div>

    <div v-if="loading" class="state-box">
      <v-progress-circular color="#c89215" indeterminate />
      <span>Cargando reporte...</span>
    </div>

    <div v-else class="table-wrap">
      <table class="report-table">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>No. empleado</th>
            <th>Fecha uso</th>
            <th>Motivo</th>
            <th>Estatus</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="String(row.id)">
            <td>{{ row.employee_name }}</td>
            <td>{{ row.employee_number || '—' }}</td>
            <td>{{ formatDate(row.usage_date) }}</td>
            <td>{{ reasonLabel(row.reason) }}</td>
            <td>{{ statusLabel(row.status) }}</td>
            <td>{{ row.calculated_duration || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="rows.length === 0" class="empty-state">
        No hay resultados con los filtros seleccionados.
      </div>
    </div>

    <div class="pagination-row">
      <span class="text-caption text-medium-emphasis">
        Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }}
      </span>
      <v-spacer />
      <v-btn
        :disabled="pagination.current_page <= 1 || loading"
        size="small"
        variant="text"
        @click="changePage(pagination.current_page - 1)"
      >
        Anterior
      </v-btn>
      <span class="text-caption">Página {{ pagination.current_page }} / {{ pagination.last_page }}</span>
      <v-btn
        :disabled="pagination.current_page >= pagination.last_page || loading"
        size="small"
        variant="text"
        @click="changePage(pagination.current_page + 1)"
      >
        Siguiente
      </v-btn>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
  import type { AxiosError } from 'axios'
  import { onMounted, ref } from 'vue'
  import { http } from '@/services/http'

  interface ExitPassRow {
    id: number | string
    employee_name: string
    employee_number: string
    usage_date: string
    reason: string
    status: string
    calculated_duration: string
  }

  interface PaginationMeta {
    current_page: number
    last_page: number
    from: number
    to: number
    total: number
  }

  interface ExitPassListResponse {
    data?: unknown[]
    meta?: {
      current_page?: number
      last_page?: number
      from?: number
      to?: number
      total?: number
    }
    current_page?: number
    last_page?: number
    from?: number
    to?: number
    total?: number
  }

  const loading = ref(false)
  const exporting = ref(false)
  const errorMessage = ref<string | null>(null)
  const rows = ref<ExitPassRow[]>([])
  const pagination = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
  })

  const statusOptions = [
    'pending',
    'revision',
    'authorized',
    'refused',
  ]

  const perPageOptions = [
    10,
    15,
    20,
    50,
    100,
  ]

  const filters = ref({
    search: '',
    status: '',
    usage_date_from: '',
    usage_date_to: '',
    per_page: 15,
  })

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
    return crypto.randomUUID()
  }

  function mapRow (item: unknown): ExitPassRow {
    const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const employee = (record.employee && typeof record.employee === 'object' ? record.employee : {}) as Record<string, unknown>
    const latestStatus = (record.latestStatus && typeof record.latestStatus === 'object' ? record.latestStatus : {}) as Record<string, unknown>

    return {
      id: readId(record, 'id'),
      employee_name:
        readString(employee, 'full_name', 'name')
        || `${readString(employee, 'first_name')} ${readString(employee, 'last_name')} ${readString(employee, 'second_last_name')}`.replace(/\s+/g, ' ').trim()
        || 'Sin nombre',
      employee_number: readString(employee, 'employee_number'),
      usage_date: readString(record, 'usage_date'),
      reason: readString(record, 'reason'),
      status: readString(latestStatus, 'status') || readString(record, 'latest_status', 'status'),
      calculated_duration: readString(record, 'calculated_duration'),
    }
  }

  function getParams (page = 1) {
    const params: Record<string, string | number> = {
      page,
      per_page: Math.min(Math.max(Number(filters.value.per_page) || 15, 1), 100),
    }

    if (filters.value.search.trim()) params.search = filters.value.search.trim()
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.usage_date_from) params.usage_date_from = filters.value.usage_date_from
    if (filters.value.usage_date_to) params.usage_date_to = filters.value.usage_date_to

    return params
  }

  function parsePagination (response: ExitPassListResponse) {
    const meta = response.meta ?? response
    pagination.value = {
      current_page: Number(meta.current_page ?? 1),
      last_page: Number(meta.last_page ?? 1),
      from: Number(meta.from ?? 0),
      to: Number(meta.to ?? 0),
      total: Number(meta.total ?? 0),
    }
  }

  async function loadReport (page = 1) {
    loading.value = true
    errorMessage.value = null

    try {
      const response = await http.get<ExitPassListResponse>('/api/v1/exit-passes', {
        params: getParams(page),
      })

      const payload = response.data
      const data = Array.isArray(payload.data) ? payload.data : []
      rows.value = data.map(item => mapRow(item))
      parsePagination(payload)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible cargar el reporte.')
    } finally {
      loading.value = false
    }
  }

  async function exportReport () {
    exporting.value = true
    errorMessage.value = null

    try {
      const params = getParams(1)
      delete params.page
      delete params.per_page

      const response = await http.get('/api/v1/exit-passes/export', {
        params,
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-pases-salida-${new Date().toISOString().slice(0, 10)}.xls`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible exportar el reporte.')
    } finally {
      exporting.value = false
    }
  }

  function applyFilters () {
    void loadReport(1)
  }

  function resetFilters () {
    filters.value = {
      search: '',
      status: '',
      usage_date_from: '',
      usage_date_to: '',
      per_page: 15,
    }
    void loadReport(1)
  }

  function changePage (page: number) {
    if (page < 1 || page > pagination.value.last_page) return
    void loadReport(page)
  }

  function formatDate (value: string) {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('es-MX')
  }

  function humanizeEnum (value: string) {
    if (!value) return '—'
    return value.replaceAll('_', ' ')
  }

  function reasonLabel (reason: string) {
    if (reason === 'personal') return 'Personal'
    if (reason === 'employee_imss_medical_visit') return 'Cita médica IMSS empleado'
    if (reason === 'official') return 'Oficial'
    return humanizeEnum(reason)
  }

  function statusLabel (status: string) {
    if (status === 'pending') return 'Pendiente'
    if (status === 'revision') return 'En revisión'
    if (status === 'authorized') return 'Autorizado'
    if (status === 'refused') return 'Rechazado'
    return humanizeEnum(status)
  }

  onMounted(() => {
    void loadReport(1)
  })
</script>

<style scoped>
.report-card {
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
}

.card-subtitle {
  margin: 8px 0 0;
  color: #5e5e5e;
}

.filters-actions {
  display: flex;
  align-items: center;
  margin: 4px 0 12px;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  gap: 12px;
  color: #5e5e5e;
}

.table-wrap {
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.report-table th,
.report-table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgb(0 0 0 / 0.08);
  text-align: left;
}

.report-table th {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: #6f5a60;
}

.empty-state {
  text-align: center;
  color: #5e5e5e;
  padding: 20px 8px;
}

.pagination-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
