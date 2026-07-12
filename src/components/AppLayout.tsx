import { NavLink, Outlet } from 'react-router'

const feedbackFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLScFO6lIdyTiczPQkSbinR1tGWNXw01opy77VgX1003FF6z86Q/viewform?usp=publish-editor'

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="navigation">
          <NavLink className="brand" to="/">
            <span className="brand__icon">⚒️</span>

            <span>
              <strong>Kingshot</strong>
              <small>Forge</small>
            </span>
          </NavLink>

          <div className="navigation__links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/name-studio">Names</NavLink>
            <NavLink to="/chat-studio">Chat</NavLink>
            <NavLink to="/art-studio">Art</NavLink>
            <NavLink to="/characters">Characters</NavLink>
            <NavLink to="/my-forge">My Forge</NavLink>
            <NavLink to="/roadmap">Roadmap</NavLink>
          </div>

          <a
            className="button button--coffee navigation__support"
            href="https://buymeacoffee.com/jrcs1981"
            target="_blank"
            rel="noreferrer"
          >
            ☕ Support
          </a>
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <strong>Kingshot Forge</strong>
          <p>Community-made and unofficial.</p>
        </div>

        <div className="footer__links">
          <NavLink to="/my-forge">My Forge</NavLink>
          <NavLink to="/roadmap">Roadmap</NavLink>
          <NavLink to="/codex">Codex</NavLink>
          <NavLink to="/compatibility">
            Compatibility
          </NavLink>

          <a
            href={feedbackFormUrl}
            target="_blank"
            rel="noreferrer"
          >
            Beta Feedback
          </a>

          <a
            className="footer__support"
            href="https://buymeacoffee.com/jrcs1981"
            target="_blank"
            rel="noreferrer"
          >
            Support the project
          </a>
        </div>
      </footer>

      <a
        className="feedback-button"
        href={feedbackFormUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Give beta feedback"
      >
        <span className="feedback-button__icon">💬</span>

        <span className="feedback-button__text">
          <strong>Beta Feedback</strong>
          <small>
            Report an issue or suggest a feature
          </small>
        </span>
      </a>
    </div>
  )
}

export default AppLayout