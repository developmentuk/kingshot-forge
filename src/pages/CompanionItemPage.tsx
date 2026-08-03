import { Link, useParams } from 'react-router-dom'

import {
  relationshipTypeLabel,
} from '../features/companion/itemData'
import { useCompanionItems } from '../features/companion/useCompanionItems'
import CompanionItemMedia from '../features/companion/CompanionItemMedia'
import '../styles/companionIndex.css'

function formatDate(value: string): string {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return value || 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function CompanionItemPage() {
  const { itemKey = '' } = useParams()
  const { items, loading, error, updatedAt } = useCompanionItems()
  const item = items.find((candidate) => candidate.key === itemKey)

  if (loading) {
    return (
      <main className="companion-item-page">
        <p className="companion-index-status" role="status">
          Loading the published item record…
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="companion-item-page">
        <div className="companion-index-status companion-index-status--error" role="alert">
          <strong>Item record unavailable</strong>
          <p>{error}</p>
          <Link to="/companion">Return to the Companion Index</Link>
        </div>
      </main>
    )
  }

  if (!item) {
    return (
      <main className="companion-item-page">
        <div className="companion-index-empty">
          <p className="eyebrow">Kingshot Forge Companion</p>
          <h1>Item not found</h1>
          <p>
            This item does not have a published canonical Companion record.
          </p>
          <Link to="/companion">Browse published Companion items</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="companion-item-page">
      <nav className="companion-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion Index</Link>
        <span aria-hidden="true">›</span>
        <span>{item.name}</span>
      </nav>

      <section className="companion-item-hero">
        <div className="companion-item-hero__media" aria-label="Item media">
          <CompanionItemMedia
            imageUrl={item.imageUrl}
            alt={item.imageAltText || `${item.name} item artwork`}
            role={item.mediaRole}
          />
          <strong>{item.mediaRole ? 'Approved preview media' : 'Media unavailable'}</strong>
          <p>
            {item.mediaRole
              ? 'Owner-declared Creative Commons media is published with checksum-backed intake evidence.'
              : 'No approved media is mapped to this canonical item in the current intake.'}
          </p>
        </div>
        <div className="companion-item-hero__content">
          <p className="eyebrow">{item.categoryLabel}</p>
          <h1>{item.name}</h1>
          {item.aliases.length > 0 && (
            <p className="companion-item-aliases">
              Also known as {item.aliases.join(', ')}
            </p>
          )}
          <p className="companion-item-lead">{item.summary}</p>
          <div className="companion-item-tags" aria-label="Item classification">
            <span className={`companion-trust companion-trust--${item.trustState}`}>
              {item.trustLabel}
            </span>
            {item.tags.map((tag) => <span key={tag}>{tag.replaceAll('-', ' ')}</span>)}
          </div>
        </div>
      </section>

      <section className="companion-item-layout">
        <div className="companion-item-main">
          <section className="companion-item-panel" aria-labelledby="item-use-title">
            <div className="companion-section-heading">
              <div>
                <p className="eyebrow">Published scope</p>
                <h2 id="item-use-title">What Forge currently supports</h2>
              </div>
            </div>
            <p>{item.summary}</p>
            <div className={`companion-item-verification companion-item-verification--${item.trustState}`}>
              <strong>{item.trustLabel}</strong>
              <p>{item.verificationNote}</p>
            </div>
          </section>

          <section className="companion-item-panel" aria-labelledby="item-connections-title">
            <div className="companion-section-heading">
              <div>
                <p className="eyebrow">Governed relationships</p>
                <h2 id="item-connections-title">Connected systems</h2>
              </div>
              <p>
                Planned destinations remain visibly unavailable until their own
                canonical Player and Admin vertical slices are complete.
              </p>
            </div>
            <div className="companion-relationship-grid">
              {item.relationships.map((relationship) => {
                const content = (
                  <>
                    <span>{relationshipTypeLabel(relationship.type)}</span>
                    <h3>{relationship.label}</h3>
                    <code>{relationship.targetForgeId}</code>
                    <small>
                      {relationship.availability === 'available'
                        ? 'Open published destination'
                        : 'Destination planned'}
                    </small>
                  </>
                )

                return relationship.route ? (
                  <Link
                    key={`${relationship.type}:${relationship.targetForgeId}`}
                    to={relationship.route}
                    className="companion-relationship-card companion-relationship-card--available"
                  >
                    {content}
                  </Link>
                ) : (
                  <article
                    key={`${relationship.type}:${relationship.targetForgeId}`}
                    className="companion-relationship-card companion-relationship-card--planned"
                  >
                    {content}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="companion-item-panel" aria-labelledby="item-unknown-title">
            <div className="companion-section-heading">
              <div>
                <p className="eyebrow">Truth boundary</p>
                <h2 id="item-unknown-title">Not yet published</h2>
              </div>
            </div>
            <p>
              Forge has not published unsupported drop rates, pack values,
              unlock dates, costs or strategy claims for this item. Those
              details remain unavailable until evidence and editorial review
              support them.
            </p>
          </section>
        </div>

        <aside className="companion-item-sidebar">
          <section className="companion-item-panel companion-item-source">
            <p className="eyebrow">Forge trust</p>
            <h2>Source details</h2>
            <dl>
              <div>
                <dt>Canonical ID</dt>
                <dd><code>{item.forgeId}</code></dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{item.sourceName}</dd>
              </div>
              <div>
                <dt>Source reference</dt>
                <dd><code>{item.sourceReference}</code></dd>
              </div>
              <div>
                <dt>Projection updated</dt>
                <dd>{formatDate(updatedAt ?? item.sourceUpdatedAt)}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{item.confidenceLabel}</dd>
              </div>
              <div>
                <dt>Media rights</dt>
                <dd>{item.rightsStatus.replaceAll('_', ' ')}</dd>
              </div>
            </dl>
            <p className="companion-item-rights-note">{item.rightsNote}</p>
          </section>

          <section className="companion-item-panel">
            <p className="eyebrow">Need another item?</p>
            <h2>Continue browsing</h2>
            <Link to="/companion" className="companion-item-primary-link">
              Open Companion Index
            </Link>
            <Link to={`/search?q=${encodeURIComponent(item.name)}`}>
              Search all Forge knowledge
            </Link>
          </section>
        </aside>
      </section>
    </main>
  )
}
