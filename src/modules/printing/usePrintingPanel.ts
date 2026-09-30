import type { PrintingCampus, PrintingFile, PrintingFilesPagination, PrintingPort, PrintingStreamMode } from '@/modules/printing/port'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { printingAdapter } from '@/modules/printing/adapter'

const REFRESH_INTERVAL_MS = 10_000
const TICK_INTERVAL_MS = 1000
const PER_PAGE = 50

interface ApiErrorShape {
  message?: string
  response?: {
    data?: { message?: string }
    status?: number
  }
}

function resolveApiMessage (error: unknown, fallback: string): string {
  const apiError = error as ApiErrorShape
  return apiError?.response?.data?.message ?? apiError?.message ?? fallback
}

function emptyMeta (perPage: number): PrintingFilesPagination {
  return { currentPage: 1, lastPage: 1, perPage, total: 0 }
}

export interface PrintingBatch {
  batchCode: string
  campus: string
  campusLabel: string
  files: PrintingFile[]
}

export function usePrintingPanel (port: PrintingPort = printingAdapter) {
  const campuses = ref<PrintingCampus[]>([])
  const selectedCampus = ref<string | null>(null)

  const files = ref<PrintingFile[]>([])
  const meta = ref(emptyMeta(PER_PAGE))
  const page = ref(1)

  const loading = ref(false)
  const acting = ref(false)
  const error = ref<string | null>(null)

  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let tickTimer: ReturnType<typeof setInterval> | null = null

  async function loadCampuses () {
    try {
      campuses.value = await port.listCampuses()
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los campus.')
    }
  }

  // Polling refreshes silently: a loading spinner every 10s would be jarring,
  // and the countdown already gives the user a sense of freshness.
  async function loadFiles (options: { silent?: boolean } = {}) {
    if (!options.silent) {
      loading.value = true
      error.value = null
    }

    try {
      const result = await port.listFiles({ page: page.value, perPage: PER_PAGE })
      files.value = result.items
      meta.value = result.meta
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los archivos.')
    } finally {
      if (!options.silent) {
        loading.value = false
      }
    }
  }

  function setPage (next: number) {
    page.value = next
    return loadFiles()
  }

  const visibleFiles = computed(() => (
    selectedCampus.value
      ? files.value.filter(file => file.campus === selectedCampus.value)
      : files.value
  ))

  // Several files from one QR upload share a batch_code; the panel groups
  // them so the operator hands over everything at once.
  const batches = computed<PrintingBatch[]>(() => {
    const map = new Map<string, PrintingBatch>()

    for (const file of visibleFiles.value) {
      const existing = map.get(file.batchCode)

      if (existing) {
        existing.files.push(file)
      } else {
        map.set(file.batchCode, {
          batchCode: file.batchCode,
          campus: file.campus,
          campusLabel: file.campusLabel,
          files: [file],
        })
      }
    }

    return [...map.values()]
  })

  async function markPrinted (fileId: string) {
    acting.value = true
    error.value = null

    try {
      const updated = await port.markPrinted(fileId)
      const index = files.value.findIndex(file => file.id === fileId)
      if (index !== -1) {
        files.value[index] = updated
      }
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible marcar el archivo como impreso.')
      throw error_
    } finally {
      acting.value = false
    }
  }

  async function removeFile (fileId: string) {
    acting.value = true
    error.value = null

    try {
      await port.remove(fileId)
      files.value = files.value.filter(file => file.id !== fileId)
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible eliminar el archivo.')
      throw error_
    } finally {
      acting.value = false
    }
  }

  // The file is fetched as a blob through the authenticated client and handed
  // to the browser as an object URL: a plain <a href> to the API would not
  // carry the Bearer token the stream endpoint requires.
  async function openFile (fileId: string, mode: PrintingStreamMode, downloadName?: string) {
    error.value = null

    try {
      const { blob, contentType } = await port.getStream(fileId, mode)
      const typedBlob = blob.type ? blob : new Blob([blob], { type: contentType })
      const url = URL.createObjectURL(typedBlob)

      if (mode === 'download') {
        const link = document.createElement('a')
        link.href = url
        link.download = downloadName ?? 'archivo'
        link.click()
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'El archivo ya no está disponible.')
    }
  }

  function tickCountdowns () {
    for (const file of files.value) {
      if (file.remainingSeconds > 0) {
        file.remainingSeconds -= 1
      }
    }
  }

  onMounted(() => {
    void loadCampuses()
    void loadFiles()
    refreshTimer = setInterval(() => void loadFiles({ silent: true }), REFRESH_INTERVAL_MS)
    tickTimer = setInterval(tickCountdowns, TICK_INTERVAL_MS)
  })

  onBeforeUnmount(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    if (tickTimer) {
      clearInterval(tickTimer)
    }
  })

  return {
    acting,
    batches,
    campuses,
    error,
    files,
    loadFiles,
    loading,
    markPrinted,
    meta,
    openFile,
    page,
    removeFile,
    selectedCampus,
    setPage,
    visibleFiles,
  }
}
