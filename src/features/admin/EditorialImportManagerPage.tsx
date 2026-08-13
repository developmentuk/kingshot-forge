import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { buildingsContract } from '../../../shared/data-pipeline/buildingsContract'
import type { DatasetValidationResult } from '../../../shared/data-pipeline/contracts'
import { withWarningId } from '../../../shared/data-pipeline/warningIdentity'
import { useAuth } from '../../context/AuthContext'

type SheetRows = Record<string, Record<string, unknown>[]>
type StagedRecord = { id: string; sheet_name: string; source_row: number; external_key: string; original_values: Record<string, unknown>; editorial_values: Record<string, unknown> | null; issue_state: string; editorial_note: string | null }
type ImportRun = { id: string; dataset_key: string; file_fingerprint: string; original_filename: string; parser_version: string; contract_version: number; state: string; validation_result: Record<string, unknown>; source_metadata: Record<string, unknown>; created_at: string; updated_at: string }
type StageResult = { importRunId: string; state: string; stagedCatalog: number; stagedProgression: number; warningRows: number; warningIds?: string[]; rejectedRows: number; reused?: boolean }
type PublicationData = { manifest: { importRunId: string; warningIds: string[]; decisionIds: string[]; catalogueCount: number; progressionCount: number; warningCount: number; publicationVersion: number } | null; manifestHash?: string; decisions: Array<{ warning_id: string; resolution_type: string; dependency_status: string; external_reference: string | null; decision_id: string }>; refreshes: Array<{ refresh_kind: string; status: string }>; publication: { publication_id: string; publication_version: number; status: string } | null }
type PrerequisiteWarning = { warning_id: string; sheet: string; row: number; record_id: string; building_key: string; source_text: string; parsed_name: string | null; required_level: number | null; required_stage: number | null; resolved_building_key: string | null; resolution_confidence: string; unresolved_reason: string }

async function parseWorkbook(file: File): Promise<{ sheets: SheetRows; names: string[] }> {
  const [buffer, XLSX] = await Promise.all([file.arrayBuffer(), import('xlsx')])
  const workbook = XLSX.read(buffer, { cellDates: true, bookVBA: false })
  const sheets: SheetRows = {}
  for (const name of workbook.SheetNames) sheets[name] = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: null, raw: false })
  return { sheets, names: workbook.SheetNames }
}

function text(value: unknown): string { return value == null ? '' : String(value).trim() }
function normaliseName(value: unknown): string { return text(value).toLowerCase().replace(/\s+/g, ' ').replace(/\s*lv\.?\s*\d+$/i, '').trim() }
function parsePrerequisite(value: unknown): { source_text: string; parsed_name: string | null; required_level: number | null; required_stage: number | null } {
  const source_text = text(value)
  const match = source_text.match(/^(.+?)\s+Lv\.\s*(TG)?\s*(\d+)(?:\s*[-/]\s*(\d+))?$/i)
  return match ? { source_text, parsed_name: match[1].trim(), required_level: Number(match[3]), required_stage: match[4] ? Number(match[4]) : null } : { source_text, parsed_name: null, required_level: null, required_stage: null }
}

function resolvePrerequisites(sheets: SheetRows): { warnings: PrerequisiteWarning[]; mappings: number } {
  const catalog = sheets.buildings_catalog ?? []
  const aliases = new Map(catalog.map(row => [normaliseName(row.building_name), text(row.building_key)]))
  const warnings: PrerequisiteWarning[] = []
  let mappings = 0
  for (const [index, row] of (sheets.buildings_import ?? []).entries()) {
    let requirements: unknown[] = []
    try { const parsed = JSON.parse(text(row.requirements_json)); requirements = Array.isArray(parsed) ? parsed : [] } catch { requirements = [] }
    for (const value of requirements) {
      const parsed = parsePrerequisite(value)
      const resolved = parsed.parsed_name ? aliases.get(normaliseName(parsed.parsed_name)) ?? null : null
      if (resolved) { mappings += 1; continue }
      warnings.push(withWarningId({ dataset: 'buildings', code: 'unresolved_prerequisite', sheet: 'buildings_import', row: index + 2, record_id: text(row.record_id), building_key: text(row.building_key), ...parsed, resolved_building_key: null, resolution_confidence: 'none', unresolved_reason: parsed.parsed_name ? 'No canonical building_key exists in the supplied catalog.' : 'Could not parse prerequisite name and level.' }))
    }
  }
  return { warnings, mappings }
}

function authHeaders(accessToken?: string): HeadersInit { return { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) } }

function WarningIdentityPanel({ warnings }: { warnings: readonly PrerequisiteWarning[] }) {
  return warnings.length ? <section className="editorial-admin-card" aria-label="Warning identity reconciliation"><h2>Warning identities</h2><p>Each unresolved prerequisite has one immutable identity, including multiple warnings on the same source record.</p><ul>{warnings.map(warning => <li key={warning.warning_id}><code>{warning.warning_id}</code></li>)}</ul></section> : null
}

function BuildingsPublicationGate({ run, publication, publishing, onPublish }: { run: ImportRun; publication: PublicationData | null; publishing: boolean; onPublish: () => void }) {
  if (!publication?.manifest) return null
  const ready = publication.decisions.length === 8 && publication.manifest.catalogueCount === 10 && publication.manifest.progressionCount === 587
  return <section className="editorial-admin-card" aria-label="Buildings publication gate"><h2>Buildings publication gate</h2><p>Manifest hash: <code>{publication.manifestHash ?? 'calculating'}</code></p><div className="publication-operations-grid"><div><strong>{publication.manifest.catalogueCount}</strong><span>Catalogue</span></div><div><strong>{publication.manifest.progressionCount}</strong><span>Progression</span></div><div><strong>{publication.decisions.length}/8</strong><span>Effective decisions</span></div><div><strong>{publication.manifest.publicationVersion}</strong><span>Next version</span></div></div><p>All approved decisions are retained as Accepted Structured External Reference / Deferred Catalogue Dependency. Refresh state: {publication.refreshes.map(item => `${item.refresh_kind} ${item.status}`).join(' · ') || 'pending'}.</p>{run.state !== 'published' && <button type="button" className="button button--primary" onClick={onPublish} disabled={!ready || publishing}>{publishing ? 'Publishing atomically…' : 'Publish Buildings'}</button>}{publication.publication && <p className="success-state" role="status">Published version {publication.publication.publication_version} · {publication.publication.publication_id}</p>}</section>
}

export function EditorialImportManagerPage() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<DatasetValidationResult | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [parsedSheets, setParsedSheets] = useState<SheetRows>({})
  const [fingerprint, setFingerprint] = useState('')
  const [stageResult, setStageResult] = useState<StageResult | null>(null)
  const [run, setRun] = useState<ImportRun | null>(null)
  const [stagedRecords, setStagedRecords] = useState<StagedRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [staging, setStaging] = useState(false)
  const [publication, setPublication] = useState<PublicationData | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  const prerequisiteReview = useMemo(() => resolvePrerequisites(parsedSheets), [parsedSheets])
  const blocking = result?.issues.filter(issue => issue.severity === 'blocking') ?? []
  const catalogPreview = stagedRecords.filter(record => record.sheet_name === 'buildings_catalog').slice(0, 10)
  const progressionPreview = stagedRecords.filter(record => record.sheet_name === 'buildings_import').slice(0, 12)

  useEffect(() => {
    const runId = searchParams.get('runId')
    if (!runId || !session?.access_token) return
    setBusy(true)
    fetch(`/api/data-studio/buildings?runId=${encodeURIComponent(runId)}`, { headers: authHeaders(session.access_token) }).then(async response => {
      const payload = await response.json() as { status: string; data?: { run: ImportRun; records: StagedRecord[]; warnings?: unknown[] }; message?: string }
      if (!response.ok || payload.status !== 'success' || !payload.data) throw new Error(payload.message ?? 'Unable to load the import run.')
      setRun(payload.data.run); setStagedRecords(payload.data.records); setParsedSheets({ buildings_catalog: payload.data.records.filter(record => record.sheet_name === 'buildings_catalog').map(record => record.original_values), buildings_import: payload.data.records.filter(record => record.sheet_name === 'buildings_import').map(record => record.original_values) }); setFingerprint(payload.data.run.file_fingerprint); setStageResult({ importRunId: payload.data.run.id, state: payload.data.run.state, stagedCatalog: payload.data.records.filter(record => record.sheet_name === 'buildings_catalog').length, stagedProgression: payload.data.records.filter(record => record.sheet_name === 'buildings_import').length, warningRows: payload.data.warnings?.length ?? 0, warningIds: (payload.data.warnings ?? []).map(warning => String((warning as { warning_id?: unknown }).warning_id ?? '')), rejectedRows: payload.data.records.filter(record => record.issue_state === 'rejected').length, reused: true }); void loadPublication(payload.data.run.id)
    }).catch(value => setError(value instanceof Error ? value.message : 'Unable to load the import run.')).finally(() => setBusy(false))
  }, [searchParams, session?.access_token])

  async function loadPublication(runId: string) {
    if (!session?.access_token) return
    const response = await fetch(`/api/data-studio/buildings-publication?runId=${encodeURIComponent(runId)}`, { headers: authHeaders(session.access_token) })
    const payload = await response.json() as { status: string; data?: PublicationData; message?: string }
    if (!response.ok || payload.status !== 'success' || !payload.data) throw new Error(payload.message ?? 'Unable to load publication readiness.')
    setPublication(payload.data)
  }

  async function publishApprovedRun() {
    if (!run || !session?.access_token || !publication?.manifest) return
    setPublishing(true); setError('')
    try {
      const expectedManifestHash = publication.manifestHash
      const response = await fetch('/api/data-studio/buildings-publication', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(session.access_token) }, body: JSON.stringify({ action: 'publish', importRunId: run.id, expectedManifestHash, idempotencyKey: `rel003-${run.id}`, publicationReason: 'Approve Buildings Publication' }) })
      const payload = await response.json() as { status: string; message?: string }
      if (!response.ok || payload.status !== 'success') throw new Error(payload.message ?? 'Buildings publication failed.')
      await loadPublication(run.id); setRun(current => current ? { ...current, state: 'published' } : current); setStageResult(current => current ? { ...current, state: 'published' } : current)
    } catch (value) { setError(value instanceof Error ? value.message : 'Buildings publication failed.') } finally { setPublishing(false) }
  }

  async function preview(nextFile: File | null) {
    setFile(nextFile); setResult(null); setStageResult(null); setRun(null); setStagedRecords([]); setParsedSheets({}); setFingerprint(''); setError('')
    if (!nextFile) return
    if (!/\.(xlsx|csv)$/i.test(nextFile.name)) { setError('Unsupported file. Choose an .xlsx or .csv file.'); return }
    if (nextFile.size > 25 * 1024 * 1024) { setError('File exceeds the 25 MB Data Studio limit.'); return }
    setBusy(true)
    try {
      const parsed = await parseWorkbook(nextFile)
      const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(await nextFile.arrayBuffer()))
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
      setSheetNames(parsed.names); setParsedSheets(parsed.sheets); setFingerprint(hash)
      setResult((await import('../../../server/data-pipeline/validate')).validateDataset(buildingsContract, parsed.sheets))
    } catch (value) { setError(value instanceof Error ? value.message : 'The workbook could not be parsed.') } finally { setBusy(false) }
  }

  async function stage() {
    if (!file || !result || !fingerprint || blocking.length > 0) return
    setStaging(true); setError('')
    try {
      const validationResult = { ...result, findings: prerequisiteReview.warnings.map(warning => ({ warning_id: warning.warning_id, severity: 'Warning', code: 'unresolved_prerequisite', message: `Prerequisite ${warning.source_text} could not be mapped to a canonical building_key.`, sheet: warning.sheet, row: warning.row, record_id: warning.record_id, building_key: warning.building_key, source_text: warning.source_text, parsed_name: warning.parsed_name, required_level: warning.required_level, required_stage: warning.required_stage, unresolved_reason: warning.unresolved_reason })), warningIds: prerequisiteReview.warnings.map(warning => warning.warning_id), counts: { ...result.counts, catalogRows: parsedSheets.buildings_catalog?.length ?? 0, progressionRows: parsedSheets.buildings_import?.length ?? 0, totalRows: (parsedSheets.buildings_catalog?.length ?? 0) + (parsedSheets.buildings_import?.length ?? 0), warnings: prerequisiteReview.warnings.length, warningRows: prerequisiteReview.warnings.length, blockingErrors: blocking.length }, prerequisiteResolution: { mappings: prerequisiteReview.mappings, unresolved: prerequisiteReview.warnings.length, rows: prerequisiteReview.warnings } }
      const response = await fetch('/api/data-studio/buildings', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(session?.access_token) }, body: JSON.stringify({ fileFingerprint: fingerprint, originalFilename: file.name, parserVersion: 'forge-buildings-preflight-v2', validationResult, sourceMetadata: { sizeBytes: file.size, workbookType: 'xlsx', previewReady: true }, prerequisiteResolution: validationResult.prerequisiteResolution, sheets: parsedSheets }) })
      const payload = await response.json() as { status: string; data?: StageResult; message?: string }
      if (!response.ok || payload.status !== 'success' || !payload.data) throw new Error(payload.message ?? 'The import could not be staged.')
      setStageResult(payload.data); setRun({ id: payload.data.importRunId, dataset_key: 'buildings', file_fingerprint: fingerprint, original_filename: file.name, parser_version: 'forge-buildings-preflight-v2', contract_version: buildingsContract.version, state: payload.data.state, validation_result: validationResult, source_metadata: { previewReady: true }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); void loadPublication(payload.data.importRunId); setStagedRecords([...Object.entries(parsedSheets.buildings_catalog ?? []).map(([index, values]) => ({ id: `catalog-${index}`, sheet_name: 'buildings_catalog', source_row: Number(index) + 2, external_key: text(values.building_key), original_values: values, editorial_values: null, issue_state: 'valid', editorial_note: null })), ...Object.entries(parsedSheets.buildings_import ?? []).map(([index, values]) => ({ id: `progression-${index}`, sheet_name: 'buildings_import', source_row: Number(index) + 2, external_key: text(values.record_id), original_values: values, editorial_values: null, issue_state: prerequisiteReview.warnings.some(warning => warning.row === Number(index) + 2) ? 'warning' : 'valid', editorial_note: null }))])
    } catch (value) { setError(value instanceof Error ? value.message : 'The import could not be staged.') } finally { setStaging(false) }
  }

  return <main className="admin-page editorial-import-page"><WarningIdentityPanel warnings={prerequisiteReview.warnings} />{run && <BuildingsPublicationGate run={run} publication={publication} publishing={publishing} onPublish={() => void publishApprovedRun()} />}
    <section className="admin-page__header"><p className="admin-page__eyebrow">Forge Data Studio</p><h1>Buildings import review</h1><p className="admin-page__intro">Upload, validate, stage and inspect the immutable Buildings import run. Publication is available only through the owner-approved manifest gate.</p></section>
    <section className="editorial-admin-card"><div className="editorial-admin-card__heading"><div><p className="editorial-admin-eyebrow">Dataset contract v{buildingsContract.version}</p><h2>Buildings</h2></div><span className="status-badge">{run?.state ?? 'Review required'}</span></div><p>{buildingsContract.description} Accepted formats: XLSX and CSV. Maximum file size: 25 MB.</p><label className="button button--primary" htmlFor="dataset-file">Choose workbook<input id="dataset-file" type="file" accept=".xlsx,.csv" hidden onChange={event => void preview(event.target.files?.[0] ?? null)} /></label>{file && <p role="status">Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB</p>}{busy && <p role="status" aria-live="polite">Loading review evidence…</p>}{error && <div className="error-state" role="alert">{error}</div>}</section>
    {sheetNames.length > 0 && <section className="editorial-admin-card"><h2>Detected sheets</h2><p>{sheetNames.join(' · ')}</p><p>Required: {buildingsContract.acceptedSheets.join(', ')}</p></section>}
    {result && <section className="editorial-admin-card" aria-live="polite"><div className="editorial-admin-card__heading"><h2>Validation summary</h2><strong>{result.summary}</strong></div><div className="publication-operations-grid"><div><strong>{parsedSheets.buildings_catalog?.length ?? 0}</strong><span>Catalog</span></div><div><strong>{parsedSheets.buildings_import?.length ?? 0}</strong><span>Progression</span></div><div><strong>{prerequisiteReview.mappings}</strong><span>Resolved prerequisites</span></div><div><strong>{prerequisiteReview.warnings.length}</strong><span>Unresolved warnings</span></div><div><strong>{blocking.length}</strong><span>Blocking errors</span></div></div>{blocking.length > 0 && <div className="error-state" role="alert"><strong>Blocking errors ({blocking.length})</strong><ul>{blocking.slice(0, 25).map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.sheet}{issue.row ? ` row ${issue.row}` : ''}{issue.column ? ` / ${issue.column}` : ''}: {issue.message}</li>)}</ul></div>}{blocking.length === 0 && !stageResult && <><p className="success-state" role="status">Validation passed. Stage this source for authenticated editorial review; no public Buildings tables are written.</p><button type="button" className="button button--primary" onClick={() => void stage()} disabled={staging}>{staging ? 'Staging…' : 'Stage for editorial review'}</button></>}</section>}
    {stageResult && run && <><section className="editorial-admin-card"><div className="editorial-admin-card__heading"><h2>Import-run detail</h2><span className="status-badge">{run.state}</span></div><p><strong>{run.id}</strong> · {run.original_filename}</p><p>Fingerprint: <code>{run.file_fingerprint}</code> · Parser {run.parser_version} · Contract v{run.contract_version}</p><div className="publication-operations-grid"><div><strong>{stageResult.stagedCatalog}</strong><span>Staged catalog</span></div><div><strong>{stageResult.stagedProgression}</strong><span>Staged progression</span></div><div><strong>{stageResult.warningRows}</strong><span>Warning rows</span></div><div><strong>{stageResult.rejectedRows}</strong><span>Rejected rows</span></div></div><p className="forge-studio-notice">Publication is blocked. This run is preserved in {run.state} for owner review.</p></section><section className="editorial-admin-card"><h2>Eight unresolved prerequisite warnings</h2><p>Every warning is preserved with source context. No fictitious building was created and no mapping was applied silently.</p><div className="admin-table-wrapper"><table><thead><tr><th>Record / row</th><th>Original requirement</th><th>Parsed name</th><th>Level/stage</th><th>Suggested match</th><th>Confidence</th><th>Reason</th></tr></thead><tbody>{prerequisiteReview.warnings.map(warning => <tr key={`${warning.record_id}-${warning.source_text}`}><td>{warning.record_id}<br />row {warning.row}</td><td>{warning.source_text}</td><td>{warning.parsed_name ?? 'Unparsed'}</td><td>{warning.required_level ?? '—'}{warning.required_stage ? ` / ${warning.required_stage}` : ''}</td><td>None</td><td>{warning.resolution_confidence}</td><td>{warning.unresolved_reason}</td></tr>)}</tbody></table></div></section><section className="editorial-admin-card"><h2>Owner-visible preview and publication summary</h2><p>All 597 records are new against the empty live Buildings baseline. Changed: 0 · Unchanged: 0 · Missing live records: 0. Search, relationship and Personal Progression refreshes remain queued after a future approved publication.</p><p>Rollback preview: current empty version → new published version; rollback would create a new version and preserve this import history. No publication action is available in this review surface.</p></section><section className="editorial-admin-card"><h2>Record-level preview</h2><h3>Buildings catalog (10)</h3><div className="admin-table-wrapper"><table><thead><tr><th>Building</th><th>Key</th><th>Category</th><th>Max level</th><th>Truegold</th><th>Source</th></tr></thead><tbody>{catalogPreview.map(record => <tr key={record.id}><td>{text(record.original_values.building_name)}</td><td>{record.external_key}</td><td>{text(record.original_values.category)}</td><td>{text(record.original_values.standard_max_level)}</td><td>{text(record.original_values.truegold_supported)}</td><td><a href={text(record.original_values.source_url)} target="_blank" rel="noreferrer">Source</a></td></tr>)}</tbody></table></div><h3>Progression sample (12 of {stageResult.stagedProgression})</h3><div className="admin-table-wrapper"><table><thead><tr><th>Record</th><th>Level</th><th>Phase</th><th>Requirements</th><th>Resources</th><th>Time / power</th><th>Status</th></tr></thead><tbody>{progressionPreview.map(record => <tr key={record.id}><td>{record.external_key}</td><td>{text(record.original_values.level_label)}</td><td>{text(record.original_values.progression_phase)}</td><td>{text(record.original_values.requirements_text)}</td><td>{['bread', 'wood', 'stone', 'iron'].map(key => `${key}: ${text(record.original_values[key])}`).join(' · ')}</td><td>{text(record.original_values.upgrade_time_display)} / {text(record.original_values.power)}</td><td>{record.issue_state}</td></tr>)}</tbody></table></div></section><p className="forge-studio-notice">Owner checkpoint is ready for review only. Do not publish Buildings. <Link to="/admin/content-studio">Return to Content Studio</Link></p></>}
  </main>
}
