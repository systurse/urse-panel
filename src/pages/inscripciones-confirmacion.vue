<template>
  <div class="confirmation-page">
    <!-- Toast de Éxito -->
    <v-snackbar
      v-model="showSuccess"
      :timeout="5000"
      color="success"
      location="top"
    >
      <div class="success-toast">
        <v-icon class="me-2">mdi-check-circle</v-icon>
        <span>{{ successMessage }}</span>
      </div>
    </v-snackbar>

    <!-- Header -->
    <div class="module-header">
      <div class="header-content">
        <h1>Registro Completado</h1>
        <p>Estudiante registrado exitosamente</p>
      </div>
      <div class="header-icon" style="background-color: #00a86b">
        <v-icon icon="mdi-check-circle" size="32" color="white" />
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="confirmation-content">
      <!-- Alerta de Éxito -->
      <v-alert
        color="success"
        icon="mdi-check-circle-outline"
        variant="tonal"
        class="mb-8"
      >
        <template #title>
          ¡Estudiante registrado exitosamente!
        </template>
        <p class="mb-0">
          La cuenta está siendo provisionada. El alumno podrá acceder dentro de 24 horas.
        </p>
      </v-alert>

      <v-row class="confirm-row">
        <!-- QR de Credenciales -->
        <v-col cols="12" md="6">
          <StudentActivationQR
            v-if="credentialSheetUrl"
            :credential-sheet-url="credentialSheetUrl"
            class="qr-column"
          />
        </v-col>

        <!-- Datos del Estudiante -->
        <v-col cols="12" md="6">
          <v-card rounded="xl" class="confirmation-card">
            <v-card-text class="pa-6">
              <h3 class="confirmation-title mb-4">Datos del Estudiante</h3>
              <v-row class="confirmation-grid">
                <v-col cols="12">
                  <div class="confirmation-field">
                    <span class="field-label">Matrícula</span>
                    <span class="field-value">{{ registeredStudent?.matricula }}</span>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="confirmation-field">
                    <span class="field-label">Usuario SERVO</span>
                    <span class="field-value">{{ registeredStudent?.servo_username }}</span>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="confirmation-field">
                    <span class="field-label">Nombre</span>
                    <span class="field-value">{{ registeredStudent?.name }}</span>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="confirmation-field">
                    <span class="field-label">Apellido Paterno</span>
                    <span class="field-value">{{ registeredStudent?.first_last_name }}</span>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="confirmation-field">
                    <span class="field-label">Apellido Materno</span>
                    <span class="field-value">{{ registeredStudent?.second_last_name }}</span>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-6" />

              <h4 class="credentials-title mb-4">Credenciales de Acceso</h4>
              <v-row class="credentials-grid">
                <v-col cols="12">
                  <div class="credential-field">
                    <span class="credential-label">Email Institucional</span>
                    <div class="credential-value-box">
                      <span class="credential-value">{{ registeredStudent?.institutional_email }}</span>
                      <v-btn
                        icon="mdi-content-copy"
                        size="small"
                        variant="text"
                        @click="copyToClipboard(registeredStudent?.institutional_email)"
                      />
                    </div>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="credential-field">
                    <span class="credential-label">Contraseña WiFi</span>
                    <div class="credential-value-box">
                      <span class="credential-value">{{ registeredStudent?.wifi_password }}</span>
                      <v-btn
                        icon="mdi-content-copy"
                        size="small"
                        variant="text"
                        @click="copyToClipboard(registeredStudent?.wifi_password)"
                      />
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Estado de Provisioning -->
      <StudentProvisioningStatus
        v-if="studentStatus"
        :student="studentStatus"
        :loading="statusLoading"
        @refresh="refreshStudentStatus"
        class="mt-8"
      />

      <!-- Botones de Acción -->
      <div class="action-buttons mt-12">
        <v-btn
          color="primary"
          size="large"
          variant="flat"
          @click="goToNewRegistration"
          class="action-btn-primary"
        >
          <v-icon left>mdi-plus-circle</v-icon>
          Registrar Otro Estudiante
        </v-btn>
        <v-btn
          v-if="!studentStatus || studentStatus.status === 'pending'"
          color="secondary"
          size="large"
          variant="outlined"
          :loading="statusLoading"
          @click="refreshStudentStatus"
        >
          <v-icon left>mdi-refresh</v-icon>
          Actualizar Estado
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useStudent } from '@/modules/students/hooks/useStudent'
  import StudentActivationQR from '@/modules/students/components/StudentActivationQR.vue'
  import StudentProvisioningStatus from '@/modules/students/components/StudentProvisioningStatus.vue'

  const router = useRouter()
  const route = useRoute()

  const {
    registeredStudent,
    credentialSheetUrl,
    successMessage,
    studentStatus,
    loading: statusLoading,
    fetchStudentStatus,
  } = useStudent()

  const showSuccess = ref(false)

  watch(successMessage, (newVal) => {
    if (newVal) {
      showSuccess.value = true
    }
  }, { immediate: true })

  async function refreshStudentStatus () {
    const studentId = parseInt(route.params.studentId as string)
    if (studentId) {
      try {
        await fetchStudentStatus(studentId)
      } catch {
        // El error se maneja en el store
      }
    }
  }

  function goToNewRegistration () {
    router.push('/inscripciones')
  }

  function copyToClipboard (text: string | undefined) {
    if (text) {
      navigator.clipboard.writeText(text)
    }
  }

  onMounted(() => {
    const studentId = parseInt(route.params.studentId as string)
    if (studentId) {
      refreshStudentStatus()

      // Auto-refrescar cada 5 segundos si está pendiente
      const interval = setInterval(() => {
        if (studentStatus?.value?.status === 'pending') {
          refreshStudentStatus()
        } else {
          clearInterval(interval)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  })
</script>

<style scoped>
.confirmation-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(0 168 107 / 0.1) 0%, transparent 100%);
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

.confirmation-content {
  display: grid;
  gap: 24px;
}

.confirm-row {
  gap: 24px;
}

.qr-column {
  height: 100%;
}

.confirmation-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
  height: 100%;
}

.confirmation-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #000000;
}

.confirmation-grid {
  gap: 12px;
}

.confirmation-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.8rem;
  color: #5e5e5e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.field-value {
  font-size: 0.95rem;
  color: #000000;
  font-weight: 700;
}

.credentials-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #000000;
}

.credentials-grid {
  gap: 12px;
}

.credential-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credential-label {
  font-size: 0.85rem;
  color: #5e5e5e;
  font-weight: 600;
}

.credential-value-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgb(250 178 26 / 0.08);
  border: 1px solid rgb(250 178 26 / 0.2);
  border-radius: 8px;
}

.credential-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #000000;
  font-size: 0.9rem;
}

.success-toast {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.95rem;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn-primary {
  min-width: 250px;
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn-primary {
    min-width: 100%;
  }

  .confirmation-grid,
  .credentials-grid {
    grid-template-columns: 1fr;
  }
}
</style>
