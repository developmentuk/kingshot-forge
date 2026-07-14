import {
  useEffect,
  useState,
} from 'react'
import type {
  Hero,
  HeroEditorValues,
  PlayerHeroWithHero,
} from '../../types/hero'

type HeroEditorModalProps = {
  hero: Hero
  playerHero?: PlayerHeroWithHero
  saving: boolean
  errorMessage: string
  onClose: () => void
  onSave: (
    values: HeroEditorValues,
  ) => Promise<void>
  onRemove: (
    heroId: string,
  ) => Promise<void>
}

function toNullableNumber(
  value: string,
): number | null {
  if (value.trim() === '') {
    return null
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null
}

function HeroEditorModal({
  hero,
  playerHero,
  saving,
  errorMessage,
  onClose,
  onSave,
  onRemove,
}: HeroEditorModalProps) {
  const [heroLevel, setHeroLevel] =
    useState('')

  const [starLevel, setStarLevel] =
    useState('')

  const [heroPower, setHeroPower] =
    useState('')

  const [skill1Level, setSkill1Level] =
    useState('')

  const [skill2Level, setSkill2Level] =
    useState('')

  const [skill3Level, setSkill3Level] =
    useState('')

  const [skill4Level, setSkill4Level] =
    useState('')

  const [
    exclusiveGearLevel,
    setExclusiveGearLevel,
  ] = useState('')

  const [widgetLevel, setWidgetLevel] =
    useState('')

  const [isOwned, setIsOwned] =
    useState(true)

  const [isShowcase, setIsShowcase] =
    useState(false)

  const [displayOrder, setDisplayOrder] =
    useState('')

  const [notes, setNotes] =
    useState('')

  useEffect(() => {
    setHeroLevel(
      playerHero?.hero_level?.toString() ??
        '',
    )

    setStarLevel(
      playerHero?.star_level?.toString() ??
        '',
    )

    setHeroPower(
      playerHero?.hero_power?.toString() ??
        '',
    )

    setSkill1Level(
      playerHero?.skill_1_level?.toString() ??
        '',
    )

    setSkill2Level(
      playerHero?.skill_2_level?.toString() ??
        '',
    )

    setSkill3Level(
      playerHero?.skill_3_level?.toString() ??
        '',
    )

    setSkill4Level(
      playerHero?.skill_4_level?.toString() ??
        '',
    )

    setExclusiveGearLevel(
      playerHero?.exclusive_gear_level
        ?.toString() ?? '',
    )

    setWidgetLevel(
      playerHero?.widget_level?.toString() ??
        '',
    )

    setIsOwned(
      playerHero?.is_owned ?? true,
    )

    setIsShowcase(
      playerHero?.is_showcase ?? false,
    )

    setDisplayOrder(
      playerHero?.display_order?.toString() ??
        '',
    )

    setNotes(playerHero?.notes ?? '')
  }, [hero, playerHero])

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape' &&
        !saving
      ) {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [onClose, saving])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    await onSave({
      heroId: hero.id,
      heroLevel:
        toNullableNumber(heroLevel),
      starLevel:
        toNullableNumber(starLevel),
      heroPower:
        toNullableNumber(heroPower),

      skill1Level:
        toNullableNumber(skill1Level),
      skill2Level:
        toNullableNumber(skill2Level),
      skill3Level:
        toNullableNumber(skill3Level),
      skill4Level:
        toNullableNumber(skill4Level),

      exclusiveGearLevel:
        toNullableNumber(
          exclusiveGearLevel,
        ),

      widgetLevel:
        toNullableNumber(widgetLevel),

      isOwned,

      isShowcase:
        isOwned && isShowcase,

      displayOrder:
        isOwned && isShowcase
          ? toNullableNumber(
              displayOrder,
            )
          : null,

      notes,
    })
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${hero.name} from your collection?`,
    )

    if (!confirmed) {
      return
    }

    await onRemove(hero.id)
  }

  return (
    <div
      className="hero-editor-modal"
      role="presentation"
    >
      <button
        type="button"
        className="hero-editor-modal__backdrop"
        aria-label="Close hero editor"
        onClick={onClose}
        disabled={saving}
      />

      <section
        className="hero-editor-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-editor-title"
      >
        <header className="hero-editor-modal__header">
          <div className="hero-editor-modal__identity">
            {hero.portrait_url ? (
              <img
                src={hero.portrait_url}
                alt=""
              />
            ) : (
              <span aria-hidden="true">
                ⚔️
              </span>
            )}

            <div>
              <p>
                Generation{' '}
                {hero.generation ?? '—'}
              </p>

              <h2 id="hero-editor-title">
                {hero.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="hero-editor-modal__close"
            aria-label="Close hero editor"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </header>

        <form
          className="hero-editor-modal__form"
          onSubmit={(event) =>
            void handleSubmit(event)
          }
        >
          <label className="hero-editor-modal__owned-toggle">
            <input
              type="checkbox"
              checked={isOwned}
              onChange={(event) =>
                setIsOwned(
                  event.target.checked,
                )
              }
            />

            <span>I own this hero</span>
          </label>

          <div className="hero-editor-modal__fields">
            <div className="field">
              <label htmlFor="hero-level">
                Hero level
              </label>

              <input
                id="hero-level"
                type="number"
                min="1"
                max="80"
                value={heroLevel}
                disabled={!isOwned || saving}
                onChange={(event) =>
                  setHeroLevel(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="star-level">
                Star level
              </label>

              <input
                id="star-level"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={starLevel}
                disabled={!isOwned || saving}
                onChange={(event) =>
                  setStarLevel(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="hero-power">
                Hero power
              </label>

              <input
                id="hero-power"
                type="number"
                min="0"
                value={heroPower}
                disabled={!isOwned || saving}
                onChange={(event) =>
                  setHeroPower(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="exclusive-gear-level">
                Exclusive Gear level
              </label>

              <input
                id="exclusive-gear-level"
                type="number"
                min="0"
                value={exclusiveGearLevel}
                disabled={!isOwned || saving}
                onChange={(event) =>
                  setExclusiveGearLevel(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <section className="hero-editor-modal__skill-section">
            <div>
              <p className="eyebrow">
                KvK readiness
              </p>

              <h3>Hero skill levels</h3>

              <p>
                Enter the four skill levels in
                the same order shown in-game.
              </p>
            </div>

            <div className="hero-editor-modal__skills">
              <div className="field">
                <label htmlFor="skill-1-level">
                  Skill 1
                </label>

                <input
                  id="skill-1-level"
                  type="number"
                  min="1"
                  max="5"
                  value={skill1Level}
                  disabled={!isOwned || saving}
                  onChange={(event) =>
                    setSkill1Level(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="skill-2-level">
                  Skill 2
                </label>

                <input
                  id="skill-2-level"
                  type="number"
                  min="1"
                  max="5"
                  value={skill2Level}
                  disabled={!isOwned || saving}
                  onChange={(event) =>
                    setSkill2Level(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="skill-3-level">
                  Skill 3
                </label>

                <input
                  id="skill-3-level"
                  type="number"
                  min="1"
                  max="5"
                  value={skill3Level}
                  disabled={!isOwned || saving}
                  onChange={(event) =>
                    setSkill3Level(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="skill-4-level">
                  Skill 4
                </label>

                <input
                  id="skill-4-level"
                  type="number"
                  min="1"
                  max="5"
                  value={skill4Level}
                  disabled={!isOwned || saving}
                  onChange={(event) =>
                    setSkill4Level(
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <div className="field">
            <label htmlFor="widget-level">
              Widget level
            </label>

            <input
              id="widget-level"
              type="number"
              min="0"
              value={widgetLevel}
              disabled={!isOwned || saving}
              onChange={(event) =>
                setWidgetLevel(
                  event.target.value,
                )
              }
            />
          </div>

          <label className="hero-editor-modal__showcase-toggle">
            <input
              type="checkbox"
              checked={isShowcase}
              disabled={!isOwned || saving}
              onChange={(event) =>
                setIsShowcase(
                  event.target.checked,
                )
              }
            />

            <span>
              Show this hero on my public
              profile
            </span>
          </label>

          {isOwned && isShowcase && (
            <div className="field">
              <label htmlFor="display-order">
                Showcase position
              </label>

              <input
                id="display-order"
                type="number"
                min="1"
                value={displayOrder}
                disabled={saving}
                onChange={(event) =>
                  setDisplayOrder(
                    event.target.value,
                  )
                }
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="hero-notes">
              Private notes
            </label>

            <textarea
              id="hero-notes"
              rows={4}
              value={notes}
              disabled={saving}
              placeholder="Add shard plans, formation notes or future investment priorities."
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
            />
          </div>

          {errorMessage && (
            <p className="profile-panel__error">
              {errorMessage}
            </p>
          )}

          <footer className="hero-editor-modal__actions">
            {playerHero && (
              <button
                type="button"
                className="button button--danger"
                disabled={saving}
                onClick={() =>
                  void handleRemove()
                }
              >
                Remove hero
              </button>
            )}

            <div>
              <button
                type="button"
                className="button button--secondary"
                disabled={saving}
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : 'Save hero'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default HeroEditorModal