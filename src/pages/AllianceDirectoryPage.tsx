import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'
import { getAlliancesByKingdom } from '../services/communityService'
import type { AllianceRecord } from '../types/community'

function formatRecruitmentStatus(
  status: AllianceRecord['recruitment_status'],
) {
  switch (status) {
    case 'recruiting':
      return 'Recruiting'

    case 'limited':
      return 'Limited recruitment'

    case 'transfer_only':
      return 'Transfer recruitment'

    case 'closed':
      return 'Recruitment closed'

    default:
      return 'Status not published'
  }
}

function formatVerificationStatus(
  status: AllianceRecord['verification_status'],
) {
  switch (status) {
    case 'forge_verified':
      return 'Forge verified'

    case 'community_verified':
      return 'Community verified'

    case 'pending':
      return 'Verification pending'

    default:
      return 'Unverified'
  }
}

function formatPower(power: number | null) {
  if (power === null) {
    return 'Not listed'
  }

  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(power)
}

function AllianceDirectoryPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const initialKingdom =
    searchParams.get('kingdom') ?? ''

  const [kingdomNumber, setKingdomNumber] =
    useState(initialKingdom)

  const [alliances, setAlliances] =
    useState<AllianceRecord[]>([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [hasSearched, setHasSearched] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const filteredAlliances = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase()

    if (!query) {
      return alliances
    }

    return alliances.filter((alliance) => {
      const searchableText = [
        alliance.tag,
        alliance.name,
        alliance.description,
        alliance.primary_language,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [alliances, searchTerm])

  async function loadAlliances(
    requestedKingdom: string,
  ) {
    const cleanedKingdom = requestedKingdom
      .trim()
      .replace(/\s+/g, '')

    if (!cleanedKingdom) {
      setErrorMessage(
        'Enter a kingdom number.',
      )
      return
    }

    if (!/^\d+$/.test(cleanedKingdom)) {
      setErrorMessage(
        'Kingdom numbers should contain numbers only.',
      )
      return
    }

    const numericKingdom =
      Number(cleanedKingdom)

    if (
      numericKingdom < 1 ||
      numericKingdom > 9999
    ) {
      setErrorMessage(
        'Kingdom number must be between 1 and 9999.',
      )
      return
    }

    setLoading(true)
    setHasSearched(true)
    setErrorMessage('')
    setAlliances([])
    setSearchTerm('')

    try {
      const result =
        await getAlliancesByKingdom(
          numericKingdom,
        )

      setAlliances(result)
      setKingdomNumber(cleanedKingdom)

      setSearchParams({
        kingdom: cleanedKingdom,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Alliance directory could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialKingdom) {
      void loadAlliances(initialKingdom)
    }
    // Load the initial URL value once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    void loadAlliances(kingdomNumber)
  }

  return (
    <section className="section page-section alliance-directory-page">
      <div className="section-heading">
        <p className="eyebrow">
          Alliance directory
        </p>

        <h1 className="page-title">
          Find alliances by kingdom
        </h1>

        <p>
          Explore registered alliances,
          recruitment information, Discord
          links and community members.
        </p>
      </div>

      <form
        className="alliance-directory-search"
        onSubmit={handleSubmit}
      >
        <div className="field">
          <label htmlFor="alliance-kingdom">
            Kingdom number
          </label>

          <input
            id="alliance-kingdom"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={kingdomNumber}
            placeholder="Example: 850"
            onChange={(event) =>
              setKingdomNumber(
                event.target.value,
              )
            }
          />
        </div>

        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
        >
          {loading
            ? 'Loading…'
            : 'Find Alliances'}
        </button>
      </form>

      {errorMessage && (
        <div className="alliance-directory-error">
          <span>⚠️</span>

          <div>
            <strong>
              Directory could not be loaded
            </strong>

            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="alliance-directory-state">
          <span>🛡️</span>
          <h2>Loading alliances…</h2>
        </div>
      )}

      {!loading &&
        hasSearched &&
        !errorMessage &&
        alliances.length > 0 && (
          <>
            <div className="alliance-directory-toolbar">
              <div className="field">
                <label htmlFor="alliance-filter">
                  Filter alliances
                </label>

                <input
                  id="alliance-filter"
                  type="search"
                  value={searchTerm}
                  placeholder="Search by tag, name or language"
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="alliance-directory-summary">
                <strong>
                  {filteredAlliances.length}
                </strong>

                <span>
                  {filteredAlliances.length === 1
                    ? 'alliance'
                    : 'alliances'}
                </span>
              </div>
            </div>

            <div className="alliance-directory-grid">
              {filteredAlliances.map(
                (alliance) => (
                  <article
                    className="alliance-directory-card"
                    key={alliance.id}
                  >
                    <div className="alliance-directory-card__heading">
                      <div className="alliance-directory-card__identity">
                        <span className="alliance-directory-card__shield">
                          🛡️
                        </span>

                        <div>
                          <span>
                            Kingdom{' '}
                            {alliance.kingdom_number}
                          </span>

                          <h2>
                            [{alliance.tag}]{' '}
                            {alliance.name ||
                              alliance.tag}
                          </h2>
                        </div>
                      </div>

                      <span
                        className={`alliance-verification-badge alliance-verification-badge--${alliance.verification_status}`}
                      >
                        {formatVerificationStatus(
                          alliance.verification_status,
                        )}
                      </span>
                    </div>

                    <p className="alliance-directory-card__description">
                      {alliance.description ||
                        'No alliance description has been published yet.'}
                    </p>

                    <div className="alliance-directory-card__stats">
                      <div>
                        <span>Registered members</span>
                        <strong>
                          {
                            alliance.registered_member_count
                          }
                        </strong>
                      </div>

                      <div>
                        <span>Gift level</span>
                        <strong>
                          {alliance.gift_level ??
                            'Not listed'}
                        </strong>
                      </div>

                      <div>
                        <span>Power</span>
                        <strong>
                          {formatPower(
                            alliance.estimated_power,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Bear time</span>
                        <strong>
                          {alliance.bear_time_utc
                            ? `${alliance.bear_time_utc.slice(
                                0,
                                5,
                              )} UTC`
                            : 'Not listed'}
                        </strong>
                      </div>
                    </div>

                    <div className="alliance-directory-card__metadata">
                      <span>
                        {formatRecruitmentStatus(
                          alliance.recruitment_status,
                        )}
                      </span>

                      <span>
                        {alliance.primary_language ||
                          'Language not listed'}
                      </span>

                      {alliance.minimum_power !==
                        null && (
                        <span>
                          Minimum{' '}
                          {formatPower(
                            alliance.minimum_power,
                          )}{' '}
                          power
                        </span>
                      )}
                    </div>

                    <div className="alliance-directory-card__actions">
                      <Link
                        className="button button--primary"
                        to={`/alliances/${alliance.id}`}
                      >
                        View Alliance
                      </Link>

                      {alliance.discord_invite_url ? (
                        <a
                          className="button button--secondary"
                          href={
                            alliance.discord_invite_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Discord
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="button button--secondary"
                          disabled
                        >
                          No Discord
                        </button>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </>
        )}

      {!loading &&
        hasSearched &&
        !errorMessage &&
        alliances.length === 0 && (
          <div className="alliance-directory-state">
            <span>🛡️</span>

            <h2>
              No registered alliances yet
            </h2>

            <p>
              Alliances will appear here once
              they have been created in Forge.
            </p>
          </div>
        )}

      {!loading &&
        !hasSearched &&
        !errorMessage && (
          <div className="alliance-directory-state">
            <span>🌍</span>

            <h2>Search for a kingdom</h2>

            <p>
              Registered alliances and their
              recruitment details will appear
              here.
            </p>
          </div>
        )}
    </section>
  )
}

export default AllianceDirectoryPage