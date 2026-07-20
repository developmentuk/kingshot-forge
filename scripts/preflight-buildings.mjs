import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

const input = process.argv[2]
const output = process.argv[3] ?? path.resolve('artifacts/buildings-preflight.json')
const report = { schemaVersion: 1, dataset: 'buildings', sourceFile: input ?? null, status: 'blocked', findings: [], sheets: [], expected: { buildings_catalog: 10, buildings_import: 587, totalDataRows: 597 } }
if (!input || !fs.existsSync(input)) { report.findings.push({ severity: 'blocking', code: 'source_workbook_missing', message: 'Owner-supplied workbook was not found; no workbook was mutated.' }); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); process.exit(2) }
const workbook = XLSX.readFile(input, { cellFormula: false, cellNF: true, cellDates: true, bookVBA: false })
report.sheets = workbook.SheetNames.map(name => { const sheet = workbook.Sheets[name]; const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false }); return { name, rowCount: Math.max(0, rows.length - 1), columnCount: rows[0]?.length ?? 0, hasMerges: Boolean(sheet['!merges']?.length), formulas: Object.values(sheet).filter(cell => cell && typeof cell === 'object' && 'f' in cell).length } })
for (const expected of ['buildings_catalog', 'buildings_import', 'verification_notes']) if (!workbook.SheetNames.includes(expected)) report.findings.push({ severity: 'blocking', code: 'missing_sheet', sheet: expected, message: `Expected sheet ${expected} is missing.` })
report.status = report.findings.some(item => item.severity === 'blocking') ? 'failed' : 'passed'
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2))

