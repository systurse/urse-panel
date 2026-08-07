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
        </div>

        <v-row class="filters-row mb-4" dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              placeholder="Buscar por matrícula, nombre, apellidos, correo..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="onSearchChange"
              @click:clear="onSearchClear"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="careerFilter"
              clearable
              density="compact"
              hide-details
              item-title="name"
              item-value="id"
              :items="careers"
              label="Carrera"
              variant="outlined"
              @update:model-value="onFiltersChange"
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-text-field
              v-model="dateFrom"
              density="compact"
              hide-details
              label="Desde"
              :max="dateTo || undefined"
              type="date"
              variant="outlined"
              @update:model-value="onFiltersChange"
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-text-field
              v-model="dateTo"
              density="compact"
              hide-details
              label="Hasta"
              :min="dateFrom || undefined"
              type="date"
              variant="outlined"
              @update:model-value="onFiltersChange"
            />
          </v-col>
        </v-row>

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

            <template #item.personal_email="{ item }">
              {{ item.personal_email || '—' }}
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
              <v-btn
                v-if="isAdmin"
                icon="mdi-wifi-lock"
                size="small"
                variant="text"
                color="info"
                title="Cambiar contraseña de Wi-Fi"
                @click="openWifiPasswordDialog(item)"
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

    <StudentWifiPasswordDialog
      v-model="wifiPasswordDialog"
      :student="selectedStudent"
      @saved="onWifiPasswordSaved"
    />

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top"
      :timeout="6000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import StudentWifiPasswordDialog from '@/modules/students/components/StudentWifiPasswordDialog.vue'
  import { useReport } from '@/modules/students/hooks/useReport'
  import { useStudent } from '@/modules/students/hooks/useStudent'
  import type { StudentFilters } from '@/modules/students/services/reportService'
  import type { WifiPasswordUpdateResponse } from '@/modules/students/services/studentService'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()
  const isAdmin = computed(() => authStore.isAdmin)
  const {
    students,
    loading,
    error,
    currentPage,
    totalPages,
    fetchStudents,
    clearError,
  } = useReport()

  const { careers, loadCareers } = useStudent()

  const searchQuery = ref('')
  const careerFilter = ref<number | null>(null)
  const dateFrom = ref('')
  const dateTo = ref('')
  let searchDebounce: ReturnType<typeof setTimeout> | null = null

  const wifiPasswordDialog = ref(false)
  const selectedStudent = ref<any>(null)
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref<'success' | 'warning' | 'error'>('success')

  function currentFilters (): StudentFilters {
    return {
      search: searchQuery.value.trim() || undefined,
      careerId: careerFilter.value || undefined,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    }
  }

  const headers = [
    { title: 'Matrícula', key: 'matricula' },
    { title: 'Nombre', key: 'name' },
    { title: 'Primer Apellido', key: 'first_last_name' },
    { title: 'Segundo Apellido', key: 'second_last_name' },
    { title: 'Carrera', key: 'career' },
    { title: 'Email', key: 'institutional_email' },
    { title: 'Correo Personal', key: 'personal_email' },
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
    await fetchStudents(page, currentFilters())
  }

  function onSearchChange () {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      fetchStudents(1, currentFilters())
    }, 400)
  }

  function onSearchClear () {
    searchQuery.value = ''
    fetchStudents(1, currentFilters())
  }

  function onFiltersChange () {
    fetchStudents(1, currentFilters())
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

  function openWifiPasswordDialog (student: any) {
    selectedStudent.value = student
    wifiPasswordDialog.value = true
  }

  function onWifiPasswordSaved (result: WifiPasswordUpdateResponse) {
    const failed = Object.keys(result.failed_campuses ?? {})

    /**
     * Rosario todavía no tiene enlace con el servidor, así que se avisa cuando un
     * campus quedó fuera: la contraseña no cambió ahí y el alumno lo notaría.
     */
    if (failed.length > 0) {
      snackbarColor.value = 'warning'
      snackbarText.value = `Contraseña actualizada en ${result.campuses.join(', ')}, pero falló en: ${failed.join(', ')}.`
    } else if (result.skipped_campuses?.length > 0) {
      snackbarColor.value = 'warning'
      snackbarText.value = `Contraseña actualizada en ${result.campuses.join(', ')}. Sin cambios en: ${result.skipped_campuses.join(', ')} (sin enlace).`
    } else {
      snackbarColor.value = 'success'
      snackbarText.value = 'Contraseña de Wi-Fi actualizada.'
    }

    snackbar.value = true
  }

  onMounted(() => {
    fetchStudents(1)
    loadCareers()
  })
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
