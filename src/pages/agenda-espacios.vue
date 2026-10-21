<template>
  <div class="agenda-admin">
    <v-card class="agenda-admin__card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Agenda institucional</div>
          <h2 class="card-title">Espacios</h2>
          <p class="card-subtitle">Catálogo de lugares que se pueden reservar. Un espacio no admite dos actividades a la misma hora.</p>
        </div>

        <v-btn color="#FAB21A" prepend-icon="mdi-plus" variant="flat" @click="openForm(null)">
          Agregar espacio
        </v-btn>
      </div>

      <div class="toolbar">
        <v-select
          v-model="campusFilter"
          class="toolbar__filter"
          clearable
          density="comfortable"
          hide-details
          item-title="name"
          item-value="id"
          :items="campuses"
          placeholder="Todos los campus"
          prepend-inner-icon="mdi-map-marker-outline"
          variant="outlined"
        />

        <v-switch
          v-model="showInactive"
          color="#c89215"
          density="compact"
          hide-details
          inset
          label="Mostrar desactivados"
        />
      </div>

      <v-alert
        v-if="error"
        class="mt-4"
        closable
        color="error"
        density="comfortable"
        variant="tonal"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <div v-if="smAndDown" class="mobile-list">
        <div v-if="loading" class="mobile-list__state"><v-progress-circular color="#c89215" indeterminate size="28" /></div>
        <div v-else-if="visibleSpaces.length === 0" class="mobile-list__state">No hay espacios con estos filtros.</div>

        <article v-for="space in visibleSpaces" v-else :key="space.id" class="mobile-card">
          <div class="mobile-card__body">
            <div class="mobile-card__title">{{ space.name }}</div>
            <div class="mobile-card__meta">{{ space.campus?.name ?? 'Sin campus' }} · {{ capacityLabel(space) }}</div>

            <v-chip
              v-if="!space.isActive"
              class="mt-1"
              color="grey"
              size="x-small"
              variant="tonal"
            >Desactivado</v-chip>
          </div>

          <div class="mobile-card__actions">
            <v-btn
              aria-label="Editar"
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click="openForm(space)"
            />

            <v-btn
              aria-label="Eliminar"
              color="error"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="askDelete(space)"
            />
          </div>
        </article>
      </div>

      <v-data-table
        v-else
        class="mt-4"
        :headers="headers"
        item-value="id"
        :items="visibleSpaces"
        :loading="loading"
        loading-text="Cargando espacios…"
        no-data-text="No hay espacios con estos filtros."
      >
        <template #[`item.campus`]="{ item }">{{ item.campus?.name ?? 'Sin campus' }}</template>
        <template #[`item.capacity`]="{ item }">{{ capacityLabel(item) }}</template>

        <template #[`item.isActive`]="{ item }">
          <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" variant="tonal">
            {{ item.isActive ? 'Activo' : 'Desactivado' }}
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            aria-label="Editar"
            icon="mdi-pencil-outline"
            size="small"
            variant="text"
            @click="openForm(item)"
          />

          <v-btn
            aria-label="Eliminar"
            color="error"
            icon="mdi-delete-outline"
            size="small"
            variant="text"
            @click="askDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="formOpen" :fullscreen="xs" max-width="520" persistent>
      <v-card :rounded="xs ? 0 : 'xl'">
        <v-card-title class="pt-5 px-6">{{ editing ? 'Editar espacio' : 'Agregar espacio' }}</v-card-title>

        <v-card-text class="px-6">
          <v-alert
            v-if="formError"
            class="mb-4"
            color="error"
            density="comfortable"
            variant="tonal"
          >{{ formError }}</v-alert>

          <v-form ref="formRef" @submit.prevent="save">
            <v-text-field
              v-model="form.name"
              class="mb-3"
              :error-messages="fieldErrors.name"
              hide-details="auto"
              label="Nombre *"
              maxlength="255"
              placeholder="Ej. Auditorio principal"
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
              variant="outlined"
            />

            <v-text-field
              v-model="form.capacity"
              class="mb-3"
              :error-messages="fieldErrors.capacity"
              hide-details="auto"
              label="Capacidad (personas)"
              min="1"
              type="number"
              variant="outlined"
            />

            <v-switch
              v-model="form.isActive"
              color="#c89215"
              hide-details
              inset
              label="Disponible para reservar"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn :disabled="saving" variant="text" @click="formOpen = false">Cancelar</v-btn>
          <v-btn color="#FAB21A" :loading="saving" variant="flat" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="440" :persistent="deleting">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">¿Eliminar el espacio?</v-card-title>

        <v-card-text class="px-6">
          <strong>{{ spaceToDelete?.name }}</strong> se eliminará del catálogo. Si ya tiene actividades registradas,
          no se podrá eliminar: desactívalo para que no se pueda reservar.
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn :disabled="deleting" variant="text" @click="deleteOpen = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" variant="flat" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { AgendaSpace } from '@/modules/agenda/port'
  import type { DirectoryCampus } from '@/modules/directory/port'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import { resolveApiMessage } from '@/modules/agenda/useAgendaCalendar'
  import { directoryAdapter } from '@/modules/directory/adapter'

  interface ApiErrorShape {
    response?: { status?: number, data?: { message?: string, errors?: Record<string, string[]> } }
  }

  const { xs, smAndDown } = useDisplay()

  const spaces = ref<AgendaSpace[]>([])
  const campuses = ref<DirectoryCampus[]>([])
  const campusFilter = ref<number | null>(null)
  const showInactive = ref(true)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const formOpen = ref(false)
  const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
  const editing = ref<AgendaSpace | null>(null)
  const form = reactive({ name: '', campusId: null as number | null, capacity: '' as string | number, isActive: true })
  const fieldErrors = ref<Record<string, string[]>>({})
  const formError = ref<string | null>(null)
  const saving = ref(false)

  const deleteOpen = ref(false)
  const spaceToDelete = ref<AgendaSpace | null>(null)
  const deleting = ref(false)

  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const headers = [
    { title: 'Espacio', key: 'name' },
    { title: 'Campus', key: 'campus', sortable: false },
    { title: 'Capacidad', key: 'capacity' },
    { title: 'Actividades', key: 'eventsCount' },
    { title: 'Estado', key: 'isActive' },
    { title: '', key: 'actions', sortable: false, align: 'end' as const },
  ]

  const visibleSpaces = computed(() => spaces.value.filter(space =>
    (showInactive.value || space.isActive) && (!campusFilter.value || space.campusId === campusFilter.value)))

  function capacityLabel (space: AgendaSpace): string {
    return space.capacity ? `${space.capacity} personas` : 'Capacidad sin indicar'
  }

  function notify (text: string, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  async function load () {
    loading.value = true
    error.value = null
    try {
      spaces.value = await agendaAdapter.listSpaces({ includeInactive: true })
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los espacios.')
    } finally {
      loading.value = false
    }
  }

  function openForm (space: AgendaSpace | null) {
    editing.value = space
    Object.assign(form, {
      name: space?.name ?? '',
      campusId: space?.campusId ?? campusFilter.value,
      capacity: space?.capacity ?? '',
      isActive: space?.isActive ?? true,
    })
    fieldErrors.value = {}
    formError.value = null
    formOpen.value = true
  }

  watch(form, () => {
    fieldErrors.value = {}
  })

  async function save () {
    const result = await formRef.value?.validate()
    if (!result?.valid || saving.value) {
      return
    }

    const capacity = String(form.capacity).trim()
    const payload = {
      name: form.name.trim(),
      campusId: form.campusId,
      capacity: capacity ? Number(capacity) : null,
      isActive: form.isActive,
    }

    saving.value = true
    try {
      await (editing.value ? agendaAdapter.updateSpace(editing.value.id, payload) : agendaAdapter.createSpace(payload))
      formOpen.value = false
      notify(editing.value ? 'Espacio actualizado.' : 'Espacio agregado.')
      await load()
    } catch (error_) {
      const response = (error_ as ApiErrorShape)?.response
      fieldErrors.value = response?.data?.errors ?? {}
      formError.value = response?.data?.message ?? 'No fue posible guardar el espacio.'
    } finally {
      saving.value = false
    }
  }

  function askDelete (space: AgendaSpace) {
    spaceToDelete.value = space
    deleteOpen.value = true
  }

  async function confirmDelete () {
    if (!spaceToDelete.value) {
      return
    }
    deleting.value = true
    try {
      await agendaAdapter.deleteSpace(spaceToDelete.value.id)
      notify('Espacio eliminado.')
      await load()
    } catch (error_) {
      notify(resolveApiMessage(error_, 'No fue posible eliminar el espacio.'), 'error')
    } finally {
      deleting.value = false
      deleteOpen.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([
      load(),
      directoryAdapter.listCampuses().then(result => {
        campuses.value = result
      }).catch(() => undefined),
    ])
  })
</script>

<style scoped>
.agenda-admin {
  padding: 24px;
}

.agenda-admin__card {
  padding: 24px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-kicker {
  color: #c89215;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.card-title {
  margin: 4px 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.card-subtitle {
  margin: 0;
  color: #8a8a8a;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.toolbar__filter {
  flex: 0 1 260px;
}

.mobile-list {
  margin-top: 16px;
}

.mobile-list__state {
  display: grid;
  place-items: center;
  padding: 32px 0;
  color: #8a8a8a;
}

.mobile-card {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.mobile-card__body {
  flex: 1;
  min-width: 0;
}

.mobile-card__title {
  font-weight: 700;
}

.mobile-card__meta {
  color: #8a8a8a;
  font-size: 0.85rem;
}

.mobile-card__actions {
  display: flex;
}

@media (max-width: 840px) {
  .agenda-admin {
    padding: 12px;
  }

  .agenda-admin__card {
    padding: 16px;
  }

  .toolbar__filter {
    flex: 1 1 100%;
  }
}
</style>
