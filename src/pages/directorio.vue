<template>
  <div class="directory-page">
    <section class="directory-hero">
      <div class="directory-hero__glow" />

      <div class="directory-hero__head">
        <div>
          <div class="directory-hero__kicker-row">
            <div class="directory-hero__kicker">
              <v-icon icon="mdi-phone-classic" size="16" />
              Directorio institucional
            </div>

            <router-link v-if="canManage" class="directory-hero__manage" to="/directorio/administrar">
              <v-icon icon="mdi-phone-settings-outline" size="16" />
              Administrar
            </router-link>

            <button
              class="directory-hero__manage directory-hero__export"
              :disabled="exporting"
              :title="`Descargar en Excel: ${exportScope}`"
              type="button"
              @click="exportExcel"
            >
              <v-progress-circular
                v-if="exporting"
                indeterminate
                size="14"
                width="2"
              />

              <v-icon v-else icon="mdi-microsoft-excel" size="16" />
              Descargar Excel
            </button>
          </div>

          <h2 class="directory-hero__title">Extensiones telefónicas</h2>

          <p class="directory-hero__subtitle">
            Encuentra la extensión, el puesto y el correo de cada área de URSE Rosario y URSE Alemán.
          </p>
        </div>

        <div class="directory-stats">
          <div class="directory-stat">
            <span class="directory-stat__value">{{ totalEntries }}</span>
            <span class="directory-stat__label">Extensiones</span>
          </div>

          <div class="directory-stat">
            <span class="directory-stat__value">{{ areas.length }}</span>
            <span class="directory-stat__label">Áreas</span>
          </div>

          <div class="directory-stat">
            <span class="directory-stat__value">{{ campuses.length }}</span>
            <span class="directory-stat__label">Campus</span>
          </div>
        </div>
      </div>

      <div class="directory-search">
        <v-icon class="directory-search__icon" icon="mdi-magnify" size="24" />

        <input
          ref="searchInput"
          v-model="search"
          aria-label="Buscar en el directorio"
          class="directory-search__input"
          :maxlength="SEARCH_MAX_LENGTH"
          :placeholder="searchPlaceholder"
          type="search"
        >

        <v-progress-circular
          v-if="loading && entries.length > 0"
          color="#c89215"
          indeterminate
          size="20"
          width="2"
        />

        <button
          v-if="search"
          aria-label="Limpiar búsqueda"
          class="directory-search__clear"
          type="button"
          @click="clearSearch"
        >
          <v-icon icon="mdi-close" size="18" />
        </button>

        <kbd v-else class="directory-search__hint">/</kbd>
      </div>

      <div class="directory-filters">
        <div class="campus-switch" role="tablist">
          <button
            :aria-selected="selectedCampusId === null"
            class="campus-switch__option"
            :class="{ 'campus-switch__option--active': selectedCampusId === null }"
            role="tab"
            type="button"
            @click="selectedCampusId = null"
          >
            <v-icon class="campus-switch__icon" icon="mdi-domain" size="18" />
            <span class="campus-switch__label">Todos</span>
            <span class="campus-switch__count">{{ totalEntries }}</span>
          </button>

          <button
            v-for="campus in campuses"
            :key="campus.id"
            :aria-selected="selectedCampusId === campus.id"
            class="campus-switch__option"
            :class="{ 'campus-switch__option--active': selectedCampusId === campus.id }"
            role="tab"
            type="button"
            @click="selectedCampusId = campus.id"
          >
            <v-icon class="campus-switch__icon" icon="mdi-map-marker-outline" size="18" />

            <span class="campus-switch__label">
              <span class="campus-switch__prefix">{{ campusPrefix(campus.name) }}</span>{{ campusShortName(campus.name) }}
            </span>

            <span class="campus-switch__count">{{ campus.entriesCount }}</span>
          </button>
        </div>

        <v-autocomplete
          v-model="selectedAreaId"
          class="area-filter"
          clearable
          density="compact"
          hide-details
          :item-props="areaItemProps"
          :items="areaItems"
          :loading="loadingAreas"
          no-data-text="Sin áreas"
          placeholder="Todas las áreas"
          prepend-inner-icon="mdi-sitemap-outline"
          rounded="pill"
          variant="solo"
        />
      </div>
    </section>

    <v-alert
      v-if="exportError"
      closable
      color="error"
      rounded="lg"
      variant="tonal"
      @click:close="exportError = null"
    >
      {{ exportError }}
    </v-alert>

    <v-alert
      v-if="error"
      color="error"
      rounded="lg"
      variant="tonal"
    >
      {{ error }}

      <template #append>
        <v-btn size="small" variant="text" @click="loadEntries()">Reintentar</v-btn>
      </template>
    </v-alert>

    <div v-if="loading && entries.length === 0" class="entry-grid">
      <v-skeleton-loader
        v-for="n in 8"
        :key="n"
        class="entry-skeleton"
        type="list-item-avatar-three-line"
      />
    </div>

    <div v-else-if="!error && groups.length === 0" class="directory-empty">
      <div class="directory-empty__icon">
        <v-icon icon="mdi-phone-off-outline" size="36" />
      </div>

      <h3>{{ hasFilters ? 'Sin coincidencias' : 'El directorio está vacío' }}</h3>

      <p v-if="search">
        No encontramos resultados para <strong>“{{ search }}”</strong> con los filtros actuales.
      </p>

      <v-btn
        v-if="hasFilters"
        color="#c89215"
        variant="tonal"
        @click="resetFilters"
      >
        Limpiar filtros
      </v-btn>
    </div>

    <div v-else-if="!error" class="directory-results" :class="{ 'directory-results--stale': loading }">
      <div class="results-summary">
        <span>
          <strong>{{ meta.total }}</strong>
          {{ meta.total === 1 ? 'extensión encontrada' : 'extensiones encontradas' }}
        </span>
      </div>

      <section v-for="group in groups" :key="group.key" class="area-section">
        <header class="area-section__head">
          <div class="area-section__icon">
            <v-icon :icon="group.areaName ? 'mdi-sitemap-outline' : 'mdi-dots-grid'" size="18" />
          </div>

          <h3 class="area-section__title">
            <template v-for="(part, index) in highlight(group.areaName ?? 'Otros contactos')" :key="index">
              <mark v-if="part.match">{{ part.text }}</mark>
              <template v-else>{{ part.text }}</template>
            </template>
          </h3>

          <span v-if="selectedCampusId === null && group.campusName" class="area-section__campus">
            <v-icon icon="mdi-map-marker-outline" size="12" />
            {{ group.campusName }}
          </span>

          <span class="area-section__count">{{ group.entries.length }}</span>
        </header>

        <div class="entry-grid">
          <article
            v-for="entry in group.entries"
            :key="entry.id"
            class="entry-card"
            :class="{ 'entry-card--editable': canUpdate }"
          >
            <button
              class="entry-card__extension"
              :disabled="!entry.extension"
              :title="entry.extension ? `Copiar extensión ${entry.extension}` : 'Sin extensión'"
              type="button"
              @click="copy(entry.extension, 'Extensión copiada')"
            >
              <v-icon icon="mdi-phone" size="16" />

              <span>
                <template v-for="(part, index) in highlight(entry.extension || '—')" :key="index">
                  <mark v-if="part.match">{{ part.text }}</mark>
                  <template v-else>{{ part.text }}</template>
                </template>
              </span>
            </button>

            <div class="entry-card__body">
              <div class="entry-card__name">
                <template v-for="(part, index) in highlight(cardTitle(entry))" :key="index">
                  <mark v-if="part.match">{{ part.text }}</mark>
                  <template v-else>{{ part.text }}</template>
                </template>
              </div>

              <div v-if="entry.name && entry.position" class="entry-card__position">
                <template v-for="(part, index) in highlight(toDisplayCase(entry.position))" :key="index">
                  <mark v-if="part.match">{{ part.text }}</mark>
                  <template v-else>{{ part.text }}</template>
                </template>
              </div>

              <template v-for="address in emailsOf(entry)" :key="address">
                <div class="entry-card__email">
                  <a :href="`mailto:${address}`" :title="`Escribir a ${address}`">
                    <v-icon icon="mdi-email-outline" size="15" />

                    <span>
                      <template v-for="(part, index) in highlight(address)" :key="index">
                        <mark v-if="part.match">{{ part.text }}</mark>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </span>
                  </a>

                  <button
                    aria-label="Copiar correo"
                    class="entry-card__copy"
                    type="button"
                    @click="copy(address, 'Correo copiado')"
                  >
                    <v-icon icon="mdi-content-copy" size="14" />
                  </button>
                </div>
              </template>

              <div v-if="emailsOf(entry).length === 0" class="entry-card__email entry-card__email--empty">
                Sin correo
              </div>
            </div>

            <button
              v-if="canUpdate"
              aria-label="Editar extensión"
              class="entry-card__edit"
              title="Editar"
              type="button"
              @click="openEdit(entry)"
            >
              <v-icon icon="mdi-pencil-outline" size="16" />
            </button>
          </article>
        </div>
      </section>

      <div v-if="hasMore" class="directory-more">
        <v-btn
          color="#c89215"
          :loading="loadingMore"
          prepend-icon="mdi-chevron-down"
          rounded="pill"
          variant="tonal"
          @click="loadMore"
        >
          Mostrar más ({{ entries.length }} de {{ meta.total }})
        </v-btn>
      </div>
    </div>

    <DirectoryEntryDialog
      v-if="canUpdate"
      v-model="editDialog"
      :campuses="campuses"
      :entry="editingEntry"
      @saved="onSaved"
    />

    <v-snackbar
      v-model="snackbar.show"
      color="#1a1a1a"
      location="bottom center"
      rounded="pill"
      :timeout="1800"
    >
      <v-icon class="mr-2" color="#FAB21A" icon="mdi-check-circle" size="18" />
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { DirectoryEntry } from '@/modules/directory/port'
  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { DIRECTORY_ADMIN_META, DIRECTORY_UPDATE_META } from '@/modules/directory/access'
  import DirectoryEntryDialog from '@/modules/directory/components/DirectoryEntryDialog.vue'
  import { normalizeText, SEARCH_MAX_LENGTH, toDisplayCase, useDirectory } from '@/modules/directory/useDirectory'
  import { useAuthStore } from '@/stores/auth'
  import { canAccessRouteMeta } from '@/utils/routeAccess'

  const {
    campuses,
    areas,
    entries,
    meta,
    search,
    searchTerms,
    selectedCampusId,
    selectedAreaId,
    loading,
    loadingMore,
    loadingAreas,
    error,
    groups,
    totalEntries,
    hasFilters,
    hasMore,
    loadEntries,
    loadMore,
    resetFilters,
    exporting,
    exportError,
    exportExcel,
  } = useDirectory()

  const searchInput = ref<HTMLInputElement | null>(null)

  const { xs } = useDisplay()
  const searchPlaceholder = computed(() => xs.value
    ? 'Buscar en el directorio…'
    : 'Busca por nombre, extensión, área, puesto o correo…')

  // On a phone the three campus tabs share one row, so "URSE " is dropped
  // there (CSS hides the prefix) and only "Rosario" / "Alemán" remain.
  const CAMPUS_PREFIX = /^URSE\s+/i

  function campusPrefix (name: string) {
    return CAMPUS_PREFIX.exec(name)?.[0] ?? ''
  }

  function campusShortName (name: string) {
    return name.replace(CAMPUS_PREFIX, '')
  }
  const snackbar = reactive({ show: false, text: '' })

  // Only editors see the shortcuts; everybody else gets the read-only directory.
  const authStore = useAuthStore()
  // The download follows the campus tab: one sheet, or both under "Todos".
  const exportScope = computed(() =>
    campuses.value.find(campus => campus.id === selectedCampusId.value)?.name ?? 'ambos campus',
  )

  const canManage = computed(() => canAccessRouteMeta(DIRECTORY_ADMIN_META, authStore))
  const canUpdate = computed(() => canAccessRouteMeta(DIRECTORY_UPDATE_META, authStore))

  const editDialog = ref(false)
  const editingEntry = ref<DirectoryEntry | null>(null)

  function openEdit (entry: DirectoryEntry) {
    editingEntry.value = entry
    editDialog.value = true
  }

  function onSaved () {
    snackbar.text = 'Cambios guardados'
    snackbar.show = true
    loadEntries()
  }

  const areaItems = computed(() => areas.value.map(area => ({
    title: area.name,
    value: area.id,
    subtitle: `${area.entriesCount} ${area.entriesCount === 1 ? 'extensión' : 'extensiones'}`,
  })))

  function areaItemProps (item: { subtitle: string }) {
    return { subtitle: item.subtitle }
  }

  // Lines like "SALA DE JUNTAS" have no person behind them: the position is the title.
  function cardTitle (entry: DirectoryEntry) {
    return toDisplayCase(entry.name ?? entry.position) || 'Sin nombre'
  }

  function emailsOf (entry: DirectoryEntry): string[] {
    const addresses: string[] = []
    for (const address of [entry.email, entry.secondaryEmail]) {
      if (address) {
        addresses.push(address)
      }
    }
    return addresses
  }

  interface HighlightPart {
    text: string
    match: boolean
  }

  // Matches on the accent-free text but slices the original, so "alemán" keeps
  // its accent while still lighting up for "aleman". Each character normalizes
  // to exactly one, which keeps both strings index-aligned.
  function highlight (text: string): HighlightPart[] {
    const terms = searchTerms.value
    if (terms.length === 0 || !text) {
      return [{ text, match: false }]
    }

    const chars = [...text]
    const normalized = chars.map(char => normalizeText(char).charAt(0) || ' ').join('')
    const marked = Array.from({ length: chars.length }, () => false)

    for (const term of terms) {
      let from = normalized.indexOf(term)
      while (from !== -1) {
        marked.fill(true, from, from + term.length)
        from = normalized.indexOf(term, from + term.length)
      }
    }

    const parts: HighlightPart[] = []
    for (const [index, char] of chars.entries()) {
      const last = parts.at(-1)
      if (last && last.match === marked[index]) {
        last.text += char
      } else {
        parts.push({ text: char, match: marked[index] ?? false })
      }
    }
    return parts
  }

  async function copy (value: string, message: string) {
    if (!value) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      snackbar.text = message
    } catch {
      snackbar.text = 'No fue posible copiar al portapapeles'
    }
    snackbar.show = true
  }

  function clearSearch () {
    search.value = ''
    searchInput.value?.focus()
  }

  // "/" jumps to the search box from anywhere on the page, like most directories.
  function onKeydown (event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    const typing = target?.closest('input, textarea, [contenteditable="true"]')

    if (event.key === '/' && !typing) {
      event.preventDefault()
      searchInput.value?.focus()
    } else if (event.key === 'Escape' && target === searchInput.value) {
      search.value = ''
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    searchInput.value?.focus()
  })

  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.directory-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

/* Hero */
.directory-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
  padding: 32px;
  /* clip, not hidden: a hidden box can still be scrolled sideways when focus lands inside it. */
  overflow: clip;
  border-radius: 24px;
  background: linear-gradient(135deg, #141414 0%, #2a2112 55%, #3d2c00 100%);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.18);
  color: #ffffff;
}

.directory-hero__glow {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(250 178 26 / 0.35) 0%, transparent 70%);
  pointer-events: none;
}

.directory-hero__head {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.directory-hero__kicker-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.directory-hero__manage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 999px;
  color: rgb(255 255 255 / 0.85);
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.directory-hero__manage:hover {
  border-color: #FAB21A;
  color: #FAB21A;
}

.directory-hero__export {
  border-color: rgb(250 178 26 / 0.45);
  background: rgb(250 178 26 / 0.12);
  color: #FAB21A;
}

.directory-hero__export:disabled {
  cursor: progress;
  opacity: 0.7;
}

.directory-hero__kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid rgb(250 178 26 / 0.4);
  border-radius: 999px;
  background: rgb(250 178 26 / 0.12);
  color: #FAB21A;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.directory-hero__title {
  margin: 12px 0 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.directory-hero__subtitle {
  margin: 6px 0 0;
  max-width: 560px;
  color: rgb(255 255 255 / 0.72);
}

.directory-stats {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.directory-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 92px;
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.06);
  backdrop-filter: blur(6px);
}

.directory-stat__value {
  color: #FAB21A;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
}

.directory-stat__label {
  color: rgb(255 255 255 / 0.65);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Search */
.directory-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgb(0 0 0 / 0.25);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.directory-search:focus-within {
  border-color: #FAB21A;
  box-shadow: 0 0 0 5px rgb(250 178 26 / 0.25), 0 10px 28px rgb(0 0 0 / 0.25);
}

.directory-search__icon {
  color: #c89215;
}

.directory-search__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #101010;
  font-size: 1.05rem;
}

.directory-search__input::placeholder {
  color: #8a8a8a;
}

.directory-search__input::-webkit-search-cancel-button {
  display: none;
}

.directory-search__clear {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f1ece4;
  color: #5e5e5e;
  transition: background 0.2s ease;
}

.directory-search__clear:hover {
  background: #e6dccd;
}

.directory-search__hint {
  padding: 2px 8px;
  border: 1px solid #ddd5c8;
  border-radius: 6px;
  background: #f7f3ed;
  color: #8a8a8a;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
}

/* Filters */
.directory-filters {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.area-filter {
  flex: 0 1 340px;
  min-width: 220px;
}

/* Campus switch */
.campus-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.campus-switch__option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 14px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(255 255 255 / 0.85);
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.campus-switch__option:hover {
  border-color: rgb(250 178 26 / 0.6);
  background: rgb(250 178 26 / 0.1);
}

.campus-switch__option--active {
  border-color: #FAB21A;
  background: #FAB21A;
  color: #1a1a1a;
}

.campus-switch__option--active:hover {
  background: #FAB21A;
}

.campus-switch__count {
  min-width: 26px;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  font-size: 0.78rem;
  text-align: center;
}

.campus-switch__option--active .campus-switch__count {
  background: rgb(0 0 0 / 0.14);
}

/* Results */
.directory-results {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  transition: opacity 0.2s ease;
}

.directory-results--stale {
  opacity: 0.55;
}

.directory-more {
  display: flex;
  justify-content: center;
}

.results-summary {
  color: #5e5e5e;
  font-size: 0.9rem;
}

.results-summary strong {
  color: #1a1a1a;
}

.area-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.area-section__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.area-section__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #1a1a1a;
  color: #FAB21A;
}

.area-section__title {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.1rem;
  font-weight: 800;
}

.area-section__campus {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px 1px 6px;
  border-radius: 999px;
  background: rgb(26 26 26 / 0.08);
  color: #1a1a1a;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.area-section__count {
  padding: 1px 10px;
  border-radius: 999px;
  background: rgb(250 178 26 / 0.18);
  color: #8a5a00;
  font-size: 0.78rem;
  font-weight: 700;
}

.area-section__head::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgb(0 0 0 / 0.12), transparent);
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 14px;
}

.entry-skeleton {
  border-radius: 18px;
}

.entry-card__edit {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #8a8a8a;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.entry-card--editable .entry-card__body {
  padding-right: 22px;
}

.entry-card:hover .entry-card__edit,
.entry-card__edit:focus-visible {
  opacity: 1;
}

.entry-card__edit:hover {
  background: #f1ece4;
  color: #1a1a1a;
}

.entry-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgb(0 0 0 / 0.06);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-3px);
  border-color: rgb(250 178 26 / 0.45);
  box-shadow: 0 12px 26px rgb(0 0 0 / 0.1);
}

.entry-card__extension {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  min-width: 76px;
  padding: 10px 8px;
  border-radius: 14px;
  background: linear-gradient(135deg, #FAB21A 0%, #e09a00 100%);
  box-shadow: 0 6px 14px rgb(250 178 26 / 0.35);
  color: #1a1a1a;
  font-family: 'Roboto Mono', 'SF Mono', Consolas, monospace;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  transition: transform 0.15s ease;
}

.entry-card__extension:hover:not(:disabled) {
  transform: scale(1.04);
}

.entry-card__extension:disabled {
  cursor: default;
  filter: grayscale(0.6);
  opacity: 0.7;
}

.entry-card__extension:active {
  transform: scale(0.97);
}

.entry-card__extension .v-icon {
  opacity: 0.7;
}

.entry-card__body {
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.entry-card__name {
  color: #1a1a1a;
  font-weight: 700;
  line-height: 1.3;
}

.entry-card__position {
  margin-top: -4px;
  color: #6b5a3a;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
}

.entry-card__email {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.entry-card__email a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: #8a5a00;
  font-size: 0.85rem;
  text-decoration: none;
}

.entry-card__email a span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-card__email a:hover span {
  text-decoration: underline;
}

.entry-card__email--empty {
  color: #9a9a9a;
  font-size: 0.85rem;
  font-style: italic;
}

.entry-card__copy {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  color: #8a8a8a;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.entry-card:hover .entry-card__copy,
.entry-card__copy:focus-visible {
  opacity: 1;
}

.entry-card__copy:hover {
  background: #f1ece4;
  color: #1a1a1a;
}

mark {
  border-radius: 3px;
  background: rgb(250 178 26 / 0.45);
  color: inherit;
}

.entry-card__extension mark {
  background: #1a1a1a;
  color: #FAB21A;
}

/* Empty state */
.directory-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  border: 2px dashed rgb(0 0 0 / 0.1);
  border-radius: 24px;
  background: rgb(255 255 255 / 0.6);
  text-align: center;
}

.directory-empty__icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgb(250 178 26 / 0.15);
  color: #c89215;
}

.directory-empty h3 {
  margin: 4px 0 0;
  color: #1a1a1a;
  font-size: 1.2rem;
  font-weight: 800;
}

.directory-empty p {
  margin: 0;
  color: #5e5e5e;
}

@media (hover: none) {
  .entry-card__copy,
  .entry-card__edit {
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .directory-hero {
    padding: 24px 18px;
  }

  .directory-hero__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .directory-stats {
    width: 100%;
  }

  .directory-stat {
    flex: 1;
    min-width: 0;
    padding: 10px 6px;
  }

  .directory-search {
    height: 52px;
    padding: 0 14px;
  }

  .directory-search__input {
    font-size: 0.95rem;
  }

  .directory-search__hint {
    display: none;
  }

  .area-filter {
    flex: 1 1 100%;
  }

  .area-section__head {
    flex-wrap: wrap;
  }

  .area-section__title {
    flex: 1 1 calc(100% - 44px);
  }

  .area-section__head::after {
    display: none;
  }
}

@media (max-width: 600px) {
  .directory-hero {
    gap: 18px;
    padding: 20px 14px;
    border-radius: 20px;
  }

  .directory-hero__title {
    font-size: 1.5rem;
  }

  .directory-hero__subtitle {
    font-size: 0.9rem;
  }

  .directory-stats {
    gap: 8px;
  }

  .directory-stat {
    padding: 8px 4px;
    border-radius: 12px;
  }

  .directory-stat__value {
    font-size: 1.25rem;
  }

  .directory-stat__label {
    font-size: 0.6rem;
    letter-spacing: 0.02em;
  }

  /* One row of three equal tabs instead of three stacked pills. */
  .campus-switch {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    gap: 6px;
  }

  .campus-switch__option {
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    padding: 8px 4px;
    border-radius: 14px;
    font-size: 0.85rem;
  }

  .campus-switch__icon,
  .campus-switch__prefix {
    display: none;
  }

  .campus-switch__label {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .area-section__title {
    font-size: 1rem;
  }

  .entry-grid {
    gap: 10px;
  }

  .entry-card {
    gap: 12px;
    padding: 12px;
    border-radius: 16px;
  }

  .entry-card:hover {
    transform: none;
  }

  .entry-card__extension {
    min-width: 58px;
    padding: 8px 6px;
    border-radius: 12px;
    font-size: 1.05rem;
  }

  .entry-card__name {
    font-size: 0.95rem;
  }
}
</style>
