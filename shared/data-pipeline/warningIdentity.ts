export interface WarningIdentityInput {
  dataset: string
  code: string
  sheet: string
  row: number
  record_id: string
  building_key: string
  source_text: string
  parsed_name: string | null
  required_level: number | null
  required_stage: number | null
}

export interface CanonicalWarning extends WarningIdentityInput {
  warning_id: string
  severity: 'warning' | 'blocking' | 'informational'
  message: string
  timestamp: string | null
}

export function warningId(input: WarningIdentityInput): string {
  return [
    input.dataset,
    input.code,
    input.sheet,
    input.row,
    input.record_id,
    input.building_key,
    input.source_text,
    input.parsed_name ?? '',
    input.required_level ?? '',
    input.required_stage ?? '',
  ].join('|')
}

export function withWarningId<T extends WarningIdentityInput>(warning: T): T & { warning_id: string } {
  return { ...warning, warning_id: warningId(warning) }
}

export function sortedUniqueWarningIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort()
}

export function warningIdentitySetsReconcile(stages: Readonly<Record<string, readonly string[]>>): boolean {
  const entries = Object.values(stages).map(sortedUniqueWarningIds)
  if (entries.some((ids, index) => ids.length !== stages[Object.keys(stages)[index]].length)) return false
  return entries.every((ids) => ids.length === entries[0]?.length && ids.every((id, index) => id === entries[0]?.[index]))
}
