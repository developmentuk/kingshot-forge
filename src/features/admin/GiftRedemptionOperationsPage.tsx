import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

type Catalogue = {
  configured: boolean
  configEnabled: boolean
  health: { enabled: boolean; circuitState: string; status: string; reason: string } | null
  totals: { activeCodes: number; recordedRequests: number }
  catalogue: Array<{ id: string; code: string; version: string; expiresAt: string | null; lifecycle: string; source: string; approval: string; eligibility: string; attempts: number; completed: number; rewarded: number; alreadyClaimed: number; failed: number; skipped: number; retryable: number; lastOutcome: string | null; lastAttemptAt: string | null }>
}

export function GiftRedemptionOperationsPage() {
  const { session } = useAuth()
  const [operations, setOperations] = useState<Catalogue | null>(null)
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!session?.access_token) return
    const response = await fetch('/api/giftcodes?action=catalogue', { headers: { Authorization: `Bearer ${session.access_token}` } })
    const payload = await response.json() as { data?: Catalogue; message?: string }
    if (!response.ok) throw new Error(payload.message ?? 'Operations status unavailable.')
    setOperations(payload.data ?? null)
  }, [session?.access_token])

  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Operations status unavailable.')) }, [load])

  async function setEnabled(enabled: boolean) {
    if (!session?.access_token) return
    setMessage('Saving provider state…')
    const response = await fetch('/api/giftcodes?action=operations', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, reasonCode: enabled ? 'admin_enabled' : 'admin_paused' }) })
    const payload = await response.json() as { data?: Catalogue['health']; message?: string }
    if (!response.ok) throw new Error(payload.message ?? 'Provider state could not be saved.')
    await load()
    setMessage(enabled ? 'Auto Redeem enabled at the provider gate.' : 'Auto Redeem paused at the provider gate.')
  }

  const visibleCodes = operations?.catalogue.filter((item) => filter === 'all' || (filter === 'retryable' ? item.retryable > 0 : item.lifecycle === filter)) ?? []
  return <main className="admin-page"><section className="admin-placeholder-panel"><div className="admin-placeholder-panel__body"><p className="admin-page__eyebrow">Forge Admin · Gift Centre</p><h1>Auto Redeem operations</h1><p>Use this server-enforced control to pause or resume provider calls. Credentials remain server-only and are never displayed here.</p><dl>{operations && <><div><dt>Configuration</dt><dd>{operations.configured ? operations.configEnabled ? 'Configured and enabled' : 'Configured but disabled' : 'Not configured'}</dd></div><div><dt>Provider gate</dt><dd>{operations.health?.enabled ? 'Enabled' : 'Paused'}</dd></div><div><dt>Circuit</dt><dd>{operations.health?.circuitState ?? 'open'}</dd></div><div><dt>Health</dt><dd>{operations.health?.status ?? 'disabled'} · {operations.health?.reason ?? 'provider_health_not_enabled'}</dd></div><div><dt>Catalogue</dt><dd>{operations.totals.activeCodes} active · {operations.totals.recordedRequests} recorded requests</dd></div></>}</dl><div className="gift-redemption-panel__actions"><button type="button" className="button button--primary" disabled={!operations?.configured} onClick={() => void setEnabled(true)}>Enable provider gate</button><button type="button" className="button button--secondary" onClick={() => void setEnabled(false)}>Pause provider gate</button></div>{message && <p role="status">{message}</p>}{operations && <section aria-labelledby="gift-catalogue-title"><h2 id="gift-catalogue-title">Code catalogue</h2><label htmlFor="gift-catalogue-filter">Show </label><select id="gift-catalogue-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All active</option><option value="active">Active</option><option value="retryable">Retryable outcomes</option></select><div role="table" aria-label="Gift code catalogue">{visibleCodes.map((item) => <div role="row" key={`${item.id}-${item.version}`}><strong>{item.code}</strong><span> · {item.lifecycle} · {item.eligibility} · source: {item.source} · {item.attempts} attempts · {item.rewarded} rewarded · {item.alreadyClaimed} already claimed · {item.failed} failed · {item.skipped} skipped{item.retryable ? ` · ${item.retryable} retryable` : ''} · last: {item.lastOutcome ?? 'none'}</span></div>)}</div>{visibleCodes.length === 0 && <p>No catalogue entries match this filter.</p>}<p>Per-player details remain in private redemption history. This admin view exposes aggregate outcomes only.</p></section>}</div></section></main>
}
