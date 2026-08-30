import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import {
  getMyPlayerProfileForAccount,
  saveMyPlayerProfile,
  type EditablePlayerProfile,
} from '../services/playerProfileService'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'
import type { PlayerTransferStatus } from '../types/playerProfile'

const ACTIVITY_OPTIONS = [
  'Bear Trap',
  'Alliance Championship',
  'Alliance Mobilisation',
  'Castle Battle',
  'Swordland Showdown',
  'KvK',
  'Viking Vengeance',
  'Strongest Governor',
]

const PLAY_STYLE_OPTIONS = [
  'Casual',
  'Active',
  'Competitive',
  'Event focused',
  'Alliance focused',
  'PvP focused',
  'Development focused',
]

const TRANSFER_STATUS_OPTIONS: Array<{
  value: PlayerTransferStatus
  label: string
}> = [
  {
    value: 'not_moving',
    label: 'Not moving',
  },
  {
    value: 'considering',
    label: 'May consider a transfer',
  },
  {
    value: 'open',
    label: 'Open to transfer',
  },
]

type ForgeIdentity = Pick<
  Profile,
  'forge_id'
>

function mergeRefreshedPlayerProfile(
  current: EditablePlayerProfile,
  refreshed: EditablePlayerProfile,
): EditablePlayerProfile {
  if (
    current.playerAccountId !==
    refreshed.playerAccountId
  ) {
    return refreshed
  }

  return {
    ...current,
    playerId: refreshed.playerId,
    playerName: refreshed.playerName,
    profilePhoto: refreshed.profilePhoto,
    kingdomId: refreshed.kingdomId,
    playerLevel: refreshed.playerLevel,
    townCenterLevel: refreshed.townCenterLevel,
    levelImage: refreshed.levelImage,
    verificationStatus:
      refreshed.verificationStatus,
    lastRefreshedAt:
      refreshed.lastRefreshedAt,
  }
}

export default function PlayerProfileEditorPage() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
    playerIdentityRefreshWarning,
    refreshPlayerIdentity,
  } = usePlayerIdentity()

  const [profile, setProfile] =
    useState<EditablePlayerProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const loadedPlayerAccountIdRef =
    useRef<string | null | undefined>(
      undefined,
    )

  useEffect(() => {
    let cancelled = false

    async function loadEditor() {
      if (authLoading || loadingPlayerAccount) {
        return
      }

      if (!user) {
        loadedPlayerAccountIdRef.current =
          undefined
        setProfile(null)
        setLoading(false)
        return
      }

      const nextPlayerAccountId =
        playerAccount?.id ?? null

      const isInitialOrDifferentPlayer =
        loadedPlayerAccountIdRef.current !==
        nextPlayerAccountId

      if (isInitialOrDifferentPlayer) {
        setLoading(true)
      }

      setMessage('')
      setErrorMessage('')

      try {
        const {
          data: identityData,
          error: identityError,
        } = await supabase
          .from('profiles')
          .select('forge_id')
          .eq('id', user.id)
          .single()

        if (identityError) {
          throw identityError
        }

        const forgeIdentity =
          identityData as ForgeIdentity

        const result = playerAccount
          ? await getMyPlayerProfileForAccount(playerAccount, forgeIdentity.forge_id)
          : null

        if (!cancelled) {
          setProfile((current) => {
            if (!current || !result) {
              return result
            }

            return mergeRefreshedPlayerProfile(
              current,
              result,
            )
          })

          loadedPlayerAccountIdRef.current =
            nextPlayerAccountId
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Your Passport could not be loaded.',
          )
        }
      } finally {
        if (
          !cancelled &&
          isInitialOrDifferentPlayer
        ) {
          setLoading(false)
        }
      }
    }

    void loadEditor()

    return () => {
      cancelled = true
    }
  }, [authLoading, loadingPlayerAccount, playerAccount, user])

  const publicProfilePath = useMemo(() => {
    if (!profile?.forgeId) {
      return null
    }

    return `/player/${encodeURIComponent(
      profile.forgeId,
    )}`
  }, [profile?.forgeId])

  function updateProfile<
    Key extends keyof EditablePlayerProfile,
  >(
    key: Key,
    value: EditablePlayerProfile[Key],
  ) {
    setProfile((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        [key]: value,
      }
    })
  }

  function toggleActivity(activity: string) {
    if (!profile) {
      return
    }

    const isSelected =
      profile.activities.includes(activity)

    updateProfile(
      'activities',
      isSelected
        ? profile.activities.filter(
            (item) => item !== activity,
          )
        : [...profile.activities, activity],
    )
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!profile) {
      return
    }

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      await saveMyPlayerProfile({
        playerAccountId:
          profile.playerAccountId,

        forgeId:
          profile.forgeId,

        allianceName:
          profile.allianceName,

        vipLevel:
          profile.vipLevel,

        aboutMe:
          profile.aboutMe,

        playStyle:
          profile.playStyle,

        mainLanguage:
          profile.mainLanguage,

        transferStatus:
          profile.transferStatus,

        activities:
          profile.activities,

        isPublic:
          profile.isPublic,
      })

      window.dispatchEvent(new Event('kingshot-player-updated'))

      setMessage(
        profile.isPublic
          ? 'Passport saved and published.'
          : 'Passport saved privately.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The Passport could not be saved.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleSignIn() {
    setErrorMessage('')

    try {
      await signInWithGoogle()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed.',
      )
    }
  }

  if (authLoading || loading) {
    return (
      <main className="player-profile-editor-page">
        <section className="player-profile-editor-state">
          <span>👤</span>

          <h1>Loading Edit Passport…</h1>

          <p>
            Retrieving your linked player and
            Forge profile.
          </p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="player-profile-editor-page">
        <section className="player-profile-editor-state">
          <span>🔐</span>

          <h1>Sign in to edit your Passport</h1>

          <p>
            Your public Passport is linked to your Forge account and Kingshot player.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              void handleSignIn()
            }
          >
            Sign in with Google
          </button>

          {errorMessage && (
            <p className="profile-panel__error">
              {errorMessage}
            </p>
          )}
        </section>
      </main>
    )
  }

  if (errorMessage && !profile) {
    return (
      <main className="player-profile-editor-page">
        <section className="player-profile-editor-state">
          <span>⚠️</span>

          <h1>Profile editor unavailable</h1>

          <p>{errorMessage}</p>

          <Link
            className="button button--secondary"
            to="/my-forge"
          >
            Return to My Forge
          </Link>
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="player-profile-editor-page">
        <section className="player-profile-editor-state">
          <span>🔗</span>

          <h1>Link a Kingshot player first</h1>

          <p>
            A primary Kingshot player account
            must be linked before you can create
            a public Passport.
          </p>

          <Link
            className="button button--primary"
            to="/my-forge"
          >
            Open My Forge
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="player-profile-editor-page">
      <div className="player-profile-editor-heading">
        <div>
          <p className="eyebrow">
            My Forge
          </p>

          <h1>Edit Passport</h1>

          <p>
            Edit the player-controlled fields shown on your public Passport.
          </p>
        </div>

        <div className="player-profile-editor-heading__actions">
          <button
            type="button"
            className="button button--secondary"
            disabled={loadingPlayerAccount}
            onClick={() =>
              void refreshPlayerIdentity('manual')
            }
          >
            {loadingPlayerAccount
              ? 'Refreshing…'
              : 'Refresh Player'}
          </button>

          <Link
            className="button button--secondary"
            to="/my-forge"
          >
            Back to My Forge
          </Link>

          {profile.isPublic &&
            publicProfilePath && (
              <Link
                className="button button--secondary"
                to={publicProfilePath}
              >
                View public profile
              </Link>
            )}
        </div>
      </div>

      <form
        className="player-profile-editor-layout"
        onSubmit={handleSave}
      >
        <div className="player-profile-editor-form">
          <section className="player-profile-editor-card player-profile-editor-context">
            <div className="player-profile-editor-card__heading">
              <div>
                <p className="eyebrow">
                  Passport context
                </p>

                <h2>Linked player</h2>
              </div>

              <span className="player-profile-editor-badge">
                Read only
              </span>
            </div>

            <div className="player-profile-editor-identity">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={`${profile.playerName} profile`}
                />
              ) : (
                <span className="player-profile-editor-avatar">
                  {profile.playerName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <div>
                <strong>
                  {profile.playerName}
                </strong>

                <span>
                  Kingdom{' '}
                  {profile.kingdomId ??
                    'not available'}
                </span>

                <small>Town Center: {profile.townCenterLevel}</small>
                <small>Linked to Forge account</small>
              </div>
            </div>

            <div className="player-profile-api-grid">
  <div>
    <span>Player ID</span>
    <strong>{profile.playerId}</strong>
  </div>

  <div>
    <span>Kingdom</span>
    <strong>
      {profile.kingdomId !== null
        ? `Kingdom ${profile.kingdomId}`
        : 'Not available'}
    </strong>
  </div>

  <div>
    <span>Town Center</span>
    <strong>
      {profile.townCenterLevel}
    </strong>
  </div>

  <div>
    <span>Verification</span>
    <strong>
      {profile.verificationStatus
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        )}
    </strong>
  </div>

  <div>
    <span>Last API refresh</span>
    <strong>
      {new Date(
        profile.lastRefreshedAt,
      ).toLocaleString('en-GB')}
    </strong>
  </div>
</div>

<p className="player-profile-editor-note">
  Player name, avatar, kingdom and Town Center are supplied by the Kingshot API and cannot be edited here.
</p>

{playerIdentityRefreshWarning && (
  <p
    className="profile-panel__error"
    role="status"
  >
    {playerIdentityRefreshWarning}
  </p>
)}
          </section>

          <section className="player-profile-editor-card">
            <div className="player-profile-editor-card__heading">
              <div>
                <p className="eyebrow">
                  Passport fields
                </p>

                  <h2>Player-controlled information</h2>
              </div>
            </div>

            <div className="player-profile-editor-fields">
              <div className="field">
                <label htmlFor="profile-alliance-name">
                  Alliance name or tag
                </label>

                <input
                  id="profile-alliance-name"
                  type="text"
                  maxLength={60}
                  value={profile.allianceName}
                  onChange={(event) =>
                    updateProfile(
                      'allianceName',
                      event.target.value,
                    )
                  }
                  placeholder="Example: TLG"
                />
              </div>

              <div className="player-profile-api-field">
  <div className="player-profile-api-field__heading">
    <span>Town Center level</span>

    <strong>API managed</strong>
  </div>

  <div className="player-profile-api-field__value">
    {profile.levelImage && (
      <img
        src={profile.levelImage}
        alt=""
      />
    )}

    <span>
      {profile.townCenterLevel}
    </span>
  </div>

  <small>
    Automatically supplied by your linked
    Kingshot account.
  </small>
</div>

              <div className="field">
                <label htmlFor="profile-vip-level">
                  VIP level
                </label>

                <input
                  id="profile-vip-level"
                  type="number"
                  min={0}
                  max={30}
                  value={
                    profile.vipLevel ?? ''
                  }
                  onChange={(event) =>
                    updateProfile(
                      'vipLevel',
                      event.target.value === ''
                        ? null
                        : Number(
                            event.target.value,
                          ),
                    )
                  }
                  placeholder="Example: 10"
                />
              </div>

              <div className="field">
                <label htmlFor="profile-language">
                  Main language
                </label>

                <input
                  id="profile-language"
                  type="text"
                  maxLength={50}
                  value={
                    profile.mainLanguage
                  }
                  onChange={(event) =>
                    updateProfile(
                      'mainLanguage',
                      event.target.value,
                    )
                  }
                  placeholder="Example: English"
                />
              </div>

              <div className="field">
                <label htmlFor="profile-play-style">
                  Play style
                </label>

                <select
                  id="profile-play-style"
                  value={profile.playStyle}
                  onChange={(event) =>
                    updateProfile(
                      'playStyle',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select a play style
                  </option>

                  {PLAY_STYLE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="field">
                <label htmlFor="profile-transfer-status">
                  Transfer status
                </label>

                <select
                  id="profile-transfer-status"
                  value={
                    profile.transferStatus
                  }
                  onChange={(event) =>
                    updateProfile(
                      'transferStatus',
                      event.target
                        .value as PlayerTransferStatus,
                    )
                  }
                >
                  {TRANSFER_STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="profile-about-me">
                About me
              </label>

              <textarea
                id="profile-about-me"
                rows={6}
                maxLength={700}
                value={profile.aboutMe}
                onChange={(event) =>
                  updateProfile(
                    'aboutMe',
                    event.target.value,
                  )
                }
                placeholder="Introduce yourself, your experience and what you enjoy in Kingshot."
              />

              <span className="field__help">
                {profile.aboutMe.length}/700
                characters
              </span>
            </div>
          </section>

          <section className="player-profile-editor-card">
            <div className="player-profile-editor-card__heading">
              <div>
                <p className="eyebrow">
                  Participation
                </p>

                <h2>Regular activities</h2>
              </div>
            </div>

            <div className="player-profile-activity-options">
              {ACTIVITY_OPTIONS.map(
                (activity) => {
                  const isSelected =
                    profile.activities.includes(
                      activity,
                    )

                  return (
                    <button
                      key={activity}
                      type="button"
                      className={
                        isSelected
                          ? 'player-profile-activity-option player-profile-activity-option--selected'
                          : 'player-profile-activity-option'
                      }
                      aria-pressed={isSelected}
                      onClick={() =>
                        toggleActivity(activity)
                      }
                    >
                      <span>
                        {isSelected
                          ? '✓'
                          : '+'}
                      </span>

                      {activity}
                    </button>
                  )
                },
              )}
            </div>
          </section>

          <section className="player-profile-editor-card">
            <div className="player-profile-editor-card__heading">
              <div>
                <p className="eyebrow">
                  Visibility
                </p>

                <h2>Publish your profile</h2>
              </div>
            </div>

            <label className="player-profile-visibility-toggle">
              <input
                type="checkbox"
                checked={profile.isPublic}
                onChange={(event) =>
                  updateProfile(
                    'isPublic',
                    event.target.checked,
                  )
                }
              />

              <span className="player-profile-visibility-toggle__control" />

              <span>
                <strong>
                  Make my Passport public
                </strong>

                <small>
                  Public profiles can be opened
                  and shared using your permanent
                  Forge ID.
                </small>
              </span>
            </label>
          </section>

          <div className="player-profile-editor-save">
            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
            >
              {saving
                ? 'Saving Passport…'
                : 'Save Passport'}
            </button>

            {message && (
              <p
                className="profile-panel__success"
                role="status"
              >
                {message}
              </p>
            )}

            {errorMessage && (
              <p
                className="profile-panel__error"
                role="alert"
              >
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        <aside className="player-profile-editor-preview">
          <div className="player-profile-editor-preview__sticky">
            <p className="eyebrow">
              Live preview
            </p>

            <h2>Public profile card</h2>

            <div className="player-profile-preview-card">
              <div className="player-profile-preview-card__identity">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt=""
                  />
                ) : (
                  <span>
                    {profile.playerName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <div>
                  <strong>
                    {profile.playerName}
                  </strong>

                  <small>
                    State{' '}
                    {profile.kingdomId ??
                      'Unknown'}
                  </small>
                </div>
              </div>

              <div className="player-profile-preview-card__badges">
                <span>
                  {profile.allianceName ||
                    'No alliance'}
                </span>

                <span>
                  {profile.townCenterLevel ||
                    'Town Center not added'}
                </span>
              </div>

              <div className="player-profile-preview-card__stats">
                <div>
                  <span>VIP</span>

                  <strong>
                    {profile.vipLevel ??
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Language</span>

                  <strong>
                    {profile.mainLanguage ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Play style</span>

                  <strong>
                    {profile.playStyle ||
                      '—'}
                  </strong>
                </div>
              </div>

              <p>
                {profile.aboutMe ||
                  'Your player introduction will appear here.'}
              </p>

              <div className="player-profile-preview-card__footer">
                <span>
                  {profile.isPublic
                    ? 'Public profile'
                    : 'Private draft'}
                </span>

                <strong>
                  {profile.activities.length}{' '}
                  activities
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </main>
  )
}
