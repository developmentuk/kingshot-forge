import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import type { TransferProfile } from '../types/transfer'

type PlayerIdentity = {
  id: string
  player_name: string
  profile_photo: string | null
  kingdom_id: number | null
}

type TransferHubProfile = TransferProfile & {
  player: PlayerIdentity | null
}

function formatPower(value: number | null) {
  if (!value) {
    return 'Not provided'
  }

  return new Intl.NumberFormat('en-GB').format(value)
}

function formatStatus(status: TransferProfile['status']) {
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

function formatLabel(value: string | null) {
  if (!value) {
    return 'Not provided'
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

function TransferHubPage() {
  const [profiles, setProfiles] =
    useState<TransferHubProfile[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfiles() {
      setLoading(true)
      setErrorMessage('')

      try {
        const {
          data: transferProfiles,
          error: transferProfilesError,
        } = await supabase
          .from('transfer_profiles')
          .select('*')
          .eq('is_public', true)
          .eq('status', 'looking')
          .order('updated_at', {
            ascending: false,
          })

        if (transferProfilesError) {
          throw transferProfilesError
        }

        const profileRows =
          (transferProfiles ??
            []) as TransferProfile[]

        const playerAccountIds = [
          ...new Set(
            profileRows
              .map(
                (profile) =>
                  profile.player_account_id,
              )
              .filter(
                (id): id is string =>
                  Boolean(id),
              ),
          ),
        ]

        let playerAccounts: PlayerIdentity[] = []

        if (playerAccountIds.length > 0) {
          const {
            data,
            error: playerAccountsError,
          } = await supabase
            .from('player_accounts')
            .select(
              'id, player_name, profile_photo, kingdom_id',
            )
            .in('id', playerAccountIds)

          if (playerAccountsError) {
            throw playerAccountsError
          }

          playerAccounts =
            (data ?? []) as PlayerIdentity[]
        }

        const playersById = new Map(
          playerAccounts.map((player) => [
            player.id,
            player,
          ]),
        )

        const profilesWithPlayers =
          profileRows.map((profile) => ({
            ...profile,
            player:
              playersById.get(
                profile.player_account_id,
              ) ?? null,
          }))

        if (!cancelled) {
          setProfiles(profilesWithPlayers)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Transfer profiles could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfiles()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="section page-section">
        <div className="transfer-profile-state">
          <span>🔎</span>
          <h2>
            Loading transfer profiles…
          </h2>
        </div>
      </section>
    )
  }

  return (
    <section className="section page-section transfer-hub-page">
      <div className="section-heading">
        <p className="eyebrow">
          Transfer Hub
        </p>

        <h1 className="page-title">
          Players looking to transfer
        </h1>

        <p>
          Browse public transfer profiles from
          players looking for a new kingdom or
          alliance.
        </p>
      </div>

      {errorMessage && (
        <p className="profile-panel__error">
          {errorMessage}
        </p>
      )}

      {!errorMessage &&
        profiles.length === 0 && (
          <div className="transfer-profile-state">
            <span>🎫</span>

            <h2>
              No public transfer profiles yet
            </h2>

            <p>
              Public profiles will appear here
              once players set their status to
              actively looking and publish them.
            </p>

            <Link
              className="button button--primary"
              to="/transfer-profile"
            >
              Create your transfer profile
            </Link>
          </div>
        )}

      {profiles.length > 0 && (
        <div className="transfer-hub-grid">
          {profiles.map((profile) => (
            <article
              className="transfer-hub-card"
              key={profile.id}
            >
              <div className="transfer-hub-card__player">
                {profile.player?.profile_photo ? (
                  <img
                    className="transfer-hub-card__avatar"
                    src={
                      profile.player.profile_photo
                    }
                    alt={`${profile.player.player_name} profile`}
                  />
                ) : (
                  <span
                    className="transfer-hub-card__avatar-fallback"
                    aria-hidden="true"
                  >
                    👤
                  </span>
                )}

                <div>
                  <span>Player</span>

                  <h2>
                    {profile.player?.player_name ??
                      'Kingshot player'}
                  </h2>

                  <p>
                    Kingdom{' '}
                    {profile.current_kingdom_number ??
                      profile.player?.kingdom_id ??
                      'Not provided'}
                  </p>
                </div>

                <span
                  className={`transfer-profile-status transfer-profile-status--${profile.status}`}
                >
                  {formatStatus(profile.status)}
                </span>
              </div>

              <dl className="transfer-hub-card__details">
                <div>
                  <dt>Power</dt>
                  <dd>
                    {formatPower(
                      profile.player_power,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Main language</dt>
                  <dd>
                    {profile.main_language ||
                      'Not provided'}
                  </dd>
                </div>

                <div>
                  <dt>Play style</dt>
                  <dd>
                    {formatLabel(
                      profile.play_style,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Spending style</dt>
                  <dd>
                    {formatLabel(
                      profile.spending_style,
                    )}
                  </dd>
                </div>
              </dl>

              {profile.public_message && (
                <p className="transfer-hub-card__message">
                  {profile.public_message}
                </p>
              )}

              <Link className="button button--primary" to={`/player/${profile.player?.player_name ?? profile.id}`} 
>
  View Profile
</Link>



            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default TransferHubPage