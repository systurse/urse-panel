import type { User, UserPayload, UsersPort } from '@/modules/users/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiUser = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

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

  return {
    active: getUserActive(user),
    email,
    id: typeof user.id === 'number' || typeof user.id === 'string' ? user.id : email,
    initials: getUserInitials(name),
    name,
    role: getUserRole(user),
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

  async list () {
    const response = await this.client.get<ApiUser[] | LaravelCollectionResponse<ApiUser>>('/api/v1/users')
    return unwrapUsers(response).map(user => mapUser(user))
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
