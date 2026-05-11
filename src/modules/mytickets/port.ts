export type DealStatus = 'pending' | 'approval_requested' | 'modifications_requested' | 'approved' | 'signed'

export interface ContactTicket {
  id: number
  title: string
  status: DealStatus
  status_label: string
  folio: string | null
  area_atencion: string | null
  descripcion_equipo: string | null
  tipo_servicio: string | null
  reporte_usuario: string | null
  diagnostico: string | null
  solucion: string | null
  recomendaciones: string | null
  assigned_user_name: string | null
  approval_requested_at: string | null
  signed_at: string | null
  synced_at: string | null
  verification_url: string | null
}

export interface MyTicketsPort {
  list: () => Promise<ContactTicket[]>
}
