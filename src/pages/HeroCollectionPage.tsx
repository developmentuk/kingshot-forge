import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import {
  getHeroCatalogue,
  getPlayerHeroes,
  removePlayerHero,
  savePlayerHero,
} from '../services/heroService'
import HeroCard from '../components/heroes/HeroCard'
import HeroEditorModal from '../components/heroes/HeroEditorModal'
import type {
  Hero,
  HeroEditorValues,
  PlayerHeroWithHero,
} from '../types/hero'
type OwnershipFilter =
  | 'all'
  | 'owned'
  | 'unowned'

type SortOption =
  | 'generation'
  | 'name'
  | 'level'
function HeroCollectionPage() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
  } = useAuth()

  const [selectedHero, setSelectedHero] =
    useState<Hero | null>(null)

  const [
    selectedPlayerHero,
    setSelectedPlayerHero,
  ] =
    useState<PlayerHeroWithHero | undefined>(
      undefined,
    )

  const [savingHero, setSavingHero] =
    useState(false)

  const [
    editorErrorMessage,
    setEditorErrorMessage,
  ] = useState('')

  const {
    playerAccount,
    loadingPlayerAccount,
  } = usePlayerIdentity()

  const [catalogue, setCatalogue] =
    useState<Hero[]>([])

  const [playerHeroes, setPlayerHeroes] =
    useState<PlayerHeroWithHero[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>('all')

  const [troopFilter, setTroopFilter] =
    useState('all')

  const [generationFilter, setGenerationFilter] =
    useState('all')

  const [sortOption, setSortOption] =
    useState<SortOption>('generation')


  function handleSelectHero(
    hero: Hero,
    playerHero?: PlayerHeroWithHero,
  ) {
    setSelectedHero(hero)
    setSelectedPlayerHero(playerHero)
    setEditorErrorMessage('')
  }

  function handleCloseEditor() {
    if (savingHero) {
      return
    }

    setSelectedHero(null)
    setSelectedPlayerHero(undefined)
    setEditorErrorMessage('')
  }

  async function refreshPlayerHeroes() {
    if (!playerAccount) {
      return
    }

    const savedPlayerHeroes =
      await getPlayerHeroes(playerAccount.id)

    setPlayerHeroes(savedPlayerHeroes)
  }

  async function handleSaveHero(
    values: HeroEditorValues,
  ) {
    if (!playerAccount) {
      return
    }

    setSavingHero(true)
    setEditorErrorMessage('')

    try {
      await savePlayerHero(
        playerAccount.id,
        values,
      )

      await refreshPlayerHeroes()

      setSelectedHero(null)
      setSelectedPlayerHero(undefined)
    } catch (error) {
      setEditorErrorMessage(
        error instanceof Error
          ? error.message
          : 'The hero could not be saved.',
      )
    } finally {
      setSavingHero(false)
    }
  }

  async function handleRemoveHero(
    heroId: string,
  ) {
    if (!playerAccount) {
      return
    }

    setSavingHero(true)
    setEditorErrorMessage('')

    try {
      await removePlayerHero(
        playerAccount.id,
        heroId,
      )

      await refreshPlayerHeroes()

      setSelectedHero(null)
      setSelectedPlayerHero(undefined)
    } catch (error) {
      setEditorErrorMessage(
        error instanceof Error
          ? error.message
          : 'The hero could not be removed.',
      )
    } finally {
      setSavingHero(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadCollection() {
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
          savedPlayerHeroes,
        ] = await Promise.all([
          getHeroCatalogue(),
          getPlayerHeroes(
            playerAccount.id,
          ),
        ])

        if (!cancelled) {
          setCatalogue(heroCatalogue)
          setPlayerHeroes(savedPlayerHeroes)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Your Hero Collection could not be loaded.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCollection()

    return () => {
      cancelled = true
    }
  }, [
    authLoading,
    loadingPlayerAccount,
    playerAccount,
    user,
  ])

  const collectionHeroes = useMemo(() => {
    const normalisedSearch =
      searchTerm.trim().toLowerCase()

    const results = catalogue
      .map((hero) => {
        const playerHero =
          playerHeroes.find(
            (savedHero) =>
              savedHero.hero_id === hero.id,
          )

        return {
          hero,
          playerHero,
          isOwned:
            playerHero?.is_owned ?? false,
        }
      })
      .filter((item) => {
        const matchesSearch =
          !normalisedSearch ||
          item.hero.name
            .toLowerCase()
            .includes(normalisedSearch)

        const matchesOwnership =
          ownershipFilter === 'all' ||
          (ownershipFilter === 'owned' &&
            item.isOwned) ||
          (ownershipFilter === 'unowned' &&
            !item.isOwned)

        const matchesTroop =
          troopFilter === 'all' ||
          item.hero.troop_type ===
            troopFilter

        const matchesGeneration =
          generationFilter === 'all' ||
          String(item.hero.generation) ===
            generationFilter

        return (
          matchesSearch &&
          matchesOwnership &&
          matchesTroop &&
          matchesGeneration
        )
      })

    return results.sort(
      (first, second) => {
        if (sortOption === 'name') {
          return first.hero.name.localeCompare(
            second.hero.name,
          )
        }

        if (sortOption === 'level') {
          return (
            (second.playerHero
              ?.hero_level ?? 0) -
            (first.playerHero
              ?.hero_level ?? 0)
          )
        }

        return (
          (first.hero.generation ?? 99) -
            (second.hero.generation ??
              99) ||
          first.hero.name.localeCompare(
            second.hero.name,
          )
        )
      },
    )
  }, [
    catalogue,
    generationFilter,
    ownershipFilter,
    playerHeroes,
    searchTerm,
    sortOption,
    troopFilter,
  ])

  const ownedCount = useMemo(
    () =>
      catalogue.filter((hero) =>
        playerHeroes.some(
          (playerHero) =>
            playerHero.hero_id === hero.id &&
            playerHero.is_owned,
        ),
      ).length,
    [catalogue, playerHeroes],
  )

  const completionPercentage =
    catalogue.length > 0
      ? Math.round(
          (ownedCount / catalogue.length) *
            100,
        )
      : 0

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
      <main className="hero-collection-page">
        <section className="hero-collection-state">
          <span aria-hidden="true">⚔️</span>

          <h1>Loading Hero Collection…</h1>

          <p>
            Retrieving your heroes and their
            current progression.
          </p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="hero-collection-page">
        <section className="hero-collection-state">
          <span aria-hidden="true">🔐</span>

          <h1>Sign in to track your heroes</h1>

          <p>
            Your Hero Collection is connected
            to your Kingshot Forge account.
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
      <main className="hero-collection-page">
        <section className="hero-collection-state">
          <span aria-hidden="true">🔗</span>

          <h1>Link a Kingshot player first</h1>

          <p>
            You need a linked primary player
            before creating a Hero Collection.
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
    <main className="hero-collection-page">
      <section className="hero-collection-heading">
        <div>
          <p className="eyebrow">
            Hero progression
          </p>

          <h1>My Hero Collection</h1>

          <p>
            Track the heroes you own and review
            their current levels and ascension.
          </p>
        </div>

        <Link
          to="/my-forge/heroes"
          className="button button--secondary"
        >
          Edit Hero Showcase
        </Link>
      </section>

      <section className="hero-collection-summary">
        <article>
          <span>Heroes owned</span>

          <strong>
            {ownedCount} / {catalogue.length}
          </strong>
        </article>

        <article>
          <span>Collection complete</span>

          <strong>
            {completionPercentage}%
          </strong>
        </article>

        <article>
          <span>Still to unlock</span>

          <strong>
            {catalogue.length -
              ownedCount}
          </strong>
        </article>
      </section>

      <section className="hero-collection-progress">
        <div
          className="hero-collection-progress__bar"
          role="progressbar"
          aria-label="Hero collection completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={
            completionPercentage
          }
        >
          <span
            style={{
              width: `${completionPercentage}%`,
            }}
          />
        </div>
      </section>

      <section className="hero-collection-filters">
        <div className="field">
          <label htmlFor="collection-search">
            Search heroes
          </label>

          <input
            id="collection-search"
            type="search"
            value={searchTerm}
            placeholder="Search by hero name"
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
          />
        </div>

        <div className="field">
          <label htmlFor="ownership-filter">
            Collection
          </label>

          <select
            id="ownership-filter"
            value={ownershipFilter}
            onChange={(event) =>
              setOwnershipFilter(
                event.target
                  .value as OwnershipFilter,
              )
            }
          >
            <option value="all">
              All heroes
            </option>

            <option value="owned">
              Owned
            </option>

            <option value="unowned">
              Not owned
            </option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="troop-filter">
            Troop type
          </label>

          <select
            id="troop-filter"
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

        <div className="field">
          <label htmlFor="generation-filter">
            Generation
          </label>

          <select
            id="generation-filter"
            value={generationFilter}
            onChange={(event) =>
              setGenerationFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              All generations
            </option>

            {[1, 2, 3, 4, 5, 6].map(
              (generation) => (
                <option
                  key={generation}
                  value={generation}
                >
                  Generation {generation}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="field">
          <label htmlFor="collection-sort">
            Sort by
          </label>

          <select
            id="collection-sort"
            value={sortOption}
            onChange={(event) =>
              setSortOption(
                event.target
                  .value as SortOption,
              )
            }
          >
            <option value="generation">
              Generation
            </option>

            <option value="name">
              Hero name
            </option>

            <option value="level">
              Hero level
            </option>
          </select>
        </div>
      </section>

      {errorMessage && (
        <p className="profile-panel__error">
          {errorMessage}
        </p>
      )}

      <section className="hero-collection-grid">
       {collectionHeroes.map(
  ({
    hero,
    playerHero,
  }) => (
    <HeroCard
      key={hero.id}
      hero={hero}
      playerHero={playerHero}
      onSelect={handleSelectHero}
    />
  ),
)}
      </section>

      {collectionHeroes.length === 0 && (
        <section className="hero-collection-empty">
          <span aria-hidden="true">🔎</span>

          <h2>No heroes found</h2>

          <p>
            Try changing your search or filter
            selections.
          </p>
        </section>
      )}
      {selectedHero && (
  <HeroEditorModal
    hero={selectedHero}
    playerHero={selectedPlayerHero}
    saving={savingHero}
    errorMessage={editorErrorMessage}
    onClose={handleCloseEditor}
    onSave={handleSaveHero}
    onRemove={handleRemoveHero}
  />
)}
    </main>
  )
}

export default HeroCollectionPage