import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  companionCategoryLabel,
} from '../features/companion/itemData'
import { useCompanionItems } from '../features/companion/useCompanionItems'
import CompanionItemMedia from '../features/companion/CompanionItemMedia'
import '../styles/companionIndex.css'

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function includesQuery(
  query: string,
  values: readonly string[],
): boolean {
  if (!query) return true
  const haystack = values.join(' ').toLocaleLowerCase()
  return query.split(/\s+/).every((term) => haystack.includes(term))
}

export default function CompanionIndexPage() {
  const { items, loading, error, updatedAt } = useCompanionItems()
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') ?? '').trim().toLocaleLowerCase()
  const category = params.get('category') ?? ''
  const trust = params.get('trust') ?? ''

  const categories = useMemo(() => [
    ...new Set(items.map((item) => item.category).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right)), [items])

  const filtered = useMemo(() => items.filter((item) => {
    if (category && item.category !== category) return false
    if (trust && item.trustState !== trust) return false

    return includesQuery(query, [
      item.name,
      ...item.aliases,
      item.categoryLabel,
      item.summary,
      item.trustLabel,
      ...item.tags,
    ])
  }), [category, items, query, trust])

  function setFilter(name: string, value: string): void {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
  }

  function clearFilters(): void {
    setParams({}, { replace: true })
  }

  return (
    <main className="companion-index-page">
      <section className="companion-index-hero">
        <div>
          <p className="eyebrow">Kingshot Forge Companion</p>
          <h1>One connected index for Kingshot knowledge</h1>
          <p>
            Browse canonical Forge destinations, item identities and the
            published systems that use them. Unsupported facts remain visibly
            unavailable rather than being guessed.
          </p>
        </div>
        <dl className="companion-index-hero__facts">
          <div>
            <dt>Published items</dt>
            <dd>{loading ? '…' : items.length}</dd>
          </div>
          <div>
            <dt>Media status</dt>
            <dd>Checksum-backed preview media</dd>
          </div>
          <div>
            <dt>Projection updated</dt>
            <dd>{formatDate(updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="companion-family-grid" aria-labelledby="companion-families-title">
        <div className="companion-section-heading">
          <div>
            <p className="eyebrow">Published families</p>
            <h2 id="companion-families-title">Start with a complete Companion area</h2>
          </div>
        </div>
        <div className="companion-family-grid__items">
          <Link to="/buildings" className="companion-family-card">
            <span aria-hidden="true">🏛️</span>
            <div>
              <h3>Buildings</h3>
              <p>Published progression, effects, sources and Building Planner links.</p>
            </div>
          </Link>
          <Link to="/calculators/buildings" className="companion-family-card">
            <span aria-hidden="true">🧮</span>
            <div>
              <h3>Building Planner</h3>
              <p>Calculate published upgrade resources and construction time.</p>
            </div>
          </Link>
          <Link to="/companion/heroes" className="companion-family-card">
            <span aria-hidden="true">🦸</span>
            <div>
              <h3>Hero Companion</h3>
              <p>Browse published hero roles, ratings, skills and progression guidance.</p>
            </div>
          </Link>
          <Link to="/guides/flamedragon-tyrant-event-guide" className="companion-family-card">
            <span aria-hidden="true">🐉</span>
            <div>
              <h3>Flamedragon Tyrant</h3>
              <p>Plan the event timeline, battlefield safety, F2P tasks, Palace strategy and rewards.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="companion-item-catalogue" aria-labelledby="companion-items-title">
        <div className="companion-section-heading">
          <div>
            <p className="eyebrow">Canonical item identities</p>
            <h2 id="companion-items-title">Items and resources</h2>
          </div>
          <p>
            Approved preview media is checksum-backed. Gameplay facts remain
            explicitly research-needed where the intake does not support them.
          </p>
        </div>

        <div className="companion-index-controls">
          <label className="companion-index-search">
            <span>Search items</span>
            <input
              type="search"
              value={params.get('q') ?? ''}
              onChange={(event) => setFilter('q', event.target.value)}
              placeholder="Search Truegold, gear materials, stamina…"
            />
          </label>
          <label>
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => setFilter('category', event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {companionCategoryLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Trust state</span>
            <select
              value={trust}
              onChange={(event) => setFilter('trust', event.target.value)}
            >
              <option value="">All trust states</option>
              <option value="verified">Verified</option>
              <option value="confirmed">Confirmed</option>
              <option value="provisional">Provisional</option>
              <option value="research_needed">Research needed</option>
            </select>
          </label>
          {(query || category || trust) && (
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {loading && (
          <p className="companion-index-status" role="status">
            Loading the published Companion item projection…
          </p>
        )}
        {error && (
          <div className="companion-index-status companion-index-status--error" role="alert">
            <strong>Item catalogue unavailable</strong>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <>
            <p className="companion-index-result-count" aria-live="polite">
              {filtered.length} of {items.length} published items
            </p>
            {filtered.length ? (
              <div className="companion-item-grid">
                {filtered.map((item) => (
                  <Link
                    key={item.key}
                    to={item.canonicalUrl}
                    className="companion-item-card"
                  >
                    <div className="companion-item-card__media">
                      <CompanionItemMedia
                        imageUrl={item.imageUrl}
                        alt={item.imageAltText || `${item.name} item artwork`}
                        role={item.mediaRole}
                        compact={item.mediaRole === 'compact_icon'}
                      />
                    </div>
                    <div className="companion-item-card__body">
                      <div className="companion-item-card__meta">
                        <span>{item.categoryLabel}</span>
                        <span className={`companion-trust companion-trust--${item.trustState}`}>
                          {item.trustLabel}
                        </span>
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.summary}</p>
                      <small>
                        {item.relationships.length} governed connection{item.relationships.length === 1 ? '' : 's'}
                      </small>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="companion-index-empty">
                <strong>No published items match those filters.</strong>
                <p>Try a broader search or clear one of the filters.</p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="companion-trust-guide" aria-labelledby="companion-trust-title">
        <div>
          <p className="eyebrow">Forge trust language</p>
          <h2 id="companion-trust-title">What the states mean</h2>
        </div>
        <dl>
          <div>
            <dt>Verified</dt>
            <dd>Direct or independently corroborated evidence supports the material facts.</dd>
          </div>
          <div>
            <dt>Confirmed</dt>
            <dd>A published Forge dataset supports the current item relationship.</dd>
          </div>
          <div>
            <dt>Provisional</dt>
            <dd>The relationship is supported, but the complete description is not yet published.</dd>
          </div>
          <div>
            <dt>Research needed</dt>
            <dd>Important source or usage details still require editorial verification.</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
