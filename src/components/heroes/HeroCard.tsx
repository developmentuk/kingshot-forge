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

function formatStars(starLevel: number | null) {
  const safeLevel = Math.max(
    0,
    Math.min(5, starLevel ?? 0),
  )

  return Array.from(
    { length: 5 },
    (_, index) =>
      index < safeLevel ? '★' : '☆',
  ).join('')
}

function getTroopIcon(
  troopType: Hero['troop_type'],
) {
  if (troopType === 'infantry') {
    return '🛡️'
  }

  if (troopType === 'cavalry') {
    return '🐎'
  }

  if (troopType === 'archer') {
    return '🏹'
  }

  return '⚔️'
}

function HeroCard({
  hero,
  playerHero,
  onSelect,
}: HeroCardProps) {
  const isOwned =
    playerHero?.is_owned ?? false

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

          <span
            className="hero-game-card__troop"
            aria-label={formatLabel(
              hero.troop_type,
            )}
          >
            {getTroopIcon(hero.troop_type)}
          </span>

          <div className="hero-game-card__identity">
            <p>{formatLabel(hero.rarity)}</p>

            <h2>{hero.name}</h2>
          </div>
        </div>

        <div className="hero-game-card__body">
          <div className="hero-game-card__stars">
            <span
              aria-label={`${
                playerHero?.star_level ?? 0
              } stars`}
            >
              {formatStars(
                playerHero?.star_level ??
                  null,
              )}
            </span>
          </div>

          <div className="hero-game-card__stats">
            <div>
              <span>Level</span>

              <strong>
                {playerHero?.hero_level ??
                  '—'}
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

          <div className="hero-game-card__footer">
            <span>
              {formatLabel(hero.troop_type)}
            </span>

            <strong>
              {isOwned
                ? 'Edit progression'
                : 'Add hero'}
            </strong>
          </div>
        </div>
      </button>
    </article>
  )
}

export default HeroCard