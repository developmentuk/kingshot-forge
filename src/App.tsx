import { Route, Routes } from 'react-router'
import { Analytics } from '@vercel/analytics/react'
import AppLayout from './components/AppLayout'
import ArtStudioPage from './pages/ArtStudioPage'
import CharacterLibraryPage from './pages/CharacterLibraryPage'
import ChatStudioPage from './pages/ChatStudioPage'
import CodexPage from './pages/CodexPage'
import CompatibilityPage from './pages/CompatibilityPage'
import HomePage from './pages/HomePage'
import NameStudioPage from './pages/NameStudioPage'
import RoadmapPage from './pages/RoadmapPage'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="name-studio" element={<NameStudioPage />} />
          <Route path="chat-studio" element={<ChatStudioPage />} />
          <Route path="art-studio" element={<ArtStudioPage />} />
          <Route
            path="characters"
            element={<CharacterLibraryPage />}
          />
          <Route
            path="compatibility"
            element={<CompatibilityPage />}
          />
          <Route path="codex" element={<CodexPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
        </Route>
      </Routes>
      <Analytics />
    </>
  )
}

export default App
