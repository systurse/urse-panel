import type { PrintingPort, PrintingUploadResult } from '@/modules/printing/port'
import { ref } from 'vue'
import { printingAdapter } from '@/modules/printing/adapter'

interface ApiErrorShape {
  response?: {
    data?: {
      errors?: Record<string, string[] | string>
      message?: string
    }
    status?: number
  }
}

// Only what the backend sent in its JSON body is shown as-is (the API answers
// in Spanish per its contract, e.g. `El formato de "virus.exe" no está
// permitido.`); a bare axios/network failure (no response, a timeout, CORS)
// has no Spanish message of its own, so it falls back to `fallback` instead of
// leaking `error.message`, which axios always writes in English (e.g.
// "Network Error").
function resolveApiMessage (error: unknown, fallback: string): string {
  const apiError = error as ApiErrorShape
  const errors = apiError?.response?.data?.errors

  if (errors) {
    const firstEntry = Object.values(errors)[0]

    if (Array.isArray(firstEntry) && firstEntry.length > 0) {
      return firstEntry[0]
    }

    if (typeof firstEntry === 'string' && firstEntry.trim().length > 0) {
      return firstEntry
    }
  }

  if (apiError?.response?.status === 429) {
    return 'Se alcanzó el límite de subidas. Intenta más tarde.'
  }

  return apiError?.response?.data?.message ?? fallback
}

export function usePrintingUpload (port: PrintingPort = printingAdapter) {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<PrintingUploadResult | null>(null)

  async function upload (files: File[]) {
    if (files.length === 0) {
      error.value = 'Selecciona al menos un archivo.'
      return
    }

    uploading.value = true
    error.value = null

    try {
      result.value = await port.uploadFiles(files)
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible subir los archivos.')
      throw error_
    } finally {
      uploading.value = false
    }
  }

  function reset () {
    result.value = null
    error.value = null
  }

  return { error, reset, result, upload, uploading }
}
