import type { ApprovalsPort } from '@/modules/approvals/port'
import type { LocalDeal } from '@/modules/tickets/port'
import { onMounted, ref } from 'vue'
import { approvalsAdapter } from '@/modules/approvals/adapter'

export function useApprovals (approvalsPort: ApprovalsPort = approvalsAdapter) {
  const approvals = ref<LocalDeal[]>([])
  const loading = ref(false)
  const signing = ref(false)
  const requestingModifications = ref(false)
  const downloadingId = ref<number | null>(null)
  const includeSigned = ref(false)
  const error = ref<string | null>(null)
  const signError = ref<string | null>(null)
  const modificationError = ref<string | null>(null)

  async function loadApprovals () {
    loading.value = true
    error.value = null

    try {
      approvals.value = await approvalsPort.list(includeSigned.value)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar las aprobaciones'
    } finally {
      loading.value = false
    }
  }

  async function sign (dealId: number): Promise<boolean> {
    signing.value = true
    signError.value = null

    try {
      await approvalsPort.sign(dealId)
      await loadApprovals()
      return true
    } catch (error_) {
      signError.value = error_ instanceof Error ? error_.message : 'No fue posible firmar la orden'
      return false
    } finally {
      signing.value = false
    }
  }

  async function requestModifications (dealId: number, notes: string): Promise<boolean> {
    requestingModifications.value = true
    modificationError.value = null

    try {
      await approvalsPort.requestModifications(dealId, notes)
      await loadApprovals()
      return true
    } catch (error_) {
      modificationError.value = error_ instanceof Error ? error_.message : 'No fue posible solicitar las modificaciones'
      return false
    } finally {
      requestingModifications.value = false
    }
  }

  onMounted(() => {
    void loadApprovals()
  })

  async function downloadSigned (dealId: number, title: string) {
    downloadingId.value = dealId

    try {
      const blob = await approvalsPort.downloadSigned(dealId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `orden-servicio-${dealId}-firmada.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      error.value = `No fue posible descargar la orden "${title}"`
    } finally {
      downloadingId.value = null
    }
  }

  return {
    approvals,
    downloadingId,
    downloadSigned,
    error,
    includeSigned,
    loadApprovals,
    loading,
    modificationError,
    requestModifications,
    requestingModifications,
    sign,
    signError,
    signing,
  }
}
