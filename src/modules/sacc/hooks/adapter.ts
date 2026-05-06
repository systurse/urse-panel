import type { Deal, DealsPort } from '@/modules/sacc/hooks/port'
import type { HttpClient } from '@/services/http'
import { http, httpClient } from '@/services/http'

type ApiDeal = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

function mapDeal (raw: ApiDeal): Deal {
  const assignedUser = raw.assigned_user as Record<string, unknown> | null
  const contact = raw.contact as Record<string, unknown> | null

  return {
    id: raw.id as number | string,
    title: typeof raw.title === 'string' ? raw.title : '',
    created_at: typeof raw.created_at === 'string' ? raw.created_at : null,
    assigned_user: assignedUser
      ? { id: assignedUser.id as number | null, name: String(assignedUser.name ?? '') }
      : null,
    contact: contact
      ? { id: contact.id as number | null, name: String(contact.name ?? '') }
      : null,
  }
}

function unwrapDeals (response: ApiDeal[] | LaravelCollectionResponse<ApiDeal>): ApiDeal[] {
  if (Array.isArray(response)) {
    return response
  }
  if (Array.isArray(response.data)) {
    return response.data
  }
  return []
}

export class HttpDealsAdapter implements DealsPort {
  constructor (private readonly client: HttpClient) {}

  async list (): Promise<Deal[]> {
    const response = await this.client.get<ApiDeal[] | LaravelCollectionResponse<ApiDeal>>('/api/v1/deals')
    return unwrapDeals(response).map(mapDeal)
  }

  async downloadServiceOrder (dealId: number | string): Promise<Blob> {
    const response = await http.get(`/api/v1/deals/${dealId}/service-order`, {
      responseType: 'blob',
    })
    return response.data as Blob
  }
}

export const dealsAdapter = new HttpDealsAdapter(httpClient)
