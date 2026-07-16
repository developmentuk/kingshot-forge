import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import PublishedHeroSkills from '../components/heroes/PublishedHeroSkills'
import { getHeroCatalogue } from '../services/heroService'
import type { Hero, HeroTier } from '../types/hero'
import './HeroCompanionPage.css'
import './HeroCompanionEnhancements.css'

function formatLabel(value: string | null) {
  if (!value) return 'Not available'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function tierClassName(tier: HeroTier | null) {
  return `hero-companion-rating hero-companion-rating--${String(tier || 'na')
    .replace('+', '-plus')
    .toLowerCase()}`
}

function HeroPortrait({ hero, compact = false }: { hero: Hero; compact?: boolean }) {
  return (
    <div className={`hero-companion-portrait${compact ? ' hero-companion-portrait--compact' : ''}`}>
      {hero.portrait_url ? (
        <img src={hero.portrait_url} alt={`${hero.name} portrait`} />
      ) : (
        <span aria-hidden="true">⚔️</span>
      )}
    </div>
  )
}

function RatingCard({
  label,
  value,
  description,
}: {
  label: string
  value: HeroTier | null
  description: string
}) {
  return (
    <article className={tierClassName(value)}>
      <div className="hero-companion-rating__header">
        <span>{label}</span>
        <strong className="hero-companion-rating__grade">{value || '—'}</strong>
      </div>
      <p>{description}</p>
    </article>
  )
}

function EmptyGuideSection({ title, description }: { title: string; description: string }) {
  return (
    <article className="hero-companion-guide-placeholder">
      <span aria-hidden="true">＋</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  )
}

function HeroCompanionDetail({ hero }: { hero: Hero }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const availability = [
    hero.is_f2p === true ? 'Free-to-play accessible' : null,
    hero.is_vip === true ? 'VIP hero' : null,
  ].filter((item): item is string => Boolean(item))

  return (
    <main className="hero-companion-page hero-companion-page--detail">
      <nav className="hero-companion-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion/heroes">Hero Companion</Link>
        <span aria-hidden="true">›</span>
        <span>{hero.name}</span>
      </nav>

      <section className="hero-companion-hero">
        <div className="hero-companion-hero__art">
          <HeroPortrait hero={hero} />
          <span className="hero-companion-generation">Generation {hero.generation ?? '—'}</span>
        </div>
        <div className="hero-companion-hero__content">
          <p className="eyebrow">Kingshot Companion</p>
          <h1>{hero.name}</h1>
          <p className="hero-companion-role">
            {formatLabel(hero.rarity)} {formatLabel(hero.troop_type)} hero
          </p>
          <p className="hero-companion-lead">
            {hero.description || 'A full Companion overview for this hero has not yet been published.'}
          </p>
          <div className="hero-companion-tags" aria-label="Hero classification">
            <span>{formatLabel(hero.rarity)}</span>
            <span>{formatLabel(hero.troop_type)}</span>
            <span>Generation {hero.generation ?? '—'}</span>
            {availability.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="hero-companion-summary" aria-label="Hero summary">
        <article className="hero-companion-summary__primary">
          <p className="eyebrow">Best use</p>
          <h2>{hero.best_use || 'Guidance pending'}</h2>
          <p>This recommendation reflects the currently published Forge assessment.</p>
        </article>
        <article><span>Troop type</span><strong>{formatLabel(hero.troop_type)}</strong></article>
        <article><span>Rarity</span><strong>{formatLabel(hero.rarity)}</strong></article>
        <article>
          <span>Availability</span>
          <strong>{availability.length > 0 ? availability.join(' · ') : 'Standard availability'}</strong>
        </article>
      </section>

      <section className="hero-companion-section hero-companion-section--ratings">
        <div className="hero-companion-section__heading hero-companion-ratings-heading">
          <div><p className="eyebrow">Forge assessment</p><h2>Hero ratings</h2></div>
          <p>See at a glance where {hero.name} performs best across the main battle roles.</p>
        </div>
        <div className="hero-companion-ratings">
          <RatingCard label="Rally" value={hero.rally_tier} description="Value when leading an alliance rally." />
          <RatingCard label="Garrison" value={hero.garrison_tier} description="Value when defending a city or structure." />
          <RatingCard label="Bear Hunt" value={hero.bear_tier} description="Value in Alliance Bear Hunt formations." />
          <RatingCard label="Rally joiner" value={hero.joiner_tier} description="Value when joining another player’s rally." />
        </div>
      </section>

      <section className="hero-companion-layout">
        <div className="hero-companion-main-column">
          <section className="hero-companion-panel">
            <div className="hero-companion-section__heading">
              <div><p className="eyebrow">Overview</p><h2>How to use {hero.name}</h2></div>
            </div>
            <p className="hero-companion-copy">
              {hero.description || 'Detailed hero guidance has not yet been published.'}
            </p>
          </section>

          <section className="hero-companion-panel">
            <div className="hero-companion-section__heading">
              <div><p className="eyebrow">Published content</p><h2>Skills</h2></div>
              <p>Only reviewed and published canonical skills are shown here.</p>
            </div>
            <PublishedHeroSkills heroSlug={hero.slug} heroName={hero.name} />
          </section>

          <section className="hero-companion-panel">
            <div className="hero-companion-section__heading">
              <div><p className="eyebrow">Guide content</p><h2>Progression and strategy</h2></div>
            </div>
            <div className="hero-companion-guide-grid">
              <EmptyGuideSection title="Widget" description="Widget effects and recommended progression will appear here when published." />
              <EmptyGuideSection title="Hero pairings" description="Recommended hero combinations will be added through reviewed Companion content." />
              <EmptyGuideSection title="Formation guidance" description="Battle-role and formation recommendations will appear here when verified." />
            </div>
          </section>

          {hero.tags.length > 0 && (
            <section className="hero-companion-panel">
              <div className="hero-companion-section__heading">
                <div><p className="eyebrow">Classification</p><h2>Tags</h2></div>
              </div>
              <div className="hero-companion-tags">
                {hero.tags.map((tag) => <span key={tag}>{formatLabel(tag)}</span>)}
              </div>
            </section>
          )}
        </div>

        <aside className="hero-companion-sidebar">
          <section className="hero-companion-panel hero-companion-trust">
            <p className="eyebrow">Forge trust</p>
            <h2>Source details</h2>
            <dl>
              <div><dt>Source</dt><dd>{hero.source_name || 'Not recorded'}</dd></div>
              <div><dt>Verification</dt><dd>{hero.source_verified || 'Not recorded'}</dd></div>
              <div><dt>Source updated</dt><dd>{formatDate(hero.source_updated_at)}</dd></div>
              <div><dt>Forge updated</dt><dd>{formatDate(hero.updated_at)}</dd></div>
              {hero.source_accuracy_score !== null && (
                <div><dt>Accuracy score</dt><dd>{hero.source_accuracy_score}%</dd></div>
              )}
            </dl>
            {hero.source_url && (
              <a href={hero.source_url} target="_blank" rel="noreferrer" className="hero-companion-source-link">
                Open source reference
              </a>
            )}
          </section>

          <section className="hero-companion-panel hero-companion-feedback">
            <span className="hero-companion-feedback__icon" aria-hidden="true">💡</span>
            <p className="eyebrow">Help improve Forge</p>
            <h2>Something not right?</h2>
            <p>Request an update or report an issue with {hero.name}’s data. Your report will go directly to the Forge feedback queue.</p>
            <button
              type="button"
              className="hero-companion-feedback__button"
              onClick={() => setFeedbackOpen(true)}
            >
              Report an issue
            </button>
          </section>
        </aside>
      </section>

      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        entityType="hero"
        entityId={hero.id}
        entityName={hero.name}
      />
    </main>
  )
}

export default function HeroCompanionPage() {
  const { heroId } = useParams<{ heroId?: string }>()
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadHeroes() {
      setLoading(true)
      setError('')
      try {
        const catalogue = await getHeroCatalogue()
        if (!cancelled) setHeroes(catalogue)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the Hero Companion.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadHeroes()
    return () => { cancelled = true }
  }, [])

  const selectedHero = useMemo(
    () => heroes.find((hero) => hero.slug === heroId || hero.id === heroId),
    [heroId, heroes],
  )

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return heroes
    return heroes.filter((hero) =>
      [hero.name, hero.troop_type, hero.rarity, String(hero.generation ?? ''), ...hero.tags]
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [heroes, search])

  if (loading) return <main className="hero-companion-page"><p>Loading Hero Companion…</p></main>
  if (error) return <main className="hero-companion-page"><h1>Hero Companion unavailable</h1><p>{error}</p></main>

  if (heroId) {
    return selectedHero ? (
      <HeroCompanionDetail hero={selectedHero} />
    ) : (
      <main className="hero-companion-page"><h1>Hero not found</h1><Link to="/companion/heroes">Return to Hero Companion</Link></main>
    )
  }

  return (
    <main className="hero-companion-page">
      <section className="hero-companion-heading">
        <div>
          <p className="eyebrow">Kingshot Companion</p>
          <h1>Heroes</h1>
          <p>Explore published hero ratings, roles and trusted Forge guidance.</p>
        </div>
        <div className="hero-companion-count"><strong>{heroes.length}</strong><span>published heroes</span></div>
      </section>

      <section className="hero-companion-toolbar">
        <label htmlFor="hero-companion-search">Search heroes</label>
        <input
          id="hero-companion-search"
          type="search"
          value={search}
          placeholder="Search by name, troop type, rarity or tag"
          onChange={(event) => setSearch(event.target.value)}
        />
        <span>{filteredHeroes.length} results</span>
      </section>

      <section className="hero-companion-list">
        {filteredHeroes.map((hero) => (
          <Link key={hero.id} to={`/companion/heroes/${hero.slug || hero.id}`} className="hero-companion-card">
            <HeroPortrait hero={hero} compact />
            <div className="hero-companion-card__content">
              <div className="hero-companion-card__meta">
                <span>{formatLabel(hero.rarity)}</span><span>Gen {hero.generation ?? '—'}</span>
              </div>
              <h2>{hero.name}</h2>
              <p>{formatLabel(hero.troop_type)}</p>
              <div className="hero-companion-card__ratings">
                <span>Rally {hero.rally_tier || '—'}</span><span>Bear {hero.bear_tier || '—'}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {filteredHeroes.length === 0 && (
        <section className="hero-companion-empty"><h2>No heroes found</h2><p>Try a different name, troop type, rarity or tag.</p></section>
      )}
    </main>
  )
}
