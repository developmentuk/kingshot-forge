import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './search.css'

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
}

type SearchMatch = { record: SearchRecord; score: number; relationshipType?: string; relationshipPath?: string[]; relationshipExplanation?: string }
type SearchResponse = { results: SearchMatch[]; meta: { resultCount: number; executionTimeMs: number; stale: boolean } }
type SearchSort = 'relevance' | 'alphabetical' | 'published' | 'connected'

const RECENT_KEY = 'forge.search.recent'
const PINNED_KEY = 'forge.search.pinned'
const DATASET_LABELS: Record<string, string> = {
  heroes: 'Heroes', 'hero-skills': 'Hero Skills', gear: 'Gear', charm: 'Charms', troops: 'Troops',
  buildings: 'Buildings', events: 'Events', vip: 'VIP', 'war-academy': 'Research', masters: 'Guides', kvk: 'KvK',
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

export function SearchExperience({ open = true, onClose, embedded = false, initialQuery = '' }: { open?: boolean; onClose?: () => void; embedded?: boolean; initialQuery?: string }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [dataset, setDataset] = useState('')
  const [sort, setSort] = useState<SearchSort>('relevance')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState(() => readList(RECENT_KEY))
  const [pinned, setPinned] = useState(() => readList(PINNED_KEY))

  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 0) }, [open])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null)
      const params = new URLSearchParams({ limit: '50' })
      if (query.trim()) params.set('q', query.trim())
      if (dataset) params.set('dataset', dataset)
      try {
        const response = await fetch(`/api/search?${params}` , { signal: controller.signal })
        const body = await response.json() as { status: string; data?: SearchResponse; error?: { message?: string } }
        if (!response.ok || body.status !== 'success' || !body.data) throw new Error(body.error?.message ?? 'Search is temporarily unavailable.')
        setResults(body.data)
      } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught instanceof Error ? caught.message : 'Search is temporarily unavailable.') } finally { setLoading(false) }
    }, query.trim() ? 160 : 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [dataset, open, query])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); inputRef.current?.focus() }
      if (event.key === 'Escape' && !embedded) onClose?.()
    }
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey)
  }, [embedded, onClose])

  const sortedResults = useMemo(() => [...(results?.results ?? [])].sort((a, b) => {
    if (sort === 'alphabetical') return a.record.title.localeCompare(b.record.title)
    if (sort === 'published') return Date.parse(b.record.published_at ?? '') - Date.parse(a.record.published_at ?? '')
    if (sort === 'connected') return (b.record.relationship_count ?? 0) - (a.record.relationship_count ?? 0)
    return b.score - a.score
  }), [results, sort])

  function chooseSearch(value: string) { setQuery(value); setRecent((current) => { const next = [value, ...current.filter((item) => item !== value)].slice(0, 8); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); return next }) }
  function togglePinned(value: string) { setPinned((current) => { const next = current.includes(value) ? current.filter((item) => item !== value) : [value, ...current].slice(0, 8); localStorage.setItem(PINNED_KEY, JSON.stringify(next)); return next }) }
  function openResult(record: SearchRecord) { chooseSearch(query.trim()); if (record.canonical_url?.startsWith('/')) { navigate(record.canonical_url); onClose?.() } }

  if (!open) return null
  return <div className={embedded ? 'forge-search forge-search--embedded' : 'forge-search forge-search--overlay'} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : true} aria-label="Forge global search">
    <div className="forge-search__panel">
      <div className="forge-search__heading"><div><p className="forge-search__eyebrow">Kingshot Forge</p><h1>Global Search</h1></div>{!embedded && <button type="button" onClick={onClose} aria-label="Close search">×</button>}</div>
      <div className="forge-search__input-wrap"><span aria-hidden="true">⌕</span><input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search heroes, events, gear, guides and more…" aria-label="Search Forge" /><kbd>Ctrl K</kbd></div>
      <div className="forge-search__filters"><label>Dataset<select value={dataset} onChange={(event) => setDataset(event.target.value)}><option value="">All datasets</option>{Object.entries(DATASET_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value as SearchSort)}><option value="relevance">Relevance</option><option value="alphabetical">Alphabetical</option><option value="published">Published date</option><option value="connected">Most connected</option></select></label></div>
      {!query.trim() && !loading && <div className="forge-search__welcome"><p>Search across the published Forge knowledge graph.</p><div className="forge-search__chips">{pinned.length > 0 && <div><strong>Pinned</strong>{pinned.map((item) => <button key={item} type="button" onClick={() => chooseSearch(item)}>⌖ {item}</button>)}</div>}{recent.length > 0 && <div><strong>Recent</strong>{recent.map((item) => <button key={item} type="button" onClick={() => chooseSearch(item)}>{item}</button>)}<button type="button" className="forge-search__clear" onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}>Clear history</button></div>}</div></div>}
      {loading && <p className="forge-search__status" role="status">Searching the Forge index…</p>}
      {error && <p className="forge-search__status forge-search__status--error" role="alert">{error}</p>}
      {!loading && query.trim() && results && <><div className="forge-search__summary"><strong>{results.meta.resultCount} results</strong><span>{results.meta.executionTimeMs}ms{results.meta.stale ? ' · showing last known good index' : ''}</span></div>{sortedResults.length === 0 ? <div className="forge-search__empty"><strong>No published matches</strong><p>Try a broader term or remove the dataset filter.</p></div> : <div className="forge-search__results">{sortedResults.map(({ record, score }) => <article className="forge-result" key={`${record.dataset}:${record.id}`} onClick={() => openResult(record)}><div className="forge-result__icon" aria-hidden="true">{record.image ? <img src={record.image} alt="" /> : '◈'}</div><div className="forge-result__body"><div className="forge-result__top"><span className="forge-result__dataset">{datasetLabel(record.dataset)}</span><span className="forge-result__status">{record.status}</span></div><h2>{highlight(record.title, query)}</h2>{record.subtitle && <p className="forge-result__subtitle">{highlight(record.subtitle, query)}</p>}<p>{record.summary ? highlight(record.summary, query) : 'Published Forge content'}</p><small>{record.relationship_count ?? 0} connections · score {score.toFixed(0)}</small></div><div className="forge-result__actions"><button type="button" aria-label={`${pinned.includes(query) ? 'Unpin' : 'Pin'} search`} onClick={(event) => { event.stopPropagation(); togglePinned(query.trim()) }}> {pinned.includes(query.trim()) ? '★' : '☆'} </button></div></article>)}</div>}</>}
      <p className="forge-search__hint">↑↓ to navigate · Enter to open · Esc to close</p>
    </div>
  </div>
}

const RELATIONSHIP_LABELS: Record<string, string> = { recommended_with: 'Recommended With', countered_by: 'Counters', synergy_with: 'Synergies', appears_in: 'Appears In', rewards: 'Rewards', requires: 'Requires', unlocks: 'Unlocks', used_by: 'Used By', published_by: 'Creator Guides', videos: 'Videos', research: 'Research', operations: 'Operations', related_to: 'Related Content' }
function relationshipLabel(value?: string) { return RELATIONSHIP_LABELS[value ?? ''] ?? (value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Related Content') }
function explain(match: SearchMatch) { return match.relationshipExplanation ?? `Related because this record is connected through ${relationshipLabel(match.relationshipType).toLowerCase()}.` }
function confidenceLabel(record: SearchRecord) { return record.confidence_label ?? ({ editorial_verified: 'Editorial Verified', dataset_verified: 'Dataset Verified', relationship_derived: 'Relationship Derived', community_verified: 'Community Verified', experimental: 'Experimental' }[record.confidence ?? ''] ?? null) }

export function KnowledgePanels({ matches }: { matches: SearchMatch[] }) {
  return <div className="forge-knowledge-panels" aria-label="Knowledge panels"><article className="forge-knowledge-panel"><p className="forge-search__eyebrow">Forge knowledge</p><h3>Best Starting Point</h3><p>{matches[0] ? `Start with ${matches[0].record.title}, the strongest published connection for this destination.` : 'Published relationship guidance will appear here when available.'}</p></article><article className="forge-knowledge-panel"><p className="forge-search__eyebrow">Forge knowledge</p><h3>Related Systems</h3><p>{matches.length ? `This destination connects to ${matches.length} published Forge record${matches.length === 1 ? '' : 's'}.` : 'Related systems will appear here when the relationship index has coverage.'}</p></article></div>
}

export function ForgeConnections({ dataset, id, limit = 12, showPanels = true }: { dataset: string; id: string; limit?: number; showPanels?: boolean }) {
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { const controller = new AbortController(); setLoading(true); fetch(`/api/search?relationshipFrom=${encodeURIComponent(`${dataset}:${id}`)}&depth=1&limit=${limit}`, { signal: controller.signal }).then(async (response) => { if (!response.ok) return; const body = await response.json() as { data?: SearchResponse }; setMatches(body.data?.results ?? []) }).catch(() => undefined).finally(() => setLoading(false)); return () => controller.abort() }, [dataset, id, limit])
  if (loading) return <section className="forge-connections forge-connections--loading" aria-busy="true"><div className="forge-connections__skeleton" /><div className="forge-connections__skeleton" /><div className="forge-connections__skeleton" /></section>
  if (!matches.length) return <section className="forge-connections forge-connections--empty"><p className="forge-search__eyebrow">Relationship Engine</p><h2>Forge Connections</h2><p>No published relationships are available for this destination yet.</p></section>
  const groups = [...new Set(matches.map((match) => relationshipLabel(match.relationshipType)))]
  return <section className="forge-connections" aria-labelledby="forge-connections-title"><div className="forge-connections__heading"><div><p className="forge-search__eyebrow">Relationship Engine</p><h2 id="forge-connections-title">Forge Connections</h2></div><Link to={`/search?relationshipFrom=${encodeURIComponent(`${dataset}:${id}`)}`}>Explore all</Link></div>{groups.map((group) => <div className="forge-connections__group" key={group}><h3>{group}</h3><div className="forge-connections__grid">{matches.filter((match) => relationshipLabel(match.relationshipType) === group).map((match) => { const { record } = match; const confidence = confidenceLabel(record); return <Link className="forge-connection-card" key={`${record.dataset}:${record.id}`} to={record.canonical_url ?? `/search?q=${encodeURIComponent(record.title)}`}><span className="forge-result__icon" aria-hidden="true">◈</span><span><span className="forge-connection-card__meta"><small>{datasetLabel(record.dataset)}</small>{confidence && <small className="forge-confidence">{confidence}</small>}</span><strong>{record.title}</strong>{record.subtitle && <small>{record.subtitle}</small>}<em>{record.summary ?? 'Connected Forge content'}</em><small className="forge-connection-card__why">Why this matters: {explain(match)}</small></span></Link>})}</div></div>)}{showPanels && <KnowledgePanels matches={matches} />}<div className="forge-connections__discovery"><strong>Players also viewed</strong><span>{matches.slice(0, 3).map((match) => match.record.title).join(' · ')}</span></div></section>
}

