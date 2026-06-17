<template>
  <div class="edit-page">
    <!-- Header -->
    <div class="module-header">
      <div class="header-content">
        <h1>Editar Estudiante</h1>
        <p>Actualizar datos del estudiante registrado</p>
      </div>
      <div class="header-icon" style="background-color: #ff9800">
        <v-icon icon="mdi-account-edit-outline" size="32" color="white" />
      </div>
    </div>

    <!-- Alert de error -->
    <v-alert
      v-if="error"
      class="mb-4"
      closable
      color="error"
      icon="mdi-alert-circle-outline"
      variant="tonal"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Loading inicial -->
    <div v-if="loadingStudent" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="50" />
    </div>

    <!-- Formulario -->
    <v-card v-else rounded="xl" class="edit-card">
      <v-card-text class="pa-6">
        <h3 class="form-title">Datos del Estudiante</h3>
        <p class="form-subtitle">Modifica los campos que desees actualizar</p>

        <v-form ref="formRef" v-model="formValid" class="mt-6">
          <v-row>
            <!-- Apellido Paterno -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.first_last_name"
                label="Apellido Paterno"
                :rules="nameRules"
                :disabled="loading"
                variant="outlined"
              />
            </v-col>

            <!-- Apellido Materno -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.second_last_name"
                label="Apellido Materno"
                :rules="nameRules"
                :disabled="loading"
                variant="outlined"
              />
            </v-col>

            <!-- Nombre -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.name"
                label="Nombre(s)"
                :rules="nameRules"
                :disabled="loading"
                variant="outlined"
              />
            </v-col>

            <!-- Matrícula -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.matricula"
                label="Matrícula"
                :rules="matriculaRules"
                :disabled="loading"
                variant="outlined"
              />
            </v-col>

            <!-- Carrera -->
            <v-col cols="12">
              <v-autocomplete
                v-model="form.career_id"
                label="Carrera/Programa"
                :items="careers"
                item-title="name"
                item-value="id"
                :rules="careerRules"
                :disabled="loading || careersLoading"
                :loading="careersLoading"
                variant="outlined"
                placeholder="Selecciona una carrera"
              />
            </v-col>
          </v-row>

          <div class="form-actions mt-8">
            <v-btn
              variant="outlined"
              size="large"
              @click="router.back()"
            >
              Cancelar
            </v-btn>
            <v-btn
              :disabled="!formValid || loading"
              :loading="loading"
              color="warning"
              size="large"
              variant="flat"
              @click="submitForm"
            >
              Guardar Cambios
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { studentService } from '@/modules/students/services/studentService'
  import { useStudent } from '@/modules/students/hooks/useStudent'

  const route = useRoute()
  const router = useRouter()
  const studentId = Number(route.params.studentId)

  const { careers, careersLoading, loadCareers } = useStudent()

  const formRef = ref()
  const formValid = ref(false)
  const loading = ref(false)
  const loadingStudent = ref(true)
  const error = ref<string | null>(null)

  const form = ref({
    matricula: '',
    name: '',
    first_last_name: '',
    second_last_name: '',
    career_id: '' as string | number,
  })

  const matriculaRules = [
    (v: string) => !!v || 'La matrícula es requerida',
    (v: string) => v.length >= 2 || 'Mínimo 2 caracteres',
  ]

  const nameRules = [
    (v: string) => !!v || 'Este campo es requerido',
    (v: string) => v.length >= 2 || 'Mínimo 2 caracteres',
  ]

  const careerRules = [
    (v: string | number) => !!v || 'La carrera es requerida',
  ]

  function careerIdFromValue (career: any): number | '' {
    if (career == null) return ''
    if (typeof career === 'object' && career.id != null) return Number(career.id)
    if (typeof career === 'string') {
      const match = careers.value.find(c => c.name === career)
      return match ? Number(match.id) : ''
    }
    return Number(career) || ''
  }

  onMounted(async () => {
    try {
      await loadCareers()

      // El API show no devuelve career_id, así que usamos el state del reporte
      // que sí contiene el objeto career completo con id
      const stateStudent = (history.state as any)?.student

      if (stateStudent) {
        form.value.matricula = stateStudent.matricula ?? ''
        form.value.name = stateStudent.name ?? ''
        form.value.first_last_name = stateStudent.first_last_name ?? ''
        form.value.second_last_name = stateStudent.second_last_name ?? ''
        form.value.career_id = careerIdFromValue(stateStudent.career)
      } else {
        // Fallback: API para los campos de texto (career quedará vacío)
        const student = await studentService.getStudent(studentId)
        form.value.matricula = student.matricula ?? ''
        form.value.name = student.name ?? ''
        form.value.first_last_name = student.first_last_name ?? ''
        form.value.second_last_name = student.second_last_name ?? ''
      }
    } catch {
      error.value = 'No se pudo cargar la información del estudiante'
    } finally {
      loadingStudent.value = false
    }
  })

  async function submitForm () {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    loading.value = true
    error.value = null
    try {
      await studentService.updateStudent(studentId, {
        matricula: form.value.matricula,
        name: form.value.name,
        first_last_name: form.value.first_last_name,
        second_last_name: form.value.second_last_name,
        career_id: form.value.career_id,
      })
      router.push('/inscripciones/reporte')
    } catch {
      error.value = 'Error al actualizar el estudiante. Intenta nuevamente.'
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
.edit-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(255 152 0 / 0.1) 0%, transparent 100%);
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
  flex-shrink: 0;
}

.edit-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.form-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #000000;
}

.form-subtitle {
  margin: 8px 0 0;
  color: #5e5e5e;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }
}
</style>
