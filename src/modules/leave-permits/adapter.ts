import type {
  LeavePermit,
  LeavePermitEmployeeRef,
  LeavePermitKind,
  LeavePermitPayload,
  LeavePermitShift,
  LeavePermitsPagination,
  LeavePermitsPort,
  LeavePermitsQuery,
  LeavePermitStatusEntry,
  PaginatedLeavePermits,
} from '@/modules/leave-permits/port'
import type { HttpClient } from '@/services/http'
import { http, httpClient } from '@/services/http'

type ApiRecord = Record<string, unknown>

export const DEFAULT_PER_PAGE = 15

const KINDS = new Set<string>(['economic', 'non_economic'])
const SHIFTS = new Set<string>(['afternoon', 'complete', 'morning'])
const EMPTY_FILTER_VALUES = new Set<unknown>([undefined, null, ''])

function asRecord (value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {}
}

function readString (source: ApiRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return ''
}

function readId (source: ApiRecord, ...keys: string[]): number | string | null {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' || typeof value === 'string') {
      return value
    }
  }
  return null
}

function toNumber (value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback
}

function mapEmployee (raw: unknown): LeavePermitEmployeeRef | null {
  const item = asRecord(raw)
  const id = readId(item, 'id')

  if (id === null) {
    return null
  }

  const name = readString(item, 'full_name', 'name')
    || `${readString(item, 'first_name')} ${readString(item, 'last_name')}`.trim()

  return {
    employeeNumber: readString(item, 'employee_number'),
    id,
    name: name || 'Sin nombre',
  }
}

function mapStatusEntry (raw: unknown): LeavePermitStatusEntry | null {
  if (typeof raw === 'string') {
    return raw.trim() ? { createdAt: '', notes: '', status: raw.toLowerCase() } : null
  }

  const item = asRecord(raw)
  const status = readString(item, 'status', 'name', 'value').toLowerCase()

  return status ? { createdAt: readString(item, 'created_at'), notes: readString(item, 'notes'), status } : null
}

// The resource may report signatures either as a progress object or as a list;
// either way a permit with any signature is frozen.
function countSignedRoles (item: ApiRecord): number {
  const progress = asRecord(item.signature_progress)
  const signed = progress.signed_roles

  if (Array.isArray(signed)) {
    return signed.length
  }

  return Array.isArray(item.signatures) ? item.signatures.length : 0
}

function mapPermit (raw: unknown): LeavePermit {
  const item = asRecord(raw)
  const statuses = Array.isArray(item.statuses)
    ? item.statuses.map(entry => mapStatusEntry(entry)).filter((entry): entry is LeavePermitStatusEntry => entry !== null)
    : []
  const kind = readString(item, 'kind')
  const shift = readString(item, 'shift')

  return {
    createdAt: readString(item, 'created_at') || null,
    dayCount: toNumber(item.day_count, 0),
    employee: mapEmployee(item.employee),
    employeeId: readId(item, 'employee_id') ?? readId(asRecord(item.employee), 'id'),
    endsOn: readString(item, 'ends_on'),
    id: readId(item, 'id') ?? '',
    kind: KINDS.has(kind) ? kind as LeavePermitKind : 'economic',
    latestStatus: (readString(item, 'latest_status', 'status') || statuses.at(-1)?.status || 'pending').toLowerCase(),
    requestDate: readString(item, 'request_date'),
    shift: SHIFTS.has(shift) ? shift as LeavePermitShift : 'complete',
    signedRoleCount: countSignedRoles(item),
    startsOn: readString(item, 'starts_on'),
    statuses,
  }
}

function unwrapData (response: unknown): unknown {
  const record = asRecord(response)
  return 'data' in record ? record.data : response
}

// Laravel exposes pagination either at the root or nested under `meta`.
function mapPagination (response: unknown, itemCount: number, page: number, perPage: number): LeavePermitsPagination {
  const root = asRecord(response)
  const nested = asRecord(root.meta)
  const source = 'current_page' in nested || 'total' in nested ? nested : root

  const resolvedPerPage = toNumber(source.per_page, perPage)
  const total = toNumber(source.total, itemCount)

  return {
    currentPage: toNumber(source.current_page, page),
    lastPage: toNumber(source.last_page, Math.max(1, Math.ceil(total / Math.max(1, resolvedPerPage)))),
    perPage: resolvedPerPage,
    total,
  }
}

function buildListParams (query: LeavePermitsQuery): Record<string, string> {
  const page = query.page ?? 1
  const perPage = query.perPage ?? DEFAULT_PER_PAGE

  const params: Record<string, string> = {
    page: String(page),
    per_page: String(perPage),
  }

  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (EMPTY_FILTER_VALUES.has(value)) {
      continue
    }
    params[key] = String(value).trim()
  }

  return params
}

export class HttpLeavePermitsAdapter implements LeavePermitsPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: LeavePermitPayload): Promise<LeavePermit> {
    const response = await this.client.post<unknown, LeavePermitPayload>('/api/v1/leave-permits', payload)
    return mapPermit(unwrapData(response))
  }

  // Goes through the raw axios instance: the interceptor adds the token, which
  // a plain <a href> download would not carry.
  async downloadPdf (permitId: number | string): Promise<Blob> {
    const response = await http.get(`/api/v1/leave-permits/${permitId}/pdf`, {
      responseType: 'blob',
    })
    return new Blob([response.data], { type: 'application/pdf' })
  }

  async getById (permitId: number | string): Promise<LeavePermit> {
    const response = await this.client.get<unknown>(`/api/v1/leave-permits/${permitId}`)
    return mapPermit(unwrapData(response))
  }

  async list (query: LeavePermitsQuery = {}): Promise<PaginatedLeavePermits> {
    const response = await this.client.get<unknown>('/api/v1/leave-permits', {
      params: buildListParams(query),
    })
    const data = unwrapData(response)
    const items = Array.isArray(data) ? data.map(entry => mapPermit(entry)) : []

    return {
      items,
      meta: mapPagination(response, items.length, query.page ?? 1, query.perPage ?? DEFAULT_PER_PAGE),
    }
  }

  async remove (permitId: number | string): Promise<void> {
    await this.client.delete<unknown>(`/api/v1/leave-permits/${permitId}`)
  }

  async update (permitId: number | string, payload: Partial<LeavePermitPayload>): Promise<LeavePermit> {
    const response = await this.client.patch<unknown, Partial<LeavePermitPayload>>(
      `/api/v1/leave-permits/${permitId}`,
      payload,
    )
    return mapPermit(unwrapData(response))
  }
}

export const leavePermitsAdapter = new HttpLeavePermitsAdapter(httpClient)
