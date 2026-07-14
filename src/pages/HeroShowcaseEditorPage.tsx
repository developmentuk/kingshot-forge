import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import {
  clearHeroShowcase,
  getHeroCatalogue,
  getPlayerHeroes,
  savePlayerHero,
} from '../services/heroService'
import type {
  Hero,
  PlayerHeroWithHero,
} from '../types/hero'

const MAX_SHOWCASE_HEROES = 6

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

export default function HeroShowcaseEditorPage() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth()

  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const [catalogue, setCatalogue] =
    useState<Hero[]>([])

  const [playerHeroes, setPlayerHeroes] =
    useState<PlayerHeroWithHero[]>([])

  const [selectedHeroIds, setSelectedHeroIds] =
    useState<string[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [troopFilter, setTroopFilter] =
    useState('all')

  useEffect(() => {
    let cancelled = false

    async function loadEditor() {
      if (
        authLoading ||
        loadingPlayerAccount
      ) {
        return
      }

      if (!user || !playerAccount) {
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const [
          heroCatalogue,
          ownedHeroes,
        ] = await Promise.all([
          getHeroCatalogue(),
          getPlayerHeroes(
            playerAccount.id,
          ),
        ])

        const currentShowcase =
          ownedHeroes
            .filter(
              (playerHero) =>
                playerHero.is_showcase,
            )
            .sort(
              (first, second) =>
                (first.display_order ?? 99) -
                (second.display_order ?? 99),
            )
            .map(
              (playerHero) =>
                playerHero.hero_id,
            )

        if (!cancelled) {
          setCatalogue(heroCatalogue)
          setPlayerHeroes(ownedHeroes)
          setSelectedHeroIds(
            currentShowcase,
          )
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'The Hero Showcase could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadEditor()

    return () => {
      cancelled = true
    }
  }, [
    authLoading,
    loadingPlayerAccount,
    playerAccount,
    user,
  ])

  const filteredHeroes = useMemo(() => {
    const normalisedSearch =
      searchTerm.trim().toLowerCase()

    return catalogue.filter((hero) => {
      const matchesSearch =
        !normalisedSearch ||
        hero.name
          .toLowerCase()
          .includes(normalisedSearch)

      const matchesTroop =
        troopFilter === 'all' ||
        hero.troop_type === troopFilter

      return matchesSearch && matchesTroop
    })
  }, [
    catalogue,
    searchTerm,
    troopFilter,
  ])

  const selectedHeroes = useMemo(
    () =>
      selectedHeroIds
        .map((heroId) =>
          catalogue.find(
            (hero) => hero.id === heroId,
          ),
        )
        .filter(
          (hero): hero is Hero =>
            hero !== undefined,
        ),
    [catalogue, selectedHeroIds],
  )

  function toggleHero(heroId: string) {
    setMessage('')
    setErrorMessage('')

    setSelectedHeroIds((current) => {
      if (current.includes(heroId)) {
        return current.filter(
          (id) => id !== heroId,
        )
      }

      if (
        current.length >=
        MAX_SHOWCASE_HEROES
      ) {
        setErrorMessage(
          'You can showcase a maximum of six heroes.',
        )

        return current
      }

      return [...current, heroId]
    })
  }

  function moveHero(
    heroId: string,
    direction: 'up' | 'down',
  ) {
    setSelectedHeroIds((current) => {
      const currentIndex =
        current.indexOf(heroId)

      if (currentIndex === -1) {
        return current
      }

      const targetIndex =
        direction === 'up'
          ? currentIndex - 1
          : currentIndex + 1

      if (
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current
      }

      const updated = [...current]

      ;[
        updated[currentIndex],
        updated[targetIndex],
      ] = [
        updated[targetIndex],
        updated[currentIndex],
      ]

      return updated
    })
  }

  async function handleSave() {
    if (!playerAccount) {
      return
    }

    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      await clearHeroShowcase(
        playerAccount.id,
      )

      for (
        let index = 0;
        index < selectedHeroIds.length;
        index += 1
      ) {
        const heroId =
          selectedHeroIds[index]

        const existingPlayerHero =
          playerHeroes.find(
            (playerHero) =>
              playerHero.hero_id === heroId,
          )

        await savePlayerHero(
          playerAccount.id,
          {
            heroId,

            heroLevel:
              existingPlayerHero?.hero_level ??
              null,

            starLevel:
              existingPlayerHero?.star_level ??
              null,

            awakeningLevel:
              existingPlayerHero
                ?.awakening_level ?? null,

            heroPower:
              existingPlayerHero?.hero_power ??
              null,
skill1Level: null,
skill2Level: null,
skill3Level: null,
skill4Level: null,
exclusiveGearLevel: null,
widgetLevel: null,
            isOwned: true,
            isShowcase: true,
            displayOrder: index + 1,

            notes:
              existingPlayerHero?.notes ??
              '',
          },
        )
      }

      const refreshedHeroes =
        await getPlayerHeroes(
          playerAccount.id,
        )

      setPlayerHeroes(refreshedHeroes)

      setMessage(
        'Hero Showcase saved.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The Hero Showcase could not be saved.',
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

  if (
    authLoading ||
    loadingPlayerAccount ||
    loading
  ) {
    return (
      <main className="hero-editor-page">
        <section className="hero-editor-state">
          <span>⭐</span>
          <h1>Loading Hero Showcase…</h1>
          <p>
            Retrieving the hero catalogue and
            your current selections.
          </p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="hero-editor-page">
        <section className="hero-editor-state">
          <span>🔐</span>
          <h1>Sign in to select heroes</h1>

          <p>
            Your Hero Showcase is connected to
            your Kingshot Forge account.
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

  if (!playerAccount) {
    return (
      <main className="hero-editor-page">
        <section className="hero-editor-state">
          <span>🔗</span>
          <h1>Link a Kingshot player first</h1>

          <p>
            You need a linked primary player
            account before creating a Hero
            Showcase.
          </p>

          <Link
            to="/my-forge"
            className="button button--primary"
          >
            Open My Forge
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="hero-editor-page">
      <div className="hero-editor-heading">
        <div>
          <p className="eyebrow">
            My Forge
          </p>

          <h1>Hero Showcase</h1>

          <p>
            Choose up to six heroes and arrange
            the order in which they appear on
            your public profile.
          </p>
        </div>

        <Link
          to="/my-forge"
          className="button button--secondary"
        >
          Back to My Forge
        </Link>
      </div>

      <div className="hero-editor-layout">
        <section className="hero-editor-library">
          <div className="hero-editor-library__heading">
            <div>
              <p className="eyebrow">
                Hero library
              </p>

              <h2>Select heroes</h2>
            </div>

            <span>
              {selectedHeroIds.length}/
              {MAX_SHOWCASE_HEROES} selected
            </span>
          </div>

          <div className="hero-editor-filters">
            <div className="field">
              <label htmlFor="hero-search">
                Search heroes
              </label>

              <input
                id="hero-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search by hero name"
              />
            </div>

            <div className="field">
              <label htmlFor="hero-troop-filter">
                Troop type
              </label>

              <select
                id="hero-troop-filter"
                value={troopFilter}
                onChange={(event) =>
                  setTroopFilter(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  All troop types
                </option>
                <option value="infantry">
                  Infantry
                </option>
                <option value="cavalry">
                  Cavalry
                </option>
                <option value="archer">
                  Archer
                </option>
              </select>
            </div>
          </div>

          <div className="hero-editor-grid">
            {filteredHeroes.map((hero) => {
              const isSelected =
                selectedHeroIds.includes(
                  hero.id,
                )

              return (
                <button
                  type="button"
                  key={hero.id}
                  className={
                    isSelected
                      ? `hero-editor-card hero-editor-card--selected hero-editor-card--${hero.rarity}`
                      : `hero-editor-card hero-editor-card--${hero.rarity}`
                  }
                  aria-pressed={isSelected}
                  onClick={() =>
                    toggleHero(hero.id)
                  }
                >
                  <div className="hero-editor-card__portrait">
                    {hero.portrait_url ? (
                      <img
                        src={hero.portrait_url}
                        alt=""
                      />
                    ) : (
                      <span>
                        {hero.name
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                    {isSelected && (
                      <strong>✓</strong>
                    )}
                  </div>

                  <div className="hero-editor-card__content">
                    <span>
                      {hero.generation
                        ? `Generation ${hero.generation}`
                        : 'Permanent hero'}
                    </span>

                    <h3>{hero.name}</h3>

                    <small>
                      {formatLabel(
                        hero.troop_type,
                      )}
                      {' · '}
                      {formatLabel(
                        hero.rarity,
                      )}
                    </small>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="hero-editor-showcase">
          <div className="hero-editor-showcase__sticky">
            <div className="hero-editor-showcase__heading">
              <div>
                <p className="eyebrow">
                  Public profile
                </p>

                <h2>Showcase order</h2>
              </div>

              <strong>
                {selectedHeroIds.length}/6
              </strong>
            </div>

            {selectedHeroes.length > 0 ? (
              <div className="hero-editor-selected-list">
                {selectedHeroes.map(
                  (hero, index) => (
                    <article
                      className="hero-editor-selected-card"
                      key={hero.id}
                    >
                      <span className="hero-editor-selected-card__position">
                        {index + 1}
                      </span>

                      <div className="hero-editor-selected-card__avatar">
                        {hero.portrait_url ? (
                          <img
                            src={
                              hero.portrait_url
                            }
                            alt=""
                          />
                        ) : (
                          <span>
                            {hero.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="hero-editor-selected-card__details">
                        <strong>
                          {hero.name}
                        </strong>

                        <small>
                          {formatLabel(
                            hero.troop_type,
                          )}
                        </small>
                      </div>

                      <div className="hero-editor-selected-card__actions">
                        <button
                          type="button"
                          disabled={index === 0}
                          aria-label={`Move ${hero.name} up`}
                          onClick={() =>
                            moveHero(
                              hero.id,
                              'up',
                            )
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            selectedHeroes.length -
                              1
                          }
                          aria-label={`Move ${hero.name} down`}
                          onClick={() =>
                            moveHero(
                              hero.id,
                              'down',
                            )
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          aria-label={`Remove ${hero.name}`}
                          onClick={() =>
                            toggleHero(hero.id)
                          }
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="hero-editor-empty">
                <span>⭐</span>
                <h3>No heroes selected</h3>

                <p>
                  Select heroes from the library
                  to build your public showcase.
                </p>
              </div>
            )}

            <button
              type="button"
              className="button button--primary hero-editor-save"
              disabled={saving}
              onClick={() =>
                void handleSave()
              }
            >
              {saving
                ? 'Saving showcase…'
                : 'Save Hero Showcase'}
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
        </aside>
      </div>
    </main>
  )
}