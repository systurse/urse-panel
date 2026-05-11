<template>
  <v-card class="solicitudes-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Seguimiento</div>
        <h2 class="card-title">Mis solicitudes</h2>
      </div>
      <div class="card-head-actions">
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

    <div v-if="loading && tickets.length === 0" class="solicitudes-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando tus solicitudes...</span>
    </div>

    <div v-else-if="!loading && tickets.length === 0" class="solicitudes-state solicitudes-state--empty">
      <v-icon color="#FAB21A" icon="mdi-inbox-outline" size="32" />
      <span>No tienes solicitudes de servicio registradas.</span>
    </div>

    <v-table v-else class="mt-6" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">Folio</th>
          <th class="text-left">Título</th>
          <th class="text-left">Equipo / Área</th>
          <th class="text-left">Técnico</th>
          <th class="text-left">Estado</th>
          <th class="text-center">Detalle</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ticket in tickets" :key="ticket.id">
          <td class="ticket-folio">#{{ ticket.folio ?? ticket.id }}</td>
          <td class="ticket-title">{{ ticket.title }}</td>
          <td>
            <div v-if="ticket.descripcion_equipo" class="text-sm">{{ ticket.descripcion_equipo }}</div>
            <div v-if="ticket.area_atencion" class="text-muted text-xs">{{ ticket.area_atencion }}</div>
          </td>
          <td>{{ ticket.assigned_user_name ?? '—' }}</td>
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
            <v-btn
              color="#FAB21A"
              density="comfortable"
              icon="mdi-eye-outline"
              size="small"
              variant="text"
              @click="openDetail(ticket)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Detail dialog -->
    <v-dialog v-model="detailDialog" max-width="640" scrollable>
      <v-card v-if="selectedTicket" rounded="xl">
        <v-card-title class="pt-6 px-6 dialog-title">
          <span>{{ selectedTicket.title }}</span>
          <v-chip
            class="ml-3"
            :color="statusColor(selectedTicket.status)"
            density="comfortable"
            label
            size="small"
          >
            {{ selectedTicket.status_label }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle class="px-6 pb-0">
          Folio #{{ selectedTicket.folio ?? selectedTicket.id }}
          <span v-if="selectedTicket.tipo_servicio"> · {{ selectedTicket.tipo_servicio }}</span>
        </v-card-subtitle>

        <v-card-text class="px-6 pt-4">
          <!-- Progress timeline -->
          <div class="timeline mb-6">
            <div
              v-for="step in timelineSteps(selectedTicket)"
              :key="step.label"
              class="timeline-step"
              :class="{ 'timeline-step--done': step.done, 'timeline-step--active': step.active }"
            >
              <div class="timeline-dot">
                <v-icon
                  :color="step.done ? '#FAB21A' : step.active ? '#FAB21A' : '#ccc'"
                  :icon="step.done ? 'mdi-check-circle' : step.active ? 'mdi-circle-slice-8' : 'mdi-circle-outline'"
                  size="20"
                />
              </div>
              <div class="timeline-content">
                <div class="timeline-label" :class="{ 'timeline-label--active': step.done || step.active }">
                  {{ step.label }}
                </div>
                <div v-if="step.date" class="timeline-date">{{ formatDate(step.date) }}</div>
              </div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <!-- Ticket details -->
          <div class="detail-grid">
            <div v-if="selectedTicket.descripcion_equipo" class="detail-item">
              <div class="detail-label">Equipo</div>
              <div class="detail-value">{{ selectedTicket.descripcion_equipo }}</div>
            </div>
            <div v-if="selectedTicket.area_atencion" class="detail-item">
              <div class="detail-label">Área</div>
              <div class="detail-value">{{ selectedTicket.area_atencion }}</div>
            </div>
            <div v-if="selectedTicket.assigned_user_name" class="detail-item">
              <div class="detail-label">Técnico asignado</div>
              <div class="detail-value">{{ selectedTicket.assigned_user_name }}</div>
            </div>
            <div v-if="selectedTicket.tipo_servicio" class="detail-item">
              <div class="detail-label">Tipo de servicio</div>
              <div class="detail-value">{{ selectedTicket.tipo_servicio }}</div>
            </div>
          </div>

          <template v-if="selectedTicket.reporte_usuario">
            <div class="detail-block mt-4">
              <div class="detail-label">Reporte del usuario</div>
              <p class="detail-text">{{ selectedTicket.reporte_usuario }}</p>
            </div>
          </template>

          <template v-if="selectedTicket.diagnostico">
            <div class="detail-block mt-4">
              <div class="detail-label">Diagnóstico</div>
              <p class="detail-text">{{ selectedTicket.diagnostico }}</p>
            </div>
          </template>

          <template v-if="selectedTicket.solucion">
            <div class="detail-block mt-4">
              <div class="detail-label">Solución aplicada</div>
              <p class="detail-text">{{ selectedTicket.solucion }}</p>
            </div>
          </template>

          <template v-if="selectedTicket.recomendaciones">
            <div class="detail-block mt-4">
              <div class="detail-label">Recomendaciones</div>
              <p class="detail-text">{{ selectedTicket.recomendaciones }}</p>
            </div>
          </template>

          <div v-if="!selectedTicket.diagnostico && !selectedTicket.solucion" class="detail-pending mt-4">
            <v-icon color="#FAB21A" icon="mdi-wrench-clock" size="18" />
            <span>El diagnóstico y la solución estarán disponibles cuando el técnico complete la revisión.</span>
          </div>

          <template v-if="selectedTicket.verification_url">
            <v-divider class="my-4" />
            <div class="detail-block">
              <div class="detail-label">Orden de servicio firmada</div>
              <a
                :href="selectedTicket.verification_url"
                class="verification-link"
                rel="noopener"
                target="_blank"
              >
                <v-icon icon="mdi-file-sign" size="16" class="mr-1" />
                Ver orden firmada
              </a>
            </div>
          </template>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn variant="flat" @click="detailDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
  import type { ContactTicket, DealStatus } from '@/modules/mytickets/port'
  import { ref } from 'vue'
  import { useMyTickets } from '@/modules/mytickets/useMyTickets'

  const { error, loadTickets, loading, tickets } = useMyTickets()

  const detailDialog = ref(false)
  const selectedTicket = ref<ContactTicket | null>(null)

  function openDetail (ticket: ContactTicket) {
    selectedTicket.value = ticket
    detailDialog.value = true
  }

  function statusColor (status: DealStatus): string {
    const colors: Record<DealStatus, string> = {
      pending: 'default',
      approval_requested: 'warning',
      modifications_requested: 'error',
      approved: 'info',
      signed: 'success',
    }
    return colors[status] ?? 'default'
  }

  interface TimelineStep {
    label: string
    done: boolean
    active: boolean
    date: string | null
  }

  function timelineSteps (ticket: ContactTicket): TimelineStep[] {
    const statusOrder: DealStatus[] = [
      'pending',
      'approval_requested',
      'modifications_requested',
      'approved',
      'signed',
    ]
    const currentIndex = statusOrder.indexOf(ticket.status)

    return [
      {
        label: 'Solicitud registrada',
        done: true,
        active: false,
        date: ticket.synced_at,
      },
      {
        label: 'En revisión por técnico',
        done: currentIndex >= statusOrder.indexOf('approval_requested'),
        active: ticket.status === 'pending',
        date: null,
      },
      {
        label: 'Pendiente de aprobación',
        done: currentIndex >= statusOrder.indexOf('approved'),
        active: ticket.status === 'approval_requested',
        date: ticket.approval_requested_at,
      },
      {
        label: 'Orden firmada',
        done: ticket.status === 'signed',
        active: ticket.status === 'approved',
        date: ticket.signed_at,
      },
    ]
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
.solicitudes-card {
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

.solicitudes-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.solicitudes-state--empty {
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

.text-muted {
  color: #6f5a60;
}

.status-chip {
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Dialog */
.dialog-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 1.1rem;
  font-weight: 800;
  color: #000;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  padding-bottom: 16px;
}

.timeline-step:not(:last-child) .timeline-dot::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 22px;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}

.timeline-step--done:not(:last-child) .timeline-dot::after {
  background: #fab21a;
}

.timeline-dot {
  position: relative;
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-content {
  padding-top: 1px;
}

.timeline-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #bbb;
}

.timeline-label--active {
  color: #000;
}

.timeline-date {
  font-size: 0.75rem;
  color: #6f5a60;
  margin-top: 2px;
}

/* Detail sections */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fab21a;
}

.detail-value {
  font-size: 0.9rem;
  color: #222;
}

.detail-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.detail-pending {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fffbf0;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #6f5a60;
}

.verification-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1976d2;
  text-decoration: none;
}

.verification-link:hover {
  text-decoration: underline;
}

@media (max-width: 960px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
