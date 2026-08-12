import type { Area, AreaManagerRef, AreaPayload, AreasPort } from '@/modules/areas/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiArea = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

function getId (value: unknown): number | string | null {
  return typeof value === 'number' || typeof value === 'string' ? value : null
}

function getString (value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function getManagerName (manager: ApiArea): string {
  const name = manager.name
  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  const parts = [manager.first_name, manager.last_name, manager.second_last_name]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
  return parts.length > 0 ? parts.join(' ') : 'Sin nombre'
}

function mapManager (manager: unknown): AreaManagerRef | null {
  if (!manager || typeof manager !== 'object') {
    return null
  }
  const record = manager as ApiArea
  const id = getId(record.id)
  return id === null ? null : { id, name: getManagerName(record) }
}

function mapArea (area: ApiArea): Area {
  return {
    id: getId(area.id) ?? '',
    manager: mapManager(area.manager),
    manager_employee_id: getId(area.manager_employee_id),
    name: getString(area.name) ?? 'Sin nombre',
    parent: area.parent && typeof area.parent === 'object' ? mapArea(area.parent as ApiArea) : null,
    parent_id: getId(area.parent_id),
    type: getString(area.type),
  }
}

function unwrapAreas (response: ApiArea[] | LaravelCollectionResponse<ApiArea>) {
  if (Array.isArray(response)) {
    return response
  }
  if (Array.isArray(response.data)) {
    return response.data
  }
  return []
}

function unwrapSingle (response: ApiArea | SingleResourceResponse<ApiArea>): ApiArea {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiArea
  }
  return response as ApiArea
}

export class HttpAreasAdapter implements AreasPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: AreaPayload) {
    const response = await this.client.post<ApiArea | SingleResourceResponse<ApiArea>, AreaPayload>('/api/v1/areas', payload)
    return mapArea(unwrapSingle(response))
  }

  async getById (areaId: number | string) {
    const response = await this.client.get<ApiArea | SingleResourceResponse<ApiArea>>(`/api/v1/areas/${areaId}`)
    return mapArea(unwrapSingle(response))
  }

  async list () {
    const response = await this.client.get<ApiArea[] | LaravelCollectionResponse<ApiArea>>('/api/v1/areas')
    return unwrapAreas(response).map(area => mapArea(area))
  }

  async remove (areaId: number | string) {
    await this.client.delete<unknown>(`/api/v1/areas/${areaId}`)
  }

  async update (areaId: number | string, payload: Partial<AreaPayload>) {
    const response = await this.client.put<ApiArea | SingleResourceResponse<ApiArea>, Partial<AreaPayload>>(`/api/v1/areas/${areaId}`, payload)
    return mapArea(unwrapSingle(response))
  }
}

export const areasAdapter = new HttpAreasAdapter(httpClient)
