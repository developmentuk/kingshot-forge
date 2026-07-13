import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  artCategories,
  artTemplates,
  type ArtCategory,
  type ArtTemplate,
} from '../data/artTemplates'

const FAVOURITES_STORAGE_KEY =
  'kingshot-forge-art-favourites'

type SortOption =
  | 'Newest'
  | 'Title'
  | 'Category'

function loadFavourites(): string[] {
  try {
    const storedValue = window.localStorage.getItem(
      FAVOURITES_STORAGE_KEY,
    )

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

function getPreviewText(art: string) {
  const lines = art.split('\n')
  const visibleLines = lines.slice(0, 8)

  if (lines.length > 8) {
    visibleLines.push('…')
  }

  return visibleLines.join('\n')
}

function ArtStudioPage() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<'All' | ArtCategory>('All')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [sortOption, setSortOption] =
    useState<SortOption>('Newest')

  const [copiedId, setCopiedId] =
    useState<string | null>(null)

  const [favourites, setFavourites] =
    useState<string[]>(loadFavourites)

  const [
    showFavouritesOnly,
    setShowFavouritesOnly,
  ] = useState(false)

  const [selectedArt, setSelectedArt] =
    useState<ArtTemplate | null>(null)

  useEffect(() => {
    window.localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify(favourites),
    )
  }, [favourites])

  useEffect(() => {
    if (!selectedArt) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        setSelectedArt(null)
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [selectedArt])

  const filteredArt = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase()

    const matchingArt =
      artTemplates.filter((template) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          template.category ===
            selectedCategory

        const matchesSearch =
          !search ||
          template.title
            .toLowerCase()
            .includes(search) ||
          template.description
            .toLowerCase()
            .includes(search) ||
          template.category
            .toLowerCase()
            .includes(search) ||
          template.tags.some((tag) =>
            tag
              .toLowerCase()
              .includes(search),
          )

        const matchesFavourite =
          !showFavouritesOnly ||
          favourites.includes(template.id)

        const isVisible =
          template.status !== 'Archived'

        return (
          matchesCategory &&
          matchesSearch &&
          matchesFavourite &&
          isVisible
        )
      })

    return [...matchingArt].sort(
      (first, second) => {
        if (sortOption === 'Title') {
          return first.title.localeCompare(
            second.title,
          )
        }

        if (sortOption === 'Category') {
          return (
            first.category.localeCompare(
              second.category,
            ) ||
            first.title.localeCompare(
              second.title,
            )
          )
        }

        return (
          new Date(second.addedAt).getTime() -
          new Date(first.addedAt).getTime()
        )
      },
    )
  }, [
    selectedCategory,
    searchTerm,
    sortOption,
    showFavouritesOnly,
    favourites,
  ])

  async function copyArt(
    art: string,
    id: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        art,
      )

      setCopiedId(id)

      window.setTimeout(() => {
        setCopiedId(null)
      }, 1500)
    } catch {
      alert(
        'Copy failed. Please select and copy the artwork manually.',
      )
    }
  }

  function toggleFavourite(id: string) {
    setFavourites((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id,
          )
        : [...current, id],
    )
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedCategory('All')
    setShowFavouritesOnly(false)
    setSortOption('Newest')
  }

  return (
    <section className="section page-section art-forge-page">
      <div className="section-heading art-forge-heading">
        <p className="eyebrow">
          Art Forge
        </p>

        <h1 className="page-title">
          Copy Kingshot-friendly chat art
        </h1>

        <p>
          Browse community artwork,
          banners, cats, flags and battle
          alerts ready to paste into
          Kingshot chat.
        </p>
      </div>

      <div className="art-library-toolbar">
        <div className="field art-library-search">
          <label htmlFor="art-search">
            Search artwork
          </label>

          <input
            id="art-search"
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="Search cats, KvK, flags..."
          />
        </div>

        <div className="field art-library-sort">
          <label htmlFor="art-sort">
            Sort
          </label>

          <select
            id="art-sort"
            value={sortOption}
            onChange={(event) =>
              setSortOption(
                event.target
                  .value as SortOption,
              )
            }
          >
            <option value="Newest">
              Newest first
            </option>

            <option value="Title">
              Title A–Z
            </option>

            <option value="Category">
              Category
            </option>
          </select>
        </div>

        <button
          type="button"
          className={
            showFavouritesOnly
              ? 'button button--primary art-favourites-filter'
              : 'button button--secondary art-favourites-filter'
          }
          onClick={() =>
            setShowFavouritesOnly(
              (current) => !current,
            )
          }
        >
          ★ Favourites ({favourites.length})
        </button>
      </div>

      <div
        className="art-category-scroller"
        aria-label="Artwork categories"
      >
        {artCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              selectedCategory === category
                ? 'category-button category-button--active'
                : 'category-button'
            }
            onClick={() =>
              setSelectedCategory(category)
            }
          >
            {category}
          </button>
        ))}
      </div>

      <div className="art-results-bar">
        <div>
          <strong>{filteredArt.length}</strong>

          <span>
            {filteredArt.length === 1
              ? 'design'
              : 'designs'}
          </span>
        </div>

        {(searchTerm ||
          selectedCategory !== 'All' ||
          showFavouritesOnly) && (
          <button
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredArt.length > 0 ? (
        <div className="art-library-grid">
          {filteredArt.map((template) => {
            const isFavourite =
              favourites.includes(
                template.id,
              )

            const previewText =
              getPreviewText(template.art)

            return (
              <article
                className="art-library-card"
                key={template.id}
              >
                <div className="art-library-card__heading">
                  <div>
                    <span className="art-library-card__category">
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
                      toggleFavourite(
                        template.id,
                      )
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

                <p className="art-library-card__description">
                  {template.description}
                </p>

                <button
                  type="button"
                  className="art-card-preview-button"
                  onClick={() =>
                    setSelectedArt(template)
                  }
                  aria-label={`Preview ${template.title}`}
                >
                  <pre>
                    {previewText}
                  </pre>

                  <span>
                    Tap to view full artwork
                  </span>
                </button>

                <div className="art-library-card__metadata">
                  <span>{template.size}</span>

                  <span>
                    {Array.from(
                      template.art,
                    ).length}{' '}
                    characters
                  </span>

                  <span
                    className={
                      template.testedInKingshot
                        ? 'art-status art-status--tested'
                        : 'art-status art-status--testing'
                    }
                  >
                    {template.testedInKingshot
                      ? 'Tested'
                      : 'Needs testing'}
                  </span>
                </div>

                <div className="art-library-card__actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() =>
                      setSelectedArt(template)
                    }
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() =>
                      copyArt(
                        template.art,
                        template.id,
                      )
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
            Try another search term or
            clear the active filters.
          </p>

          <button
            type="button"
            className="button button--secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="compatibility-disclaimer">
        <strong>
          Test community submissions
        </strong>

        <p>
          Artwork marked “Needs testing”
          has been submitted by the
          community but has not yet been
          confirmed inside Kingshot.
        </p>
      </div>

      {selectedArt && (
        <div
          className="art-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="art-preview-title"
        >
          <button
            type="button"
            className="art-preview-modal__backdrop"
            onClick={() =>
              setSelectedArt(null)
            }
            aria-label="Close preview"
          />

          <div className="art-preview-modal__panel">
            <div className="art-preview-modal__header">
              <div>
                <span className="art-library-card__category">
                  {selectedArt.category}
                </span>

                <h2 id="art-preview-title">
                  {selectedArt.title}
                </h2>
              </div>

              <button
                type="button"
                className="art-preview-modal__close"
                onClick={() =>
                  setSelectedArt(null)
                }
                aria-label="Close artwork preview"
              >
                ×
              </button>
            </div>

            <div className="art-preview-modal__content">
              <pre>{selectedArt.art}</pre>
            </div>

            <div className="art-preview-modal__details">
              <span>
                {selectedArt.size}
              </span>

              <span>
                {Array.from(
                  selectedArt.art,
                ).length}{' '}
                characters
              </span>

              <span>
                {selectedArt.source}
              </span>
            </div>

            <div className="art-preview-modal__actions">
              <button
                type="button"
                className={
                  favourites.includes(
                    selectedArt.id,
                  )
                    ? 'button button--secondary art-modal-favourite art-modal-favourite--active'
                    : 'button button--secondary art-modal-favourite'
                }
                onClick={() =>
                  toggleFavourite(
                    selectedArt.id,
                  )
                }
              >
                {favourites.includes(
                  selectedArt.id,
                )
                  ? '★ Saved'
                  : '☆ Favourite'}
              </button>

              <button
                type="button"
                className="button button--primary"
                onClick={() =>
                  copyArt(
                    selectedArt.art,
                    selectedArt.id,
                  )
                }
              >
                {copiedId === selectedArt.id
                  ? 'Copied!'
                  : 'Copy Artwork'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ArtStudioPage