import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import "./App.css";
import "./features/admin/recordEditor/recordEditor.css";
import "./features/admin/verification/verificationCentre.css";
import "./features/player-identity/playerIdentity.css";
import "./styles/playerDomain.css";
import "./styles/playerProgressionPolish.css";
import "./styles/playerPlanningPolish.css";
// Keep Hero Collection polish last so it overrides the legacy Hero card rules.
import "./styles/heroCollectionPolish.css";

import HomePage from "./pages/HomePage";
import NameStudioPage from "./pages/NameStudioPage";
import ArtStudioPage from "./pages/ArtStudioPage";
import ChatStudioPage from "./pages/ChatStudioPage";
import CharacterLibraryPage from "./pages/CharacterLibraryPage";
import CompatibilityPage from "./pages/CompatibilityPage";
import CodexPage from "./pages/CodexPage";
import MyForgePage from "./pages/MyForgePage";
import RoadmapPage from "./pages/RoadmapPage";
import ReleaseNotesPage from "./pages/ReleaseNotesPage";
import PlayerLookupPage from "./pages/PlayerLookupPage";
import GiftCodesPage from "./pages/GiftCodesPage";
import KingdomExplorerPage from "./pages/KingdomExplorerPage";
import KingdomCommunityPage from "./pages/KingdomCommunityPage";
import KvkTrackerPage from "./pages/KvkTrackerPage";
import AllianceDirectoryPage from "./pages/AllianceDirectoryPage";
import AllianceCommunityPage from "./pages/AllianceCommunityPage";
import AllianceManagementPage from "./pages/AllianceManagementPage";
import TransferProfilePage from "./pages/TransferProfilePage";
import TransferHubPage from "./pages/TransferHubPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import PlayerProfileEditorPage from "./pages/PlayerProfileEditorPage";
import PlayerProgressionPage from "./pages/PlayerProgressionPage";
import PublicPlayerProgressionPage from "./pages/PublicPlayerProgressionPage";
import HeroShowcaseEditorPage from "./pages/HeroShowcaseEditorPage";
import HeroCollectionPage from "./pages/HeroCollectionPage";
import HeroCompanionPage from "./pages/HeroCompanionPage";

import { DataEngineDiagnosticsPage } from "./pages/admin/DataEngineDiagnosticsPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { AdminDatasetsPage } from "./features/admin/AdminDatasetsPage";
import { AdminDatasetDetailPage } from "./features/admin/AdminDatasetDetailPage";
import { FeedbackAdminPage } from "./features/admin/FeedbackAdminPage";
import {
  DatasetVerificationPage,
  VerificationCentrePage,
  VerificationRunPage,
} from "./features/admin/verification";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { PrivatePlayerIdentityPage } from "./features/player-identity/PrivatePlayerIdentityPage";
import { PlayerSupportWorkspacePage } from "./features/player-identity/PlayerSupportWorkspacePage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="name-studio" element={<NameStudioPage />} />
        <Route path="art-studio" element={<ArtStudioPage />} />
        <Route path="chat-studio" element={<ChatStudioPage />} />
        <Route path="characters" element={<CharacterLibraryPage />} />
        <Route path="compatibility" element={<CompatibilityPage />} />
        <Route path="codex" element={<CodexPage />} />
        <Route path="player-lookup" element={<PlayerLookupPage />} />
        <Route path="gift-codes" element={<GiftCodesPage />} />
        <Route path="kingdom-explorer" element={<KingdomExplorerPage />} />
        <Route path="kingdom-community" element={<KingdomCommunityPage />} />
        <Route path="kvk-tracker" element={<KvkTrackerPage />} />
        <Route path="alliance-directory" element={<AllianceDirectoryPage />} />
        <Route path="alliances/:allianceId" element={<AllianceCommunityPage />} />
        <Route path="alliances/:allianceId/manage" element={<AllianceManagementPage />} />
        <Route path="my-forge" element={<MyForgePage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="release-notes" element={<ReleaseNotesPage />} />
        <Route path="transfer-profile" element={<TransferProfilePage />} />
        <Route path="my-forge/transfer-profile" element={<TransferProfilePage />} />
        <Route path="transfer-hub" element={<TransferHubPage />} />
        <Route path="player/:forgeId" element={<PlayerProfilePage />} />
        <Route path="player/:forgeId/progression" element={<PublicPlayerProgressionPage />} />
        <Route path="my-forge/profile" element={<PlayerProfileEditorPage />} />
        <Route path="/my-forge/player-identity" element={<PrivatePlayerIdentityPage />} />
        <Route path="players/:forgeId" element={<PlayerProfilePage />} />
        <Route path="my-forge/progression" element={<PlayerProgressionPage />} />
        <Route path="my-forge/heroes" element={<HeroShowcaseEditorPage />} />
        <Route path="my-forge/hero-collection" element={<HeroCollectionPage />} />
        <Route path="companion/heroes" element={<HeroCompanionPage />} />
        <Route path="companion/heroes/:heroId" element={<HeroCompanionPage />} />

        <Route path="admin" element={<ProtectedRoute permission="cms.view"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="admin/datasets" element={<ProtectedRoute permission="cms.view"><AdminDatasetsPage /></ProtectedRoute>} />
        <Route path="admin/data/:datasetId" element={<ProtectedRoute permission="cms.view"><AdminDatasetDetailPage /></ProtectedRoute>} />
        <Route path="admin/feedback" element={<ProtectedRoute permission="cms.view"><FeedbackAdminPage /></ProtectedRoute>} />
        <Route path="admin/data-engine" element={<ProtectedRoute permission="cms.view"><DataEngineDiagnosticsPage /></ProtectedRoute>} />
        <Route path="admin/verification" element={<ProtectedRoute permission="cms.view"><VerificationCentrePage /></ProtectedRoute>} />
        <Route path="admin/verification/runs/:runId" element={<ProtectedRoute permission="cms.view"><VerificationRunPage /></ProtectedRoute>} />
        <Route path="admin/verification/:datasetId" element={<ProtectedRoute permission="cms.view"><DatasetVerificationPage /></ProtectedRoute>} />
        <Route path="admin/player-identity" element={<PlayerSupportWorkspacePage />} />
        <Route path="admin/player-identity/:caseId" element={<PlayerSupportWorkspacePage />} />
        <Route path="admin/imports" element={<ProtectedRoute permission="cms.import.run"><main className="admin-page"><section className="admin-placeholder-panel"><div className="admin-placeholder-panel__body"><p className="admin-page__eyebrow">Forge Admin CMS</p><h1>Import Manager</h1><p>Import management will be added later in Sprint 6.</p></div></section></main></ProtectedRoute>} />
        <Route path="admin/history" element={<ProtectedRoute permission="cms.history.view"><main className="admin-page"><section className="admin-placeholder-panel"><div className="admin-placeholder-panel__body"><p className="admin-page__eyebrow">Forge Admin CMS</p><h1>Version History</h1><p>Dataset and record history will be added later in Sprint 6.</p></div></section></main></ProtectedRoute>} />
        <Route path="admin/search" element={<ProtectedRoute permission="cms.view"><main className="admin-page"><section className="admin-placeholder-panel"><div className="admin-placeholder-panel__body"><p className="admin-page__eyebrow">Forge Admin CMS</p><h1>Global Search</h1><p>Search across every Forge dataset from one place.</p></div></section></main></ProtectedRoute>} />
        <Route path="admin/publish" element={<ProtectedRoute permission="cms.publish"><main className="admin-page"><section className="admin-placeholder-panel"><div className="admin-placeholder-panel__body"><p className="admin-page__eyebrow">Forge Admin CMS</p><h1>Publish Centre</h1><p>Validation and publishing tools will be added later in Sprint 6.</p></div></section></main></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
