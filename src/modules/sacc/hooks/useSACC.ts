import { onMounted } from 'vue'
import { useSACCStore } from '../states/saccStore'

export function useSACC () {
  const store = useSACCStore()

  onMounted(() => {
    store.fetchReservations()
  })

  return {
    reservations: store.reservations,
    loading: store.loading,
    fetchReservations: store.fetchReservations,
  }
}
