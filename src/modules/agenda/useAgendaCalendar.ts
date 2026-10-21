import type { AgendaContext, AgendaExportFormat, AgendaFilters, AgendaOccurrence, AgendaPort, AgendaSpace } from '@/modules/agenda/port'
import type { Area } from '@/modules/areas/port'
import type { DirectoryCampus } from '@/modules/directory/port'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { agendaAdapter } from '@/modules/agenda/adapter'
import { addDays, MONTH_NAMES, parseLocal, startOfDay, startOfWeek, toDateKey } from '@/modules/agenda/dates'
import { areasAdapter } from '@/modules/areas/adapter'
import { directoryAdapter } from '@/modules/directory/adapter'
import { downloadBlob } from '@/utils/download'

export type AgendaView = 'day' | 'week' | 'month' | 'year'

export const AGENDA_VIEWS: { value: AgendaView, title: string, icon: string }[] = [
  { value: 'day', title: 'Día', icon: 'mdi-calendar-today' },
  { value: 'week', title: 'Semana', icon: 'mdi-calendar-week' },
  { value: 'month', title: 'Mes', icon: 'mdi-calendar-month' },
  { value: 'year', title: 'Año', icon: 'mdi-calendar-blank-multiple' },
]

const SEARCH_DEBOUNCE_MS = 300

interface ApiErrorShape {
  response?: {
    status?: number
    data?: { message?: string } | Blob
  }
}

// Only a message the backend sent is shown as-is; axios' own messages are in English.
export function resolveApiMessage (error: unknown, fallback: string): string {
  const data = (error as ApiErrorShape)?.response?.data
  return data && !(data instanceof Blob) && data.message ? data.message : fallback
}

/** [start, end) of what each view shows; the month view includes the outside days of its grid. */
export function visibleRange (view: AgendaView, focus: Date): { start: Date, end: Date } {
  switch (view) {
    case 'day': {
      const start = startOfDay(focus)
      return { start, end: addDays(start, 1) }
    }
    case 'week': {
      const start = startOfWeek(focus)
      return { start, end: addDays(start, 7) }
    }
    case 'month': {
      const start = startOfWeek(new Date(focus.getFullYear(), focus.getMonth(), 1))
      return { start, end: addDays(start, 42) }
    }
    case 'year': {
      return { start: new Date(focus.getFullYear(), 0, 1), end: new Date(focus.getFullYear() + 1, 0, 1) }
    }
  }
}

export function useAgendaCalendar (port: AgendaPort = agendaAdapter) {
  const context = ref<AgendaContext | null>(null)
  const occurrences = ref<AgendaOccurrence[]>([])
  const spaces = ref<AgendaSpace[]>([])
  const areas = ref<Area[]>([])
  const campuses = ref<DirectoryCampus[]>([])

  const view = ref<AgendaView>('month')
  const focus = ref<Date>(startOfDay(new Date()))
  const filters = reactive({
    areaIds: [] as number[],
    spaceId: null as number | null,
    campusId: null as number | null,
    search: '',
  })

  const loading = ref(false)
  const exporting = ref<AgendaExportFormat | null>(null)
  const error = ref<string | null>(null)

  // A slow response for a range the user already left must not overwrite the new one.
  let requestId = 0
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  const range = computed(() => visibleRange(view.value, focus.value))

  const apiFilters = computed<AgendaFilters>(() => ({
    start: toDateKey(range.value.start),
    end: toDateKey(range.value.end),
    areaIds: filters.areaIds,
    spaceId: filters.spaceId,
    campusId: filters.campusId,
    search: filters.search,
  }))

  const title = computed(() => {
    const date = focus.value
    switch (view.value) {
      case 'day': {
        return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      }
      case 'week': {
        const { start, end } = range.value
        const last = addDays(end, -1)
        return start.getMonth() === last.getMonth()
          ? `${start.getDate()} – ${last.getDate()} de ${MONTH_NAMES[start.getMonth()]} ${last.getFullYear()}`
          : `${start.getDate()} ${MONTH_NAMES[start.getMonth()]?.slice(0, 3)} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]?.slice(0, 3)} ${last.getFullYear()}`
      }
      case 'month': {
        return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
      }
      case 'year': {
        return String(date.getFullYear())
      }
    }
    return ''
  })

  const activeFilterCount = computed(() =>
    (filters.areaIds.length > 0 ? 1 : 0) + (filters.spaceId ? 1 : 0) + (filters.campusId ? 1 : 0),
  )

  async function load () {
    const current = ++requestId
    loading.value = true
    error.value = null

    try {
      const result = await port.listOccurrences(apiFilters.value)
      if (current === requestId) {
        occurrences.value = result
      }
    } catch (error_) {
      if (current === requestId) {
        error.value = resolveApiMessage(error_, 'No fue posible cargar la agenda.')
      }
    } finally {
      if (current === requestId) {
        loading.value = false
      }
    }
  }

  async function loadCatalogs () {
    const [contextResult, spacesResult, areasResult, campusesResult] = await Promise.allSettled([
      port.getContext(),
      port.listSpaces(),
      areasAdapter.list(),
      directoryAdapter.listCampuses(),
    ])

    if (contextResult.status === 'fulfilled') {
      context.value = contextResult.value
    } else {
      error.value = resolveApiMessage(contextResult.reason, 'No fue posible cargar tu información de la agenda.')
    }
    if (spacesResult.status === 'fulfilled') {
      spaces.value = spacesResult.value
    }
    if (areasResult.status === 'fulfilled') {
      // `toSorted` is not available at this project's TS lib level; this sorts a fresh copy.
      // eslint-disable-next-line unicorn/no-array-sort
      areas.value = [...areasResult.value].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    }
    if (campusesResult.status === 'fulfilled') {
      campuses.value = campusesResult.value
    }
  }

  async function reloadSpaces () {
    try {
      spaces.value = await port.listSpaces()
    } catch {
      // The calendar still works with the list it already had.
    }
  }

  function move (direction: 1 | -1) {
    const date = new Date(focus.value)
    switch (view.value) {
      case 'day': {
        date.setDate(date.getDate() + direction)
        break
      }
      case 'week': {
        date.setDate(date.getDate() + 7 * direction)
        break
      }
      case 'month': {
        date.setDate(1)
        date.setMonth(date.getMonth() + direction)
        break
      }
      case 'year': {
        date.setFullYear(date.getFullYear() + direction)
        break
      }
    }
    focus.value = date
  }

  function goToday () {
    focus.value = startOfDay(new Date())
  }

  function openDay (dateKey: string) {
    focus.value = parseLocal(dateKey)
    view.value = 'day'
  }

  function clearFilters () {
    filters.areaIds = []
    filters.spaceId = null
    filters.campusId = null
    filters.search = ''
  }

  async function exportAgenda (format: AgendaExportFormat) {
    if (exporting.value) {
      return
    }

    exporting.value = format
    try {
      const blob = await port.exportAgenda(apiFilters.value, format)
      downloadBlob(blob, `Agenda_${toDateKey(new Date())}.${format}`)
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible exportar la agenda.')
    } finally {
      exporting.value = null
    }
  }

  watch(() => [apiFilters.value.start, apiFilters.value.end, filters.areaIds, filters.spaceId, filters.campusId], () => {
    load()
  }, { deep: true })

  watch(() => filters.search, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(load, SEARCH_DEBOUNCE_MS)
  })

  onBeforeUnmount(() => clearTimeout(searchTimer))

  return {
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
    reloadSpaces,
    move,
    goToday,
    openDay,
    clearFilters,
    exportAgenda,
  }
}
