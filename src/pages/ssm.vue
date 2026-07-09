<template>
  <div class="ssm-page">
    <!-- Header con información del módulo -->
    <div class="module-header">
      <div class="header-content">
        <h1>SSM</h1>
        <p>Sistema de Servicios y Mantenimiento</p>
      </div>
      <div class="header-icon" style="background-color: #1a1a1a">
        <v-icon color="white" icon="mdi-toolbox-outline" size="32" />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Órdenes de trabajo</div>
          <div class="stat-value">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ totalCount }}</template>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">En progreso</div>
          <div class="stat-value">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ inProgressCount }}</template>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Completadas</div>
          <div class="stat-value">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ completedCount }}</template>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Error de carga -->
    <v-alert
      v-if="error"
      class="error-alert"
      rounded="xl"
      type="error"
      variant="tonal"
    >
      {{ error }}
    </v-alert>

    <!-- Listados -->
    <div class="lists-grid" :class="{ 'lists-grid--single': !isAdmin }">
      <!-- Cola de aprobaciones (solo admins) -->
      <v-card v-if="isAdmin" class="module-card" rounded="xl">
        <v-card-text>
          <div class="card-header">
            <div>
              <h2 class="card-title">Cola de aprobaciones</h2>
              <p class="card-subtitle">Órdenes pendientes de firma digital.</p>
            </div>
            <v-btn
              append-icon="mdi-arrow-right"
              color="#1a1a1a"
              size="small"
              to="/ssm/aprobaciones"
              variant="text"
            >Ver todas</v-btn>
          </div>

          <div v-if="loading" class="list-state">
            <v-progress-circular indeterminate size="32" />
          </div>
          <div v-else-if="approvalQueue.length === 0" class="list-state">
            <v-icon color="#9e9e9e" icon="mdi-check-decagram-outline" size="40" />
            <p>No hay aprobaciones pendientes.</p>
          </div>
          <v-list v-else class="ticket-list" density="comfortable">
            <v-list-item
              v-for="deal in approvalQueue"
              :key="deal.id"
              class="ticket-item"
              to="/ssm/aprobaciones"
            >
              <template #prepend>
                <v-avatar color="#fff3cd" rounded="lg" size="40">
                  <v-icon color="#856404" icon="mdi-draw-pen" />
                </v-avatar>
              </template>
              <v-list-item-title class="ticket-title">{{ deal.title || `Orden #${deal.id}` }}</v-list-item-title>
              <v-list-item-subtitle class="ticket-subtitle">
                {{ deal.assigned_user_name || deal.assigned_user_email || 'Sin responsable' }}
                <span v-if="deal.approval_requested_at"> · {{ formatDate(deal.approval_requested_at) }}</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Últimos tickets -->
      <v-card class="module-card" rounded="xl">
        <v-card-text>
          <div class="card-header">
            <div>
              <h2 class="card-title">Últimos tickets</h2>
              <p class="card-subtitle">
                {{ isAdmin ? 'Órdenes recientes de todo el equipo.' : 'Tus órdenes más recientes.' }}
              </p>
            </div>
            <v-btn
              append-icon="mdi-arrow-right"
              color="#1a1a1a"
              size="small"
              to="/ssm/tickets"
              variant="text"
            >Ver todos</v-btn>
          </div>

          <div v-if="loading" class="list-state">
            <v-progress-circular indeterminate size="32" />
          </div>
          <div v-else-if="latestTickets.length === 0" class="list-state">
            <v-icon color="#9e9e9e" icon="mdi-inbox-outline" size="40" />
            <p>Aún no hay tickets registrados.</p>
          </div>
          <v-list v-else class="ticket-list" density="comfortable">
            <v-list-item
              v-for="deal in latestTickets"
              :key="deal.id"
              class="ticket-item"
              to="/ssm/tickets"
            >
              <template #prepend>
                <v-avatar :color="statusColor(deal.status).bg" rounded="lg" size="40">
                  <v-icon :color="statusColor(deal.status).fg" :icon="statusIcon(deal.status)" />
                </v-avatar>
              </template>
              <v-list-item-title class="ticket-title">{{ deal.title || `Orden #${deal.id}` }}</v-list-item-title>
              <v-list-item-subtitle class="ticket-subtitle">
                <v-chip
                  :color="statusColor(deal.status).fg"
                  density="compact"
                  size="x-small"
                  variant="tonal"
                >{{ deal.status_label || deal.status }}</v-chip>
                <span v-if="deal.synced_at"> · {{ formatDate(deal.synced_at) }}</span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { DealStatus, LocalDeal } from '@/modules/tickets/port'
  import { computed } from 'vue'
  import { useTickets } from '@/modules/tickets/useTickets'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const isAdmin = computed(() => authStore.isAdmin)

  const { tickets, loading, error, onlyMine } = useTickets()

  // Los administradores ven el panorama global; el resto solo sus tickets.
  if (authStore.isAdmin) {
    onlyMine.value = false
  }

  const totalCount = computed(() => tickets.value.length)
  const completedCount = computed(
    () => tickets.value.filter(ticket => ticket.status === 'signed').length,
  )
  const inProgressCount = computed(() => totalCount.value - completedCount.value)

  function timeOf (deal: LocalDeal): number {
    const value = deal.synced_at ?? deal.approval_requested_at ?? deal.signed_at
    return value ? new Date(value).getTime() : 0
  }

  const latestTickets = computed(() =>
    [...tickets.value].sort((a, b) => timeOf(b) - timeOf(a)).slice(0, 5),
  )

  const approvalQueue = computed(() =>
    tickets.value
      .filter(deal => deal.status === 'approval_requested')
      .slice()
      .sort((a, b) => {
        const aTime = a.approval_requested_at ? new Date(a.approval_requested_at).getTime() : 0
        const bTime = b.approval_requested_at ? new Date(b.approval_requested_at).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5),
  )

  const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  function formatDate (value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return dateFormatter.format(date)
  }

  type StatusPalette = { bg: string, fg: string }

  function statusColor (status: DealStatus): StatusPalette {
    switch (status) {
      case 'signed': {
        return { bg: '#e6f4ea', fg: '#1e7e34' }
      }
      case 'approved': {
        return { bg: '#e3f2fd', fg: '#1565c0' }
      }
      case 'approval_requested': {
        return { bg: '#fff3cd', fg: '#856404' }
      }
      case 'modifications_requested': {
        return { bg: '#fde2e1', fg: '#b3261e' }
      }
      default: {
        return { bg: '#ececec', fg: '#424242' }
      }
    }
  }

  function statusIcon (status: DealStatus): string {
    switch (status) {
      case 'signed': {
        return 'mdi-check-decagram'
      }
      case 'approved': {
        return 'mdi-check-circle-outline'
      }
      case 'approval_requested': {
        return 'mdi-draw-pen'
      }
      case 'modifications_requested': {
        return 'mdi-pencil-circle-outline'
      }
      default: {
        return 'mdi-ticket-outline'
      }
    }
  }
</script>

<style scoped>
.ssm-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(26 26 26 / 0.08) 0%, transparent 100%);
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
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, 1fr);
}

.stat-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.stat-label {
  color: #5e5e5e;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 8px;
}

.stat-value {
  color: #000000;
  font-size: 2rem;
  font-weight: 800;
  min-height: 38px;
  display: flex;
  align-items: center;
}

.error-alert {
  margin: 0;
}

.lists-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
}

.lists-grid--single {
  grid-template-columns: 1fr;
}

.module-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #000000;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #5e5e5e;
  font-size: 0.85rem;
}

.list-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 16px;
  text-align: center;
  color: #5e5e5e;
  font-size: 0.9rem;
}

.list-state p {
  margin: 0;
}

.ticket-list {
  background: transparent;
  padding: 0;
}

.ticket-item {
  border-radius: 12px;
  margin-bottom: 4px;
}

.ticket-title {
  font-weight: 600;
  color: #1a1a1a;
}

.ticket-subtitle {
  color: #5e5e5e;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .lists-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .module-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
