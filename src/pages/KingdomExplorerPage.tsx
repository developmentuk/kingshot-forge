import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { getKingdom } from '../services/kingshotApi'
import type { KingdomServer } from '../types/kingdom'

type RecentKingdom = {
  kingdomId: number
  openTime: string
  isVerified: boolean
}

const RECENT_KINGDOMS_KEY =
  'kingshot-forge-recent-kingdom-searches'

function loadRecentKingdoms(): RecentKingdom[] {
  try {
    const storedValue = window.localStorage.getItem(
      RECENT_KINGDOMS_KEY,
    )

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(
      (value): value is RecentKingdom =>
        typeof value === 'object' &&
        value !== null &&
        typeof value.kingdomId === 'number' &&
        typeof value.openTime === 'string' &&
        typeof value.isVerified === 'boolean',
    )
  } catch {
    return []
  }
}

function saveRecentKingdom(
  currentKingdoms: RecentKingdom[],
  kingdom: KingdomServer,
) {
  const nextKingdoms: RecentKingdom[] = [
    {
      kingdomId: kingdom.kingdomId,
      openTime: kingdom.openTime,
      isVerified: kingdom.isVerified,
    },
    ...currentKingdoms.filter(
      (item) => item.kingdomId !== kingdom.kingdomId,
    ),
  ].slice(0, 6)

  window.localStorage.setItem(
    RECENT_KINGDOMS_KEY,
    JSON.stringify(nextKingdoms),
  )

  return nextKingdoms
}

function getKingdomAge(openTime: string) {
  const opened = new Date(openTime)
  const today = new Date()

  const difference =
    today.getTime() - opened.getTime()

  return Math.max(
    0,
    Math.floor(difference / 86400000),
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function KingdomExplorerPage() {
  const [kingdomId, setKingdomId] = useState('')
  const [kingdom, setKingdom] =
    useState<KingdomServer | null>(null)

  const [recentKingdoms, setRecentKingdoms] =
    useState<RecentKingdom[]>(loadRecentKingdoms)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const kingdomAge = useMemo(
    () =>
      kingdom
        ? getKingdomAge(kingdom.openTime)
        : '',
    [kingdom],
  )

  async function searchKingdom(
    event?: FormEvent<HTMLFormElement>,
    requestedKingdomId?: string,
  ) {
    event?.preventDefault()

    const cleanedKingdomId = (
      requestedKingdomId ?? kingdomId
    )
      .trim()
      .replace(/\s+/g, '')

    if (!cleanedKingdomId) {
      setErrorMessage('Enter a kingdom number.')
      return
    }

    if (!/^\d+$/.test(cleanedKingdomId)) {
      setErrorMessage(
        'Kingdom numbers should contain numbers only.',
      )
      return
    }

    const numericKingdomId = Number(cleanedKingdomId)

    if (
      numericKingdomId < 1 ||
      numericKingdomId > 9999
    ) {
      setErrorMessage(
        'Kingdom number must be between 1 and 9999.',
      )
      return
    }

    setKingdomId(cleanedKingdomId)
    setLoading(true)
    setErrorMessage('')
    setKingdom(null)

    try {
      const response = await getKingdom(cleanedKingdomId)
      const foundKingdom = response.data.servers[0]

      if (!foundKingdom) {
        setErrorMessage('Kingdom not found.')
        return
      }

      setKingdom(foundKingdom)

      setRecentKingdoms((current) =>
        saveRecentKingdom(current, foundKingdom),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Kingdom information could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  function clearRecentKingdoms() {
    window.localStorage.removeItem(
      RECENT_KINGDOMS_KEY,
    )
    setRecentKingdoms([])
  }

  return (
    <section className="section page-section kingdom-explorer-page">
      <div className="section-heading">
        <p className="eyebrow">Kingdom Explorer</p>

        <h1 className="page-title">
          Explore a Kingshot kingdom
        </h1>

        <p>
          Search by kingdom number to view its opening date,
          estimated age and verification status.
        </p>
      </div>

      <form
        className="kingdom-search-panel"
        onSubmit={searchKingdom}
      >
        <div className="field">
          <label htmlFor="kingdom-id">
            Kingdom number
          </label>

          <input
            id="kingdom-id"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={kingdomId}
            maxLength={4}
            placeholder="Example: 850"
            onChange={(event) =>
              setKingdomId(event.target.value)
            }
          />

          <span className="field__help">
            Enter a kingdom number between 1 and 9999.
          </span>
        </div>

        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search Kingdom'}
        </button>
      </form>

      {errorMessage && (
        <div className="kingdom-explorer-error">
          <span>⚠️</span>

          <div>
            <strong>Kingdom lookup failed</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="kingdom-explorer-state">
          <span>🌍</span>
          <h2>Searching for kingdom…</h2>
        </div>
      )}

      {!loading && kingdom && (
        <article className="kingdom-profile-card">
          <div className="kingdom-profile-card__icon">
            🏰
          </div>

          <div className="kingdom-profile-card__main">
            <span className="kingdom-profile-card__label">
              Kingshot kingdom
            </span>

            <h2>Kingdom {kingdom.kingdomId}</h2>

            <div className="kingdom-profile-card__stats">
              <div>
                <span>📅 Opened</span>
                <strong>{formatDate(kingdom.openTime)}</strong>
              </div>

              <div>
                <span>⏳ Current Day</span>

<strong>Day {kingdomAge}</strong>
              </div>

              <div>
                <span>Languages</span>
                <strong>
                  {kingdom.languages?.length
                    ? kingdom.languages.join(', ')
                    : 'Not listed'}
                </strong>
              </div>

              <div>
                <span>Server type</span>
                <strong>
                  {kingdom.isExclusive
                    ? 'Exclusive'
                    : 'Standard'}
                </strong>
              </div>
            </div>

            <div className="kingdom-profile-card__badges">
              <span
                className={
                  kingdom.isVerified
                    ? 'kingdom-badge kingdom-badge--verified'
                    : 'kingdom-badge'
                }
              >
                {kingdom.isVerified
                  ? '✓ Verified kingdom'
                  : 'Verification pending'}
              </span>

              {kingdom.addedBy && (
                <span className="kingdom-badge">
                  Source: {kingdom.addedBy}
                </span>
              )}
            </div>
          </div>
        </article>
      )}

      {!loading && !kingdom && !errorMessage && (
        <div className="kingdom-explorer-state">
          <span>🏰</span>
          <h2>Search for a kingdom</h2>
          <p>
            The kingdom profile will appear here.
          </p>
        </div>
      )}

      {recentKingdoms.length > 0 && (
        <section className="recent-kingdom-searches">
          <div className="recent-kingdom-searches__heading">
            <div>
              <p className="eyebrow">Search history</p>
              <h2>Recent kingdoms</h2>
            </div>

            <button
              type="button"
              onClick={clearRecentKingdoms}
            >
              Clear history
            </button>
          </div>

          <div className="recent-kingdom-searches__grid">
            {recentKingdoms.map((recentKingdom) => (
              <button
                type="button"
                className="recent-kingdom-card"
                key={recentKingdom.kingdomId}
                onClick={() =>
                  void searchKingdom(
                    undefined,
                    String(recentKingdom.kingdomId),
                  )
                }
              >
                <span>🏰</span>

                <div>
                  <strong>
                    Kingdom {recentKingdom.kingdomId}
                  </strong>

                  <small>
                    Opened {formatDate(recentKingdom.openTime)}
                  </small>
                </div>

                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="compatibility-disclaimer">
        <strong>Kingdom data is externally supplied</strong>

        <p>
          Kingdom details come from the KingShot.net API and may
          not include languages or other optional metadata.
        </p>
      </div>
    </section>
  )
}

export default KingdomExplorerPage