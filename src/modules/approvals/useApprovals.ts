import type { ApprovalsPort } from '@/modules/approvals/port'
import type { LocalDeal } from '@/modules/tickets/port'
import { onMounted, ref } from 'vue'
import { approvalsAdapter } from '@/modules/approvals/adapter'

export function useApprovals (approvalsPort: ApprovalsPort = approvalsAdapter) {
  const approvals = ref<LocalDeal[]>([])
  const loading = ref(false)
  const signing = ref(false)
  const error = ref<string | null>(null)
  const signError = ref<string | null>(null)

  async function loadApprovals () {
    loading.value = true
    error.value = null

    try {
      approvals.value = await approvalsPort.list()
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

  onMounted(() => {
    void loadApprovals()
  })

  return {
    approvals,
    error,
    loadApprovals,
    loading,
    sign,
    signError,
    signing,
  }
}
