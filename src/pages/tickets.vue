<template>
  <v-card class="tickets-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Órdenes de servicio</div>
        <h2 class="card-title">{{ onlyMine ? 'Mis tickets' : 'Todos los tickets' }}</h2>
      </div>
      <div class="card-head-actions">
        <v-switch
          v-model="onlyMine"
          color="#FAB21A"
          density="compact"
          hide-details
          label="Mostrar solo mis tickets"
          @update:model-value="loadTickets"
        />
        <v-btn
          color="#FAB21A"
          prepend-icon="mdi-refresh"
          variant="tonal"
          :loading="loading"
          @click="loadTickets"
        >
          Actualizar
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="error"
      class="mt-6"
      closable
      color="error"
      density="comfortable"
      variant="tonal"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <div v-if="loading && tickets.length === 0" class="tickets-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando tickets...</span>
    </div>

    <div v-else-if="!loading && tickets.length === 0" class="tickets-state tickets-state--empty">
      <v-icon color="#FAB21A" icon="mdi-ticket-outline" size="32" />
      <span>{{ onlyMine ? 'No tienes tickets asignados.' : 'No hay tickets registrados.' }}</span>
    </div>

    <v-table v-else class="mt-6" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">Folio</th>
          <th class="text-left">Título</th>
          <th class="text-left">Equipo / Área</th>
          <th class="text-left">Solicitante</th>
          <th class="text-left">Estado</th>
          <th class="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ticket in tickets" :key="ticket.id">
          <td class="ticket-folio">#{{ ticket.folio ?? ticket.id }}</td>
          <td class="ticket-title">{{ ticket.title }}</td>
          <td>
            <div v-if="ticket.descripcion_equipo" class="text-sm">{{ ticket.descripcion_equipo }}</div>
            <div v-if="ticket.area_atencion" class="text-grey text-xs">{{ ticket.area_atencion }}</div>
          </td>
          <td>{{ ticket.contact_name ?? '—' }}</td>
          <td>
            <v-chip
              class="status-chip"
              :color="statusColor(ticket.status)"
              density="comfortable"
              label
              size="small"
            >
              {{ ticket.status_label }}
            </v-chip>
          </td>
          <td class="text-center">
            <div class="action-group">
              <v-btn
                v-if="ticket.status === 'pending'"
                color="#FAB21A"
                density="comfortable"
                :loading="requestingId === ticket.id"
                prepend-icon="mdi-send-check-outline"
                size="small"
                variant="tonal"
                @click="confirmApproval(ticket)"
              >
                Solicitar aprobación
              </v-btn>

              <!-- Modifications requested actions -->
              <template v-if="ticket.status === 'modifications_requested'">
                <v-btn
                  color="error"
                  density="comfortable"
                  prepend-icon="mdi-message-alert-outline"
                  size="small"
                  variant="tonal"
                  @click="openModificationsDialog(ticket)"
                >
                  Ver modificaciones
                </v-btn>
                <v-btn
                  color="info"
                  density="comfortable"
                  :loading="syncingId === ticket.id"
                  prepend-icon="mdi-cloud-sync-outline"
                  size="small"
                  variant="tonal"
                  @click="syncFromBitrix(ticket.id)"
                >
                  Sincronizar
                </v-btn>
                <v-btn
                  color="#FAB21A"
                  density="comfortable"
                  :loading="requestingId === ticket.id"
                  prepend-icon="mdi-send-check-outline"
                  size="small"
                  variant="tonal"
                  @click="confirmApproval(ticket)"
                >
                  Re-solicitar aprobación
                </v-btn>
              </template>

              <v-btn
                v-if="ticket.can_download"
                color="success"
                density="comfortable"
                :loading="downloadingId === ticket.id"
                prepend-icon="mdi-file-download-outline"
                size="small"
                variant="tonal"
                @click="downloadSigned(ticket.id, ticket.title)"
              >
                Descargar firmada
              </v-btn>

              <v-chip
                v-if="ticket.status === 'approval_requested'"
                color="warning"
                density="comfortable"
                prepend-icon="mdi-clock-outline"
                size="small"
                variant="tonal"
              >
                Pendiente de firma
              </v-chip>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Confirm approval dialog -->
    <v-dialog v-model="approvalDialog" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6">Solicitar aprobación</v-card-title>
        <v-card-text class="px-6">
          ¿Deseas solicitar la aprobación de la orden <strong>{{ selectedTicket?.title }}</strong>?
          Se enviará un correo al encargado para su firma.
        </v-card-text>
        <v-card-actions class="px-6 pb-6 gap-2">
          <v-spacer />
          <v-btn variant="text" @click="approvalDialog = false">Cancelar</v-btn>
          <v-btn
            color="#FAB21A"
            :loading="requestingId !== null"
            variant="flat"
            @click="confirmRequestApproval"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modification requests history dialog -->
    <v-dialog v-model="modificationsDialog" max-width="540">
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6">Historial de modificaciones</v-card-title>
        <v-card-subtitle class="px-6 pb-2">
          {{ modificationsTicket?.title }}
        </v-card-subtitle>
        <v-card-text class="px-6">
          <div
            v-if="!modificationsTicket?.modification_requests?.length"
            class="text-medium-emphasis text-body-2"
          >
            Sin historial de modificaciones.
          </div>
          <div v-else class="modifications-list">
            <div
              v-for="(mod, index) in modificationsTicket!.modification_requests"
              :key="mod.id"
              class="modification-entry"
            >
              <div class="modification-header">
                <v-icon color="error" icon="mdi-close-circle-outline" size="18" />
                <span class="modification-who">{{ mod.requested_by_name ?? 'Encargado' }}</span>
                <span class="modification-when">{{ formatDate(mod.created_at) }}</span>
                <v-chip
                  v-if="index === 0"
                  color="error"
                  density="comfortable"
                  size="x-small"
                  variant="tonal"
                >
                  Más reciente
                </v-chip>
              </div>
              <p class="modification-notes">{{ mod.notes }}</p>
              <v-divider v-if="index < modificationsTicket!.modification_requests!.length - 1" class="my-3" />
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn variant="flat" @click="modificationsDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
  import type { LocalDeal } from '@/modules/tickets/port'
  import { ref } from 'vue'
  import { useTickets } from '@/modules/tickets/useTickets'

  const {
    downloadingId,
    downloadSigned,
    error,
    loadTickets,
    loading,
    onlyMine,
    requestApproval,
    requestingId,
    syncFromBitrix,
    syncingId,
    tickets,
  } = useTickets()

  const approvalDialog = ref(false)
  const selectedTicket = ref<LocalDeal | null>(null)

  const modificationsDialog = ref(false)
  const modificationsTicket = ref<LocalDeal | null>(null)

  function confirmApproval (ticket: LocalDeal) {
    selectedTicket.value = ticket
    approvalDialog.value = true
  }

  async function confirmRequestApproval () {
    if (!selectedTicket.value) return
    await requestApproval(selectedTicket.value.id)
    approvalDialog.value = false
    selectedTicket.value = null
  }

  function openModificationsDialog (ticket: LocalDeal) {
    modificationsTicket.value = ticket
    modificationsDialog.value = true
  }

  function statusColor (status: LocalDeal['status']): string {
    const colors: Record<LocalDeal['status'], string> = {
      pending: 'default',
      approval_requested: 'warning',
      modifications_requested: 'error',
      approved: 'info',
      signed: 'success',
    }
    return colors[status] ?? 'default'
  }

  function formatDate (value: string): string {
    return new Date(value).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</script>

<style scoped>
.tickets-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-head-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.section-kicker {
  color: #fab21a;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.tickets-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.tickets-state--empty {
  flex-direction: column;
}

.ticket-folio {
  color: #fab21a;
  font-weight: 700;
  white-space: nowrap;
}

.ticket-title {
  font-weight: 600;
  max-width: 260px;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-chip {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.gap-2 {
  gap: 8px;
}

.modifications-list {
  display: flex;
  flex-direction: column;
}

.modification-entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.modification-who {
  font-weight: 700;
  font-size: 0.9rem;
}

.modification-when {
  font-size: 0.8rem;
  color: #5e5e5e;
}

.modification-notes {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

@media (max-width: 960px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-head-actions {
    width: 100%;
  }
}
</style>
