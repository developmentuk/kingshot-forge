import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import PublishedHeroSkills from '../components/heroes/PublishedHeroSkills'
import { ForgeConnections } from '../features/search/SearchExperience'
import { getHeroCatalogue } from '../services/heroService'
import type { Hero, HeroRarity, HeroTier } from '../types/hero'
import './HeroCompanionPage.css'
import './HeroCompanionEnhancements.css'
import './HeroCompanionMilestone3.css'
import './HeroCompanionRatings.css'

const GENERATION_6_GUIDE_PATH = '/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide'
const GENERATION_6_GUIDE_HEROES = new Set(['yang', 'sophia', 'triton'])

function hasGeneration6Guide(hero: Hero) {
  const slug = hero.slug?.toLowerCase() ?? ''
  const id = hero.id.toLowerCase()
  return hero.generation === 6 && (GENERATION_6_GUIDE_HEROES.has(slug) || GENERATION_6_GUIDE_HEROES.has(id))
}

function formatLabel(value: string | null) {
  if (!value) return 'Not available'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function rarityCode(rarity: HeroRarity) {
  return ({ rare: 'R', epic: 'SR', legendary: 'SSR', mythic: 'SSR' } as const)[rarity]
}

function RarityBadge({ rarity }: { rarity: HeroRarity }) {
  const code = rarityCode(rarity)
  return <span className={`hero-rarity-badge hero-rarity-badge--${code.toLowerCase()}`} aria-label={`${code} rarity`}>{code}</span>
}

function tierClassName(tier: HeroTier | null) {
  return `hero-companion-rating hero-companion-rating--${String(tier || 'na').replace('+', '-plus').toLowerCase()}`
}

function tierScore(tier: HeroTier | null) {
  return ({ 'S+': 5, S: 5, A: 4, B: 3, C: 2, D: 1 } as Record<string, number>)[tier || ''] || 0
}

function starLabel(score: number) {
  return score ? `${score} out of 5 stars` : 'Not yet assessed'
}

function StarRating({ score }: { score: number }) {
  return (
    <span className="hero-use-rating__stars" role="img" aria-label={starLabel(score)}>
      {Array.from({ length: 5 }, (_, index) => index < score
        ? <strong key={index} aria-hidden="true">★</strong>
        : <span key={index} aria-hidden="true">★</span>)}
    </span>
  )
}

function strongestRole(hero: Hero) {
  const roles = [
    { label: 'Rally lead', score: tierScore(hero.rally_tier) },
    { label: 'Garrison', score: tierScore(hero.garrison_tier) },
    { label: 'Bear Hunt', score: tierScore(hero.bear_tier) },
    { label: 'Rally joiner', score: tierScore(hero.joiner_tier) },
  ]
  return roles.sort((a, b) => b.score - a.score)[0]
}

function HeroPortrait({ hero, compact = false }: { hero: Hero; compact?: boolean }) {
  return <div className={`hero-companion-portrait${compact ? ' hero-companion-portrait--compact' : ''}`}>{hero.portrait_url ? <img src={hero.portrait_url} alt={`${hero.name} portrait`} /> : <span aria-hidden="true">⚔️</span>}</div>
}

function RatingCard({ label, value, description }: { label: string; value: HeroTier | null; description: string }) {
  const score = tierScore(value)
  return (
    <article className={tierClassName(value)}>
      <div className="hero-use-rating">
        <div className="hero-use-rating__identity">
          <span>{label}</span>
          <StarRating score={score} />
          <small className="hero-use-rating__score">{score ? `${score}/5 · ${value}` : 'Assessment pending'}</small>
        </div>
        <strong className="hero-companion-rating__grade" aria-hidden="true">{value || '—'}</strong>
      </div>
      <p>{description}</p>
    </article>
  )
}

function buildStrengths(hero: Hero) {
  const items: string[] = []
  if (tierScore(hero.rally_tier) >= 4) items.push(`Strong rally leadership (${hero.rally_tier})`)
  if (tierScore(hero.garrison_tier) >= 4) items.push(`Reliable garrison value (${hero.garrison_tier})`)
  if (tierScore(hero.bear_tier) >= 4) items.push(`High Bear Hunt value (${hero.bear_tier})`)
  if (tierScore(hero.joiner_tier) >= 4) items.push(`Effective rally-joiner value (${hero.joiner_tier})`)
  if (hero.is_f2p) items.push('Accessible progression for free-to-play players')
  if (hero.tags.includes('long-term')) items.push('Retains value across multiple generations')
  return (items.length ? items : ['Useful when matched to the published best-use role']).slice(0, 4)
}

function buildWeaknesses(hero: Hero) {
  const items: string[] = []
  if (hero.is_vip) items.push('Progression is constrained by VIP access')
  if (hero.is_f2p === false && !hero.is_vip) items.push('Shard access may be less consistent for free-to-play players')
  if (tierScore(hero.rally_tier) <= 2) items.push('Not recommended as a primary rally leader')
  if (tierScore(hero.garrison_tier) <= 2) items.push('Limited value as the main garrison defender')
  if (tierScore(hero.bear_tier) <= 2) items.push('Low priority for Bear Hunt formations')
  if (hero.tags.includes('early-game')) items.push('May be replaced by later-generation heroes')
  return (items.length ? items : ['Investment value still depends on shard availability and your current roster']).slice(0, 4)
}

function buildSynergies(hero: Hero, heroes: Hero[]) {
  return heroes.filter((candidate) => candidate.id !== hero.id).map((candidate) => {
    let score = 0
    if (candidate.troop_type !== hero.troop_type) score += 3
    if (candidate.generation === hero.generation) score += 2
    if (tierScore(candidate.joiner_tier) >= 4 && tierScore(hero.rally_tier) >= 4) score += 3
    if (tierScore(candidate.garrison_tier) >= 4 && tierScore(hero.garrison_tier) >= 4) score += 2
    if (candidate.tags.some((tag) => hero.tags.includes(tag))) score += 1
    return { candidate, score }
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name)).slice(0, 3)
}

function buildProgression(hero: Hero) {
  const role = strongestRole(hero)
  const highValue = role.score >= 5 || hero.tags.includes('long-term')
  return [
    { title: 'Unlock and stars', copy: hero.is_f2p ? 'Use repeatable free-to-play shard sources first. Avoid universal shards until the hero has a clear long-term place in your roster.' : 'Confirm a reliable shard source before committing universal shards or paid resources.' },
    { title: 'Levels and skills', copy: `Level for deployment capacity, then prioritise the published skills that support ${role.label.toLowerCase()}. Keep secondary-role skills behind the main battle plan.` },
    { title: 'Widgets', copy: highValue ? 'Widgets are justified after the hero is established in your primary formation and core skills are funded.' : 'Treat widgets as a late investment. Save them for a higher-rated or longer-lived hero unless this hero fills a specific roster gap.' },
    { title: 'Exclusive Gear', copy: highValue ? 'Develop Exclusive Gear in measured breakpoints after stars and priority skills. Stop at a useful breakpoint rather than spreading materials across several heroes.' : 'Keep Exclusive Gear conservative until the hero proves durable in your active formation.' },
  ]
}

function GuidanceList({ items }: { items: string[] }) {
  return <ul className="hero-companion-guidance-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>
}

function HeroCompanionDetail({ hero, heroes }: { hero: Hero; heroes: Hero[] }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const availability = [hero.is_f2p === true ? 'Free-to-play accessible' : null, hero.is_vip === true ? 'VIP hero' : null].filter((item): item is string => Boolean(item))
  const synergies = buildSynergies(hero, heroes)
  const progression = buildProgression(hero)
  const role = strongestRole(hero)
  const formationTitle = `${formatLabel(hero.troop_type)} ${role.label.toLowerCase()}`

  return <main className="hero-companion-page hero-companion-page--detail">
    <nav className="hero-companion-breadcrumbs" aria-label="Breadcrumb"><Link to="/companion/heroes">Hero Companion</Link><span aria-hidden="true">›</span><span>{hero.name}</span></nav>
    <section className="hero-companion-hero"><div className="hero-companion-hero__art"><HeroPortrait hero={hero} /><span className="hero-companion-generation">Generation {hero.generation ?? '—'}</span></div><div className="hero-companion-hero__content"><p className="eyebrow">Kingshot Companion</p><h1>{hero.name}</h1><p className="hero-companion-role"><RarityBadge rarity={hero.rarity} /> {formatLabel(hero.troop_type)} hero</p><p className="hero-companion-lead">{hero.description || 'A full Companion overview for this hero has not yet been published.'}</p><div className="hero-companion-tags" aria-label="Hero classification"><RarityBadge rarity={hero.rarity} /><span>{formatLabel(hero.troop_type)}</span><span>Generation {hero.generation ?? '—'}</span>{availability.map((item) => <span key={item}>{item}</span>)}</div></div></section>
    <nav className="hero-companion-jump-nav" aria-label="Hero guide sections"><a href="#ratings">Ratings</a><a href="#skills">Skills</a><a href="#guidance">Best use</a><a href="#formations">Formations</a><a href="#synergies">Synergies</a><a href="#progression">Progression</a></nav>
    <section className="hero-companion-summary" aria-label="Hero summary"><article className="hero-companion-summary__primary"><p className="eyebrow">Best use</p><h2>{hero.best_use || 'Guidance pending'}</h2><p>This recommendation reflects the currently published Forge assessment.</p></article><article><span>Troop type</span><strong>{formatLabel(hero.troop_type)}</strong></article><article><span>Rarity</span><strong><RarityBadge rarity={hero.rarity} /></strong></article><article><span>Availability</span><strong>{availability.length ? availability.join(' · ') : 'Standard availability'}</strong></article></section>
    {hasGeneration6Guide(hero) && <section className="hero-companion-related-guide" aria-label="Generation 6 hero guide"><div><p className="eyebrow">Generation 6 guide</p><h2>Yang, Sophia &amp; Triton</h2><p>Compare acquisition, build order, battlefield roles, F2P priorities and the leading-vs-joining rally mechanic.</p></div><Link className="hero-companion-related-guide__link" to={GENERATION_6_GUIDE_PATH}>Read the complete Gen 6 guide <span aria-hidden="true">→</span></Link></section>}
    <section id="ratings" className="hero-companion-section hero-companion-section--ratings"><div className="hero-companion-section__heading hero-companion-ratings-heading"><div><p className="eyebrow">Forge assessment</p><h2>Best-use ratings</h2></div><p>Activity-specific ratings combine an easy five-star view with the published Forge tier and supporting guidance.</p></div><div className="hero-companion-ratings"><RatingCard label="PvP Rally Lead" value={hero.rally_tier} description="Value when leading an alliance rally in player-versus-player combat." /><RatingCard label="PvP Garrison Lead" value={hero.garrison_tier} description="Value when leading the defence of a city or structure." /><RatingCard label="Bear Rally Lead" value={hero.bear_tier} description="Value when leading an Alliance Bear Hunt rally." /><RatingCard label="PvP / Bear Joiner" value={hero.joiner_tier} description="Value when joining another player’s rally. Event-specific separation will follow governed editorial review." /></div></section>
    <section className="hero-companion-layout"><div className="hero-companion-main-column">
      <section id="guidance" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Battle guidance</p><h2>How to use {hero.name}</h2></div></div><p className="hero-companion-copy">{hero.description || 'Detailed hero guidance has not yet been published.'}</p><div className="hero-companion-strength-grid"><article><h3>Strengths</h3><GuidanceList items={buildStrengths(hero)} /></article><article><h3>Weaknesses</h3><GuidanceList items={buildWeaknesses(hero)} /></article></div></section>
      <section id="skills" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Published content</p><h2>Skills and progression</h2></div><p>Only reviewed and published canonical skills are shown here.</p></div><PublishedHeroSkills heroSlug={hero.slug} heroName={hero.name} /></section>
      <section id="formations" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Recommended formation</p><h2>{formationTitle}</h2></div></div><div className="hero-companion-formation"><div><span>Lead role</span><strong>{role.label}</strong></div><div><span>Troop focus</span><strong>{formatLabel(hero.troop_type)}</strong></div><div><span>Published grade</span><strong>{role.score ? 'Priority' : 'Situational'}</strong></div></div><GuidanceList items={[`Place ${hero.name} in the lead slot only when using their strongest published role.`, 'Pair with complementary troop coverage and a support hero whose published rating strengthens the same battle mode.', 'Do not treat this formation as a fixed universal line-up; generation, shard access and the rest of your published roster still matter.']} /></section>
      <section id="synergies" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Roster planning</p><h2>Hero synergies</h2></div><p>Recommendations are derived only from the currently published Hero catalogue.</p></div>{synergies.length ? <div className="hero-companion-synergies">{synergies.map(({ candidate }) => <Link key={candidate.id} to={`/companion/heroes/${candidate.slug || candidate.id}`} className="hero-companion-synergy-card"><HeroPortrait hero={candidate} compact /><div><span>{formatLabel(candidate.troop_type)} · Gen {candidate.generation ?? '—'}</span><h3>{candidate.name}</h3><p>{candidate.troop_type !== hero.troop_type ? `Adds ${formatLabel(candidate.troop_type)} coverage for a balanced formation.` : `Shares compatible ${formatLabel(candidate.troop_type)} and battle-role strengths.`}</p></div></Link>)}</div> : <p className="hero-companion-copy">No complementary published heroes are available yet.</p>}</section>
      <section id="progression" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Investment plan</p><h2>Hero progression recommendations</h2></div><p>Guidance uses published ratings, availability and classification. It does not invent unpublished costs or breakpoints.</p></div><div className="hero-companion-progression">{progression.map((step, index) => <article key={step.title}><span>{index + 1}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></article>)}</div></section>
      {hero.tags.length > 0 && <section className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Classification</p><h2>Tags</h2></div></div><div className="hero-companion-tags">{hero.tags.map((tag) => <span key={tag}>{formatLabel(tag)}</span>)}</div></section>}
    </div><aside className="hero-companion-sidebar"><section className="hero-companion-panel hero-companion-trust"><p className="eyebrow">Forge trust</p><h2>Source details</h2><dl><div><dt>Source</dt><dd>{hero.source_name || 'Not recorded'}</dd></div><div><dt>Verification</dt><dd>{hero.source_verified || 'Not recorded'}</dd></div><div><dt>Source updated</dt><dd>{formatDate(hero.source_updated_at)}</dd></div><div><dt>Forge updated</dt><dd>{formatDate(hero.updated_at)}</dd></div>{hero.source_accuracy_score !== null && <div><dt>Accuracy score</dt><dd>{hero.source_accuracy_score}%</dd></div>}</dl>{hero.source_url && <a href={hero.source_url} target="_blank" rel="noreferrer" className="hero-companion-source-link">Open source reference</a>}</section><section className="hero-companion-panel hero-companion-feedback"><span className="hero-companion-feedback__icon" aria-hidden="true">💡</span><p className="eyebrow">Help improve Forge</p><h2>Something not right?</h2><p>Request an update or report an issue with {hero.name}’s data.</p><button type="button" className="hero-companion-feedback__button" onClick={() => setFeedbackOpen(true)}>Report an issue</button></section></aside></section>
    <ForgeConnections dataset="heroes" id={hero.id} />
    <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} entityType="hero" entityId={hero.id} entityName={hero.name} />
  </main>
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
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load the Hero Companion.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadHeroes()
    return () => { cancelled = true }
  }, [])

  const selectedHero = useMemo(() => heroes.find((hero) => hero.slug === heroId || hero.id === heroId), [heroId, heroes])
  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return heroes
    return heroes.filter((hero) => [hero.name, hero.troop_type, hero.rarity, rarityCode(hero.rarity), String(hero.generation ?? ''), ...hero.tags].some((value) => value.toLowerCase().includes(query)))
  }, [heroes, search])

  if (loading) return <main className="hero-companion-page"><p>Loading Hero Companion…</p></main>
  if (error) return <main className="hero-companion-page"><h1>Hero Companion unavailable</h1><p>{error}</p></main>
  if (heroId) return selectedHero ? <HeroCompanionDetail hero={selectedHero} heroes={heroes} /> : <main className="hero-companion-page"><h1>Hero not found</h1><Link to="/companion/heroes">Return to Hero Companion</Link></main>

  return <main className="hero-companion-page"><section className="hero-companion-heading"><div><p className="eyebrow">Kingshot Companion</p><h1>Heroes</h1><p>Explore published hero ratings, skills, formations and trusted Forge guidance.</p></div><div className="hero-companion-count"><strong>{heroes.length}</strong><span>published heroes</span></div></section><section className="hero-companion-toolbar"><label htmlFor="hero-companion-search">Search heroes</label><input id="hero-companion-search" type="search" value={search} placeholder="Search by name, troop type, R, SR, SSR or tag" onChange={(event) => setSearch(event.target.value)} /><span>{filteredHeroes.length} results</span></section><section className="hero-companion-list">{filteredHeroes.map((hero) => <Link key={hero.id} to={`/companion/heroes/${hero.slug || hero.id}`} className="hero-companion-card"><HeroPortrait hero={hero} compact /><div className="hero-companion-card__content"><div className="hero-companion-card__meta"><RarityBadge rarity={hero.rarity} /><span>Gen {hero.generation ?? '—'}</span></div><h2>{hero.name}</h2><p>{formatLabel(hero.troop_type)}</p><div className="hero-companion-card__ratings"><span>Rally <span className="hero-companion-card__rating-stars" aria-label={starLabel(tierScore(hero.rally_tier))}>{'★'.repeat(tierScore(hero.rally_tier))}{'☆'.repeat(5 - tierScore(hero.rally_tier))}</span></span><span>Bear <span className="hero-companion-card__rating-stars" aria-label={starLabel(tierScore(hero.bear_tier))}>{'★'.repeat(tierScore(hero.bear_tier))}{'☆'.repeat(5 - tierScore(hero.bear_tier))}</span></span></div></div></Link>)}</section>{filteredHeroes.length === 0 && <section className="hero-companion-empty"><h2>No heroes found</h2><p>Try a different name, troop type, rarity or tag.</p></section>}</main>
}
