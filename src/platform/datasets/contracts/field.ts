import type { DatasetRecordValues, DatasetValue } from './value.js'

export type DatasetFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'percentage'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'image'
  | 'gallery'
  | 'markdown'
  | 'json'
  | 'relation'
  | 'array'
  | 'object'
  | 'readonly'

export interface DatasetFieldOption {
  label: string
  value: string | number | boolean
  description?: string
}

export interface DatasetFieldValidationContext {
  datasetId: string
  fieldId: string
  recordId: string | null
  values: DatasetRecordValues
}

export interface DatasetFieldValidationRule {
  required?: boolean
  minimum?: number
  maximum?: number
  minimumLength?: number
  maximumLength?: number
  integer?: boolean
  pattern?: string
  message?: string
  validate?: (
    value: DatasetValue,
    context: DatasetFieldValidationContext,
  ) => string | null
}

export interface DatasetFieldDefinition {
  id: string
  label: string
  type: DatasetFieldType
  description?: string
  placeholder?: string
  sectionId?: string
  order?: number
  required?: boolean
  readOnly?: boolean
  hidden?: boolean
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  localised?: boolean
  publishable?: boolean
  options?: DatasetFieldOption[]
  validation?: DatasetFieldValidationRule
  defaultValue?: DatasetValue
}

export interface DatasetFieldSection {
  id: string
  title: string
  description?: string
  order?: number
  collapsedByDefault?: boolean
}
