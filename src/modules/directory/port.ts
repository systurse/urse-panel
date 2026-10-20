export interface DirectoryCampus {
  id: number
  code: string
  name: string
  entriesCount: number
}

export interface DirectoryArea {
  id: number
  name: string
  entriesCount: number
}

export interface DirectoryEntry {
  id: number
  campusId: number
  areaId: number | null
  extension: string
  position: string
  name: string | null
  email: string | null
  secondaryEmail: string | null
  sortOrder: number | null
  campus: { id: number, code: string, name: string } | null
  /** Null for the few lines that sit outside every area header in the Excel (Caja, CIDURSE…). */
  area: { id: number, name: string } | null
}

export interface DirectoryQuery {
  search?: string
  campusId?: number | null
  areaId?: number | null
  page?: number
  perPage?: number
}

export interface DirectoryPagination {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface PaginatedDirectoryEntries {
  items: DirectoryEntry[]
  meta: DirectoryPagination
}

/** Body for create and partial update; null clears a field (e.g. `areaId: null` drops the area). */
export interface DirectoryEntryPayload {
  campusId?: number
  areaId?: number | null
  extension?: string | null
  position?: string | null
  name?: string | null
  email?: string | null
  secondaryEmail?: string | null
  sortOrder?: number | null
}

export interface DirectoryPort {
  listCampuses: () => Promise<DirectoryCampus[]>

  /** Only the areas that have entries, optionally scoped to one campus. */
  listAreas: (campusId?: number | null) => Promise<DirectoryArea[]>

  /** Ordered by campus and then as in the source Excel, so grouping by area falls out directly. */
  listEntries: (query?: DirectoryQuery) => Promise<PaginatedDirectoryEntries>

  /** Needs `directory.create`; the API asks for at least an extension, position or name. */
  createEntry: (payload: DirectoryEntryPayload) => Promise<DirectoryEntry>

  /** Needs `directory.update`; only the fields present in the payload change. */
  updateEntry: (entryId: number, payload: DirectoryEntryPayload) => Promise<DirectoryEntry>

  /** Needs `directory.delete`; there is no undo. */
  deleteEntry: (entryId: number) => Promise<void>

  /** The .xlsx with one sheet per campus; scoped to one when `campusId` is given. */
  exportExcel: (campusId?: number | null) => Promise<Blob>
}
