<template>
  <div class="reports-page">
    <v-alert v-if="error" rounded="xl" type="error" variant="tonal">{{ error }}</v-alert>

    <div v-if="loading" class="reports-loading">
      <v-progress-circular indeterminate size="40" />
    </div>

    <template v-else-if="reports">
      <div class="stats-grid">
        <v-card v-for="stat in totalCards" :key="stat.label" class="stat-card" rounded="xl">
          <v-card-text>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          </v-card-text>
        </v-card>
      </div>

      <div class="reports-grid">
        <v-card rounded="xl">
          <v-card-text>
            <h2 class="card-title">Abiertas por etapa</h2>

            <div v-for="stage in reports.by_stage" :key="stage.stage_id" class="bar-row">
              <span class="bar-name">{{ stage.name }}</span>

              <v-progress-linear
                :color="stage.color ?? '#1a1a1a'"
                height="10"
                :model-value="maxStage ? (stage.total / maxStage) * 100 : 0"
                rounded
              />

              <span class="bar-total">{{ stage.total }}</span>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="xl">
          <v-card-text>
            <h2 class="card-title">Por canal de comunicación</h2>

            <div v-for="(total, channel) in reports.by_channel" :key="channel" class="bar-row">
              <span class="bar-name">{{ channelLabel(String(channel)) }}</span>

              <v-progress-linear
                color="#1a1a1a"
                height="10"
                :model-value="maxChannel ? (total / maxChannel) * 100 : 0"
                rounded
              />

              <span class="bar-total">{{ total }}</span>
            </div>

            <p v-if="Object.keys(reports.by_channel).length === 0" class="empty-text">Sin datos.</p>
          </v-card-text>
        </v-card>

        <v-card class="assignee-card" rounded="xl">
          <v-card-text>
            <h2 class="card-title">Por responsable</h2>

            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Responsable</th>
                  <th class="text-right">Negociaciones</th>
                  <th class="text-right">Ganadas</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="row in reports.by_assignee" :key="row.user_id">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ row.total }}</td>
                  <td class="text-right">{{ row.won }}</td>
                </tr>

                <tr v-if="reports.by_assignee.length === 0">
                  <td class="empty-text" colspan="3">Sin asignaciones registradas.</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import type { CrmReports } from '@/modules/crm/types'
  import { computed, onMounted, ref } from 'vue'
  import { getReports } from '@/modules/crm/service'

  const reports = ref<CrmReports | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const maxStage = computed(() => Math.max(...(reports.value?.by_stage.map(stage => stage.total) ?? [0]), 1))
  const maxChannel = computed(() => Math.max(...Object.values(reports.value?.by_channel ?? {}), 1))

  const totalCards = computed(() => reports.value
    ? [
      { label: 'Abiertas', value: reports.value.totals.open, color: '#1565c0' },
      { label: 'Sin asignar', value: reports.value.totals.unassigned_open, color: '#e65100' },
      { label: 'Ganadas', value: reports.value.totals.won, color: '#2e7d32' },
      { label: 'Perdidas', value: reports.value.totals.lost, color: '#c62828' },
      { label: 'Ganadas este mes', value: reports.value.totals.won_this_month, color: '#2e7d32' },
      {
        label: 'Resolución promedio',
        value: reports.value.avg_resolution_days === null ? '—' : `${reports.value.avg_resolution_days} días`,
        color: '#1a1a1a',
      },
    ]
    : [])

  function channelLabel (channel: string) {
    switch (channel) {
      case 'contact_form': {
        return 'Formulario de contacto'
      }
      case 'whatsapp': {
        return 'WhatsApp'
      }
      case 'email': {
        return 'Correo electrónico'
      }
      default: {
        return 'Registro manual'
      }
    }
  }

  onMounted(async () => {
    loading.value = true

    try {
      reports.value = await getReports()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar los reportes'
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reports-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5);
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  margin-top: 4px;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  align-items: start;
}

.assignee-card {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 16px;
}

.bar-row {
  display: grid;
  grid-template-columns: 150px 1fr 36px;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.bar-name {
  font-size: 12px;
}

.bar-total {
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}

.empty-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}
</style>
