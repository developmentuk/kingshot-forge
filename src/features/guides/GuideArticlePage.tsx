import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { guideArticlesBySlug } from './articles'
import './guideArticle.css'

const connectionLabels = {
  guide: 'Related guide',
  hero: 'Hero Companion',
  item: 'Companion item',
  tool: 'Forge tool',
  community: 'Forge area',
} as const

export default function GuideArticlePage() {
  const { guideSlug = '' } = useParams()
  const article = guideArticlesBySlug[guideSlug]

  useEffect(() => {
    if (!article) return undefined
    const previousTitle = document.title
    document.title = `${article.title} | Kingshot Forge`
    return () => { document.title = previousTitle }
  }, [article])

  if (!article) {
    return (
      <main className="guides-hub">
        <nav className="guides-hub__breadcrumbs" aria-label="Breadcrumb"><Link to="/guides">Guides</Link><span aria-hidden="true">›</span><span>Not found</span></nav>
        <section className="guides-hub__catalogue"><p className="eyebrow">Guide library</p><h1>Guide not found</h1><p>This guide is not currently published in Kingshot Forge.</p><Link to="/guides">Return to the Guides library</Link></section>
      </main>
    )
  }

  return (
    <main className={`guide-article guide-article--${article.theme}`}>
      <nav className="guide-article__breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion</Link><span aria-hidden="true">›</span><Link to="/guides">Guides</Link><span aria-hidden="true">›</span><span>{article.shortTitle}</span>
      </nav>

      <article>
        <header className="guide-article__hero">
          <p className="eyebrow">{article.eyebrow}</p>
          <h1>{article.title}</h1>
          <p className="guide-article__lead">{article.intro}</p>
          <div className="guide-article__tags" aria-label="Guide tags">
            {article.tags.map((tag) => <Link key={tag} to={`/guides?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}
          </div>
        </header>

        <div className="guide-article__source" role="note"><strong>Source handling:</strong> {article.sourceNote}</div>
        {article.alert && <div className="guide-article__alert" role="note">{article.alert}</div>}

        <nav className="guide-article__jump" aria-label="Article sections">
          {article.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </nav>

        <section className="guide-article__related" aria-labelledby="related-forge-title">
          <p className="eyebrow">Connected Forge knowledge</p>
          <h2 id="related-forge-title">Related in Kingshot Forge</h2>
          <p>These links connect this strategy to published Forge guides, Hero Companion pages, item identities and tools that support the same decisions.</p>
          <div className="guide-article__related-grid">
            {article.connections.map((connection) => (
              <Link key={`${connection.kind}-${connection.to}-${connection.label}`} to={connection.to} className="guide-article__related-card">
                <span>{connectionLabels[connection.kind]}</span>
                <h3>{connection.label}</h3>
                <p>{connection.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {article.sections.map((section) => (
          <section key={section.id} className={`guide-article__panel${section.id === 'faq' ? ' guide-article__faq' : ''}`} id={section.id}>
            <p className="eyebrow">{section.eyebrow}</p>
            <h2>{section.title}</h2>
            {section.content}
          </section>
        ))}

        <section className="guide-article__panel">
          <p className="eyebrow">Continue exploring</p>
          <h2>More Kingshot Forge guides</h2>
          <p>{article.summary}</p>
          <p><Link className="guide-article__link" to="/guides">Browse the complete Guides library →</Link></p>
        </section>
      </article>
    </main>
  )
}
