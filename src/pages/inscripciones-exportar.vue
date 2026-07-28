<template>
  <div class="export-page">

    <v-alert
      v-if="error"
      class="mb-6"
      closable
      color="error"
      icon="mdi-alert-circle-outline"
      variant="tonal"
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <v-row>
      <!-- Filtros -->
      <v-col cols="12" md="4">
        <v-card rounded="xl">
          <v-card-text style="padding: 28px;">
            <div style="font-size: 1.05rem; font-weight: 700; color: #1e3a5f; margin-bottom: 8px;">
              Filtros de exportación
            </div>
            <div style="font-size: 0.85rem; color: #666; line-height: 1.5; margin-bottom: 24px;">
              Todos los filtros son opcionales. Sin filtros se exportan todos los alumnos.
            </div>

            <!-- Carrera -->
            <v-autocomplete
              v-model="filters.career_id"
              :items="careers"
              item-title="name"
              item-value="id"
              label="Carrera"
              placeholder="Todas las carreras"
              variant="outlined"
              clearable
              style="margin-bottom: 16px;"
            />

            <!-- Campo de fecha -->
            <v-select
              v-model="filters.date_field"
              :items="dateFieldOptions"
              item-title="label"
              item-value="value"
              label="Filtrar por fecha"
              variant="outlined"
              clearable
              style="margin-bottom: 16px;"
            />

            <!-- Rango de fechas -->
            <DateRangeFilter
              v-if="filters.date_field"
              ref="dateRangeRef"
              v-model:from="filters.date_from"
              v-model:to="filters.date_to"
            />

            <v-btn
              color="#1e3a5f"
              variant="flat"
              size="large"
              block
              rounded="lg"
              prepend-icon="mdi-microsoft-excel"
              :loading="downloading"
              :disabled="dateRangeRef?.hasError || selectedColumns.length === 0"
              style="margin-bottom: 8px;"
              @click="downloadExcel"
            >
              Descargar Excel
            </v-btn>

            <v-btn
              variant="text"
              size="small"
              block
              :disabled="downloading"
              @click="resetFilters"
            >
              Limpiar filtros
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Resumen / info -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" style="margin-bottom: 20px;">
          <v-card-text style="padding: 28px;">
            <div style="font-size: 1rem; font-weight: 700; color: #1e3a5f; display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <v-icon color="#1e3a5f" size="20">mdi-file-excel-outline</v-icon>
              Columnas a exportar
            </div>
            <div style="font-size: 0.88rem; color: #555; line-height: 1.6; margin-bottom: 16px;">
              Elige qué columnas incluir en el archivo Excel. Cada fila corresponde a un alumno.
            </div>

            <v-alert
              v-if="selectedColumns.length === 0"
              class="mb-4"
              density="compact"
              type="warning"
              variant="tonal"
            >
              Selecciona al menos una columna para poder descargar.
            </v-alert>

            <div class="columns-grid">
              <v-checkbox
                v-for="col in COLUMN_CATALOG"
                :key="col.key"
                v-model="selectedColumns"
                density="compact"
                hide-details
                :label="col.label"
                :value="col.key"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Filtros activos -->
        <v-card rounded="xl">
          <v-card-text style="padding: 28px;">
            <div style="font-size: 1rem; font-weight: 700; color: #1e3a5f; display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <v-icon color="#1e3a5f" size="20">mdi-filter-outline</v-icon>
              Filtros activos
            </div>

          <div v-if="!hasActiveFilters" class="no-filters">
            <v-icon size="32" color="#bdbdbd">mdi-filter-off-outline</v-icon>
            <span>Sin filtros — se exportarán todos los alumnos.</span>
          </div>

          <div v-else class="active-filters">
            <v-chip
              v-if="filters.career_id"
              closable
              label
              color="#1e3a5f"
              variant="tonal"
              @click:close="filters.career_id = null"
            >
              <v-icon start>mdi-school-outline</v-icon>
              {{ careerName }}
            </v-chip>
            <v-chip
              v-if="filters.date_field"
              closable
              label
              color="secondary"
              variant="tonal"
              @click:close="filters.date_field = undefined; filters.date_from = ''; filters.date_to = ''"
            >
              <v-icon start>mdi-calendar-range</v-icon>
              {{ dateFieldLabel }}
              <template v-if="filters.date_from || filters.date_to">
                : {{ filters.date_from || '…' }} → {{ filters.date_to || '…' }}
              </template>
            </v-chip>
          </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
      Archivo descargado correctamente.
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, reactive } from 'vue'
  import { reportService, type ExportParams } from '@/modules/students/services/reportService'
  import { studentService } from '@/modules/students/services/studentService'
  import type { Career } from '@/modules/students/services/reportService'
  import DateRangeFilter from '@/components/DateRangeFilter.vue'

  const error = ref('')
  const downloading = ref(false)
  const snackbar = ref(false)
  const careers = ref<Career[]>([])
  const dateRangeRef = ref<InstanceType<typeof DateRangeFilter> | null>(null)

  const filters = reactive<ExportParams & { career_id: number | null }>({
    career_id: null,
    date_field: undefined,
    date_from: '',
    date_to: '',
  })

  const dateFieldOptions = [
    { label: 'Fecha de registro', value: 'created_at' },
    { label: 'Fecha de activación', value: 'activated_at' },
    { label: 'Fecha de recogida de credenciales', value: 'credentials_retrieved_at' },
  ]

  // Mantener sincronizado con App\Exports\StudentCredentialsColumns (backend).
  const COLUMN_CATALOG = [
    { key: 'matricula', label: 'Matrícula' },
    { key: 'name', label: 'Nombre' },
    { key: 'first_last_name', label: 'Primer Apellido' },
    { key: 'second_last_name', label: 'Segundo Apellido' },
    { key: 'servo_username', label: 'Usuario Servoescolar' },
    { key: 'career', label: 'Carrera' },
    { key: 'status', label: 'Estado' },
    { key: 'institutional_email', label: 'Correo Institucional' },
    { key: 'personal_email', label: 'Correo Personal' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'enrollment_date', label: 'Fecha de Inscripción' },
    { key: 'activated_at', label: 'Fecha de Activación' },
    { key: 'credentials_retrieved_at', label: 'Fecha de Recogida de Credenciales' },
    { key: 'ad_username', label: 'Usuario AD' },
    { key: 'wifi_password', label: 'Contraseña Wi-Fi' },
    { key: 'password', label: 'Contraseña del Portal' },
  ]

  const DEFAULT_COLUMNS = ['name', 'first_last_name', 'second_last_name', 'career', 'institutional_email', 'ad_username', 'wifi_password']

  const selectedColumns = ref<string[]>([...DEFAULT_COLUMNS])

  const hasActiveFilters = computed(() =>
    !!filters.career_id || !!filters.date_field,
  )

  const careerName = computed(() => {
    if (!filters.career_id) return ''
    return careers.value.find(c => c.id === filters.career_id)?.name ?? ''
  })

  const dateFieldLabel = computed(() =>
    dateFieldOptions.find(o => o.value === filters.date_field)?.label ?? '',
  )

  async function downloadExcel () {
    if (dateRangeRef.value?.hasError || selectedColumns.value.length === 0) return
    downloading.value = true
    error.value = ''
    try {
      const params: ExportParams = { columns: selectedColumns.value }
      if (filters.career_id) params.career_id = filters.career_id
      if (filters.date_field) params.date_field = filters.date_field
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const blob = await reportService.exportCredentials(params)
      const url = URL.createObjectURL(blob as unknown as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credenciales_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      snackbar.value = true
    } catch (err: any) {
      const data = err?.response?.data
      const fieldErrors = data?.errors && Object.values(data.errors).flat().join(' ')
      error.value = fieldErrors || data?.message || 'Error al generar el archivo. Intenta nuevamente.'
    } finally {
      downloading.value = false
    }
  }

  function resetFilters () {
    filters.career_id = null
    filters.date_field = undefined
    filters.date_from = ''
    filters.date_to = ''
  }

  onMounted(async () => {
    try {
      careers.value = await studentService.getCareers()
    } catch {
      // No bloquear la vista si las carreras no cargan
    }
  })
</script>

<style scoped>
.filter-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e3a5f;
  margin-bottom: 6px;
}

.filter-desc {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 20px;
  line-height: 1.5;
}

.info-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a5f;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-desc {
  font-size: 0.88rem;
  color: #555;
  margin: 0 0 20px;
  line-height: 1.6;
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  column-gap: 10px;
}

.no-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #aaa;
  font-size: 0.88rem;
  padding: 8px 0;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
