export interface EmployeeAreaRef {
  id: number | string
  name: string
}

export interface Employee {
  id: number | string
  name: string
  first_name: string
  last_name: string | null
  second_last_name: string | null
  employee_number: string
  category: string
  area_id: number | string | null
  area: EmployeeAreaRef | null
  work_schedule: string | null
  shift_start: string | null
  shift_end: string | null
  user_id: number | string | null
}

export interface EmployeePayload {
  first_name: string
  last_name?: string | null
  second_last_name?: string | null
  employee_number: string
  category: string
  area_id: number | string
  work_schedule?: string | null
  shift_start?: string | null
  shift_end?: string | null
  user_id?: number | string | null
}

export interface EmployeesPort {
  create: (payload: EmployeePayload) => Promise<Employee>
  getById: (employeeId: number | string) => Promise<Employee>
  getByUserId: (userId: number | string) => Promise<Employee | null>
  getSupervisor: (employeeId: number | string) => Promise<Employee | null>
  list: () => Promise<Employee[]>
  remove: (employeeId: number | string) => Promise<void>
  update: (employeeId: number | string, payload: Partial<EmployeePayload>) => Promise<Employee>
}
