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

initSentry()

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
