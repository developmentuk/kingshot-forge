import type { DatasetAdapter } from './adapter'
import type { DatasetFieldDefinition, DatasetFieldSection } from './field'
import type { DatasetPermissionPolicy } from './permissions'
import type { DatasetPublishingPolicy } from './publishing'
import type { DatasetRecordValidator } from './validation'
import type { DatasetRecordValues } from './value'

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
