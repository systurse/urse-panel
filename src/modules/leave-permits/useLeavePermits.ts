import type {
  LeavePermit,
  LeavePermitFilters,
  LeavePermitPayload,
  LeavePermitsPagination,
  LeavePermitsPort,
} from '@/modules/leave-permits/port'
import { ref } from 'vue'
import { DEFAULT_PER_PAGE, leavePermitsAdapter } from '@/modules/leave-permits/adapter'

interface ApiErrorShape {
  message?: string
  response?: {
    data?: {
      errors?: Record<string, string[] | string>
      message?: string
    }
    status?: number
  }
}

function emptyMeta (perPage: number): LeavePermitsPagination {
  return { currentPage: 1, lastPage: 1, perPage, total: 0 }
}

function resolveApiMessage (error: unknown, field: string, fallback: string): string {
  const apiError = error as ApiErrorShape
  const fieldErrors = apiError?.response?.data?.errors?.[field]

  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    return fieldErrors[0]
  }

  if (typeof fieldErrors === 'string' && fieldErrors.trim().length > 0) {
    return fieldErrors
  }

  return apiError?.response?.data?.message ?? apiError?.message ?? fallback
}

export function useLeavePermits (port: LeavePermitsPort = leavePermitsAdapter) {
  const permits = ref<LeavePermit[]>([])
  const meta = ref<LeavePermitsPagination>(emptyMeta(DEFAULT_PER_PAGE))

  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const perPage = ref(DEFAULT_PER_PAGE)
  const filters = ref<LeavePermitFilters>({})

  // Debounced searching can land out of order; only the newest request writes.
  let requestId = 0

  function clearError () {
    error.value = null
  }

  async function loadPermits () {
    const currentRequest = ++requestId
    loading.value = true
    error.value = null

    try {
      const result = await port.list({
        filters: { ...filters.value },
        page: page.value,
        perPage: perPage.value,
      })

      if (currentRequest !== requestId) {
        return
      }

      permits.value = result.items
      meta.value = result.meta
    } catch (error_) {
      if (currentRequest !== requestId) {
        return
      }

      error.value = resolveApiMessage(error_, 'permits', 'No fue posible cargar los permisos.')
    } finally {
      if (currentRequest === requestId) {
        loading.value = false
      }
    }
  }

  function setPage (next: number) {
    page.value = next
    return loadPermits()
  }

  function setFilters (next: LeavePermitFilters) {
    filters.value = { ...next }
    page.value = 1
    return loadPermits()
  }

  /**
   * Rejects by throwing so the caller can keep the dialog open; `error` carries
   * the field-level reason the API gave, which for a permit is one of the three
   * capture rules.
   */
  async function createPermit (payload: LeavePermitPayload) {
    saving.value = true
    error.value = null

    try {
      const created = await port.create(payload)
      await loadPermits()
      return created
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'starts_on', 'No fue posible registrar el permiso.')
      throw error_
    } finally {
      saving.value = false
    }
  }

  async function updatePermit (permitId: number | string, payload: Partial<LeavePermitPayload>) {
    saving.value = true
    error.value = null

    try {
      const updated = await port.update(permitId, payload)
      await loadPermits()
      return updated
    } catch (error_) {
      // A signed permit refuses content changes with the reason under
      // `signatures`, which names the signature blocking the edit.
      error.value = resolveApiMessage(error_, 'signatures', 'No fue posible actualizar el permiso.')
      throw error_
    } finally {
      saving.value = false
    }
  }

  async function removePermit (permitId: number | string) {
    saving.value = true
    error.value = null

    try {
      await port.remove(permitId)
      await loadPermits()
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'signatures', 'No fue posible eliminar el permiso.')
      throw error_
    } finally {
      saving.value = false
    }
  }

  async function downloadPdf (permitId: number | string) {
    error.value = null

    try {
      const blob = await port.downloadPdf(permitId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'pdf', 'No fue posible generar el formato en PDF.')
    }
  }

  return {
    clearError,
    createPermit,
    downloadPdf,
    error,
    filters,
    loading,
    loadPermits,
    meta,
    page,
    permits,
    perPage,
    removePermit,
    saving,
    setFilters,
    setPage,
    updatePermit,
  }
}
