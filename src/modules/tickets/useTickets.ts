import type { LocalDeal, TicketsPort } from '@/modules/tickets/port'
import { onMounted, ref } from 'vue'
import { ticketsAdapter } from '@/modules/tickets/adapter'

export function useTickets (ticketsPort: TicketsPort = ticketsAdapter) {
  const tickets = ref<LocalDeal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const requestingId = ref<number | null>(null)
  const downloadingId = ref<number | null>(null)
  const onlyMine = ref(true)

  async function loadTickets () {
    loading.value = true
    error.value = null

    try {
      tickets.value = await ticketsPort.list(onlyMine.value)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los tickets'
    } finally {
      loading.value = false
    }
  }

  async function requestApproval (dealId: number) {
    requestingId.value = dealId
    error.value = null

    try {
      await ticketsPort.requestApproval(dealId)
      await loadTickets()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible solicitar aprobación'
    } finally {
      requestingId.value = null
    }
  }

  async function downloadSigned (dealId: number, title: string) {
    downloadingId.value = dealId
    error.value = null

    try {
      const blob = await ticketsPort.downloadSigned(dealId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `orden-servicio-${dealId}-firmada.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : `No fue posible descargar la orden "${title}"`
    } finally {
      downloadingId.value = null
    }
  }

  onMounted(() => {
    void loadTickets()
  })

  return {
    downloadingId,
    downloadSigned,
    error,
    loadTickets,
    loading,
    onlyMine,
    requestApproval,
    requestingId,
    tickets,
  }
}
