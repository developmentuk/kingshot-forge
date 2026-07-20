import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  getKvkMatches,
  getKvkSeasons,
} from '../services/kingshotApi'
import type {
  KvkMatch,
  KvkSeason,
} from '../types/kvk'

type OutcomeFilter =
  | 'all'
  | 'captured'
  | 'defended'

type KvkView = 'cards' | 'compact'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function KvkTrackerPage() {
  const [kingdomId, setKingdomId] = useState('')
  const [selectedSeason, setSelectedSeason] =
    useState('')

  const [outcomeFilter, setOutcomeFilter] =
    useState<OutcomeFilter>('all')
  const [view, setView] = useState<KvkView>(() => (localStorage.getItem('forge.kvk.view') as KvkView) || 'cards')

  const [seasons, setSeasons] =
    useState<KvkSeason[]>([])

  const [matches, setMatches] =
    useState<KvkMatch[]>([])

  const [loadingSeasons, setLoadingSeasons] =
    useState(true)

  const [searching, setSearching] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSeasons() {
      try {
        const response = await getKvkSeasons()

        if (!cancelled) {
          setSeasons(response.data)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'KvK seasons could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingSeasons(false)
        }
      }
    }

    void loadSeasons()

    return () => {
      cancelled = true
    }
  }, [])

  async function searchMatches(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanedKingdomId = kingdomId
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
    setSearching(true)
    setErrorMessage('')
    setMatches([])

    try {
      const [asKingdomA, asKingdomB] =
        await Promise.all([
          getKvkMatches({
            kingdomA: cleanedKingdomId,
            season: selectedSeason || undefined,
            status: outcomeFilter,
            limit: 100,
          }),
          getKvkMatches({
            kingdomB: cleanedKingdomId,
            season: selectedSeason || undefined,
            status: outcomeFilter,
            limit: 100,
          }),
        ])

      const combinedMatches = [
        ...asKingdomA.data,
        ...asKingdomB.data,
      ]

      const uniqueMatches = Array.from(
        new Map(
          combinedMatches.map((match) => [
            match.kvk_id,
            match,
          ]),
        ).values(),
      ).sort(
        (first, second) =>
          new Date(second.season_date).getTime() -
          new Date(first.season_date).getTime(),
      )

      setMatches(uniqueMatches)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'KvK matches could not be loaded.',
      )
    } finally {
      setSearching(false)
    }
  }

  const summary = useMemo(() => {
    if (!kingdomId || matches.length === 0) {
      return {
        prepWins: 0,
        castleWins: 0,
        captures: 0,
      }
    }

    const numericKingdomId = Number(kingdomId)

    return matches.reduce(
      (totals, match) => ({
        prepWins:
          totals.prepWins +
          (match.prep_winner === numericKingdomId
            ? 1
            : 0),

        castleWins:
          totals.castleWins +
          (match.castle_winner === numericKingdomId
            ? 1
            : 0),

        captures:
          totals.captures +
          (match.attacker === numericKingdomId &&
          match.castle_captured
            ? 1
            : 0),
      }),
      {
        prepWins: 0,
        castleWins: 0,
        captures: 0,
      },
    )
  }, [kingdomId, matches])

  function changeView(next: KvkView) {
    setView(next)
    localStorage.setItem('forge.kvk.view', next)
  }

  return (
    <section className="section page-section kvk-tracker-page">
      <div className="section-heading">
        <p className="eyebrow">KvK Tracker</p>

        <h1 className="page-title kvk-tracker-page__title">
          KvK Match History
        </h1>

        <p>
          Search a kingdom’s KvK history, prep results and
          castle outcomes.
        </p>
      </div>

      <form
        className="kvk-search-panel"
        onSubmit={searchMatches}
      >
        <div className="field">
          <label htmlFor="kvk-kingdom">
            Kingdom number
          </label>

          <input
            id="kvk-kingdom"
            type="text"
            inputMode="numeric"
            value={kingdomId}
            maxLength={4}
            placeholder="Example: 850"
            onChange={(event) =>
              setKingdomId(event.target.value)
            }
          />
        </div>

        <div className="field">
          <label htmlFor="kvk-season">Season</label>

          <select
            id="kvk-season"
            value={selectedSeason}
            disabled={loadingSeasons}
            onChange={(event) =>
              setSelectedSeason(event.target.value)
            }
          >
            <option value="">
              All available seasons
            </option>

            {seasons.map((season) => (
              <option
                key={season.season_id}
                value={season.season_id}
              >
                {season.kvk_title ??
                  `Season ${season.season_id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="kvk-outcome">
            Castle outcome
          </label>

          <select
            id="kvk-outcome"
            value={outcomeFilter}
            onChange={(event) =>
              setOutcomeFilter(
                event.target.value as OutcomeFilter,
              )
            }
          >
            <option value="all">
              All outcomes
            </option>

            <option value="captured">
              Castle captured
            </option>

            <option value="defended">
              Castle defended
            </option>
          </select>
        </div>

        <button
          type="submit"
          className="button button--primary"
          disabled={searching}
        >
          {searching
            ? 'Searching…'
            : 'Search KvK History'}
        </button>
      </form>

      {errorMessage && (
        <div className="kvk-error" role="alert">
          <span>⚠️</span>

          <div>
            <strong>KvK search failed</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {searching && (
        <div className="kvk-state">
          <span>⚔️</span>
          <h2>Loading KvK matches…</h2>
        </div>
      )}

      {!searching && matches.length > 0 && (
        <>
          <div className="kvk-summary-grid">
            <div>
              <strong>{matches.length}</strong>
              <span>Matches found</span>
            </div>

            <div>
              <strong>{summary.prepWins}</strong>
              <span>Prep wins</span>
            </div>

            <div>
              <strong>{summary.castleWins}</strong>
              <span>Castle wins</span>
            </div>

            <div>
              <strong>{summary.captures}</strong>
              <span>Successful captures</span>
            </div>
          </div>

          <div className="kvk-results-toolbar" aria-label="KvK result presentation">
            <strong>{matches.length} results</strong>
            <div role="group" aria-label="View mode">
              <button type="button" className={view === 'cards' ? 'button button--primary' : 'button button--secondary'} onClick={() => changeView('cards')}>Cards</button>
              <button type="button" className={view === 'compact' ? 'button button--primary' : 'button button--secondary'} onClick={() => changeView('compact')}>Compact</button>
            </div>
          </div>

          {view === 'compact' ? <div className="kvk-compact-table-wrap"><table className="kvk-compact-table"><caption className="sr-only">Compact KvK results</caption><thead><tr><th>Season / date</th><th>Kingdoms</th><th>Prep winner</th><th>Castle winner</th><th>Outcome</th></tr></thead><tbody>{matches.map((match) => <tr key={match.kvk_id}><td>{match.kvk_title ?? `Season ${match.season_id}`}<small>{formatDate(match.season_date)}</small></td><td>{match.kingdom_a} vs {match.kingdom_b}</td><td>{match.prep_winner ?? 'Unknown'}</td><td>{match.castle_winner ?? 'Unknown'}</td><td>{match.castle_captured ? 'Captured' : 'Defended'}</td></tr>)}</tbody></table></div> : <div className="kvk-match-grid">
            {matches.map((match) => {
              const searchedKingdom =
                Number(kingdomId)

              const opponent =
                match.kingdom_a === searchedKingdom
                  ? match.kingdom_b
                  : match.kingdom_a

              const wonPrep =
                match.prep_winner === searchedKingdom

              const wonCastle =
                match.castle_winner === searchedKingdom

              const wasAttacker =
                match.attacker === searchedKingdom

              return (
                <article
                  className="kvk-match-card"
                  key={match.kvk_id}
                >
                  <div className="kvk-match-card__heading">
                    <div>
                      <span>
                        {match.kvk_title ??
                          `Season ${match.season_id}`}
                      </span>

                      <h2>
                        Kingdom {searchedKingdom}
                        <small>vs</small>
                        Kingdom {opponent}
                      </h2>
                    </div>

                    <time>
                      {formatDate(match.season_date)}
                    </time>
                  </div>

                  <div className="kvk-match-card__versus" aria-label={`Kingdom ${match.kingdom_a} versus Kingdom ${match.kingdom_b}`}>
                    <div className={match.castle_winner === match.kingdom_a ? 'kvk-match-card__kingdom kvk-match-card__kingdom--winner' : 'kvk-match-card__kingdom'}><small>Kingdom A · {match.attacker === match.kingdom_a ? 'Attacker' : 'Defender'}</small><strong>Kingdom {match.kingdom_a}</strong><span>{match.castle_winner === match.kingdom_a ? 'Winner' : 'Challenger'}</span></div>
                    <span className="kvk-match-card__vs" aria-hidden="true">VS</span>
                    <div className={match.castle_winner === match.kingdom_b ? 'kvk-match-card__kingdom kvk-match-card__kingdom--winner' : 'kvk-match-card__kingdom'}><small>Kingdom B · {match.attacker === match.kingdom_b ? 'Attacker' : 'Defender'}</small><strong>Kingdom {match.kingdom_b}</strong><span>{match.castle_winner === match.kingdom_b ? 'Winner' : 'Challenger'}</span></div>
                  </div>

                  <div className="kvk-match-card__result-strip"><span>{wonPrep ? '✓ Prep won' : '× Prep lost'}</span><span>{wonCastle ? '✓ Castle won' : '× Castle lost'}</span><span>{match.castle_captured ? '⚑ Captured' : '⬟ Defended'}</span></div>

                  <div className="kvk-match-card__results">
                    <div>
                      <span>Prep phase</span>
                      <strong
                        className={
                          wonPrep
                            ? 'kvk-result--win'
                            : 'kvk-result--loss'
                        }
                      >
                        {wonPrep ? 'Won' : 'Lost'}
                      </strong>
                    </div>

                    <div>
                      <span>Castle battle</span>
                      <strong
                        className={
                          wonCastle
                            ? 'kvk-result--win'
                            : 'kvk-result--loss'
                        }
                      >
                        {wonCastle ? 'Won' : 'Lost'}
                      </strong>
                    </div>

                    <div>
                      <span>Role</span>
                      <strong>
                        {wasAttacker
                          ? 'Attacker'
                          : 'Defender'}
                      </strong>
                    </div>

                    <div>
                      <span>Castle result</span>
                      <strong>
                        {match.castle_captured
                          ? 'Captured'
                          : 'Defended'}
                      </strong>
                    </div>
                  </div>
                  <footer className="kvk-match-card__footer"><span>{wasAttacker ? 'Attacker perspective' : 'Defender perspective'} · {formatDate(match.season_date)}</span><span>Match details →</span></footer>
                </article>
              )
            })}
          </div>}
        </>
      )}

      {!searching &&
        !errorMessage &&
        matches.length === 0 && (
          <div className="kvk-state">
            <span>⚔️</span>
            <h2>Search for a kingdom</h2>
            <p>
              KvK match history will appear here.
            </p>
          </div>
        )}

      <div className="compatibility-disclaimer">
        <strong>Historical KvK results</strong>

        <p>
          KvK match data is supplied by KingShot.net and may
          not include every kingdom or season immediately.
        </p>
      </div>
    </section>
  )
}

export default KvkTrackerPage
