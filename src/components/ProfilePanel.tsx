import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'

function ProfilePanel() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth()

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [displayName, setDisplayName] =
    useState('')

  const [alliance, setAlliance] =
    useState('')

  const [loadingProfile, setLoadingProfile] =
    useState(false)

  const [saving, setSaving] =
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

      const loadedProfile = data as Profile

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

    const userId = user.id

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
      .eq('id', userId)
      .select(
        `
          id,
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

    const updatedProfile = data as Profile

    setProfile(updatedProfile)
    setDisplayName(
      updatedProfile.display_name ?? '',
    )
    setAlliance(
      updatedProfile.alliance ?? '',
    )
    setMessage('Profile saved.')
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

  if (authLoading) {
    return (
      <section className="profile-panel">
        <p>Loading account…</p>
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
            Sign in to sync your Forge
          </h2>

          <p>
            Use Google sign-in to manage your
            profile, submissions and saved content
            across devices.
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

  const authDisplayName =
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email ??
    'Kingshot member'

  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata.avatar_url as
      | string
      | undefined)

  return (
    <section className="profile-panel">
      <div className="profile-panel__header">
        <div className="profile-panel__identity">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="profile-panel__avatar"
            />
          ) : (
            <span className="profile-panel__avatar profile-panel__avatar--fallback">
              {authDisplayName
                .charAt(0)
                .toUpperCase()}
            </span>
          )}

          <div>
            <p className="eyebrow">
              Forge profile
            </p>

            <h2>
              {profile?.display_name ||
                authDisplayName}
            </h2>

            <span className="profile-panel__role">
              {profile?.role ?? 'member'}
            </span>
          </div>
        </div>

        <div className="profile-panel__meta">
          <span>{user.email}</span>

          {profile?.created_at && (
            <span>
              Member since{' '}
              {new Intl.DateTimeFormat(
                'en-GB',
                {
                  month: 'long',
                  year: 'numeric',
                },
              ).format(
                new Date(profile.created_at),
              )}
            </span>
          )}
        </div>
      </div>

      {loadingProfile ? (
        <p>Loading profile…</p>
      ) : (
        <form
          className="profile-panel__form"
          onSubmit={handleSave}
        >
          <div className="field">
            <label htmlFor="profile-display-name">
              Display name
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
              placeholder="How should your name appear?"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-alliance">
              Alliance
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