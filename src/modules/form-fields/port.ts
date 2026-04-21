export interface FormField {
  fieldId: number
  fieldName: string
  fieldLabel: string
  fieldType: string
  formId: number | string
  id: number | string
  isOptionalPull: boolean
  position: number
}

export interface FormFieldPayload {
  field_id: number
  is_optional_pull?: boolean
  position: number
}

export interface FormFieldUpdatePayload {
  is_optional_pull?: boolean
  position?: number
}

export interface FormFieldsPort {
  create: (formId: number | string, payload: FormFieldPayload) => Promise<FormField>
  list: (formId: number | string) => Promise<FormField[]>
  remove: (formFieldId: number | string) => Promise<void>
  update: (formFieldId: number | string, payload: FormFieldUpdatePayload) => Promise<FormField>
}
