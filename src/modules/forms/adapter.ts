import type { Form, FormPayload, FormsPort } from '@/modules/forms/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

type ApiForm = Record<string, unknown>

interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

interface SingleResourceResponse<TItem> {
  data?: TItem
}

function getFormName (form: ApiForm) {
  const name = form.name ?? form.form_name ?? form.title

  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  return 'Sin nombre'
}

function getFormType (form: ApiForm) {
  const formType = form.form_type ?? form.type ?? form.form_category

  if (typeof formType === 'string' && formType.trim().length > 0) {
    return formType
  }

  return 'Sin tipo'
}

function getFormIsActive (form: ApiForm) {
  if (typeof form.is_active === 'boolean') {
    return form.is_active
  }

  if (typeof form.active === 'boolean') {
    return form.active
  }

  if (typeof form.status === 'string') {
    return form.status.toLowerCase() === 'active'
  }

  return true
}

function mapForm (form: ApiForm): Form {
  return {
    formType: getFormType(form),
    id: typeof form.id === 'number' || typeof form.id === 'string' ? form.id : '',
    isActive: getFormIsActive(form),
    name: getFormName(form),
  }
}

function unwrapForms (response: ApiForm[] | LaravelCollectionResponse<ApiForm>) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

function unwrapSingle (response: ApiForm | SingleResourceResponse<ApiForm>): ApiForm {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiForm
  }
  return response as ApiForm
}

export class HttpFormsAdapter implements FormsPort {
  constructor (private readonly client: HttpClient) {}

  async create (payload: FormPayload) {
    const response = await this.client.post<ApiForm | SingleResourceResponse<ApiForm>, FormPayload>('/api/v1/forms', payload)
    return mapForm(unwrapSingle(response))
  }

  async getById (formId: number | string) {
    const response = await this.client.get<ApiForm | SingleResourceResponse<ApiForm>>(`/api/v1/forms/${formId}`)
    return mapForm(unwrapSingle(response))
  }

  async list () {
    const response = await this.client.get<ApiForm[] | LaravelCollectionResponse<ApiForm>>('/api/v1/forms')
    return unwrapForms(response).map(form => mapForm(form))
  }

  async remove (formId: number | string) {
    await this.client.delete<unknown>(`/api/v1/forms/${formId}`)
  }

  async update (formId: number | string, payload: Partial<FormPayload>) {
    const response = await this.client.put<ApiForm | SingleResourceResponse<ApiForm>, Partial<FormPayload>>(`/api/v1/forms/${formId}`, payload)
    return mapForm(unwrapSingle(response))
  }
}

export const formsAdapter = new HttpFormsAdapter(httpClient)
