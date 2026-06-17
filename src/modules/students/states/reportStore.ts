import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportService, type StudentListItem, type StatsResponse } from '../services/reportService'

export const useReportStore = defineStore('report', () => {
  const students = ref<StudentListItem[]>([])
  const stats = ref<StatsResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalStudents = ref(0)

  const fetchStudents = async (page: number = 1, search?: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await reportService.getStudents(page, 10, search)
      students.value = response.data
      currentPage.value = response.current_page
      totalPages.value = response.last_page
      totalStudents.value = response.total
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al cargar estudiantes'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await reportService.getStats()
      stats.value = response
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al cargar estadísticas'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateStats = (newStats: StatsResponse) => {
    stats.value = newStats
  }

  const addStudent = (student: StudentListItem) => {
    students.value.unshift(student)
    totalStudents.value++
  }

  const clearError = () => {
    error.value = null
  }

  return {
    students,
    stats,
    loading,
    error,
    currentPage,
    totalPages,
    totalStudents,
    fetchStudents,
    fetchStats,
    updateStats,
    addStudent,
    clearError,
  }
})
