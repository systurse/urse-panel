import { onMounted } from 'vue'
import { useSPSStore } from '../states/spsStore'

export function useSPS () {
  const store = useSPSStore()

  onMounted(() => {
    store.fetchExitPermissions()
    store.fetchPendingApprovals()
  })

  return {
    exitPermissions: store.exitPermissions,
    pendingApprovals: store.pendingApprovals,
    loading: store.loading,
    fetchExitPermissions: store.fetchExitPermissions,
    fetchPendingApprovals: store.fetchPendingApprovals,
  }
}
