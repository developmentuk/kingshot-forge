import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import PublishedHeroSkills from '../components/heroes/PublishedHeroSkills'
import { getHeroCatalogue } from '../services/heroService'
import type { Hero, HeroTier } from '../types/hero'
import './HeroCompanionPage.css'
import './HeroCompanionEnhancements.css'
import './HeroCompanionMilestone3.css'

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

function tierClassName(tier: HeroTier | null) {
  return `hero-companion-rating hero-companion-rating--${String(tier || 'na').replace('+', '-plus').toLowerCase()}`
}

function tierScore(tier: HeroTier | null) {
  return ({ 'S+': 6, S: 5, A: 4, B: 3, C: 2, D: 1 } as Record<string, number>)[tier || ''] || 0
}

function HeroPortrait({ hero, compact = false }: { hero: Hero; compact?: boolean }) {
  return <div className={`hero-companion-portrait${compact ? ' hero-companion-portrait--compact' : ''}`}>{hero.portrait_url ? <img src={hero.portrait_url} alt={`${hero.name} portrait`} /> : <span aria-hidden="true">⚔️</span>}</div>
}

function RatingCard({ label, value, description }: { label: string; value: HeroTier | null; description: string }) {
  return <article className={tierClassName(value)}><div className="hero-companion-rating__header"><span>{label}</span><strong className="hero-companion-rating__grade">{value || '—'}</strong></div><p>{description}</p></article>
}

function buildStrengths(hero: Hero) {
  const items: string[] = []
  if (tierScore(hero.rally_tier) >= 4) items.push(`Strong rally leadership (${hero.rally_tier})`)
  if (tierScore(hero.garrison_tier) >= 4) items.push(`Reliable garrison value (${hero.garrison_tier})`)
  if (tierScore(hero.bear_tier) >= 4) items.push(`High Bear Hunt value (${hero.bear_tier})`)
  if (tierScore(hero.joiner_tier) >= 4) items.push(`Effective rally-joiner skill set (${hero.joiner_tier})`)
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

function GuidanceList({ items }: { items: string[] }) {
  return <ul className="hero-companion-guidance-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>
}

function HeroCompanionDetail({ hero, heroes }: { hero: Hero; heroes: Hero[] }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const availability = [hero.is_f2p === true ? 'Free-to-play accessible' : null, hero.is_vip === true ? 'VIP hero' : null].filter((item): item is string => Boolean(item))
  const synergies = buildSynergies(hero, heroes)
  const formationTitle = `${formatLabel(hero.troop_type)} ${tierScore(hero.rally_tier) >= tierScore(hero.garrison_tier) ? 'offensive rally' : 'defensive garrison'}`

  return <main className="hero-companion-page hero-companion-page--detail">
    <nav className="hero-companion-breadcrumbs" aria-label="Breadcrumb"><Link to="/companion/heroes">Hero Companion</Link><span aria-hidden="true">›</span><span>{hero.name}</span></nav>
    <section className="hero-companion-hero"><div className="hero-companion-hero__art"><HeroPortrait hero={hero} /><span className="hero-companion-generation">Generation {hero.generation ?? '—'}</span></div><div className="hero-companion-hero__content"><p className="eyebrow">Kingshot Companion</p><h1>{hero.name}</h1><p className="hero-companion-role">{formatLabel(hero.rarity)} {formatLabel(hero.troop_type)} hero</p><p className="hero-companion-lead">{hero.description || 'A full Companion overview for this hero has not yet been published.'}</p><div className="hero-companion-tags" aria-label="Hero classification"><span>{formatLabel(hero.rarity)}</span><span>{formatLabel(hero.troop_type)}</span><span>Generation {hero.generation ?? '—'}</span>{availability.map((item) => <span key={item}>{item}</span>)}</div></div></section>
    <nav className="hero-companion-jump-nav" aria-label="Hero guide sections"><a href="#ratings">Ratings</a><a href="#skills">Skills</a><a href="#guidance">Best use</a><a href="#formations">Formations</a><a href="#synergies">Synergies</a></nav>
    <section className="hero-companion-summary" aria-label="Hero summary"><article className="hero-companion-summary__primary"><p className="eyebrow">Best use</p><h2>{hero.best_use || 'Guidance pending'}</h2><p>This recommendation reflects the currently published Forge assessment.</p></article><article><span>Troop type</span><strong>{formatLabel(hero.troop_type)}</strong></article><article><span>Rarity</span><strong>{formatLabel(hero.rarity)}</strong></article><article><span>Availability</span><strong>{availability.length ? availability.join(' · ') : 'Standard availability'}</strong></article></section>
    <section id="ratings" className="hero-companion-section hero-companion-section--ratings"><div className="hero-companion-section__heading hero-companion-ratings-heading"><div><p className="eyebrow">Forge assessment</p><h2>Hero ratings</h2></div><p>See at a glance where {hero.name} performs best across the main battle roles.</p></div><div className="hero-companion-ratings"><RatingCard label="Rally" value={hero.rally_tier} description="Value when leading an alliance rally." /><RatingCard label="Garrison" value={hero.garrison_tier} description="Value when defending a city or structure." /><RatingCard label="Bear Hunt" value={hero.bear_tier} description="Value in Alliance Bear Hunt formations." /><RatingCard label="Rally joiner" value={hero.joiner_tier} description="Value when joining another player’s rally." /></div></section>
    <section className="hero-companion-layout"><div className="hero-companion-main-column">
      <section id="guidance" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Battle guidance</p><h2>How to use {hero.name}</h2></div></div><p className="hero-companion-copy">{hero.description || 'Detailed hero guidance has not yet been published.'}</p><div className="hero-companion-strength-grid"><article><h3>Strengths</h3><GuidanceList items={buildStrengths(hero)} /></article><article><h3>Weaknesses</h3><GuidanceList items={buildWeaknesses(hero)} /></article></div></section>
      <section id="skills" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Published content</p><h2>Skills and progression</h2></div><p>Only reviewed and published canonical skills are shown here.</p></div><PublishedHeroSkills heroSlug={hero.slug} heroName={hero.name} /></section>
      <section id="formations" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Recommended formation</p><h2>{formationTitle}</h2></div></div><p className="hero-companion-copy">{hero.best_use || 'Use this hero in the role supported by their highest published rating.'}</p><GuidanceList items={[`Place ${hero.name} in the lead slot when using their strongest published role.`, 'Pair with complementary infantry, cavalry and archer coverage rather than duplicating the same weakness.', 'Use the published skill order below to decide which abilities deserve resources first.']} /></section>
      <section id="synergies" className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Roster planning</p><h2>Hero synergies</h2></div><p>Recommendations are derived from the currently published Hero catalogue.</p></div>{synergies.length ? <div className="hero-companion-synergies">{synergies.map(({ candidate }) => <Link key={candidate.id} to={`/companion/heroes/${candidate.slug || candidate.id}`} className="hero-companion-synergy-card"><HeroPortrait hero={candidate} compact /><div><span>{formatLabel(candidate.troop_type)} · Gen {candidate.generation ?? '—'}</span><h3>{candidate.name}</h3><p>{candidate.troop_type !== hero.troop_type ? `Adds ${formatLabel(candidate.troop_type)} coverage for a balanced formation.` : `Shares compatible ${formatLabel(candidate.troop_type)} and battle-role strengths.`}</p></div></Link>)}</div> : <p className="hero-companion-copy">No complementary published heroes are available yet.</p>}</section>
      {hero.tags.length > 0 && <section className="hero-companion-panel"><div className="hero-companion-section__heading"><div><p className="eyebrow">Classification</p><h2>Tags</h2></div></div><div className="hero-companion-tags">{hero.tags.map((tag) => <span key={tag}>{formatLabel(tag)}</span>)}</div></section>}
    </div><aside className="hero-companion-sidebar"><section className="hero-companion-panel hero-companion-trust"><p className="eyebrow">Forge trust</p><h2>Source details</h2><dl><div><dt>Source</dt><dd>{hero.source_name || 'Not recorded'}</dd></div><div><dt>Verification</dt><dd>{hero.source_verified || 'Not recorded'}</dd></div><div><dt>Source updated</dt><dd>{formatDate(hero.source_updated_at)}</dd></div><div><dt>Forge updated</dt><dd>{formatDate(hero.updated_at)}</dd></div>{hero.source_accuracy_score !== null && <div><dt>Accuracy score</dt><dd>{hero.source_accuracy_score}%</dd></div>}</dl>{hero.source_url && <a href={hero.source_url} target="_blank" rel="noreferrer" className="hero-companion-source-link">Open source reference</a>}</section><section className="hero-companion-panel hero-companion-feedback"><span className="hero-companion-feedback__icon" aria-hidden="true">💡</span><p className="eyebrow">Help improve Forge</p><h2>Something not right?</h2><p>Request an update or report an issue with {hero.name}’s data.</p><button type="button" className="hero-companion-feedback__button" onClick={() => setFeedbackOpen(true)}>Report an issue</button></section></aside></section>
    <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} entityType="hero" entityId={hero.id} entityName={hero.name} />
  </main>
}

export default function HeroCompanionPage() {
  const { heroId } = useParams<{ heroId?: string }>()
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => { let cancelled = false; async function loadHeroes() { setLoading(true); setError(''); try { const catalogue = await getHeroCatalogue(); if (!cancelled) setHeroes(catalogue) } catch (loadError) { if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load the Hero Companion.') } finally { if (!cancelled) setLoading(false) } } void loadHeroes(); return () => { cancelled = true } }, [])
  const selectedHero = useMemo(() => heroes.find((hero) => hero.slug === heroId || hero.id === heroId), [heroId, heroes])
  const filteredHeroes = useMemo(() => { const query = search.trim().toLowerCase(); if (!query) return heroes; return heroes.filter((hero) => [hero.name, hero.troop_type, hero.rarity, String(hero.generation ?? ''), ...hero.tags].some((value) => value.toLowerCase().includes(query))) }, [heroes, search])
  if (loading) return <main className="hero-companion-page"><p>Loading Hero Companion…</p></main>
  if (error) return <main className="hero-companion-page"><h1>Hero Companion unavailable</h1><p>{error}</p></main>
  if (heroId) return selectedHero ? <HeroCompanionDetail hero={selectedHero} heroes={heroes} /> : <main className="hero-companion-page"><h1>Hero not found</h1><Link to="/companion/heroes">Return to Hero Companion</Link></main>
  return <main className="hero-companion-page"><section className="hero-companion-heading"><div><p className="eyebrow">Kingshot Companion</p><h1>Heroes</h1><p>Explore published hero ratings, skills, formations and trusted Forge guidance.</p></div><div className="hero-companion-count"><strong>{heroes.length}</strong><span>published heroes</span></div></section><section className="hero-companion-toolbar"><label htmlFor="hero-companion-search">Search heroes</label><input id="hero-companion-search" type="search" value={search} placeholder="Search by name, troop type, rarity or tag" onChange={(event) => setSearch(event.target.value)} /><span>{filteredHeroes.length} results</span></section><section className="hero-companion-list">{filteredHeroes.map((hero) => <Link key={hero.id} to={`/companion/heroes/${hero.slug || hero.id}`} className="hero-companion-card"><HeroPortrait hero={hero} compact /><div className="hero-companion-card__content"><div className="hero-companion-card__meta"><span>{formatLabel(hero.rarity)}</span><span>Gen {hero.generation ?? '—'}</span></div><h2>{hero.name}</h2><p>{formatLabel(hero.troop_type)}</p><div className="hero-companion-card__ratings"><span>Rally {hero.rally_tier || '—'}</span><span>Bear {hero.bear_tier || '—'}</span></div></div></Link>)}</section>{filteredHeroes.length === 0 && <section className="hero-companion-empty"><h2>No heroes found</h2><p>Try a different name, troop type, rarity or tag.</p></section>}</main>
}
