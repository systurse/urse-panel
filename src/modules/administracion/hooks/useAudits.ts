import { toRef } from 'vue'
import { useAuditStore } from '../states/auditStore'

export function useAudits () {
  const store = useAuditStore()

  return {
    audits: toRef(store, 'audits'),
    auditTypes: toRef(store, 'auditTypes'),
    loading: toRef(store, 'loading'),
    error: toRef(store, 'error'),
    currentPage: toRef(store, 'currentPage'),
    totalPages: toRef(store, 'totalPages'),
    totalAudits: toRef(store, 'totalAudits'),
    perPage: toRef(store, 'perPage'),
    fetchAudits: store.fetchAudits,
    fetchAuditTypes: store.fetchAuditTypes,
    clearError: store.clearError,
  }
}
