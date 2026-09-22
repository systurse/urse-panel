import { httpClient } from '@/services/http'

const AUDITS_API = '/api/v1/audits'

export interface AuditUser {
  id: number
  name: string
  email: string
  avatar: string | null
}

/** Los eventos `created` llegan con old_values como arreglo vacío, no como objeto. */
export type AuditValues = Record<string, unknown> | unknown[]

export interface AuditItem {
  id: number
  event: 'created' | 'updated' | 'deleted' | 'restored'
  auditable_type: string
  auditable_label: string
  auditable_id: number
  old_values: AuditValues
  new_values: AuditValues
  url: string | null
  ip_address: string | null
  user_agent: string | null
  tags: string | null
  created_at: string
  user: AuditUser | null
}

export interface AuditListResponse {
  data: AuditItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface AuditTypeOption {
  value: string
  label: string
}

export interface AuditFilters {
  page?: number
  per_page?: number
  search?: string
  type?: string
  event?: string
  from?: string
  to?: string
}

export const auditService = {
  async getAudits (filters: AuditFilters = {}) {
    const params = new URLSearchParams()
    if (filters.page) {
      params.append('page', String(filters.page))
    }
    if (filters.per_page) {
      params.append('per_page', String(filters.per_page))
    }
    if (filters.search) {
      params.append('filter[search]', filters.search)
    }
    if (filters.type) {
      params.append('filter[type]', filters.type)
    }
    if (filters.event) {
      params.append('filter[event]', filters.event)
    }
    if (filters.from) {
      params.append('filter[from]', filters.from)
    }
    if (filters.to) {
      params.append('filter[to]', filters.to)
    }

    const query = params.toString()

    return await httpClient.get<AuditListResponse>(query ? `${AUDITS_API}?${query}` : AUDITS_API)
  },

  async getAuditTypes () {
    const response = await httpClient.get<{ data: AuditTypeOption[] }>(`${AUDITS_API}/types`)
    return response.data
  },
}
