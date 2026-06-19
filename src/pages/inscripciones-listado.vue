<template>
  <div class="list-page">
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

    <v-card rounded="xl" class="students-card">
      <v-card-text class="pa-6">
        <div class="list-header mb-4">
          <h3 class="list-title">Listado de Estudiantes Registrados</h3>
          <v-text-field
            v-model="searchQuery"
            placeholder="Buscar por matrícula, nombre, apellidos, correo..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 380px"
            @update:model-value="onSearchChange"
            @click:clear="onSearchClear"
          />
        </div>

        <div v-if="loading" class="loading-container">
          <v-progress-circular indeterminate color="primary" size="50" />
        </div>

        <div v-else>
          <v-data-table
            :headers="headers"
            :items="students"
            :loading="loading"
            item-value="id"
            class="students-table"
          >
            <template #item.career="{ item }">
              {{ getCareerName(item.career) }}
            </template>

            <template #item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" label small>
                {{ formatStatus(item.status) }}
              </v-chip>
            </template>

            <template #item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                color="warning"
                title="Editar estudiante"
                @click="editStudent(item.id)"
              />
              <v-btn
                icon="mdi-file-pdf-box"
                size="small"
                variant="text"
                color="primary"
                title="Abrir hoja de credenciales"
                @click="downloadStudentPDF(item.id)"
              />
            </template>
          </v-data-table>

          <div v-if="totalPages > 1" class="pagination-container mt-4">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              @update:model-value="handlePageChange"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useReport } from '@/modules/students/hooks/useReport'

  const router = useRouter()
  const {
    students,
    loading,
    error,
    currentPage,
    totalPages,
    fetchStudents,
    clearError,
  } = useReport()

  const searchQuery = ref('')
  let searchDebounce: ReturnType<typeof setTimeout> | null = null

  const headers = [
    { title: 'Matrícula', key: 'matricula' },
    { title: 'Nombre', key: 'name' },
    { title: 'Carrera', key: 'career' },
    { title: 'Email', key: 'institutional_email' },
    { title: 'Estado', key: 'status' },
    { title: 'Registrado', key: 'created_at' },
    { title: 'Acciones', key: 'actions', sortable: false },
  ]

  function getStatusColor (status: string) {
    switch (status) {
      case 'active': return 'success'
      case 'pending': return 'warning'
      case 'suspended': return 'error'
      default: return 'default'
    }
  }

  function formatStatus (status: string) {
    switch (status) {
      case 'active': return 'Activo'
      case 'pending': return 'Pendiente'
      case 'suspended': return 'Suspendido'
      default: return status
    }
  }

  function formatDate (date: string) {
    return new Date(date).toLocaleDateString('es-ES')
  }

  function getCareerName (career: any) {
    return typeof career === 'string' ? career : career?.name || 'N/A'
  }

  async function handlePageChange (page: number) {
    await fetchStudents(page, searchQuery.value || undefined)
  }

  function onSearchChange (value: string | null) {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      fetchStudents(1, value?.trim() || undefined)
    }, 400)
  }

  function onSearchClear () {
    searchQuery.value = ''
    fetchStudents(1)
  }

  function editStudent (studentId: number) {
    const student = students.value.find(s => s.id === studentId)
    router.push({
      path: `/inscripciones/editar/${studentId}`,
      state: { student: student ? JSON.parse(JSON.stringify(student)) : null },
    })
  }

  function downloadStudentPDF (studentId: number) {
    const apiSoporteUrl = import.meta.env.VITE_API_SOPORTE_URL
    window.open(`${apiSoporteUrl}/api/v1/students/${studentId}/credential-sheet`, '_blank')
  }

  onMounted(() => fetchStudents(1))
</script>

<style scoped>
.list-page {
  display: grid;
  gap: 24px;
}

.students-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.list-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #000000;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.students-table {
  border-radius: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
}

@media (max-width: 480px) {
  .students-table { font-size: 0.75rem; }
  .list-title { font-size: 1rem; }
}
</style>
