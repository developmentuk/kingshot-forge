import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'
import KingshotArtRenderer, { type ArtworkRenderMode } from '../components/art/KingshotArtRenderer'
import { artTemplates, type ArtTemplate } from '../data/artTemplates'
import { countArtworkCharacters, countArtworkLines, ART_STUDIO_TEXT_LIMITS, validateTextArtwork } from '../../shared/domains/art-studio/textValidation'
import { COMMUNITY_ART_CATEGORIES, listCommunityGallery, listMyCommunityArt, listMyCommunityArtReactions, reactToCommunityArt, submitCommunityArt, type CommunityArtAttribution, type CommunityArtCategory, type CommunityArtReactionCounts, type CommunityArtReactionType, type CommunityArtRecord } from '../services/communityArtService'
import { analyseText, copyApprovedPayload, hashText, RENDER_PROFILES } from '../../shared/domains/art-studio/rendering'

// The shared renderer keeps the studio view's <pre> text-preservation contract.

const FAVOURITES_STORAGE_KEY = 'kingshot-forge-art-favourites'
type SortOption = 'Newest' | 'Title' | 'Category'
type GalleryRecord = CommunityArtRecord & { source: string; testedInKingshot: boolean }
type PreviewZoom = 'fit' | 0.75 | 1 | 1.25 | 1.5

function loadFavourites(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(FAVOURITES_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function localRecord(item: ArtTemplate): GalleryRecord {
  const characterCount = countArtworkCharacters(item.art)
  const lineCount = countArtworkLines(item.art)
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags,
    artworkText: item.art,
    rawSourceText: item.art,
    normalisedText: item.art.replace(/\r\n?/g, '\n'),
    approvedCopyPayload: item.art,
    renderedPreviewPayload: item.art,
    compatibilityProfile: 'kingshot-chat-bubble',
    repairOperations: [],
    sourceHash: hashText(item.art),
    approvedPayloadHash: hashText(item.art),
    attribution: item.author ?? item.submittedBy ?? null,
    status: 'published',
    compatibilityStatus: item.testedInKingshot ? 'verified' : 'needs_testing',
    characterCount,
    lineCount,
    sizeClass: lineCount <= 3 ? 'compact' : lineCount <= 8 ? 'standard' : 'large',
    createdAt: item.addedAt,
    moderatedAt: null,
    publishedAt: item.addedAt,
    source: item.source,
    testedInKingshot: Boolean(item.testedInKingshot),
    reactionCounts: { like: 0, heart: 0, smile: 0, wow: 0 },
    myReaction: null,
  }
}

function compatibilityLabel(value: GalleryRecord['compatibilityStatus']) {
  return value === 'verified' ? 'Tested' : value === 'known_issues' ? 'Known issues' : value === 'needs_testing' ? 'Needs testing' : 'Untested'
}

function copyText(text: string): Promise<void> {
  return copyApprovedPayload(text)
}

function ArtStudioPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [remote, setRemote] = useState<CommunityArtRecord[]>([])
  const [mine, setMine] = useState<CommunityArtRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<'browse' | 'submit' | 'status'>('browse')
  const [selectedCategory, setSelectedCategory] = useState<'All' | CommunityArtCategory>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('Newest')
  const [favourites, setFavourites] = useState(loadFavourites)
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false)
  const [selectedArt, setSelectedArt] = useState<GalleryRecord | null>(null)
  const [copyMessage, setCopyMessage] = useState('')
  const [submissionNotice, setSubmissionNotice] = useState('')

  useEffect(() => { window.localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(favourites)) }, [favourites])
  useEffect(() => {
    let active = true
    void listCommunityGallery()
      .then((items) => { if (active) setRemote(items) })
      .catch(() => { if (active) setLoadError('Approved community artwork could not be loaded right now.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!user) { setMine([]); return }
    void Promise.all([listMyCommunityArt(), listMyCommunityArtReactions()])
      .then(([records, reactions]) => {
        const reactionMap = new Map(reactions.map((reaction) => [reaction.artworkId, reaction.reactionType]))
        setMine(records.map((record) => ({ ...record, myReaction: reactionMap.get(record.id) ?? null })))
        setRemote((current) => current.map((record) => ({ ...record, myReaction: reactionMap.get(record.id) ?? record.myReaction })))
      })
      .catch(() => setLoadError('Your submission status could not be loaded.'))
  }, [user])

  const gallery = useMemo<GalleryRecord[]>(() => {
    const items = [
      ...artTemplates.filter((item) => item.status === 'Published').map(localRecord),
      ...remote.map((item) => ({ ...item, artworkText: item.approvedCopyPayload ?? item.renderedPreviewPayload ?? item.artworkText, source: 'Community Submission', testedInKingshot: item.compatibilityStatus === 'verified' })),
    ]
    return [...new Map(items.map((item) => [item.id, item])).values()]
  }, [remote])

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return gallery
      .filter((item) => (selectedCategory === 'All' || item.category === selectedCategory)
        && (!search || [item.title, item.description, item.category, ...item.tags].some((value) => value.toLowerCase().includes(search)))
        && (!showFavouritesOnly || favourites.includes(item.id)))
      .sort((first, second) => sortOption === 'Title'
        ? first.title.localeCompare(second.title)
        : sortOption === 'Category'
          ? first.category.localeCompare(second.category) || first.title.localeCompare(second.title)
          : new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
  }, [gallery, selectedCategory, searchTerm, sortOption, showFavouritesOnly, favourites])

  function toggleFavourite(id: string) {
    setFavourites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function copyArt(artwork: string) {
    try {
      await copyText(artwork)
      setCopyMessage(`Approved payload copied exactly · ${hashText(artwork)} · ${artwork.length} UTF-16 units`)
      window.setTimeout(() => setCopyMessage(''), 1800)
    } catch {
      setCopyMessage('Copy was blocked. Open Studio view, select the source text and copy it manually.')
    }
  }

  async function toggleReaction(item: GalleryRecord, reactionType: CommunityArtReactionType) {
    if (item.source !== 'Community Submission') return
    if (!user) { setCopyMessage('Sign in to react to community artwork.'); return }
    const next = item.myReaction === reactionType ? null : reactionType
    const previous = item
    const optimisticCounts: CommunityArtReactionCounts = { ...item.reactionCounts }
    if (item.myReaction) optimisticCounts[item.myReaction] = Math.max(0, optimisticCounts[item.myReaction] - 1)
    if (next) optimisticCounts[next] += 1
    const optimistic = { ...item, reactionCounts: optimisticCounts, myReaction: next }
    setRemote((current) => current.map((record) => record.id === item.id ? optimistic : record))
    setSelectedArt((current) => current?.id === item.id ? optimistic : current)
    try {
      const updated = await reactToCommunityArt({ artworkId: item.id, reactionType: next })
      setRemote((current) => current.map((record) => record.id === item.id ? { ...record, ...updated } : record))
      setSelectedArt((current) => current?.id === item.id ? { ...current, ...updated } : current)
    } catch {
      setRemote((current) => current.map((record) => record.id === item.id ? previous : record))
      setSelectedArt((current) => current?.id === item.id ? previous : current)
      setCopyMessage('Reaction could not be saved. Please try again.')
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedCategory('All')
    setShowFavouritesOnly(false)
    setSortOption('Newest')
  }

  return <section className="section page-section art-forge-page">
    <div className="section-heading art-forge-heading"><p className="eyebrow">Art Forge</p><h1 className="page-title">Copy Kingshot-friendly chat art</h1><p>Browse community artwork, banners, cats, flags and battle alerts ready to paste into Kingshot chat.</p></div>
    <div className="art-studio-view-switcher" role="tablist" aria-label="Art Studio sections"><button type="button" role="tab" aria-selected={view === 'browse'} className={view === 'browse' ? 'button button--primary' : 'button button--secondary'} onClick={() => setView('browse')}>Browse artwork</button><button type="button" role="tab" aria-selected={view === 'submit'} className={view === 'submit' ? 'button button--primary' : 'button button--secondary'} onClick={() => setView('submit')}>Submit artwork</button><button type="button" role="tab" aria-selected={view === 'status'} className={view === 'status' ? 'button button--primary' : 'button button--secondary'} onClick={() => setView('status')}>My submissions</button></div>
    {copyMessage && <p className="art-studio-live-message" role="status" aria-live="polite">{copyMessage}</p>}
    {view === 'browse' && <>
      <div className="art-library-toolbar"><div className="field art-library-search"><label htmlFor="art-search">Search artwork</label><input id="art-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search cats, KvK, flags..." /></div><div className="field art-library-sort"><label htmlFor="art-sort">Sort</label><select id="art-sort" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}><option>Newest</option><option>Title</option><option>Category</option></select></div><button type="button" className={showFavouritesOnly ? 'button button--primary art-favourites-filter' : 'button button--secondary art-favourites-filter'} onClick={() => setShowFavouritesOnly((current) => !current)} aria-pressed={showFavouritesOnly}>★ Favourites ({favourites.length})</button></div>
      <div className="art-category-scroller" aria-label="Artwork categories">{COMMUNITY_ART_CATEGORIES.map((category) => <button key={category} type="button" className={selectedCategory === category ? 'category-button category-button--active' : 'category-button'} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>{category}</button>)}</div>
      <div className="art-results-bar"><div><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'design' : 'designs'}</span></div>{(searchTerm || selectedCategory !== 'All' || showFavouritesOnly) && <button type="button" onClick={clearFilters}>Clear filters</button>}</div>
      {loading && <p className="art-studio-refresh-state" role="status">Refreshing community artwork…</p>}{loadError && <div className="error-state" role="alert">{loadError}</div>}{!loading && filtered.length === 0 && <div className="empty-state"><span aria-hidden="true">🎨</span><h2>No matching artwork</h2><p>Try another search term or clear the active filters.</p><button type="button" className="button button--secondary" onClick={clearFilters}>Clear filters</button></div>}
      <div className="art-library-grid">{filtered.map((item) => <ArtworkCard key={item.id} item={item} favourite={favourites.includes(item.id)} onFavourite={() => toggleFavourite(item.id)} onPreview={() => setSelectedArt(item)} onCopy={() => void copyArt(item.artworkText)} onReact={(reaction) => void toggleReaction(item, reaction)} />)}</div>
    </>}
    {view === 'submit' && <SubmissionForm signedIn={!authLoading && Boolean(user)} onSignIn={() => void signInWithGoogle()} onSubmitted={(item) => { setMine((current) => [item, ...current]); setSubmissionNotice('Artwork submitted for review. Current status: Pending.'); setView('status') }} />}
    {view === 'status' && <SubmissionStatus signedIn={!authLoading && Boolean(user)} records={mine} notice={submissionNotice} onSignIn={() => void signInWithGoogle()} onPreview={(item) => setSelectedArt({ ...item, source: 'Community Submission', testedInKingshot: item.compatibilityStatus === 'verified' })} />}
    {selectedArt && <ArtworkPreview item={selectedArt} favourite={favourites.includes(selectedArt.id)} onClose={() => setSelectedArt(null)} onFavourite={() => toggleFavourite(selectedArt.id)} onCopy={() => void copyArt(selectedArt.artworkText)} onReact={(reaction) => void toggleReaction(selectedArt, reaction)} />}
  </section>
}

function ReactionControls({ item, onReact }: { item: GalleryRecord; onReact: (reaction: CommunityArtReactionType) => void }) {
  if (item.source !== 'Community Submission') return null
  return <div className="art-reactions" aria-label="Artwork reactions">{(['like', 'heart', 'smile', 'wow'] as CommunityArtReactionType[]).map((reaction) => <button key={reaction} type="button" className={item.myReaction === reaction ? 'art-reaction art-reaction--active' : 'art-reaction'} aria-label={`${reaction} this artwork`} aria-pressed={item.myReaction === reaction} onClick={() => onReact(reaction)}>{reaction === 'like' ? '👍' : reaction === 'heart' ? '❤️' : reaction === 'smile' ? '😊' : '✨'} <span>{item.reactionCounts[reaction]}</span></button>)}</div>
}

function ArtworkCard({ item, favourite, onFavourite, onPreview, onCopy, onReact }: { item: GalleryRecord; favourite: boolean; onFavourite: () => void; onPreview: () => void; onCopy: () => void; onReact: (reaction: CommunityArtReactionType) => void }) {
  return <article className="art-library-card"><div className="art-library-card__heading"><div><span className="art-library-card__category">{item.category}</span><h2>{item.title}</h2></div><button type="button" className={favourite ? 'favourite-button favourite-button--active' : 'favourite-button'} onClick={onFavourite} aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={favourite}>{favourite ? '★' : '☆'}</button></div><p className="art-library-card__description">{item.description}</p><p className="art-library-card__creator">Created by {item.attribution || 'Anonymous'}</p><button type="button" className="art-card-preview-button" onClick={onPreview} aria-label={`Preview ${item.title}`}><KingshotArtRenderer artwork={item.artworkText} compact maxLines={8} /><span>Tap to view full artwork</span></button><div className="art-library-card__metadata"><span>{item.characterCount} characters</span><span>{item.sizeClass}</span><span className={item.compatibilityStatus === 'verified' ? 'art-status art-status--tested' : 'art-status art-status--testing'}>{compatibilityLabel(item.compatibilityStatus)}</span></div><ReactionControls item={item} onReact={onReact} /><div className="art-library-card__actions"><button type="button" className="button button--secondary" onClick={onPreview}>Preview</button><button type="button" className="button button--primary" onClick={onCopy}>Copy Art</button></div></article>
}

function ArtworkPreview({ item, favourite, onClose, onFavourite, onCopy, onReact }: { item: GalleryRecord; favourite: boolean; onClose: () => void; onFavourite: () => void; onCopy: () => void; onReact: (reaction: CommunityArtReactionType) => void }) {
  const [mode, setMode] = useState<ArtworkRenderMode>('kingshot')
  const [zoom, setZoom] = useState<PreviewZoom>('fit')
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return }
      if (event.key !== 'Tab' || !panelRef.current) return
      const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'))
      if (controls.length === 0) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handler)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [])

  const previewStyle = { '--art-preview-zoom': zoom === 'fit' ? 1 : zoom } as CSSProperties
  return <div className="art-preview-modal" role="dialog" aria-modal="true" aria-labelledby="art-preview-title">
    <button type="button" className="art-preview-modal__backdrop" onClick={onClose} aria-label="Close preview" />
    <div className="art-preview-modal__panel" ref={panelRef}>
      <div className="art-preview-modal__header"><div><span className="art-library-card__category">{item.category}</span><h2 id="art-preview-title">{item.title}</h2></div><button ref={closeRef} type="button" className="art-preview-modal__close" onClick={onClose} aria-label="Close artwork preview">×</button></div>
      <p className="art-library-card__creator">Created by {item.attribution || 'Anonymous'}</p>
      <div className="art-preview-toolbar" aria-label="Artwork preview controls"><div className="art-preview-toolbar__group" role="group" aria-label="Preview mode"><button type="button" className={mode === 'kingshot' ? 'art-preview-control art-preview-control--active' : 'art-preview-control'} aria-pressed={mode === 'kingshot'} onClick={() => setMode('kingshot')}>In-game view</button><button type="button" className={mode === 'studio' ? 'art-preview-control art-preview-control--active' : 'art-preview-control'} aria-pressed={mode === 'studio'} onClick={() => setMode('studio')}>Studio view</button></div><label className="art-preview-zoom">Zoom<select value={zoom} onChange={(event) => setZoom(event.target.value === 'fit' ? 'fit' : Number(event.target.value) as PreviewZoom)}><option value="fit">Fit</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label></div>
      <div className={`art-preview-modal__content art-preview-modal__content--${mode}`}><div className="art-preview-stage" style={previewStyle}><KingshotArtRenderer artwork={item.artworkText} mode={mode} labelledBy="art-preview-title" /></div></div>
      <div className="art-preview-modal__details"><span>{item.characterCount} characters</span><span>{item.lineCount} lines</span><span>{item.sizeClass}</span><span>{compatibilityLabel(item.compatibilityStatus)}</span><span>{item.source}</span></div>
      <ReactionControls item={item} onReact={onReact} />
      <div className="art-preview-modal__actions"><button type="button" className="button button--secondary art-modal-favourite" onClick={onFavourite}>{favourite ? '★ Saved' : '☆ Favourite'}</button><button type="button" className="button button--primary" onClick={onCopy}>Copy Artwork</button></div>
    </div>
  </div>
}

function SubmissionForm({ signedIn, onSignIn, onSubmitted }: { signedIn: boolean; onSignIn: () => void; onSubmitted: (record: CommunityArtRecord) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CommunityArtCategory>('Cats')
  const [tags, setTags] = useState('')
  const [artworkText, setArtworkText] = useState('')
  const [attributionType, setAttributionType] = useState<CommunityArtAttribution>('profile')
  const [attributionName, setAttributionName] = useState('')
  const [ownership, setOwnership] = useState(false)
  const [guidelines, setGuidelines] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!signedIn) return <div className="art-studio-auth-card"><h2>Sign in to submit chat art</h2><p>Submissions are tied to your Forge identity so status and attribution remain clear.</p><button type="button" className="button button--primary" onClick={onSignIn}>Continue with Google</button></div>
  const issues = validateTextArtwork({ title, description, artwork: artworkText, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), attributionType, attributionName: attributionType === 'anonymous' ? null : attributionName })
  const diagnostics = analyseText(artworkText, RENDER_PROFILES['kingshot-chat-bubble'])
  void diagnostics
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setError(null)
    const validationIssues = [...issues, ...(!ownership || !guidelines ? [{ field: 'artwork' as const, message: 'Confirm ownership and the community guidelines before submitting.' }] : [])]
    if (validationIssues.length) { setError(validationIssues.map((issue) => issue.message).join(' ')); return }
    setSaving(true)
    try {
      const record = await submitCommunityArt({ title, description, category, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), artworkText, attributionType, attributionName: attributionType === 'anonymous' ? null : attributionName, ownershipConfirmed: ownership, guidelinesConfirmed: guidelines })
      onSubmitted(record)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t submit your artwork. Your draft is still here — please try again.')
    } finally {
      setSaving(false)
    }
  }
  return <div className="art-studio-submission-shell"><div className="art-studio-submission-intro"><p className="eyebrow">Community contribution</p><h2>Submit copyable chat art</h2><p>Paste the exact text players should copy into Kingshot chat. Forge preserves spaces, line breaks, Unicode and emoji.</p></div><form className="art-studio-form" onSubmit={submit} noValidate>{error && <div className="error-state" role="alert">{error}</div>}<label htmlFor="submission-title">Artwork title<input id="submission-title" required maxLength={ART_STUDIO_TEXT_LIMITS.maximumTitleCharacters} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label htmlFor="submission-description">Description<textarea id="submission-description" maxLength={ART_STUDIO_TEXT_LIMITS.maximumDescriptionCharacters} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label htmlFor="submission-category">Category<select id="submission-category" value={category} onChange={(event) => setCategory(event.target.value as CommunityArtCategory)}>{COMMUNITY_ART_CATEGORIES.filter((item): item is CommunityArtCategory => item !== 'All').map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label htmlFor="submission-tags">Tags <span>(optional, comma separated)</span><input id="submission-tags" value={tags} onChange={(event) => setTags(event.target.value)} /></label><label htmlFor="submission-artwork">Artwork<textarea id="submission-artwork" className="art-studio-artwork-editor" required spellCheck="false" value={artworkText} onChange={(event) => setArtworkText(event.target.value)} placeholder={'  /\\_/\\\n ( o.o )\n  > ^ <'} /></label><div className="art-studio-artwork-count" aria-live="polite"><span>{countArtworkCharacters(artworkText)} / {ART_STUDIO_TEXT_LIMITS.maximumCharacters} characters</span><span>{countArtworkLines(artworkText)} / {ART_STUDIO_TEXT_LIMITS.maximumLines} lines</span></div><fieldset><legend>Attribution</legend><label><input type="radio" checked={attributionType === 'profile'} onChange={() => setAttributionType('profile')} /> Use my Forge display name</label><label><input type="radio" checked={attributionType === 'custom'} onChange={() => setAttributionType('custom')} /> Use a custom creator name</label>{attributionType === 'custom' && <input aria-label="Custom creator name" value={attributionName} maxLength={120} onChange={(event) => setAttributionName(event.target.value)} />}<label><input type="radio" checked={attributionType === 'anonymous'} onChange={() => { setAttributionType('anonymous'); setAttributionName('') }} /> Show as anonymous</label></fieldset><label className="art-studio-check"><input type="checkbox" checked={ownership} onChange={(event) => setOwnership(event.target.checked)} /> I own this artwork or have permission to submit it.</label><label className="art-studio-check"><input type="checkbox" checked={guidelines} onChange={(event) => setGuidelines(event.target.checked)} /> I agree to the Forge community guidelines.</label><div className="art-studio-form-actions"><button type="button" className="button button--secondary" onClick={() => setPreview((current) => !current)}>{preview ? 'Return to editing' : 'Preview artwork'}</button><button type="button" className="button button--secondary" onClick={() => setArtworkText('')}>Clear artwork</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit for review'}</button></div>{preview && <div className="art-studio-submission-preview"><p className="eyebrow" id="submission-preview-title">In-game preview</p><KingshotArtRenderer artwork={artworkText} labelledBy="submission-preview-title" /><p>Characters: {countArtworkCharacters(artworkText)} · Lines: {countArtworkLines(artworkText)}</p><small>Calibrated from verified Kingshot screenshots. Rendering can still vary slightly by device and OS.</small></div>}</form></div>
}

function SubmissionStatus({ signedIn, records, notice, onSignIn, onPreview }: { signedIn: boolean; records: CommunityArtRecord[]; notice: string; onSignIn: () => void; onPreview: (record: CommunityArtRecord) => void }) {
  if (!signedIn) return <div className="art-studio-auth-card"><h2>Sign in to view submissions</h2><button type="button" className="button button--primary" onClick={onSignIn}>Continue with Google</button></div>
  return <div className="art-studio-status-panel">{notice && <p className="art-studio-live-message" role="status" aria-live="polite">{notice}</p>}<h2>My submissions</h2>{records.length === 0 ? <div className="empty-state"><h3>No submissions yet</h3><p>Your pending, approved and rejected submissions will appear here.</p></div> : records.map((record) => <article key={record.id} className="art-studio-status-row"><div><span className="art-library-card__category">{record.category}</span><h3>{record.title}</h3><p>{record.characterCount} characters · {record.lineCount} lines · {record.status}</p><small>Submitted {new Date(record.createdAt).toLocaleDateString()}</small></div><button type="button" className="button button--secondary" onClick={() => onPreview(record)}>Preview</button></article>)}</div>
}

export default ArtStudioPage
