import { Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import './App.css'
import HomePage from './pages/HomePage'
import NameStudioPage from './pages/NameStudioPage'
import ArtStudioPage from './pages/ArtStudioPage'
import ChatStudioPage from './pages/ChatStudioPage'
import CharacterLibraryPage from './pages/CharacterLibraryPage'
import CompatibilityPage from './pages/CompatibilityPage'
import CodexPage from './pages/CodexPage'
import MyForgePage from './pages/MyForgePage'
import RoadmapPage from './pages/RoadmapPage'
import ReleaseNotesPage from './pages/ReleaseNotesPage'
import PlayerLookupPage from './pages/PlayerLookupPage'
import GiftCodesPage from './pages/GiftCodesPage'
import KingdomExplorerPage from './pages/KingdomExplorerPage'
import KingdomCommunityPage from './pages/KingdomCommunityPage'
import KvkTrackerPage from './pages/KvkTrackerPage'
import AllianceDirectoryPage from './pages/AllianceDirectoryPage'
import AllianceCommunityPage from './pages/AllianceCommunityPage'
import AllianceManagementPage from './pages/AllianceManagementPage'

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
          path="art-studio"
          element={<ArtStudioPage />}
        />

        <Route
          path="chat-studio"
          element={<ChatStudioPage />}
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
          path="player-lookup"
          element={<PlayerLookupPage />}
        />

        <Route
          path="gift-codes"
          element={<GiftCodesPage />}
        />

        <Route
          path="kingdom-explorer"
          element={<KingdomExplorerPage />}
        />

        <Route
          path="kingdom-community"
          element={<KingdomCommunityPage />}
        />

        <Route
          path="kvk-tracker"
          element={<KvkTrackerPage />}
        />

        <Route
          path="my-forge"
          element={<MyForgePage />}
        />

        <Route
          path="roadmap"
          element={<RoadmapPage />}
        />

        <Route
          path="release-notes"
          element={<ReleaseNotesPage />}
        />
      </Route>
      <Route
  path="alliance-directory"
  element={<AllianceDirectoryPage />}
/>

<Route
  path="alliances/:allianceId"
  element={<AllianceCommunityPage />}
/>

<Route
  path="alliances/:allianceId/manage"
  element={<AllianceManagementPage />}
/>
    </Routes>
  )
}

export default App