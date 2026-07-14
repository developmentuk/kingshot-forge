import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  approveAllianceMembership,
  rejectAllianceMembership,
  type AllianceMembershipDetails,
} from '../services/allianceMembershipService'
import { getAllianceById } from '../services/communityService'
import type {
  AllianceMemberRole,
  AllianceRecord,
} from '../types/community'

function AllianceManagementPage() {
  const { allianceId } =
    useParams<{ allianceId: string }>()

  const { user } = useAuth()

  const [alliance, setAlliance] =
    useState<AllianceRecord | null>(null)

  const [requests, setRequests] =
    useState<AllianceMembershipDetails[]>([])

  const [loading, setLoading] =
    useState(true)

  const [workingId, setWorkingId] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  async function loadManagementData() {
    if (!allianceId || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const { data, error } = await supabase
        .from('alliance_membership_details')
        .select('*')
        .eq('alliance_id', allianceId)
        .eq('status', 'pending')
        .order('created_at', {
          ascending: true,
        })

      if (error) {
        throw error
      }

      const allianceRecord =
        await getAllianceById(allianceId)

      setAlliance(allianceRecord)

      setRequests(
        (data ??
          []) as AllianceMembershipDetails[],
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Alliance management data could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadManagementData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allianceId, user?.id])

  async function handleApprove(
    membershipId: string,
    role: AllianceMemberRole,
  ) {
    setWorkingId(membershipId)
    setMessage('')
    setErrorMessage('')

    try {
      await approveAllianceMembership(
        membershipId,
        role,
      )

      setMessage(
        'Membership request approved.',
      )

      await loadManagementData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Membership request could not be approved.',
      )
    } finally {
      setWorkingId(null)
    }
  }

  async function handleReject(
    membershipId: string,
  ) {
    const reason = window.prompt(
      'Optional rejection reason:',
    )

    if (reason === null) {
      return
    }

    setWorkingId(membershipId)
    setMessage('')
    setErrorMessage('')

    try {
      await rejectAllianceMembership(
        membershipId,
        reason,
      )

      setMessage(
        'Membership request rejected.',
      )

      await loadManagementData()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Membership request could not be rejected.',
      )
    } finally {
      setWorkingId(null)
    }
  }

  if (!user) {
    return (
      <section className="section page-section">
        <div className="alliance-community-state">
          <span>🔒</span>
          <h2>Sign in required</h2>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="section page-section">
        <div className="alliance-community-state">
          <span>🛡️</span>
          <h2>Loading management tools…</h2>
        </div>
      </section>
    )
  }

  return (
    <section className="section page-section alliance-management-page">
      <div className="alliance-community-back">
        <Link
          to={
            alliance
              ? `/alliances/${alliance.id}`
              : '/alliance-directory'
          }
        >
          ← Back to alliance
        </Link>
      </div>

      <div className="section-heading">
        <p className="eyebrow">
          Alliance management
        </p>

        <h1 className="page-title">
          {alliance
            ? `[${alliance.tag}] Membership requests`
            : 'Membership requests'}
        </h1>

        <p>
          Review players who have requested
          to join this alliance.
        </p>
      </div>

      {message && (
        <p className="profile-panel__success">
          {message}
        </p>
      )}

      {errorMessage && (
        <p className="profile-panel__error">
          {errorMessage}
        </p>
      )}

      {requests.length > 0 ? (
        <div className="alliance-request-grid">
          {requests.map((request) => (
            <article
              className="alliance-request-card"
              key={request.id}
            >
              <div className="alliance-request-card__identity">
                {request.profile_photo ? (
                  <img
                    src={request.profile_photo}
                    alt={`${request.player_name} profile`}
                  />
                ) : (
                  <span>👤</span>
                )}

                <div>
                  <small>
                    {request.forge_id}
                  </small>

                  <h2>
                    {request.player_name}
                  </h2>

                  <p>
                    Player ID:{' '}
                    {request.player_id}
                  </p>
                </div>
              </div>

              <div className="alliance-request-card__message">
                <span>Application message</span>

                <p>
                  {request.request_message ||
                    'No message supplied.'}
                </p>
              </div>

              <div className="alliance-request-card__role">
                <label
                  htmlFor={`role-${request.id}`}
                >
                  Approve as
                </label>

                <select
                  id={`role-${request.id}`}
                  defaultValue="member"
                  disabled={
                    workingId === request.id
                  }
                  onChange={(event) => {
                    const role =
                      event.target
                        .value as AllianceMemberRole

                    event.currentTarget.dataset.role =
                      role
                  }}
                >
                  <option value="member">
                    Member
                  </option>
                  <option value="recruiter">
                    Recruiter
                  </option>
                  <option value="officer">
                    Officer
                  </option>
                  <option value="r4">
                    R4
                  </option>
                  <option value="leader">
                    Leader
                  </option>
                </select>
              </div>

              <div className="alliance-request-card__actions">
                <button
                  type="button"
                  className="button button--primary"
                  disabled={
                    workingId === request.id
                  }
                  onClick={(event) => {
                    const select =
                      event.currentTarget
                        .closest(
                          '.alliance-request-card',
                        )
                        ?.querySelector('select')

                    const role =
                      (select?.value ??
                        'member') as AllianceMemberRole

                    void handleApprove(
                      request.id,
                      role,
                    )
                  }}
                >
                  {workingId === request.id
                    ? 'Working…'
                    : 'Approve'}
                </button>

                <button
                  type="button"
                  className="remove-saved-button"
                  disabled={
                    workingId === request.id
                  }
                  onClick={() =>
                    void handleReject(
                      request.id,
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="alliance-community-state">
          <span>✅</span>

          <h2>No pending requests</h2>

          <p>
            New membership applications will
            appear here.
          </p>
        </div>
      )}
    </section>
  )
}

export default AllianceManagementPage