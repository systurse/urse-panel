import type { Field } from '@/modules/fields/port'

export type ApiField = Record<string, any>

export interface LaravelCollectionResponse<TItem> {
  data?: TItem[]
}

export interface SingleResourceResponse<TItem> {
  data?: TItem
}

export function getFieldName (field: ApiField) {
  const name = field.name ?? field.label

  if (typeof name === 'string' && name.trim().length > 0) {
    return name
  }

  return 'Sin nombre'
}

export function getFieldLabel (field: ApiField) {
  const label = field.label ?? field.name

  if (typeof label === 'string' && label.trim().length > 0) {
    return label
  }

  return 'Sin etiqueta'
}

export function getFieldType (field: ApiField) {
  const type = field.type ?? 'text'

  if (typeof type === 'string' && type.trim().length > 0) {
    return type
  }

  return 'text'
}

export function getFieldOptions (field: ApiField): string[] | null {
  if (Array.isArray(field.options)) {
    return field.options.map(String)
  }

  if (typeof field.options === 'string' && field.options.trim().length > 0) {
    return field.options.split(',').map(opt => opt.trim())
  }

  return null
}

export function getFieldBoolean (field: ApiField, keys: string[]): boolean {
  for (const key of keys) {
    if (field.hasOwnProperty(key) && typeof field[key] === 'boolean') {
      return field[key] as boolean
    }
  }
  return false
}

export function mapField (field: ApiField): Field {
  console.log(field)
  return {
    id: typeof field.id === 'number' || typeof field.id === 'string' ? field.id : '',
    isGlobal: getFieldBoolean(field, ['is_global', 'global', 'shared']),
    isRequired: getFieldBoolean(field, ['is_optional_pull']),
    label: getFieldLabel(field),
    name: getFieldName(field),
    options: getFieldOptions(field),
    type: getFieldType(field),
  }
}

export function unwrapFields (response: ApiField[] | LaravelCollectionResponse<ApiField>) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  return []
}

export function unwrapSingle (response: ApiField | SingleResourceResponse<ApiField>): ApiField {
  if (response && typeof response === 'object' && 'data' in response && typeof response.data === 'object' && response.data !== null) {
    return response.data as ApiField
  }
  return response as ApiField
}
