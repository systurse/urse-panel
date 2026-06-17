<template>
  <div class="students-page">

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
  flex-shrink: 0;
}

.registration-section {
  width: 100%;
}

@media (max-width: 768px) {
  .students-page {
    gap: 16px;
  }

  .module-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-content p {
    font-size: 0.85rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 480px) {
  .students-page {
    gap: 12px;
  }

  .module-header {
    padding: 12px;
    gap: 12px;
  }

  .header-content h1 {
    font-size: 1.25rem;
  }

  .header-content p {
    font-size: 0.75rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
