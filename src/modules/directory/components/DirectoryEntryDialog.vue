<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="680"
    persistent
    scrollable
  >
    <v-card class="entry-dialog" :rounded="xs ? 0 : 'xl'">
      <div class="entry-dialog__head">
        <div class="entry-dialog__icon">
          <v-icon :icon="isEditing ? 'mdi-pencil-outline' : 'mdi-phone-plus-outline'" size="22" />
        </div>

        <div>
          <div class="entry-dialog__kicker">Directorio</div>
          <h3 class="entry-dialog__title">{{ isEditing ? 'Editar extensión' : 'Agregar extensión' }}</h3>
        </div>
      </div>

      <v-divider />

      <v-card-text class="entry-dialog__body">
        <v-alert
          v-if="formError"
          class="mb-4"
          color="error"
          density="comfortable"
          variant="tonal"
        >
          {{ formError }}
        </v-alert>

        <v-form ref="formRef" @submit.prevent="submit">
          <div class="entry-dialog__section">Ubicación</div>

          <v-row dense>
            <v-col cols="12" sm="5">
              <v-select
                v-model="form.campusId"
                :error-messages="fieldErrors.campus_id"
                hide-details="auto"
                item-title="name"
                item-value="id"
                :items="campuses"
                label="Campus *"
                prepend-inner-icon="mdi-map-marker-outline"
                :rules="[requiredCampus]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" sm="7">
              <v-autocomplete
                v-model="form.areaId"
                clearable
                :error-messages="fieldErrors.area_id"
                hint="Déjalo vacío para contactos fuera de un área (Caja, CIDURSE…)."
                item-title="name"
                item-value="id"
                :items="areaOptions"
                label="Área"
                :loading="areasLoading"
                no-data-text="Sin áreas"
                persistent-hint
                prepend-inner-icon="mdi-sitemap-outline"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="entry-dialog__section">
            Contacto
            <span class="entry-dialog__section-hint">captura al menos la extensión, el puesto o el nombre</span>
          </div>

          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.extension"
                :error-messages="fieldErrors.extension"
                hide-details="auto"
                label="Extensión"
                maxlength="20"
                prepend-inner-icon="mdi-phone-outline"
                :rules="[atLeastOneIdentifier]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" sm="8">
              <v-text-field
                v-model="form.position"
                :error-messages="fieldErrors.position"
                hide-details="auto"
                label="Puesto"
                maxlength="255"
                placeholder="Ej. COORDINADOR ADMINISTRATIVO"
                prepend-inner-icon="mdi-briefcase-outline"
                :rules="[atLeastOneIdentifier]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                :error-messages="fieldErrors.name"
                hide-details="auto"
                label="Nombre"
                maxlength="255"
                placeholder="Ej. MTRA. ANA LÓPEZ PÉREZ"
                prepend-inner-icon="mdi-account-outline"
                :rules="[atLeastOneIdentifier]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.email"
                :error-messages="fieldErrors.email"
                hide-details="auto"
                label="Correo"
                maxlength="255"
                prepend-inner-icon="mdi-email-outline"
                :rules="[validEmail]"
                type="email"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.secondaryEmail"
                :error-messages="fieldErrors.secondary_email"
                hide-details="auto"
                label="Correo secundario"
                maxlength="255"
                prepend-inner-icon="mdi-email-multiple-outline"
                :rules="[validEmail, differentEmail]"
                type="email"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="entry-dialog__section">Orden</div>

          <v-row dense>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="form.sortOrder"
                :error-messages="fieldErrors.sort_order"
                :hint="isEditing ? 'Posición dentro de su campus.' : 'Vacío: se agrega al final de su área.'"
                label="Posición"
                min="0"
                persistent-hint
                prepend-inner-icon="mdi-sort-numeric-ascending"
                :rules="[validSortOrder]"
                type="number"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="entry-dialog__actions">
        <v-spacer />

        <v-btn :disabled="saving" variant="text" @click="close">Cancelar</v-btn>

        <v-btn
          color="#FAB21A"
          :loading="saving"
          prepend-icon="mdi-content-save-outline"
          variant="flat"
          @click="submit"
        >
          {{ isEditing ? 'Guardar cambios' : 'Agregar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Area } from '@/modules/areas/port'
  import type { DirectoryCampus, DirectoryEntry, DirectoryEntryPayload, DirectoryPort } from '@/modules/directory/port'
  import { computed, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { areasAdapter } from '@/modules/areas/adapter'
  import { directoryAdapter } from '@/modules/directory/adapter'

  const props = withDefaults(defineProps<{
    /** Null opens the dialog to create a new line. */
    entry: DirectoryEntry | null
    campuses: DirectoryCampus[]
    /** Campus preselected on create, usually the tab the user is looking at. */
    defaultCampusId?: number | null
    port?: DirectoryPort
  }>(), {
    defaultCampusId: null,
    port: () => directoryAdapter,
  })

  // A phone gets the whole screen: the form is long and the keyboard eats half of it.
  const { xs } = useDisplay()

  const open = defineModel<boolean>({ default: false })

  const emit = defineEmits<{
    saved: [entry: DirectoryEntry, created: boolean]
  }>()

  interface FormState {
    campusId: number | null
    areaId: number | null
    extension: string
    position: string
    name: string
    email: string
    secondaryEmail: string
    sortOrder: string
  }

  type ApiField = 'campus_id' | 'area_id' | 'extension' | 'position' | 'name' | 'email' | 'secondary_email' | 'sort_order'

  interface ApiErrorShape {
    response?: {
      status?: number
      data?: { message?: string, errors?: Record<string, string[]> }
    }
  }

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

  const formRef = ref<{ validate: () => Promise<{ valid: boolean }>, resetValidation: () => void } | null>(null)
  const form = reactive<FormState>(emptyForm())
  const fieldErrors = ref<Partial<Record<ApiField, string[]>>>({})
  const formError = ref<string | null>(null)
  const saving = ref(false)
  /** Set on the first submit; until then the form stays quiet while it is filled in. */
  const submitted = ref(false)

  const areas = ref<Area[]>([])
  const areasLoading = ref(false)

  const isEditing = computed(() => props.entry !== null)

  const areaOptions = computed(() => areas.value.map(area => ({ id: Number(area.id), name: area.name })))

  function emptyForm (): FormState {
    return {
      campusId: null,
      areaId: null,
      extension: '',
      position: '',
      name: '',
      email: '',
      secondaryEmail: '',
      sortOrder: '',
    }
  }

  function formFromEntry (entry: DirectoryEntry | null): FormState {
    if (!entry) {
      return { ...emptyForm(), campusId: props.defaultCampusId ?? props.campuses[0]?.id ?? null }
    }

    return {
      campusId: entry.campusId,
      areaId: entry.areaId,
      extension: entry.extension,
      position: entry.position,
      name: entry.name ?? '',
      email: entry.email ?? '',
      secondaryEmail: entry.secondaryEmail ?? '',
      sortOrder: entry.sortOrder === null ? '' : String(entry.sortOrder),
    }
  }

  // The full area catalogue (not only the ones already in the directory), so
  // a line can be filed under an area that has none yet. Loaded once.
  async function loadAreas () {
    if (areas.value.length > 0 || areasLoading.value) {
      return
    }

    areasLoading.value = true
    try {
      areas.value = await areasAdapter.list()
    } catch {
      formError.value = 'No fue posible cargar las áreas.'
    } finally {
      areasLoading.value = false
    }
  }

  watch(open, isOpen => {
    if (!isOpen) {
      return
    }

    Object.assign(form, formFromEntry(props.entry))
    fieldErrors.value = {}
    formError.value = null
    submitted.value = false
    formRef.value?.resetValidation()
    loadAreas()
  }, { immediate: true })

  // The three share one rule, so filling any of them clears the other two.
  watch(() => [form.extension, form.position, form.name], () => {
    if (submitted.value) {
      formRef.value?.validate()
    }
  })

  // A server error belongs to the value that caused it; once edited, drop it.
  watch(form, () => {
    if (Object.keys(fieldErrors.value).length > 0) {
      fieldErrors.value = {}
    }
  })

  function clean (value: string): string | null {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  function requiredCampus (value: number | null) {
    return value !== null || 'Selecciona el campus.'
  }

  function atLeastOneIdentifier () {
    return Boolean(clean(form.extension) || clean(form.position) || clean(form.name))
      || 'Captura al menos la extensión, el puesto o el nombre.'
  }

  function validEmail (value: string) {
    return !clean(value) || EMAIL_PATTERN.test(value.trim()) || 'Escribe un correo válido.'
  }

  function differentEmail (value: string) {
    const secondary = clean(value)
    return !secondary || secondary.toLowerCase() !== clean(form.email)?.toLowerCase()
      || 'El correo secundario debe ser distinto del principal.'
  }

  function validSortOrder (value: string) {
    if (!clean(String(value))) {
      return !isEditing.value || 'Captura la posición.'
    }
    return (Number.isInteger(Number(value)) && Number(value) >= 0) || 'Debe ser un número entero mayor o igual a 0.'
  }

  function buildPayload (): DirectoryEntryPayload {
    const sortOrder = clean(String(form.sortOrder))

    return {
      campusId: form.campusId ?? undefined,
      areaId: form.areaId,
      extension: clean(form.extension),
      position: clean(form.position),
      name: clean(form.name),
      email: clean(form.email),
      secondaryEmail: clean(form.secondaryEmail),
      sortOrder: sortOrder === null ? null : Number(sortOrder),
    }
  }

  // PATCH carries only what changed, as the API expects.
  function changedFields (entry: DirectoryEntry, payload: DirectoryEntryPayload): DirectoryEntryPayload {
    const original: DirectoryEntryPayload = {
      campusId: entry.campusId,
      areaId: entry.areaId,
      extension: entry.extension || null,
      position: entry.position || null,
      name: entry.name,
      email: entry.email,
      secondaryEmail: entry.secondaryEmail,
      sortOrder: entry.sortOrder,
    }

    const diff: DirectoryEntryPayload = {}
    for (const key of Object.keys(payload) as (keyof DirectoryEntryPayload)[]) {
      if (payload[key] !== original[key]) {
        Object.assign(diff, { [key]: payload[key] })
      }
    }
    return diff
  }

  async function submit () {
    if (saving.value) {
      return
    }

    formError.value = null
    submitted.value = true
    const result = await formRef.value?.validate()
    if (!result?.valid) {
      return
    }

    const payload = buildPayload()
    const entry = props.entry

    let body = payload
    if (entry) {
      body = changedFields(entry, payload)
      if (Object.keys(body).length === 0) {
        close()
        return
      }
    } else if (body.sortOrder === null) {
      // On create an empty position means "let the API append it".
      delete body.sortOrder
    }

    saving.value = true
    try {
      const saved = entry
        ? await props.port.updateEntry(entry.id, body)
        : await props.port.createEntry(body)

      emit('saved', saved, !entry)
      close()
    } catch (error_) {
      handleError(error_)
    } finally {
      saving.value = false
    }
  }

  function handleError (error_: unknown) {
    const response = (error_ as ApiErrorShape)?.response
    const status = response?.status

    if (status === 422 && response?.data?.errors) {
      fieldErrors.value = response.data.errors as Partial<Record<ApiField, string[]>>
      formError.value = response.data.message ?? 'Revisa los campos marcados.'
      return
    }

    if (status === 403) {
      formError.value = 'No tienes permiso para realizar esta acción.'
      return
    }

    if (status === 404) {
      formError.value = 'El registro ya no existe; cierra el diálogo y actualiza la lista.'
      return
    }

    formError.value = response?.data?.message ?? 'No fue posible guardar la extensión.'
  }

  function close () {
    open.value = false
  }
</script>

<style scoped>
.entry-dialog__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #141414 0%, #3d2c00 100%);
  color: #ffffff;
}

.entry-dialog__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #FAB21A;
  color: #1a1a1a;
}

.entry-dialog__kicker {
  color: #FAB21A;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.entry-dialog__title {
  margin: 2px 0 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.entry-dialog__body {
  padding: 20px 24px !important;
}

.entry-dialog__section {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 8px 0 12px;
  color: #1a1a1a;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.entry-dialog__section-hint {
  color: #8a8a8a;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.entry-dialog__actions {
  padding: 14px 20px !important;
}

/* Fields only reserve room for messages when they have one, so the rows
   need their own breathing space. */
.entry-dialog__body :deep(.v-col) {
  padding-bottom: 10px;
}

@media (max-width: 600px) {
  .entry-dialog__head {
    padding: 16px;
  }

  .entry-dialog__body {
    padding: 16px !important;
  }

  .entry-dialog__actions {
    padding: 12px 16px !important;
  }
}
</style>
