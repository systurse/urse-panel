<template>
  <div class="ssm-page">
    <div class="module-header">
      <div class="header-content">
        <h1>SSM</h1>
        <p>Sistema de Servicios y Mantenimiento — CRM propio</p>
      </div>

      <div class="header-icon" style="background-color: #1a1a1a">
        <v-icon color="white" icon="mdi-toolbox-outline" size="32" />
      </div>
    </div>

    <div class="stats-grid">
      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Negociaciones abiertas</div>

          <div class="stat-value">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ reports?.totals.open ?? 0 }}</template>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Sin asignar</div>

          <div class="stat-value stat-value--warning">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ reports?.totals.unassigned_open ?? 0 }}</template>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Ganadas este mes</div>

          <div class="stat-value">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ reports?.totals.won_this_month ?? 0 }}</template>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Resolución promedio</div>

          <div class="stat-value">
            <v-progress-circular v-if="loading" indeterminate size="24" width="3" />
            <template v-else>{{ reports?.avg_resolution_days !== null && reports !== null ? `${reports.avg_resolution_days} días` : '—' }}</template>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-alert
      v-if="error"
      class="error-alert"
      rounded="xl"
      type="error"
      variant="tonal"
    >{{ error }}</v-alert>

    <!-- Menú principal: CRM y Tareas y Proyectos -->
    <div class="menu-grid">
      <v-card class="menu-card" rounded="xl" @click="router.push('/ssm/crm')">
        <v-card-text class="menu-card-body">
          <v-icon icon="mdi-view-column-outline" size="40" />

          <div>
            <h2 class="menu-title">CRM</h2>
            <p class="menu-subtitle">Negociaciones del pipeline: tablero kanban, lista y calendario en tiempo real.</p>
          </div>

          <v-icon icon="mdi-arrow-right" />
        </v-card-text>
      </v-card>

      <v-card class="menu-card" rounded="xl" @click="router.push('/ssm/tareas')">
        <v-card-text class="menu-card-body">
          <v-icon icon="mdi-clipboard-check-outline" size="40" />

          <div>
            <h2 class="menu-title">Tareas y Proyectos</h2>
            <p class="menu-subtitle">Crea tareas para agentes y técnicos, organizadas por proyecto.</p>
          </div>

          <v-icon icon="mdi-arrow-right" />
        </v-card-text>
      </v-card>
    </div>

    <v-card v-if="reports" class="stage-card" rounded="xl">
      <v-card-text>
        <h2 class="card-title">Negociaciones abiertas por etapa</h2>

        <div v-for="stage in reports.by_stage" :key="stage.stage_id" class="stage-row">
          <span class="stage-name">{{ stage.name }}</span>

          <v-progress-linear
            class="stage-bar"
            :color="stage.color ?? '#1a1a1a'"
            height="10"
            :model-value="maxStageTotal ? (stage.total / maxStageTotal) * 100 : 0"
            rounded
          />

          <span class="stage-total">{{ stage.total }}</span>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import type { CrmReports } from '@/modules/crm/types'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { getReports } from '@/modules/crm/service'

  const router = useRouter()

  const reports = ref<CrmReports | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const maxStageTotal = computed(() =>
    Math.max(...(reports.value?.by_stage.map(stage => stage.total) ?? [0]), 1),
  )

  onMounted(async () => {
    loading.value = true

    try {
      reports.value = await getReports()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar las estadísticas del CRM'
    } finally {
      loading.value = false
    }
  })
</script>

<style scoped>
.ssm-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content h1 {
  font-size: 28px;
  margin: 0;
}

.header-content p {
  color: rgba(0, 0, 0, 0.55);
  margin: 4px 0 0;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5);
}

.stat-value {
  font-size: 30px;
  font-weight: 800;
  margin-top: 6px;
}

.stat-value--warning {
  color: #e65100;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.menu-card {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.menu-card:hover {
  transform: translateY(-2px);
}

.menu-card-body {
  display: flex;
  align-items: center;
  gap: 18px;
}

.menu-card-body > div {
  flex: 1;
}

.menu-title {
  font-size: 18px;
  margin: 0;
}

.menu-subtitle {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin: 4px 0 0;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 16px;
}

.stage-row {
  display: grid;
  grid-template-columns: 200px 1fr 40px;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.stage-name {
  font-size: 13px;
}

.stage-total {
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}
</style>
