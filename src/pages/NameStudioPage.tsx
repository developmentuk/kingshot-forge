import { useEffect, useMemo, useState } from 'react'
import {
  nameSuggestionThemes,
  nameSuggestions,
  type NameSuggestionTheme,
} from '../data/nameSuggestions'
import {
  nameVariantGroups,
  nameVariants,
  type NameVariant,
  type NameVariantGroup,
} from '../data/nameVariants'

type ReadabilityPreference =
  | 'Readable'
  | 'Balanced'
  | 'Maximum style'

type LengthPreference =
  | 'Any'
  | 'Short'
  | 'Medium'
  | 'Long'

type DecorationPreference =
  | 'Any'
  | 'Decorated'
  | 'Minimal'

type GeneratedVariant = NameVariant & {
  result: string
  score: number
  readability: number
  characterCount: number
  hasDecoration: boolean
}

const FAVOURITES_STORAGE_KEY =
  'kingshot-forge-name-favourites'

const decorativeCharacters = [
  '༺',
  '༻',
  '༼',
  '༽',
  'ʚ',
  'ɞ',
  '【',
  '】',
  '《',
  '》',
  '『',
  '』',
  '◤',
  '◥',
  '◢',
  '◣',
  '◆',
  '◉',
  '⊙',
  '⊕',
  '╳',
]

const highlyStylisedGroups: NameVariantGroup[] = [
  'Viking',
  'Dark',
  'Warrior',
  'Mystic',
  'Ancient',
]

const readableGroups: NameVariantGroup[] = [
  'Elegant',
  'Minimal',
  'Royal',
  'Cute',
]

function loadFavourites() {
  try {
    const storedValue = window.localStorage.getItem(
      FAVOURITES_STORAGE_KEY,
    )

    if (!storedValue) {
      return [] as string[]
    }

    const parsedValue: unknown = JSON.parse(storedValue)

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

function hasDecoration(value: string) {
  return decorativeCharacters.some((character) =>
    value.includes(character),
  )
}

function calculateReadability(
  variant: NameVariant,
  result: string,
) {
  let score = 3

  if (readableGroups.includes(variant.group)) {
    score += 1
  }

  if (variant.group === 'Minimal') {
    score += 1
  }

  if (highlyStylisedGroups.includes(variant.group)) {
    score -= 1
  }

  if (
    variant.label.toLowerCase().includes('readable')
  ) {
    score += 1
  }

  if (
    variant.label.toLowerCase().includes('full runic')
  ) {
    score -= 1
  }

  if (Array.from(result).length > 20) {
    score -= 1
  }

  return Math.max(1, Math.min(5, score))
}

function matchesLength(
  characterCount: number,
  preference: LengthPreference,
) {
  if (preference === 'Any') {
    return true
  }

  if (preference === 'Short') {
    return characterCount <= 12
  }

  if (preference === 'Medium') {
    return (
      characterCount >= 10 &&
      characterCount <= 18
    )
  }

  return characterCount >= 16
}

function calculateMatchScore(
  variant: NameVariant,
  result: string,
  selectedGroup: NameVariantGroup | 'All',
  readabilityPreference: ReadabilityPreference,
  lengthPreference: LengthPreference,
  decorationPreference: DecorationPreference,
) {
  const readability = calculateReadability(
    variant,
    result,
  )

  const characterCount =
    Array.from(result).length

  const decorated = hasDecoration(result)

  let score = 50

  if (
    selectedGroup === 'All' ||
    variant.group === selectedGroup
  ) {
    score += 20
  }

  if (readabilityPreference === 'Readable') {
    score += readability * 5
  }

  if (readabilityPreference === 'Balanced') {
    score +=
      readability >= 3 &&
      readability <= 4
        ? 20
        : 8
  }

  if (
    readabilityPreference === 'Maximum style'
  ) {
    score += highlyStylisedGroups.includes(
      variant.group,
    )
      ? 22
      : 8
  }

  if (
    matchesLength(
      characterCount,
      lengthPreference,
    )
  ) {
    score += 15
  }

  if (decorationPreference === 'Any') {
    score += 5
  }

  if (
    decorationPreference === 'Decorated' &&
    decorated
  ) {
    score += 12
  }

  if (
    decorationPreference === 'Minimal' &&
    !decorated
  ) {
    score += 12
  }

  return Math.min(100, score)
}

function NameStudioPage() {
  const [name, setName] =
    useState('Patakitty')

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState<
    NameVariantGroup | 'All'
  >('All')

  const [
    readabilityPreference,
    setReadabilityPreference,
  ] =
    useState<ReadabilityPreference>(
      'Balanced',
    )

  const [
    lengthPreference,
    setLengthPreference,
  ] =
    useState<LengthPreference>('Any')

  const [
    decorationPreference,
    setDecorationPreference,
  ] =
    useState<DecorationPreference>('Any')

  const [
    suggestionTheme,
    setSuggestionTheme,
  ] =
    useState<NameSuggestionTheme>('Cat')

  const [
    suggestionSearch,
    setSuggestionSearch,
  ] = useState('')

  const [copiedId, setCopiedId] =
    useState<string | null>(null)

  const [favourites, setFavourites] =
    useState<string[]>(loadFavourites)

  const [
    showFavouritesOnly,
    setShowFavouritesOnly,
  ] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify(favourites),
    )
  }, [favourites])

  const filteredSuggestions = useMemo(() => {
    const search =
      suggestionSearch.trim().toLowerCase()

    return nameSuggestions.filter(
      (suggestion) => {
        const matchesTheme =
          suggestion.theme ===
          suggestionTheme

        const matchesSearch =
          !search ||
          suggestion.name
            .toLowerCase()
            .includes(search) ||
          suggestion.tags.some((tag) =>
            tag.includes(search),
          )

        return (
          matchesTheme &&
          matchesSearch
        )
      },
    )
  }, [
    suggestionTheme,
    suggestionSearch,
  ])

  const generatedVariants =
    useMemo<GeneratedVariant[]>(() => {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return []
      }

      return nameVariants
        .map((variant) => {
          const result =
            variant.build(trimmedName)

          const readability =
            calculateReadability(
              variant,
              result,
            )

          const characterCount =
            Array.from(result).length

          const decorated =
            hasDecoration(result)

          return {
            ...variant,
            result,
            readability,
            characterCount,
            hasDecoration: decorated,
            score: calculateMatchScore(
              variant,
              result,
              selectedGroup,
              readabilityPreference,
              lengthPreference,
              decorationPreference,
            ),
          }
        })
        .filter((variant) => {
          const matchesGroup =
            selectedGroup === 'All' ||
            variant.group ===
              selectedGroup

          const matchesFavourite =
            !showFavouritesOnly ||
            favourites.includes(
              variant.id,
            )

          const matchesDecoration =
            decorationPreference ===
              'Any' ||
            (decorationPreference ===
              'Decorated' &&
              variant.hasDecoration) ||
            (decorationPreference ===
              'Minimal' &&
              !variant.hasDecoration)

          return (
            matchesGroup &&
            matchesFavourite &&
            matchesDecoration
          )
        })
        .sort(
          (first, second) =>
            second.score -
            first.score,
        )
    }, [
      name,
      selectedGroup,
      readabilityPreference,
      lengthPreference,
      decorationPreference,
      favourites,
      showFavouritesOnly,
    ])

  async function copyName(
    result: string,
    variantId: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        result,
      )

      setCopiedId(variantId)

      window.setTimeout(() => {
        setCopiedId(null)
      }, 1500)
    } catch {
      alert(
        'Copy failed. Please select and copy the name manually.',
      )
    }
  }

  function toggleFavourite(
    variantId: string,
  ) {
    setFavourites(
      (currentFavourites) =>
        currentFavourites.includes(
          variantId,
        )
          ? currentFavourites.filter(
              (id) =>
                id !== variantId,
            )
          : [
              ...currentFavourites,
              variantId,
            ],
    )
  }

  function chooseSuggestion(
    suggestionName: string,
  ) {
    setName(suggestionName)

    window.setTimeout(() => {
      document
        .getElementById(
          'forge-results',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 50)
  }

  function randomSuggestion() {
    const themeSuggestions =
      nameSuggestions.filter(
        (suggestion) =>
          suggestion.theme ===
          suggestionTheme,
      )

    if (
      themeSuggestions.length === 0
    ) {
      return
    }

    const randomName =
      themeSuggestions[
        Math.floor(
          Math.random() *
            themeSuggestions.length,
        )
      ]

    chooseSuggestion(
      randomName.name,
    )
  }

  function clearBuilder() {
    setName('')
    setSelectedGroup('All')
    setReadabilityPreference(
      'Balanced',
    )
    setLengthPreference('Any')
    setDecorationPreference('Any')
    setShowFavouritesOnly(false)
    setCopiedId(null)
  }

  function surpriseMe() {
    const randomGroup =
      nameVariantGroups[
        Math.floor(
          Math.random() *
            nameVariantGroups.length,
        )
      ]

    const readabilityOptions: ReadabilityPreference[] =
      [
        'Readable',
        'Balanced',
        'Maximum style',
      ]

    const lengthOptions: LengthPreference[] =
      [
        'Any',
        'Short',
        'Medium',
        'Long',
      ]

    const decorationOptions: DecorationPreference[] =
      [
        'Any',
        'Decorated',
        'Minimal',
      ]

    setSelectedGroup(randomGroup)

    setReadabilityPreference(
      readabilityOptions[
        Math.floor(
          Math.random() *
            readabilityOptions.length,
        )
      ],
    )

    setLengthPreference(
      lengthOptions[
        Math.floor(
          Math.random() *
            lengthOptions.length,
        )
      ],
    )

    setDecorationPreference(
      decorationOptions[
        Math.floor(
          Math.random() *
            decorationOptions.length,
        )
      ],
    )

    setShowFavouritesOnly(false)
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <p className="eyebrow">
          Guided Name Forge
        </p>

        <h1 className="page-title">
          Forge your Kingshot identity
        </h1>

        <p>
          Start with your own name or
          choose a themed suggestion,
          then create ranked,
          emoji-free player-name
          designs.
        </p>
      </div>

      <div className="suggestion-forge">
        <div className="guided-forge__heading">
          <div>
            <span className="guided-forge__step">
              Need inspiration?
            </span>

            <h2>
              Choose a themed base name
            </h2>
          </div>

          <button
            type="button"
            className="button button--secondary"
            onClick={randomSuggestion}
          >
            Random {suggestionTheme}
          </button>
        </div>

        <div className="suggestion-forge__toolbar">
          <div className="field">
            <label htmlFor="suggestion-theme">
              Theme
            </label>

            <select
              id="suggestion-theme"
              value={suggestionTheme}
              onChange={(event) =>
                setSuggestionTheme(
                  event.target
                    .value as NameSuggestionTheme,
                )
              }
            >
              {nameSuggestionThemes.map(
                (theme) => (
                  <option
                    key={theme}
                    value={theme}
                  >
                    {theme}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="suggestion-search">
              Search suggestions
            </label>

            <input
              id="suggestion-search"
              type="search"
              value={suggestionSearch}
              onChange={(event) =>
                setSuggestionSearch(
                  event.target.value,
                )
              }
              placeholder="Search short, dark, female..."
            />
          </div>
        </div>

        <div className="suggestion-grid">
          {filteredSuggestions.map(
            (suggestion) => (
              <button
                key={`${suggestion.theme}-${suggestion.name}`}
                type="button"
                className="suggestion-card"
                onClick={() =>
                  chooseSuggestion(
                    suggestion.name,
                  )
                }
              >
                <span className="suggestion-card__theme">
                  {suggestion.theme}
                </span>

                <strong>
                  {suggestion.name}
                </strong>

                <small>
                  {suggestion.tags.join(
                    ' · ',
                  )}
                </small>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="guided-forge">
        <div className="guided-forge__heading">
          <div>
            <span className="guided-forge__step">
              Step 1
            </span>

            <h2>
              Describe your ideal name
            </h2>
          </div>

          <button
            type="button"
            className="button button--secondary"
            onClick={surpriseMe}
          >
            🎲 Surprise Me
          </button>
        </div>

        <div className="guided-forge__controls">
          <div className="field">
            <label htmlFor="forge-name">
              Base name
            </label>

            <input
              id="forge-name"
              type="text"
              value={name}
              maxLength={30}
              placeholder="Enter your name"
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
            />

            <span className="field__help">
              Emojis are not used in
              Kingshot player-name
              designs.
            </span>
          </div>

          <div className="field">
            <label htmlFor="forge-style">
              Style or mood
            </label>

            <select
              id="forge-style"
              value={selectedGroup}
              onChange={(event) =>
                setSelectedGroup(
                  event.target
                    .value as
                      | NameVariantGroup
                      | 'All',
                )
              }
            >
              <option value="All">
                Show every style
              </option>

              {nameVariantGroups.map(
                (group) => (
                  <option
                    key={group}
                    value={group}
                  >
                    {group}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="forge-readability">
              Readability
            </label>

            <select
              id="forge-readability"
              value={
                readabilityPreference
              }
              onChange={(event) =>
                setReadabilityPreference(
                  event.target
                    .value as ReadabilityPreference,
                )
              }
            >
              <option value="Readable">
                Easy to read
              </option>

              <option value="Balanced">
                Balanced
              </option>

              <option value="Maximum style">
                Maximum style
              </option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="forge-length">
              Preferred length
            </label>

            <select
              id="forge-length"
              value={lengthPreference}
              onChange={(event) =>
                setLengthPreference(
                  event.target
                    .value as LengthPreference,
                )
              }
            >
              <option value="Any">
                Any length
              </option>

              <option value="Short">
                Short
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Long">
                Long
              </option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="forge-decoration">
              Decorations
            </label>

            <select
              id="forge-decoration"
              value={
                decorationPreference
              }
              onChange={(event) =>
                setDecorationPreference(
                  event.target
                    .value as DecorationPreference,
                )
              }
            >
              <option value="Any">
                Any decoration
              </option>

              <option value="Decorated">
                Decorative frames
              </option>

              <option value="Minimal">
                Minimal or no frame
              </option>
            </select>
          </div>
        </div>

        <div className="guided-forge__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              setShowFavouritesOnly(
                (current) => !current,
              )
            }
          >
            {showFavouritesOnly
              ? 'Show All Results'
              : `★ Favourites (${favourites.length})`}
          </button>

          <button
            type="button"
            className="button button--secondary"
            onClick={clearBuilder}
          >
            Reset Forge
          </button>
        </div>
      </div>

      <div
        className="forge-results-heading"
        id="forge-results"
      >
        <div>
          <span className="guided-forge__step">
            Step 2
          </span>

          <h2>
            Choose your forged name
          </h2>
        </div>

        <div className="name-forge-summary">
          <strong>
            {generatedVariants.length}
          </strong>

          <span>
            {generatedVariants.length ===
            1
              ? 'matching design'
              : 'matching designs'}
          </span>
        </div>
      </div>

      {!name.trim() ? (
        <div className="empty-state">
          <span>👑</span>

          <h2>
            Enter or choose a base name
          </h2>

          <p>
            Your tailored Kingshot
            player-name designs will
            appear here.
          </p>
        </div>
      ) : generatedVariants.length ===
        0 ? (
        <div className="empty-state">
          <span>★</span>

          <h2>No matching designs</h2>

          <p>
            Try changing the filters or
            showing all results.
          </p>
        </div>
      ) : (
        <div className="name-variant-grid">
          {generatedVariants.map(
            (variant) => {
              const isFavourite =
                favourites.includes(
                  variant.id,
                )

              const needsLengthCheck =
                variant.characterCount >
                20

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

                      <h2>
                        {variant.label}
                      </h2>
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
                          variant.id,
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
                      {isFavourite
                        ? '★'
                        : '☆'}
                    </button>
                  </div>

                  <p className="name-variant-card__description">
                    {
                      variant.description
                    }
                  </p>

                  <div className="name-variant-result">
                    {variant.result}
                  </div>

                  <div className="variant-rating">
                    <div>
                      <span>Match</span>

                      <strong>
                        {variant.score}%
                      </strong>
                    </div>

                    <div>
                      <span>
                        Readability
                      </span>

                      <strong>
                        {'★'.repeat(
                          variant.readability,
                        )}

                        {'☆'.repeat(
                          5 -
                            variant.readability,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="name-variant-card__footer">
                    <div>
                      <span>
                        {
                          variant.characterCount
                        }{' '}
                        characters
                      </span>

                      {needsLengthCheck && (
                        <span className="name-length-warning">
                          Check game limit
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="copy-variant-button"
                      onClick={() =>
                        copyName(
                          variant.result,
                          variant.id,
                        )
                      }
                    >
                      {copiedId ===
                      variant.id
                        ? 'Copied!'
                        : 'Copy'}
                    </button>
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}

      <div className="compatibility-disclaimer">
        <strong>
          Emoji-free player-name
          designs
        </strong>

        <p>
          Name Forge does not place
          emojis in generated names.
          Results use scripts and
          ornaments tested in Kingshot
          chat, but player-name filters
          may still be stricter.
        </p>
      </div>
    </section>
  )
}

export default NameStudioPage