import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type {
  Hero,
  PlayerHeroWithHero,
} from '../../types/hero'

type HeroCardProps = {
  hero: Hero
  playerHero?: PlayerHeroWithHero
  onSelect: (
    hero: Hero,
    playerHero?: PlayerHeroWithHero,
  ) => void
}

function formatLabel(value: string | null) {
  if (!value) {
    return 'Unknown'
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function TroopCrest({
  troopType,
}: {
  troopType: Hero['troop_type']
}) {
  const icon = (() => {
    if (troopType === 'infantry') {
      return (
        <path d="M12 2.8 19 5.5v5.7c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V5.5L12 2.8Zm0 3L7.4 7.5v3.7c0 3.1 1.8 5.9 4.6 7.3 2.8-1.4 4.6-4.2 4.6-7.3V7.5L12 5.8Z" />
      )
    }

    if (troopType === 'archer') {
      return (
        <>
          <path d="M6.1 4.4c5.3 1.4 8.1 5.8 8.7 13.2l-2.2.2C12 11.5 9.8 7.9 5.5 6.7l.6-2.3Z" />
          <path d="m5 18 12.5-12.5 1.5 1.5L6.5 19.5 5 18Z" />
          <path d="m15.2 4.8 4-.8-.8 4-3.2-3.2ZM4.3 16.3l3.4 3.4-4.7 1.1 1.3-4.5Z" />
        </>
      )
    }

    if (troopType === 'cavalry') {
      return (
        <path d="M7.1 20.2c.2-3.7 1-6.3 2.5-7.9L7.8 9.7l1.4-4.1 3.5 1.2 3.2-3.1.7 4.1 2.4 2.3-1.7 3.2-2.2-.7c-.5 1.2-.4 2.3.4 3.4l1.4 2.1-2.1 2.1H7.1Zm4.3-9.8c2.2-.8 4.1-.7 5.7.3l-1.5-1.4-2.5.7-1.7.4Z" />
      )
    }

    return (
      <path d="m7 4 2 2-1.5 1.5 3 3 3-3L12 6l2-2 6 6-2 2-1.5-1.5-3 3 3 3L18 15l2 2-3 3-2-2 1.5-1.5-3-3-3 3L12 18l-2 2-3-3 2-2 1.5 1.5 3-3-3-3-3 3L6 12l-2-2 3-6Z" />
    )
  })()

  return (
    <span
      className={`hero-game-card__crest hero-game-card__crest--${troopType ?? 'unknown'}`}
      aria-label={formatLabel(troopType)}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {icon}
      </svg>
    </span>
  )
}

function StarRating({ level }: { level: number | null }) {
  const safeLevel = Math.max(
    0,
    Math.min(5, level ?? 0),
  )

  return (
    <div
      className="hero-game-card__stars"
      aria-label={`${safeLevel} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(
          0,
          Math.min(1, safeLevel - index),
        )

        return (
          <span
            className="hero-game-card__star"
            key={index}
            style={
              {
                '--star-fill': `${fill * 100}%`,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <span className="hero-game-card__star-empty">★</span>
            <span className="hero-game-card__star-fill">★</span>
          </span>
        )
      })}
    </div>
  )
}

function HeroCard({
  hero,
  playerHero,
  onSelect,
}: HeroCardProps) {
  const isOwned =
    playerHero?.is_owned ?? false
  const companionPath =
    `/companion/heroes/${hero.slug || hero.id}`

  return (
    <article
      className={[
        'hero-game-card',
        `hero-game-card--${hero.rarity}`,
        isOwned
          ? 'hero-game-card--owned'
          : 'hero-game-card--unowned',
      ].join(' ')}
    >
      <button
        type="button"
        className="hero-game-card__button"
        aria-label={
          isOwned
            ? `Edit ${hero.name}`
            : `Add ${hero.name} to collection`
        }
        onClick={() =>
          onSelect(hero, playerHero)
        }
      >
        <div className="hero-game-card__portrait">
          {hero.portrait_url ? (
            <img
              src={hero.portrait_url}
              alt=""
            />
          ) : (
            <span
              className="hero-game-card__placeholder"
              aria-hidden="true"
            >
              ⚔️
            </span>
          )}

          <div className="hero-game-card__overlay" />

          <span className="hero-game-card__generation">
            Gen {hero.generation ?? '—'}
          </span>

          <span className="hero-game-card__ownership">
            {isOwned ? 'Owned' : 'Locked'}
          </span>

          <div className="hero-game-card__identity">
            <TroopCrest troopType={hero.troop_type} />
            <div>
              <p>{formatLabel(hero.rarity)}</p>
              <h2>{hero.name}</h2>
            </div>
          </div>
        </div>

        <div className="hero-game-card__body">
          <StarRating
            level={playerHero?.star_level ?? null}
          />

          <div className="hero-game-card__stats">
            <div>
              <span>Level</span>
              <strong>
                {playerHero?.hero_level ?? '—'}
              </strong>
            </div>

            <div>
              <span>Power</span>
              <strong>
                {playerHero?.hero_power
                  ? playerHero.hero_power.toLocaleString()
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="hero-game-card__troop-label">
            <TroopCrest troopType={hero.troop_type} />
            <span>{formatLabel(hero.troop_type)}</span>
          </div>
        </div>
      </button>

      <div className="hero-game-card__actions">
        <Link
          to={companionPath}
          className="hero-game-card__action hero-game-card__action--guide"
        >
          <span aria-hidden="true">▤</span>
          Companion Guide
        </Link>

        <button
          type="button"
          className="hero-game-card__action hero-game-card__action--progress"
          onClick={() =>
            onSelect(hero, playerHero)
          }
        >
          <span aria-hidden="true">
            {isOwned ? '↗' : '+'}
          </span>
          {isOwned ? 'Edit Progression' : 'Add Hero'}
        </button>
      </div>
    </article>
  )
}

export default HeroCard
