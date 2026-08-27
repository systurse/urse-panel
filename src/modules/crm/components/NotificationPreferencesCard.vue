<template>
  <v-card class="prefs-card" rounded="xl" variant="flat">
    <div class="prefs-kicker">Notificaciones</div>
    <h2 class="prefs-title">Alertas del CRM</h2>

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

    <div class="prefs-row">
      <div>
        <div class="prefs-setting-title">Recibir correo cuando entra un nuevo lead</div>

        <div class="prefs-caption">
          La alerta en el tablero no se desactiva; esto solo controla el correo.
        </div>
      </div>

      <v-switch
        color="#FAB21A"
        :disabled="loading"
        hide-details
        inset
        :loading="saving"
        :model-value="notifyNewLeads"
        @update:model-value="save(Boolean($event))"
      />
    </div>

    <p v-if="saved" class="prefs-saved">Preferencia guardada.</p>
  </v-card>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { getNotificationPreferences, updateNotificationPreferences } from '@/modules/crm/service'

  const notifyNewLeads = ref(true)
  const loading = ref(true)
  const saving = ref(false)
  const saved = ref(false)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const preferences = await getNotificationPreferences()
      notifyNewLeads.value = preferences.notify_new_leads
    } catch {
      error.value = 'No fue posible cargar tus preferencias de notificación.'
    } finally {
      loading.value = false
    }
  })

  async function save (value: boolean) {
    const previous = notifyNewLeads.value
    notifyNewLeads.value = value
    saving.value = true
    saved.value = false
    error.value = null

    try {
      const preferences = await updateNotificationPreferences({ notify_new_leads: value })
      notifyNewLeads.value = preferences.notify_new_leads
      saved.value = true
    } catch {
      notifyNewLeads.value = previous
      error.value = 'No fue posible guardar la preferencia; intenta de nuevo.'
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
.prefs-card {
  padding: 24px;
  background: #ffffff;
}

.prefs-kicker {
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.prefs-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.prefs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0 0;
}

.prefs-setting-title {
  color: #000000;
  font-weight: 700;
}

.prefs-caption {
  color: #7b696d;
  line-height: 1.7;
}

.prefs-saved {
  color: #2e7d32;
  font-size: 0.85rem;
  margin: 8px 0 0;
}

@media (max-width: 960px) {
  .prefs-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
