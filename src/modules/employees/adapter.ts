import type { Employee, EmployeeAreaRef, EmployeePayload, EmployeesPort } from '@/modules/employees/port'
import type { HttpClient } from '@/services/http'
import type { AxiosError } from 'axios'
import { httpClient } from '@/services/http'

type ApiEmployee = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem | null
}

function getId (value: unknown): number | string | null {
  return typeof value === 'number' || typeof value === 'string' ? value : null
}

function getString (value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function getFullName (employee: ApiEmployee): string {
  const parts = [employee.first_name, employee.last_name, employee.second_last_name]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
  return parts.length > 0 ? parts.join(' ') : 'Sin nombre'
}

function mapArea (area: unknown): EmployeeAreaRef | null {
  if (!area || typeof area !== 'object') {
    return null
  }
  const record = area as ApiEmployee
  const id = getId(record.id)
  const name = getString(record.name)
  return id === null || name === null ? null : { id, name }
}

function mapEmployee (employee: ApiEmployee): Employee {
  return {
    area: mapArea(employee.area),
    area_id: getId(employee.area_id),
    category: getString(employee.category) ?? '',
    employee_number: getString(employee.employee_number) ?? '',
    first_name: getString(employee.first_name) ?? '',
    id: getId(employee.id) ?? '',
    last_name: getString(employee.last_name),
    name: getFullName(employee),
    second_last_name: getString(employee.second_last_name),
    shift_end: getString(employee.shift_end),
    shift_start: getString(employee.shift_start),
    user_id: getId(employee.user_id),
    work_schedule: getString(employee.work_schedule),
  }
}

function unwrapEmployees (response: ApiEmployee[] | LaravelCollectionResponse<ApiEmployee>) {
  if (Array.isArray(response)) {
    return response
  }
  if (Array.isArray(response.data)) {
    return response.data
  }
  return []
}

function unwrapSingle (response: ApiEmployee | SingleResourceResponse<ApiEmployee>): ApiEmployee | null {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as SingleResourceResponse<ApiEmployee>).data
    return data && typeof data === 'object' ? data : null
  }
  return response && typeof response === 'object' ? response as ApiEmployee : null
}

function isNotFound (error: unknown) {
  return (error as AxiosError)?.response?.status === 404
}

export class HttpEmployeesAdapter implements EmployeesPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: EmployeePayload) {
    const response = await this.client.post<ApiEmployee | SingleResourceResponse<ApiEmployee>, EmployeePayload>('/api/v1/employees', payload)
    return mapEmployee(unwrapSingle(response) ?? {})
  }

  async getById (employeeId: number | string) {
    const response = await this.client.get<ApiEmployee | SingleResourceResponse<ApiEmployee>>(`/api/v1/employees/${employeeId}`)
    return mapEmployee(unwrapSingle(response) ?? {})
  }

  async getByUserId (userId: number | string) {
    try {
      const response = await this.client.get<ApiEmployee | SingleResourceResponse<ApiEmployee>>('/api/v1/employee', {
        params: { user_id: userId },
      })
      const employee = unwrapSingle(response)
      return employee ? mapEmployee(employee) : null
    } catch (error) {
      if (isNotFound(error)) {
        return null
      }
      throw error
    }
  }

  async getSupervisor (employeeId: number | string) {
    const response = await this.client.get<ApiEmployee | SingleResourceResponse<ApiEmployee>>(`/api/v1/employees/${employeeId}/supervisor`)
    const supervisor = unwrapSingle(response)
    return supervisor ? mapEmployee(supervisor) : null
  }

  async list () {
    const response = await this.client.get<ApiEmployee[] | LaravelCollectionResponse<ApiEmployee>>('/api/v1/employees')
    return unwrapEmployees(response).map(employee => mapEmployee(employee))
  }

  async remove (employeeId: number | string) {
    await this.client.delete<unknown>(`/api/v1/employees/${employeeId}`)
  }

  async update (employeeId: number | string, payload: Partial<EmployeePayload>) {
    const response = await this.client.put<ApiEmployee | SingleResourceResponse<ApiEmployee>, Partial<EmployeePayload>>(`/api/v1/employees/${employeeId}`, payload)
    return mapEmployee(unwrapSingle(response) ?? {})
  }
}

export const employeesAdapter = new HttpEmployeesAdapter(httpClient)
