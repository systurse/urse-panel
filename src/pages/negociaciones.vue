<template>
  <v-card class="deals-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Bitrix24 CRM</div>
        <h2 class="card-title">Negociaciones en proceso</h2>
      </div>
      <v-btn
        color="#FAB21A"
        :loading="loading"
        prepend-icon="mdi-refresh"
        variant="tonal"
        @click="loadDeals"
      >
        Actualizar
      </v-btn>
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

    <div v-if="loading && deals.length === 0" class="deals-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando negociaciones...</span>
    </div>

    <div v-else-if="!loading && deals.length === 0" class="deals-state deals-state--empty">
      <v-icon color="#FAB21A" icon="mdi-briefcase-off-outline" size="32" />
      <span>No hay negociaciones en proceso.</span>
    </div>

    <v-table v-else class="mt-6" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Título</th>
          <th class="text-left">Fecha de creación</th>
          <th class="text-left">Usuario asignado</th>
          <th class="text-left">Solicitante</th>
          <th class="text-center">Orden de servicio</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="deal in deals" :key="deal.id">
          <td class="deal-id">#{{ deal.id }}</td>
          <td class="deal-title">{{ deal.title }}</td>
          <td class="deal-date">{{ formatDate(deal.created_at) }}</td>
          <td>
            <div v-if="deal.assigned_user" class="user-chip">
              <v-avatar color="#f1ddd0" size="28">
                {{ initials(deal.assigned_user.name) }}
              </v-avatar>
              <span>{{ deal.assigned_user.name }}</span>
            </div>
            <span v-else class="text-grey">Sin asignar</span>
          </td>
          <td>
            <span v-if="deal.contact">{{ deal.contact.name }}</span>
            <span v-else class="text-grey">Sin contacto</span>
          </td>
          <td class="text-center">
            <v-btn
              color="#FAB21A"
              density="comfortable"
              :loading="generatingId === deal.id"
              prepend-icon="mdi-file-pdf-box"
              size="small"
              variant="flat"
              @click="generateServiceOrder(deal.id, deal.title)"
            >
              Generar orden
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script lang="ts" setup>
  import { useDeals } from '@/modules/deals/useDeals'

  const { deals, error, generateServiceOrder, generatingId, loadDeals, loading } = useDeals()

  function formatDate (value: string | null): string {
    if (!value) return '—'
    return new Date(value).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function initials (name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('')
  }
</script>

<style scoped>
.deals-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.deals-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.deals-state--empty {
  flex-direction: column;
}

.deal-id {
  color: #fab21a;
  font-weight: 700;
  white-space: nowrap;
}

.deal-title {
  font-weight: 600;
  max-width: 260px;
}

.deal-date {
  white-space: nowrap;
  color: #5e5e5e;
  font-size: 0.85rem;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 960px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
