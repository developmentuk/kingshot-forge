import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRole } from '../../context/RoleContext'
import './forgeContentStudio.css'

type Overview = {
  pendingImports: number; validationErrors: number; awaitingReview: number; awaitingApproval: number; publishedToday: number; datasets: string[]
  importStatistics: { catalogRecords: number; progressionRecords: number; totalRecords: number; warnings: number; blockingErrors: number }
  recentActivity: Array<{ id: string; dataset_key: string; state: string; original_filename: string; created_at: string }>
  publicationQueue: Array<{ id: string; dataset_id?: string; record_id?: string; status: string }>
  relationshipImpact: Record<string, number>
  dependencyGraph: Array<{ id: string; label: string; kind: string; dependsOn: string[] }>
  refreshOrchestration: { search: string; knowledgeGraph: string; audit: string }
  lastImport: { id: string; state: string; filename: string } | null
}

const fallback: Overview = { pendingImports: 0, validationErrors: 0, awaitingReview: 1, awaitingApproval: 1, publishedToday: 0, datasets: ['buildings'], importStatistics: { catalogRecords: 10, progressionRecords: 587, totalRecords: 597, warnings: 8, blockingErrors: 0 }, recentActivity: [], publicationQueue: [], relationshipImpact: { pages: 10, guides: 3, heroes: 0, creators: 0, searches: 597, forgeConnections: 10 }, dependencyGraph: [{ id: 'buildings', label: 'Buildings', kind: 'dataset', dependsOn: ['truegold', 'resources', 'prerequisites'] }, { id: 'player-pages', label: 'Player building pages', kind: 'page', dependsOn: ['buildings'] }, { id: 'search', label: 'Search projections', kind: 'index', dependsOn: ['buildings'] }, { id: 'connections', label: 'Forge Connections', kind: 'graph', dependsOn: ['buildings'] }], refreshOrchestration: { search: 'queued-after-publish', knowledgeGraph: 'queued-after-search', audit: 'append-only' }, lastImport: null }

export function ForgeContentStudioPage() {
  const { session } = useAuth()
  const { hasPermission } = useRole()
  const [data, setData] = useState<Overview>(fallback)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    fetch('/api/data-studio/overview', { headers: { Accept: 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) } }).then(async (res) => {
      const payload = await res.json() as { status: string; data?: Overview; message?: string }
      if (!res.ok || payload.status !== 'success') throw new Error(payload.message ?? 'Unable to load Content Studio.')
      if (active && payload.data) setData(payload.data)
    }).catch((value: unknown) => { if (active) setError(value instanceof Error ? value.message : 'Content Studio is using the staged checkpoint.') })
    return () => { active = false }
  }, [session?.access_token])
  const publicationState = data.lastImport?.state ?? 'staged'
  const publicationLabel = publicationState === 'published' ? 'published' : publicationState.replaceAll('_', ' ')

  return <main className="admin-page forge-content-studio">
    <section className="admin-page__header forge-studio-hero"><div><p className="admin-page__eyebrow">Forge Content Studio</p><h1>Editorial publishing workspace</h1><p className="admin-page__intro">Review governed source data, understand its relationship impact, and move it through the publication gate. Buildings is currently {publicationLabel}.</p></div><div className="forge-studio-checkpoint"><span>Owner checkpoint</span><strong>Buildings · {publicationLabel}</strong><small>10 catalog · 587 progression · 0 blockers · 8 warnings</small></div></section>
    {error && <p className="forge-studio-notice" role="status">{error}</p>}
    <section className="forge-studio-metrics" aria-label="Content Studio status">{[['Pending Imports', data.pendingImports], ['Validation Errors', data.validationErrors], ['Awaiting Review', data.awaitingReview], ['Awaiting Approval', data.awaitingApproval], ['Published Today', data.publishedToday], ['Datasets', data.datasets.length]].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="forge-studio-flow"><div className="forge-studio-section-heading"><div><p className="editorial-admin-eyebrow">Publication guardrail</p><h2>Editorial workflow</h2></div><Link className="button button--primary" to="/admin/imports">Open import review</Link></div><div className="forge-workflow-rail">{['Review', 'Approve', 'Stage', 'Publish', 'Search Refresh', 'Relationship Refresh', 'Audit', 'Version Creation'].map((step, index) => <div key={step} className={`forge-workflow-step ${index < 3 ? 'is-ready' : ''}`}><span>{index + 1}</span><strong>{step}</strong><small>{index < 3 ? 'Available' : 'After approval'}</small></div>)}</div><p className="forge-studio-caption">No direct file-picker publication path exists. Search and relationship refreshes are downstream orchestration steps and audit/version creation remain append-only.</p></section>
    <div className="forge-studio-columns"><section className="forge-studio-panel"><div className="forge-studio-section-heading"><div><p className="editorial-admin-eyebrow">Pre-approval analysis</p><h2>Relationship impact</h2></div><span className="forge-studio-pill">Before approval</span></div><div className="forge-impact-grid">{Object.entries(data.relationshipImpact).map(([key, value]) => <div key={key}><strong>{value}</strong><span>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</span></div>)}</div><p className="forge-studio-caption">Editors can see affected pages, guides, heroes, creators, searches and Forge Connections before approving a version.</p></section><section className="forge-studio-panel"><div className="forge-studio-section-heading"><div><p className="editorial-admin-eyebrow">Dependency graph</p><h2>Dataset dependencies</h2></div><span className="forge-studio-pill">Buildings</span></div><div className="forge-dependency-graph">{data.dependencyGraph.map((node) => <div className="forge-graph-node" key={node.id}><strong>{node.label}</strong><small>{node.kind} · depends on {node.dependsOn.join(', ') || 'none'}</small></div>)}</div></section></div>
    <div className="forge-studio-columns"><section className="forge-studio-panel"><div className="forge-studio-section-heading"><div><p className="editorial-admin-eyebrow">Import analytics</p><h2>Buildings source health</h2></div><Link className="button button--secondary button--small" to="/admin/data/buildings">Browse records</Link></div><div className="forge-analytics-bars"><div><span>Catalog</span><strong>{data.importStatistics.catalogRecords}</strong><i style={{ width: '24%' }} /></div><div><span>Progression</span><strong>{data.importStatistics.progressionRecords}</strong><i style={{ width: '92%' }} /></div><div><span>Warnings</span><strong>{data.importStatistics.warnings}</strong><i className="warning" style={{ width: '12%' }} /></div><div><span>Blocking errors</span><strong>{data.importStatistics.blockingErrors}</strong><i className="success" style={{ width: '2%' }} /></div></div></section><section className="forge-studio-panel"><div className="forge-studio-section-heading"><div><p className="editorial-admin-eyebrow">Refresh orchestration</p><h2>Downstream updates</h2></div></div><ul className="forge-refresh-list"><li><strong>Search index</strong><span>{data.refreshOrchestration.search}</span></li><li><strong>Knowledge graph</strong><span>{data.refreshOrchestration.knowledgeGraph}</span></li><li><strong>Audit timeline</strong><span>{data.refreshOrchestration.audit}</span></li></ul></section></div>
    <section className="forge-studio-panel forge-timeline-panel"><div className="forge-studio-section-heading"><div><p className="editorial-admin-eyebrow">Editorial timeline</p><h2>Buildings import history</h2></div><Link className="button button--secondary button--small" to="/admin/history">Open audit timeline</Link></div>{data.lastImport ? <div className="forge-timeline"><div><strong>Uploaded</strong><span>{data.lastImport.filename}</span></div><div><strong>Validated</strong><span>0 blocking errors · 8 warnings</span></div><div><strong>Staged</strong><span>{publicationState === 'published' ? 'Publication record retained' : 'Awaiting owner approval'}</span></div><div><strong>Published</strong><span>{publicationState === 'published' ? 'Version 1 · publication record active' : 'Not yet — owner checkpoint required'}</span></div></div> : <p className="forge-studio-caption">No authenticated import run is visible in this session. The prepared Buildings workbook remains unchanged and publication is gated.</p>}</section>
    {!hasPermission('cms.publish') && <p className="forge-studio-notice">Reviewer view: approval and publication controls require the server-side CMS publish permission.</p>}
  </main>
}
