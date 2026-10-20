import type {
  DirectoryArea,
  DirectoryCampus,
  DirectoryEntry,
  DirectoryPagination,
  DirectoryPort,
} from '@/modules/directory/port'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { directoryAdapter } from '@/modules/directory/adapter'

/** The API caps it at 200; the whole directory (~150 lines) fits in one page. */
const PER_PAGE = 200
const SEARCH_DEBOUNCE_MS = 300
/** Mirrors the API's `search` max length, so a long paste never ends in a 422. */
export const SEARCH_MAX_LENGTH = 100

interface ApiErrorShape {
  response?: {
    data?: { message?: string }
  }
}

// Only a message the backend sent is shown as-is; axios' own messages are in English.
function resolveApiMessage (error: unknown, fallback: string): string {
  return (error as ApiErrorShape)?.response?.data?.message ?? fallback
}

/** Lowercase and accent-free, so "alemán" finds "Aleman" and vice versa. */
export function normalizeText (value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'a', 'al', 'por', 'para', 'con'])

// Dotted initials such as "D.A." or "M.A.D.G.I.E." are degrees, not words.
const INITIALS = /^(?:\p{Lu}\.){2,}$/u

/**
 * Names and positions arrive in UPPERCASE, as typed in the Excel; this turns
 * "COORD. GRAL. DE SERV. ESCOLARES" into "Coord. Gral. de Serv. Escolares"
 * while leaving degrees like "M.A.D.G.I.E." untouched.
 */
export function toDisplayCase (value: string): string {
  return value
    .split(/(\s+|[/()])/)
    .map((word, index) => {
      if (!word.trim() || INITIALS.test(word)) {
        return word
      }

      const lower = word.toLocaleLowerCase('es')
      if (index > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower
      }
      return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1)
    })
    .join('')
}

export interface DirectoryGroup {
  key: string
  areaName: string | null
  campusName: string | null
  entries: DirectoryEntry[]
}

function emptyMeta (): DirectoryPagination {
  return { currentPage: 1, lastPage: 1, perPage: PER_PAGE, total: 0 }
}

export function useDirectory (port: DirectoryPort = directoryAdapter) {
  const campuses = ref<DirectoryCampus[]>([])
  const areas = ref<DirectoryArea[]>([])
  const entries = ref<DirectoryEntry[]>([])
  const meta = ref(emptyMeta())

  const search = ref('')
  const selectedCampusId = ref<number | null>(null)
  const selectedAreaId = ref<number | null>(null)

  const loading = ref(false)
  const loadingMore = ref(false)
  const loadingAreas = ref(false)
  const error = ref<string | null>(null)

  // Typing fires a request per pause; only the newest answer may land, so a
  // slow response to "lo" never overwrites the one to "lopez".
  let entriesRequestId = 0
  let areasRequestId = 0
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function loadCampuses () {
    try {
      campuses.value = await port.listCampuses()
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los campus.')
    }
  }

  async function loadAreas () {
    const requestId = ++areasRequestId
    loadingAreas.value = true

    try {
      const result = await port.listAreas(selectedCampusId.value)
      if (requestId !== areasRequestId) {
        return
      }

      areas.value = result

      // An area picked under "Todos" may have no lines in the campus just chosen.
      if (selectedAreaId.value !== null && !result.some(area => area.id === selectedAreaId.value)) {
        selectedAreaId.value = null
      }
    } catch (error_) {
      if (requestId === areasRequestId) {
        error.value = resolveApiMessage(error_, 'No fue posible cargar las áreas.')
      }
    } finally {
      if (requestId === areasRequestId) {
        loadingAreas.value = false
      }
    }
  }

  async function loadEntries (options: { append?: boolean } = {}) {
    const requestId = ++entriesRequestId
    const page = options.append ? meta.value.currentPage + 1 : 1

    if (options.append) {
      loadingMore.value = true
    } else {
      loading.value = true
    }
    error.value = null

    try {
      const result = await port.listEntries({
        search: search.value.slice(0, SEARCH_MAX_LENGTH),
        campusId: selectedCampusId.value,
        areaId: selectedAreaId.value,
        page,
        perPage: PER_PAGE,
      })
      if (requestId !== entriesRequestId) {
        return
      }

      entries.value = options.append ? [...entries.value, ...result.items] : result.items
      meta.value = result.meta
    } catch (error_) {
      if (requestId === entriesRequestId) {
        error.value = resolveApiMessage(error_, 'No fue posible cargar el directorio.')
      }
    } finally {
      if (requestId === entriesRequestId) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  function loadMore () {
    if (meta.value.currentPage < meta.value.lastPage && !loadingMore.value) {
      loadEntries({ append: true })
    }
  }

  function cancelPendingSearch () {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
  }

  watch(search, () => {
    cancelPendingSearch()
    searchTimer = setTimeout(() => {
      searchTimer = null
      loadEntries()
    }, SEARCH_DEBOUNCE_MS)
  })

  watch(selectedCampusId, async () => {
    cancelPendingSearch()
    // Areas first: a stale area filter would empty the list for nothing.
    await loadAreas()
    loadEntries()
  })

  watch(selectedAreaId, () => {
    cancelPendingSearch()
    loadEntries()
  })

  const searchTerms = computed(() => normalizeText(search.value).split(/\s+/).filter(Boolean))

  // The API already sorts by campus and then in Excel order, so consecutive
  // lines that share campus and area form one block.
  const groups = computed<DirectoryGroup[]>(() => {
    const result: DirectoryGroup[] = []

    for (const entry of entries.value) {
      const key = `${entry.campusId}:${entry.areaId ?? 'none'}`
      const last = result.at(-1)

      if (last?.key === key) {
        last.entries.push(entry)
      } else {
        result.push({
          key,
          areaName: entry.area?.name ?? null,
          campusName: entry.campus?.name ?? null,
          entries: [entry],
        })
      }
    }

    return result
  })

  const totalEntries = computed(() => campuses.value.reduce((sum, campus) => sum + campus.entriesCount, 0))
  const hasFilters = computed(() => search.value.trim().length > 0 || selectedCampusId.value !== null || selectedAreaId.value !== null)
  const hasMore = computed(() => meta.value.currentPage < meta.value.lastPage)

  function resetFilters () {
    search.value = ''
    selectedAreaId.value = null
    selectedCampusId.value = null
  }

  onMounted(() => {
    loadCampuses()
    loadAreas()
    loadEntries()
  })

  onBeforeUnmount(cancelPendingSearch)

  return {
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
  }
}
