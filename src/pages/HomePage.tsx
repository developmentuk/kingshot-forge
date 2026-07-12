import { Link } from 'react-router'

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Unofficial Kingshot Community Tool</p>

          <h1>
            Forge text that
            <span> stands out in Kingshot.</span>
          </h1>

          <p className="hero__description">
            Create distinctive player names, banners and copy-and-paste chat
            art using character sets tested inside the game.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" to="/name-studio">
              Forge a Name
            </Link>

            <Link className="button button--secondary" to="/chat-studio">
              Explore Chat Tools
            </Link>
          </div>

          <p className="support-message">
            Free to use. Support helps fund character testing, new templates
            and future features.
          </p>
        </div>

        <div className="hero__preview">
          <div className="preview-window">
            <div className="preview-window__header">
              <span />
              <span />
              <span />
            </div>

            <div className="preview-window__content">
              <p className="preview-window__label">Forged name</p>

              <div className="preview-name">༺ᚱȺᛉ༻</div>

              <div className="preview-banner">
                <span>✦ ━━━━━━━━━ ✦</span>
                <strong>📢 RALLY NOW 📢</strong>
                <span>✦ ━━━━━━━━━ ✦</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Choose a Forge</p>

          <h2>Create something for Kingshot</h2>

          <p>
            Start with one of the available tools. More features will be added
            as Kingshot Forge grows.
          </p>
        </div>

        <div className="tools">
          <article className="tool-card tool-card--featured">
            <div className="tool-card__top">
              <span className="tool-card__icon">👑</span>
              <span className="tool-card__status">Available</span>
            </div>

            <h3>Name Forge</h3>

            <p>
              Turn an ordinary name into a fantasy, runic, elegant or cute
              Kingshot name.
            </p>

            <Link className="tool-card__link" to="/name-studio">
              Open Name Forge
              <span>→</span>
            </Link>
          </article>

          <article className="tool-card">
            <div className="tool-card__top">
              <span className="tool-card__icon">🎨</span>
              <span className="tool-card__status">In development</span>
            </div>

            <h3>Chat Forge</h3>

            <p>
              Create announcements, banners, event alerts and funny messages.
            </p>

            <Link className="tool-card__link" to="/chat-studio">
              Open Chat Forge
              <span>→</span>
            </Link>
          </article>

          <article className="tool-card">
            <div className="tool-card__top">
              <span className="tool-card__icon">🐉</span>
              <span className="tool-card__status">Planned</span>
            </div>

            <h3>Art Forge</h3>

            <p>
              Browse cats, flags, castles, dragons and copy-ready chat artwork.
            </p>

            <Link className="tool-card__link" to="/art-studio">
              Open Art Forge
              <span>→</span>
            </Link>
          </article>
        </div>
      </section>
    </>
  )
}

export default HomePage