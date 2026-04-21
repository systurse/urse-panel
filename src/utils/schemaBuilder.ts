import type { Field } from '@/modules/fields/port'

export interface JsonSchemaProperty {
  'type': 'string' | 'number' | 'boolean' | 'array'
  'title': string
  'format'?: string
  'enum'?: string[]
  'x-display'?: string
  'x-props'?: Record<string, unknown>
  'contentMediaType'?: string
  'items'?: { type: 'string', enum?: string[] }
}

export interface JsonSchema {
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required: string[]
}

type FieldMapper = (field: Field) => JsonSchemaProperty

const FIELD_TYPE_MAP: Record<string, FieldMapper> = {
  text: f => ({ type: 'string', title: f.label }),

  textarea: f => ({
    'type': 'string',
    'title': f.label,
    'x-display': 'textarea',
    'x-props': { rows: 4 },
  }),

  number: f => ({ type: 'number', title: f.label }),

  email: f => ({ type: 'string', title: f.label, format: 'email' }),

  date: f => ({ type: 'string', title: f.label, format: 'date' }),

  datetime: f => ({ type: 'string', title: f.label, format: 'date-time' }),

  select: f => ({
    type: 'string',
    title: f.label,
    enum: f.options ?? [],
  }),

  multiselect: f => ({
    type: 'array',
    title: f.label,
    items: { type: 'string', enum: f.options ?? [] },
  }),

  radio: f => ({
    'type': 'string',
    'title': f.label,
    'enum': f.options ?? [],
    'x-display': 'radio',
  }),

  checkbox: f => {
    if (f.options && f.options.length > 0) {
      return {
        'type': 'array',
        'title': f.label,
        'items': { type: 'string', enum: f.options },
        'x-display': 'checkbox',
      }
    }
    return { type: 'boolean', title: f.label }
  },

  file: f => ({
    'type': 'string',
    'title': f.label,
    'contentMediaType': '*/*',
    'x-display': 'file',
  }),
}

export function buildSchema (fields: Field[]): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {}
  const required: string[] = []

  for (const field of fields) {
    const mapper = FIELD_TYPE_MAP[field.type]
    properties[field.name] = mapper ? mapper(field) : { type: 'string', title: field.label }

    if (field.isRequired) {
      required.push(field.name)
    }
  }

  return { type: 'object', properties, required }
}
