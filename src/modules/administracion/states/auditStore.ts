import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type AuditFilters, type AuditItem, auditService, type AuditTypeOption } from '../services/auditService'

export const useAuditStore = defineStore('auditoria', () => {
  const audits = ref<AuditItem[]>([])
  const auditTypes = ref<AuditTypeOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalAudits = ref(0)
  const perPage = ref(20)

  const fetchAudits = async (filters: AuditFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await auditService.getAudits(filters)
      audits.value = response.data
      currentPage.value = response.meta.current_page
      totalPages.value = response.meta.last_page
      totalAudits.value = response.meta.total
      perPage.value = response.meta.per_page
      return response
    } catch (error_: any) {
      error.value = error_.response?.data?.message || error_.message || 'Error al cargar la bitácora'
      throw error_
    } finally {
      loading.value = false
    }
  }

  const fetchAuditTypes = async () => {
    if (auditTypes.value.length > 0) {
      return auditTypes.value
    }

    try {
      auditTypes.value = await auditService.getAuditTypes()
      return auditTypes.value
    } catch (error_: any) {
      error.value = error_.response?.data?.message || error_.message || 'Error al cargar el catálogo de tipos'
      throw error_
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    audits,
    auditTypes,
    loading,
    error,
    currentPage,
    totalPages,
    totalAudits,
    perPage,
    fetchAudits,
    fetchAuditTypes,
    clearError,
  }
})
