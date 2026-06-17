<template>
  <div class="students-page">
    <!-- Header -->
    <div class="module-header">
      <div class="header-content">
        <h1>Nueva Inscripción</h1>
        <p>Registro de Nuevos Estudiantes</p>
      </div>
      <div class="header-icon" style="background-color: #00a86b">
        <v-icon icon="mdi-account-school-outline" size="32" color="white" />
      </div>
    </div>

    <!-- Formulario de Registro -->
    <div class="registration-section">
      <StudentRegistrationForm
        @student-registered="handleStudentRegistered"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import StudentRegistrationForm from '@/modules/students/components/StudentRegistrationForm.vue'

  const router = useRouter()

  async function handleStudentRegistered (studentId: number) {
    // Navegar a la página de confirmación
    await router.push(`/inscripciones/confirmacion/${studentId}`)
  }
</script>

<style scoped>
.students-page {
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

.registration-section {
  width: 100%;
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
