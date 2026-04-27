import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSACCStore = defineStore('sacc', () => {
  const reservations = ref([])
  const loading = ref(false)

  const fetchReservations = async () => {
    loading.value = true
    try {
      // TODO: Implementar llamada a API
      // const response = await saccService.getReservations()
      // reservations.value = response
    } finally {
      loading.value = false
    }
  }

  return {
    reservations,
    loading,
    fetchReservations,
  }
})
