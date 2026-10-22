export type AgendaRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type AgendaDirectorType = 'rector' | 'general_director' | 'school_director'

export interface AgendaAreaRef {
  id: number
  name: string
  type: string | null
}

export interface AgendaCampusRef {
  id: number
  code: string
  name: string
}

export interface AgendaUserSummary {
  id: number
  name: string
  email: string
  avatar: string | null
}

export interface AgendaSpace {
  id: number
  campusId: number | null
  name: string
  capacity: number | null
  isActive: boolean
  eventsCount: number | null
  campus: AgendaCampusRef | null
}

export interface AgendaInvitee {
  id: number
  userId: number | null
  email: string
  name: string | null
  notifiedAt: string | null
  /** 'outlook' when Outlook sent the native invitation, 'mail' for our own e-mail. */
  notifiedVia: 'outlook' | 'mail' | null
  notifiedViaLabel: string | null
}

export interface AgendaAttachment {
  id: number
  eventId: number
  originalName: string
  mimeType: string | null
  size: number
  createdAt: string | null
}

export interface AgendaEvent {
  id: number
  title: string
  areaId: number
  spaceId: number | null
  location: string | null
  /** The catalogue space (with its campus) or the free-text place. */
  locationLabel: string
  /** ISO 8601 with offset; all-day events end at 00:00 of the day after (exclusive). */
  startsAt: string
  endsAt: string
  allDay: boolean
  reminderMinutes: number | null
  recurrence: AgendaRecurrence
  recurrenceLabel: string
  recurrenceInterval: number
  recurrenceUntil: string | null
  notes: string | null
  url: string | null
  outlook: { synced: boolean, syncedAt: string | null, error: string | null }
  /** Computed by the API: own area, or the coordinator / administrator. */
  canManage: boolean
  area: AgendaAreaRef | null
  space: AgendaSpace | null
  creator: AgendaUserSummary | null
  invitees: AgendaInvitee[]
  attachments: AgendaAttachment[]
}

/** One concrete date of an event (a recurring event has many). */
export interface AgendaOccurrence {
  id: number
  eventId: number
  startsAt: string
  endsAt: string
  event: AgendaEvent
}

export interface AgendaDirector {
  id: number
  userId: number
  areaId: number
  type: AgendaDirectorType
  typeLabel: string
  isCoordinator: boolean
  user: AgendaUserSummary | null
  area: AgendaAreaRef | null
}

export interface AgendaContext {
  director: AgendaDirector | null
  canCreate: boolean
  canManageAll: boolean
  canManageSpaces: boolean
  canManageDirectors: boolean
  canExport: boolean
  outlookSyncEnabled: boolean
  reminderOptions: number[]
  maxRecurrenceDays: number
}

export interface AgendaFilters {
  /** Inclusive start and exclusive end, as local `YYYY-MM-DD`. */
  start: string
  end: string
  areaIds?: number[]
  spaceId?: number | null
  campusId?: number | null
  search?: string
}

/** Dates are local `YYYY-MM-DD HH:mm`; null clears a field on update. */
export interface AgendaEventPayload {
  title?: string
  areaId?: number | null
  spaceId?: number | null
  location?: string | null
  startsAt?: string
  endsAt?: string
  allDay?: boolean
  reminderMinutes?: number | null
  recurrence?: AgendaRecurrence
  recurrenceInterval?: number
  recurrenceUntil?: string | null
  notes?: string | null
  url?: string | null
  inviteeUserIds?: number[]
  inviteeEmails?: string[]
}

export interface AgendaSpacePayload {
  campusId?: number | null
  name?: string
  capacity?: number | null
  isActive?: boolean
}

export interface AgendaDirectorPayload {
  userId?: number
  /** Someone who has never signed in: their Microsoft 365 account (a user is created for them). */
  microsoftUser?: { id: string, name: string, email: string }
  areaId?: number
  type?: AgendaDirectorType
  isCoordinator?: boolean
}

/** A Microsoft 365 staff account (students and disabled accounts are left out by the API). */
export interface AgendaMicrosoftAccount {
  microsoftId: string
  name: string
  email: string
  jobTitle: string | null
  department: string | null
  /** Set when the account already has a user in the platform. */
  userId: number | null
  isDirector: boolean
}

export type AgendaImportStatus = 'registered' | 'found' | 'ambiguous' | 'not_found' | 'graph_unavailable'

/** One director found in the phone directory, with the account proposed for them. */
export interface AgendaImportRow {
  directoryEntryId: number
  directoryName: string
  personName: string
  position: string
  directoryEmail: string | null
  campus: string | null
  area: { id: number, name: string }
  type: AgendaDirectorType | null
  typeLabel: string | null
  status: AgendaImportStatus
  account: AgendaMicrosoftAccount | null
  alternatives: AgendaMicrosoftAccount[]
  registeredDirector: { id: number, user: { id: number, name: string, email: string }, area: { id: number, name: string } } | null
  warnings: string[]
}

export interface AgendaImportPreview {
  /** Why Microsoft 365 could not be searched; the rows then need the e-mail typed in. */
  graphError: string | null
  rows: AgendaImportRow[]
}

export interface AgendaImportSelection {
  directoryEntryId: number
  areaId: number
  type: AgendaDirectorType
  email: string
  name: string
  microsoftId: string | null
}

export interface AgendaImportResult {
  created: number
  updated: number
  errors: { index: number, name: string, message: string }[]
}

export type AgendaExportFormat = 'pdf' | 'xlsx'

export interface AgendaPort {
  getContext: () => Promise<AgendaContext>

  /** Occurrences overlapping the range, ordered by start. */
  listOccurrences: (filters: AgendaFilters) => Promise<AgendaOccurrence[]>
  getEvent: (eventId: number) => Promise<AgendaEvent>
  /** The API blocks (422 on `space_id`) a catalogue space already taken at that time. */
  createEvent: (payload: AgendaEventPayload) => Promise<AgendaEvent>
  updateEvent: (eventId: number, payload: AgendaEventPayload) => Promise<AgendaEvent>
  /** Deletes the whole series. */
  deleteEvent: (eventId: number) => Promise<void>
  downloadIcs: (eventId: number) => Promise<Blob>

  uploadAttachments: (eventId: number, files: File[]) => Promise<AgendaAttachment[]>
  downloadAttachment: (attachmentId: number) => Promise<Blob>
  deleteAttachment: (attachmentId: number) => Promise<void>

  exportAgenda: (filters: AgendaFilters, format: AgendaExportFormat) => Promise<Blob>

  /** Staff only, at most 20, for the invitee and director pickers. */
  searchUsers: (search: string) => Promise<AgendaUserSummary[]>

  listSpaces: (options?: { includeInactive?: boolean }) => Promise<AgendaSpace[]>
  createSpace: (payload: AgendaSpacePayload) => Promise<AgendaSpace>
  updateSpace: (spaceId: number, payload: AgendaSpacePayload) => Promise<AgendaSpace>
  /** 409 when the space has events: deactivate it instead. */
  deleteSpace: (spaceId: number) => Promise<void>

  listDirectors: () => Promise<AgendaDirector[]>
  createDirector: (payload: AgendaDirectorPayload) => Promise<AgendaDirector>
  updateDirector: (directorId: number, payload: AgendaDirectorPayload) => Promise<AgendaDirector>
  deleteDirector: (directorId: number) => Promise<void>

  /** Directors found in the phone directory, each with the Microsoft 365 account proposed for them. */
  previewDirectorImport: () => Promise<AgendaImportPreview>
  /** Registers the confirmed rows; a failing row does not stop the others. */
  importDirectors: (rows: AgendaImportSelection[]) => Promise<AgendaImportResult>
  searchMicrosoftUsers: (search: string) => Promise<AgendaMicrosoftAccount[]>
}
