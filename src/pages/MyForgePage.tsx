import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LinkedPlayerPanel from '../components/LinkedPlayerPanel'
import DashboardCard from '../components/dashboard/DashboardCard'
import { artTemplates } from '../data/artTemplates'
import { nameVariants } from '../data/nameVariants'
import {
  clearRecentNames,
  loadRecentNames,
  RECENT_NAMES_STORAGE_KEY,
  RECENT_NAMES_UPDATED_EVENT,
  type RecentName,
} from '../data/recentNames'
import ForgeProgressPanel from '../components/ForgeProgressPanel'
import AdminHeroSyncPanel from '../components/AdminHeroSyncPanel'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { supabase } from '../lib/supabase'
import type { PlayerVerificationStatus } from '../types/playerAccount'


const NAME_FAVOURITES_KEY =
  'kingshot-forge-name-favourites'

const ART_FAVOURITES_KEY =
  'kingshot-forge-art-favourites'

type PlayerProfileSummary = {
  alliance_name: string | null
  is_public: boolean
}

function PlayerHeadquarters() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const {
    playerAccount,
    loadingPlayerAccount,
    playerIdentityError,
    refreshPlayerIdentity,
  } = usePlayerIdentity()
  const [profile, setProfile] = useState<PlayerProfileSummary | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfileSummary() {
      if (!playerAccount) {
        setProfile(null)
        setProfileLoading(false)
        setProfileError(null)
        return
      }

      setProfileLoading(true)
      setProfileError(null)
      const { data, error } = await supabase
        .from('player_profiles')
        .select('alliance_name, is_public')
        .eq('player_account_id', playerAccount.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setProfileError('Profile details could not be loaded.')
        setProfile(null)
      } else {
        setProfile(data as PlayerProfileSummary | null)
      }
      setProfileLoading(false)
    }

    void loadProfileSummary()
    return () => {
      cancelled = true
    }
  }, [playerAccount])

  const visibility = playerAccount
    ? playerAccount.is_public && profile?.is_public
      ? 'Public'
      : 'Private'
    : 'Not set up'

  let action: { label: string; to?: string; onClick?: () => void; description: string }
  if (authLoading || loadingPlayerAccount) {
    action = { label: 'Loading identity', description: 'Checking your linked Kingshot player.' }
  } else if (!user) {
    action = { label: 'Sign in to continue', onClick: () => void signInWithGoogle(), description: 'Sign in to link a player and manage your Forge profile.' }
  } else if (playerIdentityError) {
    action = { label: 'Retry identity load', onClick: () => void refreshPlayerIdentity(), description: 'Your linked player could not be loaded.' }
  } else if (!playerAccount) {
    action = { label: 'Link a player', to: '/my-forge/player-identity', description: 'Connect your Kingshot player to unlock the account tools.' }
  } else if (profileLoading || profileError || !profile) {
    action = { label: 'Complete public profile', to: '/my-forge/profile', description: 'Add the details people will see on your Forge profile.' }
  } else if (!playerAccount.is_public || !profile.is_public) {
    action = { label: 'Manage visibility', to: '/my-forge/profile', description: 'Review the fields and visibility of your public profile.' }
  } else {
    action = { label: 'Update Hero Showcase', to: '/my-forge/heroes', description: 'Keep the heroes on your public profile current.' }
  }

  const initials = playerAccount?.player_name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'KF'

  return (
    <section className="player-headquarters" aria-labelledby="player-headquarters-title">
      <div className="player-headquarters__identity">
        {playerAccount?.profile_photo ? (
          <img className="player-headquarters__avatar" src={playerAccount.profile_photo} alt="" />
        ) : (
          <div className="player-headquarters__avatar player-headquarters__avatar--fallback" aria-hidden="true">{initials}</div>
        )}
        <div className="player-headquarters__copy">
          <p className="eyebrow">Player Headquarters</p>
          <h2 id="player-headquarters-title">{playerAccount?.player_name || 'Set up your player identity'}</h2>
          <p>
            {playerAccount
              ? <>Kingdom {playerAccount.kingdom_id}{profile?.alliance_name ? <> · {profile.alliance_name}</> : null}</>
              : 'One place for your linked player, profile, progression and showcase.'}
          </p>
        </div>
        {playerAccount ? (
          <div className="player-headquarters__badges" aria-label="Player status">
            <span className="player-identity__status-badge">{getVerificationLabel(playerAccount.verification_status)}</span>
            <span className="player-identity__status-badge player-identity__status-badge--muted">{visibility} profile</span>
          </div>
        ) : null}
      </div>
      <div className="player-headquarters__next">
        <div>
          <p className="eyebrow">Priority action</p>
          <p>{action.description}</p>
          {profileError ? <p className="player-headquarters__hint">Profile details will retry when you open the editor.</p> : null}
        </div>
        {action.to ? <Link className="button button--primary" to={action.to}>{action.label}</Link> : <button className="button button--primary" type="button" onClick={action.onClick} disabled={action.label === 'Loading identity'}>{action.label}</button>}
      </div>
    </section>
  )
}

function getVerificationLabel(status: PlayerVerificationStatus) {
  switch (status) {
    case 'officially_verified': return 'Officially verified'
    case 'community_verified': return 'Community verified'
    case 'pending': return 'Verification pending'
    case 'rejected': return 'Verification rejected'
    case 'revoked': return 'Verification revoked'
    default: return 'Linked account'
  }
}

function loadStoredIds(storageKey: string): string[] {
  try {
    const storedValue =
      window.localStorage.getItem(storageKey)

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown =
      JSON.parse(storedValue)

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (value): value is string =>
            typeof value === 'string',
        )
      : []
  } catch {
    return []
  }
}

function MyForgePage() {
  const [nameFavouriteIds, setNameFavouriteIds] =
    useState<string[]>(() =>
      loadStoredIds(NAME_FAVOURITES_KEY),
    )

  const [artFavouriteIds, setArtFavouriteIds] =
    useState<string[]>(() =>
      loadStoredIds(ART_FAVOURITES_KEY),
    )

  const [recentNames, setRecentNames] =
    useState<RecentName[]>(() =>
      loadRecentNames(),
    )

  const [copiedId, setCopiedId] =
    useState<string | null>(null)

  useEffect(() => {
    function refreshRecentNames() {
      setRecentNames(loadRecentNames())
    }

    function handleStorageChange(
      event: StorageEvent,
    ) {
      if (
        event.key ===
        RECENT_NAMES_STORAGE_KEY
      ) {
        refreshRecentNames()
      }
    }

    window.addEventListener(
      RECENT_NAMES_UPDATED_EVENT,
      refreshRecentNames,
    )

    window.addEventListener(
      'storage',
      handleStorageChange,
    )

    window.addEventListener(
      'focus',
      refreshRecentNames,
    )

    refreshRecentNames()

    return () => {
      window.removeEventListener(
        RECENT_NAMES_UPDATED_EVENT,
        refreshRecentNames,
      )

      window.removeEventListener(
        'storage',
        handleStorageChange,
      )

      window.removeEventListener(
        'focus',
        refreshRecentNames,
      )
    }
  }, [])

  const favouriteNameStyles = useMemo(
    () =>
      nameVariants.filter((variant) =>
        nameFavouriteIds.includes(
          variant.id,
        ),
      ),
    [nameFavouriteIds],
  )

  const favouriteArt = useMemo(
    () =>
      artTemplates.filter((template) =>
        artFavouriteIds.includes(
          template.id,
        ),
      ),
    [artFavouriteIds],
  )

  async function copyValue(
    value: string,
    itemId: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        value,
      )

      setCopiedId(itemId)

      window.setTimeout(() => {
        setCopiedId(null)
      }, 1500)
    } catch {
      alert(
        'Copy failed. Please select and copy the text manually.',
      )
    }
  }

  function removeNameFavourite(
    id: string,
  ) {
    setNameFavouriteIds((current) => {
      const updated = current.filter(
        (itemId) => itemId !== id,
      )

      window.localStorage.setItem(
        NAME_FAVOURITES_KEY,
        JSON.stringify(updated),
      )

      return updated
    })
  }

  function removeArtFavourite(
    id: string,
  ) {
    setArtFavouriteIds((current) => {
      const updated = current.filter(
        (itemId) => itemId !== id,
      )

      window.localStorage.setItem(
        ART_FAVOURITES_KEY,
        JSON.stringify(updated),
      )

      return updated
    })
  }

  function removeHistory() {
    clearRecentNames()
    setRecentNames([])
  }

  const totalSaved =
    favouriteNameStyles.length +
    favouriteArt.length +
    recentNames.length

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">
          My Forge
        </p>

        <h1 className="page-title">
          Your Forge dashboard
        </h1>

        <p>
          Manage your Kingshot identity,
          linked player account, public profile
          and saved Forge creations.
        </p>
      </div>
      <PlayerHeadquarters />
<DashboardCard
  title="Forge Progress"
  subtitle="Build your profile, showcase your heroes and increase your Forge level."
  icon="⚒"
  accent="gold"
>
  <ForgeProgressPanel />
</DashboardCard>
      <DashboardCard
        title="Linked player management"
        subtitle="Refresh or change the linked player used by your Forge identity."
        icon="🔗"
        accent="blue"
      >
        <LinkedPlayerPanel />
      </DashboardCard>

      <DashboardCard
        title="Player Profile"
        subtitle="Build the information shown on your public Forge profile."
        icon="👤"
        accent="gold"
      >
        <div className="my-forge-feature-grid">
          <Link
  className="my-forge-feature-card my-forge-feature-card--link"
  to="/my-forge/profile"
>
  <span className="my-forge-feature-card__icon">
    👤
  </span>

  <div>
    <span className="my-forge-card__category">
      Profile
    </span>

    <h3>Player details</h3>

    <p>
      Manage your alliance, Town Center, VIP
      level, language and player introduction.
    </p>
  </div>

  <span className="my-forge-feature-card__status my-forge-feature-card__status--available">
    Open editor →
  </span>
</Link>

          <Link
  className="my-forge-feature-card my-forge-feature-card--link"
  to="/my-forge/heroes"
>
  <span className="my-forge-feature-card__icon">
    ⭐
  </span>

  <div>
    <span className="my-forge-card__category">
      Heroes
    </span>

    <h3>Hero Showcase</h3>

    <p>
      Select and arrange up to six heroes for
      your public Forge profile.
    </p>
  </div>

  <span className="my-forge-feature-card__status my-forge-feature-card__status--available">
    Open editor →
  </span>
</Link>

          <Link className="my-forge-feature-card my-forge-feature-card--link" to="/my-forge/progression">
            <span className="my-forge-feature-card__icon">
              📈
            </span>
            <div>
              <span className="my-forge-card__category">
                Progression
              </span>
              <h3>Progression snapshot</h3>
              <p>Record your Town Center, troop tiers, VIP and current power.</p>
            </div>
            <span className="my-forge-feature-card__status my-forge-feature-card__status--available">Open planner →</span>
          </Link>

          <Link className="my-forge-feature-card my-forge-feature-card--link" to="/transfer-profile">
            <span className="my-forge-feature-card__icon">
              🔁
            </span>
            <div>
              <span className="my-forge-card__category">
                Transfer
              </span>
              <h3>Transfer profile</h3>
              <p>Record transfer preferences and choose whether to publish them.</p>
            </div>
            <span className="my-forge-feature-card__status my-forge-feature-card__status--available">Open profile →</span>
          </Link>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Forge Library"
        subtitle="A summary of the names, artwork and history stored on this device."
        icon="📚"
        accent="green"
      >
        <div className="my-forge-summary">
          <div>
            <strong>
              {favouriteNameStyles.length}
            </strong>

            <span>
              Favourite name styles
            </span>
          </div>

          <div>
            <strong>
              {favouriteArt.length}
            </strong>

            <span>
              Favourite artwork
            </span>
          </div>

          <div>
            <strong>
              {recentNames.length}
            </strong>

            <span>
              Recent names
            </span>
          </div>

          <div>
            <strong>{totalSaved}</strong>

            <span>
              Total saved items
            </span>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Favourite Name Styles"
        subtitle="Your saved styles from Name Forge."
        icon="✦"
        accent="purple"
      >
        {favouriteNameStyles.length > 0 ? (
          <div className="my-forge-grid">
            {favouriteNameStyles.map(
              (variant) => {
                const preview =
                  variant.build('Kingshot')

                return (
                  <article
                    className="my-forge-card"
                    key={variant.id}
                  >
                    <span className="my-forge-card__category">
                      {variant.group}
                    </span>

                    <h3>{variant.label}</h3>

                    <p>
                      {variant.description}
                    </p>

                    <div className="my-forge-name-preview">
                      {preview}
                    </div>

                    <div className="my-forge-card__actions">
                      <button
                        type="button"
                        className="copy-variant-button"
                        onClick={() =>
                          copyValue(
                            preview,
                            `name-${variant.id}`,
                          )
                        }
                      >
                        {copiedId ===
                        `name-${variant.id}`
                          ? 'Copied!'
                          : 'Copy Example'}
                      </button>

                      <button
                        type="button"
                        className="remove-saved-button"
                        onClick={() =>
                          removeNameFavourite(
                            variant.id,
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span>☆</span>

            <h2>
              No favourite name styles
            </h2>

            <p>
              Use the star buttons in Name
              Forge to save styles.
            </p>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        title="Favourite Artwork"
        subtitle="Your saved banners and chat artwork from Art Forge."
        icon="🎨"
        accent="blue"
      >
        {favouriteArt.length > 0 ? (
          <div className="my-forge-grid">
            {favouriteArt.map(
              (template) => (
                <article
                  className="my-forge-card"
                  key={template.id}
                >
                  <span className="my-forge-card__category">
                    {template.category}
                  </span>

                  <h3>
                    {template.title}
                  </h3>

                  <pre className="my-forge-art-preview">
                    {template.art}
                  </pre>

                  <div className="my-forge-card__actions">
                    <button
                      type="button"
                      className="copy-variant-button"
                      onClick={() =>
                        copyValue(
                          template.art,
                          `art-${template.id}`,
                        )
                      }
                    >
                      {copiedId ===
                      `art-${template.id}`
                        ? 'Copied!'
                        : 'Copy Art'}
                    </button>

                    <button
                      type="button"
                      className="remove-saved-button"
                      onClick={() =>
                        removeArtFavourite(
                          template.id,
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span>🎨</span>

            <h2>
              No favourite artwork
            </h2>

            <p>
              Use the star buttons in Art
              Forge to save designs.
            </p>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        title="Recently Copied Names"
        subtitle="Quickly reuse names you recently copied from Name Forge."
        icon="📋"
        accent="green"
      >
        {recentNames.length > 0 && (
          <div className="my-forge-dashboard-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={removeHistory}
            >
              Clear History
            </button>
          </div>
        )}

        {recentNames.length > 0 ? (
          <div className="recent-names__grid">
            {recentNames.map(
              (recentName) => (
                <article
                  className="recent-name-card"
                  key={recentName.id}
                >
                  <div>
                    <span>
                      {recentName.group}
                    </span>

                    <strong>
                      {recentName.label}
                    </strong>
                  </div>

                  <div className="recent-name-card__result">
                    {recentName.result}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyValue(
                        recentName.result,
                        recentName.id,
                      )
                    }
                  >
                    {copiedId ===
                    recentName.id
                      ? 'Copied!'
                      : 'Copy Again'}
                  </button>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span>📋</span>

            <h2>
              No recently copied names
            </h2>

            <p>
              Names copied from Name Forge
              will appear here.
            </p>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        title="Local Storage"
        subtitle="Information about saved content on this device."
        icon="💾"
        accent="purple"
      >
        <div className="compatibility-disclaimer">
          <strong>
            Stored on this device
          </strong>

          <p>
            Favourite names, artwork and
            copied-name history use your
            browser&apos;s local storage. These
            items will not automatically appear
            on another device or browser.
          </p>
        </div>
      </DashboardCard>

     <AdminHeroSyncPanel />

    </section>
    
  )
}

export default MyForgePage
