import type { ApiField } from '@/modules/fields/mappers'
import type { FormField, FormFieldPayload, FormFieldsPort, FormFieldUpdatePayload } from '@/modules/form-fields/port'
import type { HttpClient } from '@/services/http'
import { mapField } from '@/modules/fields/mappers'
import { httpClient } from '@/services/http'

type ApiFormField = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

function mapFormField (field: ApiFormField): FormField {
  const fieldInfo = (field.field ?? field.field_data ?? {}) as Record<string, unknown>
  const fieldName = typeof fieldInfo.name === 'string' ? fieldInfo.name : (typeof field.field_name === 'string' ? field.field_name : 'Sin nombre')
  const fieldLabel = typeof fieldInfo.label === 'string' ? fieldInfo.label : (typeof field.field_label === 'string' ? field.field_label : 'Sin etiqueta')
  const fieldType = typeof fieldInfo.type === 'string' ? fieldInfo.type : (typeof field.field_type === 'string' ? field.field_type : 'text')

  return {
    fieldId: typeof field.field_id === 'number' ? field.field_id : 0,
    fieldName,
    fieldLabel,
    fieldType,
    formId: typeof field.form_id === 'number' || typeof field.form_id === 'string' ? field.form_id : '',
    id: typeof field.id === 'number' || typeof field.id === 'string' ? field.id : '',
    isOptionalPull: typeof field.is_optional_pull === 'boolean' ? field.is_optional_pull : false,
    position: typeof field.position === 'number' ? field.position : 0,
  }
}

function unwrapFields (response: ApiFormField[] | LaravelCollectionResponse<ApiFormField>) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

function unwrapSingle (response: ApiFormField | SingleResourceResponse<ApiFormField>): ApiFormField {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiFormField
  }
  return response as ApiFormField
}

export class HttpFormFieldsAdapter implements FormFieldsPort {
  constructor (private readonly client: HttpClient) {}

  async create (formId: number | string, payload: FormFieldPayload) {
    const response = await this.client.post<ApiFormField | SingleResourceResponse<ApiFormField>, FormFieldPayload>(`/api/v1/forms/${formId}/form-fields`, payload)
    return mapFormField(unwrapSingle(response))
  }

  async list (formId: number | string) {
    const response = await this.client.get<ApiFormField[] | LaravelCollectionResponse<ApiFormField>>(`/api/v1/forms/${formId}/form-fields`)
    return unwrapFields(response).map(field => mapFormField(field))
  }

  async remove (formFieldId: number | string) {
    await this.client.delete<unknown>(`/api/v1/form-fields/${formFieldId}`)
  }

  async update (formFieldId: number | string, payload: FormFieldUpdatePayload) {
    const response = await this.client.put<ApiFormField | SingleResourceResponse<ApiFormField>, FormFieldUpdatePayload>(`/api/v1/form-fields/${formFieldId}`, payload)
    return mapFormField(unwrapSingle(response))
  }

  async listByForm (formId: number | string) {
    const response = await this.client.get<ApiField[] | LaravelCollectionResponse<ApiField>>(
      `/api/v1/forms/${formId}/form-fields`,
    )
    return unwrapFields(response)
  }
}

export const formFieldsAdapter = new HttpFormFieldsAdapter(httpClient)
