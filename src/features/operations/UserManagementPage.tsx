import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getUser,
  getUsers,
  linkPlayerForUser,
  lookupPlayerForUser,
  mutateUser,
  type ManagedPlayerLookup,
  type UserListQuery,
  type UserListResponse,
} from '../../services/userManagementService'
import type { UserDetail } from '../../../server/identity/contracts'

const emptyList: UserListResponse = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 }

function StatusBadge({ value }: { value: string }) {
  return <span className="status-badge">{value.replaceAll('_', ' ')}</span>
}

export function UserManagementPage() {
  const [query, setQuery] = useState<UserListQuery>({ page: 1, pageSize: 20 })
  const [result, setResult] = useState<UserListResponse>(emptyList)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void getUsers(query)
        .then(setResult)
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'User Management is unavailable.'))
        .finally(() => setLoading(false))
    }, query.search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [query])

  return (
    <main className="operations-users">
      <header className="operations-users__header">
        <div>
          <p className="eyebrow">Player Operations</p>
          <h1>User Management</h1>
          <p>Manage Forge access and resolve Player Account linking failures.</p>
        </div>
        <span className="status-badge">Server paginated</span>
      </header>

      <section className="operations-users__filters" aria-label="User filters">
        <label>
          Search
          <input
            value={query.search ?? ''}
            onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })}
            placeholder="Name, email, State or exact Player ID"
          />
        </label>
        <label>
          Role
          <select value={query.role ?? ''} onChange={(event) => setQuery({ ...query, role: event.target.value || undefined, page: 1 })}>
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Administrator</option>
            <option value="moderator">Moderator</option>
            <option value="content_creator">Content Creator</option>
            <option value="contributor">Contributor</option>
            <option value="viewer">Player</option>
          </select>
        </label>
        <label>
          Status
          <select value={query.status ?? ''} onChange={(event) => setQuery({ ...query, status: event.target.value || undefined, page: 1 })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="restricted">Restricted</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </label>
      </section>

      {error && <div className="error-state" role="alert">{error}</div>}
      {loading && <div className="loading-state" role="status">Loading Forge identities…</div>}
      {!loading && !error && result.items.length === 0 && (
        <div className="empty-state"><h2>No Forge identities found</h2><p>Try a broader search or remove a filter.</p></div>
      )}
      {!loading && !error && result.items.length > 0 && (
        <>
          <div className="operations-users__table-wrap">
            <table>
              <caption className="sr-only">Forge identities</caption>
              <thead><tr><th scope="col">Identity</th><th scope="col">Roles</th><th scope="col">Status</th><th scope="col">Player</th><th scope="col">State</th><th scope="col">Consent</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {result.items.map((user) => (
                  <tr key={user.userId}>
                    <th scope="row"><Link to={`/operations/users/${user.userId}`}>{user.displayName}</Link><small>{user.safeEmail ?? 'Email masked'}</small></th>
                    <td>{user.roles.map((role) => <StatusBadge key={role} value={role} />)}</td>
                    <td><StatusBadge value={user.accountStatus} /></td>
                    <td>{user.linkedPlayerCount ? `${user.linkedPlayerCount} linked` : 'Unlinked'}</td>
                    <td>{user.kingdom ?? '—'}</td>
                    <td>{user.autoRedeemConsent}</td>
                    <td><Link className="button button--secondary" to={`/operations/users/${user.userId}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="operations-users__pagination" aria-label="User list pagination">
            <button type="button" disabled={result.page <= 1} onClick={() => setQuery({ ...query, page: result.page - 1 })}>Previous</button>
            <span>Page {result.page} of {Math.max(1, result.totalPages)} · {result.total} identities</span>
            <button type="button" disabled={result.page >= result.totalPages} onClick={() => setQuery({ ...query, page: result.page + 1 })}>Next</button>
          </nav>
        </>
      )}
    </main>
  )
}

export function UserDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [reason, setReason] = useState('')
  const [role, setRole] = useState('contributor')
  const [status, setStatus] = useState('active')

  const [playerId, setPlayerId] = useState('')
  const [kingdomId, setKingdomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [playerReason, setPlayerReason] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [playerWorking, setPlayerWorking] = useState(false)
  const [playerLookup, setPlayerLookup] = useState<ManagedPlayerLookup | null>(null)
  const [playerMessage, setPlayerMessage] = useState('')

  async function refreshUser() {
    const value = await getUser(userId)
    setUser(value)
    setStatus(value.accountStatus)
  }

  useEffect(() => {
    void refreshUser().catch((reasonValue: unknown) => setError(reasonValue instanceof Error ? reasonValue.message : 'User detail is unavailable.'))
  }, [userId])

  async function mutate(action: 'assign_role' | 'revoke_role' | 'change_status') {
    setWorking(true)
    setError('')
    try {
      await mutateUser(userId, { action, role: action !== 'change_status' ? role : undefined, status: action === 'change_status' ? status : undefined, reason })
      setReason('')
      await refreshUser()
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : 'The identity mutation failed.')
    } finally {
      setWorking(false)
    }
  }

  function cleanPlayerValues() {
    return {
      playerId: playerId.trim().replace(/\s+/gu, ''),
      kingdomId: kingdomId.trim(),
    }
  }

  async function lookupPlayer() {
    setPlayerWorking(true)
    setError('')
    setPlayerMessage('')
    setPlayerLookup(null)
    try {
      const result = await lookupPlayerForUser(userId, cleanPlayerValues())
      setPlayerLookup(result)
      setPlayerName(result.player.name)
      setPlayerMessage(`Found ${result.player.name} in State ${result.player.kingdom}.`)
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : 'The Player lookup failed.')
    } finally {
      setPlayerWorking(false)
    }
  }

  async function applyPlayer(mode: 'lookup' | 'manual') {
    setPlayerWorking(true)
    setError('')
    setPlayerMessage('')
    try {
      await linkPlayerForUser(userId, {
        ...cleanPlayerValues(),
        playerName: playerName.trim() || undefined,
        reason: playerReason,
        mode,
        replaceExisting,
      })
      setPlayerLookup(null)
      setPlayerReason('')
      setReplaceExisting(false)
      setPlayerMessage(mode === 'lookup' ? 'Verified Player Account linked successfully.' : 'Player Account linked with administrator community verification.')
      await refreshUser()
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : 'The Player Account link failed.')
    } finally {
      setPlayerWorking(false)
    }
  }

  if (error && !user) return <main className="workspace-status"><p className="eyebrow">Forge Identity</p><h1>User detail unavailable</h1><p role="alert">{error}</p><Link className="button button--secondary" to="/operations/users">Return to User Management</Link></main>
  if (!user) return <main className="workspace-status"><p className="eyebrow">Forge Identity</p><h1>Loading user detail…</h1></main>

  const playerValuesValid = /^\d{1,20}$/u.test(playerId.trim().replace(/\s+/gu, '')) && /^\d{1,4}$/u.test(kingdomId.trim()) && Number(kingdomId) >= 1 && Number(kingdomId) <= 9999
  const playerMutationValid = playerValuesValid && playerReason.trim().length >= 3

  return (
    <main className="operations-user-detail">
      <header className="operations-user-detail__header">
        <div>
          <Link to="/operations/users">← User Management</Link>
          <p className="eyebrow">Forge Identity</p>
          <h1>{user.displayName}</h1>
          <p>{user.safeEmail ?? 'Email masked'} · joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <StatusBadge value={user.accountStatus} />
      </header>

      {error && <div className="error-state" role="alert">{error}</div>}
      {playerMessage && <div className="success-state" role="status">{playerMessage}</div>}

      <div className="operations-user-detail__grid">
        <section>
          <h2>Overview</h2>
          <dl>
            <div><dt>Account status</dt><dd><StatusBadge value={user.accountStatus} /></dd></div>
            <div><dt>Roles</dt><dd>{user.roles.map((item) => <StatusBadge key={item} value={item} />)}</dd></div>
            <div><dt>Workspaces</dt><dd>{user.workspaces.join(', ')}</dd></div>
            <div><dt>Last sign-in</dt><dd>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Unavailable'}</dd></div>
          </dl>
        </section>

        <section>
          <h2>Player Accounts</h2>
          {user.linkedPlayers.length === 0 ? <p>No linked Player Accounts.</p> : <ul>{user.linkedPlayers.map((player) => <li key={player.playerAccountId}><strong>{player.playerName}</strong> · {player.maskedPlayerId} · State {player.kingdom} · {player.verificationStatus}</li>)}</ul>}
        </section>

        {user.canManagePlayers && (
          <section className="operations-user-detail__player-manager">
            <p className="eyebrow">Player recovery</p>
            <h2>Link or correct Player Account</h2>
            <p>Enter the exact Player ID and State. Lookup verifies that both values match. Manual linking is available only when you have independently confirmed the player.</p>
            <div className="operations-user-detail__player-fields">
              <label htmlFor="managed-player-id">Player ID<input id="managed-player-id" inputMode="numeric" autoComplete="off" maxLength={20} value={playerId} onChange={(event) => { setPlayerId(event.target.value); setPlayerLookup(null) }} placeholder="e.g. 125500338" /></label>
              <label htmlFor="managed-player-state">State<input id="managed-player-state" inputMode="numeric" autoComplete="off" maxLength={4} value={kingdomId} onChange={(event) => { setKingdomId(event.target.value); setPlayerLookup(null) }} placeholder="e.g. 850" /></label>
              <label htmlFor="managed-player-name">Player name <span>(manual link)</span><input id="managed-player-name" maxLength={120} value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder={user.displayName} /></label>
            </div>
            <label className="operations-user-detail__reason" htmlFor="player-link-reason">Linking reason<textarea id="player-link-reason" value={playerReason} onChange={(event) => setPlayerReason(event.target.value)} minLength={3} maxLength={2000} placeholder="Why is this administrator link required?" /></label>
            {user.linkedPlayers.length > 0 && <label className="operations-user-detail__checkbox"><input type="checkbox" checked={replaceExisting} onChange={(event) => setReplaceExisting(event.target.checked)} /> Replace the existing linked Player Account</label>}
            {playerLookup && <article className="operations-user-detail__lookup-result"><strong>{playerLookup.player.name}</strong><span>Player ID {playerLookup.player.playerId} · State {playerLookup.player.kingdom} · {playerLookup.player.levelRenderedDetailed || playerLookup.player.levelRendered || `Level ${playerLookup.player.level}`}</span></article>}
            <div className="operations-user-detail__actions">
              <button type="button" disabled={playerWorking || !playerValuesValid} onClick={() => void lookupPlayer()}>{playerWorking ? 'Working…' : 'Lookup details'}</button>
              <button type="button" disabled={playerWorking || !playerMutationValid} onClick={() => void applyPlayer('lookup')}>Apply verified lookup</button>
              <button type="button" className="button--warning" disabled={playerWorking || !playerMutationValid} onClick={() => void applyPlayer('manual')}>Apply manual link</button>
            </div>
            <p className="operations-user-detail__mutations-hint">Manual links are recorded as community verified by Forge Admin. They do not claim an official Century Games verification.</p>
          </section>
        )}

        <section>
          <h2>Roles and Permissions</h2>
          <p>{user.capabilities.length ? user.capabilities.join(', ') : 'No internal capabilities.'}</p>
          <p className="operations-user-detail__mutations-hint">Every change is server-authorised and added to Audit History. Enter a reason before selecting a mutation.</p>
          <div className="operations-user-detail__reason"><label htmlFor="mutation-reason">Mutation reason</label><textarea id="mutation-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={2000} placeholder="Why is this role or status change required?" /></div>
          <div className="operations-user-detail__actions">
            <label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="viewer">Player</option><option value="contributor">Contributor</option><option value="content_creator">Content Creator</option><option value="moderator">Moderator</option><option value="admin">Administrator</option><option value="owner">Owner</option></select></label>
            <button type="button" disabled={working || reason.trim().length < 3} onClick={() => void mutate('assign_role')}>Assign role</button>
            <button type="button" className="button--danger" disabled={working || reason.trim().length < 3} onClick={() => void mutate('revoke_role')}>Revoke role</button>
          </div>
        </section>

        <section>
          <h2>Account status</h2>
          <p>Status changes require a reason and are protected against self-lockout and final-Owner changes.</p>
          <div className="operations-user-detail__actions"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="restricted">Restricted</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option></select></label><button type="button" disabled={working || reason.trim().length < 3} onClick={() => void mutate('change_status')}>Save status</button></div>
        </section>

        <section><h2>Auto Redeem</h2><p>Consent: <strong>{user.autoRedeemConsent}</strong>. Provider payloads and private redemption details are never shown here.</p></section>
        <section><h2>Audit History</h2>{user.audit.length === 0 ? <p>No identity audit events.</p> : <ol>{user.audit.map((entry) => <li key={entry.id}><strong>{entry.action}</strong> · {entry.reason} · {new Date(entry.createdAt).toLocaleString()}</li>)}</ol>}</section>
      </div>
      <button type="button" className="button button--secondary" onClick={() => navigate('/operations/users')}>Back to users</button>
    </main>
  )
}
