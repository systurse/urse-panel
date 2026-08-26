<template>
  <div class="requests-page">
    <v-alert v-if="error" rounded="xl" type="error" variant="tonal">{{ error }}</v-alert>

    <div v-if="loading" class="requests-loading">
      <v-progress-circular indeterminate size="40" />
    </div>

    <p v-else-if="deals.length === 0" class="requests-empty">
      No tienes solicitudes registradas. Puedes levantar una desde el widget de contacto.
    </p>

    <v-card v-for="deal in deals" :key="deal.id" class="request-card" rounded="xl">
      <v-card-text>
        <div class="request-head">
          <div>
            <h2 class="request-title">#{{ deal.id }} — {{ deal.title }}</h2>

            <p class="request-subtitle">
              Solicitada el {{ formatDate(deal.requested_at) }} · Canal: {{ deal.channel_label }}
            </p>
          </div>

          <div class="request-chips">
            <v-chip :color="deal.stage?.color ?? undefined" size="small" variant="tonal">
              {{ deal.stage?.name ?? 'En proceso' }}
            </v-chip>

            <v-chip
              v-if="deal.status !== 'open'"
              :color="deal.status === 'won' ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >{{ deal.status_label }}</v-chip>
          </div>
        </div>

        <p v-if="deal.description" class="request-body">{{ deal.description }}</p>

        <v-alert
          v-if="deal.service_order?.status === 'signed'"
          class="mt-3"
          density="compact"
          rounded="lg"
          type="success"
          variant="tonal"
        >
          Tu orden de servicio {{ deal.service_order.folio }} fue firmada el
          {{ formatDate(deal.service_order.signed_at) }}. La liga de verificación te llegó por correo.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import type { Deal } from '@/modules/crm/types'
  import { onMounted, ref } from 'vue'
  import { listMyRequests } from '@/modules/crm/service'

  const deals = ref<Deal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function formatDate (value: string | null | undefined) {
    return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  }

  onMounted(async () => {
    loading.value = true

    try {
      deals.value = await listMyRequests()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar tus solicitudes'
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.requests-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.requests-empty {
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 40px 0;
}

.request-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.request-title {
  font-size: 15px;
  margin: 0;
}

.request-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin: 4px 0 0;
}

.request-chips {
  display: flex;
  gap: 6px;
}

.request-body {
  font-size: 13px;
  margin: 10px 0 0;
  color: rgba(0, 0, 0, 0.7);
}
</style>
