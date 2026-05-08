import type { ContactTicket, MyTicketsPort } from '@/modules/mytickets/port'
import { onMounted, ref } from 'vue'
import { myTicketsAdapter } from '@/modules/mytickets/adapter'

export function useMyTickets (port: MyTicketsPort = myTicketsAdapter) {
  const tickets = ref<ContactTicket[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadTickets () {
    loading.value = true
    error.value = null

    try {
      tickets.value = await port.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar tus solicitudes'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadTickets()
  })

  return {
    error,
    loadTickets,
    loading,
    tickets,
  }
}
