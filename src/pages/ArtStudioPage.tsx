import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { COMMUNITY_ART_CATEGORIES, listCommunityGallery, listMyCommunityArt, submitCommunityArt, type CommunityArtAttribution, type CommunityArtCategory, type CommunityArtRecord } from '../services/communityArtService'
import { validateCommunityArtFile } from '../features/community-art/imageValidation'

function statusLabel(status: CommunityArtRecord['status']) {
  return status === 'pending' ? 'Pending review' : status === 'approved' ? 'Approved — awaiting publication' : status === 'published' ? 'Published' : 'Rejected'
}

function ArtStudioPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [gallery, setGallery] = useState<CommunityArtRecord[]>([])
  const [mine, setMine] = useState<CommunityArtRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'browse' | 'submit' | 'status'>('browse')
  const [category, setCategory] = useState<'all' | CommunityArtCategory>('all')
  const [selectedImage, setSelectedImage] = useState<CommunityArtRecord | null>(null)

  useEffect(() => {
    let active = true
    void listCommunityGallery().then((records) => { if (active) setGallery(records) }).catch(() => { if (active) setError('Community artwork could not be loaded right now.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) { setMine([]); return }
    void listMyCommunityArt().then(setMine).catch(() => setError('Your submission status could not be loaded.'))
  }, [user])

  const filtered = useMemo(() => category === 'all' ? gallery : gallery.filter((item) => item.category === category), [category, gallery])

  return <section className="section page-section community-art-page">
    <div className="section-heading">
      <p className="eyebrow">Forge community</p>
      <h1 className="page-title">Community Art Studio</h1>
      <p>Browse approved artwork for Kingshot, submit your own designs, and keep an eye on moderation status.</p>
    </div>
    <div className="community-art-tabs" role="tablist" aria-label="Community Art Studio sections">
      {([['browse', 'Browse artwork'], ['submit', 'Submit artwork'], ['status', 'My submissions']] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={view === key} className={view === key ? 'button button--primary' : 'button button--secondary'} onClick={() => setView(key)}>{label}</button>)}
    </div>
    {view === 'browse' && <>
      <div className="community-art-filters"><label htmlFor="community-art-category">Category</label><select id="community-art-category" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="all">All categories</option>{COMMUNITY_ART_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      {loading && <div className="loading-state" role="status">Loading approved community artwork…</div>}
      {error && <div className="error-state" role="alert">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="empty-state"><span aria-hidden="true">🎨</span><h2>No approved artwork yet</h2><p>Be the first to submit a design for the community.</p></div>}
      <div className="community-art-grid">{filtered.map((item) => <article className="community-art-card" key={item.id}><button type="button" className="community-art-card__image" onClick={() => setSelectedImage(item)} aria-label={`Open ${item.title}`}><img src={item.imageUrl ?? ''} alt={item.title} /></button><div className="community-art-card__body"><span className="eyebrow">{COMMUNITY_ART_CATEGORIES.find((entry) => entry.value === item.category)?.label}</span><h2>{item.title}</h2><p>{item.description}</p><span>By {item.attribution ?? 'Anonymous'}</span></div></article>)}</div>
    </>}
    {view === 'submit' && <SubmissionForm signedIn={!authLoading && Boolean(user)} onSubmitted={(record) => { setMine((current) => [record, ...current]); setView('status') }} onSignIn={() => void signInWithGoogle()} />}
    {view === 'status' && <SubmissionStatus signedIn={!authLoading && Boolean(user)} records={mine} onSignIn={() => void signInWithGoogle()} />}
    {selectedImage && <div className="community-art-dialog" role="dialog" aria-modal="true" aria-labelledby="community-art-dialog-title"><button type="button" className="community-art-dialog__backdrop" aria-label="Close artwork preview" onClick={() => setSelectedImage(null)} /><div className="community-art-dialog__panel"><button type="button" className="community-art-dialog__close" onClick={() => setSelectedImage(null)} aria-label="Close artwork preview">×</button><img src={selectedImage.imageUrl ?? ''} alt={selectedImage.title} /><h2 id="community-art-dialog-title">{selectedImage.title}</h2><p>By {selectedImage.attribution ?? 'Anonymous'}</p></div></div>}
  </section>
}

function SubmissionForm({ signedIn, onSubmitted, onSignIn }: { signedIn: boolean; onSubmitted: (record: CommunityArtRecord) => void; onSignIn: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState<CommunityArtCategory>('alliance_banner'); const [tags, setTags] = useState(''); const [attributionType, setAttributionType] = useState<CommunityArtAttribution>('profile'); const [attributionName, setAttributionName] = useState(''); const [ownership, setOwnership] = useState(false); const [guidelines, setGuidelines] = useState(false); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null); const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  if (!signedIn) return <div className="community-art-auth-card"><h2>Sign in to submit artwork</h2><p>Community submissions are tied to your Forge account so attribution and moderation status stay private.</p><button type="button" className="button button--primary" onClick={onSignIn}>Continue with Google</button></div>
  async function chooseFile(next: File | undefined) { if (!next) return; setError(null); try { const nextDimensions = await validateCommunityArtFile(next); if (preview) URL.revokeObjectURL(preview); setFile(next); setDimensions(nextDimensions); setPreview(URL.createObjectURL(next)) } catch (caught) { setFile(null); setDimensions(null); setPreview(null); setError(caught instanceof Error ? caught.message : 'This image could not be used.') } }
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!file || !dimensions || !ownership || !guidelines) { setError('Choose an image and confirm ownership and community guidelines.'); return }; setSaving(true); setError(null); try { const record = await submitCommunityArt({ title, description, category, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), file, attributionType, attributionName: attributionType === 'anonymous' ? null : attributionName, ownershipConfirmed: ownership, guidelinesConfirmed: guidelines, imageWidth: dimensions.width, imageHeight: dimensions.height }); onSubmitted(record) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Your submission could not be saved.') } finally { setSaving(false) } }
  return <form className="community-art-form" onSubmit={submit} noValidate><h2>Submit artwork</h2><p className="form-helper">PNG, JPEG and WebP images only, up to 5 MB and 128–4096 pixels per side.</p>{error && <div className="error-state" role="alert">{error}</div>}<label>Artwork title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Description<textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Category<select value={category} onChange={(event) => setCategory(event.target.value as CommunityArtCategory)}>{COMMUNITY_ART_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Tags <span>(optional, comma separated)</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="winter, alliance, banner" /></label><label>Artwork image<input ref={fileInput} required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void chooseFile(event.target.files?.[0])} /></label>{preview && <div className="community-art-preview"><img src={preview} alt="Selected artwork preview" /><button type="button" className="button button--secondary" onClick={() => { setFile(null); setDimensions(null); setPreview(null); if (fileInput.current) fileInput.current.value = '' }}>Remove image</button></div>}<fieldset><legend>Attribution</legend><label><input type="radio" checked={attributionType === 'profile'} onChange={() => setAttributionType('profile')} /> Use my Forge display name</label><label><input type="radio" checked={attributionType === 'custom'} onChange={() => setAttributionType('custom')} /> Use a custom creator name<input disabled={attributionType !== 'custom'} value={attributionName} onChange={(event) => setAttributionName(event.target.value)} maxLength={120} /></label><label><input type="radio" checked={attributionType === 'anonymous'} onChange={() => setAttributionType('anonymous')} /> Show as anonymous</label></fieldset><label className="checkbox-row"><input type="checkbox" checked={ownership} onChange={(event) => setOwnership(event.target.checked)} /> I own this artwork or have permission to submit it.</label><label className="checkbox-row"><input type="checkbox" checked={guidelines} onChange={(event) => setGuidelines(event.target.checked)} /> I agree to the Forge community guidelines.</label><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit for review'}</button></form>
}

function SubmissionStatus({ signedIn, records, onSignIn }: { signedIn: boolean; records: CommunityArtRecord[]; onSignIn: () => void }) { if (!signedIn) return <div className="community-art-auth-card"><h2>Sign in to view submissions</h2><button type="button" className="button button--primary" onClick={onSignIn}>Continue with Google</button></div>; return <div className="community-art-status"><h2>My submissions</h2>{records.length === 0 ? <div className="empty-state"><h3>No submissions yet</h3><p>Your artwork review status will appear here.</p></div> : records.map((record) => <article key={record.id} className="community-art-status__row">{record.imageUrl && <img src={record.imageUrl} alt="" />}<div><h3>{record.title}</h3><p>{statusLabel(record.status)}</p><small>Submitted {new Date(record.createdAt).toLocaleDateString()}</small></div></article>)}</div> }

export default ArtStudioPage
