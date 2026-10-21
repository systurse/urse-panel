import type {
  AgendaAreaRef,
  AgendaAttachment,
  AgendaCampusRef,
  AgendaContext,
  AgendaDirector,
  AgendaDirectorPayload,
  AgendaDirectorType,
  AgendaEvent,
  AgendaEventPayload,
  AgendaExportFormat,
  AgendaFilters,
  AgendaInvitee,
  AgendaOccurrence,
  AgendaPort,
  AgendaRecurrence,
  AgendaSpace,
  AgendaSpacePayload,
  AgendaUserSummary,
} from '@/modules/agenda/port'
import { http, httpClient } from '@/services/http'

type ApiRecord = Record<string, unknown>

const BASE = '/api/v1/agenda'

function asRecord (value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {}
}

function readString (source: ApiRecord, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value.trim() : ''
}

function readNullableString (source: ApiRecord, key: string): string | null {
  return readString(source, key) || null
}

function readNumber (source: ApiRecord, key: string, fallback = 0): number {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readNullableNumber (source: ApiRecord, key: string): number | null {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBoolean (source: ApiRecord, key: string): boolean {
  return source[key] === true
}

// Responses arrive either bare or wrapped in Laravel's `data` envelope.
function unwrapData (response: unknown): unknown {
  const record = asRecord(response)
  return 'data' in record ? record.data : response
}

function unwrapList (response: unknown): unknown[] {
  const data = unwrapData(response)
  return Array.isArray(data) ? data : []
}

function mapArea (raw: unknown): AgendaAreaRef | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const item = asRecord(raw)
  return { id: readNumber(item, 'id'), name: readString(item, 'name'), type: readNullableString(item, 'type') }
}

function mapCampus (raw: unknown): AgendaCampusRef | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const item = asRecord(raw)
  return { id: readNumber(item, 'id'), code: readString(item, 'code'), name: readString(item, 'name') }
}

function mapUser (raw: unknown): AgendaUserSummary | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const item = asRecord(raw)
  return {
    id: readNumber(item, 'id'),
    name: readString(item, 'name'),
    email: readString(item, 'email'),
    avatar: readNullableString(item, 'avatar'),
  }
}

function mapSpace (raw: unknown): AgendaSpace {
  const item = asRecord(raw)

  return {
    id: readNumber(item, 'id'),
    campusId: readNullableNumber(item, 'campus_id'),
    name: readString(item, 'name'),
    capacity: readNullableNumber(item, 'capacity'),
    isActive: readBoolean(item, 'is_active'),
    eventsCount: readNullableNumber(item, 'events_count'),
    campus: mapCampus(item.campus),
  }
}

function mapInvitee (raw: unknown): AgendaInvitee {
  const item = asRecord(raw)
  const via = readString(item, 'notified_via')

  return {
    id: readNumber(item, 'id'),
    userId: readNullableNumber(item, 'user_id'),
    email: readString(item, 'email'),
    name: readNullableString(item, 'name'),
    notifiedAt: readNullableString(item, 'notified_at'),
    notifiedVia: via === 'outlook' || via === 'mail' ? via : null,
    notifiedViaLabel: readNullableString(item, 'notified_via_label'),
  }
}

function mapAttachment (raw: unknown): AgendaAttachment {
  const item = asRecord(raw)

  return {
    id: readNumber(item, 'id'),
    eventId: readNumber(item, 'event_id'),
    originalName: readString(item, 'original_name'),
    mimeType: readNullableString(item, 'mime_type'),
    size: readNumber(item, 'size'),
    createdAt: readNullableString(item, 'created_at'),
  }
}

const RECURRENCES = new Set<AgendaRecurrence>(['none', 'daily', 'weekly', 'monthly', 'yearly'])

function mapEvent (raw: unknown): AgendaEvent {
  const item = asRecord(raw)
  const outlook = asRecord(item.outlook)
  const recurrence = readString(item, 'recurrence') as AgendaRecurrence

  return {
    id: readNumber(item, 'id'),
    title: readString(item, 'title'),
    areaId: readNumber(item, 'area_id'),
    spaceId: readNullableNumber(item, 'space_id'),
    location: readNullableString(item, 'location'),
    locationLabel: readString(item, 'location_label'),
    startsAt: readString(item, 'starts_at'),
    endsAt: readString(item, 'ends_at'),
    allDay: readBoolean(item, 'all_day'),
    reminderMinutes: readNullableNumber(item, 'reminder_minutes'),
    recurrence: RECURRENCES.has(recurrence) ? recurrence : 'none',
    recurrenceLabel: readString(item, 'recurrence_label'),
    recurrenceInterval: readNumber(item, 'recurrence_interval', 1),
    recurrenceUntil: readNullableString(item, 'recurrence_until'),
    notes: readNullableString(item, 'notes'),
    url: readNullableString(item, 'url'),
    outlook: {
      synced: readBoolean(outlook, 'synced'),
      syncedAt: readNullableString(outlook, 'synced_at'),
      error: readNullableString(outlook, 'error'),
    },
    canManage: readBoolean(item, 'can_manage'),
    area: mapArea(item.area),
    space: item.space ? mapSpace(item.space) : null,
    creator: mapUser(item.creator),
    invitees: Array.isArray(item.invitees) ? item.invitees.map(invitee => mapInvitee(invitee)) : [],
    attachments: Array.isArray(item.attachments) ? item.attachments.map(attachment => mapAttachment(attachment)) : [],
  }
}

function mapOccurrence (raw: unknown): AgendaOccurrence {
  const item = asRecord(raw)

  return {
    id: readNumber(item, 'id'),
    eventId: readNumber(item, 'event_id'),
    startsAt: readString(item, 'starts_at'),
    endsAt: readString(item, 'ends_at'),
    event: mapEvent(item.event),
  }
}

const DIRECTOR_TYPES = new Set<AgendaDirectorType>(['rector', 'general_director', 'school_director'])

function mapDirector (raw: unknown): AgendaDirector {
  const item = asRecord(raw)
  const type = readString(item, 'type') as AgendaDirectorType

  return {
    id: readNumber(item, 'id'),
    userId: readNumber(item, 'user_id'),
    areaId: readNumber(item, 'area_id'),
    type: DIRECTOR_TYPES.has(type) ? type : 'school_director',
    typeLabel: readString(item, 'type_label'),
    isCoordinator: readBoolean(item, 'is_coordinator'),
    user: mapUser(item.user),
    area: mapArea(item.area),
  }
}

function mapContext (raw: unknown): AgendaContext {
  const item = asRecord(raw)

  return {
    director: item.director ? mapDirector(item.director) : null,
    canCreate: readBoolean(item, 'can_create'),
    canManageAll: readBoolean(item, 'can_manage_all'),
    canManageSpaces: readBoolean(item, 'can_manage_spaces'),
    canManageDirectors: readBoolean(item, 'can_manage_directors'),
    canExport: readBoolean(item, 'can_export'),
    outlookSyncEnabled: readBoolean(item, 'outlook_sync_enabled'),
    reminderOptions: Array.isArray(item.reminder_options)
      ? item.reminder_options.filter((value): value is number => typeof value === 'number')
      : [],
    maxRecurrenceDays: readNumber(item, 'max_recurrence_days', 366),
  }
}

/** Keys left out stay out of the body (partial PATCH); an explicit null is sent to clear. */
function toApiPayload<T extends object> (payload: T, keys: Record<keyof T, string>): ApiRecord {
  const body: ApiRecord = {}

  for (const [key, apiKey] of Object.entries(keys) as [keyof T, string][]) {
    if (payload[key] !== undefined) {
      body[apiKey] = payload[key]
    }
  }

  return body
}

const EVENT_KEYS: Record<keyof AgendaEventPayload, string> = {
  title: 'title',
  areaId: 'area_id',
  spaceId: 'space_id',
  location: 'location',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  allDay: 'all_day',
  reminderMinutes: 'reminder_minutes',
  recurrence: 'recurrence',
  recurrenceInterval: 'recurrence_interval',
  recurrenceUntil: 'recurrence_until',
  notes: 'notes',
  url: 'url',
  inviteeUserIds: 'invitee_user_ids',
  inviteeEmails: 'invitee_emails',
}

const SPACE_KEYS: Record<keyof AgendaSpacePayload, string> = {
  campusId: 'campus_id',
  name: 'name',
  capacity: 'capacity',
  isActive: 'is_active',
}

const DIRECTOR_KEYS: Record<keyof AgendaDirectorPayload, string> = {
  userId: 'user_id',
  areaId: 'area_id',
  type: 'type',
  isCoordinator: 'is_coordinator',
}

function filterParams (filters: AgendaFilters): ApiRecord {
  return {
    start: filters.start,
    end: filters.end,
    area_ids: filters.areaIds?.length ? filters.areaIds : undefined,
    space_id: filters.spaceId ?? undefined,
    campus_id: filters.campusId ?? undefined,
    search: filters.search?.trim() || undefined,
  }
}

export class HttpAgendaAdapter implements AgendaPort {
  async getContext (): Promise<AgendaContext> {
    return mapContext(unwrapData(await httpClient.get<unknown>(`${BASE}/context`)))
  }

  async listOccurrences (filters: AgendaFilters): Promise<AgendaOccurrence[]> {
    const response = await httpClient.get<unknown>(`${BASE}/events`, { params: filterParams(filters) })
    return unwrapList(response).map(item => mapOccurrence(item))
  }

  async getEvent (eventId: number): Promise<AgendaEvent> {
    return mapEvent(unwrapData(await httpClient.get<unknown>(`${BASE}/events/${eventId}`)))
  }

  async createEvent (payload: AgendaEventPayload): Promise<AgendaEvent> {
    return mapEvent(unwrapData(await httpClient.post<unknown>(`${BASE}/events`, toApiPayload(payload, EVENT_KEYS))))
  }

  async updateEvent (eventId: number, payload: AgendaEventPayload): Promise<AgendaEvent> {
    return mapEvent(unwrapData(await httpClient.patch<unknown>(`${BASE}/events/${eventId}`, toApiPayload(payload, EVENT_KEYS))))
  }

  async deleteEvent (eventId: number): Promise<void> {
    await httpClient.delete<void>(`${BASE}/events/${eventId}`)
  }

  // Blobs go through the raw axios instance: `httpClient` unwraps JSON bodies,
  // and the interceptor still adds the Bearer token a plain <a href> would not carry.
  async downloadIcs (eventId: number): Promise<Blob> {
    const response = await http.get(`${BASE}/events/${eventId}/ics`, { responseType: 'blob' })
    return response.data as Blob
  }

  async uploadAttachments (eventId: number, files: File[]): Promise<AgendaAttachment[]> {
    const form = new FormData()
    for (const file of files) {
      form.append('attachments[]', file)
    }

    const response = await httpClient.post<unknown>(`${BASE}/events/${eventId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapList(response).map(item => mapAttachment(item))
  }

  async downloadAttachment (attachmentId: number): Promise<Blob> {
    const response = await http.get(`${BASE}/attachments/${attachmentId}/download`, { responseType: 'blob' })
    return response.data as Blob
  }

  async deleteAttachment (attachmentId: number): Promise<void> {
    await httpClient.delete<void>(`${BASE}/attachments/${attachmentId}`)
  }

  async exportAgenda (filters: AgendaFilters, format: AgendaExportFormat): Promise<Blob> {
    const response = await http.get(`${BASE}/export`, {
      params: { ...filterParams(filters), format },
      responseType: 'blob',
    })
    return response.data as Blob
  }

  async searchUsers (search: string): Promise<AgendaUserSummary[]> {
    const response = await httpClient.get<unknown>(`${BASE}/users`, { params: { search: search.trim() || undefined } })
    return unwrapList(response).map(item => mapUser(item)).filter((user): user is AgendaUserSummary => user !== null)
  }

  async listSpaces (options: { includeInactive?: boolean } = {}): Promise<AgendaSpace[]> {
    const response = await httpClient.get<unknown>(`${BASE}/spaces`, {
      params: { include_inactive: options.includeInactive ? 1 : undefined },
    })
    return unwrapList(response).map(item => mapSpace(item))
  }

  async createSpace (payload: AgendaSpacePayload): Promise<AgendaSpace> {
    return mapSpace(unwrapData(await httpClient.post<unknown>(`${BASE}/spaces`, toApiPayload(payload, SPACE_KEYS))))
  }

  async updateSpace (spaceId: number, payload: AgendaSpacePayload): Promise<AgendaSpace> {
    return mapSpace(unwrapData(await httpClient.patch<unknown>(`${BASE}/spaces/${spaceId}`, toApiPayload(payload, SPACE_KEYS))))
  }

  async deleteSpace (spaceId: number): Promise<void> {
    await httpClient.delete<void>(`${BASE}/spaces/${spaceId}`)
  }

  async listDirectors (): Promise<AgendaDirector[]> {
    return unwrapList(await httpClient.get<unknown>(`${BASE}/directors`)).map(item => mapDirector(item))
  }

  async createDirector (payload: AgendaDirectorPayload): Promise<AgendaDirector> {
    return mapDirector(unwrapData(await httpClient.post<unknown>(`${BASE}/directors`, toApiPayload(payload, DIRECTOR_KEYS))))
  }

  async updateDirector (directorId: number, payload: AgendaDirectorPayload): Promise<AgendaDirector> {
    return mapDirector(unwrapData(await httpClient.patch<unknown>(`${BASE}/directors/${directorId}`, toApiPayload(payload, DIRECTOR_KEYS))))
  }

  async deleteDirector (directorId: number): Promise<void> {
    await httpClient.delete<void>(`${BASE}/directors/${directorId}`)
  }
}

export const agendaAdapter = new HttpAgendaAdapter()
