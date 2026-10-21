<template>
  <div class="agenda-page">
    <header class="agenda-page__hero">
      <div class="agenda-page__hero-text">
        <div class="agenda-page__kicker">Agenda institucional</div>
        <h1 class="agenda-page__title">Uso de espacios y actividades</h1>

        <p class="agenda-page__subtitle">
          Rectoría, direcciones generales y escuelas
          <template v-if="context?.director?.area"> · Publicas como <strong>{{ context.director.area.name }}</strong></template>
          <template v-else-if="context?.canManageAll"> · Gestionas la agenda de todas las áreas</template>
        </p>
      </div>

      <div class="agenda-page__hero-actions">
        <v-menu v-if="context?.canExport" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              class="agenda-page__export"
              :loading="exporting !== null"
              prepend-icon="mdi-download"
              variant="outlined"
            >
              Exportar
            </v-btn>
          </template>

          <v-list density="compact">
            <v-list-subheader>Lo que estás viendo, con los filtros</v-list-subheader>
            <v-list-item prepend-icon="mdi-file-pdf-box" title="PDF" @click="exportAgenda('pdf')" />
            <v-list-item prepend-icon="mdi-file-excel-outline" title="Excel" @click="exportAgenda('xlsx')" />
          </v-list>
        </v-menu>

        <v-btn
          v-if="context?.canCreate && !smAndDown"
          color="#FAB21A"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="openCreate(null)"
        >
          Nueva actividad
        </v-btn>
      </div>
    </header>

    <v-alert
      v-if="error"
      class="mb-4"
      closable
      color="error"
      density="comfortable"
      variant="tonal"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <v-alert
      v-if="context && !context.director && !context.canManageAll"
      class="mb-4"
      color="info"
      density="comfortable"
      variant="tonal"
    >
      Puedes consultar la agenda, pero aún no tienes un área asignada para publicar actividades.
      Pide a la Dirección General de Asuntos Académicos que te registre como director.
    </v-alert>

    <v-card class="agenda-page__panel" rounded="xl">
      <div class="agenda-page__toolbar">
        <div class="agenda-page__nav">
          <v-btn
            aria-label="Anterior"
            icon="mdi-chevron-left"
            size="small"
            variant="text"
            @click="move(-1)"
          />

          <v-btn class="agenda-page__today" size="small" variant="outlined" @click="goToday">Hoy</v-btn>

          <v-btn
            aria-label="Siguiente"
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            @click="move(1)"
          />

          <h2 class="agenda-page__period">{{ title }}</h2>

          <v-progress-circular
            v-if="loading"
            class="ml-2"
            color="#c89215"
            indeterminate
            size="18"
            width="2"
          />
        </div>

        <v-btn-toggle
          v-model="view"
          class="agenda-page__views"
          color="#c89215"
          density="compact"
          divided
          mandatory
          variant="outlined"
        >
          <v-btn
            v-for="option in AGENDA_VIEWS"
            :key="option.value"
            :prepend-icon="smAndDown ? undefined : option.icon"
            :value="option.value"
          >
            {{ option.title }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <div class="agenda-page__filters-bar">
        <v-text-field
          v-model="filters.search"
          class="agenda-page__search"
          clearable
          density="compact"
          hide-details
          maxlength="100"
          placeholder="Buscar actividad, lugar o nota"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />

        <v-btn
          v-if="smAndDown"
          :color="activeFilterCount > 0 ? '#c89215' : undefined"
          prepend-icon="mdi-filter-variant"
          variant="tonal"
          @click="showFilters = !showFilters"
        >
          Filtros{{ activeFilterCount > 0 ? ` (${activeFilterCount})` : '' }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-show="!smAndDown || showFilters" class="agenda-page__filters">
          <v-autocomplete
            v-model="filters.areaIds"
            chips
            class="agenda-page__filter agenda-page__filter--wide"
            closable-chips
            density="compact"
            hide-details
            item-title="name"
            item-value="id"
            :items="areaOptions"
            label="Áreas"
            multiple
            no-data-text="Sin áreas"
            variant="outlined"
          />

          <v-select
            v-model="filters.campusId"
            class="agenda-page__filter"
            clearable
            density="compact"
            hide-details
            item-title="name"
            item-value="id"
            :items="campuses"
            label="Campus"
            variant="outlined"
          />

          <v-autocomplete
            v-model="filters.spaceId"
            class="agenda-page__filter"
            clearable
            density="compact"
            hide-details
            item-title="label"
            item-value="id"
            :items="spaceOptions"
            label="Espacio"
            no-data-text="Sin espacios"
            variant="outlined"
          />

          <v-btn
            v-if="activeFilterCount > 0 || filters.search"
            prepend-icon="mdi-filter-remove-outline"
            variant="text"
            @click="clearFilters"
          >
            Limpiar
          </v-btn>
        </div>
      </v-expand-transition>

      <v-divider />

      <div class="agenda-page__content">
        <AgendaYearView
          v-if="view === 'year'"
          :days="busyDays"
          :year="focus.getFullYear()"
          @select-day="openDay"
          @select-month="selectMonth"
        />

        <div v-else-if="showList" class="agenda-list">
          <div v-if="listDays.length === 0 && !loading" class="agenda-list__empty">
            <v-icon icon="mdi-calendar-blank-outline" size="40" />
            <div>Sin actividades {{ view === 'day' ? 'este día' : 'esta semana' }}.</div>
          </div>

          <section v-for="day in listDays" :key="day.key" class="agenda-list__day">
            <h3 class="agenda-list__day-title" :class="{ 'agenda-list__day-title--today': day.key === todayKey }">
              {{ day.label }}
            </h3>

            <button
              v-for="item in day.items"
              :key="item.id"
              class="agenda-list__item"
              :style="{ borderLeftColor: areaColor(item.event.areaId) }"
              type="button"
              @click="openOccurrence(item)"
            >
              <div class="agenda-list__time">{{ itemTime(item) }}</div>

              <div class="agenda-list__info">
                <div class="agenda-list__title">{{ item.event.title }}</div>

                <div class="agenda-list__meta">
                  <v-icon icon="mdi-map-marker-outline" size="14" /> {{ item.event.locationLabel }}
                </div>

                <div class="agenda-list__meta">
                  <v-icon icon="mdi-sitemap-outline" size="14" /> {{ item.event.area?.name }}
                  <v-icon v-if="item.event.recurrence !== 'none'" class="ml-1" icon="mdi-repeat" size="14" />
                </div>
              </div>
            </button>
          </section>
        </div>

        <v-calendar
          v-else
          ref="calendarRef"
          class="agenda-page__calendar"
          event-overlap-mode="column"
          :event-text-color="() => '#ffffff'"
          :events="calendarEvents"
          :first-interval="6"
          :interval-count="17"
          :interval-format="intervalFormat"
          :interval-height="44"
          locale="es"
          :model-value="focusKey"
          :type="view"
          :weekdays="WEEKDAYS"
          @click:date="onDateClick"
          @click:day="onDayClick"
          @click:event="onEventClick"
          @click:more="onDateClick"
          @click:time="onTimeClick"
        />
      </div>
    </v-card>

    <v-btn
      v-if="context?.canCreate && smAndDown"
      aria-label="Nueva actividad"
      class="agenda-page__fab"
      color="#FAB21A"
      icon="mdi-plus"
      size="large"
      @click="openCreate(null)"
    />

    <AgendaEventDetail
      v-model="detailOpen"
      :event="selectedEvent"
      :occurrence-end="selectedOccurrence?.endsAt ?? null"
      :occurrence-start="selectedOccurrence?.startsAt ?? null"
      :outlook-sync-enabled="context?.outlookSyncEnabled"
      @deleted="onDeleted"
      @edit="openEdit"
    />

    <AgendaEventDialog
      v-model="dialogOpen"
      :areas="areas"
      :context="context"
      :default-start="defaultStart"
      :event="editingEvent"
      :spaces="spaces"
      @saved="onSaved"
    />

    <v-overlay
      class="align-center justify-center"
      contained
      :model-value="openingDetail"
      persistent
    >
      <v-progress-circular color="#FAB21A" indeterminate />
    </v-overlay>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { AgendaEvent, AgendaExportFormat, AgendaOccurrence } from '@/modules/agenda/port'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import { areaColor } from '@/modules/agenda/colors'
  import AgendaEventDetail from '@/modules/agenda/components/AgendaEventDetail.vue'
  import AgendaEventDialog from '@/modules/agenda/components/AgendaEventDialog.vue'
  import AgendaYearView from '@/modules/agenda/components/AgendaYearView.vue'
  import { addDays, formatTime, parseLocal, startOfDay, toDateKey } from '@/modules/agenda/dates'
  import { AGENDA_VIEWS, resolveApiMessage, useAgendaCalendar } from '@/modules/agenda/useAgendaCalendar'

  /** Monday first. */
  const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]

  const route = useRoute()
  const router = useRouter()
  const { smAndDown } = useDisplay()

  const {
    context,
    occurrences,
    spaces,
    areas,
    campuses,
    view,
    focus,
    filters,
    range,
    title,
    activeFilterCount,
    loading,
    exporting,
    error,
    load,
    loadCatalogs,
    move,
    goToday,
    openDay,
    clearFilters,
    exportAgenda: runExport,
  } = useAgendaCalendar()

  const showFilters = ref(false)
  const detailOpen = ref(false)
  const dialogOpen = ref(false)
  const openingDetail = ref(false)
  const selectedEvent = ref<AgendaEvent | null>(null)
  const selectedOccurrence = ref<AgendaOccurrence | null>(null)
  const editingEvent = ref<AgendaEvent | null>(null)
  const defaultStart = ref<Date | null>(null)
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const todayKey = toDateKey(new Date())
  const focusKey = computed(() => toDateKey(focus.value))

  // On a phone the time grid is unreadable: day and week become a list.
  const showList = computed(() => smAndDown.value && (view.value === 'day' || view.value === 'week'))

  const areaOptions = computed(() => areas.value.map(area => ({ id: Number(area.id), name: area.name })))

  const spaceOptions = computed(() => spaces.value
    .filter(space => !filters.campusId || space.campusId === filters.campusId)
    .map(space => ({ id: space.id, label: space.campus ? `${space.name} · ${space.campus.name}` : space.name })))

  interface CalendarItem {
    name: string
    start: Date | string
    end: Date | string
    timed: boolean
    color: string
    occurrence: AgendaOccurrence
  }

  const calendarEvents = computed<CalendarItem[]>(() => occurrences.value.map(occurrence => {
    const { event } = occurrence
    const startsAt = new Date(occurrence.startsAt)
    const endsAt = new Date(occurrence.endsAt)

    return {
      name: event.allDay ? event.title : `${event.title} · ${event.locationLabel}`,
      // All-day events end at 00:00 of the next day; the calendar wants the last day.
      start: event.allDay ? toDateKey(startsAt) : startsAt,
      end: event.allDay ? toDateKey(addDays(endsAt, -1)) : endsAt,
      timed: !event.allDay,
      color: areaColor(event.areaId),
      occurrence,
    }
  }))

  /** Each day an occurrence touches, for the year view and the phone list. */
  function occurrenceDayKeys (occurrence: AgendaOccurrence): string[] {
    const startsAt = new Date(occurrence.startsAt)
    // An event ending exactly at 00:00 does not take the next day.
    const lastMoment = new Date(new Date(occurrence.endsAt).getTime() - 1)
    const keys: string[] = []

    for (let day = startOfDay(startsAt); day <= lastMoment && keys.length < 400; day = addDays(day, 1)) {
      keys.push(toDateKey(day))
    }

    return keys.length > 0 ? keys : [toDateKey(startsAt)]
  }

  const busyDays = computed(() => {
    const days: Record<string, { count: number, color: string }> = {}

    for (const occurrence of occurrences.value) {
      for (const key of occurrenceDayKeys(occurrence)) {
        const current = days[key]
        days[key] = current
          ? { ...current, count: current.count + 1 }
          : { count: 1, color: areaColor(occurrence.event.areaId) }
      }
    }

    return days
  })

  const listDays = computed(() => {
    const startKey = toDateKey(range.value.start)
    const endKey = toDateKey(range.value.end)
    const byDay = new Map<string, AgendaOccurrence[]>()

    for (const occurrence of occurrences.value) {
      for (const key of occurrenceDayKeys(occurrence)) {
        if (key >= startKey && key < endKey) {
          byDay.set(key, [...(byDay.get(key) ?? []), occurrence])
        }
      }
    }

    // `toSorted` is not available at this project's TS lib level; this sorts a fresh copy.
    // eslint-disable-next-line unicorn/no-array-sort
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => ({
      key,
      label: parseLocal(key).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      items,
    }))
  })

  function itemTime (occurrence: AgendaOccurrence): string {
    return occurrence.event.allDay
      ? 'Todo el día'
      : `${formatTime(new Date(occurrence.startsAt))} – ${formatTime(new Date(occurrence.endsAt))}`
  }

  function intervalFormat (interval: { time: string }): string {
    return interval.time
  }

  function notify (text: string, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  function selectMonth (monthIndex: number) {
    focus.value = new Date(focus.value.getFullYear(), monthIndex, 1)
    view.value = 'month'
  }

  async function openOccurrence (occurrence: AgendaOccurrence) {
    selectedOccurrence.value = occurrence
    await showEvent(occurrence.eventId)
  }

  // The calendar list carries no invitees or files: the detail fetches the full event.
  async function showEvent (eventId: number) {
    openingDetail.value = true
    try {
      selectedEvent.value = await agendaAdapter.getEvent(eventId)
      detailOpen.value = true
    } catch (error_) {
      notify(resolveApiMessage(error_, 'No fue posible abrir la actividad.'), 'error')
    } finally {
      openingDetail.value = false
    }
  }

  function onEventClick (nativeEvent: Event, scope: { event: unknown }) {
    nativeEvent.stopPropagation()
    openOccurrence((scope.event as CalendarItem).occurrence)
  }

  function onDateClick (nativeEvent: Event, scope: { date: string }) {
    nativeEvent?.stopPropagation?.()
    openDay(scope.date)
  }

  function onDayClick (_nativeEvent: Event, scope: { date: string }) {
    if (context.value?.canCreate) {
      openCreate(parseLocal(scope.date))
    }
  }

  function onTimeClick (_nativeEvent: Event, scope: { date: string, time: string }) {
    if (!context.value?.canCreate) {
      return
    }
    // Snap to the half hour that was clicked.
    const [hours = 9, minutes = 0] = scope.time.split(':').map(Number)
    const snapped = `${String(hours).padStart(2, '0')}:${minutes < 30 ? '00' : '30'}`
    openCreate(parseLocal(scope.date, snapped))
  }

  function openCreate (start: Date | null) {
    editingEvent.value = null
    defaultStart.value = start ?? (view.value === 'day' || view.value === 'week' ? focus.value : null)
    dialogOpen.value = true
  }

  function openEdit (event: AgendaEvent) {
    detailOpen.value = false
    editingEvent.value = event
    defaultStart.value = null
    dialogOpen.value = true
  }

  function onSaved (event: AgendaEvent, created: boolean) {
    notify(created ? 'Actividad creada.' : 'Actividad actualizada.')
    if (created) {
      focus.value = startOfDay(new Date(event.startsAt))
    }
    load()
  }

  function onDeleted () {
    notify('Actividad eliminada.')
    load()
  }

  async function exportAgenda (format: AgendaExportFormat) {
    await runExport(format)
    if (!error.value) {
      notify(format === 'pdf' ? 'PDF descargado.' : 'Excel descargado.')
    }
  }

  // Links from the e-mails arrive as /agenda?evento=ID.
  async function openFromQuery () {
    const eventId = Number(route.query.evento)
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return
    }

    await showEvent(eventId)
    if (selectedEvent.value) {
      focus.value = startOfDay(new Date(selectedEvent.value.startsAt))
    }
    router.replace({ query: { ...route.query, evento: undefined } })
  }

  watch(smAndDown, isSmall => {
    if (isSmall && view.value === 'month') {
      showFilters.value = false
    }
  })

  onMounted(async () => {
    if (smAndDown.value) {
      view.value = 'day'
    }
    await Promise.all([loadCatalogs(), load()])
    await openFromQuery()
  })
</script>

<style scoped>
.agenda-page {
  position: relative;
  padding: 24px;
}

.agenda-page__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.agenda-page__kicker {
  color: #c89215;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.agenda-page__title {
  margin: 4px 0;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.2;
}

.agenda-page__subtitle {
  margin: 0;
  color: #8a8a8a;
}

.agenda-page__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.agenda-page__panel {
  overflow: hidden;
}

.agenda-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 6px;
}

.agenda-page__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.agenda-page__period {
  margin: 0 0 0 8px;
  font-size: 1.2rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agenda-page__period::first-letter {
  text-transform: uppercase;
}

.agenda-page__filters-bar {
  display: flex;
  gap: 10px;
  padding: 8px 16px 0;
}

.agenda-page__search {
  max-width: 420px;
}

.agenda-page__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 14px;
}

.agenda-page__filter {
  flex: 1 1 180px;
  max-width: 260px;
}

.agenda-page__filter--wide {
  flex: 2 1 260px;
  max-width: 420px;
}

.agenda-page__content {
  position: relative;
  min-height: 420px;
  padding: 12px;
}

.agenda-page__calendar {
  min-height: 620px;
}

.agenda-page__calendar :deep(.v-calendar-weekly__head-weekday),
.agenda-page__calendar :deep(.v-calendar-daily_head-weekday) {
  text-transform: capitalize;
}

.agenda-page__calendar :deep(.v-event),
.agenda-page__calendar :deep(.v-event-timed) {
  cursor: pointer;
}

.agenda-page__fab {
  position: fixed !important;
  right: 20px;
  bottom: 20px;
  z-index: 5;
}

.agenda-list__empty {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 48px 16px;
  color: #8a8a8a;
}

.agenda-list__day + .agenda-list__day {
  margin-top: 18px;
}

.agenda-list__day-title {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.agenda-list__day-title--today {
  color: #c89215;
}

.agenda-list__item {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-left: 5px solid #FAB21A;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  text-align: left;
}

.agenda-list__time {
  flex: none;
  width: 92px;
  font-size: 0.85rem;
  font-weight: 700;
}

.agenda-list__info {
  min-width: 0;
}

.agenda-list__title {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.agenda-list__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8a8a8a;
  font-size: 0.82rem;
}

@media (max-width: 840px) {
  .agenda-page {
    padding: 16px 12px 88px;
  }

  .agenda-page__title {
    font-size: 1.35rem;
  }

  .agenda-page__toolbar {
    padding: 12px 10px 4px;
  }

  .agenda-page__nav {
    flex-wrap: wrap;
    width: 100%;
  }

  .agenda-page__period {
    flex: 1 1 100%;
    order: -1;
    margin: 0 0 6px;
    white-space: normal;
  }

  .agenda-page__views {
    width: 100%;
  }

  .agenda-page__views :deep(.v-btn) {
    flex: 1 1 0;
  }

  .agenda-page__filters-bar,
  .agenda-page__filters {
    padding-left: 10px;
    padding-right: 10px;
  }

  .agenda-page__search {
    max-width: none;
  }

  .agenda-page__filter,
  .agenda-page__filter--wide {
    flex: 1 1 100%;
    max-width: none;
  }

  .agenda-page__content {
    padding: 8px;
  }

  .agenda-page__calendar {
    min-height: 480px;
  }
}

@media (max-width: 600px) {
  .agenda-list__time {
    width: 76px;
    font-size: 0.8rem;
  }
}
</style>
