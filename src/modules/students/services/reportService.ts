import { httpClient } from '@/services/http'

const STUDENTS_API = '/api/v1/students'
const STATS_API = '/api/v1/students/stats'

export interface Career {
  id: number
  name: string
  email: string
  schedule: string
  created_at: string | null
  updated_at: string | null
}

export interface StudentListItem {
  id: number
  matricula: string
  name: string
  first_last_name: string
  second_last_name: string
  career: Career | string
  status: 'pending' | 'active' | 'suspended'
  institutional_email: string
  created_at: string
}

export interface StudentsListResponse {
  data: StudentListItem[]
  current_page: number
  total: number
  per_page: number
  last_page: number
}

export interface StatsResponse {
  total: number
  by_status: {
    pending: number
    active: number
    suspended: number
  }
  by_career: Record<string, number>
}

export const reportService = {
  async getStudents (page: number = 1, perPage: number = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search?.trim()) params.set('search', search.trim())
    const response = await httpClient.get<StudentsListResponse>(`${STUDENTS_API}?${params}`)
    return response
  },

  async getStats () {
    const response = await httpClient.get<StatsResponse>(STATS_API)
    return response
  },
}
