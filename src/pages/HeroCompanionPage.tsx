import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useParams,
} from 'react-router-dom'
import {
  getHeroCatalogue,
} from '../services/heroService'
import type {
  Hero,
} from '../types/hero'
import './HeroCompanionPage.css'

function formatLabel(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function HeroPortrait({
  hero,
}: {
  hero: Hero
}) {
  return (
    <div className="hero-companion-portrait">
      {hero.portrait_url ? (
        <img
          src={hero.portrait_url}
          alt={`${hero.name} portrait`}
        />
      ) : (
        <span aria-hidden="true">⚔️</span>
      )}
    </div>
  )
}

function HeroCompanionDetail({
  hero,
}: {
  hero: Hero
}) {
  return (
    <main className="hero-companion-page">
      <Link
        to="/companion/heroes"
        className="hero-companion-back"
      >
        ← All heroes
      </Link>

      <section className="hero-companion-hero">
        <HeroPortrait hero={hero} />

        <div>
          <p className="eyebrow">
            Kingshot Companion
          </p>
          <h1>{hero.name}</h1>
          <p className="hero-companion-lead">
            {hero.description ||
              'A full companion guide for this hero is being prepared.'}
          </p>

          <div className="hero-companion-tags">
            <span>{formatLabel(hero.rarity)}</span>
            <span>{formatLabel(hero.troop_type)}</span>
            <span>
              Generation {hero.generation ?? '—'}
            </span>
            {hero.is_f2p === true && (
              <span>F2P friendly</span>
            )}
            {hero.is_vip === true && (
              <span>VIP</span>
            )}
          </div>
        </div>
      </section>

      <section className="hero-companion-grid">
        <article className="hero-companion-panel">
          <h2>Ratings</h2>
          <dl className="hero-companion-ratings">
            <div>
              <dt>Rally</dt>
              <dd>{hero.rally_tier || '—'}</dd>
            </div>
            <div>
              <dt>Garrison</dt>
              <dd>{hero.garrison_tier || '—'}</dd>
            </div>
            <div>
              <dt>Bear</dt>
              <dd>{hero.bear_tier || '—'}</dd>
            </div>
            <div>
              <dt>Joiner</dt>
              <dd>{hero.joiner_tier || '—'}</dd>
            </div>
          </dl>
        </article>

        <article className="hero-companion-panel">
          <h2>Best use</h2>
          <p>
            {hero.best_use ||
              'Best-use guidance has not yet been published.'}
          </p>
        </article>

        <article className="hero-companion-panel hero-companion-panel--wide">
          <h2>Tags</h2>
          {hero.tags.length > 0 ? (
            <div className="hero-companion-tags">
              {hero.tags.map((tag) => (
                <span key={tag}>
                  {formatLabel(tag)}
                </span>
              ))}
            </div>
          ) : (
            <p>No tags published.</p>
          )}
        </article>

        <article className="hero-companion-panel hero-companion-panel--wide">
          <h2>Source</h2>
          <p>
            {hero.source_name || 'Source not recorded'}
          </p>
          <p>
            Verification: {hero.source_verified || 'Not recorded'}
          </p>
          {hero.source_url && (
            <a
              href={hero.source_url}
              target="_blank"
              rel="noreferrer"
            >
              Open source reference
            </a>
          )}
        </article>
      </section>
    </main>
  )
}

export default function HeroCompanionPage() {
  const { heroId } = useParams<{
    heroId?: string
  }>()
  const [heroes, setHeroes] =
    useState<Hero[]>([])
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadHeroes() {
      setLoading(true)
      setError('')

      try {
        const catalogue =
          await getHeroCatalogue()

        if (!cancelled) {
          setHeroes(catalogue)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load the Hero Companion.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadHeroes()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedHero = useMemo(
    () =>
      heroes.find(
        (hero) =>
          hero.slug === heroId ||
          hero.id === heroId,
      ),
    [heroId, heroes],
  )

  if (loading) {
    return (
      <main className="hero-companion-page">
        <p>Loading Hero Companion…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="hero-companion-page">
        <h1>Hero Companion unavailable</h1>
        <p>{error}</p>
      </main>
    )
  }

  if (heroId) {
    return selectedHero ? (
      <HeroCompanionDetail hero={selectedHero} />
    ) : (
      <main className="hero-companion-page">
        <h1>Hero not found</h1>
        <Link to="/companion/heroes">
          Return to Hero Companion
        </Link>
      </main>
    )
  }

  return (
    <main className="hero-companion-page">
      <section className="hero-companion-heading">
        <p className="eyebrow">
          Kingshot Companion
        </p>
        <h1>Hero Companion</h1>
        <p>
          Browse canonical hero information and open a detailed guide for each hero.
        </p>
      </section>

      <section className="hero-companion-list">
        {heroes.map((hero) => (
          <Link
            key={hero.id}
            to={`/companion/heroes/${hero.slug || hero.id}`}
            className="hero-companion-card"
          >
            <HeroPortrait hero={hero} />
            <div>
              <p>{formatLabel(hero.rarity)}</p>
              <h2>{hero.name}</h2>
              <span>
                {formatLabel(hero.troop_type)} · Gen {hero.generation ?? '—'}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
