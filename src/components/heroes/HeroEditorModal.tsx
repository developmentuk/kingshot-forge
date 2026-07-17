import { useEffect, useState } from 'react'
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
  {
    heading: 'Exploration skills',
    labels: ['Exploration Skill 1', 'Exploration Skill 2', 'Exploration Skill 3'],
  },
  {
    heading: 'Expedition skills',
    labels: ['Expedition Skill 1', 'Expedition Skill 2', 'Expedition Skill 3'],
  },
]

const GEAR_SLOTS = [
  { key: 'topLeft', label: 'Top-left gear' },
  { key: 'topRight', label: 'Top-right gear' },
  { key: 'bottomLeft', label: 'Bottom-left gear' },
  { key: 'bottomRight', label: 'Bottom-right gear' },
] as const

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
    return 'Not ascended'
  }

  const fullStars = Math.floor(value)
  const subTier = Math.round((value - fullStars) * 5)

  if (subTier === 0) {
    return `${fullStars} ${fullStars === 1 ? 'star' : 'stars'}`
  }

  return `${fullStars} ${fullStars === 1 ? 'star' : 'stars'} + ${subTier}/5`
}

function LevelSelect({
  id,
  label,
  value,
  disabled,
  min = 0,
  max,
  onChange,
}: {
  id: string
  label: string
  value: string
  disabled: boolean
  min?: number
  max: number
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
        {Array.from(
          { length: max - min + 1 },
          (_, index) => min + index,
        ).map((level) => (
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
  const [skillLevels, setSkillLevels] = useState<string[]>(
    Array(6).fill(''),
  )
  const [gearLevels, setGearLevels] = useState({
    topLeft: '',
    topRight: '',
    bottomLeft: '',
    bottomRight: '',
  })
  const [widgetLevel, setWidgetLevel] = useState('')
  const [isOwned, setIsOwned] = useState(true)
  const [isShowcase, setIsShowcase] = useState(false)
  const [displayOrder, setDisplayOrder] = useState('')
  const [notes, setNotes] = useState('')

  const supportsWidget =
    hero.rarity === 'legendary' || hero.rarity === 'mythic'

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
    setGearLevels({
      topLeft: playerHero?.gear_top_left_level?.toString() ?? '',
      topRight: playerHero?.gear_top_right_level?.toString() ?? '',
      bottomLeft: playerHero?.gear_bottom_left_level?.toString() ?? '',
      bottomRight: playerHero?.gear_bottom_right_level?.toString() ?? '',
    })
    setWidgetLevel(
      supportsWidget
        ? playerHero?.widget_level?.toString() ?? ''
        : '',
    )
    setIsOwned(playerHero?.is_owned ?? true)
    setIsShowcase(playerHero?.is_showcase ?? false)
    setDisplayOrder(playerHero?.display_order?.toString() ?? '')
    setNotes(playerHero?.notes ?? '')
  }, [hero, playerHero, supportsWidget])

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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
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
      gearTopLeftLevel: toNullableNumber(gearLevels.topLeft),
      gearTopRightLevel: toNullableNumber(gearLevels.topRight),
      gearBottomLeftLevel: toNullableNumber(gearLevels.bottomLeft),
      gearBottomRightLevel: toNullableNumber(gearLevels.bottomRight),
      widgetLevel: supportsWidget
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
              <p>
                Generation {hero.generation ?? '—'} · {hero.rarity}
              </p>
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
              <p className="eyebrow">Skills</p>
              <h3>Six Hero skills</h3>
              <p>
                Record the three Exploration and three Expedition skills shown in-game.
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
                        min={1}
                        max={5}
                        onChange={(value) =>
                          updateSkill(skillIndex, value)
                        }
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="hero-editor-modal__skill-section">
            <div>
              <p className="eyebrow">Hero Gear</p>
              <h3>Four gear pieces</h3>
              <p>
                Track each of the four in-game Hero Gear slots independently.
              </p>
            </div>
            <div className="hero-editor-modal__skills">
              {GEAR_SLOTS.map((slot) => (
                <LevelSelect
                  key={slot.key}
                  id={`gear-${slot.key}`}
                  label={slot.label}
                  value={gearLevels[slot.key]}
                  disabled={!isOwned || saving}
                  max={100}
                  onChange={(value) =>
                    setGearLevels((current) => ({
                      ...current,
                      [slot.key]: value,
                    }))
                  }
                />
              ))}
            </div>
          </section>

          {supportsWidget && (
            <section className="hero-editor-modal__skill-section">
              <div>
                <p className="eyebrow">Exclusive progression</p>
                <h3>Widget</h3>
                <p>
                  Widget progression is available for Legendary and Mythic Heroes.
                </p>
              </div>
              <div className="hero-editor-modal__skills">
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
              onChange={(event) =>
                setIsShowcase(event.target.checked)
              }
            />
            <span>Show this hero on my public profile</span>
          </label>

          {isOwned && isShowcase && (
            <div className="field">
              <label htmlFor="display-order">Showcase position</label>
              <select
                id="display-order"
                value={displayOrder}
                disabled={saving}
                onChange={(event) =>
                  setDisplayOrder(event.target.value)
                }
              >
                <option value="">Choose position</option>
                {Array.from({ length: 6 }, (_, index) => index + 1).map(
                  (position) => (
                    <option key={position} value={position}>
                      Position {position}
                    </option>
                  ),
                )}
              </select>
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
