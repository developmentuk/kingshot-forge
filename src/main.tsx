import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'

import { AuthProvider } from './context/AuthContext'
import { RoleProvider } from './context/RoleContext'
import { PlayerIdentityProvider } from './context/PlayerIdentityContext'
import { FavouritesProvider } from './context/FavouritesContext'
import AnalyticsRuntime from './components/AnalyticsRuntime'
import ForgeErrorBoundary from './components/ForgeErrorBoundary'
import SentryUserRuntime from './components/SentryUserRuntime'
import { initSentry } from './observability/sentry'

import './index.css'
import './styles/kingshot-chat-calibration.css'
import './styles/kingshot-art-renderer.css'
import './styles/observability.css'

function runSentryPreviewVerification() {
  if (__DEPLOYMENT_ENV__ !== 'preview') return

  const url = new URL(window.location.href)
  if (url.searchParams.get('sentry_verify') !== 'source-map') return

  url.searchParams.delete('sentry_verify')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)

  window.setTimeout(() => {
    throw new Error('SENTRY-OBSERVABILITY-001 application source verification')
  }, 0)
}

initSentry()
runSentryPreviewVerification()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ForgeErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AnalyticsRuntime />
          <SentryUserRuntime />
          <RoleProvider>
            <PlayerIdentityProvider>
              <FavouritesProvider>
                <App />
              </FavouritesProvider>
            </PlayerIdentityProvider>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </ForgeErrorBoundary>
  </StrictMode>,
)
