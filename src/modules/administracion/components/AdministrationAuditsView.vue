<template>
  <div class="audits-page">
    <!-- Header -->
    <div class="module-header">
      <div class="header-content">
        <h1>Auditoría</h1>
        <p>Historial de cambios en los registros del sistema: quién hizo qué, cuándo y desde dónde.</p>
      </div>

      <div class="header-icon">
        <v-icon color="#ffffff" icon="mdi-history" size="32" />
      </div>
    </div>

    <!-- Alert de Error -->
    <v-alert
      v-if="error"
      closable
      color="error"
      icon="mdi-alert-circle-outline"
      variant="tonal"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <!-- Filtros -->
    <v-card class="filters-card" rounded="xl">
      <v-card-text class="pa-6">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              clearable
              hide-details
              placeholder="Buscar por valores, usuario o id..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @update:model-value="onSearchInput"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="typeFilter"
              clearable
              hide-details
              item-title="label"
              item-value="value"
              :items="auditTypes"
              label="Tipo de registro"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="eventFilter"
              clearable
              hide-details
              :items="eventOptions"
              label="Evento"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-text-field
              v-model="fromDate"
              clearable
              hide-details
              label="Desde"
              type="date"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-text-field
              v-model="toDate"
              clearable
              hide-details
              label="Hasta"
              type="date"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla -->
    <v-card class="audits-card" rounded="xl">
      <v-card-text class="pa-6">
        <div class="list-header mb-6">
          <h3 class="list-title">Bitácora de cambios</h3>
          <span class="list-total">{{ totalAudits }} registro{{ totalAudits === 1 ? '' : 's' }}</span>
        </div>

        <div v-if="loading" class="loading-container">
          <v-progress-circular color="primary" indeterminate size="50" />
        </div>

        <div v-else>
          <v-data-table
            class="audits-table"
            :headers="headers"
            item-value="id"
            :items="audits"
            :items-per-page="-1"
          >
            <template #item.created_at="{ item }">
              <span class="nowrap">{{ formatDate(item.created_at) }}</span>
            </template>

            <template #item.user="{ item }">
              <div v-if="item.user" class="user-cell">
                <div class="user-name">{{ item.user.name }}</div>
                <div class="user-email">{{ item.user.email }}</div>
              </div>

              <span v-else class="system-user">Sistema</span>
            </template>

            <template #item.event="{ item }">
              <v-chip :color="eventColor(item.event)" label size="small">
                {{ eventLabel(item.event) }}
              </v-chip>
            </template>

            <template #item.auditable="{ item }">
              <span class="nowrap">{{ item.auditable_label }} #{{ item.auditable_id }}</span>
            </template>

            <template #item.changes="{ item }">
              <div class="changes-cell">{{ changesSummary(item) }}</div>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-eye-outline"
                size="small"
                variant="text"
                @click="viewAudit(item)"
              />
            </template>

            <template #no-data>
              <div class="no-data">No hay cambios registrados con los filtros actuales.</div>
            </template>

            <template #bottom />
          </v-data-table>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="pagination-container mt-4">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              @update:model-value="handlePageChange"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Detalle -->
    <v-dialog v-model="showAuditDetail" max-width="820">
      <v-card v-if="selectedAudit" rounded="xl">
        <v-card-text class="pa-6">
          <div class="audit-detail">
            <div class="detail-grid">
              <div class="detail-field">
                <span class="detail-label">Registro</span>
                <span class="detail-value">{{ selectedAudit.auditable_label }} #{{ selectedAudit.auditable_id }}</span>
              </div>

              <div class="detail-field">
                <span class="detail-label">Evento</span>

                <span>
                  <v-chip :color="eventColor(selectedAudit.event)" label size="small">
                    {{ eventLabel(selectedAudit.event) }}
                  </v-chip>
                </span>
              </div>

              <div class="detail-field">
                <span class="detail-label">Fecha</span>
                <span class="detail-value">{{ formatDate(selectedAudit.created_at) }}</span>
              </div>

              <div class="detail-field">
                <span class="detail-label">Usuario</span>

                <span class="detail-value">
                  {{ selectedAudit.user ? `${selectedAudit.user.name} (${selectedAudit.user.email})` : 'Sistema' }}
                </span>
              </div>

              <div class="detail-field">
                <span class="detail-label">Dirección IP</span>
                <span class="detail-value">{{ selectedAudit.ip_address ?? '—' }}</span>
              </div>

              <div class="detail-field detail-field--wide">
                <span class="detail-label">URL</span>
                <span class="detail-value detail-value--break">{{ selectedAudit.url ?? '—' }}</span>
              </div>
            </div>

            <v-divider class="my-4" />

            <span class="detail-label">Cambios</span>

            <v-table class="changes-table" density="compact">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Anterior</th>
                  <th>Nuevo</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="field in changedFields(selectedAudit)" :key="field">
                  <td class="field-name">{{ field }}</td>
                  <td class="field-value field-value--old">{{ formatValue(asRecord(selectedAudit.old_values)[field]) }}</td>
                  <td class="field-value field-value--new">{{ formatValue(asRecord(selectedAudit.new_values)[field]) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn color="primary" @click="showAuditDetail = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import type { AuditItem, AuditValues } from '@/modules/administracion/services/auditService'
  import { onMounted, ref, watch } from 'vue'
  import { useAudits } from '@/modules/administracion/hooks/useAudits'

  const {
    audits,
    auditTypes,
    loading,
    error,
    currentPage,
    totalPages,
    totalAudits,
    perPage,
    fetchAudits,
    fetchAuditTypes,
    clearError,
  } = useAudits()

  const searchQuery = ref('')
  const typeFilter = ref<string | null>(null)
  const eventFilter = ref<string | null>(null)
  const fromDate = ref<string | null>(null)
  const toDate = ref<string | null>(null)

  const selectedAudit = ref<AuditItem | null>(null)
  const showAuditDetail = ref(false)

  const headers = [
    { title: 'Fecha', key: 'created_at', sortable: false },
    { title: 'Usuario', key: 'user', sortable: false },
    { title: 'Evento', key: 'event', sortable: false },
    { title: 'Registro', key: 'auditable', sortable: false },
    { title: 'Cambios', key: 'changes', sortable: false },
    { title: '', key: 'actions', sortable: false, width: '56px' },
  ]

  const eventOptions = [
    { title: 'Creación', value: 'created' },
    { title: 'Actualización', value: 'updated' },
    { title: 'Eliminación', value: 'deleted' },
    { title: 'Restauración', value: 'restored' },
  ]

  const eventLabels: Record<string, string> = {
    created: 'Creación',
    updated: 'Actualización',
    deleted: 'Eliminación',
    restored: 'Restauración',
  }

  const eventColors: Record<string, string> = {
    created: 'success',
    updated: 'info',
    deleted: 'error',
    restored: 'warning',
  }

  function eventLabel (event: string) {
    return eventLabels[event] ?? event
  }

  function eventColor (event: string) {
    return eventColors[event] ?? 'default'
  }

  function formatDate (date: string) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function asRecord (values: AuditValues): Record<string, unknown> {
    return values && !Array.isArray(values) && typeof values === 'object' ? values : {}
  }

  function changedFields (item: AuditItem) {
    return Array.from(new Set([
      ...Object.keys(asRecord(item.old_values)),
      ...Object.keys(asRecord(item.new_values)),
    ]))
  }

  function changesSummary (item: AuditItem) {
    const fields = changedFields(item)

    if (fields.length === 0) {
      return '—'
    }

    const preview = fields.slice(0, 3).join(', ')

    return fields.length > 3 ? `${preview} y ${fields.length - 3} más` : preview
  }

  function formatValue (value: unknown) {
    if (value === null || value === undefined) {
      return '—'
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  function viewAudit (audit: AuditItem) {
    selectedAudit.value = audit
    showAuditDetail.value = true
  }

  async function loadAudits (page = 1) {
    await fetchAudits({
      page,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      type: typeFilter.value || undefined,
      event: eventFilter.value || undefined,
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
    })
  }

  let searchTimeout: ReturnType<typeof setTimeout> | undefined

  function onSearchInput () {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => loadAudits(1), 400)
  }

  watch([typeFilter, eventFilter, fromDate, toDate], () => loadAudits(1))

  async function handlePageChange (page: number) {
    await loadAudits(page)
  }

  onMounted(async () => {
    await Promise.all([
      fetchAuditTypes().catch(() => undefined),
      loadAudits(1),
    ])
  })
</script>

<style scoped>
.audits-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(61 44 0 / 0.08) 0%, rgb(250 178 26 / 0.12) 100%);
  border-radius: 16px;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
}

.header-content p {
  margin: 8px 0 0;
  color: #5e5e5e;
  font-size: 0.95rem;
  max-width: 640px;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3d2c00;
  flex-shrink: 0;
}

.filters-card,
.audits-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.list-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #000000;
}

.list-total {
  color: #5e5e5e;
  font-size: 0.85rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.audits-table {
  border-radius: 8px;
}

.nowrap {
  white-space: nowrap;
}

.user-cell {
  display: grid;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: #000000;
  font-size: 0.9rem;
}

.user-email {
  color: #5e5e5e;
  font-size: 0.75rem;
}

.system-user {
  color: #999;
  font-style: italic;
}

.changes-cell {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
  font-size: 0.9rem;
}

.no-data {
  padding: 24px;
  text-align: center;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: center;
}

.audit-detail {
  display: grid;
  gap: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-field {
  display: grid;
  gap: 4px;
}

.detail-field--wide {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.8rem;
  color: #5e5e5e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.detail-value {
  font-size: 0.95rem;
  color: #000000;
  font-weight: 600;
}

.detail-value--break {
  word-break: break-all;
  font-weight: 400;
}

.changes-table {
  border: 1px solid rgb(0 0 0 / 0.08);
  border-radius: 8px;
}

.field-name {
  font-weight: 600;
  color: #000000;
  white-space: nowrap;
}

.field-value {
  word-break: break-word;
  font-size: 0.9rem;
}

.field-value--old {
  color: #b3261e;
}

.field-value--new {
  color: #1b5e20;
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .changes-cell {
    max-width: 180px;
  }
}
</style>
