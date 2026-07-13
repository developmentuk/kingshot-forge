import { Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import ArtStudioPage from './pages/ArtStudioPage'
import CharacterLibraryPage from './pages/CharacterLibraryPage'
import ChatStudioPage from './pages/ChatStudioPage'
import CodexPage from './pages/CodexPage'
import CompatibilityPage from './pages/CompatibilityPage'
import GiftCodesPage from './pages/GiftCodesPage'
import HomePage from './pages/HomePage'
import MyForgePage from './pages/MyForgePage'
import NameStudioPage from './pages/NameStudioPage'
import PlayerLookupPage from './pages/PlayerLookupPage'
import RoadmapPage from './pages/RoadmapPage'
import SupabaseTestPage from './pages/SupabaseTestPage'
import './App.css'
import KingdomExplorerPage from './pages/KingdomExplorerPage'
import KvkTrackerPage from './pages/KvkTrackerPage'
import ReleaseNotesPage from './pages/ReleaseNotesPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />

        <Route
          path="name-studio"
          element={<NameStudioPage />}
        />

        <Route
          path="chat-studio"
          element={<ChatStudioPage />}
        />

        <Route
          path="art-studio"
          element={<ArtStudioPage />}
        />

        <Route
          path="characters"
          element={<CharacterLibraryPage />}
        />

        <Route
          path="compatibility"
          element={<CompatibilityPage />}
        />

        <Route
          path="codex"
          element={<CodexPage />}
        />

        <Route
          path="roadmap"
          element={<RoadmapPage />}
        />

        <Route
          path="my-forge"
          element={<MyForgePage />}
        />

        <Route
          path="gift-codes"
          element={<GiftCodesPage />}
        />

        <Route
          path="player-lookup"
          element={<PlayerLookupPage />}
        />

        <Route
          path="supabase-test"
          element={<SupabaseTestPage />}
        />

        <Route
          path="kingdom-explorer"
          element={<KingdomExplorerPage />}
        />

        <Route
          path="kvk-tracker"
          element={<KvkTrackerPage />}
        />
      </Route>
      <Route
  path="release-notes"
  element={<ReleaseNotesPage />}
/>
    </Routes>
  )
}

export default App