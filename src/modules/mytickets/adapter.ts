import type { ContactTicket, MyTicketsPort } from '@/modules/mytickets/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiTicket = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

function mapTicket (raw: ApiTicket): ContactTicket {
  return {
    id: raw.id as number,
    title: typeof raw.title === 'string' ? raw.title : '',
    status: (raw.status as ContactTicket['status']) ?? 'pending',
    status_label: typeof raw.status_label === 'string' ? raw.status_label : '',
    folio: typeof raw.folio === 'string' ? raw.folio : null,
    area_atencion: typeof raw.area_atencion === 'string' ? raw.area_atencion : null,
    descripcion_equipo: typeof raw.descripcion_equipo === 'string' ? raw.descripcion_equipo : null,
    tipo_servicio: typeof raw.tipo_servicio === 'string' ? raw.tipo_servicio : null,
    reporte_usuario: typeof raw.reporte_usuario === 'string' ? raw.reporte_usuario : null,
    diagnostico: typeof raw.diagnostico === 'string' ? raw.diagnostico : null,
    solucion: typeof raw.solucion === 'string' ? raw.solucion : null,
    recomendaciones: typeof raw.recomendaciones === 'string' ? raw.recomendaciones : null,
    assigned_user_name: typeof raw.assigned_user_name === 'string' ? raw.assigned_user_name : null,
    approval_requested_at: typeof raw.approval_requested_at === 'string' ? raw.approval_requested_at : null,
    signed_at: typeof raw.signed_at === 'string' ? raw.signed_at : null,
    synced_at: typeof raw.synced_at === 'string' ? raw.synced_at : null,
  }
}

function unwrapTickets (response: ApiTicket[] | LaravelCollectionResponse<ApiTicket>): ApiTicket[] {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  return []
}

export class HttpMyTicketsAdapter implements MyTicketsPort {
  constructor (private readonly client: HttpClient) {}

  async list () {
    const response = await this.client.get<ApiTicket[] | LaravelCollectionResponse<ApiTicket>>('/api/v1/my-tickets')
    return unwrapTickets(response).map(mapTicket)
  }
}

export const myTicketsAdapter = new HttpMyTicketsAdapter(httpClient)
