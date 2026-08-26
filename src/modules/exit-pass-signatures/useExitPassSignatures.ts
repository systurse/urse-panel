import type {
  ExitPassSignature,
  ExitPassSignaturesPort,
  OtpRequestResult,
  SignatureProgress,
  SignerRole,
  SignResult,
} from '@/modules/exit-pass-signatures/port'
import { computed, ref } from 'vue'
import { exitPassSignaturesAdapter } from '@/modules/exit-pass-signatures/adapter'

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

function emptyProgress (): SignatureProgress {
  return {
    documentHash: '',
    isComplete: false,
    pendingRoles: [],
    requiredRoles: [],
    signedRoles: [],
  }
}

/**
 * Prefers the field-level detail the API returns (the sign endpoint puts the
 * reason a code was rejected in `errors.code`), then the top-level message,
 * then a fallback. The API messages are already user-facing Spanish.
 */
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

function statusOf (error: unknown): number | undefined {
  return (error as ApiErrorShape)?.response?.status
}

export function useExitPassSignatures (
  passId: number | string,
  port: ExitPassSignaturesPort = exitPassSignaturesAdapter,
) {
  const signatures = ref<ExitPassSignature[]>([])
  const progress = ref<SignatureProgress>(emptyProgress())

  const loading = ref(false)
  const requestingOtp = ref(false)
  const signing = ref(false)
  const error = ref<string | null>(null)

  /** True once `signature_progress.is_complete` is reported by the API. */
  const isComplete = computed(() => progress.value.isComplete)
  const hasSignatures = computed(() => signatures.value.length > 0)

  function clearError () {
    error.value = null
  }

  async function loadSignatures () {
    loading.value = true
    error.value = null

    try {
      const result = await port.list(passId)
      signatures.value = result.signatures
      progress.value = result.progress
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'signatures', 'No fue posible cargar las firmas del pase.')
    } finally {
      loading.value = false
    }
  }

  /**
   * Resolves with the masked destination on success, or null when the request
   * was rejected — `error` then carries the reason.
   */
  async function requestOtp (signerRole: SignerRole): Promise<OtpRequestResult | null> {
    requestingOtp.value = true
    error.value = null

    try {
      return await port.requestOtp(passId, signerRole)
    } catch (error_) {
      const status = statusOf(error_)

      switch (status) {
        case 403: {
          error.value = resolveApiMessage(error_, 'signer_role', 'No puedes firmar con ese rol.')
          break
        }
        case 409: {
          error.value = resolveApiMessage(error_, 'signer_role', 'Ese rol ya firmó este pase.')
          // The screen is stale if the role was signed elsewhere.
          await loadSignatures()
          break
        }
        case 503: {
          error.value = resolveApiMessage(
            error_,
            'signer_role',
            'No fue posible enviar el correo con el código. Inténtalo de nuevo en unos minutos.',
          )
          break
        }
        default: {
          // 422 (no mailbox) and 429 (cooldown or daily cap) already carry a
          // specific message from the API.
          error.value = resolveApiMessage(error_, 'signer_role', 'No fue posible enviar el código de firma.')
        }
      }

      return null
    } finally {
      requestingOtp.value = false
    }
  }

  /** Resolves with the signature on success, or null when it was rejected. */
  async function sign (signerRole: SignerRole, code: string): Promise<SignResult | null> {
    signing.value = true
    error.value = null

    try {
      const result = await port.sign(passId, { code, signerRole })
      // The response already carries fresh progress. Refetching the list is
      // left to whoever displays it, so signing costs a single request.
      progress.value = result.progress
      return result
    } catch (error_) {
      const status = statusOf(error_)

      if (status === 409) {
        error.value = resolveApiMessage(error_, 'signer_role', 'Ese rol ya firmó este pase.')
        await loadSignatures()
      } else if (status === 403) {
        error.value = resolveApiMessage(error_, 'signer_role', 'No puedes firmar con ese rol.')
      } else {
        // 422 explains whether the code was wrong, expired, already used, or
        // invalidated because the pass changed after the code was issued.
        error.value = resolveApiMessage(error_, 'code', 'El código no es válido o ya venció.')
      }

      return null
    } finally {
      signing.value = false
    }
  }

  return {
    clearError,
    error,
    hasSignatures,
    isComplete,
    loading,
    loadSignatures,
    progress,
    requestingOtp,
    requestOtp,
    sign,
    signatures,
    signing,
  }
}
