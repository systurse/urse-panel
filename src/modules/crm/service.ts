import type {
  Contact,
  CrmReports,
  CrmUser,
  Deal,
  DealActivity,
  DealFilters,
  DealPayload,
  Pipeline,
  Project,
  PublicLeadPayload,
  ServiceOrder,
  ServiceOrderPayload,
  Stage,
  Task,
  TaskComment,
  TaskStatus,
  WidgetConfig,
} from '@/modules/crm/types'
import { http, httpClient, publicHttpClient } from '@/services/http'

interface ApiItem<T> { data: T }
interface ApiCollection<T> { data: T[], meta?: { total?: number, last_page?: number } }

const BASE = '/api/v1/crm'
const PUBLIC_BASE = '/api/v1/public/crm'

// ---------------------------------------------------------------- pipelines
export async function listPipelines () {
  const response = await httpClient.get<ApiCollection<Pipeline>>(`${BASE}/pipelines`)
  return response.data
}

export async function createPipeline (payload: { name: string, description?: string | null, is_default?: boolean, stages?: Array<{ name: string, color?: string | null }> }) {
  const response = await httpClient.post<ApiItem<Pipeline>>(`${BASE}/pipelines`, payload)
  return response.data
}

export async function updatePipeline (id: number, payload: { name?: string, description?: string | null, is_default?: boolean }) {
  const response = await httpClient.put<ApiItem<Pipeline>>(`${BASE}/pipelines/${id}`, payload)
  return response.data
}

export function deletePipeline (id: number) {
  return httpClient.delete<void>(`${BASE}/pipelines/${id}`)
}

export async function createStage (pipelineId: number, payload: { name: string, color?: string | null }) {
  const response = await httpClient.post<ApiItem<Stage>>(`${BASE}/pipelines/${pipelineId}/stages`, payload)
  return response.data
}

export async function updateStage (id: number, payload: { name?: string, color?: string | null }) {
  const response = await httpClient.put<ApiItem<Stage>>(`${BASE}/stages/${id}`, payload)
  return response.data
}

export function deleteStage (id: number) {
  return httpClient.delete<void>(`${BASE}/stages/${id}`)
}

export function reorderStages (pipelineId: number, stageIds: number[]) {
  return httpClient.post<unknown>(`${BASE}/pipelines/${pipelineId}/stages/reorder`, { stage_ids: stageIds })
}

// ----------------------------------------------------------------- contacts
export async function listContacts (params: { q?: string, page?: number, per_page?: number } = {}) {
  return httpClient.get<ApiCollection<Contact>>(`${BASE}/contacts`, { params })
}

export async function getContact (id: number) {
  const response = await httpClient.get<ApiItem<Contact>>(`${BASE}/contacts/${id}`)
  return response.data
}

export async function createContact (payload: Partial<Contact>) {
  const response = await httpClient.post<ApiItem<Contact>>(`${BASE}/contacts`, payload)
  return response.data
}

export async function updateContact (id: number, payload: Partial<Contact>) {
  const response = await httpClient.put<ApiItem<Contact>>(`${BASE}/contacts/${id}`, payload)
  return response.data
}

// -------------------------------------------------------------------- deals
export async function listDeals (filters: DealFilters & { per_page?: number, sort?: string } = {}) {
  const response = await httpClient.get<ApiCollection<Deal>>(`${BASE}/deals`, { params: filters })
  return response.data
}

export async function getDeal (id: number) {
  const response = await httpClient.get<ApiItem<Deal>>(`${BASE}/deals/${id}`)
  return response.data
}

export async function createDeal (payload: DealPayload) {
  const response = await httpClient.post<ApiItem<Deal>>(`${BASE}/deals`, payload)
  return response.data
}

export async function updateDeal (id: number, payload: Partial<DealPayload>) {
  const response = await httpClient.put<ApiItem<Deal>>(`${BASE}/deals/${id}`, payload)
  return response.data
}

export function deleteDeal (id: number) {
  return httpClient.delete<void>(`${BASE}/deals/${id}`)
}

export async function moveDeal (id: number, stageId: number, position: number) {
  const response = await httpClient.post<ApiItem<Deal>>(`${BASE}/deals/${id}/move`, { stage_id: stageId, position })
  return response.data
}

export async function assignDeal (id: number, userId: number | null) {
  const response = await httpClient.post<ApiItem<Deal>>(`${BASE}/deals/${id}/assign`, { user_id: userId })
  return response.data
}

export async function closeDeal (id: number, result: 'won' | 'lost', generateServiceOrder = false) {
  const response = await httpClient.post<ApiItem<Deal>>(`${BASE}/deals/${id}/close`, {
    result,
    generate_service_order: generateServiceOrder,
  })
  return response.data
}

export async function listAssignables () {
  const response = await httpClient.get<ApiCollection<CrmUser>>(`${BASE}/assignables`)
  return response.data
}

// -------------------------------------------------- activities and messages
export async function listActivities (dealId: number, params: { type?: string } = {}) {
  const response = await httpClient.get<ApiCollection<DealActivity>>(`${BASE}/deals/${dealId}/activities`, { params })
  return response.data
}

export async function createActivity (dealId: number, payload: { type: 'reminder' | 'comment', body: string, remind_at?: string | null, attachments?: File[] }) {
  const form = new FormData()
  form.append('type', payload.type)
  form.append('body', payload.body)

  if (payload.remind_at) {
    form.append('remind_at', payload.remind_at)
  }

  for (const file of payload.attachments ?? []) {
    form.append('attachments[]', file)
  }

  const response = await httpClient.post<ApiItem<DealActivity>>(`${BASE}/deals/${dealId}/activities`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function sendDealMessage (dealId: number, payload: { subject: string, body: string }) {
  const response = await httpClient.post<ApiItem<DealActivity>>(`${BASE}/deals/${dealId}/messages`, payload)
  return response.data
}

export async function downloadAttachment (url: string): Promise<Blob> {
  const response = await http.get(url, { responseType: 'blob' })
  return response.data as Blob
}

// ------------------------------------------------------------ service order
export async function upsertServiceOrder (dealId: number, payload: ServiceOrderPayload) {
  const response = await httpClient.put<ApiItem<ServiceOrder>>(`${BASE}/deals/${dealId}/service-order`, payload)
  return response.data
}

export async function generateServiceOrder (dealId: number) {
  const response = await httpClient.post<ApiItem<ServiceOrder>>(`${BASE}/deals/${dealId}/service-order/generate`)
  return response.data
}

export async function requestOrderApproval (orderId: number) {
  return httpClient.post<{ message: string }>(`${BASE}/service-orders/${orderId}/request-approval`)
}

export async function listOrderApprovals (includeSigned = false) {
  const response = await httpClient.get<ApiCollection<ServiceOrder>>(`${BASE}/service-orders/approvals`, {
    params: includeSigned ? { include_signed: true } : {},
  })
  return response.data
}

export async function signOrder (orderId: number) {
  return httpClient.post<{ message: string }>(`${BASE}/service-orders/${orderId}/sign`)
}

export async function requestOrderModifications (orderId: number, notes: string) {
  return httpClient.post<{ message: string }>(`${BASE}/service-orders/${orderId}/request-modifications`, { notes })
}

export async function downloadOrderPdf (orderId: number): Promise<Blob> {
  const response = await http.get(`${BASE}/service-orders/${orderId}/pdf`, { responseType: 'blob' })
  return response.data as Blob
}

export async function downloadSignedOrderPdf (orderId: number): Promise<Blob> {
  const response = await http.get(`${BASE}/service-orders/${orderId}/signed-pdf`, { responseType: 'blob' })
  return response.data as Blob
}

// ---------------------------------------------------------------- reporting
export function getReports (pipelineId?: number) {
  return httpClient.get<CrmReports>(`${BASE}/reports`, {
    params: pipelineId ? { pipeline_id: pipelineId } : {},
  })
}

export async function listMyRequests () {
  const response = await httpClient.get<ApiCollection<Deal>>(`${BASE}/my-requests`)
  return response.data
}

// --------------------------------------------------------- tasks & projects
export async function listProjects () {
  const response = await httpClient.get<ApiCollection<Project>>(`${BASE}/projects`)
  return response.data
}

export async function createProject (payload: { name: string, description?: string | null }) {
  const response = await httpClient.post<ApiItem<Project>>(`${BASE}/projects`, payload)
  return response.data
}

export async function updateProject (id: number, payload: { name?: string, description?: string | null }) {
  const response = await httpClient.put<ApiItem<Project>>(`${BASE}/projects/${id}`, payload)
  return response.data
}

export function deleteProject (id: number) {
  return httpClient.delete<void>(`${BASE}/projects/${id}`)
}

export async function listTasks (params: { project_id?: number, deal_id?: number, status?: string, mine?: boolean } = {}) {
  const response = await httpClient.get<ApiCollection<Task>>(`${BASE}/tasks`, { params })
  return response.data
}

export async function createTask (payload: { title: string, description?: string | null, project_id?: number | null, deal_id?: number | null, assigned_to?: number | null, due_date?: string | null }) {
  const response = await httpClient.post<ApiItem<Task>>(`${BASE}/tasks`, payload)
  return response.data
}

export async function updateTask (id: number, payload: Partial<{ title: string, description: string | null, project_id: number | null, assigned_to: number | null, status: TaskStatus, due_date: string | null }>) {
  const response = await httpClient.put<ApiItem<Task>>(`${BASE}/tasks/${id}`, payload)
  return response.data
}

export async function moveTask (id: number, status: TaskStatus, position = 0) {
  const response = await httpClient.post<ApiItem<Task>>(`${BASE}/tasks/${id}/move`, { status, position })
  return response.data
}

export function deleteTask (id: number) {
  return httpClient.delete<void>(`${BASE}/tasks/${id}`)
}

// --------------------------------------------- notification preferences
export function getNotificationPreferences () {
  return httpClient.get<{ notify_new_leads: boolean }>('/api/v1/me/notification-preferences')
}

export function updateNotificationPreferences (payload: { notify_new_leads: boolean }) {
  return httpClient.put<{ notify_new_leads: boolean }>('/api/v1/me/notification-preferences', payload)
}

// -------------------------------------------------------- task comments
export async function listTaskComments (taskId: number) {
  const response = await httpClient.get<ApiCollection<TaskComment>>(`${BASE}/tasks/${taskId}/comments`)
  return response.data
}

export async function createTaskComment (taskId: number, payload: { body: string, attachments?: File[] }) {
  const form = new FormData()
  form.append('body', payload.body)

  for (const file of payload.attachments ?? []) {
    form.append('attachments[]', file)
  }

  const response = await httpClient.post<ApiItem<TaskComment>>(`${BASE}/tasks/${taskId}/comments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// ------------------------------------------------------------ public widget
export function submitPublicLead (payload: PublicLeadPayload) {
  return publicHttpClient.post<{ message: string, folio: number }>(`${PUBLIC_BASE}/leads`, payload)
}

export function matchPublicContact (params: { first_name?: string, last_name?: string, email?: string }) {
  return publicHttpClient.get<{ known: boolean }>(`${PUBLIC_BASE}/contacts/match`, { params })
}

export function getWidgetConfig () {
  return publicHttpClient.get<WidgetConfig>(`${PUBLIC_BASE}/widget-config`)
}
