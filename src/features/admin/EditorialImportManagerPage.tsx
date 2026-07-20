import { useState } from 'react'
import * as XLSX from 'xlsx'
import { buildingsContract } from '../../../shared/data-pipeline/buildingsContract'
import type { DatasetValidationResult } from '../../../shared/data-pipeline/contracts'
import { useAuth } from '../../context/AuthContext'

function parseWorkbook(file: File): Promise<{ sheets: Record<string, Record<string, unknown>[]>; names: string[] }> {
  return file.arrayBuffer().then(buffer => {
    const workbook = XLSX.read(buffer, { cellDates: true, bookVBA: false })
    const sheets: Record<string, Record<string, unknown>[]> = {}
    for (const name of workbook.SheetNames) sheets[name] = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: null, raw: false })
    return { sheets, names: workbook.SheetNames }
  })
}

export function EditorialImportManagerPage() {
  const { session } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<DatasetValidationResult | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [parsedSheets, setParsedSheets] = useState<Record<string, Record<string, unknown>[]>>({})
  const [fingerprint, setFingerprint] = useState('')
  const [stageResult, setStageResult] = useState<{ importRunId: string; state: string; stagedCatalog: number; stagedProgression: number; warningRows: number; rejectedRows: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [staging, setStaging] = useState(false)
  const [error, setError] = useState('')
  async function preview(nextFile: File | null) {
    setFile(nextFile); setResult(null); setStageResult(null); setParsedSheets({}); setFingerprint(''); setError('')
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
    }
    catch (value) { setError(value instanceof Error ? value.message : 'The workbook could not be parsed.') }
    finally { setBusy(false) }
  }
  async function stage() {
    if (!file || !result || !fingerprint || blocking.length > 0) return
    setStaging(true); setError('')
    try {
      const response = await fetch('/api/data-studio/buildings', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ fileFingerprint: fingerprint, originalFilename: file.name, parserVersion: 'forge-buildings-preflight-v2', validationResult: { ...result, counts: { ...result.counts, blockingErrors: blocking.length } }, sourceMetadata: { sizeBytes: file.size, workbookType: 'xlsx' }, sheets: parsedSheets }) })
      const payload = await response.json() as { status: string; data?: typeof stageResult; message?: string }
      if (!response.ok || payload.status !== 'success' || !payload.data) throw new Error(payload.message ?? 'The import could not be staged.')
      setStageResult(payload.data)
    } catch (value) { setError(value instanceof Error ? value.message : 'The import could not be staged.') }
    finally { setStaging(false) }
  }
  const blocking = result?.issues.filter(issue => issue.severity === 'blocking') ?? []
  return <main className="admin-page editorial-import-page">
    <section className="admin-page__header"><p className="admin-page__eyebrow">Forge Data Studio</p><h1>Dataset import</h1><p className="admin-page__intro">Upload, validate and preview a dataset before it enters the existing editorial version workflow. Nothing is staged or published from this preview.</p></section>
    <section className="editorial-admin-card"><div className="editorial-admin-card__heading"><div><p className="editorial-admin-eyebrow">Dataset contract v{buildingsContract.version}</p><h2>Buildings</h2></div><span className="status-badge">Preview only</span></div><p>{buildingsContract.description} Accepted formats: XLSX and CSV. Maximum file size: 25 MB.</p><label className="button button--primary" htmlFor="dataset-file">Choose workbook<input id="dataset-file" type="file" accept=".xlsx,.csv" hidden onChange={event => void preview(event.target.files?.[0] ?? null)} /></label>{file && <p role="status">Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB</p>}{busy && <p role="status" aria-live="polite">Parsing and validating…</p>}{error && <div className="error-state" role="alert">{error}</div>}</section>
    {sheetNames.length > 0 && <section className="editorial-admin-card"><h2>Detected sheets</h2><p>{sheetNames.join(' · ')}</p><p>Required: {buildingsContract.acceptedSheets.join(', ')}</p></section>}
    {result && <section className="editorial-admin-card" aria-live="polite"><div className="editorial-admin-card__heading"><h2>Validation preview</h2><strong>{result.summary}</strong></div><div className="publication-operations-grid"><div><strong>{result.counts.totalRows}</strong><span>Total rows</span></div><div><strong>{result.counts.validRows}</strong><span>Valid rows</span></div><div><strong>{result.counts.warningRows}</strong><span>Warnings</span></div><div><strong>{result.counts.rejectedRows}</strong><span>Rejected</span></div></div>{blocking.length > 0 && <div className="error-state" role="alert"><strong>Blocking errors ({blocking.length})</strong><ul>{blocking.slice(0, 25).map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.sheet}{issue.row ? ` row ${issue.row}` : ''}{issue.column ? ` / ${issue.column}` : ''}: {issue.message}</li>)}</ul></div>}{blocking.length === 0 && !stageResult && <><p className="success-state" role="status">Validation passed. This stages the valid source rows for editorial review; publication remains a separate authorised action.</p><button type="button" className="button button--primary" onClick={() => void stage()} disabled={staging}>{staging ? 'Staging…' : 'Stage for editorial review'}</button></>}{stageResult && <div className="success-state" role="status"><strong>Staged import run {stageResult.importRunId}</strong><p>{stageResult.stagedCatalog} catalog records · {stageResult.stagedProgression} progression records · {stageResult.warningRows} warning rows · {stageResult.rejectedRows} rejected rows</p><p>State: {stageResult.state}. Publication remains gated pending owner approval.</p></div>}</section>}
  </main>
}
