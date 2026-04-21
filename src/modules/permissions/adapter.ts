import type { Permission, PermissionPayload, PermissionsPort } from '@/modules/permissions/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiPermission = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

function getPermissionName (permission: ApiPermission) {
  const name = permission.name ?? permission.permission_name ?? permission.display_name

  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  return 'Sin nombre'
}

function getPermissionModule (permission: ApiPermission) {
  const module = permission.module ?? permission.module_name ?? permission.resource

  if (typeof module === 'string' && module.trim().length > 0) {
    return module
  }

  return 'General'
}

function getPermissionDescription (permission: ApiPermission) {
  const description = permission.description ?? permission.description_text ?? permission.notes

  if (typeof description === 'string' && description.trim().length > 0) {
    return description
  }

  return 'Sin descripción'
}

function mapPermission (permission: ApiPermission): Permission {
  return {
    description: getPermissionDescription(permission),
    id: typeof permission.id === 'number' || typeof permission.id === 'string' ? permission.id : '',
    module: getPermissionModule(permission),
    name: getPermissionName(permission),
  }
}

function unwrapPermissions (response: ApiPermission[] | LaravelCollectionResponse<ApiPermission>) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

function unwrapSingle (response: ApiPermission | SingleResourceResponse<ApiPermission>): ApiPermission {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiPermission
  }
  return response as ApiPermission
}

export class HttpPermissionsAdapter implements PermissionsPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: PermissionPayload) {
    const response = await this.client.post<ApiPermission | SingleResourceResponse<ApiPermission>, PermissionPayload>('/api/v1/permissions', payload)
    return mapPermission(unwrapSingle(response))
  }

  async getById (permissionId: number | string) {
    const response = await this.client.get<ApiPermission | SingleResourceResponse<ApiPermission>>(`/api/v1/permissions/${permissionId}`)
    return mapPermission(unwrapSingle(response))
  }

  async list () {
    const response = await this.client.get<ApiPermission[] | LaravelCollectionResponse<ApiPermission>>('/api/v1/permissions')
    return unwrapPermissions(response).map(permission => mapPermission(permission))
  }

  async remove (permissionId: number | string) {
    await this.client.delete<unknown>(`/api/v1/permissions/${permissionId}`)
  }

  async update (permissionId: number | string, payload: Partial<PermissionPayload>) {
    const response = await this.client.put<ApiPermission | SingleResourceResponse<ApiPermission>, Partial<PermissionPayload>>(`/api/v1/permissions/${permissionId}`, payload)
    return mapPermission(unwrapSingle(response))
  }
}

export const permissionsAdapter = new HttpPermissionsAdapter(httpClient)
