import type { DatasetContract, DatasetIssue, DatasetValidationResult } from '../../shared/data-pipeline/contracts.js'

const isBlank = (value: unknown) => value === null || value === undefined || String(value).trim() === ''
const asNumber = (value: unknown) => typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim())

export function validateDataset(contract: DatasetContract, sheets: Readonly<Record<string, readonly Record<string, unknown>[]>>): DatasetValidationResult {
  const issues: DatasetIssue[] = []
  const transformations: DatasetValidationResult['transformations'] = []
  let totalRows = 0; let validRows = 0; let warningRows = 0; let rejectedRows = 0
  const add = (issue: DatasetIssue) => issues.push(issue)
  for (const sheet of contract.acceptedSheets) {
    const rows = sheets[sheet] ?? []
    totalRows += rows.length
    const required = contract.requiredColumns[sheet] ?? []
    const sheetColumns = new Set([...required, ...(contract.optionalColumns[sheet] ?? [])])
    if (sheet !== 'verification_notes' && rows.length === 0) add({ severity: 'blocking', code: 'missing_rows', sheet, message: `Sheet ${sheet} contains no data rows.` })
    rows.forEach((row, index) => {
      const rowNumber = index + 2; let blocked = false; let warned = false
      for (const column of required) if (isBlank(row[column])) { add({ severity: 'blocking', code: 'required_value_missing', sheet, row: rowNumber, column, message: `${column} is required.` }); blocked = true }
      for (const [column, field] of Object.entries(contract.fields)) {
        if (!sheetColumns.has(column)) continue
        if (isBlank(row[column])) { if (field.required && !field.nullable) { add({ severity: 'blocking', code: 'required_value_missing', sheet, row: rowNumber, column, message: `${column} is required.` }); blocked = true }; continue }
        const value = row[column]
        if (field.type === 'number' || field.type === 'integer') { const n = asNumber(value); if (!Number.isFinite(n) || (field.type === 'integer' && !Number.isInteger(n))) { add({ severity: 'blocking', code: 'invalid_numeric', sheet, row: rowNumber, column, value, message: `${column} must be a ${field.type}.` }); blocked = true } else if (n < 0 && ['truegold','tempered_truegold','bread','wood','stone','iron','upgrade_time_seconds'].includes(column)) { add({ severity: 'blocking', code: 'negative_value', sheet, row: rowNumber, column, value, message: `${column} cannot be negative.` }); blocked = true } }
        if (field.type === 'json') { try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; if (!Array.isArray(parsed)) throw new Error('not array') } catch { add({ severity: 'blocking', code: 'invalid_requirements_json', sheet, row: rowNumber, column, value, message: 'requirements_json must be a JSON array.' }); blocked = true } }
        if (field.type === 'url' && !/^https?:\/\/[^\s]+$/i.test(String(value))) { add({ severity: 'blocking', code: 'invalid_url', sheet, row: rowNumber, column, value, message: `${column} must be an absolute HTTP(S) URL.` }); blocked = true }
        if (field.type === 'date' && Number.isNaN(Date.parse(String(value)))) { add({ severity: 'blocking', code: 'invalid_date', sheet, row: rowNumber, column, value, message: `${column} must be a valid date.` }); blocked = true }
      }
      if (!blocked) validRows++; else rejectedRows++
      if (warned) warningRows++
    })
  }
  for (const constraint of contract.uniqueConstraints) { const seen = new Map<string, number>(); for (const [index, row] of (sheets[constraint.sheet] ?? []).entries()) { const key = constraint.columns.map(column => String(row[column] ?? '').trim()).join('|'); if (!key) continue; if (seen.has(key)) { issues.push({ severity: 'blocking', code: 'duplicate_key', sheet: constraint.sheet, row: index + 2, message: `Duplicate ${constraint.columns.join(', ')} value: ${key}.` }); rejectedRows++ } else seen.set(key, index + 2) } }
  const details = sheets[contract.detailSheet ?? ''] ?? []; const catalogKeys = new Set((sheets[contract.canonicalEntitySheet] ?? []).map(row => String(row.building_key ?? '').trim()));
  details.forEach((row, index) => { if (!catalogKeys.has(String(row.building_key ?? '').trim())) issues.push({ severity: 'blocking', code: 'orphan_detail', sheet: contract.detailSheet, row: index + 2, column: 'building_key', message: `No catalog building exists for ${String(row.building_key ?? '')}.` }) })
  return { issues, transformations, counts: { totalRows, validRows, warningRows, rejectedRows }, summary: issues.length ? `${issues.length} validation issue(s) found.` : 'Validation passed with no issues.' }
}
