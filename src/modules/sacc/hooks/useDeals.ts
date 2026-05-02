import type { Deal, DealsPort } from '@/modules/sacc/hooks/port'
import { onMounted, ref } from 'vue'
import { dealsAdapter } from '@/modules/sacc/hooks/adapter'

export function useDeals (dealsPort: DealsPort = dealsAdapter) {
  const deals = ref<Deal[]>([])
  const loading = ref(false)
  const generatingId = ref<number | string | null>(null)
  const error = ref<string | null>(null)

  async function loadDeals () {
    loading.value = true
    error.value = null

    try {
      deals.value = await dealsPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar las negociaciones'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function generateServiceOrder (dealId: number | string, title: string) {
    generatingId.value = dealId
    error.value = null

    try {
      const blob = await dealsPort.downloadServiceOrder(dealId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `orden-servicio-${dealId}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : `No fue posible generar la orden para "${title}"`
      throw error_
    } finally {
      generatingId.value = null
    }
  }

  onMounted(() => {
    void loadDeals()
  })

  return {
    deals,
    error,
    generateServiceOrder,
    generatingId,
    loadDeals,
    loading,
  }
}
