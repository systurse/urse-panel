import type {
  PaginatedPrintingFiles,
  PrintingCampus,
  PrintingFile,
  PrintingFilesPagination,
  PrintingFilesQuery,
  PrintingPort,
  PrintingStream,
  PrintingStreamMode,
  PrintingUploadedFile,
  PrintingUploadResult,
} from '@/modules/printing/port'
import { http, httpClient, publicHttpClient } from '@/services/http'

type ApiRecord = Record<string, unknown>

const BASE = '/api/v1/printing'
const PUBLIC_BASE = '/api/v1/public/printing'

function asRecord (value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {}
}

function readString (source: ApiRecord, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

function readNullableString (source: ApiRecord, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readNumber (source: ApiRecord, key: string, fallback = 0): number {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

// Responses arrive either bare or wrapped in Laravel's `data` envelope.
function unwrapData (response: unknown): unknown {
  const record = asRecord(response)
  return 'data' in record ? record.data : response
}

function mapCampus (raw: unknown): PrintingCampus {
  const item = asRecord(raw)
  return { key: readString(item, 'key'), label: readString(item, 'label') }
}

function mapFile (raw: unknown): PrintingFile {
  const item = asRecord(raw)

  return {
    id: readString(item, 'id'),
    batchCode: readString(item, 'batch_code'),
    originalName: readString(item, 'original_name'),
    extension: readString(item, 'extension'),
    mimeType: readString(item, 'mime_type'),
    sizeBytes: readNumber(item, 'size_bytes'),
    campus: readString(item, 'campus'),
    campusLabel: readString(item, 'campus_label'),
    canPreviewInline: item.can_preview_inline === true,
    uploadedAt: readString(item, 'uploaded_at'),
    expiresAt: readString(item, 'expires_at'),
    remainingSeconds: readNumber(item, 'remaining_seconds'),
    printedAt: readNullableString(item, 'printed_at'),
    printedBy: readNullableString(item, 'printed_by'),
  }
}

function mapUploadedFile (raw: unknown): PrintingUploadedFile {
  const item = asRecord(raw)
  return { originalName: readString(item, 'original_name'), sizeBytes: readNumber(item, 'size_bytes') }
}

function mapUploadResult (raw: unknown): PrintingUploadResult {
  const item = asRecord(raw)

  return {
    batchCode: readString(item, 'batch_code'),
    campus: readString(item, 'campus'),
    expiresInMinutes: readNumber(item, 'expires_in_minutes'),
    files: Array.isArray(item.files) ? item.files.map(entry => mapUploadedFile(entry)) : [],
  }
}

// Laravel exposes pagination either at the root or nested under `meta`.
function mapPagination (response: unknown, itemCount: number, page: number, perPage: number): PrintingFilesPagination {
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

function readCampuses (raw: unknown): string[] {
  const item = asRecord(raw)
  return Array.isArray(item.campuses) ? item.campuses.filter((c): c is string => typeof c === 'string') : []
}

export class HttpPrintingAdapter implements PrintingPort {
  async uploadFiles (files: File[]): Promise<PrintingUploadResult> {
    const form = new FormData()

    for (const file of files) {
      form.append('files[]', file)
    }

    const response = await publicHttpClient.post<unknown>(`${PUBLIC_BASE}/uploads`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return mapUploadResult(response)
  }

  async listCampuses (): Promise<PrintingCampus[]> {
    const response = await httpClient.get<unknown>(`${BASE}/campuses`)
    const data = unwrapData(response)
    return Array.isArray(data) ? data.map(entry => mapCampus(entry)) : []
  }

  async listFiles (query: PrintingFilesQuery = {}): Promise<PaginatedPrintingFiles> {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 30

    const response = await httpClient.get<unknown>(`${BASE}/files`, {
      params: { page, per_page: perPage },
    })
    const data = unwrapData(response)
    const items = Array.isArray(data) ? data.map(entry => mapFile(entry)) : []

    return { items, meta: mapPagination(response, items.length, page, perPage) }
  }

  // Goes through the raw axios instance: the interceptor adds the token, which
  // an <img>/<iframe> src or a plain <a href> would not carry.
  async getStream (fileId: string, mode?: PrintingStreamMode): Promise<PrintingStream> {
    const response = await http.get(`${BASE}/files/${fileId}/stream`, {
      params: mode === 'download' ? { mode: 'download' } : undefined,
      responseType: 'blob',
    })

    return {
      blob: response.data as Blob,
      contentType: typeof response.headers?.['content-type'] === 'string'
        ? response.headers['content-type']
        : 'application/octet-stream',
    }
  }

  async markPrinted (fileId: string): Promise<PrintingFile> {
    const response = await httpClient.post<unknown>(`${BASE}/files/${fileId}/print`)
    return mapFile(unwrapData(response))
  }

  async remove (fileId: string): Promise<void> {
    await httpClient.delete<void>(`${BASE}/files/${fileId}`)
  }

  async getOperatorCampuses (userId: number | string): Promise<string[]> {
    const response = await httpClient.get<unknown>(`${BASE}/operators/${userId}/campuses`)
    return readCampuses(response)
  }

  async setOperatorCampuses (userId: number | string, campuses: string[]): Promise<string[]> {
    const response = await httpClient.put<unknown, { campuses: string[] }>(
      `${BASE}/operators/${userId}/campuses`,
      { campuses },
    )
    return readCampuses(response)
  }
}

export const printingAdapter = new HttpPrintingAdapter()
