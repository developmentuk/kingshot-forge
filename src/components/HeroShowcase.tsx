import type { PlayerHeroWithHero } from "../types/hero";

interface HeroShowcaseProps {
  heroes: PlayerHeroWithHero[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function formatTroopType(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRarity(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPower(value: number | null): string {
  if (value === null) {
    return "Not added";
  }

  return new Intl.NumberFormat("en-GB").format(value);
}

export default function HeroShowcase({
  heroes,
  isLoading = false,
  emptyMessage = "No showcase heroes selected yet.",
}: HeroShowcaseProps) {
  if (isLoading) {
    return (
      <section className="hero-showcase" aria-busy="true">
        <div className="hero-showcase__header">
          <div>
            <span className="hero-showcase__eyebrow">
              Player collection
            </span>

            <h2>Hero Showcase</h2>
          </div>
        </div>

        <div className="hero-showcase__grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              className="hero-card hero-card--loading"
              key={index}
            >
              <div className="hero-card__portrait-placeholder" />

              <div className="hero-card__loading-line" />
              <div className="hero-card__loading-line hero-card__loading-line--short" />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="hero-showcase">
      <div className="hero-showcase__header">
        <div>
          <span className="hero-showcase__eyebrow">
            Player collection
          </span>

          <h2>Hero Showcase</h2>

          <p>
            The heroes this player has chosen to feature on their
            public Forge profile.
          </p>
        </div>

        <span className="hero-showcase__count">
          {heroes.length}/6 selected
        </span>
      </div>

      {heroes.length === 0 ? (
        <div className="hero-showcase__empty">
          <div className="hero-showcase__empty-icon">
            HS
          </div>

          <h3>No heroes showcased</h3>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="hero-showcase__grid">
          {heroes.map((playerHero) => {
            const { hero } = playerHero;

            return (
              <article
                className={`hero-card hero-card--${hero.rarity}`}
                key={playerHero.id}
              >
                <div className="hero-card__image-wrap">
                  {hero.portrait_url ? (
                    <img
                      className="hero-card__image"
                      src={hero.portrait_url}
                      alt={`${hero.name} hero portrait`}
                    />
                  ) : (
                    <div className="hero-card__portrait-placeholder">
                      <span>{hero.name.charAt(0)}</span>
                    </div>
                  )}

                  <span className="hero-card__position">
                    #{playerHero.display_order ?? "—"}
                  </span>

                  <span className="hero-card__rarity">
                    {formatRarity(hero.rarity)}
                  </span>
                </div>

                <div className="hero-card__body">
                  <div className="hero-card__title-row">
                    <div>
                      <h3>{hero.name}</h3>

                      <p>
                        {hero.generation
                          ? `Generation ${hero.generation}`
                          : "Permanent hero"}
                      </p>
                    </div>

                    <span className="hero-card__troop-type">
                      {formatTroopType(hero.troop_type)}
                    </span>
                  </div>

                  <dl className="hero-card__stats">
                    <div>
                      <dt>Level</dt>
                      <dd>{playerHero.hero_level ?? "—"}</dd>
                    </div>

                    <div>
                      <dt>Stars</dt>
                      <dd>{playerHero.star_level ?? "—"}</dd>
                    </div>

                    <div>
                      <dt>Awakening</dt>
                      <dd>{playerHero.awakening_level ?? "—"}</dd>
                    </div>

                    <div>
                      <dt>Power</dt>
                      <dd>{formatPower(playerHero.hero_power)}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}