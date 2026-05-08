<template>
  <v-card class="reservation-card" rounded="lg">
    <v-card-item>
      <div class="card-header">
        <div class="reservation-info">
          <h4 class="equipment-name">{{ reservation.equipmentName }}</h4>
          <span class="reservation-id">ID: {{ reservation.id }}</span>
        </div>
        <v-chip
          :color="statusColor"
          label
          size="small"
          :text-color="statusTextColor"
        >
          {{ reservation.status }}
        </v-chip>
      </div>
    </v-card-item>

    <v-divider />

    <v-card-text>
      <div class="reservation-details">
        <div class="detail-row">
          <span class="detail-label">Solicitante:</span>
          <span class="detail-value">{{ reservation.requester }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha:</span>
          <span class="detail-value">{{ formatDate(reservation.date) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hora:</span>
          <span class="detail-value">{{ reservation.startTime }} - {{ reservation.endTime }}</span>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="card-actions">
      <v-btn
        color="primary"
        size="small"
        variant="text"
      >
        Ver detalles
      </v-btn>
      <v-spacer />
      <v-btn
        color="error"
        icon="mdi-delete-outline"
        size="small"
        variant="text"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Reservation {
    id: string
    equipmentName: string
    requester: string
    status: 'active' | 'pending' | 'completed' | 'cancelled'
    date: string
    startTime: string
    endTime: string
  }

  const props = defineProps<{
    reservation: Reservation
  }>()

  const statusColor = computed(() => {
    const colors: Record<string, string> = {
      active: '#FAB21A',
      pending: '#2196f3',
      completed: '#4caf50',
      cancelled: '#f44336',
    }
    return colors[props.reservation.status] || '#9e9e9e'
  })

  const statusTextColor = computed(() => {
    return props.reservation.status === 'active' ? '#000000' : '#ffffff'
  })

  function formatDate (dateString: string) {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }
</script>

<style scoped>
.reservation-card {
  transition: all 0.2s ease;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.reservation-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.reservation-info {
  flex: 1;
}

.equipment-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #000000;
}

.reservation-id {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #5e5e5e;
}

.reservation-details {
  display: grid;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-label {
  color: #5e5e5e;
  font-size: 0.85rem;
  font-weight: 500;
}

.detail-value {
  color: #000000;
  font-size: 0.9rem;
  font-weight: 600;
}

.card-actions {
  padding: 12px 16px;
}
</style>
