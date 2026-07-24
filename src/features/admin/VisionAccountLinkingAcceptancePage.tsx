import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { AccountLinkOcrResult } from '../../../shared/domains/player-identity/accountLinkingOcr'

const ACCEPTANCE_ENABLED = import.meta.env.VITE_ENABLE_VISION_LINK_ACCEPTANCE === 'true'
const MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/tiff']
type EvidenceResponse = { status?: string; data?: Record<string, unknown>; message?: string }

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

export function VisionAccountLinkingAcceptancePage() {
  const { user, session, loading } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AccountLinkOcrResult | null>(null)
  const [intentId, setIntentId] = useState<string | null>(null)
  const [evidenceId, setEvidenceId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  if (!ACCEPTANCE_ENABLED) return <AcceptanceState title="OCR acceptance unavailable" text="This preview-only acceptance surface is disabled for this deployment." />
  if (loading) return <AcceptanceState title="Checking access" text="Forge is confirming your signed-in session." />
  if (!user || !session) return <AcceptanceState title="Sign in required" text="Sign in to run the owner-scoped OCR acceptance review." />
  const authUser = user
  const authSession = session

  async function callEvidence(body: Record<string, unknown>): Promise<EvidenceResponse> {
    const response = await fetch('/api/vision-evidence', { method: 'POST', headers: { Authorization: `Bearer ${authSession.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const payload = await response.json().catch(() => null) as EvidenceResponse | null
    if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'The secure evidence service is unavailable.')
    return payload
  }

  async function cancelExact(id: string): Promise<void> {
    await callEvidence({ action: 'cancel-evidence', evidenceId: id, reason: 'OCR acceptance review cancelled by the owner.' })
    setMessage('The exact screenshot evidence was removed. Your linked account was not changed.')
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file)); setWorking(true); setResult(null); setError(''); setMessage('')
    let createdIntent: string | null = null
    let completedEvidence: string | null = null
    try {
      if (!MIME_TYPES.includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or TIFF image.')
      const [sha256, image] = await Promise.all([digest(file), dimensions(file)])
      const created = await callEvidence({ action: 'create-upload-intent', ownerUserId: authUser.id, purpose: 'scan_source', uploadPurpose: 'Preview-only OCR acceptance review', mimeType: file.type, expectedBytes: file.size, consentRecordedAt: new Date().toISOString() })
      const intent = created.data?.intent as { id?: string; storagePath?: string } | undefined
      const upload = created.data?.upload as { bucket?: string; path?: string; token?: string } | undefined
      if (!intent?.id || !upload?.bucket || !upload.path || !upload.token || intent.storagePath !== upload.path) throw new Error('The secure upload response was incomplete.')
      createdIntent = intent.id; setIntentId(intent.id)
      const uploadResult = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
      if (uploadResult.error) throw new Error('The screenshot upload could not be completed.')
      const completed = await callEvidence({ action: 'complete-upload', intentId: intent.id, bytes: file.size, mimeType: file.type, sha256, widthPx: image.widthPx, heightPx: image.heightPx })
      const verified = completed.data as { id?: string } | undefined
      if (!verified?.id) throw new Error('The evidence verification response was incomplete.')
      completedEvidence = verified.id; setEvidenceId(verified.id)
      const response = await fetch('/api/player/link-ocr', { method: 'POST', headers: { Authorization: `Bearer ${authSession.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ evidenceId: verified.id }) })
      const payload = await response.json().catch(() => null) as { status?: string; data?: AccountLinkOcrResult; message?: string } | null
      if (!response.ok || payload?.status !== 'success' || !payload.data) throw new Error(payload?.message ?? 'OCR could not read this screenshot.')
      setResult(payload.data); setMessage('Review the extracted values. This acceptance surface does not find or link a player.')
    } catch (caught) {
      try { if (completedEvidence) await cancelExact(completedEvidence); else if (createdIntent) await callEvidence({ action: 'abandon-upload', intentId: createdIntent, reason: 'OCR acceptance review could not complete.' }) } catch { setError('Automatic evidence containment failed; stop and contact Forge support.') }
      setError(caught instanceof Error ? caught.message : 'The OCR acceptance review failed.')
    } finally { setWorking(false) }
  }

  async function cancel() {
    if (!evidenceId && !intentId) return
    try {
      if (evidenceId) await cancelExact(evidenceId)
      else if (intentId) await callEvidence({ action: 'abandon-upload', intentId, reason: 'OCR acceptance review cancelled before verification.' })
      setEvidenceId(null); setIntentId(null); setResult(null); setWorking(false)
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The exact evidence could not be cancelled.') }
  }

  return <main className="vision-acceptance" aria-labelledby="vision-acceptance-title">
    <section className="vision-acceptance__hero"><p className="eyebrow">Preview-only owner acceptance</p><h1 id="vision-acceptance-title">OCR acceptance test</h1><p>This will not change your linked account. Upload one synthetic or real profile image to inspect OCR candidates, then cancel the review to remove the exact evidence.</p></section>
    <section className="vision-acceptance__panel">
      <input ref={inputRef} hidden type="file" accept={MIME_TYPES.join(',')} onChange={(event) => void handleFile(event)} />
      <div className="vision-acceptance__actions"><button className="button button--primary" type="button" disabled={working} onClick={() => inputRef.current?.click()}>{working ? 'Processing…' : 'Choose screenshot'}</button>{(result || intentId) && <button className="button button--secondary" type="button" disabled={working} onClick={() => void cancel}>Cancel and delete evidence</button>}</div>
      {previewUrl && <img className="vision-acceptance__preview" src={previewUrl} alt="Selected screenshot preview" />}
      {message && <p className="vision-acceptance__success" role="status">{message}</p>}
      {error && <p className="vision-acceptance__error" role="alert">{error}</p>}
      {result && <div className="vision-acceptance__results"><h2>Extracted candidates</h2>{result.candidates.map((candidate) => <div className="vision-acceptance__candidate" key={`${candidate.field}-${candidate.value}`}><span>{candidate.field === 'playerId' ? 'Player ID' : candidate.field === 'displayName' ? 'Name' : 'Kingdom'}</span><strong>{candidate.value}</strong><small>{candidate.confidence >= 0.85 ? 'High confidence' : candidate.confidence >= 0.6 ? 'Review confidence' : 'Low confidence'} · {candidate.confidence.toFixed(2)}</small></div>)}<p className="vision-acceptance__provenance">Runtime: {result.provenance.pluginKey} · plugin {result.provenance.pluginVersion} · engine {result.provenance.engineVersion}</p></div>}
    </section>
  </main>
}

function AcceptanceState({ title, text }: { title: string; text: string }) { return <main className="vision-acceptance"><section className="vision-acceptance__panel"><p className="eyebrow">Preview-only owner acceptance</p><h1>{title}</h1><p>{text}</p></section></main> }
