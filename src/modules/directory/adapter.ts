import type {
  DirectoryArea,
  DirectoryCampus,
  DirectoryEntry,
  DirectoryEntryPayload,
  DirectoryPagination,
  DirectoryPort,
  DirectoryQuery,
  PaginatedDirectoryEntries,
} from '@/modules/directory/port'
import { httpClient } from '@/services/http'

type ApiRecord = Record<string, unknown>

const BASE = '/api/v1/directory'

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

// Responses arrive either bare or wrapped in Laravel's `data` envelope.
function unwrapData (response: unknown): unknown {
  const record = asRecord(response)
  return 'data' in record ? record.data : response
}

function unwrapList (response: unknown): unknown[] {
  const data = unwrapData(response)
  return Array.isArray(data) ? data : []
}

function mapCampus (raw: unknown): DirectoryCampus {
  const item = asRecord(raw)

  return {
    id: readNumber(item, 'id'),
    code: readString(item, 'code'),
    name: readString(item, 'name'),
    entriesCount: readNumber(item, 'directory_entries_count'),
  }
}

function mapArea (raw: unknown): DirectoryArea {
  const item = asRecord(raw)

  return {
    id: readNumber(item, 'id'),
    name: readString(item, 'name'),
    entriesCount: readNumber(item, 'directory_entries_count'),
  }
}

function mapEntry (raw: unknown): DirectoryEntry {
  const item = asRecord(raw)
  const campus = item.campus ? asRecord(item.campus) : null
  const area = item.area ? asRecord(item.area) : null

  return {
    id: readNumber(item, 'id'),
    campusId: readNumber(item, 'campus_id'),
    areaId: readNullableNumber(item, 'area_id'),
    extension: readString(item, 'extension'),
    position: readString(item, 'position'),
    name: readNullableString(item, 'name'),
    email: readNullableString(item, 'email'),
    secondaryEmail: readNullableString(item, 'secondary_email'),
    sortOrder: readNullableNumber(item, 'sort_order'),
    campus: campus
      ? { id: readNumber(campus, 'id'), code: readString(campus, 'code'), name: readString(campus, 'name') }
      : null,
    area: area ? { id: readNumber(area, 'id'), name: readString(area, 'name') } : null,
  }
}

// Laravel's resource collections nest pagination under `meta`.
function mapPagination (response: unknown, itemCount: number, page: number, perPage: number): DirectoryPagination {
  const root = asRecord(response)
  const nested = asRecord(root.meta)
  const source = 'current_page' in nested || 'total' in nested ? nested : root

  const resolvedPerPage = readNumber(source, 'per_page', perPage)
  const total = readNumber(source, 'total', itemCount)

  return {
    currentPage: readNumber(source, 'current_page', page),
    lastPage: readNumber(source, 'last_page', Math.max(1, Math.ceil(total / Math.max(1, resolvedPerPage)))),
    perPage: resolvedPerPage,
    total,
  }
}

const PAYLOAD_KEYS: Record<keyof DirectoryEntryPayload, string> = {
  campusId: 'campus_id',
  areaId: 'area_id',
  extension: 'extension',
  position: 'position',
  name: 'name',
  email: 'email',
  secondaryEmail: 'secondary_email',
  sortOrder: 'sort_order',
}

// Keys left out of the payload stay out of the body, which is what makes a
// PATCH partial; an explicit null is sent as-is to clear the field.
function toApiPayload (payload: DirectoryEntryPayload): ApiRecord {
  const body: ApiRecord = {}

  for (const [key, apiKey] of Object.entries(PAYLOAD_KEYS) as [keyof DirectoryEntryPayload, string][]) {
    if (payload[key] !== undefined) {
      body[apiKey] = payload[key]
    }
  }

  return body
}

export class HttpDirectoryAdapter implements DirectoryPort {
  async listCampuses (): Promise<DirectoryCampus[]> {
    const response = await httpClient.get<unknown>('/api/v1/campuses')
    return unwrapList(response).map(entry => mapCampus(entry))
  }

  async listAreas (campusId?: number | null): Promise<DirectoryArea[]> {
    const response = await httpClient.get<unknown>(`${BASE}/areas`, {
      params: campusId ? { campus_id: campusId } : undefined,
    })
    return unwrapList(response).map(entry => mapArea(entry))
  }

  async listEntries (query: DirectoryQuery = {}): Promise<PaginatedDirectoryEntries> {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 50
    const search = query.search?.trim()

    const response = await httpClient.get<unknown>(BASE, {
      params: {
        search: search || undefined,
        campus_id: query.campusId ?? undefined,
        area_id: query.areaId ?? undefined,
        page,
        per_page: perPage,
      },
    })
    const items = unwrapList(response).map(entry => mapEntry(entry))

    return { items, meta: mapPagination(response, items.length, page, perPage) }
  }

  async createEntry (payload: DirectoryEntryPayload): Promise<DirectoryEntry> {
    const response = await httpClient.post<unknown>(BASE, toApiPayload(payload))
    return mapEntry(unwrapData(response))
  }

  async updateEntry (entryId: number, payload: DirectoryEntryPayload): Promise<DirectoryEntry> {
    const response = await httpClient.patch<unknown>(`${BASE}/${entryId}`, toApiPayload(payload))
    return mapEntry(unwrapData(response))
  }

  async deleteEntry (entryId: number): Promise<void> {
    await httpClient.delete<void>(`${BASE}/${entryId}`)
  }
}

export const directoryAdapter = new HttpDirectoryAdapter()
