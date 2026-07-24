<template>
  <v-card rounded="xl" class="registration-card">
    <v-card-text class="pa-6">
      <h3 class="form-title">Registrar Nuevo Estudiante</h3>
      <p class="form-subtitle">Completa los datos para crear la cuenta del alumno</p>

      <!-- Alert de error -->
      <v-alert
        v-if="error"
        class="mb-4"
        closable
        color="error"
        icon="mdi-alert-circle-outline"
        variant="tonal"
        @click:close="clearError"
      >
        {{ error }}
      </v-alert>

      <!-- Formulario -->
      <v-form
        ref="formRef"
        v-model="formValid"
        class="mt-6"
      >
        <v-row>
          <!-- Fila 1: Usuario SERVO -->
          <v-col cols="12">
            <v-text-field
              v-model="form.servo_username"
              label="Nombre de usuario SERVO"
              placeholder="Ej: jperez"
              :rules="usernameRules"
              :disabled="loading"
              variant="outlined"
              hint="Nombre de usuario del sistema SERVO"
            />
          </v-col>

          <!-- Fila 2: Apellido Paterno, Apellido Materno, Nombre -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.first_last_name"
              label="Apellido Paterno"
              placeholder="Pérez"
              :rules="nameRules"
              :disabled="loading"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.second_last_name"
              label="Apellido Materno"
              placeholder="López"
              :rules="nameRules"
              :disabled="loading"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.name"
              label="Nombre(s)"
              placeholder="Juan"
              :rules="nameRules"
              :disabled="loading"
              variant="outlined"
            />
          </v-col>

          <!-- Fila 3: Matrícula y Correo -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.matricula"
              label="Matrícula"
              placeholder="Ej: A123456"
              :rules="matriculaRules"
              :disabled="loading"
              variant="outlined"
              hint="Ingresa la matrícula del alumno"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.personal_email"
              label="Correo personal"
              placeholder="Ej: juan.perez@gmail.com"
              :rules="personalEmailRules"
              :disabled="loading"
              type="email"
              variant="outlined"
              hint="Se usará para enviar las credenciales del alumno"
            />
          </v-col>

          <!-- Carrera -->
          <v-col cols="12">
            <v-autocomplete
              v-model="form.career"
              label="Carrera/Programa"
              :items="careers"
              item-title="name"
              item-value="id"
              :rules="careerRules"
              :disabled="loading || careersLoading"
              :loading="careersLoading"
              variant="outlined"
              hint="Selecciona la carrera del alumno"
              placeholder="Selecciona una carrera"
            />
          </v-col>

          <!-- Info de Contraseña Autogenerada -->
          <v-col cols="12">
            <v-alert
              color="info"
              icon="mdi-information-outline"
              variant="tonal"
            >
              La contraseña será autogenerada siguiendo la política de seguridad de M365
            </v-alert>
          </v-col>
        </v-row>

        <!-- Botones -->
        <div class="form-actions mt-8">
          <v-btn
            :disabled="!formValid || loading"
            :loading="loading"
            color="primary"
            size="large"
            variant="flat"
            @click="submitForm"
          >
            Registrar Estudiante
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { useStudent } from '../hooks/useStudent'

  const emit = defineEmits<{
    'student-registered': [studentId: number]
  }>()

  const { registerStudent, loading, error, clearError, careers, careersLoading, loadCareers } = useStudent()

  watch(careers, (newVal) => {
    console.log('careers updated in component:', newVal)
  }, { immediate: true, deep: true })

  const formRef = ref()
  const formValid = ref(false)

  const form = ref({
    servo_username: '',
    first_last_name: '',
    second_last_name: '',
    name: '',
    matricula: '',
    personal_email: '',
    career: '',
    password: '',
  })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const usernameRules = [
    (v: string) => !!v || 'El usuario SERVO es requerido',
    (v: string) => v.length >= 2 || 'Mínimo 2 caracteres',
  ]

  const matriculaRules = [
    (v: string) => !!v || 'La matrícula es requerida',
    (v: string) => v.length >= 2 || 'La matrícula debe tener al menos 2 caracteres',
  ]

  const careerRules = [
    (v: string | number) => !!v || 'La carrera es requerida',
  ]

  const personalEmailRules = [
    (v: string) => !v || emailRegex.test(v) || 'Ingresa un correo válido',
  ]

  const nameRules = [
    (v: string) => !!v || 'Este campo es requerido',
    (v: string) => v.length >= 2 || 'Mínimo 2 caracteres',
  ]

  onMounted(async () => {
    try {
      await loadCareers()
    } catch {
      // Error manejado en el store
    }
  })

  async function submitForm () {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    try {
      // Generar contraseña automáticamente
      const generatedPassword = generateSecurePassword()

      const response = await registerStudent({
        servo_username: form.value.servo_username,
        first_last_name: form.value.first_last_name,
        second_last_name: form.value.second_last_name,
        name: form.value.name,
        matricula: form.value.matricula,
        personal_email: form.value.personal_email || undefined,
        career_id: form.value.career,
        password: generatedPassword,
      })
      emit('student-registered', response.student.id)
    } catch {
      // El error se maneja en el store
    }
  }

  function generateSecurePassword (): string {
    // Máximo 8 caracteres, solo letras, dígitos y los símbolos $ # % & +
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const minusculas = 'abcdefghijklmnopqrstuvwxyz'
    const numeros = '0123456789'
    const caracteresEspeciales = '$#%&+'

    let password = ''
    password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length))
    password += minusculas.charAt(Math.floor(Math.random() * minusculas.length))
    password += numeros.charAt(Math.floor(Math.random() * numeros.length))
    password += caracteresEspeciales.charAt(Math.floor(Math.random() * caracteresEspeciales.length))

    // Llenar el resto
    const todosLosCaracteres = mayusculas + minusculas + numeros
    for (let i = 4; i < 8; i++) {
      password += todosLosCaracteres.charAt(Math.floor(Math.random() * todosLosCaracteres.length))
    }

    // Mezclar
    return password.split('').sort(() => 0.5 - Math.random()).join('')
  }
</script>

<style scoped>
.registration-card {
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
</style>
