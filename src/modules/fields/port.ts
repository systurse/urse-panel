export interface Field {
  id: number | string
  isGlobal: boolean
  isRequired: boolean
  label: string
  name: string
  options: string[] | null
  type: string
}

export interface FieldPayload {
  is_global?: boolean
  is_required?: boolean
  label: string
  name: string
  options?: string[] | null
  type: string
}

export interface FieldsPort {
  create: (payload: FieldPayload) => Promise<Field>
  getById: (fieldId: number | string) => Promise<Field>
  list: () => Promise<Field[]>
  remove: (fieldId: number | string) => Promise<void>
  update: (fieldId: number | string, payload: Partial<FieldPayload>) => Promise<Field>
}
