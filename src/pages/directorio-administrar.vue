<template>
  <div class="directory-admin">
    <v-card class="directory-admin__card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Directorio</div>
          <h2 class="card-title">Administrar extensiones</h2>
          <p class="card-subtitle">Da de alta y corrige las extensiones de URSE Rosario y URSE Alemán.</p>
        </div>

        <v-btn
          v-if="canCreate"
          color="#FAB21A"
          prepend-icon="mdi-phone-plus-outline"
          variant="flat"
          @click="openCreate"
        >
          Agregar extensión
        </v-btn>
      </div>

      <div class="toolbar">
        <v-text-field
          v-model="search"
          class="toolbar__search"
          clearable
          density="comfortable"
          hide-details
          :maxlength="SEARCH_MAX_LENGTH"
          :placeholder="smAndDown ? 'Buscar en el directorio' : 'Buscar por nombre, extensión, puesto o correo'"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />

        <v-select
          v-model="selectedCampusId"
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

        <v-autocomplete
          v-model="selectedAreaId"
          class="toolbar__filter toolbar__filter--wide"
          clearable
          density="comfortable"
          hide-details
          item-title="name"
          item-value="id"
          :items="areas"
          :loading="loadingAreas"
          no-data-text="Sin áreas"
          placeholder="Todas las áreas"
          prepend-inner-icon="mdi-sitemap-outline"
          variant="outlined"
        />
      </div>

      <v-alert
        v-if="error"
        class="mt-4"
        color="error"
        density="comfortable"
        variant="tonal"
      >
        {{ error }}

        <template #append>
          <v-btn size="small" variant="text" @click="loadEntries()">Reintentar</v-btn>
        </template>
      </v-alert>

      <div v-if="smAndDown" class="mobile-list">
        <div v-if="loading && entries.length === 0" class="mobile-list__state">
          <v-progress-circular color="#c89215" indeterminate size="28" />
        </div>

        <div v-else-if="entries.length === 0" class="mobile-list__state">
          No hay extensiones con estos filtros.
        </div>

        <template v-else>
          <article v-for="item in mobileEntries" :key="item.id" class="mobile-card">
            <div class="mobile-card__top">
              <span v-if="item.extension" class="ext-badge">{{ item.extension }}</span>
              <span v-else class="ext-badge ext-badge--empty">—</span>

              <div class="mobile-card__actions">
                <v-btn
                  v-if="canUpdate"
                  color="#c89215"
                  icon="mdi-pencil-outline"
                  size="small"
                  title="Editar"
                  variant="text"
                  @click="openEdit(item)"
                />

                <v-btn
                  v-if="canDelete"
                  color="error"
                  icon="mdi-delete-outline"
                  size="small"
                  title="Eliminar"
                  variant="text"
                  @click="askDelete(item)"
                />
              </div>
            </div>

            <div class="contact-cell__name">{{ item.name ?? item.position }}</div>
            <div v-if="item.name && item.position" class="contact-cell__position">{{ item.position }}</div>

            <div class="mobile-card__meta">
              <span class="campus-chip">{{ item.campus?.name ?? '—' }}</span>
              <span :class="{ muted: !item.area }">{{ item.area?.name ?? 'Sin área' }}</span>
            </div>

            <div v-if="item.email || item.secondaryEmail" class="email-cell mobile-card__emails">
              <span v-if="item.email">{{ item.email }}</span>
              <span v-if="item.secondaryEmail" class="muted">{{ item.secondaryEmail }}</span>
            </div>
          </article>

          <v-btn
            v-if="mobileEntries.length < entries.length"
            block
            color="#c89215"
            variant="tonal"
            @click="mobileLimit += MOBILE_PAGE"
          >
            Ver más ({{ mobileEntries.length }} de {{ entries.length }})
          </v-btn>
        </template>
      </div>

      <v-data-table
        v-else
        class="directory-table mt-4"
        density="comfortable"
        :headers="headers"
        hover
        item-value="id"
        :items="entries"
        :items-per-page="25"
        :items-per-page-options="[25, 50, 100, { value: -1, title: 'Todos' }]"
        items-per-page-text="Por página"
        :loading="loading"
        loading-text="Cargando directorio…"
        no-data-text="No hay extensiones con estos filtros."
      >
        <template #[`item.extension`]="{ item }">
          <span v-if="item.extension" class="ext-badge">{{ item.extension }}</span>
          <span v-else class="muted">—</span>
        </template>

        <template #[`item.name`]="{ item }">
          <div class="contact-cell">
            <div class="contact-cell__name">{{ item.name ?? item.position }}</div>
            <div v-if="item.name && item.position" class="contact-cell__position">{{ item.position }}</div>
          </div>
        </template>

        <template #[`item.area`]="{ item }">
          <span v-if="item.area">{{ item.area.name }}</span>
          <span v-else class="muted">Sin área</span>
        </template>

        <template #[`item.campus`]="{ item }">
          <span class="campus-chip">{{ item.campus?.name ?? '—' }}</span>
        </template>

        <template #[`item.email`]="{ item }">
          <div v-if="item.email || item.secondaryEmail" class="email-cell">
            <span v-if="item.email">{{ item.email }}</span>
            <span v-if="item.secondaryEmail" class="muted">{{ item.secondaryEmail }}</span>
          </div>

          <span v-else class="muted">Sin correo</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="row-actions">
            <v-btn
              v-if="canUpdate"
              color="#c89215"
              icon="mdi-pencil-outline"
              size="small"
              title="Editar"
              variant="text"
              @click="openEdit(item)"
            />

            <v-btn
              v-if="canDelete"
              color="error"
              icon="mdi-delete-outline"
              size="small"
              title="Eliminar"
              variant="text"
              @click="askDelete(item)"
            />
          </div>
        </template>
      </v-data-table>

      <div v-if="hasMore" class="more">
        <v-btn
          color="#c89215"
          :loading="loadingMore"
          prepend-icon="mdi-chevron-down"
          variant="tonal"
          @click="loadMore"
        >
          Cargar más ({{ entries.length }} de {{ meta.total }})
        </v-btn>
      </div>
    </v-card>

    <DirectoryEntryDialog
      v-model="dialogOpen"
      :campuses="campuses"
      :default-campus-id="selectedCampusId"
      :entry="editingEntry"
      @saved="onSaved"
    />

    <v-dialog v-model="deleteDialog" max-width="440" :persistent="deleting">
      <v-card rounded="xl">
        <v-card-title class="delete-title">
          <v-icon color="error" icon="mdi-alert-outline" />
          Eliminar extensión
        </v-card-title>

        <v-card-text>
          <p class="mb-3">Se eliminará del directorio:</p>

          <div v-if="deletingEntry" class="delete-summary">
            <span v-if="deletingEntry.extension" class="ext-badge">{{ deletingEntry.extension }}</span>

            <div>
              <div class="contact-cell__name">{{ deletingEntry.name ?? deletingEntry.position }}</div>

              <div class="contact-cell__position">
                {{ [deletingEntry.name ? deletingEntry.position : null, deletingEntry.area?.name, deletingEntry.campus?.name].filter(Boolean).join(' · ') }}
              </div>
            </div>
          </div>

          <p class="text-error mt-4 mb-0">Esta acción no se puede deshacer.</p>

          <v-alert
            v-if="deleteError"
            class="mt-4"
            color="error"
            density="comfortable"
            variant="tonal"
          >
            {{ deleteError }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn :disabled="deleting" variant="text" @click="deleteDialog = false">Cancelar</v-btn>

          <v-btn
            color="error"
            :loading="deleting"
            prepend-icon="mdi-delete-outline"
            variant="flat"
            @click="confirmDelete"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { DirectoryEntry } from '@/modules/directory/port'
  import { computed, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { DIRECTORY_CREATE_META, DIRECTORY_DELETE_META, DIRECTORY_UPDATE_META } from '@/modules/directory/access'
  import { directoryAdapter } from '@/modules/directory/adapter'
  import DirectoryEntryDialog from '@/modules/directory/components/DirectoryEntryDialog.vue'
  import { SEARCH_MAX_LENGTH, useDirectory } from '@/modules/directory/useDirectory'
  import { useAuthStore } from '@/stores/auth'
  import { canAccessRouteMeta } from '@/utils/routeAccess'

  const authStore = useAuthStore()

  const {
    campuses,
    areas,
    entries,
    meta,
    search,
    selectedCampusId,
    selectedAreaId,
    loading,
    loadingMore,
    loadingAreas,
    error,
    hasMore,
    loadEntries,
    loadMore,
  } = useDirectory()

  // The route lets in whoever holds either permission; each button still
  // checks its own, as the API answers 403 to the one that is missing.
  const canCreate = computed(() => canAccessRouteMeta(DIRECTORY_CREATE_META, authStore))
  const canUpdate = computed(() => canAccessRouteMeta(DIRECTORY_UPDATE_META, authStore))
  const canDelete = computed(() => canAccessRouteMeta(DIRECTORY_DELETE_META, authStore))

  // Below md the table would need ~960px; phones get one card per line instead,
  // revealed in chunks so the first paint stays light.
  const { smAndDown } = useDisplay()
  const MOBILE_PAGE = 25
  const mobileLimit = ref(MOBILE_PAGE)
  const mobileEntries = computed(() => entries.value.slice(0, mobileLimit.value))

  watch([search, selectedCampusId, selectedAreaId], () => {
    mobileLimit.value = MOBILE_PAGE
  })

  const headers = computed(() => [
    { title: 'Ext.', key: 'extension', width: 90 },
    { title: 'Nombre / puesto', key: 'name' },
    { title: 'Área', key: 'area' },
    { title: 'Campus', key: 'campus', width: 140 },
    { title: 'Correo', key: 'email' },
    ...(canUpdate.value || canDelete.value
      ? [{ title: '', key: 'actions', width: canUpdate.value && canDelete.value ? 104 : 64, align: 'end' as const, sortable: false }]
      : []),
  ])

  const dialogOpen = ref(false)
  const editingEntry = ref<DirectoryEntry | null>(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  function notify (text: string, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  function openCreate () {
    editingEntry.value = null
    dialogOpen.value = true
  }

  function openEdit (entry: DirectoryEntry) {
    editingEntry.value = entry
    dialogOpen.value = true
  }

  // Reload rather than patch the row in place: a new line or a changed
  // position moves it within the API's campus + Excel order.
  function onSaved (_entry: DirectoryEntry, created: boolean) {
    notify(created ? 'Extensión agregada.' : 'Cambios guardados.')
    loadEntries()
  }

  const deleteDialog = ref(false)
  const deletingEntry = ref<DirectoryEntry | null>(null)
  const deleting = ref(false)
  const deleteError = ref<string | null>(null)

  function askDelete (entry: DirectoryEntry) {
    deletingEntry.value = entry
    deleteError.value = null
    deleteDialog.value = true
  }

  function dropFromList (entryId: number) {
    const before = entries.value.length
    entries.value = entries.value.filter(entry => entry.id !== entryId)
    meta.value = { ...meta.value, total: Math.max(0, meta.value.total - (before - entries.value.length)) }
  }

  async function confirmDelete () {
    const entry = deletingEntry.value
    if (!entry || deleting.value) {
      return
    }

    deleting.value = true
    deleteError.value = null

    try {
      await directoryAdapter.deleteEntry(entry.id)
      dropFromList(entry.id)
      deleteDialog.value = false
      notify('Extensión eliminada.')
    } catch (error_) {
      const status = (error_ as { response?: { status?: number, data?: { message?: string } } })?.response?.status

      if (status === 404) {
        // Someone else got there first: the goal is met, the list was stale.
        deleteDialog.value = false
        notify('La extensión ya no existía; se actualizó la lista.', 'warning')
        loadEntries()
      } else if (status === 403) {
        deleteError.value = 'No tienes permiso para eliminar extensiones.'
      } else {
        deleteError.value = (error_ as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'No fue posible eliminar la extensión.'
      }
    } finally {
      deleting.value = false
    }
  }
</script>

<style scoped>
.directory-admin__card {
  padding: 28px;
  border: 1px solid rgb(0 0 0 / 0.06);
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-kicker {
  color: #c89215;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-title {
  margin: 8px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #5e5e5e;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.toolbar__search {
  flex: 2 1 280px;
}

.toolbar__filter {
  flex: 1 1 180px;
}

.toolbar__filter--wide {
  flex-basis: 240px;
}

.directory-table :deep(th) {
  color: #5e5e5e !important;
  font-size: 0.75rem;
  font-weight: 700 !important;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ext-badge {
  display: inline-block;
  min-width: 52px;
  padding: 3px 10px;
  border-radius: 8px;
  background: rgb(250 178 26 / 0.18);
  color: #5c4300;
  font-family: 'Roboto Mono', 'SF Mono', Consolas, monospace;
  font-weight: 800;
  text-align: center;
}

.contact-cell {
  padding: 6px 0;
}

.contact-cell__name {
  color: #1a1a1a;
  font-weight: 600;
}

.contact-cell__position {
  color: #6b5a3a;
  font-size: 0.78rem;
}

.campus-chip {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgb(26 26 26 / 0.07);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.email-cell {
  display: grid;
  font-size: 0.85rem;
}

.muted {
  color: #9a9a9a;
  font-size: 0.85rem;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
}

.delete-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px 8px;
  font-weight: 800;
}

.delete-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgb(0 0 0 / 0.08);
  border-radius: 12px;
  background: #faf7f2;
}

.more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.mobile-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.mobile-list__state {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  color: #5e5e5e;
}

.mobile-card {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid rgb(0 0 0 / 0.08);
  border-radius: 14px;
  background: #ffffff;
}

.mobile-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.mobile-card__actions {
  display: flex;
  margin-right: -8px;
}

.mobile-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin-top: 4px;
  font-size: 0.82rem;
}

.mobile-card__emails {
  min-width: 0;
  margin-top: 2px;
  overflow-wrap: anywhere;
}

.ext-badge--empty {
  color: #9a9a9a;
}

@media (max-width: 900px) {
  .directory-admin__card {
    padding: 20px 16px;
  }

  .card-head {
    flex-direction: column;
    align-items: stretch;
  }

  .card-title {
    font-size: 1.3rem;
  }
}
</style>
