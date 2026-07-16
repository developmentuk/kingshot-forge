import {
  useEffect,
  useMemo,
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
  onSave: (values: HeroEditorValues) => Promise<void>
  onRemove: (heroId: string) => Promise<void>
}

const SKILL_GROUPS = [
  { heading: 'Exploration skills', labels: ['Exploration 1', 'Exploration 2', 'Exploration 3'] },
  { heading: 'Expedition skills', labels: ['Expedition 1', 'Expedition 2', 'Expedition 3'] },
]

const STAR_OPTIONS = Array.from(
  { length: 26 },
  (_, index) => index / 5,
)

function toNullableNumber(value: string): number | null {
  if (value.trim() === '') {
    return null
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function formatStarOption(value: number) {
  if (value === 0) {
    return '0 stars'
  }

  if (Number.isInteger(value)) {
    return `${value} ${value === 1 ? 'star' : 'stars'}`
  }

  const fullStars = Math.floor(value)
  const tier = Math.round((value - fullStars) * 5)
  return `${fullStars} star${fullStars === 1 ? '' : 's'}, tier ${tier}`
}

function LevelSelect({
  id,
  label,
  value,
  disabled,
  max = 5,
  onChange,
}: {
  id: string
  label: string
  value: string
  disabled: boolean
  max?: number
  onChange: (value: string) => void
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Not entered</option>
        {Array.from({ length: max }, (_, index) => index + 1).map((level) => (
          <option key={level} value={level}>
            Level {level}
          </option>
        ))}
      </select>
    </div>
  )
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
  const [heroLevel, setHeroLevel] = useState('')
  const [starLevel, setStarLevel] = useState('')
  const [heroPower, setHeroPower] = useState('')
  const [skillLevels, setSkillLevels] = useState<string[]>(Array(6).fill(''))
  const [exclusiveGearLevel, setExclusiveGearLevel] = useState('')
  const [widgetLevel, setWidgetLevel] = useState('')
  const [isOwned, setIsOwned] = useState(true)
  const [isShowcase, setIsShowcase] = useState(false)
  const [displayOrder, setDisplayOrder] = useState('')
  const [notes, setNotes] = useState('')

  const supportsAdvancedGear =
    hero.rarity === 'legendary' || hero.rarity === 'mythic'

  const progressionSummary = useMemo(
    () =>
      supportsAdvancedGear
        ? 'This Hero supports six skills, Exclusive Gear and Widget progression.'
        : 'This Hero supports six skill levels. Exclusive Gear and Widgets are not available for this rarity.',
    [supportsAdvancedGear],
  )

  useEffect(() => {
    setHeroLevel(playerHero?.hero_level?.toString() ?? '')
    setStarLevel(playerHero?.star_level?.toString() ?? '')
    setHeroPower(playerHero?.hero_power?.toString() ?? '')
    setSkillLevels([
      playerHero?.skill_1_level?.toString() ?? '',
      playerHero?.skill_2_level?.toString() ?? '',
      playerHero?.skill_3_level?.toString() ?? '',
      playerHero?.skill_4_level?.toString() ?? '',
      playerHero?.skill_5_level?.toString() ?? '',
      playerHero?.skill_6_level?.toString() ?? '',
    ])
    setExclusiveGearLevel(
      supportsAdvancedGear
        ? playerHero?.exclusive_gear_level?.toString() ?? ''
        : '',
    )
    setWidgetLevel(
      supportsAdvancedGear
        ? playerHero?.widget_level?.toString() ?? ''
        : '',
    )
    setIsOwned(playerHero?.is_owned ?? true)
    setIsShowcase(playerHero?.is_showcase ?? false)
    setDisplayOrder(playerHero?.display_order?.toString() ?? '')
    setNotes(playerHero?.notes ?? '')
  }, [hero, playerHero, supportsAdvancedGear])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, saving])

  function updateSkill(index: number, value: string) {
    setSkillLevels((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await onSave({
      heroId: hero.id,
      heroLevel: toNullableNumber(heroLevel),
      starLevel: toNullableNumber(starLevel),
      heroPower: toNullableNumber(heroPower),
      awakeningLevel: null,
      skill1Level: toNullableNumber(skillLevels[0]),
      skill2Level: toNullableNumber(skillLevels[1]),
      skill3Level: toNullableNumber(skillLevels[2]),
      skill4Level: toNullableNumber(skillLevels[3]),
      skill5Level: toNullableNumber(skillLevels[4]),
      skill6Level: toNullableNumber(skillLevels[5]),
      exclusiveGearLevel: supportsAdvancedGear
        ? toNullableNumber(exclusiveGearLevel)
        : null,
      widgetLevel: supportsAdvancedGear
        ? toNullableNumber(widgetLevel)
        : null,
      isOwned,
      isShowcase: isOwned && isShowcase,
      displayOrder:
        isOwned && isShowcase
          ? toNullableNumber(displayOrder)
          : null,
      notes,
    })
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${hero.name} from your collection?`,
    )

    if (confirmed) {
      await onRemove(hero.id)
    }
  }

  return (
    <div className="hero-editor-modal" role="presentation">
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
              <img src={hero.portrait_url} alt="" />
            ) : (
              <span aria-hidden="true">⚔️</span>
            )}
            <div>
              <p>Generation {hero.generation ?? '—'} · {hero.rarity}</p>
              <h2 id="hero-editor-title">{hero.name}</h2>
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
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="hero-editor-modal__owned-toggle">
            <input
              type="checkbox"
              checked={isOwned}
              onChange={(event) => setIsOwned(event.target.checked)}
            />
            <span>I own this hero</span>
          </label>

          <p className="hero-editor-modal__capability-note">
            {progressionSummary}
          </p>

          <div className="hero-editor-modal__fields">
            <div className="field">
              <label htmlFor="hero-level">Hero level</label>
              <input
                id="hero-level"
                type="number"
                min="1"
                max="80"
                value={heroLevel}
                disabled={!isOwned || saving}
                onChange={(event) => setHeroLevel(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="star-level">Star progression</label>
              <select
                id="star-level"
                value={starLevel}
                disabled={!isOwned || saving}
                onChange={(event) => setStarLevel(event.target.value)}
              >
                <option value="">Not entered</option>
                {STAR_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {formatStarOption(value)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="hero-power">Hero power</label>
              <input
                id="hero-power"
                type="number"
                min="0"
                value={heroPower}
                disabled={!isOwned || saving}
                onChange={(event) => setHeroPower(event.target.value)}
              />
            </div>
          </div>

          <section className="hero-editor-modal__skill-section">
            <div>
              <p className="eyebrow">Hero progression</p>
              <h3>Hero skill levels</h3>
              <p>
                Record all six skills in their two in-game groups rather than using a generic four-skill form.
              </p>
            </div>

            {SKILL_GROUPS.map((group, groupIndex) => (
              <div key={group.heading}>
                <h4>{group.heading}</h4>
                <div className="hero-editor-modal__skills">
                  {group.labels.map((label, labelIndex) => {
                    const skillIndex = groupIndex * 3 + labelIndex
                    return (
                      <LevelSelect
                        key={label}
                        id={`skill-${skillIndex + 1}-level`}
                        label={label}
                        value={skillLevels[skillIndex]}
                        disabled={!isOwned || saving}
                        onChange={(value) => updateSkill(skillIndex, value)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          {supportsAdvancedGear && (
            <section className="hero-editor-modal__skill-section">
              <div>
                <p className="eyebrow">Advanced progression</p>
                <h3>Exclusive Gear and Widget</h3>
                <p>These fields are only shown for Heroes that support them.</p>
              </div>
              <div className="hero-editor-modal__skills">
                <LevelSelect
                  id="exclusive-gear-level"
                  label="Exclusive Gear level"
                  value={exclusiveGearLevel}
                  disabled={!isOwned || saving}
                  max={10}
                  onChange={setExclusiveGearLevel}
                />
                <LevelSelect
                  id="widget-level"
                  label="Widget level"
                  value={widgetLevel}
                  disabled={!isOwned || saving}
                  max={10}
                  onChange={setWidgetLevel}
                />
              </div>
            </section>
          )}

          <label className="hero-editor-modal__showcase-toggle">
            <input
              type="checkbox"
              checked={isShowcase}
              disabled={!isOwned || saving}
              onChange={(event) => setIsShowcase(event.target.checked)}
            />
            <span>Show this hero on my public profile</span>
          </label>

          {isOwned && isShowcase && (
            <div className="field">
              <label htmlFor="display-order">Showcase position</label>
              <input
                id="display-order"
                type="number"
                min="1"
                max="5"
                value={displayOrder}
                disabled={saving}
                onChange={(event) => setDisplayOrder(event.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="hero-notes">Private notes</label>
            <textarea
              id="hero-notes"
              rows={4}
              value={notes}
              disabled={saving}
              placeholder="Add shard plans, formation notes or future investment priorities."
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="profile-panel__error">{errorMessage}</p>
          )}

          <footer className="hero-editor-modal__actions">
            {playerHero && (
              <button
                type="button"
                className="button button--danger"
                disabled={saving}
                onClick={() => void handleRemove()}
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
                {saving ? 'Saving…' : 'Save hero'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default HeroEditorModal
