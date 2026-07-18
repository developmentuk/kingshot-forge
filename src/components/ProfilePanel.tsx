import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'

type ForgeProfile = Profile & {
  forge_id: string
}

function formatRole(role: string | null | undefined) {
  if (!role) {
    return 'Member'
  }

  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function getVerificationLabel(
  status:
    | 'linked'
    | 'verified'
    | 'pending'
    | 'community_verified'
    | 'officially_verified'
    | 'rejected'
    | 'revoked'
    | undefined,
) {
  switch (status) {
    case 'verified':
      return 'Verified player'
    case 'officially_verified':
      return 'Officially verified'

    case 'community_verified':
      return 'Community verified'

    case 'pending':
      return 'Verification pending'

    case 'rejected':
      return 'Verification rejected'

    case 'revoked':
      return 'Verification revoked'

    case 'linked':
      return 'Linked player'

    default:
      return 'Not linked'
  }
}

function getVerificationClass(
  status:
    | 'linked'
    | 'verified'
    | 'pending'
    | 'community_verified'
    | 'officially_verified'
    | 'rejected'
    | 'revoked'
    | undefined,
) {
  switch (status) {
    case 'verified':
      return 'forge-passport-status forge-passport-status--verified'
    case 'officially_verified':
    case 'community_verified':
      return 'forge-passport-status forge-passport-status--verified'

    case 'pending':
      return 'forge-passport-status forge-passport-status--pending'

    case 'rejected':
    case 'revoked':
      return 'forge-passport-status forge-passport-status--warning'

    default:
      return 'forge-passport-status'
  }
}

function ProfilePanel() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth()

  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const [profile, setProfile] =
    useState<ForgeProfile | null>(null)

  const [displayName, setDisplayName] =
    useState('')

  const [alliance, setAlliance] =
    useState('')

  const [loadingProfile, setLoadingProfile] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [copiedForgeId, setCopiedForgeId] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setDisplayName('')
      setAlliance('')
      setLoadingProfile(false)
      return
    }

    const userId = user.id
    let cancelled = false

    async function loadProfile() {
      setLoadingProfile(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
            id,
            forge_id,
            display_name,
            avatar_url,
            alliance,
            role,
            created_at,
            updated_at
          `,
        )
        .eq('id', userId)
        .single()

      if (cancelled) {
        return
      }

      if (error) {
        setErrorMessage(error.message)
        setLoadingProfile(false)
        return
      }

      const loadedProfile =
        data as ForgeProfile

      setProfile(loadedProfile)

      setDisplayName(
        loadedProfile.display_name ?? '',
      )

      setAlliance(
        loadedProfile.alliance ?? '',
      )

      setLoadingProfile(false)
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!user) {
      setErrorMessage(
        'You must be signed in to save your profile.',
      )
      return
    }

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    const updatedAt =
      new Date().toISOString()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name:
          displayName.trim() || null,

        alliance:
          alliance.trim() || null,

        updated_at: updatedAt,
      })
      .eq('id', user.id)
      .select(
        `
          id,
          forge_id,
          display_name,
          avatar_url,
          alliance,
          role,
          created_at,
          updated_at
        `,
      )
      .single()

    if (error) {
      setErrorMessage(error.message)
      setSaving(false)
      return
    }

    const updatedProfile =
      data as ForgeProfile

    setProfile(updatedProfile)

    setDisplayName(
      updatedProfile.display_name ?? '',
    )

    setAlliance(
      updatedProfile.alliance ?? '',
    )

    setMessage('Forge profile saved.')
    setSaving(false)
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

  async function handleCopyForgeId() {
    if (!profile?.forge_id) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        profile.forge_id,
      )

      setCopiedForgeId(true)

      window.setTimeout(() => {
        setCopiedForgeId(false)
      }, 1500)
    } catch {
      setErrorMessage(
        'The Forge ID could not be copied automatically.',
      )
    }
  }

  if (authLoading) {
    return (
      <section className="profile-panel">
        <p>Loading Forge account…</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="profile-panel profile-panel--signed-out">
        <div className="profile-panel__signed-out-icon">
          👤
        </div>

        <div>
          <p className="eyebrow">
            Forge account
          </p>

          <h2>
            Create your player passport
          </h2>

          <p>
            Sign in with Google to link your
            Kingshot identity, join your kingdom
            community and prepare for future
            alliance, KvK and transfer features.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={handleSignIn}
        >
          Sign in with Google
        </button>

        {errorMessage && (
          <p className="profile-panel__error">
            {errorMessage}
          </p>
        )}
      </section>
    )
  }

  const googleDisplayName =
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email ??
    'Kingshot member'

  const visibleName =
    playerAccount?.player_name ??
    profile?.display_name ??
    googleDisplayName

  const avatarUrl =
    playerAccount?.profile_photo ??
    profile?.avatar_url ??
    (user.user_metadata.avatar_url as
      | string
      | undefined)

  const playerLevel =
    playerAccount?.level_rendered_detailed ??
    playerAccount?.level_rendered ??
    (playerAccount?.player_level
      ? `Level ${playerAccount.player_level}`
      : 'Not available')

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric',
      }).format(
        new Date(profile.created_at),
      )
    : 'Not available'

  return (
    <section className="profile-panel forge-passport">
      <div className="forge-passport__top">
        <div className="forge-passport__identity">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${visibleName} profile`}
              className="forge-passport__avatar"
            />
          ) : (
            <span className="forge-passport__avatar forge-passport__avatar--fallback">
              {visibleName
                .charAt(0)
                .toUpperCase()}
            </span>
          )}

          <div className="forge-passport__identity-content">
            <p className="eyebrow">
              Forge player passport
            </p>

            <h2>{visibleName}</h2>

            <div className="forge-passport__badges">
              <span className="profile-panel__role">
                {formatRole(profile?.role)}
              </span>

              <span
                className={getVerificationClass(
                  playerAccount?.verification_status,
                )}
              >
                {getVerificationLabel(
                  playerAccount?.verification_status,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="forge-passport__account-status">
          <span>Google account</span>
          <strong>Connected</strong>
          <small>{user.email}</small>
        </div>
      </div>

      {loadingProfile || loadingPlayerAccount ? (
        <div className="forge-passport__loading">
          Loading player passport…
        </div>
      ) : (
        <>
          <div className="forge-passport__id-panel">
            <div>
              <span>Permanent Forge ID</span>

              <strong>
                {profile?.forge_id ??
                  'Forge ID unavailable'}
              </strong>

              <small>
                Your Forge ID remains the same if
                your player name, alliance or
                kingdom changes.
              </small>
            </div>

            <button
              type="button"
              disabled={!profile?.forge_id}
              onClick={() =>
                void handleCopyForgeId()
              }
            >
              {copiedForgeId
                ? 'Copied!'
                : 'Copy ID'}
            </button>
          </div>

          <div className="forge-passport__stats">
            <div>
              <span>Kingdom</span>

              <strong>
                {playerAccount
                  ? `Kingdom ${playerAccount.kingdom_id}`
                  : 'Not linked'}
              </strong>
            </div>

            <div>
              <span>Alliance</span>

              <strong>
                {profile?.alliance ||
                  'Not listed'}
              </strong>
            </div>

            <div>
              <span>Player level</span>

              <strong>{playerLevel}</strong>
            </div>

            <div>
              <span>Forge role</span>

              <strong>
                {formatRole(profile?.role)}
              </strong>
            </div>

            <div>
              <span>Player status</span>

              <strong>
                {getVerificationLabel(
                  playerAccount?.verification_status,
                )}
              </strong>
            </div>

            <div>
              <span>Member since</span>

              <strong>{memberSince}</strong>
            </div>
          </div>

          <div className="forge-passport__details">
            <div>
              <span>Kingshot player ID</span>

              <strong>
                {playerAccount?.player_id ??
                  'No player linked'}
              </strong>
            </div>

            <div>
              <span>Profile visibility</span>

              <strong>
                {playerAccount
                  ? playerAccount.is_public
                    ? 'Public'
                    : 'Private'
                  : 'Not applicable'}
              </strong>
            </div>

            <div>
              <span>Discord</span>

              <strong>Not connected yet</strong>
            </div>

            <div>
              <span>Transfer profile</span>

              <strong>Coming soon</strong>
            </div>
          </div>

          <form
            className="profile-panel__form forge-passport__form"
            onSubmit={handleSave}
          >
            <div className="forge-passport__form-heading">
              <div>
                <span>Profile settings</span>
                <h3>Edit your Forge details</h3>
              </div>

              <p>
                Your Kingshot name, avatar, level
                and kingdom are managed through
                your linked player account.
              </p>
            </div>

            <div className="field">
              <label htmlFor="profile-display-name">
                Forge display name
              </label>

              <input
                id="profile-display-name"
                type="text"
                value={displayName}
                maxLength={40}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
                placeholder="Optional Forge display name"
              />

              <span className="field__help">
                Your linked Kingshot name takes
                priority wherever your player
                identity is shown.
              </span>
            </div>

            <div className="field">
              <label htmlFor="profile-alliance">
                Alliance tag
              </label>

              <input
                id="profile-alliance"
                type="text"
                value={alliance}
                maxLength={40}
                onChange={(event) =>
                  setAlliance(
                    event.target.value,
                  )
                }
                placeholder="Example: TLG"
              />

              <span className="field__help">
                This is currently self-reported.
                Verified alliance membership is
                coming next.
              </span>
            </div>

            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : 'Save Profile'}
            </button>
          </form>
        </>
      )}

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

export default ProfilePanel
