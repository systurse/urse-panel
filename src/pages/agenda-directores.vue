<template>
  <div class="agenda-admin">
    <v-card class="agenda-admin__card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Agenda institucional</div>
          <h2 class="card-title">Directores</h2>

          <p class="card-subtitle">
            Quién usa la agenda y a nombre de qué área publica. Los coordinadores (Asuntos Académicos)
            gestionan las actividades de todas las áreas, los espacios y esta lista.
          </p>
        </div>

        <v-btn color="#FAB21A" prepend-icon="mdi-account-plus-outline" variant="flat" @click="openForm(null)">
          Registrar director
        </v-btn>
      </div>

      <div class="toolbar">
        <v-text-field
          v-model="search"
          class="toolbar__search"
          clearable
          density="comfortable"
          hide-details
          placeholder="Buscar por nombre, correo o área"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
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
        <div v-else-if="visibleDirectors.length === 0" class="mobile-list__state">No hay directores registrados.</div>

        <article v-for="director in visibleDirectors" v-else :key="director.id" class="mobile-card">
          <div class="mobile-card__body">
            <div class="mobile-card__title">{{ director.user?.name }}</div>
            <div class="mobile-card__meta">{{ director.typeLabel }} · {{ director.area?.name }}</div>
            <div class="mobile-card__meta">{{ director.user?.email }}</div>

            <v-chip
              v-if="director.isCoordinator"
              class="mt-1"
              color="#c89215"
              size="x-small"
              variant="tonal"
            >Coordinador</v-chip>
          </div>

          <div class="mobile-card__actions">
            <v-btn
              aria-label="Editar"
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click="openForm(director)"
            />

            <v-btn
              aria-label="Quitar"
              color="error"
              icon="mdi-account-remove-outline"
              size="small"
              variant="text"
              @click="askDelete(director)"
            />
          </div>
        </article>
      </div>

      <v-data-table
        v-else
        class="mt-4"
        :headers="headers"
        item-value="id"
        :items="visibleDirectors"
        :loading="loading"
        loading-text="Cargando directores…"
        no-data-text="No hay directores registrados."
      >
        <template #[`item.user`]="{ item }">
          <div class="font-weight-bold">{{ item.user?.name }}</div>
          <div class="text-medium-emphasis text-caption">{{ item.user?.email }}</div>
        </template>

        <template #[`item.area`]="{ item }">{{ item.area?.name }}</template>

        <template #[`item.isCoordinator`]="{ item }">
          <v-chip
            v-if="item.isCoordinator"
            color="#c89215"
            prepend-icon="mdi-shield-star-outline"
            size="small"
            variant="tonal"
          >
            Coordinador
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
            aria-label="Quitar"
            color="error"
            icon="mdi-account-remove-outline"
            size="small"
            variant="text"
            @click="askDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="formOpen" :fullscreen="xs" max-width="560" persistent>
      <v-card :rounded="xs ? 0 : 'xl'">
        <v-card-title class="pt-5 px-6">{{ editing ? 'Editar director' : 'Registrar director' }}</v-card-title>

        <v-card-text class="px-6">
          <v-alert
            v-if="formError"
            class="mb-4"
            color="error"
            density="comfortable"
            variant="tonal"
          >{{ formError }}</v-alert>

          <v-form ref="formRef" @submit.prevent="save">
            <v-autocomplete
              v-if="!editing"
              v-model="form.user"
              v-model:search="userSearch"
              class="mb-3"
              :error-messages="fieldErrors.user_id"
              hide-details="auto"
              item-title="name"
              item-value="id"
              :items="userResults"
              label="Usuario *"
              :loading="usersLoading"
              no-data-text="Escribe un nombre o correo para buscar"
              no-filter
              prepend-inner-icon="mdi-account-search-outline"
              return-object
              :rules="[(value: unknown) => Boolean(value) || 'Selecciona al usuario.']"
              variant="outlined"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :subtitle="item.email" />
              </template>
            </v-autocomplete>

            <div v-else class="director-user mb-4">
              <v-icon icon="mdi-account-tie-outline" />

              <div>
                <div class="font-weight-bold">{{ editing.user?.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ editing.user?.email }}</div>
              </div>
            </div>

            <v-select
              v-model="form.type"
              class="mb-3"
              :error-messages="fieldErrors.type"
              hide-details="auto"
              :items="TYPE_OPTIONS"
              label="Cargo *"
              prepend-inner-icon="mdi-badge-account-outline"
              variant="outlined"
            />

            <v-autocomplete
              v-model="form.areaId"
              class="mb-3"
              :error-messages="fieldErrors.area_id"
              hide-details="auto"
              hint="Los eventos que publique quedarán a nombre de esta área."
              item-title="name"
              item-value="id"
              :items="areaOptions"
              label="Área que representa *"
              no-data-text="Sin áreas"
              persistent-hint
              prepend-inner-icon="mdi-sitemap-outline"
              :rules="[(value: number | null) => value !== null || 'Selecciona el área.']"
              variant="outlined"
            />

            <v-checkbox
              v-model="form.isCoordinator"
              color="#c89215"
              :error-messages="fieldErrors.is_coordinator"
              hide-details="auto"
              label="Coordinador de agenda (gestiona todas las áreas, espacios y directores)"
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
        <v-card-title class="pt-5 px-6">¿Quitar al director?</v-card-title>

        <v-card-text class="px-6">
          <strong>{{ directorToDelete?.user?.name }}</strong> dejará de tener acceso a la agenda.
          Las actividades que ya publicó se conservan a nombre de su área.
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn :disabled="deleting" variant="text" @click="deleteOpen = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" variant="flat" @click="confirmDelete">Quitar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { AgendaDirector, AgendaDirectorType, AgendaUserSummary } from '@/modules/agenda/port'
  import type { Area } from '@/modules/areas/port'
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import { resolveApiMessage } from '@/modules/agenda/useAgendaCalendar'
  import { areasAdapter } from '@/modules/areas/adapter'
  import { normalizeText } from '@/modules/directory/useDirectory'

  interface ApiErrorShape {
    response?: { status?: number, data?: { message?: string, errors?: Record<string, string[]> } }
  }

  const TYPE_OPTIONS: { title: string, value: AgendaDirectorType }[] = [
    { title: 'Rector', value: 'rector' },
    { title: 'Director general', value: 'general_director' },
    { title: 'Director de escuela', value: 'school_director' },
  ]

  const { xs, smAndDown } = useDisplay()

  const directors = ref<AgendaDirector[]>([])
  const areas = ref<Area[]>([])
  const search = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const formOpen = ref(false)
  const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
  const editing = ref<AgendaDirector | null>(null)
  const form = reactive({
    user: null as AgendaUserSummary | null,
    type: 'school_director' as AgendaDirectorType,
    areaId: null as number | null,
    isCoordinator: false,
  })
  const fieldErrors = ref<Record<string, string[]>>({})
  const formError = ref<string | null>(null)
  const saving = ref(false)

  const userSearch = ref('')
  const userResults = ref<AgendaUserSummary[]>([])
  const usersLoading = ref(false)
  let userSearchTimer: ReturnType<typeof setTimeout> | undefined

  const deleteOpen = ref(false)
  const directorToDelete = ref<AgendaDirector | null>(null)
  const deleting = ref(false)

  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const headers = [
    { title: 'Director', key: 'user', sortable: false },
    { title: 'Cargo', key: 'typeLabel' },
    { title: 'Área', key: 'area', sortable: false },
    { title: '', key: 'isCoordinator', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' as const },
  ]

  // `toSorted` is not available at this project's TS lib level; this sorts a fresh copy.
  // eslint-disable-next-line unicorn/no-array-sort
  const areaOptions = computed(() => areas.value.map(area => ({ id: Number(area.id), name: area.name })).sort((a, b) => a.name.localeCompare(b.name, 'es')))

  const visibleDirectors = computed(() => {
    const term = normalizeText(search.value ?? '')
    if (!term) {
      return directors.value
    }
    return directors.value.filter(director => normalizeText(
      `${director.user?.name ?? ''} ${director.user?.email ?? ''} ${director.area?.name ?? ''} ${director.typeLabel}`,
    ).includes(term))
  })

  function notify (text: string, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  async function load () {
    loading.value = true
    error.value = null
    try {
      directors.value = await agendaAdapter.listDirectors()
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los directores.')
    } finally {
      loading.value = false
    }
  }

  watch(userSearch, value => {
    clearTimeout(userSearchTimer)
    const term = value?.trim() ?? ''
    if (term.length < 2 || term === form.user?.name) {
      return
    }
    userSearchTimer = setTimeout(async () => {
      usersLoading.value = true
      try {
        userResults.value = await agendaAdapter.searchUsers(term)
      } catch {
        userResults.value = []
      } finally {
        usersLoading.value = false
      }
    }, 350)
  })

  onBeforeUnmount(() => clearTimeout(userSearchTimer))

  watch(form, () => {
    fieldErrors.value = {}
  })

  function openForm (director: AgendaDirector | null) {
    editing.value = director
    Object.assign(form, {
      user: director?.user ?? null,
      type: director?.type ?? 'school_director',
      areaId: director?.areaId ?? null,
      isCoordinator: director?.isCoordinator ?? false,
    })
    userResults.value = director?.user ? [director.user] : []
    fieldErrors.value = {}
    formError.value = null
    formOpen.value = true
  }

  async function save () {
    const result = await formRef.value?.validate()
    if (!result?.valid || saving.value) {
      return
    }

    saving.value = true
    try {
      await (editing.value ? agendaAdapter.updateDirector(editing.value.id, { type: form.type, areaId: form.areaId ?? undefined, isCoordinator: form.isCoordinator }) : agendaAdapter.createDirector({ userId: form.user?.id, type: form.type, areaId: form.areaId ?? undefined, isCoordinator: form.isCoordinator }))
      formOpen.value = false
      notify(editing.value ? 'Director actualizado.' : 'Director registrado.')
      await load()
    } catch (error_) {
      const response = (error_ as ApiErrorShape)?.response
      fieldErrors.value = response?.data?.errors ?? {}
      formError.value = response?.data?.message ?? 'No fue posible guardar al director.'
    } finally {
      saving.value = false
    }
  }

  function askDelete (director: AgendaDirector) {
    directorToDelete.value = director
    deleteOpen.value = true
  }

  async function confirmDelete () {
    if (!directorToDelete.value) {
      return
    }
    deleting.value = true
    try {
      await agendaAdapter.deleteDirector(directorToDelete.value.id)
      notify('Director quitado.')
      await load()
    } catch (error_) {
      notify(resolveApiMessage(error_, 'No fue posible quitar al director.'), 'error')
    } finally {
      deleting.value = false
      deleteOpen.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([
      load(),
      areasAdapter.list().then(result => {
        areas.value = result
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

.card-head > div {
  max-width: 720px;
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
  margin-top: 20px;
}

.toolbar__search {
  max-width: 420px;
}

.director-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(250, 178, 26, 0.12);
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
  overflow-wrap: anywhere;
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

  .toolbar__search {
    max-width: none;
  }
}
</style>
