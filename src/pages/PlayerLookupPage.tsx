import { useEffect, useState, type FormEvent } from 'react'
import { searchPublicIndexedPlayer } from '../services/playerClaimService'
import type { IndexedPlayerRecord } from '../types/playerClaim'

type RecentPlayer = {
  playerId: string
  playerName: string
  kingdomId: number
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
      typeof value.playerName === 'string' &&
      typeof value.kingdomId === 'number',
    )
  } catch {
    return []
  }
}

function saveRecentPlayer(current: RecentPlayer[], player: IndexedPlayerRecord) {
  const next = [
    {
      playerId: player.playerId,
      playerName: player.playerName,
      kingdomId: player.kingdomId,
      profilePhoto: player.profilePhoto,
    },
    ...current.filter((item) => item.playerId !== player.playerId),
  ].slice(0, 6)
  window.localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(next))
  return next
}

function formatPower(value: number | null) {
  if (value === null) return 'Not recorded'
  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function PlayerLookupPage() {
  const [playerId, setPlayerId] = useState('')
  const [kingdomId, setKingdomId] = useState('')
  const [player, setPlayer] = useState<IndexedPlayerRecord | null>(null)
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
      const indexedPlayer = await searchPublicIndexedPlayer(cleanPlayerId, cleanKingdomId)
      setPlayer(indexedPlayer)
      setRecentPlayers((current) => saveRecentPlayer(current, indexedPlayer))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The Forge player index could not be searched.')
    } finally {
      setLoading(false)
    }
  }

  async function copyPlayerSummary() {
    if (!player) return
    const summary = [
      player.playerName,
      `Player ID: ${player.playerId}`,
      `State: ${player.kingdomId}`,
      player.townCenterLevel ? `Town Centre: ${player.townCenterLevel}` : null,
      player.allianceName ? `Alliance: ${player.allianceName}` : null,
    ].filter((value): value is string => Boolean(value)).join('\n')

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
        <h1 className="page-title">Find an indexed Kingshot player</h1>
        <p>Search public player records already stored by Kingshot Forge. This is not a live Century Games lookup.</p>
      </div>

      <form className="player-search-panel" onSubmit={searchPlayer}>
        <div className="field">
          <label htmlFor="player-id">Player ID</label>
          <input id="player-id" type="text" inputMode="numeric" autoComplete="off" value={playerId} maxLength={20} placeholder="Example: 122223555" onChange={(event) => setPlayerId(event.target.value)} />
          <span className="field__help">Open the in-game profile to find the Player ID.</span>
        </div>
        <div className="field">
          <label htmlFor="player-state">State</label>
          <input id="player-state" type="text" inputMode="numeric" autoComplete="off" value={kingdomId} maxLength={4} placeholder="Example: 850" onChange={(event) => setKingdomId(event.target.value)} />
          <span className="field__help">The State must match the stored Forge record.</span>
        </div>
        <button type="submit" className="button button--primary" disabled={loading}>{loading ? 'Searching Forge…' : 'Search Forge Index'}</button>
      </form>

      {errorMessage && <div className="player-lookup-error" role="alert"><span>ℹ️</span><div><strong>No matching public record</strong><p>{errorMessage}</p></div></div>}
      {loading && <div className="player-lookup-state"><span>🔎</span><h2>Searching the Forge index…</h2><p>Only public Forge player claims are searched.</p></div>}

      {!loading && player && (
        <article className="player-profile-card">
          <div className="player-profile-card__visual">
            {player.profilePhoto ? <img src={player.profilePhoto} alt={`${player.playerName} profile`} className="player-profile-card__avatar" /> : <div className="player-profile-card__avatar player-profile-card__avatar--fallback">👤</div>}
          </div>
          <div className="player-profile-card__main">
            <span className="player-profile-card__label">Public Forge record</span>
            <h2>{player.playerName}</h2>
            <div className="player-profile-card__stats">
              <div><span>State</span><strong>{player.kingdomId}</strong></div>
              <div><span>Town Centre</span><strong>{player.townCenterLevel ?? 'Not recorded'}</strong></div>
              <div><span>Player ID</span><strong>{player.playerId}</strong></div>
              <div><span>Power</span><strong>{formatPower(player.currentPower)}</strong></div>
            </div>
            {player.allianceName && <p className="player-profile-card__level-detail">Alliance: {player.allianceName}</p>}
            <p className="player-profile-card__level-detail">Claim status: {player.verificationStatus.replaceAll('_', ' ')}</p>
          </div>
          <div className="player-profile-card__actions"><button type="button" className="button button--primary" onClick={() => void copyPlayerSummary()}>{copied ? 'Copied!' : 'Copy Player Details'}</button></div>
        </article>
      )}

      {!loading && !player && !errorMessage && <div className="player-lookup-state"><span>👤</span><h2>Search by Player ID and State</h2><p>A record appears only when the player has chosen to make their Forge claim public.</p></div>}

      {recentPlayers.length > 0 && (
        <section className="recent-player-searches">
          <div className="recent-player-searches__heading"><div><p className="eyebrow">Search history</p><h2>Recent indexed players</h2></div><button type="button" onClick={clearRecentPlayers}>Clear history</button></div>
          <div className="recent-player-searches__grid">
            {recentPlayers.map((recent) => (
              <button type="button" className="recent-player-card" key={recent.playerId} onClick={() => void searchPlayer(undefined, recent.playerId, String(recent.kingdomId))}>
                {recent.profilePhoto ? <img src={recent.profilePhoto} alt="" /> : <span>👤</span>}
                <div><strong>{recent.playerName}</strong><small>State {recent.kingdomId}</small></div><span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="compatibility-disclaimer"><strong>Indexed record, not ownership proof</strong><p>Forge shows stored public claims and reviewed observations. Records may be older than the current in-game profile, and a claimed Player ID does not by itself prove who controls the Kingshot account.</p></div>
    </section>
  )
}

export default PlayerLookupPage
