<template>
  <v-card rounded="xl" class="status-card">
    <v-card-text class="pa-6">
      <div class="status-header">
        <h3 class="status-title">Estado de Provisioning</h3>
        <v-chip
          :color="statusChipColor"
          :text-color="statusChipTextColor"
          label
          size="small"
        >
          {{ translateStatus(student.status) }}
        </v-chip>
      </div>

      <div class="student-info mt-4">
        <div class="info-row">
          <span class="info-label">Matrícula:</span>
          <span class="info-value">{{ student.matricula }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email Institucional:</span>
          <span class="info-value">{{ student.institutional_email }}</span>
        </div>
      </div>

      <!-- Timeline de pasos -->
      <div class="provisioning-timeline mt-6">
        <div
          v-for="(step, index) in student.provisioning_steps"
          :key="step.step"
          class="timeline-item"
        >
          <!-- Línea conectora -->
          <div
            v-if="index < student.provisioning_steps.length - 1"
            class="timeline-line"
            :class="{ completed: isStepCompleted(step.status) }"
          />

          <!-- Paso -->
          <div class="step-container">
            <div class="step-indicator" :class="step.status">
              <v-icon
                :icon="getStepIcon(step.status)"
                size="24"
                color="white"
              />
            </div>
            <div class="step-details">
              <h4 class="step-name">{{ getStepLabel(step.step) }}</h4>
              <p class="step-status">{{ getStepStatusLabel(step.status) }}</p>
              <p v-if="step.error" class="step-error">
                Error: {{ step.error }}
              </p>
              <p v-if="step.completed_at" class="step-date">
                Completado: {{ formatDate(step.completed_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="status-actions mt-6">
        <v-btn
          :loading="loading"
          color="primary"
          size="small"
          variant="outlined"
          @click="refreshStatus"
        >
          <v-icon left>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { StudentStatus } from '../services/studentService'

  interface Props {
    student: StudentStatus
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
  })

  const emit = defineEmits<{
    'refresh': []
  }>()

  const statusChipColor = computed(() => {
    switch (props.student.status) {
      case 'active':
        return '#4caf50'
      case 'pending':
        return '#2196f3'
      case 'suspended':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  })

  const statusChipTextColor = computed(() => '#ffffff')

  function translateStatus (status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      active: 'Activo',
      suspended: 'Suspendido',
    }
    return translations[status] || status
  }

  function getStepLabel (step: string): string {
    const labels: Record<string, string> = {
      microsoft_365: 'Microsoft 365',
      active_directory: 'Active Directory',
      activation: 'Activación',
      credential_sheet: 'Hoja de Credenciales',
    }
    return labels[step] || step
  }

  function getStepStatusLabel (status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando...',
      completed: 'Completado',
      failed: 'Error',
    }
    return labels[status] || status
  }

  function getStepIcon (status: string): string {
    switch (status) {
      case 'completed':
        return 'mdi-check-circle'
      case 'processing':
        return 'mdi-clock-outline'
      case 'failed':
        return 'mdi-alert-circle'
      default:
        return 'mdi-circle-outline'
    }
  }

  function isStepCompleted (status: string): boolean {
    return status === 'completed'
  }

  function formatDate (dateString: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  function refreshStatus () {
    emit('refresh')
  }
</script>

<style scoped>
.status-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #000000;
}

.student-info {
  display: grid;
  gap: 12px;
  padding: 16px;
  background: rgb(250 178 26 / 0.04);
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.info-label {
  color: #5e5e5e;
  font-weight: 600;
  font-size: 0.9rem;
}

.info-value {
  color: #000000;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.provisioning-timeline {
  display: grid;
  gap: 24px;
  padding: 20px;
  background: rgb(0 0 0 / 0.02);
  border-radius: 12px;
}

.timeline-item {
  position: relative;
}

.timeline-line {
  position: absolute;
  left: 12px;
  top: 48px;
  width: 2px;
  height: calc(100% + 24px);
  background: rgb(0 0 0 / 0.1);
  transition: background 0.2s ease;
}

.timeline-line.completed {
  background: #4caf50;
}

.step-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.step-indicator {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.step-indicator.pending {
  background: #2196f3;
}

.step-indicator.processing {
  background: #ff9800;
}

.step-indicator.completed {
  background: #4caf50;
}

.step-indicator.failed {
  background: #f44336;
}

.step-details {
  flex: 1;
  padding: 12px 0;
}

.step-name {
  margin: 0;
  font-weight: 700;
  color: #000000;
  font-size: 0.95rem;
}

.step-status {
  margin: 4px 0 0;
  color: #5e5e5e;
  font-size: 0.85rem;
}

.step-error {
  margin: 4px 0 0;
  color: #f44336;
  font-size: 0.85rem;
}

.step-date {
  margin: 4px 0 0;
  color: #5e5e5e;
  font-size: 0.8rem;
}

.status-actions {
  display: flex;
  gap: 12px;
}
</style>
