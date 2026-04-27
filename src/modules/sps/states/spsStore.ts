import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSPSStore = defineStore('sps', () => {
  const exitPermissions = ref([])
  const pendingApprovals = ref([])
  const loading = ref(false)

  const fetchExitPermissions = async () => {
    loading.value = true
    try {
      // TODO: Implementar llamada a API
      // const response = await spsService.getExitPermissions()
      // exitPermissions.value = response
    } finally {
      loading.value = false
    }
  }

  const fetchPendingApprovals = async () => {
    loading.value = true
    try {
      // TODO: Implementar llamada a API
      // const response = await spsService.getPendingApprovals()
      // pendingApprovals.value = response
    } finally {
      loading.value = false
    }
  }

  return {
    exitPermissions,
    pendingApprovals,
    loading,
    fetchExitPermissions,
    fetchPendingApprovals,
  }
})
