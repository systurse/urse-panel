<template>
  <v-card rounded="xl" class="import-card">
    <v-card-text class="pa-6">
      <h3 class="form-title">Carga masiva de estudiantes</h3>
      <p class="form-subtitle">
        Sube el archivo de reporte (Reporte.xlsx) para poblar la tabla de estudiantes.
        La carrera se detecta automáticamente desde la columna SECCIÓN.
      </p>

      <!-- Alert de error general -->
      <v-alert
        v-if="error"
        class="mb-4 mt-4"
        closable
        color="error"
        icon="mdi-alert-circle-outline"
        variant="tonal"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <v-form ref="formRef" v-model="formValid" class="mt-6">
        <v-row>
          <!-- Carrera de respaldo (opcional) -->
          <v-col cols="12">
            <v-autocomplete
              v-model="form.career_id"
              label="Carrera de respaldo (opcional)"
              :items="careers"
              item-title="name"
              item-value="id"
              :disabled="loading || careersLoading"
              :loading="careersLoading"
              variant="outlined"
              clearable
              hint="Se usa solo para filas cuya SECCIÓN no se pueda mapear a una carrera"
              persistent-hint
              placeholder="Sin respaldo"
              prepend-inner-icon="mdi-school-outline"
            />
          </v-col>

          <!-- Archivo de reporte -->
          <v-col cols="12">
            <v-file-input
              v-model="form.reporte"
              label="Archivo de reporte"
              accept=".xlsx,.xls,.csv"
              :rules="fileRules"
              :disabled="loading"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-microsoft-excel"
              hint="Reporte.xlsx con servo, nombre, apellidos, matrícula y correo"
              persistent-hint
              show-size
            />
          </v-col>
        </v-row>

        <div class="form-actions mt-8">
          <v-btn
            :disabled="!formValid || loading"
            :loading="loading"
            color="primary"
            size="large"
            variant="flat"
            prepend-icon="mdi-upload"
            @click="submit"
          >
            Importar estudiantes
          </v-btn>
        </div>
      </v-form>

      <!-- Resultado -->
      <div v-if="summary" class="mt-8">
        <v-divider class="mb-6" />

        <div class="summary-grid">
          <div class="summary-stat">
            <span class="summary-number">{{ summary.processed }}</span>
            <span class="summary-label">Procesados</span>
          </div>
          <div class="summary-stat summary-stat--success">
            <span class="summary-number">{{ summary.created }}</span>
            <span class="summary-label">Creados</span>
          </div>
          <div class="summary-stat summary-stat--info">
            <span class="summary-number">{{ summary.updated }}</span>
            <span class="summary-label">Actualizados</span>
          </div>
          <div class="summary-stat summary-stat--warning">
            <span class="summary-number">{{ summary.skipped.length }}</span>
            <span class="summary-label">Omitidos</span>
          </div>
          <div class="summary-stat summary-stat--error">
            <span class="summary-number">{{ summary.errors.length }}</span>
            <span class="summary-label">Errores</span>
          </div>
        </div>

        <v-alert
          v-if="summary.skipped.length === 0 && summary.errors.length === 0"
          class="mt-6"
          color="success"
          icon="mdi-check-circle-outline"
          variant="tonal"
        >
          Importación completada sin incidencias.
        </v-alert>

        <v-expansion-panels v-if="summary.skipped.length || summary.errors.length" class="mt-6" variant="accordion">
          <v-expansion-panel v-if="summary.errors.length" title="Errores">
            <template #text>
              <v-list density="compact">
                <v-list-item
                  v-for="(item, i) in summary.errors"
                  :key="`err-${i}`"
                  :title="item.matricula"
                  :subtitle="item.message"
                  prepend-icon="mdi-alert-circle-outline"
                />
              </v-list>
            </template>
          </v-expansion-panel>
          <v-expansion-panel v-if="summary.skipped.length" title="Omitidos">
            <template #text>
              <v-list density="compact">
                <v-list-item
                  v-for="(item, i) in summary.skipped"
                  :key="`skip-${i}`"
                  :title="item.matricula"
                  :subtitle="item.reason"
                  prepend-icon="mdi-information-outline"
                />
              </v-list>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { studentService, type ImportSummary } from '../services/studentService'
  import { useStudent } from '../hooks/useStudent'

  const { careers, careersLoading, loadCareers } = useStudent()

  const formRef = ref()
  const formValid = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const summary = ref<ImportSummary | null>(null)

  const form = ref<{
    career_id: number | null
    reporte: File | File[] | null
  }>({
    career_id: null,
    reporte: null,
  })

  const fileRules = [(v: File | File[] | null) => !!firstFile(v) || 'El archivo es requerido']

  function firstFile (value: File | File[] | null): File | null {
    if (!value) return null
    return Array.isArray(value) ? (value[0] ?? null) : value
  }

  onMounted(() => {
    loadCareers().catch(() => {
      error.value = 'No se pudieron cargar las carreras'
    })
  })

  async function submit () {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    loading.value = true
    error.value = null
    summary.value = null

    try {
      summary.value = await studentService.importStudents({
        career_id: form.value.career_id,
        reporte: firstFile(form.value.reporte) as File,
      })
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ocurrió un error al importar los archivos'
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
.import-card {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 12px;
  background: rgb(0 0 0 / 0.03);
  border: 1px solid rgb(0 0 0 / 0.06);
}

.summary-stat--success { background: rgb(0 168 107 / 0.08); border-color: rgb(0 168 107 / 0.2); }
.summary-stat--info { background: rgb(33 150 243 / 0.08); border-color: rgb(33 150 243 / 0.2); }
.summary-stat--warning { background: rgb(255 167 38 / 0.1); border-color: rgb(255 167 38 / 0.25); }
.summary-stat--error { background: rgb(244 67 54 / 0.08); border-color: rgb(244 67 54 / 0.2); }

.summary-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #000000;
  line-height: 1;
}

.summary-label {
  margin-top: 6px;
  font-size: 0.8rem;
  color: #5e5e5e;
  text-align: center;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
