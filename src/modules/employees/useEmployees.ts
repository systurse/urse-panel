import type { Employee, EmployeePayload, EmployeesPort } from '@/modules/employees/port'
import { onMounted, ref } from 'vue'
import { employeesAdapter } from '@/modules/employees/adapter'

export function useEmployees (employeesPort: EmployeesPort = employeesAdapter) {
  const employees = ref<Employee[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadEmployees () {
    loading.value = true
    error.value = null

    try {
      employees.value = await employeesPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los empleados'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function createEmployee (payload: EmployeePayload) {
    loading.value = true
    error.value = null

    try {
      const newEmployee = await employeesPort.create(payload)
      employees.value.push(newEmployee)
      return newEmployee
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible crear el empleado'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateEmployee (employeeId: number | string, payload: Partial<EmployeePayload>) {
    loading.value = true
    error.value = null

    try {
      const updatedEmployee = await employeesPort.update(employeeId, payload)
      const index = employees.value.findIndex(e => e.id === employeeId)
      if (index !== -1) {
        employees.value[index] = updatedEmployee
      }
      return updatedEmployee
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el empleado'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeEmployee (employeeId: number | string) {
    loading.value = true
    error.value = null

    try {
      await employeesPort.remove(employeeId)
      employees.value = employees.value.filter(e => e.id !== employeeId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar el empleado'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadEmployees()
  })

  return {
    createEmployee,
    employees,
    error,
    loadEmployees,
    loading,
    removeEmployee,
    updateEmployee,
  }
}
