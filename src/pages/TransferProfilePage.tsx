import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'
import {
  createTransferProfile,
  deleteTransferProfile,
  getMyTransferProfile,
  updateTransferProfile,
} from '../services/transferService'
import type {
  TransferInvitationType,
  TransferPlayStyle,
  TransferProfile,
  TransferProfileStatus,
  TransferSpendingStyle,
} from '../types/transfer'

function parseNumberList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 9999,
    )
}

function parseTextList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinList(values: string[] | number[]) {
  return values.join(', ')
}

function formatStatus(
  status: TransferProfileStatus,
) {
  switch (status) {
    case 'looking':
      return 'Actively looking'
    case 'paused':
      return 'Paused'
    case 'matched':
      return 'Matched'
    case 'transferred':
      return 'Transferred'
    case 'withdrawn':
      return 'Withdrawn'
    default:
      return 'Draft'
  }
}

function TransferProfilePage() {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const [profile, setProfile] =
    useState<TransferProfile | null>(null)

  const [currentAllianceId, setCurrentAllianceId] =
    useState<string | null>(null)

  const [
    currentKingdomMembershipId,
    setCurrentKingdomMembershipId,
  ] = useState('')

  const [status, setStatus] =
    useState<TransferProfileStatus>('draft')

  const [playerPower, setPlayerPower] =
    useState('')

  const [mainLanguage, setMainLanguage] =
    useState('')

  const [
    additionalLanguages,
    setAdditionalLanguages,
  ] = useState('')

  const [eventTimes, setEventTimes] =
    useState('')

  const [playStyle, setPlayStyle] =
    useState<TransferPlayStyle | ''>('')

  const [spendingStyle, setSpendingStyle] =
    useState<TransferSpendingStyle | ''>('')

  const [preferredKingdoms, setPreferredKingdoms] =
    useState('')

  const [avoidedKingdoms, setAvoidedKingdoms] =
    useState('')

  const [
    preferredAllianceType,
    setPreferredAllianceType,
  ] = useState('')

  const [bearTimes, setBearTimes] =
    useState('')

  const [
    invitationType,
    setInvitationType,
  ] = useState<TransferInvitationType>(
    'unknown',
  )

  const [
    customInvitationType,
    setCustomInvitationType,
  ] = useState('')

  const [availableFrom, setAvailableFrom] =
    useState('')

  const [availableUntil, setAvailableUntil] =
    useState('')

  const [publicMessage, setPublicMessage] =
    useState('')

  const [privateNotes, setPrivateNotes] =
    useState('')

  const [discordUsername, setDiscordUsername] =
    useState('')

  const [
    allowDirectContact,
    setAllowDirectContact,
  ] = useState(false)

  const [isPublic, setIsPublic] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [removing, setRemoving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    if (
      authLoading ||
      loadingPlayerAccount
    ) {
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    const userId = user.id

    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setErrorMessage('')

      try {
        const [
          existingProfile,
          membershipResult,
          kingdomMembershipResult,
        ] = await Promise.all([
          getMyTransferProfile(userId),

          supabase
            .from('alliance_memberships')
            .select('alliance_id')
            .eq('user_id', userId)
            .eq('status', 'current')
            .maybeSingle(),

          supabase
            .from('player_kingdom_memberships')
            .select('kingdom_id')
            .eq(
              'player_account_id',
              playerAccount?.id,
            )
            .eq(
              'membership_status',
              'current',
            )
            .maybeSingle(),
        ])

        if (cancelled) {
          return
        }

        if (membershipResult.error) {
          throw membershipResult.error
        }

        if (kingdomMembershipResult.error) {
          throw kingdomMembershipResult.error
        }

        setCurrentAllianceId(
          membershipResult.data?.alliance_id ??
            null,
        )

        setCurrentKingdomMembershipId(
          kingdomMembershipResult.data
            ?.kingdom_id ?? '',
        )

        if (existingProfile) {
          setProfile(existingProfile)
          setStatus(existingProfile.status)

          setPlayerPower(
            existingProfile.player_power
              ? String(
                  existingProfile.player_power,
                )
              : '',
          )

          setMainLanguage(
            existingProfile.main_language ?? '',
          )

          setAdditionalLanguages(
            joinList(
              existingProfile.additional_languages,
            ),
          )

          setEventTimes(
            joinList(
              existingProfile
                .preferred_event_times_utc,
            ),
          )

          setPlayStyle(
            existingProfile.play_style ?? '',
          )

          setSpendingStyle(
            existingProfile.spending_style ?? '',
          )

          setPreferredKingdoms(
            joinList(
              existingProfile.preferred_kingdoms,
            ),
          )

          setAvoidedKingdoms(
            joinList(
              existingProfile.avoided_kingdoms,
            ),
          )

          setPreferredAllianceType(
            existingProfile
              .preferred_alliance_type ?? '',
          )

          setBearTimes(
            joinList(
              existingProfile
                .preferred_bear_times_utc,
            ),
          )

          setInvitationType(
            existingProfile
              .invitation_type_needed,
          )

          setCustomInvitationType(
            existingProfile
              .custom_invitation_type ?? '',
          )

          setAvailableFrom(
            existingProfile.available_from ?? '',
          )

          setAvailableUntil(
            existingProfile.available_until ?? '',
          )

          setPublicMessage(
            existingProfile.public_message ?? '',
          )

          setPrivateNotes(
            existingProfile.private_notes ?? '',
          )

          setDiscordUsername(
            existingProfile.discord_username ?? '',
          )

          setAllowDirectContact(
            existingProfile.allow_direct_contact,
          )

          setIsPublic(
            existingProfile.is_public,
          )
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Transfer profile could not be loaded.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      cancelled = true
    }
  }, [
    user,
    authLoading,
    loadingPlayerAccount,
    playerAccount?.id,
  ])

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!user || !playerAccount) {
      setErrorMessage(
        'Link your Kingshot player before creating a transfer profile.',
      )
      return
    }

    if (!currentKingdomMembershipId) {
      setErrorMessage(
        'Your current kingdom membership could not be found. Refresh your linked Kingshot player in My Forge.',
      )
      return
    }

    if (
      invitationType === 'custom' &&
      !customInvitationType.trim()
    ) {
      setErrorMessage(
        'Enter the custom invitation type.',
      )
      return
    }

    if (
      availableFrom &&
      availableUntil &&
      availableUntil < availableFrom
    ) {
      setErrorMessage(
        'Available until cannot be before available from.',
      )
      return
    }

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const values = {
      user_id: user.id,
      player_account_id:
        playerAccount.id,

      current_kingdom_id:
        currentKingdomMembershipId,

      current_kingdom_number:
        playerAccount.kingdom_id,

      current_alliance_id:
        currentAllianceId,

      status,

      player_power:
        playerPower.trim()
          ? Number(playerPower)
          : null,

      main_language:
        mainLanguage.trim() || null,

      additional_languages:
        parseTextList(
          additionalLanguages,
        ),

      preferred_event_times_utc:
        parseTextList(eventTimes),

      play_style:
        playStyle || null,

      spending_style:
        spendingStyle || null,

      preferred_kingdoms:
        parseNumberList(
          preferredKingdoms,
        ),

      avoided_kingdoms:
        parseNumberList(
          avoidedKingdoms,
        ),

      preferred_alliance_type:
        preferredAllianceType.trim() ||
        null,

      preferred_bear_times_utc:
        parseTextList(bearTimes),

      invitation_type_needed:
        invitationType,

      custom_invitation_type:
        invitationType === 'custom'
          ? customInvitationType.trim()
          : null,

      available_from:
        availableFrom || null,

      available_until:
        availableUntil || null,

      public_message:
        publicMessage.trim() || null,

      private_notes:
        privateNotes.trim() || null,

      discord_username:
        discordUsername.trim() || null,

      allow_direct_contact:
        allowDirectContact,

      is_public:
        isPublic &&
        status === 'looking',
    }

    try {
      if (profile) {
        const updatedProfile =
          await updateTransferProfile(
            profile.id,
            user.id,
            values,
          )

        setProfile(updatedProfile)
        setMessage(
          'Transfer profile updated.',
        )
      } else {
        const createdProfile =
          await createTransferProfile(
            values,
          )

        setProfile(createdProfile)
        setMessage(
          'Transfer profile created.',
        )
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Transfer profile could not be saved.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!user || !profile) {
      return
    }

    const confirmed =
      window.confirm(
        'Delete your transfer profile? This cannot be undone.',
      )

    if (!confirmed) {
      return
    }

    setRemoving(true)
    setMessage('')
    setErrorMessage('')

    try {
      await deleteTransferProfile(
        profile.id,
        user.id,
      )

      setProfile(null)
      setStatus('draft')
      setPlayerPower('')
      setMainLanguage('')
      setAdditionalLanguages('')
      setEventTimes('')
      setPlayStyle('')
      setSpendingStyle('')
      setPreferredKingdoms('')
      setAvoidedKingdoms('')
      setPreferredAllianceType('')
      setBearTimes('')
      setInvitationType('unknown')
      setCustomInvitationType('')
      setAvailableFrom('')
      setAvailableUntil('')
      setPublicMessage('')
      setPrivateNotes('')
      setDiscordUsername('')
      setAllowDirectContact(false)
      setIsPublic(false)

      setMessage(
        'Transfer profile deleted.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Transfer profile could not be deleted.',
      )
    } finally {
      setRemoving(false)
    }
  }

  if (
    authLoading ||
    loadingPlayerAccount ||
    loading
  ) {
    return (
      <section className="section page-section">
        <div className="transfer-profile-state">
          <span>🎫</span>
          <h2>Loading transfer profile…</h2>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="section page-section">
        <div className="transfer-profile-state">
          <span>🔒</span>

          <h2>Sign in required</h2>

          <p>
            Sign in to create a transfer
            profile.
          </p>
        </div>
      </section>
    )
  }

  if (!playerAccount) {
    return (
      <section className="section page-section">
        <div className="transfer-profile-state">
          <span>👤</span>

          <h2>
            Link your Kingshot player first
          </h2>

          <p>
            Transfer profiles are attached to
            your verified Forge identity.
          </p>

          <Link
            className="button button--primary"
            to="/my-forge"
          >
            Open My Forge
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section page-section transfer-profile-page">
      <div className="section-heading">
        <p className="eyebrow">
          Transfer Hub
        </p>

        <h1 className="page-title">
          Your transfer profile
        </h1>

        <p>
          Publish the information kingdom and
          alliance recruiters need when
          considering transfer candidates.
        </p>
      </div>

      <article className="transfer-profile-identity">
        {playerAccount.profile_photo ? (
          <img
            src={playerAccount.profile_photo}
            alt={`${playerAccount.player_name} profile`}
          />
        ) : (
          <span className="transfer-profile-identity__fallback">
            👤
          </span>
        )}

        <div>
          <span>Linked Kingshot player</span>

          <h2>
            {playerAccount.player_name}
          </h2>

          <p>
            Kingdom{' '}
            {playerAccount.kingdom_id}
            {' · '}
            {playerAccount
              .level_rendered_detailed ||
              playerAccount.level_rendered ||
              `Level ${playerAccount.player_level}`}
          </p>
        </div>

        <span
          className={`transfer-profile-status transfer-profile-status--${status}`}
        >
          {formatStatus(status)}
        </span>
      </article>

      <form
        className="transfer-profile-form"
        onSubmit={handleSave}
      >
        <section className="transfer-profile-section">
          <div className="transfer-profile-section__heading">
            <div>
              <span>Availability</span>
              <h2>Transfer status</h2>
            </div>
          </div>

          <div className="transfer-profile-grid">
            <div className="field">
              <label htmlFor="transfer-status">
                Profile status
              </label>

              <select
                id="transfer-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as TransferProfileStatus,
                  )
                }
              >
                <option value="draft">
                  Draft
                </option>
                <option value="looking">
                  Actively looking
                </option>
                <option value="paused">
                  Paused
                </option>
                <option value="matched">
                  Matched
                </option>
                <option value="transferred">
                  Transferred
                </option>
                <option value="withdrawn">
                  Withdrawn
                </option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="available-from">
                Available from
              </label>

              <input
                id="available-from"
                type="date"
                value={availableFrom}
                onChange={(event) =>
                  setAvailableFrom(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="available-until">
                Available until
              </label>

              <input
                id="available-until"
                type="date"
                value={availableUntil}
                onChange={(event) =>
                  setAvailableUntil(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="player-power">
                Player power
              </label>

              <input
                id="player-power"
                type="number"
                min="0"
                value={playerPower}
                placeholder="Example: 105000000"
                onChange={(event) =>
                  setPlayerPower(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="transfer-profile-section">
          <div className="transfer-profile-section__heading">
            <div>
              <span>Player preferences</span>
              <h2>Play style and activity</h2>
            </div>
          </div>

          <div className="transfer-profile-grid">
            <div className="field">
              <label htmlFor="main-language">
                Main language
              </label>

              <input
                id="main-language"
                type="text"
                value={mainLanguage}
                placeholder="Example: English"
                onChange={(event) =>
                  setMainLanguage(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="additional-languages">
                Additional languages
              </label>

              <input
                id="additional-languages"
                type="text"
                value={additionalLanguages}
                placeholder="Norwegian, German"
                onChange={(event) =>
                  setAdditionalLanguages(
                    event.target.value,
                  )
                }
              />

              <span className="field__help">
                Separate multiple languages with
                commas.
              </span>
            </div>

            <div className="field">
              <label htmlFor="play-style">
                Play style
              </label>

              <select
                id="play-style"
                value={playStyle}
                onChange={(event) =>
                  setPlayStyle(
                    event.target
                      .value as
                      | TransferPlayStyle
                      | '',
                  )
                }
              >
                <option value="">
                  Not selected
                </option>
                <option value="casual">
                  Casual
                </option>
                <option value="active">
                  Active
                </option>
                <option value="competitive">
                  Competitive
                </option>
                <option value="highly_competitive">
                  Highly competitive
                </option>
                <option value="mixed">
                  Mixed
                </option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="spending-style">
                Spending style
              </label>

              <select
                id="spending-style"
                value={spendingStyle}
                onChange={(event) =>
                  setSpendingStyle(
                    event.target
                      .value as
                      | TransferSpendingStyle
                      | '',
                  )
                }
              >
                <option value="">
                  Not selected
                </option>
                <option value="f2p">
                  Free to play
                </option>
                <option value="low_spender">
                  Low spender
                </option>
                <option value="moderate_spender">
                  Moderate spender
                </option>
                <option value="high_spender">
                  High spender
                </option>
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="event-times">
                Preferred event times UTC
              </label>

              <input
                id="event-times"
                type="text"
                value={eventTimes}
                placeholder="17:00, 19:00"
                onChange={(event) =>
                  setEventTimes(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="bear-times">
                Preferred Bear Trap times UTC
              </label>

              <input
                id="bear-times"
                type="text"
                value={bearTimes}
                placeholder="17:00, 19:00"
                onChange={(event) =>
                  setBearTimes(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="transfer-profile-section">
          <div className="transfer-profile-section__heading">
            <div>
              <span>Destination</span>
              <h2>Where are you looking?</h2>
            </div>
          </div>

          <div className="transfer-profile-grid">
            <div className="field">
              <label htmlFor="preferred-kingdoms">
                Preferred kingdoms
              </label>

              <input
                id="preferred-kingdoms"
                type="text"
                value={preferredKingdoms}
                placeholder="850, 851, 923"
                onChange={(event) =>
                  setPreferredKingdoms(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="avoided-kingdoms">
                Avoided kingdoms
              </label>

              <input
                id="avoided-kingdoms"
                type="text"
                value={avoidedKingdoms}
                placeholder="Optional"
                onChange={(event) =>
                  setAvoidedKingdoms(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="alliance-type">
                Preferred alliance type
              </label>

              <input
                id="alliance-type"
                type="text"
                value={preferredAllianceType}
                placeholder="Competitive, friendly, NAP alliance..."
                onChange={(event) =>
                  setPreferredAllianceType(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="invitation-type">
                Invitation type needed
              </label>

              <select
                id="invitation-type"
                value={invitationType}
                onChange={(event) =>
                  setInvitationType(
                    event.target
                      .value as TransferInvitationType,
                  )
                }
              >
                <option value="unknown">
                  Unknown
                </option>
                <option value="ordinary">
                  Ordinary
                </option>
                <option value="special">
                  Special
                </option>
                <option value="leading">
                  Leading
                </option>
                <option value="not_required">
                  Not required
                </option>
                <option value="custom">
                  Other
                </option>
              </select>
            </div>

            {invitationType === 'custom' && (
              <div className="field">
                <label htmlFor="custom-invitation">
                  Custom invitation type
                </label>

                <input
                  id="custom-invitation"
                  type="text"
                  value={customInvitationType}
                  onChange={(event) =>
                    setCustomInvitationType(
                      event.target.value,
                    )
                  }
                />
              </div>
            )}
          </div>
        </section>

        <section className="transfer-profile-section">
          <div className="transfer-profile-section__heading">
            <div>
              <span>Recruiter information</span>
              <h2>Tell kingdoms about you</h2>
            </div>
          </div>

          <div className="field">
            <label htmlFor="public-message">
              Public transfer message
            </label>

            <textarea
              id="public-message"
              rows={6}
              maxLength={1500}
              value={publicMessage}
              placeholder="Describe what you are looking for, your event participation and what you can bring to a kingdom or alliance."
              onChange={(event) =>
                setPublicMessage(
                  event.target.value,
                )
              }
            />

            <span className="field__help">
              {publicMessage.length}/1500
            </span>
          </div>

          <div className="field">
            <label htmlFor="private-notes">
              Private notes
            </label>

            <textarea
              id="private-notes"
              rows={4}
              maxLength={1500}
              value={privateNotes}
              placeholder="Only visible to you."
              onChange={(event) =>
                setPrivateNotes(
                  event.target.value,
                )
              }
            />
          </div>
        </section>

        <section className="transfer-profile-section">
          <div className="transfer-profile-section__heading">
            <div>
              <span>Contact and privacy</span>
              <h2>Profile visibility</h2>
            </div>
          </div>

          <div className="transfer-profile-grid">
            <div className="field">
              <label htmlFor="discord-username">
                Discord username
              </label>

              <input
                id="discord-username"
                type="text"
                value={discordUsername}
                placeholder="Optional"
                onChange={(event) =>
                  setDiscordUsername(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <label className="transfer-profile-checkbox">
            <input
              type="checkbox"
              checked={allowDirectContact}
              onChange={(event) =>
                setAllowDirectContact(
                  event.target.checked,
                )
              }
            />

            <span>
              Allow authorised recruiters to
              contact me directly
            </span>
          </label>

          <label className="transfer-profile-checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={status !== 'looking'}
              onChange={(event) =>
                setIsPublic(
                  event.target.checked,
                )
              }
            />

            <span>
              Publish this profile in the public
              Transfer Hub
            </span>
          </label>

          {status !== 'looking' && (
            <p className="transfer-profile-note">
              Set the profile status to
              “Actively looking” before publishing
              it publicly.
            </p>
          )}
        </section>

        <div className="transfer-profile-actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
          >
            {saving
              ? 'Saving…'
              : profile
                ? 'Update Transfer Profile'
                : 'Create Transfer Profile'}
          </button>

          {profile && (
            <button
              type="button"
              className="remove-saved-button"
              disabled={removing}
              onClick={() =>
                void handleDelete()
              }
            >
              {removing
                ? 'Deleting…'
                : 'Delete Profile'}
            </button>
          )}
        </div>
      </form>

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
    </section>
  )
}

export default TransferProfilePage