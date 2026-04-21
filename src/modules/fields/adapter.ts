import type { FieldPayload, FieldsPort } from '@/modules/fields/port'
import type { HttpClient } from '@/services/http'
import {
  type ApiField,
  type LaravelCollectionResponse,
  mapField,
  type SingleResourceResponse,
  unwrapFields,
  unwrapSingle,
} from '@/modules/fields/mappers'
import { httpClient } from '@/services/http'

export class HttpFieldsAdapter implements FieldsPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: FieldPayload) {
    const response = await this.client.post<ApiField | SingleResourceResponse<ApiField>, FieldPayload>('/api/v1/fields', payload)
    return mapField(unwrapSingle(response))
  }

  async getById (fieldId: number | string) {
    const response = await this.client.get<ApiField | SingleResourceResponse<ApiField>>(`/api/v1/fields/${fieldId}`)
    return mapField(unwrapSingle(response))
  }

  async list () {
    const response = await this.client.get<ApiField[] | LaravelCollectionResponse<ApiField>>('/api/v1/fields')
    return unwrapFields(response).map(field => mapField(field))
  }

  async remove (fieldId: number | string) {
    await this.client.delete<unknown>(`/api/v1/fields/${fieldId}`)
  }

  async update (fieldId: number | string, payload: Partial<FieldPayload>) {
    const response = await this.client.put<ApiField | SingleResourceResponse<ApiField>, Partial<FieldPayload>>(`/api/v1/fields/${fieldId}`, payload)
    return mapField(unwrapSingle(response))
  }
}

export const fieldsAdapter = new HttpFieldsAdapter(httpClient)
