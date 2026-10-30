<template>
  <v-card class="hours-card" rounded="xl" variant="flat">
    <div class="hours-kicker">Soporte</div>
    <h2 class="hours-title">Horario de atención</h2>

    <p class="hours-copy">
      Las solicitudes que lleguen fuera de este horario reciben una confirmación de recepción con el día y la
      hora en que se atenderán.
    </p>

    <v-alert
      v-if="error"
      class="mt-3"
      density="compact"
      rounded="lg"
      type="error"
      variant="tonal"
    >
      {{ error }}
    </v-alert>

    <v-skeleton-loader v-if="loading" class="mt-4" type="list-item@7" />

    <template v-else>
      <div v-for="day in days" :key="day.day" class="hours-row">
        <div class="hours-day">
          <v-switch
            v-model="day.enabled"
            color="#FAB21A"
            density="compact"
            hide-details
            inset
          />

          <span>{{ DAY_NAMES[day.day] }}</span>
        </div>

        <div v-if="day.enabled" class="hours-times">
          <v-text-field
            v-model="day.opens_at"
            density="compact"
            hide-details
            label="Abre"
            type="time"
            variant="outlined"
          />

          <v-text-field
            v-model="day.closes_at"
            density="compact"
            hide-details
            label="Cierra"
            type="time"
            variant="outlined"
          />
        </div>

        <span v-else class="hours-closed">Sin atención</span>
      </div>

      <div class="hours-footer">
        <p v-if="summary" class="hours-summary">
          <v-icon icon="mdi-clock-outline" size="18" />
          Vigente: {{ summary }} ({{ timezone }})
        </p>

        <v-btn
          color="#1a1a1a"
          :loading="saving"
          prepend-icon="mdi-content-save-outline"
          variant="flat"
          @click="save"
        >Guardar horario</v-btn>
      </div>

      <p v-if="saved" class="hours-saved">Horario guardado.</p>
    </template>
  </v-card>
</template>

<script lang="ts" setup>
  import type { SupportDay, SupportHours } from '@/modules/crm/types'
  import { onMounted, ref } from 'vue'
  import { getSupportHours, updateSupportHours } from '@/modules/crm/service'

  const DAY_NAMES: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
  }

  const days = ref<SupportDay[]>([])
  const summary = ref('')
  const timezone = ref('')
  const loading = ref(true)
  const saving = ref(false)
  const saved = ref(false)
  const error = ref<string | null>(null)

  function apply (hours: SupportHours) {
    days.value = hours.days.map(day => ({ ...day }))
    summary.value = hours.summary
    timezone.value = hours.timezone
  }

  onMounted(async () => {
    try {
      apply(await getSupportHours())
    } catch {
      error.value = 'No fue posible cargar el horario de atención.'
    } finally {
      loading.value = false
    }
  })

  async function save () {
    saving.value = true
    saved.value = false
    error.value = null

    try {
      apply(await updateSupportHours(days.value.map(day => ({
        ...day,
        opens_at: day.enabled ? day.opens_at : null,
        closes_at: day.enabled ? day.closes_at : null,
      }))))
      saved.value = true
    } catch (error_: any) {
      const data = error_?.response?.data
      const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
      error.value = validation ?? data?.message ?? 'No fue posible guardar el horario; intenta de nuevo.'
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
.hours-card {
  padding: 24px;
  background: #ffffff;
}

.hours-kicker {
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hours-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.hours-copy,
.hours-closed {
  color: #7b696d;
  line-height: 1.7;
}

.hours-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 64px;
  padding: 8px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.hours-day {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #000000;
  font-weight: 700;
}

.hours-times {
  display: grid;
  grid-template-columns: repeat(2, 140px);
  gap: 12px;
}

.hours-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 18px;
}

.hours-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: #7b696d;
}

.hours-saved {
  color: #2e7d32;
  font-size: 0.85rem;
  margin: 8px 0 0;
}

@media (max-width: 600px) {
  .hours-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .hours-times {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
}
</style>
