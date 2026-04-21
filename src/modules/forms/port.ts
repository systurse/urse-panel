export interface Form {
  formType: string
  id: number | string
  isActive: boolean
  name: string
}

export interface FormPayload {
  form_type: string
  is_active?: boolean
  name: string
}

export interface FormsPort {
  create: (payload: FormPayload) => Promise<Form>
  getById: (formId: number | string) => Promise<Form>
  list: () => Promise<Form[]>
  remove: (formId: number | string) => Promise<void>
  update: (formId: number | string, payload: Partial<FormPayload>) => Promise<Form>
}
