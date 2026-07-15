import type { DatasetRecordDraft } from './record'

export type DatasetValidationSeverity = 'error' | 'warning' | 'information'

export interface DatasetValidationIssue {
  code: string
  message: string
  severity: DatasetValidationSeverity
  fieldId?: string
  path?: string
}

export interface DatasetValidationResult {
  valid: boolean
  issues: DatasetValidationIssue[]
}

export interface DatasetValidationContext {
  datasetId: string
  operation: 'create' | 'update' | 'review' | 'publish' | 'import'
}

export type DatasetRecordValidator = (
  record: DatasetRecordDraft,
  context: DatasetValidationContext,
) => DatasetValidationIssue[] | Promise<DatasetValidationIssue[]>
