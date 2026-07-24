import { toRef } from 'vue'
import { useReportStore } from '../states/reportStore'

export function useReport () {
  const store = useReportStore()

  return {
    students: toRef(store, 'students'),
    stats: toRef(store, 'stats'),
    loading: toRef(store, 'loading'),
    error: toRef(store, 'error'),
    currentPage: toRef(store, 'currentPage'),
    totalPages: toRef(store, 'totalPages'),
    totalStudents: toRef(store, 'totalStudents'),
    fetchStudents: store.fetchStudents,
    fetchStats: store.fetchStats,
    updateStats: store.updateStats,
    addStudent: store.addStudent,
    clearError: store.clearError,
  }
}
