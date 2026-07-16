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
        <v-card rounded="xl" class="h-100">
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
            <template v-if="filters.date_field">
              <v-text-field
                v-model="filters.date_from"
                label="Fecha desde"
                type="date"
                variant="outlined"
                style="margin-bottom: 16px;"
              />
              <v-text-field
                v-model="filters.date_to"
                label="Fecha hasta"
                type="date"
                variant="outlined"
                style="margin-bottom: 16px;"
              />
            </template>

            <v-btn
              color="#1e3a5f"
              variant="flat"
              size="large"
              block
              rounded="lg"
              prepend-icon="mdi-microsoft-excel"
              :loading="downloading"
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
              Exportación de credenciales
            </div>
            <div style="font-size: 0.88rem; color: #555; line-height: 1.6; margin-bottom: 20px;">
              El archivo Excel generado contiene las credenciales de acceso de los alumnos
              según los filtros aplicados. Cada fila corresponde a un alumno.
            </div>

            <div class="columns-grid">
              <div v-for="col in columns" :key="col.field" class="column-item">
                <v-icon size="16" color="#1e3a5f">mdi-table-column</v-icon>
                <div>
                  <div class="col-label">{{ col.label }}</div>
                  <div class="col-field">{{ col.field }}</div>
                </div>
              </div>
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
              @click:close="filters.date_field = null; filters.date_from = ''; filters.date_to = ''"
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

  const error = ref('')
  const downloading = ref(false)
  const snackbar = ref(false)
  const careers = ref<Career[]>([])

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

  const columns = [
    { label: 'Nombre', field: 'name' },
    { label: 'Primer Apellido', field: 'first_last_name' },
    { label: 'Segundo Apellido', field: 'second_last_name' },
    { label: 'Carrera', field: 'careers.name' },
    { label: 'Correo Institucional', field: 'institutional_email' },
    { label: 'Usuario AD', field: 'ad_username' },
    { label: 'Contraseña Wi-Fi', field: 'wifi_password' },
  ]

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
    downloading.value = true
    error.value = ''
    try {
      const params: ExportParams = {}
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
      error.value = err?.response?.data?.message || 'Error al generar el archivo. Intenta nuevamente.'
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
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 10px;
}

.column-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f4f6f9;
  border-radius: 8px;
  padding: 10px 12px;
}

.col-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: #222;
  line-height: 1.3;
}

.col-field {
  font-size: 0.74rem;
  font-family: 'Courier New', monospace;
  color: #888;
  margin-top: 2px;
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
