import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { AccountLinkOcrResult } from '../../../shared/domains/player-identity/accountLinkingOcr'
import { VISION_ACCEPTANCE_ACTIVE_EVIDENCE_SESSION_KEY, VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID } from '../../../shared/platform/vision/evidenceStorageContracts'

const ACCEPTANCE_ENABLED = import.meta.env.VITE_ENABLE_VISION_LINK_ACCEPTANCE === 'true'
const MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/tiff']
type ProcessingState = 'idle' | 'selected' | 'preparing' | 'uploading' | 'verifying' | 'recognising' | 'complete' | 'cancelling' | 'cancelled' | 'error'
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
  const activeIntentIdRef = useRef<string | null>(null)
  const activeEvidenceIdRef = useRef<string | null>(null)
  const [state, setState] = useState<ProcessingState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AccountLinkOcrResult | null>(null)
  const [intentId, setIntentId] = useState<string | null>(null)
  const [evidenceId, setEvidenceId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [recoveryAvailable, setRecoveryAvailable] = useState(false)
  const [recoveryDeleting, setRecoveryDeleting] = useState(false)
  const authToken = session?.access_token
  const ownerId = user?.id

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const callEvidence = useCallback(async (body: Record<string, unknown>): Promise<EvidenceResponse> => {
    if (!authToken) throw new Error('Sign in is required to use OCR acceptance.')
    const response = await fetch('/api/vision-evidence', { method: 'POST', headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const payload = await response.json().catch(() => null) as EvidenceResponse | null
    if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'The secure evidence service is unavailable.')
    return payload
  }, [authToken])

  useEffect(() => {
    if (!ACCEPTANCE_ENABLED || !ownerId || !authToken) return
    const persistedEvidenceId = window.sessionStorage.getItem(VISION_ACCEPTANCE_ACTIVE_EVIDENCE_SESSION_KEY)
    if (persistedEvidenceId) {
      activeEvidenceIdRef.current = persistedEvidenceId
      setEvidenceId(persistedEvidenceId)
      setState('complete')
      setMessage('A completed acceptance review is ready to cancel.')
    }
    let active = true
    void callEvidence({ action: 'get-acceptance-recovery' }).then((payload) => {
      if (active && payload.data?.available === true) setRecoveryAvailable(true)
    }).catch(() => { if (active) setRecoveryAvailable(false) })
    return () => { active = false }
  }, [authToken, callEvidence, ownerId])

  const cancelExact = useCallback(async (id: string): Promise<void> => {
    await callEvidence({ action: 'cancel-evidence', evidenceId: id, reason: 'OCR acceptance review cancelled by the owner.' })
  }, [callEvidence])

  const processSelectedFile = useCallback(async (file: File) => {
    if (!ownerId || !authToken) { setState('error'); setError('Sign in is required to process the selected image.'); return }
    let createdIntent: string | null = null
    let completedEvidence: string | null = null
    try {
      setState('preparing'); setError(''); setMessage('Preparing secure upload.')
      if (!MIME_TYPES.includes(file.type)) throw new Error('Unsupported image type. Choose a PNG, JPEG, WebP or TIFF image.')
      const [sha256, image] = await Promise.all([digest(file), dimensions(file)])
      setState('uploading'); setMessage('Uploading exact evidence through the secure boundary.')
      const created = await callEvidence({ action: 'create-upload-intent', ownerUserId: ownerId, purpose: 'scan_source', uploadPurpose: 'Preview-only OCR acceptance review', mimeType: file.type, expectedBytes: file.size, consentRecordedAt: new Date().toISOString() })
      const intent = created.data?.intent as { id?: string; storagePath?: string } | undefined
      const upload = created.data?.upload as { bucket?: string; path?: string; token?: string } | undefined
      if (!intent?.id || !upload?.bucket || !upload.path || !upload.token || intent.storagePath !== upload.path) throw new Error('The secure upload response was incomplete.')
      createdIntent = intent.id; activeIntentIdRef.current = intent.id; setIntentId(intent.id)
      const uploadResult = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
      if (uploadResult.error) throw new Error('The screenshot upload could not be completed.')
      setState('verifying'); setMessage('Verifying exact bytes, dimensions and MIME type.')
      const completed = await callEvidence({ action: 'complete-upload', intentId: intent.id, bytes: file.size, mimeType: file.type, sha256, widthPx: image.widthPx, heightPx: image.heightPx })
      const verified = completed.data as { id?: string } | undefined
      if (!verified?.id) throw new Error('The evidence verification response was incomplete.')
      completedEvidence = verified.id; activeEvidenceIdRef.current = verified.id; setEvidenceId(verified.id); window.sessionStorage.setItem(VISION_ACCEPTANCE_ACTIVE_EVIDENCE_SESSION_KEY, verified.id)
      setState('recognising'); setMessage('Recognising candidates with bundled Tesseract.js.')
      const response = await fetch('/api/player/link-ocr', { method: 'POST', headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ evidenceId: verified.id }) })
      const payload = await response.json().catch(() => null) as { status?: string; data?: AccountLinkOcrResult; message?: string } | null
      if (!response.ok || payload?.status !== 'success' || !payload.data) throw new Error(payload?.message ?? 'OCR could not read this screenshot.')
      setResult(payload.data); setState('complete'); setMessage('Review the extracted values. This acceptance surface does not find or link a player.')
    } catch (caught) {
      const primary = caught instanceof Error ? caught.message : 'The OCR acceptance review failed.'
      let containment = ''
      try {
        if (completedEvidence) await cancelExact(completedEvidence)
        else if (createdIntent) await callEvidence({ action: 'abandon-upload', intentId: createdIntent, reason: 'OCR acceptance review could not complete.' })
      } catch { containment = ' Evidence containment also failed; stop and contact Forge support before retrying.' }
      setState('error'); setError(primary + containment)
    }
  }, [authToken, callEvidence, cancelExact, ownerId])

  useEffect(() => {
    if (selectedFile && state === 'selected') void processSelectedFile(selectedFile)
  }, [processSelectedFile, selectedFile, state])

  if (!ACCEPTANCE_ENABLED) return <AcceptanceState title="OCR acceptance unavailable" text="This preview-only acceptance surface is disabled for this deployment." />
  if (loading) return <AcceptanceState title="Checking access" text="Forge is confirming your signed-in session." />
  if (!user || !session) return <AcceptanceState title="Sign in required" text="Sign in to run the owner-scoped OCR acceptance review." />

  function handleFileSelection(event: { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    event.currentTarget.value = ''
    if (activeEvidenceIdRef.current || activeIntentIdRef.current) { setError('Cancel the current acceptance evidence before choosing another screenshot.'); return }
    setError(''); setResult(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setState('selected'); setMessage(`Selected: ${file.name}`)
  }

  async function cancel() {
    const activeEvidenceId = activeEvidenceIdRef.current ?? evidenceId
    const activeIntentId = activeIntentIdRef.current ?? intentId
    if (!activeEvidenceId && !activeIntentId) return
    setState('cancelling'); setError('');
    try {
      if (activeEvidenceId) await cancelExact(activeEvidenceId)
      else if (activeIntentId) await callEvidence({ action: 'abandon-upload', intentId: activeIntentId, reason: 'OCR acceptance review cancelled before verification.' })
      activeEvidenceIdRef.current = null; activeIntentIdRef.current = null; window.sessionStorage.removeItem(VISION_ACCEPTANCE_ACTIVE_EVIDENCE_SESSION_KEY)
      setEvidenceId(null); setIntentId(null); setSelectedFile(null); setResult(null); setState('cancelled'); setMessage('The exact screenshot evidence was removed. Your linked account was not changed.')
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      if (inputRef.current) inputRef.current.value = ''
    } catch (caught) { setState('error'); setError(caught instanceof Error ? caught.message : 'The exact evidence could not be cancelled.') }
  }

  async function cancelRecovery() {
    if (recoveryDeleting) return
    setRecoveryDeleting(true); setError('')
    try {
      await callEvidence({ action: 'cancel-evidence', evidenceId: VISION_ACCEPTANCE_RECOVERY_EVIDENCE_ID, reason: 'Owner cancelled unfinished synthetic OCR acceptance evidence.' })
      setRecoveryAvailable(false); setMessage('The unfinished synthetic acceptance evidence was deleted and its audit history was retained.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The unfinished synthetic evidence could not be deleted.') }
    finally { setRecoveryDeleting(false) }
  }

  const busy = ['preparing', 'uploading', 'verifying', 'recognising', 'cancelling'].includes(state)
  return <main className="vision-acceptance" aria-labelledby="vision-acceptance-title">
    <section className="vision-acceptance__hero"><p className="eyebrow">Preview-only owner acceptance</p><h1 id="vision-acceptance-title">OCR acceptance test</h1><p>This will not change your linked account. Upload one synthetic or real profile image to inspect OCR candidates, then cancel the review to remove the exact evidence.</p></section>
    <section className="vision-acceptance__panel">
      <div className="vision-acceptance__file-control"><label className="button button--primary" htmlFor="vision-acceptance-file">{busy ? 'Processing…' : 'Choose screenshot'}</label><input ref={inputRef} id="vision-acceptance-file" className="vision-acceptance__file-input" type="file" accept={MIME_TYPES.join(',')} disabled={busy} onChange={handleFileSelection} /></div>
      {recoveryAvailable && <section className="vision-acceptance__recovery" aria-labelledby="vision-acceptance-recovery-title"><h2 id="vision-acceptance-recovery-title">Recover unfinished synthetic acceptance</h2><p>A previously completed synthetic acceptance is awaiting owner cancellation.</p><button className="button button--secondary" type="button" disabled={recoveryDeleting} onClick={() => void cancelRecovery()}>{recoveryDeleting ? 'Deleting evidence…' : 'Delete unfinished synthetic evidence'}</button></section>}
      {selectedFile && <p className="vision-acceptance__selected" role="status">Selected: {selectedFile.name} · {selectedFile.type || 'unknown MIME'} · {selectedFile.size.toLocaleString()} bytes</p>}
      {previewUrl && <img className="vision-acceptance__preview" src={previewUrl} alt="Selected screenshot preview" />}
      {message && <p className="vision-acceptance__success" role="status">{message}</p>}
      {error && <p className="vision-acceptance__error" role="alert">{error}</p>}
      {state === 'cancelled' && <p className="vision-acceptance__success" role="status">Final confirmation: exact screenshot evidence was removed.</p>}
      {result && <div className="vision-acceptance__results"><h2>Extracted candidates</h2>{result.candidates.map((candidate) => <div className="vision-acceptance__candidate" key={`${candidate.field}-${candidate.value}`}><span>{candidate.field === 'playerId' ? 'Player ID' : candidate.field === 'displayName' ? 'Name' : 'Kingdom'}</span><strong>{candidate.value}</strong><small>{candidate.confidence >= 0.85 ? 'High confidence' : candidate.confidence >= 0.6 ? 'Review confidence' : 'Low confidence'} · {candidate.confidence.toFixed(2)}</small></div>)}<p className="vision-acceptance__provenance">Runtime: {result.provenance.pluginKey} · plugin {result.provenance.pluginVersion} · engine {result.provenance.engineVersion}</p></div>}
      {(result || intentId || evidenceId) && <button className="button button--secondary" type="button" disabled={state === 'cancelling'} onClick={() => void cancel()}>{state === 'cancelling' ? 'Deleting evidence…' : 'Cancel and delete evidence'}</button>}
    </section>
  </main>
}

function AcceptanceState({ title, text }: { title: string; text: string }) { return <main className="vision-acceptance"><section className="vision-acceptance__panel"><p className="eyebrow">Preview-only owner acceptance</p><h1>{title}</h1><p>{text}</p></section></main> }
