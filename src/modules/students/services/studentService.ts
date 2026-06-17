import { httpClient } from '@/services/http'

const STUDENTS_API = '/api/v1/students'
const CAREERS_API = '/api/v1/careers'

export interface StudentRegistration {
  matricula: string
  servo_username: string
  name: string
  first_last_name: string
  second_last_name: string
  career_id: number
  password: string
}

export interface Career {
  id: number
  name: string
  email: string
  schedule: string
  created_at: string | null
  updated_at: string | null
}

export interface StudentResponse {
  id: number
  matricula: string
  servo_username: string
  name: string
  first_last_name: string
  second_last_name: string
  institutional_email: string
  wifi_password: string
  status: 'pending' | 'active' | 'suspended'
  microsoft_365_id: string | null
  activated_at: string | null
  credential_sheet_url?: string
}

export interface RegisterResponse {
  student: StudentResponse
  credential_sheet_url: string
  message: string
}

export interface ProvisioningStep {
  step: 'microsoft_365' | 'active_directory' | 'activation' | 'credential_sheet'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error: string | null
  completed_at: string | null
}

export interface StudentStatus {
  id: number
  matricula: string
  institutional_email: string
  status: 'pending' | 'active' | 'suspended'
  provisioning_steps: ProvisioningStep[]
}

export const studentService = {
  async registerStudent (data: StudentRegistration) {
    const response = await httpClient.post<RegisterResponse>(STUDENTS_API, data)
    console.log('registerStudent response:', response)
    return response
  },

  async getStudentStatus (studentId: number) {
    const response = await httpClient.get(`${STUDENTS_API}/${studentId}`)
    return response.data as StudentStatus
  },

  async resetPassword (studentId: number, password: string) {
    const response = await httpClient.post(
      `${STUDENTS_API}/${studentId}/reset-password`,
      { password },
    )
    return response.data
  },

  async getCareers () {
    const response = await httpClient.get<Career[]>(CAREERS_API)
    return response
  },
}
