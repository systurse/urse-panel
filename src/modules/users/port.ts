export interface UserRoleRef {
  id: number | string
  name: string
}

export interface User {
  active: boolean
  createdAt: string | null
  email: string
  id: number | string
  initials: string
  microsoftId: string | null
  name: string
  role: string
  roles: UserRoleRef[]
  verified: boolean
  verifiedAt: string | null
}

export interface UserPayload {
  active?: boolean
  email: string
  name: string
  password?: string
}

// Keys mirror the `AllowedFilter` list registered on the backend's Spatie query
// builder for `/api/v1/users`. Spatie answers 400 for anything not registered
// there, so this shape must not grow ahead of the API.
export interface UserFilters {
  email?: string
  microsoft_id?: string
  name?: string
  permission?: string
  role?: string
  search?: string
  verified?: boolean | null
}

export type UserSortField = 'created_at' | 'email' | 'email_verified_at' | 'id' | 'name' | 'updated_at'

export interface UsersQuery {
  filters?: UserFilters
  page?: number
  perPage?: number
  /** Spatie `sort` value, e.g. `name` or `-created_at`. */
  sort?: string | null
}

export interface PaginationMeta {
  currentPage: number
  from: number | null
  lastPage: number
  perPage: number
  to: number | null
  total: number
}

export interface PaginatedUsers {
  items: User[]
  meta: PaginationMeta
}

export interface UsersPort {
  create: (payload: UserPayload) => Promise<User>
  getById: (userId: number | string) => Promise<User>
  list: (query?: UsersQuery) => Promise<PaginatedUsers>
  remove: (userId: number | string) => Promise<void>
  update: (userId: number | string, payload: Partial<UserPayload>) => Promise<User>
}
