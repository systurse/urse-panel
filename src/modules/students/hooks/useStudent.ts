import { toRef } from 'vue'
import { useStudentStore } from '../states/studentStore'

export function useStudent () {
  const store = useStudentStore()

  return {
    registeredStudent: toRef(store, 'registeredStudent'),
    credentialSheetUrl: toRef(store, 'credentialSheetUrl'),
    studentStatus: toRef(store, 'studentStatus'),
    careers: toRef(store, 'careers'),
    loading: toRef(store, 'loading'),
    careersLoading: toRef(store, 'careersLoading'),
    error: toRef(store, 'error'),
    successMessage: toRef(store, 'successMessage'),
    registerStudent: store.registerStudent,
    fetchStudentStatus: store.fetchStudentStatus,
    resetStudentPassword: store.resetStudentPassword,
    loadCareers: store.loadCareers,
    clearError: store.clearError,
  }
}
