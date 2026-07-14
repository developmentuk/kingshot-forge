import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getKingdomByNumber,
  getKingdomMembers,
} from '../services/communityService'
import type {
  KingdomMember,
  KingdomRecord,
} from '../types/community'

function getVerificationLabel(
  status: KingdomMember['verification_status'],
) {
  switch (status) {
    case 'officially_verified':
      return 'Officially verified'

    case 'community_verified':
      return 'Community verified'

    case 'pending':
      return 'Verification pending'

    default:
      return 'Linked player'
  }
}

function getRecruitmentLabel(
  status: KingdomRecord['recruitment_status'],
) {
  switch (status) {
    case 'closed':
      return 'Recruitment closed'

    case 'limited':
      return 'Limited recruitment'

    case 'recruiting':
      return 'Recruiting'

    case 'transfer_only':
      return 'Transfer recruitment only'

    default:
      return 'Recruitment not published'
  }
}

function getTransferLabel(
  status: KingdomRecord['transfer_status'],
) {
  switch (status) {
    case 'closed':
      return 'Transfers closed'

    case 'preparing':
      return 'Preparing for transfers'

    case 'applications_open':
      return 'Transfer applications open'

    case 'invites_in_progress':
      return 'Invitations in progress'

    case 'completed':
      return 'Transfer phase completed'

    default:
      return 'Transfer status not published'
  }
}

function formatPlayerLevel(member: KingdomMember) {
  return (
    member.level_rendered_detailed ||
    member.level_rendered ||
    (member.player_level
      ? `Level ${member.player_level}`
      : 'Level unavailable')
  )
}

function KingdomCommunityPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const initialKingdom =
    searchParams.get('kingdom') ?? ''

  const [kingdomNumber, setKingdomNumber] =
    useState(initialKingdom)

  const [kingdom, setKingdom] =
    useState<KingdomRecord | null>(null)

  const [members, setMembers] =
    useState<KingdomMember[]>([])

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const verifiedMemberCount = useMemo(
    () =>
      members.filter((member) =>
        [
          'community_verified',
          'officially_verified',
        ].includes(member.verification_status),
      ).length,
    [members],
  )

  async function loadKingdom(
    requestedKingdom: string,
  ) {
    const cleanedKingdom = requestedKingdom
      .trim()
      .replace(/\s+/g, '')

    if (!cleanedKingdom) {
      setErrorMessage('Enter a kingdom number.')
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
    setKingdom(null)
    setMembers([])

    try {
      const [kingdomRecord, kingdomMembers] =
        await Promise.all([
          getKingdomByNumber(numericKingdom),
          getKingdomMembers(numericKingdom),
        ])

      setKingdom(kingdomRecord)
      setMembers(kingdomMembers)
      setKingdomNumber(cleanedKingdom)

      setSearchParams({
        kingdom: cleanedKingdom,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Kingdom community could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialKingdom) {
      void loadKingdom(initialKingdom)
    }
    // Run once from the initial URL only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    void loadKingdom(kingdomNumber)
  }

  return (
    <section className="section page-section kingdom-community-page">
      <div className="section-heading">
        <p className="eyebrow">
          Kingdom community
        </p>

        <h1 className="page-title">
          Find your kingdom community
        </h1>

        <p>
          View registered Kingshot Forge players,
          kingdom information and future transfer
          and alliance connections.
        </p>
      </div>

      <form
        className="kingdom-community-search"
        onSubmit={handleSubmit}
      >
        <div className="field">
          <label htmlFor="community-kingdom">
            Kingdom number
          </label>

          <input
            id="community-kingdom"
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

          <span className="field__help">
            Search for a kingdom with registered
            Kingshot Forge players.
          </span>
        </div>

        <button
          type="submit"
          className="button button--primary"
          disabled={loading}
        >
          {loading
            ? 'Loading…'
            : 'View Kingdom'}
        </button>
      </form>

      {errorMessage && (
        <div
          className="kingdom-community-error"
          role="alert"
        >
          <span>⚠️</span>

          <div>
            <strong>
              Kingdom could not be loaded
            </strong>

            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="kingdom-community-state">
          <span>🏰</span>

          <h2>Loading kingdom community…</h2>
        </div>
      )}

      {!loading &&
        hasSearched &&
        !errorMessage &&
        kingdom && (
          <>
            <article className="kingdom-community-hero">
              <div className="kingdom-community-hero__icon">
                🏰
              </div>

              <div className="kingdom-community-hero__main">
                <div className="kingdom-community-hero__title">
                  <div>
                    <span>
                      Kingshot community
                    </span>

                    <h2>
                      {kingdom.display_name}
                    </h2>
                  </div>

                  {kingdom.is_verified && (
                    <span className="kingdom-community-badge kingdom-community-badge--verified">
                      ✓ Verified kingdom
                    </span>
                  )}
                </div>

                <p>
                  {kingdom.description ||
                    'This kingdom has not yet published a community description.'}
                </p>

                <div className="kingdom-community-hero__stats">
                  <div>
                    <span>Registered players</span>
                    <strong>{members.length}</strong>
                  </div>

                  <div>
                    <span>Verified players</span>
                    <strong>
                      {verifiedMemberCount}
                    </strong>
                  </div>

                  <div>
                    <span>Primary language</span>
                    <strong>
                      {kingdom.primary_language ||
                        'Not listed'}
                    </strong>
                  </div>
                </div>

                <div className="kingdom-community-hero__status">
                  <span>
                    {getRecruitmentLabel(
                      kingdom.recruitment_status,
                    )}
                  </span>

                  <span>
                    {getTransferLabel(
                      kingdom.transfer_status,
                    )}
                  </span>
                </div>

                {(kingdom.discord_invite_url ||
                  kingdom.recruitment_channel_url) && (
                  <div className="kingdom-community-hero__links">
                    {kingdom.discord_invite_url && (
                      <a
                        className="button button--secondary"
                        href={
                          kingdom.discord_invite_url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open kingdom Discord
                      </a>
                    )}

                    {kingdom.recruitment_channel_url && (
                      <a
                        className="button button--secondary"
                        href={
                          kingdom.recruitment_channel_url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Recruitment channel
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>

            <section className="kingdom-member-directory">
              <div className="kingdom-member-directory__heading">
                <div>
                  <p className="eyebrow">
                    Registered players
                  </p>

                  <h2>
                    Members of Kingdom{' '}
                    {kingdom.kingdom_number}
                  </h2>
                </div>

                <span>
                  {members.length}{' '}
                  {members.length === 1
                    ? 'player'
                    : 'players'}
                </span>
              </div>

              {members.length > 0 ? (
                <div className="kingdom-member-grid">
                  {members.map((member) => (
                    <article
                      className="kingdom-member-card"
                      key={member.membership_id}
                    >
                      <div className="kingdom-member-card__identity">
                        {member.profile_photo ? (
                          <img
                            src={
                              member.profile_photo
                            }
                            alt={`${member.player_name} profile`}
                          />
                        ) : (
                          <span className="kingdom-member-card__avatar-fallback">
                            👤
                          </span>
                        )}

                        <div>
                          <span>
                            Kingshot player
                          </span>

                          <h3>
                            {member.player_name}
                          </h3>

                          <p>
                            {formatPlayerLevel(
                              member,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="kingdom-member-card__details">
                        <div>
                          <span>Player ID</span>

                          <strong>
                            {member.player_id}
                          </strong>
                        </div>

                        <div>
                          <span>Status</span>

                          <strong>
                            {getVerificationLabel(
                              member.verification_status,
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="kingdom-member-card__footer">
                        <span>
                          Joined Forge kingdom directory{' '}
                          {new Intl.DateTimeFormat(
                            'en-GB',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          ).format(
                            new Date(
                              member.joined_at,
                            ),
                          )}
                        </span>

                        <button
                          type="button"
                          className="kingdom-member-favourite"
                          aria-label={`Favourite ${member.player_name}`}
                          title="Favourites will be enabled later in this sprint."
                          disabled
                        >
                          ☆
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="kingdom-community-state">
                  <span>👥</span>

                  <h2>
                    No public players yet
                  </h2>

                  <p>
                    Registered players will appear here
                    after linking a public Kingshot
                    account.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

      {!loading &&
        hasSearched &&
        !errorMessage &&
        !kingdom && (
          <div className="kingdom-community-state">
            <span>🏰</span>

            <h2>Kingdom not registered yet</h2>

            <p>
              A kingdom record is created automatically
              when a linked Forge player is detected in
              that kingdom.
            </p>
          </div>
        )}

      {!loading &&
        !hasSearched &&
        !errorMessage && (
          <div className="kingdom-community-state">
            <span>🌍</span>

            <h2>Search for a kingdom</h2>

            <p>
              Registered players and kingdom community
              details will appear here.
            </p>
          </div>
        )}

      <div className="compatibility-disclaimer">
        <strong>
          Community data is still developing
        </strong>

        <p>
          Kingdom membership is linked from current
          Kingshot player data. Alliance membership,
          recruitment details and transfer information
          will be added during this sprint.
        </p>
      </div>
    </section>
  )
}

export default KingdomCommunityPage