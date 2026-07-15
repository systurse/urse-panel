import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportService, type StudentListItem, type StatsResponse, type StudentFilters } from '../services/reportService'

export const useReportStore = defineStore('report', () => {
  const students = ref<StudentListItem[]>([])
  const stats = ref<StatsResponse | null>(null)
  const loading = ref(false)
  const exporting = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalStudents = ref(0)

  const fetchStudents = async (page: number = 1, filters: StudentFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await reportService.getStudents(page, 10, filters)
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

  const exportStudents = async (filters: StudentFilters = {}) => {
    exporting.value = true
    error.value = null

    try {
      const blob = await reportService.exportStudents(filters)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `estudiantes-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.message || 'Error al exportar estudiantes'
      throw err
    } finally {
      exporting.value = false
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
    exporting,
    error,
    currentPage,
    totalPages,
    totalStudents,
    fetchStudents,
    exportStudents,
    fetchStats,
    updateStats,
    addStudent,
    clearError,
  }
})
