import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

type Operations = { configured: boolean; configEnabled: boolean; health: { enabled: boolean; circuitState: string; status: string; reason: string } | null }

export function GiftRedemptionOperationsPage() {
  const { session } = useAuth()
  const [operations, setOperations] = useState<Operations | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!session?.access_token) return
    const response = await fetch('/api/giftcodes?action=operations', { headers: { Authorization: `Bearer ${session.access_token}` } })
    const payload = await response.json() as { data?: Operations; message?: string }
    if (!response.ok) throw new Error(payload.message ?? 'Operations status unavailable.')
    setOperations(payload.data ?? null)
  }, [session?.access_token])

  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Operations status unavailable.')) }, [load])

  async function setEnabled(enabled: boolean) {
    if (!session?.access_token) return
    setMessage('Saving provider state…')
    const response = await fetch('/api/giftcodes?action=operations', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, reasonCode: enabled ? 'admin_enabled' : 'admin_paused' }) })
    const payload = await response.json() as { data?: Operations['health']; message?: string }
    if (!response.ok) throw new Error(payload.message ?? 'Provider state could not be saved.')
    await load()
    setMessage(enabled ? 'Auto Redeem enabled at the provider gate.' : 'Auto Redeem paused at the provider gate.')
  }

  return <main className="admin-page"><section className="admin-placeholder-panel"><div className="admin-placeholder-panel__body"><p className="admin-page__eyebrow">Forge Admin · Gift Centre</p><h1>Auto Redeem operations</h1><p>Use this server-enforced control to pause or resume provider calls. Credentials remain server-only and are never displayed here.</p><dl>{operations && <><div><dt>Configuration</dt><dd>{operations.configured ? operations.configEnabled ? 'Configured and enabled' : 'Configured but disabled' : 'Not configured'}</dd></div><div><dt>Provider gate</dt><dd>{operations.health?.enabled ? 'Enabled' : 'Paused'}</dd></div><div><dt>Circuit</dt><dd>{operations.health?.circuitState ?? 'open'}</dd></div><div><dt>Health</dt><dd>{operations.health?.status ?? 'disabled'} · {operations.health?.reason ?? 'provider_health_not_enabled'}</dd></div></>}</dl><div className="gift-redemption-panel__actions"><button type="button" className="button button--primary" disabled={!operations?.configured} onClick={() => void setEnabled(true)}>Enable provider gate</button><button type="button" className="button button--secondary" onClick={() => void setEnabled(false)}>Pause provider gate</button></div>{message && <p role="status">{message}</p>}</div></section></main>
}
