import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'

import OasisIslandPage from './features/oasis-island/OasisIslandPage'
import fixture from '../fixtures/oasis-001a-publication/oasis-publication.fixture.json'
import type { OasisAcceptanceDataset } from './features/oasis-island/oasisIslandData'
import './index.css'

const privateMediaModules = import.meta.glob<string>(
  '../fixtures/oasis-001a-publication/media/oasis-island/**/*.webp',
  { eager: true, import: 'default', query: '?url' },
)
const privateMediaByPlannedPublicUrl = new Map(
  Object.entries(privateMediaModules).map(([path, url]) => [
    `/${path.replace('../fixtures/oasis-001a-publication/', '')}`,
    url,
  ]),
)
const acceptanceDataset = {
  ...fixture,
  records: fixture.records.map((record) => ({
    ...record,
    media: record.media.map((media) => ({
      ...media,
      url: privateMediaByPlannedPublicUrl.get(media.url) ?? media.url,
    })),
  })),
} as OasisAcceptanceDataset

if (privateMediaByPlannedPublicUrl.size !== 112) {
  throw new Error(`Oasis acceptance requires 111 private derivatives and one placeholder; found ${privateMediaByPlannedPublicUrl.size}.`)
}

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
