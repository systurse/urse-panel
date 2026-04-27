import { onMounted } from 'vue'
import { useSSMStore } from '../states/ssmStore'

export function useSSM () {
  const store = useSSMStore()

  onMounted(() => {
    store.fetchWorkOrders()
    store.fetchServices()
  })

  return {
    workOrders: store.workOrders,
    services: store.services,
    loading: store.loading,
    fetchWorkOrders: store.fetchWorkOrders,
    fetchServices: store.fetchServices,
  }
}
