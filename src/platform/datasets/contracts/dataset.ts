import type { DatasetAdapter } from './adapter.js'
import type { DatasetFieldDefinition, DatasetFieldSection } from './field.js'
import type { DatasetPermissionPolicy } from './permissions.js'
import type { DatasetPublishingPolicy } from './publishing.js'
import type { DatasetRecordValidator } from './validation.js'
import type { DatasetRecordValues } from './value.js'

export type DatasetCategory =
  | 'game-data'
  | 'content'
  | 'community'
  | 'system'
  | (string & {})

export interface DatasetCapabilityFlags {
  browsing?: boolean
  editing?: boolean
  creation?: boolean
  duplication?: boolean
  deletion?: boolean
  importing?: boolean
  exporting?: boolean
  publishing?: boolean
  versionHistory?: boolean
  search?: boolean
}

export interface DatasetDefinition<
  TSource = unknown,
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  id: string
  version: number
  title: string
  singularTitle: string
  description: string
  category: DatasetCategory
  route?: string
  icon?: string
  idField: string
  titleField: string
  fields: DatasetFieldDefinition[]
  sections?: DatasetFieldSection[]
  capabilities?: DatasetCapabilityFlags
  permissions?: DatasetPermissionPolicy
  publishing?: DatasetPublishingPolicy
  adapter?: DatasetAdapter<TSource, TValues>
  validators?: DatasetRecordValidator[]
  tags?: string[]
}
