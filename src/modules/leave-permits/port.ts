/** The two checkboxes of the F011A form. */
export type LeavePermitKind = 'economic' | 'non_economic'

export type LeavePermitShift = 'afternoon' | 'complete' | 'morning'

export type LeavePermitStatus = 'authorized' | 'pending' | 'refused'

export interface LeavePermitEmployeeRef {
  employeeNumber: string
  id: number | string
  name: string
}

export interface LeavePermitStatusEntry {
  createdAt: string
  notes: string
  status: string
}

export interface LeavePermit {
  createdAt: string | null
  /** Derived from the range by the backend; never computed here. */
  dayCount: number
  employee: LeavePermitEmployeeRef | null
  employeeId: number | string | null
  endsOn: string
  id: number | string
  kind: LeavePermitKind
  latestStatus: string
  requestDate: string
  /** Number of roles that already signed; a signed permit is frozen. */
  signedRoleCount: number
  shift: LeavePermitShift
  startsOn: string
  statuses: LeavePermitStatusEntry[]
}

export interface LeavePermitPayload {
  employee_id: number | string
  ends_on: string
  kind: LeavePermitKind
  request_date: string
  shift: LeavePermitShift
  starts_on: string
}

/** Only accepted from callers holding `sps.permit.filter`. */
export interface LeavePermitFilters {
  kind?: LeavePermitKind | null
  search?: string
  starts_on_from?: string
  starts_on_to?: string
  status?: string
}

export interface LeavePermitsQuery {
  filters?: LeavePermitFilters
  page?: number
  perPage?: number
}

export interface LeavePermitsPagination {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface PaginatedLeavePermits {
  items: LeavePermit[]
  meta: LeavePermitsPagination
}

export interface LeavePermitsPort {
  create: (payload: LeavePermitPayload) => Promise<LeavePermit>
  /** Resolves to the PDF bytes; the request carries the token, a plain link would not. */
  downloadPdf: (permitId: number | string) => Promise<Blob>
  getById: (permitId: number | string) => Promise<LeavePermit>
  list: (query?: LeavePermitsQuery) => Promise<PaginatedLeavePermits>
  remove: (permitId: number | string) => Promise<void>
  update: (permitId: number | string, payload: Partial<LeavePermitPayload>) => Promise<LeavePermit>
}
