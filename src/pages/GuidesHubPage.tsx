import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { guideRegistry } from '../features/guides/guideRegistry'
import type { GuideRegistryEntry } from '../features/guides/guideTypes'
import '../features/guides/guideArticle.css'

const voyageGuide: GuideRegistryEntry = {
  slug: 'kingshot-voyage-of-light-guide',
  path: '/guides/kingshot-voyage-of-light-guide',
  title: 'Kingshot Voyage of Light: Milestones, Compasses & Planner Guide',
  shortTitle: 'Voyage of Light',
  summary: 'Plan Voyager Team uptime, Compass use and milestone progress from Forge’s governed Voyage dataset, with disputed treasure mechanics kept visibly unresolved.',
  icon: '⛵',
  type: 'Event guide',
  tags: ['Voyage of Light', 'Voyager Teams', 'Compasses', 'Tidal Treasure', 'Forgehammer', 'Gear Boost Custom Chest', 'F2P', 'milestones', 'resource management'],
}

const guideCatalogue = [voyageGuide, ...guideRegistry]
const guideTags = [...new Set(guideCatalogue.flatMap((guide) => guide.tags))].sort((left, right) => left.localeCompare(right))

export default function GuidesHubPage() {
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') ?? '').trim().toLocaleLowerCase()
  const activeTag = params.get('tag') ?? ''

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Kingshot Guides: Events, Heroes & Strategy | Kingshot Forge'
    return () => { document.title = previousTitle }
  }, [])

  const filtered = useMemo(() => guideCatalogue.filter((guide) => {
    if (activeTag && !guide.tags.includes(activeTag)) return false
    if (!query) return true
    const haystack = [guide.title, guide.shortTitle, guide.summary, guide.type, ...guide.tags]
      .join(' ')
      .toLocaleLowerCase()
    return query.split(/\s+/).every((term) => haystack.includes(term))
  }), [activeTag, query])

  function setQuery(value: string) {
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  function setTag(tag: string) {
    const next = new URLSearchParams(params)
    if (tag && tag !== activeTag) next.set('tag', tag)
    else next.delete('tag')
    setParams(next, { replace: true })
  }

  function clearFilters() {
    setParams({}, { replace: true })
  }

  return (
    <main className="guides-hub">
      <nav className="guides-hub__breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion</Link><span aria-hidden="true">›</span><span>Guides</span>
      </nav>

      <header className="guides-hub__hero">
        <p className="eyebrow">Kingshot Forge Guides</p>
        <h1>Connected strategy guides for Kingshot</h1>
        <p className="guides-hub__lead">Browse Forge guides by event, system, hero, play style or resource. Every new article uses tags for discovery and links back into relevant Companion items, Hero Companion pages, tools and related guides.</p>
        <div className="guides-hub__tag-list" aria-label="Popular guide tags">
          {guideTags.slice(0, 18).map((tag) => (
            <button key={tag} type="button" aria-pressed={activeTag === tag} onClick={() => setTag(tag)}>{tag}</button>
          ))}
        </div>
      </header>

      <section className="guides-hub__catalogue" aria-labelledby="guide-library-title">
        <p className="eyebrow">Guide library</p>
        <h2 id="guide-library-title">Find the right plan before you spend or fight</h2>
        <div className="guides-hub__controls">
          <label>
            <span>Search guides</span>
            <input type="search" value={params.get('q') ?? ''} onChange={(event) => setQuery(event.target.value)} placeholder="Search KvK, F2P, Truegold, rallies…" />
          </label>
          {(query || activeTag) && <button type="button" onClick={clearFilters}>Clear filters</button>}
        </div>
        <p className="guides-hub__count" aria-live="polite">{filtered.length} of {guideCatalogue.length} published guides{activeTag ? ` tagged “${activeTag}”` : ''}</p>

        {filtered.length ? (
          <div className="guides-hub__grid">
            {filtered.map((guide) => (
              <Link key={guide.path} to={guide.path} className="guides-hub__card">
                <span className="guides-hub__card-icon" aria-hidden="true">{guide.icon}</span>
                <div><span className="eyebrow">{guide.type}</span><h3>{guide.shortTitle}</h3></div>
                <p>{guide.summary}</p>
                <div className="guides-hub__card-meta" aria-label={`${guide.shortTitle} tags`}>
                  {guide.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="guides-hub__empty"><strong>No guides match those filters.</strong><p>Try a broader search or clear the selected tag.</p></div>
        )}
      </section>
    </main>
  )
}
