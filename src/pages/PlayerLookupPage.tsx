import { useEffect, useState, type FormEvent } from 'react'
import { getPlayer } from '../services/kingshotApi'
import type { KingshotPlayer } from '../types/player'

type RecentPlayer = {
  playerId: string
  name: string
  kingdom: number
  profilePhoto: string | null
}

const RECENT_PLAYERS_KEY = 'kingshot-forge-recent-player-searches'

function loadRecentPlayers(): RecentPlayer[] {
  try {
    const raw = window.localStorage.getItem(RECENT_PLAYERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is RecentPlayer =>
      typeof value === 'object' &&
      value !== null &&
      typeof value.playerId === 'string' &&
      typeof value.name === 'string' &&
      typeof value.kingdom === 'number',
    )
  } catch {
    return []
  }
}

function saveRecentPlayer(current: RecentPlayer[], player: KingshotPlayer) {
  const next = [
    { playerId: player.playerId, name: player.name, kingdom: player.kingdom, profilePhoto: player.profilePhoto },
    ...current.filter((item) => item.playerId !== player.playerId),
  ].slice(0, 6)
  window.localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(next))
  return next
}

function PlayerLookupPage() {
  const [playerId, setPlayerId] = useState('')
  const [kingdomId, setKingdomId] = useState('')
  const [player, setPlayer] = useState<KingshotPlayer | null>(null)
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>(loadRecentPlayers)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => setCopied(false), [player])

  async function searchPlayer(
    event?: FormEvent<HTMLFormElement>,
    requestedPlayerId?: string,
    requestedKingdomId?: string,
  ) {
    event?.preventDefault()
    const cleanPlayerId = (requestedPlayerId ?? playerId).trim().replace(/\s+/gu, '')
    const cleanKingdomId = (requestedKingdomId ?? kingdomId).trim()

    if (!/^\d{1,20}$/u.test(cleanPlayerId)) {
      setErrorMessage('Enter a valid Player ID using numbers only.')
      return
    }
    if (!/^\d{1,4}$/u.test(cleanKingdomId) || Number(cleanKingdomId) < 1 || Number(cleanKingdomId) > 9999) {
      setErrorMessage('Enter a valid Kingshot State between 1 and 9999.')
      return
    }

    setPlayerId(cleanPlayerId)
    setKingdomId(cleanKingdomId)
    setLoading(true)
    setErrorMessage('')
    setPlayer(null)

    try {
      const response = await getPlayer(cleanPlayerId, cleanKingdomId)
      setPlayer(response.data)
      setRecentPlayers((current) => saveRecentPlayer(current, response.data))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Player information could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  async function copyPlayerSummary() {
    if (!player) return
    const summary = [
      player.name,
      `Player ID: ${player.playerId}`,
      `State: ${player.kingdom}`,
      `Level: ${player.levelRenderedDetailed || player.levelRendered || player.level}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.alert('Copy failed. Please copy the player details manually.')
    }
  }

  function clearRecentPlayers() {
    window.localStorage.removeItem(RECENT_PLAYERS_KEY)
    setRecentPlayers([])
  }

  return (
    <section className="section page-section player-lookup-page">
      <div className="section-heading">
        <p className="eyebrow">Player Lookup</p>
        <h1 className="page-title">Find a Kingshot player</h1>
        <p>Enter the Player ID and State shown on the same Kingshot profile. Forge checks that the returned State matches before showing the result.</p>
      </div>

      <form className="player-search-panel" onSubmit={searchPlayer}>
        <div className="field">
          <label htmlFor="player-id">Player ID</label>
          <input id="player-id" type="text" inputMode="numeric" autoComplete="off" value={playerId} maxLength={20} placeholder="Example: 122223555" onChange={(event) => setPlayerId(event.target.value)} />
          <span className="field__help">Open the Kingshot profile to find the Player ID.</span>
        </div>
        <div className="field">
          <label htmlFor="player-state">State</label>
          <input id="player-state" type="text" inputMode="numeric" autoComplete="off" value={kingdomId} maxLength={4} placeholder="Example: 850" onChange={(event) => setKingdomId(event.target.value)} />
          <span className="field__help">Enter the State number from the same profile.</span>
        </div>
        <button type="submit" className="button button--primary" disabled={loading}>{loading ? 'Searching…' : 'Search Player'}</button>
      </form>

      {errorMessage && <div className="player-lookup-error" role="alert"><span>⚠️</span><div><strong>Player lookup failed</strong><p>{errorMessage}</p></div></div>}
      {loading && <div className="player-lookup-state"><span>🔎</span><h2>Searching for player…</h2><p>This may take a few seconds.</p></div>}

      {!loading && player && (
        <article className="player-profile-card">
          <div className="player-profile-card__visual">
            {player.profilePhoto ? <img src={player.profilePhoto} alt={`${player.name} profile`} className="player-profile-card__avatar" /> : <div className="player-profile-card__avatar player-profile-card__avatar--fallback">👤</div>}
            {player.levelImage && <img src={player.levelImage} alt="" className="player-profile-card__level-image" />}
          </div>
          <div className="player-profile-card__main">
            <span className="player-profile-card__label">Kingshot player</span>
            <h2>{player.name}</h2>
            <div className="player-profile-card__stats">
              <div><span>State</span><strong>{player.kingdom}</strong></div>
              <div><span>Level</span><strong>{player.levelRendered || player.level}</strong></div>
              <div><span>Player ID</span><strong>{player.playerId}</strong></div>
            </div>
            {player.levelRenderedDetailed && <p className="player-profile-card__level-detail">{player.levelRenderedDetailed}</p>}
          </div>
          <div className="player-profile-card__actions"><button type="button" className="button button--primary" onClick={() => void copyPlayerSummary()}>{copied ? 'Copied!' : 'Copy Player Details'}</button></div>
        </article>
      )}

      {!loading && !player && !errorMessage && <div className="player-lookup-state"><span>👤</span><h2>Search by Player ID and State</h2><p>The matching player profile will appear here.</p></div>}

      {recentPlayers.length > 0 && (
        <section className="recent-player-searches">
          <div className="recent-player-searches__heading"><div><p className="eyebrow">Search history</p><h2>Recent players</h2></div><button type="button" onClick={clearRecentPlayers}>Clear history</button></div>
          <div className="recent-player-searches__grid">
            {recentPlayers.map((recent) => (
              <button type="button" className="recent-player-card" key={recent.playerId} onClick={() => void searchPlayer(undefined, recent.playerId, String(recent.kingdom))}>
                {recent.profilePhoto ? <img src={recent.profilePhoto} alt="" /> : <span>👤</span>}
                <div><strong>{recent.name}</strong><small>State {recent.kingdom}</small></div><span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="compatibility-disclaimer"><strong>Player information is externally supplied</strong><p>Player data comes from the KingShot.net API. State is checked against the returned player record, but the upstream lookup itself is still based on Player ID.</p></div>
    </section>
  )
}

export default PlayerLookupPage
