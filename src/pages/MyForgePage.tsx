import { useEffect, useMemo, useState } from 'react'
import { artTemplates } from '../data/artTemplates'
import { nameVariants } from '../data/nameVariants'
import {
  clearRecentNames,
  loadRecentNames,
  RECENT_NAMES_STORAGE_KEY,
  RECENT_NAMES_UPDATED_EVENT,
  type RecentName,
} from '../data/recentNames'

const NAME_FAVOURITES_KEY =
  'kingshot-forge-name-favourites'

const ART_FAVOURITES_KEY =
  'kingshot-forge-art-favourites'

function loadStoredIds(storageKey: string): string[] {
  try {
    const storedValue = window.localStorage.getItem(storageKey)

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (value): value is string => typeof value === 'string',
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
    useState<RecentName[]>(() => loadRecentNames())

  const [copiedId, setCopiedId] =
    useState<string | null>(null)

  useEffect(() => {
    function refreshRecentNames() {
      setRecentNames(loadRecentNames())
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key === RECENT_NAMES_STORAGE_KEY) {
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
        nameFavouriteIds.includes(variant.id),
      ),
    [nameFavouriteIds],
  )

  const favouriteArt = useMemo(
    () =>
      artTemplates.filter((template) =>
        artFavouriteIds.includes(template.id),
      ),
    [artFavouriteIds],
  )

  async function copyValue(
    value: string,
    itemId: string,
  ) {
    try {
      await navigator.clipboard.writeText(value)
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

  function removeNameFavourite(id: string) {
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

  function removeArtFavourite(id: string) {
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
        <p className="eyebrow">My Forge</p>

        <h1 className="page-title">
          Your saved creations
        </h1>

        <p>
          View your favourite name styles, saved artwork and
          recently copied names.
        </p>
      </div>

      <div className="my-forge-summary">
        <div>
          <strong>{favouriteNameStyles.length}</strong>
          <span>Favourite name styles</span>
        </div>

        <div>
          <strong>{favouriteArt.length}</strong>
          <span>Favourite artwork</span>
        </div>

        <div>
          <strong>{recentNames.length}</strong>
          <span>Recent names</span>
        </div>

        <div>
          <strong>{totalSaved}</strong>
          <span>Total saved items</span>
        </div>
      </div>

      <section className="my-forge-section">
        <div className="my-forge-section__heading">
          <div>
            <span className="guided-forge__step">
              Name Forge
            </span>

            <h2>Favourite name styles</h2>
          </div>
        </div>

        {favouriteNameStyles.length > 0 ? (
          <div className="my-forge-grid">
            {favouriteNameStyles.map((variant) => {
              const preview = variant.build('Kingshot')

              return (
                <article
                  className="my-forge-card"
                  key={variant.id}
                >
                  <span className="my-forge-card__category">
                    {variant.group}
                  </span>

                  <h3>{variant.label}</h3>

                  <p>{variant.description}</p>

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
                      {copiedId === `name-${variant.id}`
                        ? 'Copied!'
                        : 'Copy Example'}
                    </button>

                    <button
                      type="button"
                      className="remove-saved-button"
                      onClick={() =>
                        removeNameFavourite(variant.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span>☆</span>
            <h2>No favourite name styles</h2>
            <p>
              Use the star buttons in Name Forge to save styles.
            </p>
          </div>
        )}
      </section>

      <section className="my-forge-section">
        <div className="my-forge-section__heading">
          <div>
            <span className="guided-forge__step">
              Art Forge
            </span>

            <h2>Favourite artwork</h2>
          </div>
        </div>

        {favouriteArt.length > 0 ? (
          <div className="my-forge-grid">
            {favouriteArt.map((template) => (
              <article
                className="my-forge-card"
                key={template.id}
              >
                <span className="my-forge-card__category">
                  {template.category}
                </span>

                <h3>{template.title}</h3>

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
                    {copiedId === `art-${template.id}`
                      ? 'Copied!'
                      : 'Copy Art'}
                  </button>

                  <button
                    type="button"
                    className="remove-saved-button"
                    onClick={() =>
                      removeArtFavourite(template.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>🎨</span>
            <h2>No favourite artwork</h2>
            <p>
              Use the star buttons in Art Forge to save designs.
            </p>
          </div>
        )}
      </section>

      <section className="my-forge-section">
        <div className="my-forge-section__heading">
          <div>
            <span className="guided-forge__step">
              History
            </span>

            <h2>Recently copied names</h2>
          </div>

          {recentNames.length > 0 && (
            <button
              type="button"
              className="button button--secondary"
              onClick={removeHistory}
            >
              Clear History
            </button>
          )}
        </div>

        {recentNames.length > 0 ? (
          <div className="recent-names__grid">
            {recentNames.map((recentName) => (
              <article
                className="recent-name-card"
                key={recentName.id}
              >
                <div>
                  <span>{recentName.group}</span>
                  <strong>{recentName.label}</strong>
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
                  {copiedId === recentName.id
                    ? 'Copied!'
                    : 'Copy Again'}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>📋</span>
            <h2>No recently copied names</h2>
            <p>
              Names copied from Name Forge will appear here.
            </p>
          </div>
        )}
      </section>

      <div className="compatibility-disclaimer">
        <strong>Stored on this device</strong>

        <p>
          My Forge uses your browser’s local storage. Saved items
          will not automatically appear on another device or browser.
        </p>
      </div>
    </section>
  )
}

export default MyForgePage