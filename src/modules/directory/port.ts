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

export interface DirectoryPort {
  listCampuses: () => Promise<DirectoryCampus[]>

  /** Only the areas that have entries, optionally scoped to one campus. */
  listAreas: (campusId?: number | null) => Promise<DirectoryArea[]>

  /** Ordered by campus and then as in the source Excel, so grouping by area falls out directly. */
  listEntries: (query?: DirectoryQuery) => Promise<PaginatedDirectoryEntries>
}
