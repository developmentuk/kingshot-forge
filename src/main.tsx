import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { PlayerIdentityProvider } from './context/PlayerIdentityContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlayerIdentityProvider>
          <App />
        </PlayerIdentityProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)