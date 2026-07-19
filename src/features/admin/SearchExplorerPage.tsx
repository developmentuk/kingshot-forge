import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface SearchMatch {
  record: { id: string; dataset: string; title: string; subtitle: string | null; summary: string | null; status: string; canonical_url: string | null; confidence?: string | null; confidence_label?: string | null }
  score: number
  reasons: string[]
  relationshipType?: string
  relationshipPath?: string[]
  relationshipExplanation?: string
}

interface SearchPayload {
  results: SearchMatch[]
  simulation: { realActorId: string; simulatedRole: string }
  index: { index_version: number; projection_count: number; relationship_count: number; last_successful_refresh: string | null; stale: boolean; cache_age_ms: number | null }
}

export function SearchExplorerPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [dataset, setDataset] = useState('')
  const [relationshipFrom, setRelationshipFrom] = useState('')
  const [depth, setDepth] = useState('1')
  const [simulation, setSimulation] = useState('')
  const [payload, setPayload] = useState<SearchPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (dataset) params.set('dataset', dataset)
      if (relationshipFrom.trim()) params.set('relationshipFrom', relationshipFrom.trim())
      if (depth) params.set('depth', depth)
      if (simulation) params.set('simulate', simulation)
      try {
        const response = await fetch(`/api/admin/search?${params.toString()}`, { signal: controller.signal, headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined })
        const body = await response.json() as { status: string; data?: SearchPayload; error?: { message?: string } }
        if (!response.ok || body.status !== 'success' || !body.data) throw new Error(body.error?.message ?? 'Search request failed.')
        setPayload(body.data)
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught instanceof Error ? caught.message : 'Search request failed.')
      } finally { setLoading(false) }
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [dataset, depth, query, relationshipFrom, session?.access_token, simulation])

  async function refresh(mode: 'dataset' | 'full') {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
    const response = await fetch('/api/admin/search', { method: 'POST', headers, body: JSON.stringify({ action: 'refresh', mode, datasets: dataset ? [dataset] : undefined, confirm: mode === 'full' }) })
    if (!response.ok) setError('The requested Search refresh could not be completed.')
    else window.location.reload()
  }

  return <main className="admin-page">
    <section className="admin-page__heading"><div><p className="admin-page__eyebrow">Forge Admin · Engineering tool</p><h1>Search Explorer</h1><p>Inspect persisted published projections, ranking reasons, relationship expansion, permission simulation and index health.</p></div></section>
    <section className="admin-panel">
      <div className="admin-toolbar">
        <label>Query<input type="search" value={query} placeholder="Search published records" onChange={(event) => setQuery(event.target.value)} /></label>
        <label>Dataset<input value={dataset} placeholder="heroes, events…" onChange={(event) => setDataset(event.target.value)} /></label>
        <label>Relationship source<input value={relationshipFrom} placeholder="dataset:record-id" onChange={(event) => setRelationshipFrom(event.target.value)} /></label>
        <label>Depth<select value={depth} onChange={(event) => setDepth(event.target.value)}><option value="1">1</option><option value="2">2</option></select></label>
        <label>Simulate role<select value={simulation} onChange={(event) => setSimulation(event.target.value)}><option value="">Current actor</option><option value="viewer">Viewer</option><option value="contributor">Contributor</option><option value="moderator">Moderator</option><option value="admin">Administrator</option></select></label>
      </div>
      <div className="admin-toolbar"><button type="button" onClick={() => void refresh('dataset')}>Refresh dataset</button><button type="button" onClick={() => void refresh('full')}>Full rebuild</button></div>
      {loading && <p>Loading the registered providers…</p>}
      {error && <p role="alert">{error}</p>}
      {payload && <>
        <div className="admin-toolbar"><strong>{payload.results.length} results</strong><span>Index v{payload.index.index_version}</span><span>{payload.index.projection_count} projections · {payload.index.relationship_count} relationships</span><span>{payload.index.stale ? 'Stale fallback' : 'Fresh'}</span><span>Simulated: {payload.simulation.simulatedRole}</span></div>
        <div className="admin-table-wrapper"><table><thead><tr><th>Record</th><th>Dataset</th><th>Status</th><th>Confidence</th><th>Relationship</th><th>Provider/path</th><th>Explanation</th></tr></thead><tbody>{payload.results.map((match) => <tr key={`${match.record.dataset}:${match.record.id}`}><td><strong>{match.record.title}</strong><br /><small>{match.record.id}</small></td><td>{match.record.dataset}</td><td>{match.record.status}</td><td>{match.record.confidence_label ?? match.record.confidence ?? 'Not supplied'}</td><td>{match.relationshipType ?? '—'}</td><td>{match.relationshipPath?.join(' → ') ?? '—'}</td><td>{match.relationshipExplanation ?? (match.reasons.join(' · ') || 'relationship expansion')}</td></tr>)}</tbody></table></div>
        <p>Cache age: {payload.index.cache_age_ms === null ? 'not built' : `${payload.index.cache_age_ms}ms`} · Last successful refresh: {payload.index.last_successful_refresh ?? 'none recorded'}.</p>
      </>}
    </section>
  </main>
}

