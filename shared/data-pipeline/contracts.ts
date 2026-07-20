export type DatasetIssueSeverity = 'blocking' | 'warning' | 'informational' | 'auto_correctable'
export type DatasetFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'url' | 'json'

export interface DatasetFieldContract {
  readonly type: DatasetFieldType
  readonly required?: boolean
  readonly nullable?: boolean
  readonly enum?: readonly string[]
}

export interface DatasetContract {
  readonly key: string
  readonly version: number
  readonly displayName: string
  readonly description: string
  readonly acceptedFileTypes: readonly ('xlsx' | 'csv')[]
  readonly acceptedSheets: readonly string[]
  readonly canonicalEntitySheet: string
  readonly detailSheet?: string
  readonly primaryKey: string
  readonly requiredColumns: Readonly<Record<string, readonly string[]>>
  readonly optionalColumns: Readonly<Record<string, readonly string[]>>
  readonly fields: Readonly<Record<string, DatasetFieldContract>>
  readonly uniqueConstraints: readonly { sheet: string; columns: readonly string[] }[]
  readonly relationships: readonly { fromSheet: string; fromColumn: string; toSheet: string; toColumn: string }[]
  readonly metadata: Readonly<Record<string, unknown>>
}

export interface DatasetIssue {
  readonly severity: DatasetIssueSeverity
  readonly code: string
  readonly message: string
  readonly sheet?: string
  readonly row?: number
  readonly column?: string
  readonly value?: unknown
}

export interface DatasetValidationResult {
  readonly issues: readonly DatasetIssue[]
  readonly counts: { totalRows: number; validRows: number; warningRows: number; rejectedRows: number }
  readonly transformations: readonly { sheet: string; row: number; field: string; from: unknown; to: unknown; reason: string }[]
  readonly summary: string
}

