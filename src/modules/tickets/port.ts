export type DealStatus = 'pending' | 'approval_requested' | 'modifications_requested' | 'approved' | 'signed'

export interface ModificationRequest {
  id: number
  notes: string
  requested_by_name: string | null
  created_at: string
}

export interface LocalDeal {
  id: number
  title: string
  stage_id: string
  status: DealStatus
  status_label: string
  assigned_user_email: string
  assigned_user_name: string
  contact_name: string | null
  folio: string | null
  num_inventario: string | null
  area_atencion: string | null
  responsable: string | null
  descripcion_equipo: string | null
  ubicacion: string | null
  tipo_servicio: string | null
  prestamo: string | null
  problema_en: string | null
  garantia: string | null
  reporte_usuario: string | null
  diagnostico: string | null
  solucion: string | null
  requerimientos: string | null
  recomendaciones: string | null
  approval_requested_at: string | null
  signed_at: string | null
  signed_by_name: string | null
  can_download: boolean
  synced_at: string | null
  modification_requests: ModificationRequest[] | null
}

export interface TicketsPort {
  list: (onlyMine?: boolean) => Promise<LocalDeal[]>
  requestApproval: (dealId: number) => Promise<void>
  syncFromBitrix: (dealId: number) => Promise<void>
  downloadSigned: (dealId: number) => Promise<Blob>
}
