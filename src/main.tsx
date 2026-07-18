import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'

import { AuthProvider } from './context/AuthContext'
import { RoleProvider } from './context/RoleContext'
import { PlayerIdentityProvider } from './context/PlayerIdentityContext'

import './index.css'
import './styles/kingshot-chat-calibration.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <PlayerIdentityProvider>
            <App />
          </PlayerIdentityProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
