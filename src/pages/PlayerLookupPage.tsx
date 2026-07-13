import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { getPlayer } from '../services/kingshotApi'
import type { KingshotPlayer } from '../types/player'

type RecentPlayer = {
  playerId: string
  name: string
  kingdom: number
  profilePhoto: string | null
}

const RECENT_PLAYERS_KEY =
  'kingshot-forge-recent-player-searches'

function loadRecentPlayers(): RecentPlayer[] {
  try {
    const storedValue = window.localStorage.getItem(
      RECENT_PLAYERS_KEY,
    )

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(
      (value): value is RecentPlayer =>
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

function saveRecentPlayer(
  currentPlayers: RecentPlayer[],
  player: KingshotPlayer,
) {
  const nextPlayers: RecentPlayer[] = [
    {
      playerId: player.playerId,
      name: player.name,
      kingdom: player.kingdom,
      profilePhoto: player.profilePhoto,
    },
    ...currentPlayers.filter(
      (item) => item.playerId !== player.playerId,
    ),
  ].slice(0, 6)

  window.localStorage.setItem(
    RECENT_PLAYERS_KEY,
    JSON.stringify(nextPlayers),
  )

  return nextPlayers
}

function PlayerLookupPage() {
  const [playerId, setPlayerId] = useState('')
  const [player, setPlayer] =
    useState<KingshotPlayer | null>(null)

  const [recentPlayers, setRecentPlayers] =
    useState<RecentPlayer[]>(loadRecentPlayers)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [player])

  async function searchPlayer(
    event?: FormEvent<HTMLFormElement>,
    requestedPlayerId?: string,
  ) {
    event?.preventDefault()

    const cleanedPlayerId = (
      requestedPlayerId ?? playerId
    )
      .trim()
      .replace(/\s+/g, '')

    if (!cleanedPlayerId) {
      setErrorMessage('Enter a player ID.')
      return
    }

    if (!/^\d+$/.test(cleanedPlayerId)) {
      setErrorMessage(
        'Player IDs should contain numbers only.',
      )
      return
    }

    setPlayerId(cleanedPlayerId)
    setLoading(true)
    setErrorMessage('')
    setPlayer(null)

    try {
      const response = await getPlayer(cleanedPlayerId)

      setPlayer(response.data)

      setRecentPlayers((currentPlayers) =>
        saveRecentPlayer(currentPlayers, response.data),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Player information could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyPlayerSummary() {
    if (!player) {
      return
    }

    const summary = [
      player.name,
      `Player ID: ${player.playerId}`,
      `Kingdom: ${player.kingdom}`,
      `Level: ${
        player.levelRenderedDetailed ||
        player.levelRendered ||
        player.level
      }`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      alert(
        'Copy failed. Please copy the player details manually.',
      )
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

        <h1 className="page-title">
          Find a Kingshot player
        </h1>

        <p>
          Enter a Kingshot player ID to view their current
          profile, kingdom and level.
        </p>
      </div>

      <form
        className="player-search-panel"
        onSubmit={searchPlayer}
      >
        <div className="field">
          <label htmlFor="player-id">Player ID</label>

          <input
            id="player-id"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={playerId}
            maxLength={20}
            placeholder="Example: 122223555"
            onChange={(event) =>
              setPlayerId(event.target.value)
            }
          />

          <span className="field__help">
            Open your Kingshot profile to find your player ID.
          </span>
        </div>

        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search Player'}
        </button>
      </form>

      {errorMessage && (
        <div className="player-lookup-error" role="alert">
          <span>⚠️</span>

          <div>
            <strong>Player lookup failed</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="player-lookup-state">
          <span>🔎</span>
          <h2>Searching for player…</h2>
          <p>This may take a few seconds.</p>
        </div>
      )}

      {!loading && player && (
        <article className="player-profile-card">
          <div className="player-profile-card__visual">
            {player.profilePhoto ? (
              <img
                src={player.profilePhoto}
                alt={`${player.name} profile`}
                className="player-profile-card__avatar"
              />
            ) : (
              <div className="player-profile-card__avatar player-profile-card__avatar--fallback">
                👤
              </div>
            )}

            {player.levelImage && (
              <img
                src={player.levelImage}
                alt=""
                className="player-profile-card__level-image"
              />
            )}
          </div>

          <div className="player-profile-card__main">
            <span className="player-profile-card__label">
              Kingshot player
            </span>

            <h2>{player.name}</h2>

            <div className="player-profile-card__stats">
              <div>
                <span>Kingdom</span>
                <strong>{player.kingdom}</strong>
              </div>

              <div>
                <span>Level</span>
                <strong>
                  {player.levelRendered ||
                    player.level}
                </strong>
              </div>

              <div>
                <span>Player ID</span>
                <strong>{player.playerId}</strong>
              </div>
            </div>

            {player.levelRenderedDetailed && (
              <p className="player-profile-card__level-detail">
                {player.levelRenderedDetailed}
              </p>
            )}
          </div>

          <div className="player-profile-card__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => void copyPlayerSummary()}
            >
              {copied ? 'Copied!' : 'Copy Player Details'}
            </button>
          </div>
        </article>
      )}

      {!loading && !player && !errorMessage && (
        <div className="player-lookup-state">
          <span>👤</span>
          <h2>Search by player ID</h2>
          <p>
            The player profile will appear here.
          </p>
        </div>
      )}

      {recentPlayers.length > 0 && (
        <section className="recent-player-searches">
          <div className="recent-player-searches__heading">
            <div>
              <p className="eyebrow">Search history</p>
              <h2>Recent players</h2>
            </div>

            <button
              type="button"
              onClick={clearRecentPlayers}
            >
              Clear history
            </button>
          </div>

          <div className="recent-player-searches__grid">
            {recentPlayers.map((recentPlayer) => (
              <button
                type="button"
                className="recent-player-card"
                key={recentPlayer.playerId}
                onClick={() =>
                  void searchPlayer(
                    undefined,
                    recentPlayer.playerId,
                  )
                }
              >
                {recentPlayer.profilePhoto ? (
                  <img
                    src={recentPlayer.profilePhoto}
                    alt=""
                  />
                ) : (
                  <span>👤</span>
                )}

                <div>
                  <strong>{recentPlayer.name}</strong>
                  <small>
                    Kingdom {recentPlayer.kingdom}
                  </small>
                </div>

                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="compatibility-disclaimer">
        <strong>Player information is externally supplied</strong>

        <p>
          Player data comes from the KingShot.net API and may not
          update immediately after changes inside the game.
        </p>
      </div>
    </section>
  )
}

export default PlayerLookupPage