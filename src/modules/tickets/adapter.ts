import type { LocalDeal, ModificationRequest, TicketsPort } from '@/modules/tickets/port'
import type { HttpClient } from '@/services/http'
import { http, httpClient } from '@/services/http'
import { getAuthToken } from '@/services/storage'

type ApiDeal = Record<string, unknown>
type ApiModificationRequest = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

function mapModificationRequest (raw: ApiModificationRequest): ModificationRequest {
  return {
    id: raw.id as number,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    requested_by_name: typeof raw.requested_by_name === 'string' ? raw.requested_by_name : null,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : '',
  }
}

function mapDeal (raw: ApiDeal): LocalDeal {
  return {
    id: raw.id as number,
    title: typeof raw.title === 'string' ? raw.title : '',
    stage_id: typeof raw.stage_id === 'string' ? raw.stage_id : '',
    status: (raw.status as LocalDeal['status']) ?? 'pending',
    status_label: typeof raw.status_label === 'string' ? raw.status_label : '',
    assigned_user_email: typeof raw.assigned_user_email === 'string' ? raw.assigned_user_email : '',
    assigned_user_name: typeof raw.assigned_user_name === 'string' ? raw.assigned_user_name : '',
    contact_name: typeof raw.contact_name === 'string' ? raw.contact_name : null,
    folio: typeof raw.folio === 'string' ? raw.folio : null,
    num_inventario: typeof raw.num_inventario === 'string' ? raw.num_inventario : null,
    area_atencion: typeof raw.area_atencion === 'string' ? raw.area_atencion : null,
    responsable: typeof raw.responsable === 'string' ? raw.responsable : null,
    descripcion_equipo: typeof raw.descripcion_equipo === 'string' ? raw.descripcion_equipo : null,
    ubicacion: typeof raw.ubicacion === 'string' ? raw.ubicacion : null,
    tipo_servicio: typeof raw.tipo_servicio === 'string' ? raw.tipo_servicio : null,
    prestamo: typeof raw.prestamo === 'string' ? raw.prestamo : null,
    problema_en: typeof raw.problema_en === 'string' ? raw.problema_en : null,
    garantia: typeof raw.garantia === 'string' ? raw.garantia : null,
    reporte_usuario: typeof raw.reporte_usuario === 'string' ? raw.reporte_usuario : null,
    diagnostico: typeof raw.diagnostico === 'string' ? raw.diagnostico : null,
    solucion: typeof raw.solucion === 'string' ? raw.solucion : null,
    requerimientos: typeof raw.requerimientos === 'string' ? raw.requerimientos : null,
    recomendaciones: typeof raw.recomendaciones === 'string' ? raw.recomendaciones : null,
    approval_requested_at: typeof raw.approval_requested_at === 'string' ? raw.approval_requested_at : null,
    signed_at: typeof raw.signed_at === 'string' ? raw.signed_at : null,
    signed_by_name: typeof raw.signed_by_name === 'string' ? raw.signed_by_name : null,
    can_download: raw.can_download === true,
    synced_at: typeof raw.synced_at === 'string' ? raw.synced_at : null,
    modification_requests: Array.isArray(raw.modification_requests)
      ? (raw.modification_requests as ApiModificationRequest[]).map(mapModificationRequest)
      : null,
  }
}

function unwrapDeals (response: ApiDeal[] | LaravelCollectionResponse<ApiDeal>): ApiDeal[] {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  return []
}

export class HttpTicketsAdapter implements TicketsPort {
  constructor (private readonly client: HttpClient) {}

  async list (onlyMine = true) {
    const config = onlyMine ? undefined : { params: { only_mine: false } }
    const response = await this.client.get<ApiDeal[] | LaravelCollectionResponse<ApiDeal>>('/api/v1/tickets', config)
    return unwrapDeals(response).map(mapDeal)
  }

  async requestApproval (dealId: number) {
    await this.client.post<unknown>(`/api/v1/tickets/${dealId}/request-approval`)
  }

  async syncFromBitrix (dealId: number) {
    await this.client.post<unknown>(`/api/v1/tickets/${dealId}/sync`)
  }

  async downloadSigned (dealId: number): Promise<Blob> {
    const response = await http.get(`/api/v1/deals/${dealId}/signed-pdf`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })

    return response.data as Blob
  }
}

export const ticketsAdapter = new HttpTicketsAdapter(httpClient)
