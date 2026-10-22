<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="480"
    persistent
  >
    <v-card :rounded="xs ? 0 : 'xl'">
      <v-card-title class="space-dialog__title">
        <v-icon color="#c89215" icon="mdi-domain-plus" />
        Nuevo espacio
      </v-card-title>

      <v-card-text class="px-6">
        <p class="space-dialog__hint">
          Se agrega al catálogo para que todas las áreas lo puedan reservar.
        </p>

        <v-alert
          v-if="formError"
          class="mb-4"
          color="error"
          density="comfortable"
          variant="tonal"
        >
          {{ formError }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="save">
          <v-text-field
            v-model="form.name"
            autofocus
            class="mb-3"
            :error-messages="fieldErrors.name"
            hide-details="auto"
            label="Nombre *"
            maxlength="255"
            placeholder="Ej. Auditorio principal"
            prepend-inner-icon="mdi-domain"
            :rules="[(value: string) => Boolean(value?.trim()) || 'Escribe el nombre del espacio.']"
            variant="outlined"
          />

          <v-select
            v-model="form.campusId"
            class="mb-3"
            clearable
            :error-messages="fieldErrors.campus_id"
            hide-details="auto"
            item-title="name"
            item-value="id"
            :items="campuses"
            label="Campus"
            :loading="campusesLoading"
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
          />

          <v-text-field
            v-model="form.capacity"
            :error-messages="fieldErrors.capacity"
            hide-details="auto"
            label="Capacidad (personas)"
            min="1"
            prepend-inner-icon="mdi-account-group-outline"
            type="number"
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn :disabled="saving" variant="text" @click="open = false">Cancelar</v-btn>

        <v-btn
          color="#FAB21A"
          :loading="saving"
          prepend-icon="mdi-content-save-outline"
          variant="flat"
          @click="save"
        >
          Agregar espacio
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { AgendaPort, AgendaSpace } from '@/modules/agenda/port'
  import type { DirectoryCampus } from '@/modules/directory/port'
  import { reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import { directoryAdapter } from '@/modules/directory/adapter'

  const props = withDefaults(defineProps<{
    /** Prefills the name, usually what was typed in the space search. */
    initialName?: string
    port?: AgendaPort
  }>(), {
    initialName: '',
    port: () => agendaAdapter,
  })

  const emit = defineEmits<{
    created: [space: AgendaSpace]
  }>()

  const { xs } = useDisplay()

  const open = defineModel<boolean>({ default: false })

  interface ApiErrorShape {
    response?: { status?: number, data?: { message?: string, errors?: Record<string, string[]> } }
  }

  const formRef = ref<{ validate: () => Promise<{ valid: boolean }>, resetValidation: () => void } | null>(null)
  const form = reactive({ name: '', campusId: null as number | null, capacity: '' as string | number })
  const fieldErrors = ref<Record<string, string[]>>({})
  const formError = ref<string | null>(null)
  const saving = ref(false)

  const campuses = ref<DirectoryCampus[]>([])
  const campusesLoading = ref(false)

  // Loaded once, the first time the dialog opens.
  async function loadCampuses () {
    if (campuses.value.length > 0 || campusesLoading.value) {
      return
    }
    campusesLoading.value = true
    try {
      campuses.value = await directoryAdapter.listCampuses()
    } catch {
      // The campus is optional: the space can still be created without it.
    } finally {
      campusesLoading.value = false
    }
  }

  watch(open, isOpen => {
    if (!isOpen) {
      return
    }
    Object.assign(form, { name: props.initialName.trim(), campusId: null, capacity: '' })
    fieldErrors.value = {}
    formError.value = null
    formRef.value?.resetValidation()
    loadCampuses()
  }, { immediate: true })

  watch(form, () => {
    fieldErrors.value = {}
  })

  async function save () {
    const result = await formRef.value?.validate()
    if (!result?.valid || saving.value) {
      return
    }

    const capacity = String(form.capacity).trim()

    saving.value = true
    formError.value = null
    try {
      const space = await props.port.createSpace({
        name: form.name.trim(),
        campusId: form.campusId,
        capacity: capacity ? Number(capacity) : null,
      })
      emit('created', space)
      open.value = false
    } catch (error_) {
      const response = (error_ as ApiErrorShape)?.response
      fieldErrors.value = response?.data?.errors ?? {}
      formError.value = response?.status === 403
        ? 'No tienes permiso para agregar espacios al catálogo.'
        : response?.data?.message ?? 'No fue posible agregar el espacio.'
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
.space-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px 4px !important;
  font-weight: 800;
}

.space-dialog__hint {
  margin: 0 0 14px;
  color: #8a8a8a;
  font-size: 0.88rem;
}
</style>
