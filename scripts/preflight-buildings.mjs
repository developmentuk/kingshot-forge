import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import XLSX from 'xlsx'

const input = process.argv[2]
const output = process.argv[3] ?? path.resolve('artifacts/buildings-preflight.json')
const expected = { buildings_catalog: 10, buildings_import: 587, totalDataRows: 597 }
const requiredSheets = ['buildings_catalog', 'buildings_import', 'verification_notes']
const numericColumns = ['truegold', 'tempered_truegold', 'bread', 'wood', 'stone', 'iron', 'upgrade_time_seconds', 'power', 'max_hero_level', 'training_capacity', 'rally_capacity', 'ally_help_count', 'training_speed_percent', 'troop_deploy_capacity', 'reinforcement_capacity']
const nonNegativeColumns = ['truegold', 'tempered_truegold', 'bread', 'wood', 'stone', 'iron', 'upgrade_time_seconds', 'power']
const categories = new Set(['core', 'alliance', 'military', 'research', 'medical', 'economy'])
const phases = new Set(['normal', 'pre_truegold', 'truegold'])

const blank = value => value == null || String(value).trim() === ''
const text = value => value == null ? '' : String(value).trim()
const number = value => Number(text(value).replace(/,/g, ''))
const isNumber = value => Number.isFinite(number(value))
const isInteger = value => isNumber(value) && Number.isInteger(number(value))
const issue = (findings, severity, code, message, context = {}, suggestedResolution = '') => findings.push({ severity, code, message, suggested_resolution: suggestedResolution, ...context })
const rowContext = (sheet, row, record) => ({ sheet, row, ...(sheet === 'buildings_catalog' ? { building_key: text(record.building_key) } : { record_id: text(record.record_id), building_key: text(record.building_key) }) })

function parsePrerequisite(value) {
  const match = text(value).match(/^(.+?)\s+Lv\.\s*(TG)?\s*(\d+)(?:\s*[-/]\s*(\d+))?$/i)
  return match ? { source_text: text(value), parsed_name: match[1].trim(), required_level: Number(match[3]), required_stage: match[4] ? Number(match[4]) : null, truegold: Boolean(match[2]) } : { source_text: text(value), parsed_name: null, required_level: null, required_stage: null, truegold: false }
}

function normaliseName(value) {
  return text(value).toLowerCase().replace(/\s+/g, ' ').replace(/\s*lv\.?\s*\d+$/i, '').trim()
}

function writeCsv(file, rows) {
  const fields = ['sheet', 'row', 'record_id', 'building_key', 'column', 'issue_code', 'severity', 'message', 'suggested_resolution', 'source_text', 'parsed_name', 'required_level', 'resolved_building_key', 'resolution_confidence', 'unresolved_reason']
  const esc = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  fs.writeFileSync(file, [fields.join(','), ...rows.map(row => fields.map(field => esc(row[field])).join(','))].join('\n') + '\n')
}

if (!input || !fs.existsSync(input)) {
  const report = { schemaVersion: 2, dataset: 'buildings', sourceFile: input ?? null, status: 'blocked', findings: [{ severity: 'Blocking Error', code: 'source_workbook_missing', message: 'Owner-supplied workbook was not found; no workbook was mutated.', suggested_resolution: 'Provide the workbook at the requested path.' }], sheets: [], expected }
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); process.exit(2)
}

const buffer = fs.readFileSync(input)
const fingerprint = crypto.createHash('sha256').update(buffer).digest('hex')
const workbook = XLSX.read(buffer, { cellFormula: true, cellNF: true, cellDates: true, bookVBA: true, cellStyles: true })
const findings = []
const sheets = []
const data = {}
const workbookMetadata = { properties: workbook.Props ?? {}, customProperties: workbook.Custprops ?? {}, workbookProperties: workbook.Workbook?.WBProps ?? {}, hasMacros: Boolean(workbook.vbaraw), externalLinks: workbook.Workbook?.Links ?? [] }

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false })
  const headers = (rows[0] ?? []).map(text)
  const body = rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null])))
  const lastNonBlank = rows.reduce((last, row, index) => row.some(value => !blank(value)) ? index : last, -1)
  const blankTrailingRows = Math.max(0, rows.length - 1 - lastNonBlank)
  const formulaCells = Object.entries(sheet).filter(([, cell]) => cell && typeof cell === 'object' && cell.f).map(([address, cell]) => ({ address, formula: cell.f }))
  const hiddenRows = Object.entries(sheet['!rows'] ?? {}).filter(([, row]) => row?.hidden).map(([index]) => Number(index) + 1)
  const hiddenColumns = Object.entries(sheet['!cols'] ?? {}).filter(([, column]) => column?.hidden).map(([index]) => Number(index))
  sheets.push({ name, rowCount: body.length - blankTrailingRows, columnCount: headers.length, headers, blankTrailingRows, mergedCells: sheet['!merges'] ?? [], hiddenRows, hiddenColumns, formulas: formulaCells })
  data[name] = body.slice(0, body.length - blankTrailingRows)
}

for (const name of requiredSheets) if (!workbook.SheetNames.includes(name)) issue(findings, 'Blocking Error', 'missing_sheet', `Expected sheet ${name} is missing.`, { sheet: name }, `Add the required ${name} sheet.`)
for (const name of workbook.SheetNames.filter(name => !requiredSheets.includes(name))) issue(findings, 'Warning', 'unexpected_sheet', `Unexpected sheet ${name} is present.`, { sheet: name }, 'Confirm whether the additional sheet is intentional.')
for (const sheet of sheets) {
  if (sheet.mergedCells.length) issue(findings, 'Warning', 'merged_cells_present', `${sheet.name} contains merged cells.`, { sheet: sheet.name }, 'Flatten merged cells before import if they affect tabular data.')
  if (sheet.hiddenRows.length || sheet.hiddenColumns.length) issue(findings, 'Warning', 'hidden_rows_or_columns', `${sheet.name} contains hidden rows or columns.`, { sheet: sheet.name }, 'Review hidden content before import.')
  if (sheet.formulas.length) issue(findings, 'Blocking Error', 'formulas_present', `${sheet.name} contains formula cells.`, { sheet: sheet.name }, 'Replace formulas with verified values before import.')
}
if (workbookMetadata.hasMacros) issue(findings, 'Blocking Error', 'macros_present', 'Workbook contains VBA macros.', {}, 'Remove macros before import.')
if (workbookMetadata.externalLinks.length) issue(findings, 'Blocking Error', 'external_links_present', 'Workbook contains external links.', {}, 'Remove external links before import.')

const catalog = data.buildings_catalog ?? []
const progression = data.buildings_import ?? []
const catalogKeys = new Map()
const importKeys = new Map()
const catalogNames = new Map()
for (const [index, row] of catalog.entries()) {
  const ctx = rowContext('buildings_catalog', index + 2, row)
  const key = text(row.building_key)
  if (catalogKeys.has(key) && key) issue(findings, 'Blocking Error', 'duplicate_building_key', `Duplicate building_key ${key}.`, ctx, 'Keep one catalog row per canonical building_key.')
  else if (key) catalogKeys.set(key, index + 2)
  if (key) catalogNames.set(normaliseName(row.building_name), key)
  if (blank(row.building_name)) issue(findings, 'Blocking Error', 'catalog_name_missing', 'building_name is required.', { ...ctx, column: 'building_name' }, 'Provide a canonical building name.')
  if (!categories.has(text(row.category))) issue(findings, 'Blocking Error', 'invalid_category', `Unsupported category ${text(row.category)}.`, { ...ctx, column: 'category' }, 'Use a category from the Buildings contract.')
  if (blank(row.description)) issue(findings, 'Blocking Error', 'catalog_description_missing', 'description is required.', { ...ctx, column: 'description' }, 'Provide a non-empty description.')
  if (!isInteger(row.standard_max_level) || number(row.standard_max_level) < 0) issue(findings, 'Blocking Error', 'invalid_standard_max_level', 'standard_max_level must be a non-negative integer.', { ...ctx, column: 'standard_max_level' }, 'Provide a valid maximum standard level.')
  if (!['TRUE', 'FALSE', 'true', 'false', '1', '0'].includes(text(row.truegold_supported))) issue(findings, 'Blocking Error', 'invalid_truegold_supported', 'truegold_supported must be boolean.', { ...ctx, column: 'truegold_supported' }, 'Use TRUE or FALSE.')
  if (!isInteger(row.record_count) || number(row.record_count) < 0) issue(findings, 'Blocking Error', 'invalid_declared_record_count', 'record_count must be a non-negative integer.', { ...ctx, column: 'record_count' }, 'Reconcile record_count with progression rows.')
  if (!/^https?:\/\/\S+$/i.test(text(row.source_url))) issue(findings, 'Blocking Error', 'invalid_url', 'source_url must be an absolute HTTP(S) URL.', { ...ctx, column: 'source_url' }, 'Provide a valid source URL.')
  if (blank(row.verification_note)) issue(findings, 'Warning', 'verification_note_missing', 'verification_note is empty.', { ...ctx, column: 'verification_note' }, 'Retain or add provenance notes.')
}
for (const [index, row] of progression.entries()) {
  const ctx = rowContext('buildings_import', index + 2, row)
  const recordId = text(row.record_id)
  if (importKeys.has(recordId) && recordId) issue(findings, 'Blocking Error', 'duplicate_record_id', `Duplicate record_id ${recordId}.`, ctx, 'Keep one progression row per record_id.')
  else if (recordId) importKeys.set(recordId, index + 2)
  if (!catalogKeys.has(text(row.building_key))) issue(findings, 'Blocking Error', 'orphan_building_key', `No catalog building exists for ${text(row.building_key)}.`, { ...ctx, column: 'building_key' }, 'Use an existing canonical building_key or add an owner-approved catalog record.')
  if (blank(row.building_name)) issue(findings, 'Blocking Error', 'progression_name_missing', 'building_name is required.', { ...ctx, column: 'building_name' }, 'Provide the canonical building name.')
  if (!categories.has(text(row.category))) issue(findings, 'Blocking Error', 'invalid_category', `Unsupported category ${text(row.category)}.`, { ...ctx, column: 'category' }, 'Use a category from the Buildings contract.')
  if (!phases.has(text(row.progression_phase))) issue(findings, 'Blocking Error', 'invalid_progression_phase', `Unsupported progression_phase ${text(row.progression_phase)}.`, { ...ctx, column: 'progression_phase' }, 'Use normal, pre_truegold, or truegold.')
  for (const column of ['base_level', 'truegold_tier', 'stage']) if (!blank(row[column]) && !isInteger(row[column])) issue(findings, 'Blocking Error', 'invalid_progression_integer', `${column} must be an integer when supplied.`, { ...ctx, column }, 'Provide a valid integer or leave the field blank.')
  for (const column of numericColumns) if (!blank(row[column]) && !isNumber(row[column])) issue(findings, 'Blocking Error', 'invalid_numeric', `${column} must be numeric when supplied.`, { ...ctx, column }, 'Provide a numeric value or leave the field blank.')
  for (const column of nonNegativeColumns) if (!blank(row[column]) && isNumber(row[column]) && number(row[column]) < 0) issue(findings, 'Blocking Error', 'negative_value', `${column} cannot be negative.`, { ...ctx, column }, 'Use a non-negative value.')
  let requirements
  try { requirements = JSON.parse(text(row.requirements_json)) } catch { issue(findings, 'Blocking Error', 'invalid_requirements_json', 'requirements_json must be valid JSON.', { ...ctx, column: 'requirements_json' }, 'Provide a JSON array preserving the source requirement text.') }
  if (requirements !== undefined && !Array.isArray(requirements)) issue(findings, 'Blocking Error', 'requirements_json_not_array', 'requirements_json must be a JSON array.', { ...ctx, column: 'requirements_json' }, 'Provide a JSON array preserving the source requirement text.')
  if (!/^https?:\/\/\S+$/i.test(text(row.source_url))) issue(findings, 'Blocking Error', 'invalid_url', 'source_url must be an absolute HTTP(S) URL.', { ...ctx, column: 'source_url' }, 'Provide a valid source URL.')
  if (blank(row.verification_status)) issue(findings, 'Blocking Error', 'verification_status_missing', 'verification_status is required.', { ...ctx, column: 'verification_status' }, 'Provide verification status.')
  if (!blank(row.verified_on) && Number.isNaN(Date.parse(text(row.verified_on)))) issue(findings, 'Blocking Error', 'invalid_date', 'verified_on must be a valid date.', { ...ctx, column: 'verified_on' }, 'Use an ISO date.')
  if (blank(row.quality_flags)) issue(findings, 'Warning', 'quality_flags_missing', 'quality_flags is empty.', { ...ctx, column: 'quality_flags' }, 'Retain source quality flags where available.')
  if (blank(row.original_row) || !isInteger(row.original_row)) issue(findings, 'Blocking Error', 'original_row_invalid', 'original_row must be an integer.', { ...ctx, column: 'original_row' }, 'Retain the source workbook row number.')
  if (text(row.progression_phase) === 'truegold' && (blank(row.truegold_tier) || blank(row.stage))) issue(findings, 'Blocking Error', 'truegold_identity_incomplete', 'Truegold rows require both truegold_tier and stage.', ctx, 'Provide the Truegold tier and stage.')
  if (text(row.progression_phase) === 'normal' && (!blank(row.truegold_tier) || !blank(row.stage))) issue(findings, 'Blocking Error', 'invalid_standard_truegold_transition', 'Standard rows cannot carry Truegold tier or stage.', ctx, 'Clear Truegold identity fields from standard rows.')
}

const byBuilding = new Map()
for (const row of progression) { const key = text(row.building_key); if (!byBuilding.has(key)) byBuilding.set(key, []); byBuilding.get(key).push(row) }
for (const [index, row] of catalog.entries()) {
  const actual = byBuilding.get(text(row.building_key)) ?? []
  if (!actual.length) issue(findings, 'Blocking Error', 'catalog_without_progression', `Catalog building ${text(row.building_key)} has no progression rows.`, rowContext('buildings_catalog', index + 2, row), 'Provide progression rows or remove the catalog record with owner approval.')
  if (isInteger(row.record_count) && number(row.record_count) !== actual.length) issue(findings, 'Blocking Error', 'record_count_mismatch', `Declared record_count ${number(row.record_count)} does not match ${actual.length} progression rows.`, rowContext('buildings_catalog', index + 2, row), 'Reconcile the catalog record_count.')
  const names = new Set(actual.map(item => text(item.building_name))); if (names.size > 1) issue(findings, 'Blocking Error', 'conflicting_building_names', `Progression rows contain conflicting building names: ${[...names].join(', ')}.`, { sheet: 'buildings_import', building_key: text(row.building_key) }, 'Use one canonical building name.')
  const cats = new Set(actual.map(item => text(item.category))); if (cats.size > 1) issue(findings, 'Blocking Error', 'conflicting_categories', `Progression rows contain conflicting categories: ${[...cats].join(', ')}.`, { sheet: 'buildings_import', building_key: text(row.building_key) }, 'Use one canonical category.')
  const identities = new Set(); for (const item of actual) { const identity = [text(item.progression_phase), text(item.base_level), text(item.truegold_tier), text(item.stage)].join('|'); if (identities.has(identity)) issue(findings, 'Blocking Error', 'duplicate_level_identity', `Duplicate level identity ${identity}.`, { sheet: 'buildings_import', record_id: text(item.record_id), building_key: text(item.building_key) }, 'Keep one row per progression identity.'); identities.add(identity) }
  const normal = actual.filter(item => text(item.progression_phase) === 'normal').map(item => number(item.base_level)).filter(Number.isInteger).sort((a, b) => a - b)
  const expectedLevels = Array.from({ length: normal.length ? Math.max(...normal) - Math.min(...normal) + 1 : 0 }, (_, n) => n + (normal.length ? Math.min(...normal) : 0))
  if (normal.length && normal.join(',') !== expectedLevels.join(',')) issue(findings, 'Warning', 'standard_progression_gap', `Standard levels are not continuous from 0: ${normal.join(', ')}.`, { sheet: 'buildings_import', building_key: text(row.building_key) }, 'Review missing or intentionally unavailable standard levels.')
}

const prerequisiteRows = []
const prerequisiteAliases = new Map([...catalog].map(row => [normaliseName(row.building_name), text(row.building_key)]))
const aliasFixes = new Map([['house 1', null], ['house 2', null], ['house 3', null], ['sawmill', null], ['quarry', null], ['iron mine', null], ['mill', null], ['hero hall', null]])
for (const [index, row] of progression.entries()) {
  let values = []; try { values = JSON.parse(text(row.requirements_json)) } catch { values = [] }
  for (const value of values) {
    const parsed = parsePrerequisite(value); const resolved = parsed.parsed_name ? (prerequisiteAliases.get(normaliseName(parsed.parsed_name)) ?? aliasFixes.get(normaliseName(parsed.parsed_name))) : null
    const resolutionConfidence = resolved ? (prerequisiteAliases.has(normaliseName(parsed.parsed_name)) ? 'high' : 'low') : 'none'
    const unresolvedReason = !parsed.parsed_name ? 'Could not parse prerequisite name and level.' : resolved ? '' : 'No canonical building_key exists in the supplied catalog.'
    const item = { sheet: 'buildings_import', row: index + 2, record_id: text(row.record_id), building_key: text(row.building_key), source_text: parsed.source_text, parsed_name: parsed.parsed_name, required_level: parsed.required_level, required_stage: parsed.required_stage, resolved_building_key: resolved, resolution_confidence: resolutionConfidence, unresolved_reason: unresolvedReason }
    prerequisiteRows.push(item)
    if (!resolved) issue(findings, 'Warning', 'unresolved_prerequisite', `Prerequisite ${parsed.source_text} could not be mapped to a canonical building_key.`, item, 'Resolve editorially or preserve the original source text without creating a fictitious building.')
    else if (resolutionConfidence === 'low') issue(findings, 'Auto-correctable', 'prerequisite_alias_candidate', `Prerequisite ${parsed.source_text} matched a known alias but not a catalog building.`, item, 'Confirm the alias mapping before publication.')
  }
}

for (const row of progression) if (text(row.building_name) !== text(catalog.find(item => text(item.building_key) === text(row.building_key))?.building_name)) issue(findings, 'Blocking Error', 'cross_sheet_name_mismatch', 'Progression building_name does not match its catalog building.', rowContext('buildings_import', progression.indexOf(row) + 2, row), 'Use the catalog building_name.')
const counts = { catalog: catalog.length, progression: progression.length, totalData: catalog.length + progression.length, warnings: findings.filter(item => item.severity === 'Warning').length, informational: findings.filter(item => item.severity === 'Informational').length, autoCorrectable: findings.filter(item => item.severity === 'Auto-correctable').length, blockingErrors: findings.filter(item => item.severity === 'Blocking Error').length, unresolvedPrerequisites: prerequisiteRows.filter(item => !item.resolved_building_key).length, prerequisiteMappings: prerequisiteRows.filter(item => item.resolved_building_key).length }
const report = { schemaVersion: 2, dataset: 'buildings', sourceFile: path.resolve(input), source: { filename: path.basename(input), sizeBytes: buffer.length, sha256: fingerprint, workbookType: path.extname(input).slice(1), metadata: workbookMetadata }, status: counts.blockingErrors ? 'failed' : 'passed', expected, sheets, counts, findings, prerequisiteResolution: { mappings: counts.prerequisiteMappings, unresolved: counts.unresolvedPrerequisites, rows: prerequisiteRows }, transformations: [], comparison: { newRecords: null, changedRecords: null, unchangedRecords: null, missingExistingRecords: null, note: 'Comparison requires a readable live/staged Buildings baseline.' }, publication: { status: 'gated', ownerApprovalRequired: true, published: false, missingRecordPolicy: 'retain_existing' } }
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2))
const reportDir = path.dirname(output)
fs.writeFileSync(path.join(reportDir, 'buildings-preflight-summary.md'), `# Buildings preflight\n\n- Source: ${path.basename(input)}\n- SHA-256: ${fingerprint}\n- Sheets: ${workbook.SheetNames.join(', ')}\n- Catalog records: ${counts.catalog}\n- Progression records: ${counts.progression}\n- Blocking errors: ${counts.blockingErrors}\n- Warnings: ${counts.warnings}\n- Informational findings: ${counts.informational}\n- Auto-correctable findings: ${counts.autoCorrectable}\n- Prerequisite mappings: ${counts.prerequisiteMappings}\n- Unresolved prerequisites: ${counts.unresolvedPrerequisites}\n- Publication: gated pending owner approval\n\n## Findings\n\n${findings.length ? findings.map(item => `- **${item.severity}** ${item.code}: ${item.message}`).join('\n') : 'No findings.'}\n`)
writeCsv(path.join(reportDir, 'buildings-validation-errors.csv'), findings.filter(item => item.severity === 'Blocking Error'))
writeCsv(path.join(reportDir, 'buildings-validation-warnings.csv'), findings.filter(item => item.severity === 'Warning' || item.severity === 'Auto-correctable' || item.severity === 'Informational'))
writeCsv(path.join(reportDir, 'buildings-unresolved-prerequisites.csv'), prerequisiteRows.filter(item => !item.resolved_building_key))
writeCsv(path.join(reportDir, 'buildings-change-preview.csv'), [])
console.log(JSON.stringify(report, null, 2))
