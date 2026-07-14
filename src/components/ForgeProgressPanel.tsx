import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type ForgeProgressData = {
  hasLinkedPlayer: boolean
  hasPublicProfile: boolean
  hasBiography: boolean
  showcasedHeroes: number
  hasTransferProfile: boolean
}

const EMPTY_PROGRESS: ForgeProgressData = {
  hasLinkedPlayer: false,
  hasPublicProfile: false,
  hasBiography: false,
  showcasedHeroes: 0,
  hasTransferProfile: false,
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value))
}

function getForgeLevel(score: number) {
  if (score >= 100) {
    return 5
  }

  if (score >= 75) {
    return 4
  }

  if (score >= 50) {
    return 3
  }

  if (score >= 25) {
    return 2
  }

  if (score > 0) {
    return 1
  }

  return 0
}

function getNextTask(
  progress: ForgeProgressData,
): string {
  if (!progress.hasLinkedPlayer) {
    return 'Link your Kingshot player account'
  }

  if (!progress.hasPublicProfile) {
    return 'Create and publish your player profile'
  }

  if (!progress.hasBiography) {
    return 'Add an introduction to your profile'
  }

  if (progress.showcasedHeroes < 6) {
    return `Add ${
      6 - progress.showcasedHeroes
    } more hero${
      6 - progress.showcasedHeroes === 1
        ? ''
        : 'es'
    } to your showcase`
  }

  if (!progress.hasTransferProfile) {
    return 'Publish your transfer profile'
  }

  return 'Your Forge profile is complete'
}

export default function ForgeProgressPanel() {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [progress, setProgress] =
    useState<ForgeProgressData>(
      EMPTY_PROGRESS,
    )

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProgress() {
      if (authLoading) {
        return
      }

      if (!user) {
        setProgress(EMPTY_PROGRESS)
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const {
          data: playerAccount,
          error: playerAccountError,
        } = await supabase
          .from('player_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle()

        if (playerAccountError) {
          throw playerAccountError
        }

        if (!playerAccount) {
          if (!cancelled) {
            setProgress(EMPTY_PROGRESS)
          }

          return
        }

        const playerAccountId =
          playerAccount.id as string

        const [
          playerProfileResult,
          heroResult,
          transferResult,
        ] = await Promise.all([
          supabase
            .from('player_profiles')
            .select(
              'is_public, about_me',
            )
            .eq(
              'player_account_id',
              playerAccountId,
            )
            .maybeSingle(),

          supabase
            .from('player_heroes')
            .select('id', {
              count: 'exact',
              head: true,
            })
            .eq(
              'player_account_id',
              playerAccountId,
            )
            .eq('is_showcase', true),

          supabase
            .from('transfer_profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_public', true)
            .maybeSingle(),
        ])

        if (playerProfileResult.error) {
          throw playerProfileResult.error
        }

        if (heroResult.error) {
          throw heroResult.error
        }

        if (transferResult.error) {
          throw transferResult.error
        }

        const playerProfile =
          playerProfileResult.data

        const nextProgress: ForgeProgressData = {
          hasLinkedPlayer: true,

          hasPublicProfile:
            playerProfile?.is_public === true,

          hasBiography:
            Boolean(
              playerProfile?.about_me?.trim(),
            ),

          showcasedHeroes:
            Math.min(
              heroResult.count ?? 0,
              6,
            ),

          hasTransferProfile:
            Boolean(transferResult.data),
        }

        if (!cancelled) {
          setProgress(nextProgress)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Forge progress could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProgress()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const score = useMemo(() => {
    let total = 0

    if (user) {
      total += 10
    }

    if (progress.hasLinkedPlayer) {
      total += 20
    }

    if (progress.hasPublicProfile) {
      total += 20
    }

    if (progress.hasBiography) {
      total += 10
    }

    total +=
      (progress.showcasedHeroes / 6) * 30

    if (progress.hasTransferProfile) {
      total += 10
    }

    return Math.round(
      clampPercentage(total),
    )
  }, [progress, user])

  const forgeLevel =
    getForgeLevel(score)

  const nextTask =
    getNextTask(progress)

  if (loading || authLoading) {
    return (
      <section
        className="forge-progress"
        aria-busy="true"
      >
        <p>Loading Forge progress…</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="forge-progress forge-progress--signed-out">
        <div className="forge-progress__icon">
          ⚒
        </div>

        <div>
          <p className="eyebrow">
            Forge progression
          </p>

          <h2>Begin your Forge journey</h2>

          <p>
            Sign in and link your Kingshot
            account to begin building your
            player profile.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="forge-progress">
      <div className="forge-progress__header">
        <div>
          <p className="eyebrow">
            Forge progression
          </p>

          <h2>
            Forge Level {forgeLevel}
          </h2>

          <p>
            Complete your profile to increase
            your Forge level.
          </p>
        </div>

        <div className="forge-progress__score">
          <strong>{score}%</strong>
          <span>Complete</span>
        </div>
      </div>

      <div
        className="forge-progress__track"
        role="progressbar"
        aria-label="Forge profile completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
      >
        <span
          style={{
            width: `${score}%`,
          }}
        />
      </div>

      <div className="forge-progress__levels">
        {[1, 2, 3, 4, 5].map(
          (level) => (
            <span
              key={level}
              className={
                level <= forgeLevel
                  ? 'forge-progress__level forge-progress__level--active'
                  : 'forge-progress__level'
              }
            >
              {level}
            </span>
          ),
        )}
      </div>

      <div className="forge-progress__checklist">
        <div
          className={
            progress.hasLinkedPlayer
              ? 'forge-progress-item forge-progress-item--complete'
              : 'forge-progress-item'
          }
        >
          <span>
            {progress.hasLinkedPlayer
              ? '✓'
              : '1'}
          </span>

          <div>
            <strong>Linked player</strong>
            <small>20% completion</small>
          </div>
        </div>

        <div
          className={
            progress.hasPublicProfile
              ? 'forge-progress-item forge-progress-item--complete'
              : 'forge-progress-item'
          }
        >
          <span>
            {progress.hasPublicProfile
              ? '✓'
              : '2'}
          </span>

          <div>
            <strong>Public profile</strong>
            <small>20% completion</small>
          </div>
        </div>

        <div
          className={
            progress.hasBiography
              ? 'forge-progress-item forge-progress-item--complete'
              : 'forge-progress-item'
          }
        >
          <span>
            {progress.hasBiography
              ? '✓'
              : '3'}
          </span>

          <div>
            <strong>Player introduction</strong>
            <small>10% completion</small>
          </div>
        </div>

        <div
          className={
            progress.showcasedHeroes === 6
              ? 'forge-progress-item forge-progress-item--complete'
              : 'forge-progress-item'
          }
        >
          <span>
            {progress.showcasedHeroes === 6
              ? '✓'
              : '4'}
          </span>

          <div>
            <strong>Hero Showcase</strong>

            <small>
              {progress.showcasedHeroes}/6
              heroes selected
            </small>
          </div>
        </div>

        <div
          className={
            progress.hasTransferProfile
              ? 'forge-progress-item forge-progress-item--complete'
              : 'forge-progress-item'
          }
        >
          <span>
            {progress.hasTransferProfile
              ? '✓'
              : '5'}
          </span>

          <div>
            <strong>Transfer profile</strong>
            <small>10% completion</small>
          </div>
        </div>
      </div>

      <div className="forge-progress__next">
        <span>Next objective</span>
        <strong>{nextTask}</strong>
      </div>

      {errorMessage && (
        <p className="profile-panel__error">
          {errorMessage}
        </p>
      )}
    </section>
  )
}