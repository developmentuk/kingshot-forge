import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import {
  getAllianceById,
  getAllianceMembers,
} from '../services/communityService'
import {
  cancelAllianceMembershipRequest,
  getMyAllianceMemberships,
  leaveCurrentAlliance,
  requestAllianceMembership,
  type AllianceMembershipDetails,
} from '../services/allianceMembershipService'
import type {
  AllianceMember,
  AllianceRecord,
} from '../types/community'

function formatRole(
  role: AllianceMember['member_role'],
) {
  switch (role) {
    case 'leader':
      return 'Leader'
    case 'r4':
      return 'R4'
    case 'officer':
      return 'Officer'
    case 'recruiter':
      return 'Recruiter'
    default:
      return 'Member'
  }
}

function getRolePriority(
  role: AllianceMember['member_role'],
) {
  switch (role) {
    case 'leader':
      return 5
    case 'r4':
      return 4
    case 'officer':
      return 3
    case 'recruiter':
      return 2
    default:
      return 1
  }
}

function formatPlayerLevel(
  member: AllianceMember,
) {
  return (
    member.level_rendered_detailed ||
    member.level_rendered ||
    (member.player_level
      ? `Level ${member.player_level}`
      : 'Level unavailable')
  )
}

function formatRecruitmentStatus(
  status: AllianceRecord['recruitment_status'],
) {
  switch (status) {
    case 'recruiting':
      return 'Recruiting now'
    case 'limited':
      return 'Limited recruitment'
    case 'transfer_only':
      return 'Transfer recruitment only'
    case 'closed':
      return 'Recruitment closed'
    default:
      return 'Recruitment status not published'
  }
}

function AllianceCommunityPage() {
  const { allianceId } =
    useParams<{ allianceId: string }>()

  const { user } = useAuth()
  const { playerAccount } =
    usePlayerIdentity()

  const [alliance, setAlliance] =
    useState<AllianceRecord | null>(null)

  const [members, setMembers] =
    useState<AllianceMember[]>([])

  const [myMemberships, setMyMemberships] =
    useState<AllianceMembershipDetails[]>([])

  const [requestMessage, setRequestMessage] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [working, setWorking] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  async function loadPageData() {
    if (!allianceId) {
      setErrorMessage('Alliance ID is missing.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const [
        allianceRecord,
        allianceMembers,
        memberships,
      ] = await Promise.all([
        getAllianceById(allianceId),
        getAllianceMembers(allianceId),
        user
          ? getMyAllianceMemberships(user.id)
          : Promise.resolve([]),
      ])

      setAlliance(allianceRecord)
      setMembers(allianceMembers)
      setMyMemberships(memberships)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Alliance could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allianceId, user?.id])

  const orderedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const roleDifference =
          getRolePriority(b.member_role) -
          getRolePriority(a.member_role)

        if (roleDifference !== 0) {
          return roleDifference
        }

        return a.player_name.localeCompare(
          b.player_name,
        )
      }),
    [members],
  )

  const leadershipCount = members.filter(
    (member) =>
      [
        'leader',
        'r4',
        'officer',
        'recruiter',
      ].includes(member.member_role),
  ).length

  const currentMembership =
    myMemberships.find(
      (membership) =>
        membership.status === 'current',
    ) ?? null

  const pendingMembership =
    myMemberships.find(
      (membership) =>
        membership.status === 'pending',
    ) ?? null

  const isCurrentMember =
    currentMembership?.alliance_id === allianceId

  const hasPendingRequestHere =
    pendingMembership?.alliance_id === allianceId

  const hasPendingRequestElsewhere =
    Boolean(
      pendingMembership &&
        pendingMembership.alliance_id !==
          allianceId,
    )

  const isSameKingdom =
    playerAccount?.kingdom_id ===
    alliance?.kingdom_number

  async function handleRequestMembership() {
    if (!allianceId) {
      return
    }

    setWorking(true)
    setMessage('')
    setErrorMessage('')

    try {
      await requestAllianceMembership(
        allianceId,
        requestMessage,
      )

      setRequestMessage('')
      setMessage(
        'Membership request submitted.',
      )

      await loadPageData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Membership request could not be submitted.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleCancelRequest() {
    if (!pendingMembership) {
      return
    }

    const confirmed = window.confirm(
      'Cancel this alliance membership request?',
    )

    if (!confirmed) {
      return
    }

    setWorking(true)
    setMessage('')
    setErrorMessage('')

    try {
      await cancelAllianceMembershipRequest(
        pendingMembership.id,
      )

      setMessage(
        'Membership request cancelled.',
      )

      await loadPageData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Request could not be cancelled.',
      )
    } finally {
      setWorking(false)
    }
  }

  async function handleLeaveAlliance() {
    const confirmed = window.confirm(
      'Leave your current alliance in Kingshot Forge?',
    )

    if (!confirmed) {
      return
    }

    setWorking(true)
    setMessage('')
    setErrorMessage('')

    try {
      await leaveCurrentAlliance()

      setMessage(
        'You have left the alliance.',
      )

      await loadPageData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Alliance membership could not be ended.',
      )
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <section className="section page-section">
        <div className="alliance-community-state">
          <span>🛡️</span>
          <h2>Loading alliance…</h2>
        </div>
      </section>
    )
  }

  if (errorMessage && !alliance) {
    return (
      <section className="section page-section">
        <div className="alliance-community-error">
          <span>⚠️</span>

          <div>
            <strong>
              Alliance could not be loaded
            </strong>

            <p>{errorMessage}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!alliance) {
    return (
      <section className="section page-section">
        <div className="alliance-community-state">
          <span>🛡️</span>

          <h2>Alliance not found</h2>

          <Link
            className="button button--secondary"
            to="/alliance-directory"
          >
            Back to directory
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section page-section alliance-community-page">
      <div className="alliance-community-back">
        <Link
          to={`/alliance-directory?kingdom=${alliance.kingdom_number}`}
        >
          ← Back to Kingdom{' '}
          {alliance.kingdom_number} alliances
        </Link>
      </div>

      <article className="alliance-community-hero">
        <div className="alliance-community-hero__shield">
          🛡️
        </div>

        <div className="alliance-community-hero__main">
          <div className="alliance-community-hero__heading">
            <div>
              <span>
                Kingdom{' '}
                {alliance.kingdom_number}
              </span>

              <h1>
                [{alliance.tag}]{' '}
                {alliance.name ||
                  alliance.tag}
              </h1>
            </div>

            <span
              className={`alliance-verification-badge alliance-verification-badge--${alliance.verification_status}`}
            >
              {alliance.verification_status
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase(),
                )}
            </span>
          </div>

          <p>
            {alliance.description ||
              'This alliance has not published a description yet.'}
          </p>

          <div className="alliance-community-hero__stats">
            <div>
              <span>Registered members</span>
              <strong>{members.length}</strong>
            </div>

            <div>
              <span>Leadership</span>
              <strong>
                {leadershipCount}
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

          <div className="alliance-community-hero__tags">
            <span>
              {formatRecruitmentStatus(
                alliance.recruitment_status,
              )}
            </span>

            <span>
              {alliance.primary_language ||
                'Language not listed'}
            </span>

            {alliance.timezone && (
              <span>{alliance.timezone}</span>
            )}
          </div>

          <div className="alliance-community-hero__actions">
            {alliance.discord_invite_url && (
              <a
                className="button button--primary"
                href={
                  alliance.discord_invite_url
                }
                target="_blank"
                rel="noreferrer"
              >
                Open Discord
              </a>
            )}

            {alliance.recruitment_channel_url && (
              <a
                className="button button--secondary"
                href={
                  alliance.recruitment_channel_url
                }
                target="_blank"
                rel="noreferrer"
              >
                Recruitment Channel
              </a>
            )}

            {isCurrentMember && (
              <Link
                className="button button--secondary"
                to={`/alliances/${alliance.id}/manage`}
              >
                Manage Alliance
              </Link>
            )}
          </div>
        </div>
      </article>

      <section className="alliance-membership-panel">
        <div className="alliance-membership-panel__heading">
          <div>
            <p className="eyebrow">
              Alliance membership
            </p>

            <h2>Your Forge membership</h2>
          </div>
        </div>

        {!user && (
          <div className="alliance-membership-state">
            <strong>Sign in required</strong>
            <p>
              Sign in to request alliance
              membership.
            </p>
          </div>
        )}

        {user && !playerAccount && (
          <div className="alliance-membership-state">
            <strong>
              Link your Kingshot player first
            </strong>

            <p>
              Alliance membership is connected
              to your linked Kingshot identity.
            </p>

            <Link
              className="button button--secondary"
              to="/my-forge"
            >
              Open My Forge
            </Link>
          </div>
        )}

        {user &&
          playerAccount &&
          isCurrentMember && (
            <div className="alliance-membership-state alliance-membership-state--success">
              <strong>
                You are a current member
              </strong>

              <p>
                Role:{' '}
                {currentMembership
                  ? formatRole(
                      currentMembership.member_role,
                    )
                  : 'Member'}
              </p>

              <button
                type="button"
                className="remove-saved-button"
                disabled={working}
                onClick={() =>
                  void handleLeaveAlliance()
                }
              >
                Leave Alliance
              </button>
            </div>
          )}

        {user &&
          playerAccount &&
          hasPendingRequestHere && (
            <div className="alliance-membership-state alliance-membership-state--pending">
              <strong>
                Membership request pending
              </strong>

              <p>
                An alliance officer needs to
                review your request.
              </p>

              <button
                type="button"
                className="button button--secondary"
                disabled={working}
                onClick={() =>
                  void handleCancelRequest()
                }
              >
                Cancel Request
              </button>
            </div>
          )}

        {user &&
          playerAccount &&
          hasPendingRequestElsewhere && (
            <div className="alliance-membership-state">
              <strong>
                Another request is pending
              </strong>

              <p>
                You can only have one pending
                alliance request at a time.
              </p>
            </div>
          )}

        {user &&
          playerAccount &&
          !isSameKingdom && (
            <div className="alliance-membership-state">
              <strong>
                Different kingdom
              </strong>

              <p>
                Your linked player is currently
                in Kingdom{' '}
                {playerAccount.kingdom_id}. This
                alliance is in Kingdom{' '}
                {alliance.kingdom_number}.
              </p>
            </div>
          )}

        {user &&
          playerAccount &&
          !isCurrentMember &&
          !pendingMembership &&
          isSameKingdom && (
            <div className="alliance-membership-request">
              <div className="field">
                <label htmlFor="membership-message">
                  Message to alliance officers
                </label>

                <textarea
                  id="membership-message"
                  rows={4}
                  maxLength={500}
                  value={requestMessage}
                  placeholder="Introduce yourself or explain why you are requesting membership."
                  onChange={(event) =>
                    setRequestMessage(
                      event.target.value,
                    )
                  }
                />

                <span className="field__help">
                  Optional ·{' '}
                  {requestMessage.length}/500
                </span>
              </div>

              <button
                type="button"
                className="button button--primary"
                disabled={
                  working ||
                  alliance.recruitment_status ===
                    'closed'
                }
                onClick={() =>
                  void handleRequestMembership()
                }
              >
                {working
                  ? 'Submitting…'
                  : 'Request Membership'}
              </button>
            </div>
          )}

        {message && (
          <p className="profile-panel__success">
            {message}
          </p>
        )}

        {errorMessage && alliance && (
          <p className="profile-panel__error">
            {errorMessage}
          </p>
        )}
      </section>

      <section className="alliance-member-directory">
        <div className="alliance-member-directory__heading">
          <div>
            <p className="eyebrow">
              Alliance community
            </p>

            <h2>Registered members</h2>
          </div>

          <span>
            {members.length}{' '}
            {members.length === 1
              ? 'member'
              : 'members'}
          </span>
        </div>

        {orderedMembers.length > 0 ? (
          <div className="alliance-member-grid">
            {orderedMembers.map(
              (member) => (
                <article
                  className="alliance-member-card"
                  key={member.membership_id}
                >
                  <div className="alliance-member-card__identity">
                    {member.profile_photo ? (
                      <img
                        src={
                          member.profile_photo
                        }
                        alt={`${member.player_name} profile`}
                      />
                    ) : (
                      <span className="alliance-member-card__avatar-fallback">
                        👤
                      </span>
                    )}

                    <div>
                      <span>
                        {formatRole(
                          member.member_role,
                        )}
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

                  <div className="alliance-member-card__details">
                    <div>
                      <span>Forge ID</span>
                      <strong>
                        {member.forge_id}
                      </strong>
                    </div>

                    <div>
                      <span>Player ID</span>
                      <strong>
                        {member.player_id}
                      </strong>
                    </div>
                  </div>

                  <div className="alliance-member-card__footer">
                    <span
                      className={`alliance-member-role alliance-member-role--${member.member_role}`}
                    >
                      {formatRole(
                        member.member_role,
                      )}
                    </span>

                    <button
                      type="button"
                      disabled
                      title="Player favourites are coming later."
                    >
                      ☆
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="alliance-community-state">
            <span>👥</span>

            <h2>No registered members</h2>

            <p>
              Approved alliance members will
              appear here.
            </p>
          </div>
        )}
      </section>
    </section>
  )
}

export default AllianceCommunityPage