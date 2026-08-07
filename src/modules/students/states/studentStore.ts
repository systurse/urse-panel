import { defineStore } from 'pinia'
import { ref } from 'vue'
import { studentService, type StudentResponse, type StudentStatus, type Career } from '../services/studentService'

export const useStudentStore = defineStore('student', () => {
  const registeredStudent = ref<StudentResponse | null>(null)
  const credentialSheetUrl = ref<string | null>(null)
  const studentStatus = ref<StudentStatus | null>(null)
  const careers = ref<Career[]>([])
  const loading = ref(false)
  const careersLoading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const registerStudent = async (data: any) => {
    loading.value = true
    error.value = null
    successMessage.value = null

    try {
      const response = await studentService.registerStudent(data)
      registeredStudent.value = response.student
      credentialSheetUrl.value = response.credential_sheet_url
      successMessage.value = response.message || '¡Estudiante registrado exitosamente!'
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al registrar el alumno'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadCareers = async () => {
    careersLoading.value = true
    error.value = null

    try {
      const response = await studentService.getCareers()
      careers.value = response
      return response
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar las carreras'
      console.error('Error cargando carreras:', err)
      error.value = errorMsg
      throw err
    } finally {
      careersLoading.value = false
    }
  }

  const fetchStudentStatus = async (studentId: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await studentService.getStudentStatus(studentId)
      studentStatus.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al obtener el estado del alumno'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetStudentPassword = async (studentId: number, password: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await studentService.resetPassword(studentId, password)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al resetear la contraseña'
      throw err
    } finally {
      loading.value = false
    }
  }

  const suggestWifiPassword = async () => {
    const response = await studentService.suggestWifiPassword()
    return response.password
  }

  /**
   * El backend empuja la contraseña a Active Directory antes de guardarla, así que
   * un error aquí significa que nada cambió: ni en el directorio ni en la base.
   */
  const updateWifiPassword = async (studentId: number, password: string) => {
    loading.value = true
    error.value = null

    try {
      return await studentService.updateWifiPassword(studentId, password)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar la contraseña de Wi-Fi'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    registeredStudent,
    credentialSheetUrl,
    studentStatus,
    careers,
    loading,
    careersLoading,
    error,
    successMessage,
    registerStudent,
    fetchStudentStatus,
    resetStudentPassword,
    suggestWifiPassword,
    updateWifiPassword,
    loadCareers,
    clearError,
  }
})
