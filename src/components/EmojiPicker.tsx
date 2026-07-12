import { useMemo, useState } from 'react'
import {
  emojiCategories,
  verifiedEmojis,
} from '../data/emojis'

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
}

function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState('Kingshot')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  const filteredCategories = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return emojiCategories.filter(
        (category) => category.name === selectedCategory,
      )
    }

    return emojiCategories
      .map((category) => ({
        ...category,
        emojis: category.emojis.filter((emoji) =>
          emoji.includes(searchTerm),
        ),
      }))
      .filter((category) => category.emojis.length > 0)
  }, [searchTerm, selectedCategory])

  function selectEmoji(emoji: string) {
    onSelect(emoji)

    setRecentEmojis((current) => [
      emoji,
      ...current.filter((item) => item !== emoji),
    ].slice(0, 12))
  }

  return (
    <div className="emoji-picker-wrapper">
      <button
        type="button"
        className="button button--secondary emoji-trigger"
        onClick={() => setIsOpen(true)}
      >
        😀 Add emoji
      </button>

      {isOpen && (
        <div
          className="emoji-modal-backdrop"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            className="emoji-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Choose an emoji"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="emoji-modal__header">
              <div>
                <h2>Add an emoji</h2>
                <p>
                  ✓ means the emoji has been tested in Kingshot.
                </p>
              </div>

              <button
                type="button"
                className="emoji-modal__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close emoji picker"
              >
                ×
              </button>
            </div>

            <input
              className="emoji-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search emojis"
            />

            {!searchTerm && recentEmojis.length > 0 && (
              <section className="emoji-section">
                <h3>Recently used</h3>

                <div className="emoji-modal__grid">
                  {recentEmojis.map((emoji) => (
                    <EmojiButton
                      key={`recent-${emoji}`}
                      emoji={emoji}
                      onSelect={selectEmoji}
                    />
                  ))}
                </div>
              </section>
            )}

            {!searchTerm && (
              <div className="emoji-categories">
                {emojiCategories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    className={
                      selectedCategory === category.name
                        ? 'emoji-category emoji-category--active'
                        : 'emoji-category'
                    }
                    onClick={() =>
                      setSelectedCategory(category.name)
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            <div className="emoji-results">
              {filteredCategories.map((category) => (
                <section
                  className="emoji-section"
                  key={category.name}
                >
                  {searchTerm && <h3>{category.name}</h3>}

                  <div className="emoji-modal__grid">
                    {category.emojis.map((emoji) => (
                      <EmojiButton
                        key={`${category.name}-${emoji}`}
                        emoji={emoji}
                        onSelect={selectEmoji}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type EmojiButtonProps = {
  emoji: string
  onSelect: (emoji: string) => void
}

function EmojiButton({
  emoji,
  onSelect,
}: EmojiButtonProps) {
  const isVerified = verifiedEmojis.has(emoji)

  return (
    <button
      type="button"
      className="emoji-modal__button"
      onClick={() => onSelect(emoji)}
      title={
        isVerified
          ? `${emoji} — tested in Kingshot`
          : `${emoji} — standard emoji`
      }
    >
      <span>{emoji}</span>

      {isVerified && (
        <small aria-label="Tested in Kingshot">✓</small>
      )}
    </button>
  )
}

export default EmojiPicker