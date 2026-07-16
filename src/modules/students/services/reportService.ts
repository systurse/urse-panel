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
  credentials_retrieved?: number
  by_status: {
    pending: number
    active: number
    suspended: number
  }
  by_career: Record<string, number>
}

export interface StudentFilters {
  search?: string
  careerId?: number
  dateFrom?: string
  dateTo?: string
}

function buildFilterParams (filters: StudentFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.careerId) params.set('career_id', String(filters.careerId))
  if (filters.dateFrom) params.set('date_from', filters.dateFrom)
  if (filters.dateTo) params.set('date_to', filters.dateTo)
  return params
}

export interface ExportParams {
  career_id?: number | null
  date_field?: 'created_at' | 'activated_at' | 'credentials_retrieved_at'
  date_from?: string
  date_to?: string
}

export const reportService = {
  async getStudents (page: number = 1, perPage: number = 10, filters: StudentFilters = {}) {
    const params = buildFilterParams(filters)
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    const response = await httpClient.get<StudentsListResponse>(`${STUDENTS_API}?${params}`)
    return response
  },

  async getStats () {
    const response = await httpClient.get<StatsResponse>(STATS_API)
    return response
  },

  async exportCredentials (filters: ExportParams = {}) {
    const params = new URLSearchParams()
    if (filters.career_id) params.set('career_id', String(filters.career_id))
    if (filters.date_field) params.set('date_field', filters.date_field)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    const query = params.toString()
    const url = `${STUDENTS_API}/credentials-export${query ? `?${query}` : ''}`
    const response = await httpClient.get<Blob>(url, { responseType: 'blob' })
    return response
  },
}
