import type {
  PaginatedUsers,
  PaginationMeta,
  User,
  UserFilters,
  UserPayload,
  UserRoleRef,
  UsersPort,
  UsersQuery,
} from '@/modules/users/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiUser = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

export const DEFAULT_PER_PAGE = 10

function getUserName (user: ApiUser) {
  const name = user.name ?? user.full_name ?? user.username

  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  if (typeof user.email === 'string') {
    return user.email
  }

  return 'Sin nombre'
}

function getUserRole (user: ApiUser) {
  const role = user.role

  if (typeof role === 'string' && role.trim().length > 0) {
    return role
  }

  if (role && typeof role === 'object' && 'name' in role && typeof role.name === 'string') {
    return role.name
  }

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const [firstRole] = user.roles

    if (typeof firstRole === 'string' && firstRole.trim().length > 0) {
      return firstRole
    }

    if (firstRole && typeof firstRole === 'object' && 'name' in firstRole && typeof firstRole.name === 'string') {
      return firstRole.name
    }
  }

  return 'Sin rol'
}

function normalizeRoleRef (entry: unknown): UserRoleRef | null {
  if (entry && typeof entry === 'object') {
    const record = entry as Record<string, unknown>
    const id = record.id
    const name = record.name

    if ((typeof id === 'number' || typeof id === 'string') && typeof name === 'string') {
      return { id, name }
    }
  }

  return null
}

// Only object-shaped roles carry the `id` the roles endpoints need; a bare role
// string has nothing to match against `/api/v1/users/{id}/roles/{roleId}`.
function getUserRoles (user: ApiUser): UserRoleRef[] {
  if (Array.isArray(user.roles)) {
    return user.roles
      .map(entry => normalizeRoleRef(entry))
      .filter((role): role is UserRoleRef => role !== null)
  }

  const role = normalizeRoleRef(user.role)
  return role ? [role] : []
}

function getUserActive (user: ApiUser) {
  if (typeof user.active === 'boolean') {
    return user.active
  }

  if (typeof user.is_active === 'boolean') {
    return user.is_active
  }

  if (typeof user.status === 'string') {
    return user.status.toLowerCase() === 'active'
  }

  return true
}

function getNullableString (value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function getUserVerifiedAt (user: ApiUser) {
  return getNullableString(user.email_verified_at ?? user.verified_at)
}

function getUserVerified (user: ApiUser, verifiedAt: string | null) {
  if (typeof user.verified === 'boolean') {
    return user.verified
  }

  return verifiedAt !== null
}

function getUserInitials (name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function mapUser (user: ApiUser): User {
  const name = getUserName(user)
  const email = typeof user.email === 'string' ? user.email : ''
  const verifiedAt = getUserVerifiedAt(user)

  return {
    active: getUserActive(user),
    createdAt: getNullableString(user.created_at),
    email,
    id: typeof user.id === 'number' || typeof user.id === 'string' ? user.id : email,
    initials: getUserInitials(name),
    microsoftId: getNullableString(user.microsoft_id),
    name,
    role: getUserRole(user),
    roles: getUserRoles(user),
    verified: getUserVerified(user, verifiedAt),
    verifiedAt,
  }
}

function unwrapUsers (response: ApiUser[] | LaravelCollectionResponse<ApiUser>) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

function unwrapSingle (response: ApiUser | SingleResourceResponse<ApiUser>): ApiUser {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiUser
  }
  return response as ApiUser
}

function toNumber (value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber (value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
}

// Laravel exposes pagination either at the root (`paginate()->toArray()`) or
// nested under `meta` (API resource collections); both shapes reach this app
// depending on the endpoint, so read whichever one is present.
function parsePaginationMeta (response: unknown, itemCount: number, requestedPage: number, requestedPerPage: number): PaginationMeta {
  const root = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>
  const nested = (root.meta && typeof root.meta === 'object' ? root.meta : {}) as Record<string, unknown>
  const source = 'current_page' in nested || 'total' in nested ? nested : root

  const perPage = toNumber(source.per_page, requestedPerPage)
  const total = toNumber(source.total, itemCount)

  return {
    currentPage: toNumber(source.current_page, requestedPage),
    from: toNullableNumber(source.from),
    lastPage: toNumber(source.last_page, Math.max(1, Math.ceil(total / Math.max(1, perPage)))),
    perPage,
    to: toNullableNumber(source.to),
    total,
  }
}

const EMPTY_FILTER_VALUES = new Set<unknown>([undefined, null, ''])

function appendFilterParams (params: Record<string, string>, filters: UserFilters) {
  for (const [key, value] of Object.entries(filters)) {
    if (EMPTY_FILTER_VALUES.has(value)) {
      continue
    }

    params[`filter[${key}]`] = typeof value === 'boolean' ? String(value) : String(value).trim()
  }

  return params
}

function buildListParams (query: UsersQuery): Record<string, string> {
  const page = query.page ?? 1
  const perPage = query.perPage ?? DEFAULT_PER_PAGE

  const params: Record<string, string> = {
    page: String(page),
    per_page: String(perPage),
  }

  if (query.sort) {
    params.sort = query.sort
  }

  return appendFilterParams(params, query.filters ?? {})
}

export class HttpUsersAdapter implements UsersPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: UserPayload) {
    const response = await this.client.post<ApiUser | SingleResourceResponse<ApiUser>, UserPayload>('/api/v1/users', payload)
    return mapUser(unwrapSingle(response))
  }

  async getById (userId: number | string) {
    const response = await this.client.get<ApiUser | SingleResourceResponse<ApiUser>>(`/api/v1/users/${userId}`)
    return mapUser(unwrapSingle(response))
  }

  async list (query: UsersQuery = {}): Promise<PaginatedUsers> {
    const params = buildListParams(query)
    const response = await this.client.get<ApiUser[] | LaravelCollectionResponse<ApiUser>>('/api/v1/users', { params })
    const items = unwrapUsers(response).map(user => mapUser(user))

    return {
      items,
      meta: parsePaginationMeta(response, items.length, query.page ?? 1, query.perPage ?? DEFAULT_PER_PAGE),
    }
  }

  async remove (userId: number | string) {
    await this.client.delete<unknown>(`/api/v1/users/${userId}`)
  }

  async update (userId: number | string, payload: Partial<UserPayload>) {
    const response = await this.client.put<ApiUser | SingleResourceResponse<ApiUser>, Partial<UserPayload>>(`/api/v1/users/${userId}`, payload)
    return mapUser(unwrapSingle(response))
  }
}

export const usersAdapter = new HttpUsersAdapter(httpClient)
