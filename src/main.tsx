import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'

import { AuthProvider } from './context/AuthContext'
import { RoleProvider } from './context/RoleContext'
import { PlayerIdentityProvider } from './context/PlayerIdentityContext'
import { FavouritesProvider } from './context/FavouritesContext'
import AnalyticsRuntime from './components/AnalyticsRuntime'

import './index.css'
import './styles/kingshot-chat-calibration.css'
import './styles/kingshot-art-renderer.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsRuntime />
        <RoleProvider>
          <PlayerIdentityProvider>
            <FavouritesProvider>
              <App />
            </FavouritesProvider>
          </PlayerIdentityProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
