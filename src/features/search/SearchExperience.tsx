import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import './search.css'
import { resolveSearchDestination } from './searchDestination'
import { track } from '../../platform/analytics/analytics'

type SearchRecord = {
  id: string
  dataset: string
  title: string
  subtitle: string | null
  summary: string | null
  status: string
  published_at: string | null
  canonical_url: string | null
  image?: string | null
  relationship_count?: number
  confidence?: string | null
  confidence_label?: string | null
  tags?: string[]
}

type SearchMatch = { record: SearchRecord; score: number; relationshipType?: string; relationshipPath?: string[]; relationshipExplanation?: string }
type SearchResponse = { results: SearchMatch[]; meta: { resultCount: number; executionTimeMs: number; stale: boolean } }
type SearchSort = 'relevance' | 'alphabetical' | 'published' | 'connected'
type SearchApiBody = { status?: string; data?: SearchResponse; error?: { message?: string } }

const RECENT_KEY = 'forge.search.recent'
const PINNED_KEY = 'forge.search.pinned'
const DATASET_LABELS: Record<string, string> = {
  heroes: 'Heroes', 'hero-skills': 'Hero Skills', gear: 'Gear', charm: 'Charms', troops: 'Troops',
  buildings: 'Buildings', items: 'Items', events: 'Events', vip: 'VIP', 'war-academy': 'Research', masters: 'Guides', kvk: 'KvK',
}

function readList(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] } catch { return [] }
}

function highlight(text: string, query: string) {
  const terms = query.trim().split(/\s+/).filter(Boolean).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return text
  return text.split(new RegExp(`(${terms.join('|')})`, 'ig')).map((part, index) => terms.some((term) => new RegExp(`^${term}$`, 'i').test(part)) ? <mark key={index}>{part}</mark> : part)
}

function datasetLabel(dataset: string) { return DATASET_LABELS[dataset] ?? dataset.replaceAll('-', ' ') }

async function readSearchResponse(response: Response): Promise<SearchApiBody> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (response.redirected || !contentType.includes('application/json')) {
    throw new Error(response.status === 401 || response.status === 403 ? 'Search requires an active Forge session.' : 'Search is temporarily unavailable. Please try again shortly.')
  }
  const body = await response.json() as SearchApiBody
  if (!response.ok) { track('api_error', { endpoint_group: 'search', status: response.status }); throw new Error(response.status === 401 || response.status === 403 ? 'Search requires an active Forge session.' : 'Search is temporarily unavailable. Please try again shortly.') }
  if (body.status !== 'success' || !body.data) throw new Error(body.error?.message ?? 'Search is temporarily unavailable. Please try again shortly.')
  return body
}

export function SearchExperience({ open = true, onClose, embedded = false, initialQuery = '' }: { open?: boolean; onClose?: () => void; embedded?: boolean; initialQuery?: string }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [dataset, setDataset] = useState('')
  const [sort, setSort] = useState<SearchSort>('relevance')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState(() => readList(RECENT_KEY))
  const [pinned, setPinned] = useState(() => readList(PINNED_KEY))
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const didNavigateRef = useRef(false)
  const shortcut = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K'
  const chooseSearch = useCallback((value: string) => { setQuery(value); setRecent((current) => { const next = [value, ...current.filter((item) => item !== value)].slice(0, 8); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); return next }) }, [])
  const openResult = useCallback((record: SearchRecord) => { const destination = resolveSearchDestination(record); if (!destination) return; track('search_result_clicked', { dataset: record.dataset }); didNavigateRef.current = true; chooseSearch(query.trim()); navigate(destination); onClose?.() }, [chooseSearch, navigate, onClose, query])

  useEffect(() => {
    if (!open || embedded) return
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      if (!didNavigateRef.current) restoreFocusRef.current?.focus()
      didNavigateRef.current = false
      restoreFocusRef.current = null
    }
  }, [embedded, open])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null)
      const params = new URLSearchParams({ limit: '50' })
      if (query.trim()) params.set('q', query.trim())
      if (dataset) params.set('dataset', dataset)
      try {
        const response = await fetch(`/api/search?${params}` , { signal: controller.signal, headers: { Accept: 'application/json' } })
        const body = await readSearchResponse(response)
        setResults(body.data ?? null)
        track('search_query', { query_length: query.trim().length, result_count: body.data?.meta.resultCount ?? 0, latency_ms: body.data?.meta.executionTimeMs ?? 0 })
        if ((body.data?.meta.resultCount ?? 0) === 0) track('zero_result_search', { query_length: query.trim().length })
        setSelectedIndex(-1)
      } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) { setResults(null); setError(caught instanceof Error ? caught.message : 'Search is temporarily unavailable. Please try again shortly.') } } finally { setLoading(false) }
    }, query.trim() ? 160 : 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [dataset, open, query])

  const sortedResults = useMemo(() => [...(results?.results ?? [])].sort((a, b) => {
    if (sort === 'alphabetical') return a.record.title.localeCompare(b.record.title)
    if (sort === 'published') return Date.parse(b.record.published_at ?? '') - Date.parse(a.record.published_at ?? '')
    if (sort === 'connected') return (b.record.relationship_count ?? 0) - (a.record.relationship_count ?? 0)
    return b.score - a.score
  }), [results, sort])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); inputRef.current?.focus() }
      if (event.key === 'Escape' && !embedded) onClose?.()
      if (!embedded && sortedResults.length) {
        if (event.key === 'ArrowDown') { event.preventDefault(); setSelectedIndex((current) => (current + 1) % sortedResults.length) }
        if (event.key === 'ArrowUp') { event.preventDefault(); setSelectedIndex((current) => (current - 1 + sortedResults.length) % sortedResults.length) }
        if (event.key === 'Enter' && selectedIndex >= 0) { event.preventDefault(); openResult(sortedResults[selectedIndex].record) }
      }
      if (event.key === 'Tab' && !embedded && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, [href], [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'))
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey)
  }, [embedded, onClose, openResult, selectedIndex, sortedResults])

  function togglePinned(value: string) { setPinned((current) => { const next = current.includes(value) ? current.filter((item) => item !== value) : [value, ...current].slice(0, 8); localStorage.setItem(PINNED_KEY, JSON.stringify(next)); return next }) }

  if (!open) return null
  const searchContent = <div className={embedded ? 'forge-search forge-search--embedded' : 'forge-search forge-search--overlay'} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : true} aria-labelledby={embedded ? undefined : 'forge-search-title'} onMouseDown={(event) => { if (!embedded && event.target === event.currentTarget) onClose?.() }}>
    <div className="forge-search__panel" ref={embedded ? undefined : dialogRef}>
      <div className="forge-search__heading"><div><p className="forge-search__eyebrow">Kingshot Forge</p><h2 id={embedded ? undefined : 'forge-search-title'}>Global Search</h2></div>{!embedded && <button type="button" className="forge-search__close" onClick={onClose} aria-label="Close search">×</button>}</div>
      <div className="forge-search__input-wrap"><span aria-hidden="true">⌕</span><input ref={inputRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedIndex(-1) }} placeholder="Search heroes, events, gear, guides and more…" aria-label="Search Forge" aria-controls="forge-search-results" aria-expanded={Boolean(query.trim())} /><kbd>{shortcut}</kbd></div>
      <div className="forge-search__filters"><label>Dataset<select value={dataset} onChange={(event) => setDataset(event.target.value)}><option value="">All datasets</option>{Object.entries(DATASET_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value as SearchSort)}><option value="relevance">Relevance</option><option value="alphabetical">Alphabetical</option><option value="published">Published date</option><option value="connected">Most connected</option></select></label></div>
      {!query.trim() && !loading && <div className="forge-search__welcome"><p>Search across the published Forge knowledge graph.</p><div className="forge-search__chips">{pinned.length > 0 && <div><strong>Pinned</strong>{pinned.map((item) => <button key={item} type="button" onClick={() => chooseSearch(item)}>⌖ {item}</button>)}</div>}{recent.length > 0 && <div><strong>Recent</strong>{recent.map((item) => <button key={item} type="button" onClick={() => chooseSearch(item)}>{item}</button>)}<button type="button" className="forge-search__clear" onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}>Clear history</button></div>}</div></div>}
      {loading && <p className="forge-search__status" role="status">Searching the Forge index…</p>}
      {error && <p className="forge-search__status forge-search__status--error" role="alert">{error}</p>}
      {!loading && query.trim() && results && <><div className="forge-search__summary"><strong>{results.meta.resultCount} results</strong><span>{results.meta.executionTimeMs}ms{results.meta.stale ? ' · showing last known good index' : ''}</span></div>{sortedResults.length === 0 ? <div className="forge-search__empty"><strong>No published destinations</strong><p>Try a broader term or remove the dataset filter.</p></div> : <div className="forge-search__results" id="forge-search-results" role="listbox" aria-label="Published search results">{sortedResults.map(({ record, score }, index) => { const destination = resolveSearchDestination(record); if (!destination) return <article className="forge-result forge-result--informational" key={`${record.dataset}:${record.id}`} role="option" aria-selected={false}><div className="forge-result__icon" aria-hidden="true">◈</div><div className="forge-result__body"><div className="forge-result__top"><span className="forge-result__dataset">{datasetLabel(record.dataset)}</span><span className="forge-result__status">Informational</span></div><h3>{highlight(record.title, query)}</h3><p>{record.summary ? highlight(record.summary, query) : 'Published Forge content'}</p><small>No supported destination is available yet.</small></div></article>; return <article className={index === selectedIndex ? 'forge-result forge-result--selected' : 'forge-result'} key={`${record.dataset}:${record.id}`} role="option" aria-selected={index === selectedIndex} tabIndex={index === selectedIndex ? 0 : -1} onClick={() => openResult(record)} onKeyDown={(event) => { if (event.key === 'Enter') openResult(record) }}><div className="forge-result__icon" aria-hidden="true">{record.image ? <img src={record.image} alt="" /> : '◈'}</div><div className="forge-result__body"><div className="forge-result__top"><span className="forge-result__dataset">{datasetLabel(record.dataset)}</span><span className="forge-result__status">{record.status}</span></div><h3>{highlight(record.title, query)}</h3>{record.subtitle && <p className="forge-result__subtitle">{highlight(record.subtitle, query)}</p>}<p>{record.summary ? highlight(record.summary, query) : 'Published Forge content'}</p><small>{record.relationship_count ?? 0} connections · score {score.toFixed(0)}</small></div><div className="forge-result__actions"><button type="button" aria-label={`${pinned.includes(query.trim()) ? 'Unpin' : 'Pin'} search`} onClick={(event) => { event.stopPropagation(); togglePinned(query.trim()) }}> {pinned.includes(query.trim()) ? '★' : '☆'} </button></div></article>})}</div>}</>}
      <p className="forge-search__hint">↑↓ to navigate · Enter to open · Esc to close</p>
    </div>
  </div>
  return embedded ? searchContent : createPortal(searchContent, document.body)
}

const RELATIONSHIP_LABELS: Record<string, string> = { recommended_with: 'Recommended With', countered_by: 'Counters', synergy_with: 'Synergies', appears_in: 'Appears In', rewards: 'Rewards', requires: 'Requires', unlocks: 'Unlocks', used_by: 'Used By', published_by: 'Creator Guides', videos: 'Videos', research: 'Research', operations: 'Operations', related_to: 'Related Content' }
function relationshipLabel(value?: string) { return RELATIONSHIP_LABELS[value ?? ''] ?? (value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Related Content') }
function explain(match: SearchMatch) { return match.relationshipExplanation ?? `Published relationship: ${relationshipLabel(match.relationshipType)}.` }
function confidenceLabel(record: SearchRecord) { return record.confidence_label ?? ({ editorial_verified: 'Editorial Verified', dataset_verified: 'Dataset Verified', relationship_derived: 'Relationship Derived', community_verified: 'Community Verified', experimental: 'Experimental' }[record.confidence ?? ''] ?? null) }

export function KnowledgePanels({ matches }: { matches: SearchMatch[] }) {
  return <div className="forge-knowledge-panels" aria-label="Knowledge panels"><article className="forge-knowledge-panel"><p className="forge-search__eyebrow">Forge knowledge</p><h3>Best Starting Point</h3><p>{matches[0] ? `Start with ${matches[0].record.title}, the strongest published connection for this destination.` : 'Published relationship guidance will appear here when available.'}</p></article><article className="forge-knowledge-panel"><p className="forge-search__eyebrow">Forge knowledge</p><h3>Related Systems</h3><p>{matches.length ? `This destination connects to ${matches.length} published Forge record${matches.length === 1 ? '' : 's'}.` : 'Related systems will appear here when the relationship index has coverage.'}</p></article></div>
}

export function ForgeConnections({ dataset, id, limit = 12, showPanels = true }: { dataset: string; id: string; limit?: number; showPanels?: boolean }) {
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDomain, setActiveDomain] = useState('All')
  useEffect(() => { const controller = new AbortController(); setLoading(true); fetch(`/api/search?relationshipFrom=${encodeURIComponent(`${dataset}:${id}`)}&depth=1&limit=${limit}`, { signal: controller.signal }).then(async (response) => { if (!response.ok) return; const body = await response.json() as { data?: SearchResponse }; setMatches(body.data?.results ?? []) }).catch(() => undefined).finally(() => setLoading(false)); return () => controller.abort() }, [dataset, id, limit])
  if (loading) return <section className="forge-connections forge-connections--loading" aria-busy="true"><div className="forge-connections__skeleton" /><div className="forge-connections__skeleton" /><div className="forge-connections__skeleton" /></section>
  const related = [...new Map(matches.filter((match) => `${match.record.dataset}:${match.record.id}` !== `${dataset}:${id}` && match.record.status === 'published' && Boolean(match.relationshipType) && resolveSearchDestination(match.record)).map((match) => [`${match.record.dataset}:${match.record.id}`, match])).values()].sort((left, right) => (right.score - left.score) || left.record.title.localeCompare(right.record.title)).slice(0, limit)
  if (!related.length) return <section className="forge-connections forge-connections--empty"><p className="forge-search__eyebrow">Relationship Engine</p><h2>Forge Connections</h2><p>No related Forge content has been published yet.</p></section>
  const groups = [...new Set(related.map((match) => relationshipLabel(match.relationshipType)))]
  const domains = ['All', ...[...new Set(related.map((match) => datasetLabel(match.record.dataset)))].sort()]
  const filtered = activeDomain === 'All' ? related : related.filter((match) => datasetLabel(match.record.dataset) === activeDomain)
  return <section className="forge-connections" aria-labelledby="forge-connections-title"><div className="forge-connections__heading"><div><p className="forge-search__eyebrow">Relationship Engine</p><h2 id="forge-connections-title">Forge Connections</h2><p>Curated published content connected by editorial relationships and canonical tags.</p></div><Link to={`/search?relationshipFrom=${encodeURIComponent(`${dataset}:${id}`)}`}>View all related content</Link></div><div className="forge-connections__tabs" role="tablist" aria-label="Related content domains">{domains.map((domain) => <button type="button" role="tab" aria-selected={activeDomain === domain} className={activeDomain === domain ? 'is-active' : undefined} onClick={() => setActiveDomain(domain)} key={domain}>{domain}<span>{domain === 'All' ? related.length : related.filter((match) => datasetLabel(match.record.dataset) === domain).length}</span></button>)}</div>{groups.filter((group) => filtered.some((match) => relationshipLabel(match.relationshipType) === group)).map((group) => <div className="forge-connections__group" key={group}><h3>{group}</h3><div className="forge-connections__grid">{filtered.filter((match) => relationshipLabel(match.relationshipType) === group).map((match) => { const { record } = match; const confidence = confidenceLabel(record); const destination = resolveSearchDestination(record); return destination ? <article className="forge-connection-card" key={`${record.dataset}:${record.id}`}><span className="forge-connection-card__icon" aria-hidden="true">{record.image ? <img src={record.image} alt="" /> : '◈'}</span><div className="forge-connection-card__body"><div className="forge-connection-card__meta"><small>{datasetLabel(record.dataset)}</small>{confidence && <small className="forge-confidence">{confidence}</small>}</div><strong>{record.title}</strong>{record.subtitle && <small className="forge-connection-card__category">{record.subtitle}</small>}<p>{record.summary ?? 'Published related content'}</p><p className="forge-connection-card__why"><strong>Relationship:</strong> {explain(match)}</p>{record.tags?.length ? <div className="forge-connection-card__tags">{record.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}<Link className="forge-connection-card__open" to={destination}>Open {datasetLabel(record.dataset).toLowerCase()} →</Link></div></article> : null})}</div></div>)}{!filtered.length && <p className="forge-connections--empty">No published content is available in this domain yet.</p>}{showPanels && <KnowledgePanels matches={filtered} />}</section>
}

