import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'

import OasisIslandPage from './features/oasis-island/OasisIslandPage'
import fixture from './features/oasis-island/acceptance/oasis-publication.fixture.json'
import type { OasisAcceptanceDataset } from './features/oasis-island/oasisIslandData'
import './index.css'

const acceptanceDataset = fixture as OasisAcceptanceDataset

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/oasis-island" element={<OasisIslandPage acceptanceDataset={acceptanceDataset} />} />
        <Route path="/oasis-island/buildings/:buildingId" element={<OasisIslandPage acceptanceDataset={acceptanceDataset} />} />
        <Route path="*" element={<OasisIslandPage acceptanceDataset={acceptanceDataset} />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
