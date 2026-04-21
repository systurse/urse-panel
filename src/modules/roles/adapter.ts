import type { Role, RolePayload, RolesPort } from '@/modules/roles/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiRole = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

function getRoleName (role: ApiRole) {
  const name = role.name ?? role.role_name ?? role.display_name

  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  return 'Sin nombre'
}

function getRoleDescription (role: ApiRole) {
  const description = role.description ?? role.description_text ?? role.notes

  if (typeof description === 'string' && description.trim().length > 0) {
    return description
  }

  return 'Sin descripción'
}

function mapRole (role: ApiRole): Role {
  return {
    description: getRoleDescription(role),
    id: typeof role.id === 'number' || typeof role.id === 'string' ? role.id : '',
    name: getRoleName(role),
  }
}

function unwrapRoles (response: ApiRole[] | LaravelCollectionResponse<ApiRole>) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

function unwrapSingle (response: ApiRole | SingleResourceResponse<ApiRole>): ApiRole {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiRole
  }
  return response as ApiRole
}

export class HttpRolesAdapter implements RolesPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: RolePayload) {
    const response = await this.client.post<ApiRole | SingleResourceResponse<ApiRole>, RolePayload>('/api/v1/roles', payload)
    return mapRole(unwrapSingle(response))
  }

  async getById (roleId: number | string) {
    const response = await this.client.get<ApiRole | SingleResourceResponse<ApiRole>>(`/api/v1/roles/${roleId}`)
    return mapRole(unwrapSingle(response))
  }

  async list () {
    const response = await this.client.get<ApiRole[] | LaravelCollectionResponse<ApiRole>>('/api/v1/roles')
    return unwrapRoles(response).map(role => mapRole(role))
  }

  async remove (roleId: number | string) {
    await this.client.delete<unknown>(`/api/v1/roles/${roleId}`)
  }

  async update (roleId: number | string, payload: Partial<RolePayload>) {
    const response = await this.client.put<ApiRole | SingleResourceResponse<ApiRole>, Partial<RolePayload>>(`/api/v1/roles/${roleId}`, payload)
    return mapRole(unwrapSingle(response))
  }
}

export const rolesAdapter = new HttpRolesAdapter(httpClient)
