import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

type ProviderOperations = {
  configured: boolean
  configEnabled: boolean
  environment: string
  health: { enabled: boolean; circuitState: string; status: string; reason: string; changedAt: string | null; updatedAt: string | null } | null
}

type CatalogueItem = {
  id: string
  code: string
  version: string
  expiresAt: string | null
  lifecycle: string
  source: string
  approval: string
  eligibility: string
  attempts: number
  completed: number
  rewarded: number
  alreadyClaimed: number
  failed: number
  skipped: number
  retryable: number
  lastOutcome: string | null
  lastAttemptAt: string | null
}

type Catalogue = ProviderOperations & { totals: { activeCodes: number; recordedRequests: number }; catalogue: CatalogueItem[] }
type Metrics = { activeCodes: number; eligibleCodes: number; totalRequests: number; totalAttempts: number; redeemed: number; alreadyClaimed: number; failed: number; skipped: number; transientFailures: number; recentSuccessRate: number | null; lastSuccessfulProviderCall: string | null; lastFailure: string | null }
type ApiPayload<T> = { status?: string; data?: T; message?: string }
type Filter = 'all' | 'active' | 'expired' | 'eligible' | 'ineligible' | 'outcome' | 'source'

async function readApiPayload<T>(response: Response): Promise<ApiPayload<T>> {
  const text = await response.text()
  if (!text.trim()) return {}
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) throw new Error(`The Admin service returned an unexpected response (HTTP ${response.status}).`)
  try { return JSON.parse(text) as ApiPayload<T> } catch { throw new Error(`The Admin service returned invalid JSON (HTTP ${response.status}).`) }
}

function humanHealth(operations: ProviderOperations | null) {
  if (!operations) return 'Unknown or unavailable'
  if (!operations.configured || !operations.configEnabled) return 'Environment disabled'
  if (operations.health?.circuitState === 'open') return 'Circuit open'
  if (operations.health?.status === 'degraded') return 'Provider degraded'
  if (operations.health?.enabled) return 'Healthy and available'
  return 'Admin paused'
}

function humanReason(value: string | undefined) {
  return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'No provider health record'
}

function outcomeMatches(item: CatalogueItem) {
  return Boolean(item.lastOutcome || item.attempts === 0)
}

export function GiftRedemptionOperationsPage() {
  const { session } = useAuth()
  const [operations, setOperations] = useState<ProviderOperations | null>(null)
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({ operations: '', catalogue: '', metrics: '' })

  const request = useCallback(async <T,>(action: string, init?: RequestInit) => {
    if (!session?.access_token) throw new Error('A valid Forge session is required.')
    const response = await fetch(`/api/giftcodes?action=${action}`, { ...init, headers: { Authorization: `Bearer ${session.access_token}`, ...(init?.headers ?? {}) } })
    const payload = await readApiPayload<T>(response)
    if (!response.ok || payload.status !== 'success' || payload.data === undefined) throw new Error(payload.message ?? `The ${action} panel is temporarily unavailable.`)
    return payload.data
  }, [session?.access_token])

  const loadOperations = useCallback(async () => {
    try { setOperations(await request<ProviderOperations>('operations')); setErrors((current) => ({ ...current, operations: '' })) }
    catch (error) { setErrors((current) => ({ ...current, operations: error instanceof Error ? error.message : 'Provider status is temporarily unavailable.' })) }
  }, [request])

  const loadCatalogue = useCallback(async () => {
    try { setCatalogue(await request<Catalogue>('catalogue')); setErrors((current) => ({ ...current, catalogue: '' })) }
    catch (error) { setErrors((current) => ({ ...current, catalogue: error instanceof Error ? error.message : 'The code catalogue is temporarily unavailable.' })) }
  }, [request])

  const loadMetrics = useCallback(async () => {
    try { setMetrics(await request<Metrics>('metrics')); setErrors((current) => ({ ...current, metrics: '' })) }
    catch (error) { setErrors((current) => ({ ...current, metrics: error instanceof Error ? error.message : 'Aggregate metrics are temporarily unavailable.' })) }
  }, [request])

  useEffect(() => {
    if (!session?.access_token) return
    void Promise.all([loadOperations(), loadCatalogue(), loadMetrics()])
  }, [loadCatalogue, loadMetrics, loadOperations, session?.access_token])

  async function setEnabled(enabled: boolean) {
    if (!operations?.configEnabled) { setMessage('The environment feature flag remains disabled; the provider gate cannot override it.'); return }
    try {
      setMessage('Saving provider state…')
      await request<ProviderOperations>('operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, reasonCode: enabled ? 'admin_enabled' : 'admin_paused' }) })
      await loadOperations()
      setMessage(enabled ? 'Auto Redeem enabled at the provider gate.' : 'Auto Redeem paused at the provider gate.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Provider state could not be saved.') }
  }

  const visibleCodes = useMemo(() => (catalogue?.catalogue ?? []).filter((item) => {
    if (filter === 'all') return true
    if (filter === 'active') return item.lifecycle === 'active'
    if (filter === 'expired') return item.lifecycle === 'expired'
    if (filter === 'eligible') return item.eligibility === 'provider-eligible'
    if (filter === 'ineligible') return item.eligibility !== 'provider-eligible'
    if (filter === 'outcome') return outcomeMatches(item)
    return Boolean(item.source)
  }), [catalogue, filter])

  const statusValue = operations ? `${humanHealth(operations)} · ${humanReason(operations.health?.reason)}` : 'Unknown or unavailable'
  return <main className="admin-page gift-admin-page">
    <section className="admin-page__header">
      <p className="admin-page__eyebrow">Forge Admin · Gift Centre</p>
      <h1>Auto Redeem operations</h1>
      <p className="admin-page__intro">Review the server-enforced provider gate and safe aggregate Gift Code operations. Credentials, signatures and complete Player IDs are never displayed.</p>
    </section>

    {message && <p className="admin-notice" role="status">{message}</p>}
    <section className="gift-admin-summary" aria-labelledby="gift-provider-summary-title">
      <div className="gift-admin-section-heading"><div><p className="admin-page__eyebrow">Operational summary</p><h2 id="gift-provider-summary-title">Provider status</h2></div><span>{humanHealth(operations)}</span></div>
      {errors.operations && <p className="admin-panel-error" role="status">{errors.operations}</p>}
      <div className="gift-admin-card-grid">
        <dl><dt>Environment configuration</dt><dd>{operations?.configured ? 'Configured' : 'Not configured'}</dd></dl>
        <dl><dt>Environment feature flag</dt><dd>{operations?.configEnabled ? 'Enabled' : 'Disabled'}</dd></dl>
        <dl><dt>Admin provider state</dt><dd>{operations?.health?.enabled ? 'Enabled' : 'Paused'}</dd></dl>
        <dl><dt>Circuit state</dt><dd>{operations?.health?.circuitState ?? 'Unknown'}</dd></dl>
        <dl><dt>Provider health</dt><dd>{statusValue}</dd></dl>
        <dl><dt>Last successful provider call</dt><dd>{metrics?.lastSuccessfulProviderCall ? new Date(metrics.lastSuccessfulProviderCall).toLocaleString('en-GB') : 'Not recorded'}</dd></dl>
        <dl><dt>Last failure</dt><dd>{metrics?.lastFailure ? new Date(metrics.lastFailure).toLocaleString('en-GB') : operations?.health?.reason ?? 'Not recorded'}</dd></dl>
        <dl><dt>Recent request count</dt><dd>{metrics?.totalRequests ?? 'Unavailable'}</dd></dl>
        <dl><dt>Recent attempt count</dt><dd>{metrics?.totalAttempts ?? 'Unavailable'}</dd></dl>
      </div>
      {!operations?.configEnabled && <p className="gift-admin-callout">The environment feature flag is disabled. Enable provider gate cannot override this kill switch, and no provider call can be made.</p>}
      <div className="gift-redemption-panel__actions"><button type="button" className="button button--primary" disabled={!operations?.configEnabled || !operations?.configured} onClick={() => void setEnabled(true)}>Enable provider gate</button><button type="button" className="button button--secondary" disabled={!operations} onClick={() => void setEnabled(false)}>Pause provider gate</button></div>
    </section>

    <section className="gift-admin-metrics" aria-labelledby="gift-metrics-title">
      <div className="gift-admin-section-heading"><div><p className="admin-page__eyebrow">Safe server aggregates</p><h2 id="gift-metrics-title">Aggregate metrics</h2></div></div>
      {errors.metrics && <p className="admin-panel-error" role="status">{errors.metrics}</p>}
      <div className="gift-admin-metric-grid">{[['Active codes', metrics?.activeCodes], ['Eligible codes', metrics?.eligibleCodes], ['Total requests', metrics?.totalRequests], ['Total attempts', metrics?.totalAttempts], ['Redeemed', metrics?.redeemed], ['Already claimed', metrics?.alreadyClaimed], ['Failed', metrics?.failed], ['Skipped', metrics?.skipped], ['Transient failures', metrics?.transientFailures], ['Recent success rate', metrics?.recentSuccessRate === null ? 'No completed requests' : metrics ? `${Math.round(metrics.recentSuccessRate * 100)}%` : undefined]].map(([label, value]) => <dl key={String(label)}><dt>{label}</dt><dd>{value ?? 'Unavailable'}</dd></dl>)}</div>
    </section>

    <section className="gift-admin-catalogue" aria-labelledby="gift-catalogue-title">
      <div className="gift-admin-section-heading"><div><p className="admin-page__eyebrow">Canonical active-code feed</p><h2 id="gift-catalogue-title">Active-code catalogue</h2></div><span>{catalogue?.totals.activeCodes ?? 0} active</span></div>
      {errors.catalogue && <p className="admin-panel-error" role="status">{errors.catalogue}</p>}
      <div className="gift-admin-filters"><label htmlFor="gift-catalogue-filter">Filter catalogue<select id="gift-catalogue-filter" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="all">All codes</option><option value="active">Active</option><option value="expired">Expired</option><option value="eligible">Eligible</option><option value="ineligible">Ineligible</option><option value="outcome">Has outcome</option><option value="source">By source</option></select></label></div>
      {visibleCodes.length === 0 ? <div className="gift-admin-empty"><h3>No catalogue entries match this filter</h3><p>The secure feed currently has no records for this view. No provider action is available from this page.</p></div> : <div className="gift-admin-table-wrap"><table><caption className="sr-only">Secure Gift Code catalogue</caption><thead><tr><th>Code</th><th>Status</th><th>Expiry</th><th>Eligibility</th><th>Source</th><th>Attempts</th><th>Outcomes</th><th>Last processed</th></tr></thead><tbody>{visibleCodes.map((item) => <tr key={`${item.id}-${item.version}`}><th scope="row">{item.code}</th><td>{item.lifecycle}</td><td>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString('en-GB') : 'No expiry'}</td><td>{item.eligibility}</td><td>{item.source}</td><td>{item.attempts}</td><td>{item.rewarded} redeemed · {item.alreadyClaimed} claimed · {item.failed} failed · {item.skipped} skipped</td><td>{item.lastAttemptAt ? new Date(item.lastAttemptAt).toLocaleString('en-GB') : 'Not processed'}</td></tr>)}</tbody></table></div>}
      <p className="gift-admin-footnote">Per-player details remain in private redemption history. This admin view exposes aggregate outcomes only.</p>
    </section>
  </main>
}
