import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import {
  getPublicPlayerProfile,
  type PublicPlayerProfile,
} from '../services/playerProfileService'
import HeroShowcase from '../components/HeroShowcase'
import { getHeroShowcase } from '../services/heroService'
import { supabase } from '../lib/supabase'
import type { PlayerHeroWithHero } from '../types/hero'

function getTransferStatusLabel(
  status: PublicPlayerProfile['transferStatus'],
) {
  switch (status) {
    case 'open':
      return 'Open to transfer'
    case 'considering':
      return 'May consider'
    case 'not_moving':
      return 'Not moving'
  }
}

function getTransferStatusClass(
  status: PublicPlayerProfile['transferStatus'],
) {
  switch (status) {
    case 'open':
      return 'open'
    case 'considering':
      return 'considering'
    case 'not_moving':
      return 'not-moving'
  }
}

function formatValue(
  value: string | number | null,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not provided'
  }

  return value
}

export default function PlayerProfilePage() {
  const { forgeId } =
    useParams<{ forgeId: string }>()

  const [profile, setProfile] =
    useState<PublicPlayerProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [actionMessage, setActionMessage] =
    useState('')

  const [showcaseHeroes, setShowcaseHeroes] =
    useState<PlayerHeroWithHero[]>([])

  const [loadingHeroes, setLoadingHeroes] =
    useState(true)

  const [heroError, setHeroError] =
    useState('')

  const profileUrl = window.location.href

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setErrorMessage('')
      setProfile(null)

      if (!forgeId) {
        setErrorMessage(
          'No Forge ID was provided.',
        )
        setLoading(false)
        return
      }

      try {
        const result =
          await getPublicPlayerProfile(forgeId)

        if (!cancelled) {
          setProfile(result)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'The player profile could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [forgeId])

  useEffect(() => {
    let cancelled = false

    async function loadHeroShowcase() {
      setLoadingHeroes(true)
      setHeroError('')
      setShowcaseHeroes([])

      if (!forgeId) {
        setLoadingHeroes(false)
        return
      }

      try {
        const {
          data: playerProfile,
          error: playerProfileError,
        } = await supabase
          .from('player_profiles')
          .select('player_account_id')
          .eq('forge_id', forgeId)
          .eq('is_public', true)
          .maybeSingle()

        if (playerProfileError) {
          throw playerProfileError
        }

        if (!playerProfile) {
          return
        }

        const heroes = await getHeroShowcase(
          playerProfile.player_account_id,
        )

        if (!cancelled) {
          setShowcaseHeroes(heroes)
        }
      } catch (error) {
        if (!cancelled) {
          setHeroError(
            error instanceof Error
              ? error.message
              : 'The Hero Showcase could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingHeroes(false)
        }
      }
    }

    void loadHeroShowcase()

    return () => {
      cancelled = true
    }
  }, [forgeId])

  async function copyText(
    text: string,
    successMessage: string,
  ) {
    try {
      await navigator.clipboard.writeText(text)
      setActionMessage(successMessage)
    } catch {
      setActionMessage(
        'Unable to copy. Please copy it manually.',
      )
    }
  }

  async function shareProfile() {
    if (!profile) {
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.playerName} | Kingshot Forge`,
          text: `View ${profile.playerName}'s public Kingshot profile.`,
          url: profileUrl,
        })

        setActionMessage('Profile shared.')
        return
      }

      await copyText(
        profileUrl,
        'Profile link copied.',
      )
    } catch {
      setActionMessage('')
    }
  }

  if (loading) {
    return (
      <main className="player-profile-page">
        <section className="player-profile-panel">
          <div className="player-profile-loading">
            <span>🔎</span>

            <h1>Loading player profile…</h1>

            <p>
              Retrieving the latest public
              profile from Kingshot Forge.
            </p>
          </div>
        </section>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="player-profile-page">
        <section className="player-profile-panel">
          <div className="player-profile-error">
            <span>⚠️</span>

            <h1>Profile unavailable</h1>

            <p>{errorMessage}</p>
          </div>
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="player-profile-page">
        <section className="player-profile-panel">
          <div className="player-profile-empty">
            <span>👤</span>

            <h1>Profile not found</h1>

            <p>
              This profile may not exist, or the
              player has not made it public.
            </p>
          </div>
        </section>
      </main>
    )
  }

  const initials =
    profile.playerName
      .slice(0, 2)
      .toUpperCase()

  const statusClass =
    getTransferStatusClass(
      profile.transferStatus,
    )

  return (
    <main className="player-profile-page">
      <section className="player-profile-hero">
        {profile.profilePhoto ? (
          <img
            className="player-profile-avatar"
            src={profile.profilePhoto}
            alt={`${profile.playerName} profile`}
          />
        ) : (
          <div className="player-profile-avatar">
            {initials}
          </div>
        )}

        <div className="player-profile-heading">
          <p className="player-profile-eyebrow">
            Public player profile
          </p>

          <h1>{profile.playerName}</h1>

          <div className="player-profile-meta">
            <span>
              State{' '}
              {formatValue(
                profile.kingdomId,
              )}
            </span>

            <span>
              {formatValue(
                profile.allianceName,
              )}
            </span>

            <span>
              Forge ID: {profile.forgeId}
            </span>
          </div>
        </div>

        <div
          className={`transfer-status transfer-status--${statusClass}`}
        >
          <span className="transfer-status-dot" />

          {getTransferStatusLabel(
            profile.transferStatus,
          )}
        </div>
      </section>

      <section className="player-profile-stats">
        <article className="player-stat-card">
          <span>Town Center</span>

          <strong>
            {formatValue(
              profile.townCenterLevel,
            )}
          </strong>
        </article>

        <article className="player-stat-card">
          <span>VIP</span>

          <strong>
            {formatValue(
              profile.vipLevel,
            )}
          </strong>
        </article>

        <article className="player-stat-card">
          <span>Play style</span>

          <strong>
            {formatValue(
              profile.playStyle,
            )}
          </strong>
        </article>

        <article className="player-stat-card">
          <span>Language</span>

          <strong>
            {formatValue(
              profile.mainLanguage,
            )}
          </strong>
        </article>

        <article className="player-stat-card">
          <span>Profile updated</span>

          <strong>
            {new Date(
              profile.updatedAt,
            ).toLocaleDateString('en-GB')}
          </strong>
        </article>
      </section>

      <div className="player-profile-grid">
        <section className="player-profile-panel player-profile-about">
          <div className="player-profile-section-heading">
            <p className="player-profile-eyebrow">
              Player introduction
            </p>

            <h2>About me</h2>
          </div>

          <p>
            {profile.aboutMe ||
              'This player has not added an introduction yet.'}
          </p>
        </section>

        <section className="player-profile-panel">
          <div className="player-profile-section-heading">
            <p className="player-profile-eyebrow">
              Participation
            </p>

            <h2>Regular activities</h2>
          </div>

          {profile.activities.length > 0 ? (
            <div className="player-activity-list">
              {profile.activities.map(
                (activity) => (
                  <div
                    className="player-activity-item"
                    key={activity}
                  >
                    <span className="player-activity-check">
                      ✓
                    </span>

                    <span>{activity}</span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="player-profile-muted">
              No regular activities have been
              selected yet.
            </p>
          )}
        </section>
      </div>

      {heroError ? (
        <section className="player-profile-panel">
          <div className="player-profile-section-heading">
            <p className="player-profile-eyebrow">
              Hero Showcase
            </p>

            <h2>Unable to load heroes</h2>
          </div>

          <p className="profile-panel__error">
            {heroError}
          </p>
        </section>
      ) : (
        <HeroShowcase
          heroes={showcaseHeroes}
          isLoading={loadingHeroes}
          emptyMessage="This player has not selected any public showcase heroes yet."
        />
      )}

      <section className="player-profile-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            copyText(
              profileUrl,
              'Forge link copied.',
            )
          }
        >
          Copy Forge link
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            copyText(
              profile.forgeId,
              'Forge ID copied.',
            )
          }
        >
          Copy Forge ID
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={shareProfile}
        >
          Share profile
        </button>
      </section>

      {actionMessage && (
        <p
          className="player-profile-action-message"
          role="status"
        >
          {actionMessage}
        </p>
      )}
    </main>
  )
}