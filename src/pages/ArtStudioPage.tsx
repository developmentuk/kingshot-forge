import { useEffect, useMemo, useState } from 'react'
import {
  artCategories,
  artTemplates,
  type ArtCategory,
} from '../data/artTemplates'

const FAVOURITES_STORAGE_KEY = 'kingshot-forge-art-favourites'

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

function ArtStudioPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<'All' | ArtCategory>('All')
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredArt = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return artTemplates.filter((template) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        template.category === selectedCategory

      const matchesSearch =
        !search ||
        template.title.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.tags.some((tag) => tag.includes(search))

      const matchesFavourite =
        !showFavouritesOnly ||
        favourites.includes(template.id)

      return matchesCategory && matchesSearch && matchesFavourite
    })
  }, [
    selectedCategory,
    searchTerm,
    showFavouritesOnly,
    favourites,
  ])

  async function copyArt(art: string, id: string) {
    try {
      await navigator.clipboard.writeText(art)
      setCopiedId(id)

      window.setTimeout(() => {
        setCopiedId(null)
      }, 1500)
    } catch {
      alert('Copy failed. Please select and copy the artwork manually.')
    }
  }

  function toggleFavourite(id: string) {
    setFavourites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">Art Forge</p>

        <h1 className="page-title">
          Copy Kingshot-friendly chat art
        </h1>

        <p>
          Browse banners, cats, flags, battle alerts and funny designs
          ready to paste into Kingshot chat.
        </p>
      </div>

      <div className="art-toolbar">
        <div className="field art-search">
          <label htmlFor="art-search">Search artwork</label>

          <input
            id="art-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search cats, KvK, flags, pizza..."
          />
        </div>

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
      </div>

      <div className="category-filter">
        {artCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              selectedCategory === category
                ? 'category-button category-button--active'
                : 'category-button'
            }
            onClick={() => {
              setSelectedCategory(category)
              setShowFavouritesOnly(false)
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="art-summary">
        <strong>{filteredArt.length}</strong>
        <span>
          {filteredArt.length === 1
            ? 'design shown'
            : 'designs shown'}
        </span>
      </div>

      {filteredArt.length > 0 ? (
        <div className="art-grid">
          {filteredArt.map((template) => {
            const isFavourite = favourites.includes(template.id)

            return (
              <article className="art-card" key={template.id}>
                <div className="art-card__heading">
                  <div>
                    <span className="art-card__category">
                      {template.category}
                    </span>

                    <h2>{template.title}</h2>
                  </div>

                  <button
                    type="button"
                    className={
                      isFavourite
                        ? 'favourite-button favourite-button--active'
                        : 'favourite-button'
                    }
                    onClick={() =>
                      toggleFavourite(template.id)
                    }
                    aria-label={
                      isFavourite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                    }
                  >
                    {isFavourite ? '★' : '☆'}
                  </button>
                </div>

                <p className="art-card__description">
                  {template.description}
                </p>

                <pre
                  className={
                    template.compact
                      ? 'art-preview art-preview--compact'
                      : 'art-preview'
                  }
                >
                  {template.art}
                </pre>

                <div className="art-card__footer">
                  <span>
                    {Array.from(template.art).length} characters
                  </span>

                  <button
                    type="button"
                    className="copy-variant-button"
                    onClick={() =>
                      copyArt(template.art, template.id)
                    }
                  >
                    {copiedId === template.id
                      ? 'Copied!'
                      : 'Copy Art'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span>🎨</span>
          <h2>No matching artwork</h2>
          <p>
            Try a different search term, category or favourite filter.
          </p>
        </div>
      )}

      <div className="compatibility-disclaimer">
        <strong>Chat artwork only</strong>

        <p>
          These designs are intended for Kingshot chat. Emoji and
          multi-line artwork cannot be used as player names.
        </p>
      </div>
    </section>
  )
}

export default ArtStudioPage