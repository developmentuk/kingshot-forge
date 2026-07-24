import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { AccountLinkOcrResult } from '../../shared/domains/player-identity/accountLinkingOcr'

type EvidenceResponse = { status?: string; data?: { intent: { id: string; storagePath: string }; upload: { bucket: string; path: string; token: string } }; message?: string }

async function digest(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('')
}

async function dimensions(file: File): Promise<{ widthPx: number; heightPx: number }> {
  const bitmap = await createImageBitmap(file)
  const result = { widthPx: bitmap.width, heightPx: bitmap.height }
  bitmap.close()
  return result
}

export default function ScreenshotLinkingPanel({ onCandidate }: { onCandidate: (playerId: string) => void }) {
  const { user, session } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<AccountLinkOcrResult | null>(null)
  const [intentId, setIntentId] = useState<string | null>(null)
  const [completedEvidenceId, setCompletedEvidenceId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editedPlayerId, setEditedPlayerId] = useState('')

  async function callEvidence(body: Record<string, unknown>): Promise<EvidenceResponse> {
    if (!session?.access_token) throw new Error('Sign in is required to use screenshot linking.')
    const response = await fetch('/api/vision-evidence', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const payload = await response.json().catch(() => null) as EvidenceResponse | null
    if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'The secure evidence service is unavailable.')
    return payload
  }

  async function abandon(id: string) {
    try { await callEvidence({ action: 'abandon-upload', intentId: id, reason: 'Account-linking review cancelled or could not complete.' }) } catch { /* best-effort containment; the service expiry remains bounded */ }
  }

  async function cancelEvidence(id: string) {
    await callEvidence({ action: 'cancel-evidence', evidenceId: id, reason: 'Account-linking review cancelled before confirmation.' })
  }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setWorking(true); setError(''); setMessage(''); setResult(null); setIntentId(null); setCompletedEvidenceId(null)
    let createdIntent: string | null = null
    let completedEvidence: string | null = null
    try {
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/tiff'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or TIFF screenshot.')
      const [sha256, image] = await Promise.all([digest(file), dimensions(file)])
      const created = await callEvidence({ action: 'create-upload-intent', ownerUserId: user.id, purpose: 'scan_source', uploadPurpose: 'Account-linking screenshot review', mimeType: file.type, expectedBytes: file.size, consentRecordedAt: new Date().toISOString() })
      const intent = created.data?.intent
      const upload = created.data?.upload
      if (!intent || !upload) throw new Error('The secure upload intent was incomplete.')
      createdIntent = intent.id; setIntentId(intent.id)
      const uploadResult = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
      if (uploadResult.error) throw new Error('The screenshot upload could not be completed.')
      const completed = await callEvidence({ action: 'complete-upload', intentId: intent.id, bytes: file.size, mimeType: file.type, sha256, widthPx: image.widthPx, heightPx: image.heightPx })
      const evidenceId = (completed.data as { id?: string } | undefined)?.id
      if (!evidenceId) throw new Error('The evidence verification response was incomplete.')
      completedEvidence = evidenceId
      setCompletedEvidenceId(evidenceId)
      if (!session?.access_token) throw new Error('Sign in is required to process the screenshot.')
      const response = await fetch('/api/player/link-ocr', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ evidenceId }) })
      const payload = await response.json().catch(() => null) as { status?: string; data?: AccountLinkOcrResult; message?: string } | null
      if (!response.ok || payload?.status !== 'success' || !payload.data) throw new Error(payload?.message ?? 'OCR could not read this screenshot.')
      const safePlayerId = payload.data.candidates.find((candidate) => candidate.field === 'playerId')?.value ?? ''
      setResult(payload.data); setEditedPlayerId(safePlayerId)
      if (/^\d{1,20}$/.test(safePlayerId)) onCandidate(safePlayerId)
      setMessage('Review the suggested Player ID carefully. OCR is supporting evidence, not proof of ownership.')
    } catch (caught) {
      try {
        if (completedEvidence) await cancelEvidence(completedEvidence)
        else if (createdIntent) await abandon(createdIntent)
      } catch { setError('The screenshot could not be cleaned up automatically. Contact Forge support before retrying.') }
      setError(caught instanceof Error ? caught.message : 'Screenshot linking could not be completed.')
    } finally { setWorking(false) }
  }

  async function cancel() {
    try {
      if (completedEvidenceId) await cancelEvidence(completedEvidenceId)
      else if (intentId) await abandon(intentId)
      setIntentId(null); setCompletedEvidenceId(null); setResult(null); onCandidate(''); setMessage('Screenshot review cancelled. No link was changed.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The screenshot could not be cancelled safely.') }
    setEditedPlayerId('')
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
  }

  return <section className="linked-player-screenshot" aria-labelledby="screenshot-linking-title">
    <div><p className="eyebrow">Optional assisted linking</p><h3 id="screenshot-linking-title">Use a profile screenshot</h3><p>Upload one screenshot through the private evidence service. Forge extracts suggestions for review; it never treats OCR as ownership proof.</p></div>
    <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/tiff" onChange={(event) => void handleFile(event)} />
    <div className="linked-player-screenshot__actions"><button type="button" className="button button--secondary" disabled={working || !user} onClick={() => inputRef.current?.click()}>{working ? 'Reading screenshot…' : 'Choose screenshot'}</button>{result && <button type="button" className="button button--secondary" onClick={() => void cancel}>Cancel review</button>}</div>
    {previewUrl && <img className="linked-player-screenshot__preview" src={previewUrl} alt="Selected Kingshot profile screenshot preview" />}
    {message && <p className="linked-player-message linked-player-message--success">{message}</p>}
    {error && <p className="linked-player-message linked-player-message--error" role="alert">{error}</p>}
    {result && <div className="linked-player-screenshot__result"><strong>OCR suggestions</strong>{result.candidates.length === 0 ? <p>No safe candidate was found. Use the manual Player ID form below.</p> : result.candidates.map((candidate) => <div key={`${candidate.field}-${candidate.value}`} className="linked-player-screenshot__candidate"><label htmlFor={`ocr-${candidate.field}`}>{candidate.field === 'playerId' ? 'Player ID' : candidate.field === 'displayName' ? 'Name' : 'Kingdom'}</label><input id={`ocr-${candidate.field}`} value={candidate.field === 'playerId' ? editedPlayerId : candidate.value} onChange={(event) => { if (candidate.field === 'playerId') { setEditedPlayerId(event.target.value); onCandidate(event.target.value) } }} readOnly={candidate.field !== 'playerId'} /><small>{candidate.confidence >= 0.85 ? 'High confidence' : candidate.confidence >= 0.6 ? 'Check this value' : 'Could not read'} · {candidate.source} · {candidate.mappingVersion}{candidate.warnings.length ? ` · ${candidate.warnings.join(' ')}` : ''}</small></div>)}</div>}
  </section>
}
