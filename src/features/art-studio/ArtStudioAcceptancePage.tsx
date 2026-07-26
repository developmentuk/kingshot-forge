import { useEffect, useMemo, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import KingshotArtRenderer from '../../components/art/KingshotArtRenderer'
import type { ArtworkSourceContext } from '../../render-engine'
import { analyseText, copyApprovedPayload, copyApprovedPayloadFallback, sha256Text } from '../../../shared/domains/art-studio/rendering'

const CANONICAL_HASH = 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79'
const CANONICAL_FILENAME = 'wow-im-so-cute.txt'
const CLIPBOARD_FILENAME = 'cat.txt'
const FIXTURE_SOURCE_CONTEXTS: Record<string, ArtworkSourceContext> = {
  [CANONICAL_FILENAME]: 'authored',
  [CLIPBOARD_FILENAME]: 'kingshot-clipboard',
}
type Reference = { name: string; url: string }
type LoadedFixture = { filename: string; source: string; bytes: number; hash: string; lineEndings: string; sourceContext: ArtworkSourceContext; diagnostics: ReturnType<typeof analyseText> }

function lineEndingFormat(bytes: Uint8Array) {
  let crlf = 0
  let lf = 0
  let cr = 0
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] === 13 && bytes[index + 1] === 10) { crlf += 1; index += 1 }
    else if (bytes[index] === 10) lf += 1
    else if (bytes[index] === 13) cr += 1
  }
  if (crlf && !lf && !cr) return `CRLF (${crlf})`
  if (lf && !crlf && !cr) return `LF (${lf})`
  if (cr && !crlf && !lf) return `CR (${cr})`
  return `Mixed (CRLF ${crlf}, LF ${lf}, CR ${cr})`
}

async function readFixture(file: File): Promise<LoadedFixture> {
  const raw = new Uint8Array(await file.arrayBuffer())
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const source = new TextDecoder('utf-8', { fatal: true }).decode(raw)
  return { filename: file.name, source, bytes: raw.byteLength, hash, lineEndings: lineEndingFormat(raw), sourceContext: FIXTURE_SOURCE_CONTEXTS[file.name] ?? 'authored', diagnostics: analyseText(source) }
}

function metadata(fixture: LoadedFixture | null) {
  if (!fixture) return null
  return [
    ['Filename', fixture.filename], ['Source context', fixture.sourceContext], ['Raw bytes', fixture.bytes], ['Line endings', fixture.lineEndings], ['SHA-256', fixture.hash],
    ['Canonical hash', fixture.filename === CANONICAL_FILENAME ? (fixture.hash === CANONICAL_HASH ? 'MATCH' : 'MISMATCH') : 'N/A'], ['Lines', fixture.diagnostics.lineCount],
    ['Graphemes', fixture.diagnostics.graphemeCount], ['UTF-16 units', fixture.source.length], ['UTF-8 bytes', new TextEncoder().encode(fixture.source).byteLength],
  ] as const
}

function Surface({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <article className={`art-acceptance-surface ${className}`}><div className="art-acceptance-surface__heading"><div><p className="eyebrow">Acceptance surface</p><h2>{title}</h2></div><span className="art-acceptance-badge">In-memory fixture</span></div>{children}</article>
}

function AcceptanceModal({ source, sourceContext, onClose }: { source: string; sourceContext: ArtworkSourceContext; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [mode, setMode] = useState<'kingshot' | 'studio'>('kingshot')
  const previousFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'))
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)
    closeRef.current?.focus({ preventScroll: true })
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handler); previousFocusRef.current?.focus({ preventScroll: true }) }
  }, [onClose])
  return <div className="art-preview-modal" role="dialog" aria-modal="true" aria-labelledby="art-acceptance-modal-title">
    <button type="button" className="art-preview-modal__backdrop" onClick={onClose} aria-label="Close acceptance preview" />
    <div className="art-preview-modal__panel" ref={panelRef}>
      <div className="art-preview-modal__header"><div><span className="art-library-card__category">Acceptance fixture</span><h2 id="art-acceptance-modal-title">Wow I’m So Cute</h2></div><button ref={closeRef} type="button" className="art-preview-modal__close" onClick={onClose} aria-label="Close acceptance preview">×</button></div>
      <p className="art-library-card__creator">Created by Acceptance Fixture · calibrated</p>
      <div className="art-preview-toolbar" aria-label="Acceptance preview controls"><div className="art-preview-toolbar__group" role="group" aria-label="Preview mode"><button type="button" className={mode === 'kingshot' ? 'art-preview-control art-preview-control--active' : 'art-preview-control'} aria-pressed={mode === 'kingshot'} onClick={() => setMode('kingshot')}>In-game view</button><button type="button" className={mode === 'studio' ? 'art-preview-control art-preview-control--active' : 'art-preview-control'} aria-pressed={mode === 'studio'} onClick={() => setMode('studio')}>Studio view</button></div></div>
      <div className={`art-preview-modal__content art-preview-modal__content--${mode}`}><div className={`art-preview-stage art-preview-stage--${mode === 'kingshot' ? 'fit' : 'zoomed'}`}><KingshotArtRenderer artwork={source} mode={mode} sourceContext={sourceContext} fitMode={mode === 'kingshot' ? 'contain' : undefined} labelledBy="art-acceptance-modal-title" /></div></div>
      <div className="art-preview-modal__details"><span>{analyseText(source).graphemeCount} graphemes</span><span>{analyseText(source).lineCount} lines</span><span>large</span><span>calibrated</span><span>Acceptance fixture</span></div>
    </div>
  </div>
}

function ReferencePicker({ label, reference, onChange }: { label: string; reference: Reference | null; onChange: (file: File) => void }) {
  return <label className="art-acceptance-reference-picker"><span>{label}</span>{reference ? <img src={reference.url} alt={`${label} reference`} /> : <span className="art-acceptance-empty">Choose a local image</span>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onChange(file) }} /></label>
}

export default function ArtStudioAcceptancePage() {
  const [fixture, setFixture] = useState<LoadedFixture | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chatReference, setChatReference] = useState<Reference | null>(null)
  const [gameReference, setGameReference] = useState<Reference | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [copyResult, setCopyResult] = useState('')
  const openerRef = useRef<HTMLButtonElement>(null)
  const source = fixture?.source ?? ''
  const sourceContext = fixture?.sourceContext ?? 'authored'
  const diagnostics = useMemo(() => analyseText(source), [source])

  async function loadFixture(file: File) {
    setError(null)
    try { setFixture(await readFixture(file)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'The fixture could not be decoded as UTF-8.') }
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void loadFixture(file) }
  function loadReference(file: File, setter: (reference: Reference) => void) { const url = URL.createObjectURL(file); setter({ name: file.name, url }) }
  async function copy(mode: 'api' | 'fallback') {
    if (!source) return
    try {
      if (mode === 'api') await copyApprovedPayload(source)
      else await copyApprovedPayloadFallback(source)
      let observed = 'clipboard read unavailable'
      if (navigator.clipboard?.readText) { try { observed = (await navigator.clipboard.readText()) === source ? 'source equal' : 'source mismatch' } catch { /* Browser permission can prevent read-back. */ } }
      setCopyResult(`${mode === 'api' ? 'Clipboard API' : 'Textarea fallback'} · ${observed} · hash ${await sha256Text(source)}`)
    } catch (caught) { setCopyResult(caught instanceof Error ? caught.message : 'Copy failed') }
  }

  return <main className="art-acceptance-page" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
    <section className="art-acceptance-hero"><p className="eyebrow">Development/test-only · ART-003</p><h1>Art Studio deterministic acceptance harness</h1><p>Load the owner’s raw fixture and reference captures into the real Forge renderer without authentication, Supabase, persistence or production route exposure.</p><div className="art-acceptance-warning" role="note">Fixture status: <strong>calibrated</strong>. Owner acceptance records fit-for-purpose rendering; host emoji and glyph metrics may still differ from Kingshot.</div></section>
    <section className="art-acceptance-loader art-acceptance-panel"><div><h2>1. Load acceptance fixture</h2><p>Raw bytes are hashed before UTF-8 decoding. The fixture filename selects an explicit authored or Kingshot clipboard source context; unknown fixtures remain authored.</p></div><label className="art-acceptance-file-picker"><span>Choose text fixture</span><input type="file" accept="text/plain,.txt" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void loadFixture(file) }} /></label><div className="art-acceptance-dropzone" onDrop={handleDrop}>Drop <code>{CANONICAL_FILENAME}</code> or <code>{CLIPBOARD_FILENAME}</code> here</div>{error && <p className="error-state" role="alert">{error}</p>}{fixture && <dl className="art-acceptance-metadata">{metadata(fixture)?.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={label === 'Canonical hash' ? (value === 'MATCH' ? 'is-match' : value === 'MISMATCH' ? 'is-mismatch' : '') : ''}>{String(value)}</dd></div>)}</dl>}</section>
    <section className="art-acceptance-references art-acceptance-panel"><div><h2>2. Load reference captures</h2><p>Keep both owner references visible beside the candidate render while comparing geometry, spacing, glyph advances, emoji and clipping.</p></div><div className="art-acceptance-reference-grid"><ReferencePicker label="Chat reference" reference={chatReference} onChange={(file) => loadReference(file, setChatReference)} /><ReferencePicker label="Game reference" reference={gameReference} onChange={(file) => loadReference(file, setGameReference)} /></div></section>
    <section className="art-acceptance-comparison art-acceptance-panel"><h2>Reference comparison</h2><div className="art-acceptance-reference-compare">{chatReference ? <img src={chatReference.url} alt="Chat reference comparison" /> : <span>Chat reference not loaded</span>}{gameReference ? <img src={gameReference.url} alt="Game reference comparison" /> : <span>Game reference not loaded</span>}</div></section>
    <section className="art-acceptance-surfaces"><div className="art-acceptance-section-heading"><p className="eyebrow">3. Shared presentation surfaces</p><h2>All surfaces use the same source and renderer</h2><p>{fixture ? `Source hash ${fixture.hash} · profile Kingshot chat bubble · fixture status calibrated` : 'Load the canonical fixture to enable visual surfaces.'}</p></div>
      <Surface title="Art Studio editor preview"><label className="art-acceptance-editor">Source text<textarea value={source} readOnly spellCheck="false" /></label>{source ? <KingshotArtRenderer artwork={source} sourceContext={sourceContext} labelledBy="art-acceptance-editor-title" /> : <p className="art-acceptance-empty">Load the fixture first.</p>}</Surface>
    <Surface title="Gallery card"><article className="art-library-card art-acceptance-gallery-card"><div className="art-library-card__heading"><div><span className="art-library-card__category">Cats · calibrated</span><h3>Wow I’m So Cute</h3></div><span>Acceptance Fixture</span></div><p className="art-library-card__description">Loaded fixture rendered through the gallery card geometry.</p><button ref={openerRef} type="button" className="art-card-preview-button" onClick={() => setModalOpen(true)} aria-label="Preview Wow I’m So Cute"><KingshotArtRenderer artwork={source} sourceContext={sourceContext} compact maxLines={8} /><span>Tap to view full artwork</span></button><div className="art-library-card__metadata"><span>{diagnostics.graphemeCount} graphemes</span><span>large</span><span>calibrated</span></div></article></Surface>
      <Surface title="Full-preview modal"><p>Open the real modal interaction with the opener below; focus, Escape, trapping and scroll locking are validated by the focused harness tests and browser run.</p><button type="button" className="button button--primary" onClick={() => setModalOpen(true)} disabled={!source}>Open full preview modal</button></Surface>
      <Surface title="Submission preview"><div className="art-studio-submission-preview">{source ? <><p className="eyebrow">In-game preview · Acceptance Fixture</p><KingshotArtRenderer artwork={source} sourceContext={sourceContext} labelledBy="art-acceptance-submission-title" /><p>Characters: {diagnostics.graphemeCount} · Lines: {diagnostics.lineCount}</p></> : <p className="art-acceptance-empty">Load the fixture first.</p>}</div></Surface>
      <Surface title="Community Art moderation preview"><div className="community-art-moderation-preview">{source ? <KingshotArtRenderer artwork={source} sourceContext={sourceContext} compact labelledBy="art-acceptance-moderation-title" deviceProfile="android-default" /> : <p className="art-acceptance-empty">Load the fixture first.</p>}<p>Pending · Acceptance Fixture · raw source retained · no moderation action available in harness.</p></div></Surface>
      <Surface title="Calibration Lab"><div className="render-engine-lab__panel render-engine-lab__panel--preview art-acceptance-calibration"><div className="render-engine-lab__panel-heading"><h3>Forge preview · Kingshot chat simulation</h3><span>Profile: Kingshot chat bubble</span></div>{source ? <KingshotArtRenderer artwork={source} sourceContext={sourceContext} labelledBy="art-acceptance-calibration-title" deviceProfile="android-default" showSimulation /> : <p className="art-acceptance-empty">Load the fixture first.</p>}<div className="render-engine-lab__diagnostics"><span>Grid<strong>{diagnostics.longestLine} × {diagnostics.lineCount}</strong></span><span>Graphemes<strong>{diagnostics.graphemeCount}</strong></span><span>Renderer<strong>Fixed cell grid</strong></span><span>Ordinary spaces<strong>{diagnostics.ordinarySpaces}</strong></span><span>Ideographic spaces<strong>{diagnostics.ideographicSpaces}</strong></span><span>Emoji<strong>{diagnostics.emoji}</strong></span></div></div></Surface>
    </section>
    <section className="art-acceptance-clipboard art-acceptance-panel"><h2>4. Exact clipboard validation</h2><p>Production copy utility only. No transformed markup is copied.</p><div className="art-acceptance-actions"><button type="button" className="button button--primary" onClick={() => void copy('api')} disabled={!source}>Copy via Clipboard API</button><button type="button" className="button button--secondary" onClick={() => void copy('fallback')} disabled={!source}>Copy via textarea fallback</button></div>{copyResult && <p className="art-studio-live-message" role="status">{copyResult}</p>}</section>
    {modalOpen && source && <AcceptanceModal source={source} sourceContext={sourceContext} onClose={() => { setModalOpen(false); openerRef.current?.focus({ preventScroll: true }) }} />}
  </main>
}
