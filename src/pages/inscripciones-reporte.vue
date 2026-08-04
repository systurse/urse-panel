<template>
  <div class="report-page">
    <!-- Alert de Error -->
    <v-alert
      v-if="error"
      class="mb-6"
      closable
      color="error"
      icon="mdi-alert-circle-outline"
      variant="tonal"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <!-- Stats Cards -->
    <v-row class="stats-row mb-8">
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="xl" class="stat-card">
          <v-card-text class="pa-6">
            <div class="stat-value">{{ stats?.total || 0 }}</div>
            <div class="stat-label">Total de Estudiantes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="xl" class="stat-card stat-pending">
          <v-card-text class="pa-6">
            <div class="stat-value">{{ stats?.by_status?.pending || 0 }}</div>
            <div class="stat-label">Pendiente</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="xl" class="stat-card stat-active">
          <v-card-text class="pa-6">
            <div class="stat-value">{{ stats?.by_status?.active || 0 }}</div>
            <div class="stat-label">Activo</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="xl" class="stat-card stat-suspended">
          <v-card-text class="pa-6">
            <div class="stat-value">{{ stats?.by_status?.suspended || 0 }}</div>
            <div class="stat-label">Suspendido</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="xl" class="stat-card stat-retrieved">
          <v-card-text class="pa-6">
            <div class="stat-value">{{ stats?.credentials_retrieved || 0 }}</div>
            <div class="stat-label">Credenciales Consultadas</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row class="charts-row">
      <v-col cols="12" md="6">
        <v-card rounded="xl" class="chart-card">
          <v-card-text class="pa-6">
            <h3 class="chart-title">Distribución por Carrera</h3>
            <div v-if="stats?.by_career" class="chart-container">
              <canvas ref="careerChartRef" />
            </div>
            <div v-else class="loading-placeholder">
              <v-progress-circular indeterminate color="primary" size="50" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card rounded="xl" class="chart-card">
          <v-card-text class="pa-6">
            <h3 class="chart-title">Distribución por Estado</h3>
            <div v-if="stats?.by_status" class="chart-container">
              <canvas ref="statusChartRef" />
            </div>
            <div v-else class="loading-placeholder">
              <v-progress-circular indeterminate color="primary" size="50" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Connection Status -->
    <div class="connection-status" :class="{ connected: isConnected }">
      <v-icon small>{{ isConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
      <span>{{ isConnected ? 'Conectado' : 'Desconectado' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch, nextTick } from 'vue'
  import {
    Chart as ChartJS,
    PieController,
    ArcElement,
    Tooltip,
    Legend,
  } from 'chart.js'
  import { useReport } from '@/modules/students/hooks/useReport'
  import { listenToStudentRegistered, type StudentRegisteredEvent } from '@/services/websocket'

  ChartJS.register(PieController, ArcElement, Tooltip, Legend)

  const {
    stats,
    error,
    fetchStats,
    updateStats,
    addStudent,
    clearError,
  } = useReport()

  const careerChartRef = ref<HTMLCanvasElement | null>(null)
  const statusChartRef = ref<HTMLCanvasElement | null>(null)
  const isConnected = ref(false)
  let careerChartInstance: ChartJS | null = null
  let statusChartInstance: ChartJS | null = null

  function renderCareerChart () {
    if (!stats.value?.by_career || !careerChartRef.value) return
    try {
      const labels = Object.keys(stats.value.by_career)
      const data = Object.values(stats.value.by_career)
      if (labels.length === 0 || data.length === 0) return

      if (careerChartInstance) {
        try { careerChartInstance.destroy() } catch {}
        careerChartInstance = null
      }

      const colors = [
        'rgba(255, 193, 7, 0.8)',
        'rgba(33, 150, 243, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(244, 67, 54, 0.8)',
        'rgba(156, 39, 176, 0.8)',
        'rgba(255, 87, 34, 0.8)',
      ]

      const ctx = careerChartRef.value?.getContext('2d')
      if (ctx) {
        careerChartInstance = new ChartJS(ctx, {
          type: 'pie',
          data: {
            labels,
            datasets: [{ data, backgroundColor: colors.slice(0, data.length), borderColor: '#fff', borderWidth: 2 }],
          },
          options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' as const } } } as any,
        })
      }
    } catch {}
  }

  function renderStatusChart () {
    if (!stats.value?.by_status || !statusChartRef.value) return
    try {
      const { pending, active, suspended } = stats.value.by_status

      if (statusChartInstance) {
        try { statusChartInstance.destroy() } catch {}
        statusChartInstance = null
      }

      const ctx = statusChartRef.value?.getContext('2d')
      if (ctx) {
        statusChartInstance = new ChartJS(ctx, {
          type: 'pie',
          data: {
            labels: ['Pendiente', 'Activo', 'Suspendido'],
            datasets: [{
              data: [pending, active, suspended],
              backgroundColor: ['rgba(255, 193, 7, 0.8)', 'rgba(76, 175, 80, 0.8)', 'rgba(244, 67, 54, 0.8)'],
              borderColor: '#fff',
              borderWidth: 2,
            }],
          },
          options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' as const } } } as any,
        })
      }
    } catch {}
  }

  watch(stats, async (newVal) => {
    if (newVal) {
      await nextTick()
      renderCareerChart()
      renderStatusChart()
    }
  })

  onMounted(async () => {
    try {
      await fetchStats()

      try {
        listenToStudentRegistered((event: StudentRegisteredEvent) => {
          addStudent({
            id: event.student.id,
            matricula: event.student.matricula,
            name: event.student.name,
            first_last_name: '',
            second_last_name: '',
            career: event.student.career,
            status: event.student.status,
            institutional_email: '',
            personal_email: null,
            created_at: new Date().toISOString(),
          })
          updateStats(event.stats)
        })
        isConnected.value = true
      } catch (err) {
        console.error('Error conectando a WebSocket:', err)
      }
    } catch (err) {
      console.error('Error cargando reporte:', err)
    }
  })
</script>

<style scoped>
.report-page {
  display: grid;
  gap: 24px;
}

.stats-row { gap: 16px; }

.stat-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
}

.stat-label {
  font-size: 0.85rem;
  color: #5e5e5e;
  margin-top: 8px;
  font-weight: 600;
}

.stat-pending .stat-value { color: #ff9800; }
.stat-active .stat-value { color: #4caf50; }
.stat-suspended .stat-value { color: #f44336; }
.stat-retrieved .stat-value { color: #2196f3; }

.charts-row { gap: 16px; }

.chart-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.chart-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #000000;
}

.chart-container {
  margin-top: 16px;
  position: relative;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container canvas {
  max-height: 350px;
  max-width: 100%;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 350px;
}

.connection-status {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #5e5e5e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.connection-status.connected {
  background: #c8e6c9;
  color: #2e7d32;
}

@media (max-width: 768px) {
  .report-page { gap: 16px; }
  .stats-row { gap: 12px; }
  .stat-value { font-size: 1.5rem; }
  .stat-label { font-size: 0.75rem; }
  .chart-container { height: 250px; }
  .chart-title { font-size: 1rem; }
  .connection-status { bottom: 16px; right: 16px; font-size: 0.75rem; padding: 8px 12px; }
}

@media (max-width: 480px) {
  .report-page { gap: 12px; }
  .stats-row { gap: 8px; }
  .stat-card { padding: 8px !important; }
  .stat-value { font-size: 1.25rem; }
  .stat-label { font-size: 0.65rem; }
  .charts-row { gap: 8px; }
  .chart-container { height: 200px; }
  .chart-title { font-size: 0.9rem; }
  .connection-status { bottom: 12px; right: 12px; font-size: 0.65rem; padding: 6px 10px; }
}
</style>
