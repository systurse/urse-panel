import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSSMStore = defineStore('ssm', () => {
  const workOrders = ref([])
  const services = ref([])
  const loading = ref(false)

  const fetchWorkOrders = async () => {
    loading.value = true
    try {
      // TODO: Implementar llamada a API
      // const response = await ssmService.getWorkOrders()
      // workOrders.value = response
    } finally {
      loading.value = false
    }
  }

  const fetchServices = async () => {
    loading.value = true
    try {
      // TODO: Implementar llamada a API
      // const response = await ssmService.getServices()
      // services.value = response
    } finally {
      loading.value = false
    }
  }

  return {
    workOrders,
    services,
    loading,
    fetchWorkOrders,
    fetchServices,
  }
})
