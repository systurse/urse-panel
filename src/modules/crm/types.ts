export type DealChannel = 'contact_form' | 'whatsapp' | 'email' | 'manual'
export type DealStatus = 'open' | 'won' | 'lost'
export type ActivityType = 'reminder' | 'comment' | 'email' | 'system'
export type ServiceOrderStatus = 'draft' | 'approval_requested' | 'modifications_requested' | 'signed'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface CrmUser {
  id: number
  name: string
  email: string
  avatar?: string | null
}

export interface Stage {
  id: number
  pipeline_id: number
  name: string
  position: number
  color: string | null
  deals_count?: number
}

export interface Pipeline {
  id: number
  name: string
  description: string | null
  is_default: boolean
  stages?: Stage[]
}

export interface Contact {
  id: number
  first_name: string
  last_name: string | null
  full_name: string
  email: string | null
  phone: string | null
  faculty: string | null
  campus: string | null
  location: string | null
  terms_accepted_at?: string | null
  created_at?: string
  deals?: Deal[]
  deals_count?: number
}

export interface ActivityAttachment {
  id: number
  original_name: string
  mime_type: string | null
  size: number
  download_url: string
}

export interface DealActivity {
  id: number
  deal_id: number
  type: ActivityType
  type_label: string
  body: string | null
  remind_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user?: CrmUser | null
  attachments?: ActivityAttachment[]
}

export interface ModificationRequest {
  id: number
  notes: string
  requested_by_name: string | null
  created_at: string
}

export interface ServiceOrder {
  id: number
  deal_id: number
  folio: string | null
  solution: string | null
  diagnosis: string | null
  requirements: string | null
  recommendations: string | null
  service_type: string | null
  problem_area: string | null
  warranty: boolean | null
  loan: boolean | null
  inventory_number: string | null
  equipment_description: string | null
  location: string | null
  team_manager: string | null
  status: ServiceOrderStatus
  status_label: string
  approval_requested_at: string | null
  signed_at: string | null
  signed_by_name?: string | null
  signed_pdf_available: boolean
  metadata: Record<string, unknown> | null
  created_at?: string
  modification_requests?: ModificationRequest[]
  deal?: Deal
}

export interface Project {
  id: number
  name: string
  description: string | null
  created_at: string
  creator?: CrmUser | null
  tasks?: Task[]
  tasks_count?: number
}

export interface TaskCommentAttachment {
  id: number
  original_name: string
  mime_type: string | null
  size: number
  download_url: string
}

export interface TaskComment {
  id: number
  task_id: number
  body: string
  created_at: string
  user?: CrmUser | null
  attachments?: TaskCommentAttachment[]
}

export interface Task {
  id: number
  project_id: number | null
  deal_id: number | null
  title: string
  description: string | null
  status: TaskStatus
  status_label: string
  due_date: string | null
  position: number
  created_at: string
  comments_count?: number
  assignee?: CrmUser | null
  creator?: CrmUser | null
  project?: Project | null
  deal_title?: string | null
}

export interface Deal {
  id: number
  pipeline_id: number
  stage_id: number
  title: string
  description: string | null
  channel: DealChannel
  channel_label: string
  type: string | null
  faculty: string | null
  campus: string | null
  location: string | null
  status: DealStatus
  status_label: string
  visible_to_all: boolean
  position: number
  requested_at: string | null
  started_at: string | null
  due_date: string | null
  closed_at: string | null
  created_at: string
  contact?: Contact | null
  assignee?: CrmUser | null
  creator?: CrmUser | null
  stage?: Stage
  service_order?: ServiceOrder | null
  activities?: DealActivity[]
  tasks?: Task[]
}

export interface StageReport {
  stage_id: number
  name: string
  color: string | null
  total: number
}

export interface AssigneeReport {
  user_id: number
  name: string
  total: number
  won: number
}

export interface CrmReports {
  pipeline: { id: number, name: string }
  by_stage: StageReport[]
  by_channel: Record<string, number>
  by_assignee: AssigneeReport[]
  totals: {
    open: number
    won: number
    lost: number
    unassigned_open: number
    won_this_month: number
    lost_this_month: number
  }
  avg_resolution_days: number | null
}

export interface WidgetConfig {
  whatsapp_number: string | null
  whatsapp_link: string | null
  support_mailbox: string | null
}

export interface DealFilters {
  pipeline_id?: number
  stage_id?: number
  assigned_to?: number
  channel?: DealChannel
  status?: DealStatus
  q?: string
}

export interface DealPayload {
  title: string
  description?: string | null
  channel: DealChannel
  type?: string | null
  pipeline_id?: number
  stage_id?: number
  assigned_to?: number | null
  visible_to_all?: boolean
  requested_at?: string | null
  started_at?: string | null
  due_date?: string | null
  contact_id?: number | null
  contact?: {
    first_name: string
    last_name?: string | null
    email?: string | null
    phone?: string | null
    faculty?: string | null
    campus?: string | null
    location?: string | null
  }
}

export interface ServiceOrderPayload {
  solution?: string | null
  diagnosis?: string | null
  requirements?: string | null
  recommendations?: string | null
  problem_area?: string | null
  warranty?: boolean | null
  loan?: boolean | null
  inventory_number?: string | null
  equipment_description?: string | null
  location?: string | null
  team_manager?: string | null
}

export const SERVICE_TYPE_OPTIONS = [
  { value: 'Servicio', title: 'Servicio' },
  { value: 'Equipo', title: 'Equipo (CPU)' },
  { value: 'Asesoría', title: 'Asesoría' },
  { value: 'Soporte', title: 'Soporte' },
]

export const PROBLEM_AREA_OPTIONS = ['Hardware', 'Software', 'Redes', 'Otro']

export const CAMPUS_OPTIONS = ['Rosario', 'Alemán', 'IMSS', 'HRAEO']

export const YES_NO_OPTIONS = [
  { value: true, title: 'Sí' },
  { value: false, title: 'No' },
]

export interface PublicLeadPayload {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  faculty: string
  campus: string
  location: string
  request: string
  terms_accepted: boolean
  recaptcha_token: string
}
