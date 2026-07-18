import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePlayerIdentity } from '../../context/PlayerIdentityContext'

const OFFICIAL_REDEMPTION_URL =
  'https://ks-giftcode.centurygame.com/'

function getVerificationLabel(status: string) {
  switch (status) {
    case 'verified':
      return 'Verified player'

    case 'officially_verified':
      return 'Officially verified'

    case 'community_verified':
      return 'Community verified'

    case 'pending':
      return 'Verification pending'

    case 'rejected':
      return 'Verification rejected'

    case 'revoked':
      return 'Verification revoked'

    default:
      return 'Linked, not verified'
  }
}

export function GiftRedemptionFoundationPanel() {
  const { user, session, loading: authLoading } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const identityLoading =
    authLoading || loadingPlayerAccount

  const [context, setContext] = useState<{
    player: { name: string; playerId: string; kingdom: number; verificationStatus: string } | null
    consent: { grantedAt: string; version: string } | null
    provider: { configured: boolean; enabled: boolean }
    codes: { active: number; ready: number; processed: number }
    eligibility: { eligible: boolean; reasons: string[] }
  } | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Array<{ code: string; status: string; retryable: boolean; message: string }>>([])
  const [history, setHistory] = useState<Array<{ id: string; status: string; requested_code_count: number; processed_code_count: number; created_at: string; requests: Array<{ code_publication_id: string; status: string; result_code: string }> }>>([])

  const call = useCallback(async (action: string, init?: RequestInit) => {
    if (!session?.access_token) return null
    const response = await fetch(`/api/giftcodes?action=${action}`, { ...init, headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
    const payload = await response.json().catch(() => null) as { status?: string; data?: unknown; message?: string } | null
    if (!response.ok || payload?.status !== 'success') throw new Error(payload?.message ?? 'The Gift Centre request could not be completed.')
    return payload.data
  }, [session?.access_token])

  useEffect(() => {
    if (!session) { setContext(null); return }
    void call('context').then((data) => setContext(data as typeof context)).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Gift Centre status unavailable.'))
    void call('history').then((data) => setHistory((data as typeof history) ?? [])).catch(() => setHistory([]))
  }, [call, session])

  async function grant() {
    setBusy(true); setMessage('')
    try { await call('consent', { method: 'POST', body: '{}' }); setConsentChecked(false); setContext((await call('context')) as typeof context); setMessage('Consent granted. You can now redeem active codes when ready.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Consent could not be saved.') } finally { setBusy(false) }
  }

  async function withdraw() {
    setBusy(true); setMessage('')
    try { await call('consent', { method: 'DELETE' }); setContext((await call('context')) as typeof context); setMessage('Consent withdrawn. Future redemption is paused.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Consent could not be withdrawn.') } finally { setBusy(false) }
  }

  async function redeem() {
    setBusy(true); setMessage('Processing codes one at a time…'); setResults([])
    try { const data = await call('redeem', { method: 'POST', body: '{}' }) as { results: typeof results } | null; setResults(data?.results ?? []); setContext((await call('context')) as typeof context); setHistory(((await call('history')) as typeof history) ?? []); setMessage('Redemption run complete. Review each result below.') } catch (error) { setMessage(error instanceof Error ? error.message : 'The redemption run could not be completed.') } finally { setBusy(false) }
  }

  return (
    <section
      className="gift-redemption-panel"
      aria-labelledby="gift-redemption-title"
    >
      <div className="gift-redemption-panel__intro">
        <p className="eyebrow">Gift Centre · Auto Redeem</p>

        <h2 id="gift-redemption-title">
          Redeem active codes safely
        </h2>

        <p>
          Auto Redeem submits only the linked, verified Governor and
          active Gift Codes when you start a run. Forge never asks for
          or stores a game password, and manual copying remains available.
        </p>
      </div>

      <div
        className="gift-redemption-panel__identity"
        aria-live="polite"
      >
        {identityLoading ? (
          <p>Checking your linked Governor…</p>
        ) : !user ? (
          <>
            <strong>No Forge account signed in</strong>
            <span>
              You can still redeem manually, or sign in to
              see your linked Governor here.
            </span>
            <Link
              to="/my-forge"
              className="button button--secondary"
            >
              Open My Forge
            </Link>
          </>
        ) : !playerAccount ? (
          <>
            <strong>No Governor linked</strong>
            <span>
              Link your Player ID in My Forge before using
              any future account-aware redemption tools.
            </span>
            <Link
              to="/my-forge"
              className="button button--secondary"
            >
              Link a Governor
            </Link>
          </>
        ) : (
          <>
            <div className="gift-redemption-panel__player">
              {playerAccount.profile_photo ? (
                <img
                  src={playerAccount.profile_photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span aria-hidden="true">
                  {playerAccount.player_name
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <div>
                <strong>{playerAccount.player_name}</strong>
                <span>
                  Kingdom {playerAccount.kingdom_id}
                </span>
              </div>
            </div>

            <dl className="gift-redemption-panel__details">
              <div>
                <dt>Player ID</dt>
                <dd>{playerAccount.player_id}</dd>
              </div>
              <div>
                <dt>Identity status</dt>
                <dd>
                  {getVerificationLabel(
                    playerAccount.verification_status,
                  )}
                </dd>
              </div>
            </dl>

            <Link
              to="/my-forge"
              className="gift-redemption-panel__change"
            >
              Review linked Governor
            </Link>
          </>
        )}
      </div>

      <div className="gift-redemption-panel__actions">
        <a
          href={OFFICIAL_REDEMPTION_URL}
          className="button button--primary"
          target="_blank"
          rel="noreferrer"
        >
          Open official redemption page
        </a>

        <p>
            <strong>Manual fallback remains available.</strong>{' '}
            Automatic redemption is server-controlled and may be paused
            when the provider is unavailable.
        </p>
      </div>

      {user && (
        <div className="gift-redemption-panel__auto" aria-live="polite">
          {context ? (
            <>
              <div className="gift-redemption-panel__summary">
                <strong>Auto Redeem status</strong>
                <span>{context.provider.enabled ? 'Available' : context.provider.configured ? 'Paused' : 'Not configured'}</span>
                <span>{context.codes.ready} ready · {context.codes.processed} already handled · {context.codes.active} active</span>
              </div>
              {!context.consent ? (
                <div>
                  <label>
                    <input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} />
                    I understand Forge will submit my linked Player ID and selected codes, record normalised outcomes and timestamps, will not request a game password, and will process codes only when I start a run.
                  </label>
                  <button type="button" className="button button--primary" disabled={!consentChecked || busy || !context.eligibility.eligible && !context.eligibility.reasons.includes('consent_required')} onClick={() => void grant()}>Grant Auto Redeem consent</button>
                </div>
              ) : (
                <div className="gift-redemption-panel__actions">
                  <p>Consent active since {new Date(context.consent.grantedAt).toLocaleString('en-GB')}.</p>
                  <button type="button" className="button button--primary" disabled={busy || !context.eligibility.eligible} onClick={() => void redeem()}>{busy ? 'Processing…' : 'Redeem available codes'}</button>
                  <button type="button" className="button button--secondary" disabled={busy} onClick={() => void withdraw()}>Withdraw consent</button>
                </div>
              )}
              {!context.eligibility.eligible && <p role="status">Next step: {context.eligibility.reasons[0]?.replaceAll('_', ' ') ?? 'check your linked Governor.'}</p>}
              {message && <p role="status">{message}</p>}
              {results.length > 0 && <div><h3>Run results</h3>{results.map((item) => <p key={`${item.code}-${item.status}`}><strong>{item.code}</strong> — {item.status.replaceAll('_', ' ')}{item.retryable ? ' · Try again' : ''}<br /><span>{item.message}</span></p>)}</div>}
              {history.length > 0 && <div><h3>Private redemption history</h3>{history.map((run) => <div key={run.id}><p><strong>{new Date(run.created_at).toLocaleString('en-GB')}</strong> — {run.status.replaceAll('_', ' ')} · {run.processed_code_count}/{run.requested_code_count} processed</p>{run.requests.map((item) => <span key={`${run.id}-${item.code_publication_id}`} className="gift-redemption-panel__history-item">{item.status.replaceAll('_', ' ')} ({item.result_code})</span>)}</div>)}</div>}
            </>
          ) : (
            <>
              <div className="gift-redemption-panel__summary">
                <strong>Auto Redeem status</strong>
                <span>{message ? 'Unavailable' : 'Checking availability…'}</span>
              </div>
              <button type="button" className="button button--primary" disabled>Redeem available codes</button>
              <p role="status">{message || 'Checking provider availability. Redemption remains disabled until status is confirmed.'}</p>
            </>
          )}
        </div>
      )}
    </section>
  )
}
