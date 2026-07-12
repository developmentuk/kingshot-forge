import { useEffect, useMemo, useState } from 'react'
import {
  nameVariantGroups,
  nameVariants,
  type NameVariantGroup,
} from '../data/nameVariants'

const FAVOURITES_STORAGE_KEY = 'kingshot-forge-name-favourites'

function loadFavourites() {
  try {
    const storedValue = window.localStorage.getItem(
      FAVOURITES_STORAGE_KEY,
    )

    if (!storedValue) {
      return [] as string[]
    }

    const parsedValue = JSON.parse(storedValue)

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (value): value is string => typeof value === 'string',
        )
      : []
  } catch {
    return []
  }
}

function NameStudioPage() {
  const [name, setName] = useState('Patakitty')
  const [selectedGroup, setSelectedGroup] =
    useState<NameVariantGroup | 'All'>('All')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [favourites, setFavourites] =
    useState<string[]>(loadFavourites)
  const [showFavouritesOnly, setShowFavouritesOnly] =
    useState(false)

  useEffect(() => {
    window.localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify(favourites),
    )
  }, [favourites])

  const generatedVariants = useMemo(() => {
    return nameVariants
      .map((variant) => ({
        ...variant,
        result: variant.build(name.trim()),
      }))
      .filter((variant) => {
        const matchesGroup =
          selectedGroup === 'All' ||
          variant.group === selectedGroup

        const matchesFavourites =
          !showFavouritesOnly ||
          favourites.includes(variant.id)

        return matchesGroup && matchesFavourites
      })
  }, [
    name,
    selectedGroup,
    showFavouritesOnly,
    favourites,
  ])

  async function copyName(result: string, variantId: string) {
    try {
      await navigator.clipboard.writeText(result)
      setCopiedId(variantId)

      window.setTimeout(() => {
        setCopiedId(null)
      }, 1500)
    } catch {
      alert('Copy failed. Please select and copy the name manually.')
    }
  }

  function toggleFavourite(variantId: string) {
    setFavourites((currentFavourites) =>
      currentFavourites.includes(variantId)
        ? currentFavourites.filter((id) => id !== variantId)
        : [...currentFavourites, variantId],
    )
  }

  function clearName() {
    setName('')
    setCopiedId(null)
  }

  function randomiseGroup() {
    const randomGroup =
      nameVariantGroups[
        Math.floor(Math.random() * nameVariantGroups.length)
      ]

    setSelectedGroup(randomGroup)
    setShowFavouritesOnly(false)
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Name Forge v2</p>

        <h1 className="page-title">
          Forge dozens of Kingshot names
        </h1>

        <p>
          Enter one name and instantly generate multiple fantasy,
          Viking, royal, cute and battle-themed versions.
        </p>
      </div>

      <div className="name-forge-toolbar">
        <div className="field name-forge-input">
          <label htmlFor="forge-name">Your name</label>

          <input
            id="forge-name"
            type="text"
            value={name}
            maxLength={30}
            placeholder="Enter a name"
            onChange={(event) => setName(event.target.value)}
          />

          <span className="field__help">
            Ordinary letters, numbers and spaces are accepted.
          </span>
        </div>

        <div className="name-forge-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={randomiseGroup}
          >
            🎲 Random Style
          </button>

          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              setShowFavouritesOnly((current) => !current)
            }
          >
            {showFavouritesOnly
              ? 'Show All'
              : `★ Favourites (${favourites.length})`}
          </button>

          <button
            type="button"
            className="button button--secondary"
            onClick={clearName}
          >
            Clear
          </button>
        </div>
      </div>

      <div
        className="category-filter"
        aria-label="Name style categories"
      >
        <button
          type="button"
          className={
            selectedGroup === 'All'
              ? 'category-button category-button--active'
              : 'category-button'
          }
          onClick={() => setSelectedGroup('All')}
        >
          All Styles
        </button>

        {nameVariantGroups.map((group) => (
          <button
            key={group}
            type="button"
            className={
              selectedGroup === group
                ? 'category-button category-button--active'
                : 'category-button'
            }
            onClick={() => {
              setSelectedGroup(group)
              setShowFavouritesOnly(false)
            }}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="name-forge-summary">
        <strong>{generatedVariants.length}</strong>

        <span>
          {generatedVariants.length === 1
            ? 'design shown'
            : 'designs shown'}
        </span>

        {selectedGroup !== 'All' && (
          <span>in {selectedGroup}</span>
        )}
      </div>

      {!name.trim() ? (
        <div className="empty-state">
          <span>👑</span>
          <h2>Enter a name to begin</h2>
          <p>
            Your generated Kingshot names will appear here.
          </p>
        </div>
      ) : generatedVariants.length === 0 ? (
        <div className="empty-state">
          <span>★</span>
          <h2>No favourite designs yet</h2>
          <p>
            Select Show All, then use the star button to save designs.
          </p>
        </div>
      ) : (
        <div className="name-variant-grid">
          {generatedVariants.map((variant) => {
            const isFavourite = favourites.includes(variant.id)
            const isLong = Array.from(variant.result).length > 20

            return (
              <article
                className="name-variant-card"
                key={variant.id}
              >
                <div className="name-variant-card__heading">
                  <div>
                    <span className="name-variant-card__group">
                      {variant.group}
                    </span>

                    <h2>{variant.label}</h2>
                  </div>

                  <button
                    type="button"
                    className={
                      isFavourite
                        ? 'favourite-button favourite-button--active'
                        : 'favourite-button'
                    }
                    onClick={() =>
                      toggleFavourite(variant.id)
                    }
                    aria-label={
                      isFavourite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                    }
                    title={
                      isFavourite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                    }
                  >
                    {isFavourite ? '★' : '☆'}
                  </button>
                </div>

                <p className="name-variant-card__description">
                  {variant.description}
                </p>

                <div className="name-variant-result">
                  {variant.result}
                </div>

                <div className="name-variant-card__footer">
                  <div>
                    <span>
                      {Array.from(variant.result).length} characters
                    </span>

                    {isLong && (
                      <span className="name-length-warning">
                        Check length
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="copy-variant-button"
                    onClick={() =>
                      copyName(variant.result, variant.id)
                    }
                  >
                    {copiedId === variant.id
                      ? 'Copied!'
                      : 'Copy'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="compatibility-disclaimer">
        <strong>Test before changing your in-game name</strong>

        <p>
          These designs use character families that rendered during our
          Kingshot chat testing. Player-name limits and filters can be
          stricter.
        </p>
      </div>
    </section>
  )
}

export default NameStudioPage