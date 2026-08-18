import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import "./App.css";
import "./features/admin/recordEditor/recordEditor.css";
import "./features/admin/verification/verificationCentre.css";
import "./features/player-identity/playerIdentity.css";
import "./styles/playerDomain.css";
import "./styles/playerProgressionPolish.css";
import "./styles/playerPlanningPolish.css";
import "./styles/passportPolish.css";
// Keep Hero Collection polish last so it overrides the legacy Hero card rules.
import "./styles/heroCollectionPolish.css";
import "./styles/forgeUxPolish.css";
import "./styles/kingshotSimulator.css";
import "./features/admin/renderEngineCalibration.css";
import "./features/admin/visionStudio.css";
import "./features/art-studio/artStudioAcceptance.css";

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
import Generation6HeroGuidePage from "./pages/Generation6HeroGuidePage";
import FlamedragonTyrantGuidePage from "./pages/FlamedragonTyrantGuidePage";
import VikingVengeanceGuidePage from "./pages/VikingVengeanceGuidePage";
import GuidesHubPage from "./pages/GuidesHubPage";
import GuideArticlePage from "./features/guides/GuideArticlePage";
import CompanionIndexPage from "./pages/CompanionIndexPage";
import CompanionItemPage from "./pages/CompanionItemPage";
import SearchPage from "./features/search/SearchPage";
import IslandRouteOptimizerPage from "./features/island-route-optimizer/IslandRouteOptimizerPage";

import { DataEngineDiagnosticsPage } from "./pages/admin/DataEngineDiagnosticsPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { AdminDatasetsPage } from "./features/admin/AdminDatasetsPage";
import { AdminDatasetDetailPage } from "./features/admin/AdminDatasetDetailPage";
import { FeedbackAdminPage } from "./features/admin/FeedbackAdminPage";
import { SearchExplorerPage } from "./features/admin/SearchExplorerPage";
import { CommunityArtModerationPage } from "./features/admin/CommunityArtModerationPage";
import {
  DatasetVerificationPage,
  VerificationCentrePage,
  VerificationRunPage,
} from "./features/admin/verification";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { PrivatePlayerIdentityPage } from "./features/player-identity/PrivatePlayerIdentityPage";
import { PlayerSupportWorkspacePage } from "./features/player-identity/PlayerSupportWorkspacePage";
import { GiftRedemptionOperationsPage } from "./features/admin/GiftRedemptionOperationsPage";
import { RenderEngineCalibrationPage } from "./features/admin/RenderEngineCalibrationPage";
import { VisionStudioPage } from "./features/admin/VisionStudioPage";
import { VisionAccountLinkingAcceptancePage } from "./features/admin/VisionAccountLinkingAcceptancePage";
import { EditorialImportManagerPage } from "./features/admin/EditorialImportManagerPage";
import { EditorialOperationsPage } from "./features/admin/editorial/EditorialOperationsPage";
import { AnalyticsPage } from "./features/admin/AnalyticsPage";
import { ForgeContentStudioPage } from "./features/admin/ForgeContentStudioPage";
import BuildingsBrowserPage from "./pages/BuildingsBrowserPage";
import BuildingCalculatorsPage from "./pages/BuildingCalculatorsPage";
import WorkspaceRoute from "./components/WorkspaceRoute";
import WorkspaceHomePage from "./pages/WorkspaceHomePage";
import OperationsStatusPage from "./pages/OperationsStatusPage";
import OperationsDashboardPage from "./pages/OperationsDashboardPage";
import { UserDetailPage, UserManagementPage } from "./features/operations/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import { ContributorRolePage, JoinForgePage } from "./pages/JoinForgePage";
import ContributorApplicationPage from "./pages/ContributorApplicationPage";
import MyContributorApplicationPage from "./pages/MyContributorApplicationPage";
import ContributorApplicationsPage from "./features/operations/ContributorApplicationsPage";
import ContributorApplicationDetailPage from "./features/operations/ContributorApplicationDetailPage";
import ArtStudioAcceptancePage from "./features/art-studio/ArtStudioAcceptancePage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

const developmentAcceptanceRoute = import.meta.env.DEV
  ? <Route path="art-studio/acceptance" element={<ArtStudioAcceptancePage />} />
  : null;

function App() {
  return (
    <Routes>
      <Route path="auth/callback" element={<AuthCallbackPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="name-studio" element={<NameStudioPage />} />
        <Route path="art-studio" element={<ArtStudioPage />} />
        {developmentAcceptanceRoute}
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
        <Route path="search" element={<SearchPage />} />
        <Route path="companion" element={<CompanionIndexPage />} />
        <Route path="companion/items/:itemKey" element={<CompanionItemPage />} />
        <Route path="buildings" element={<BuildingsBrowserPage />} />
        <Route path="buildings/:buildingKey" element={<BuildingsBrowserPage />} />
        <Route path="buildings/:buildingKey/progression" element={<BuildingsBrowserPage />} />
        <Route path="calculators/buildings" element={<BuildingCalculatorsPage />} />
        <Route path="calculators/island-chest-route-optimizer" element={<IslandRouteOptimizerPage />} />
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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="join" element={<JoinForgePage />} />
        <Route path="join/:roleSlug" element={<ContributorRolePage />} />
        <Route path="join/apply" element={<ContributorApplicationPage />} />
        <Route path="join/my-application" element={<MyContributorApplicationPage />} />
        <Route path="companion/heroes" element={<HeroCompanionPage />} />
        <Route path="companion/heroes/:heroId" element={<HeroCompanionPage />} />
        <Route path="guides" element={<GuidesHubPage />} />
        <Route path="guides/kingshot-generation-6-heroes-yang-sophia-triton-guide" element={<Generation6HeroGuidePage />} />
        <Route path="guides/flamedragon-tyrant-event-guide" element={<FlamedragonTyrantGuidePage />} />
        <Route path="guides/kingshot-viking-vengeance-event-guide" element={<VikingVengeanceGuidePage />} />
        <Route path="guides/:guideSlug" element={<GuideArticlePage />} />

        <Route path="operations" element={<WorkspaceRoute workspaceId="operations"><OperationsDashboardPage /></WorkspaceRoute>} />
        <Route path="operations/users" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="users.read"><UserManagementPage /></ProtectedRoute></WorkspaceRoute>} />
        <Route path="operations/users/:userId" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="users.read"><UserDetailPage /></ProtectedRoute></WorkspaceRoute>} />
        <Route path="operations/applications" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="applications.read"><ContributorApplicationsPage /></ProtectedRoute></WorkspaceRoute>} />
        <Route path="operations/applications/:applicationId" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="applications.read"><ContributorApplicationDetailPage /></ProtectedRoute></WorkspaceRoute>} />
        <Route path="operations/roles" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="platform.users.manage"><OperationsStatusPage title="Roles and Permissions" /></ProtectedRoute></WorkspaceRoute>} />
        <Route path="operations/audit-log" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="platform.users.manage"><OperationsStatusPage title="Audit Log" /></ProtectedRoute></WorkspaceRoute>} />
        <Route path="operations/feature-flags" element={<WorkspaceRoute workspaceId="operations"><ProtectedRoute permission="platform.users.manage"><OperationsStatusPage title="Feature Flags" /></WorkspaceRoute>} />
        <Route path="contributor" element={<WorkspaceRoute workspaceId="contributor"><WorkspaceHomePage workspaceId="contributor" /></WorkspaceRoute>} />
        <Route path="contributor/drafts" element={<WorkspaceRoute workspaceId="contributor"><OperationsStatusPage title="My drafts" /></WorkspaceRoute>} />
        <Route path="contributor/submissions" element={<WorkspaceRoute workspaceId="contributor"><OperationsStatusPage title="Submission history" /></WorkspaceRoute>} />
        <Route path="creator" element={<WorkspaceRoute workspaceId="creator"><WorkspaceHomePage workspaceId="creator" /></WorkspaceRoute>} />
        <Route path="creator/content" element={<WorkspaceRoute workspaceId="creator"><OperationsStatusPage title="Creator content" /></WorkspaceRoute>} />
        <Route path="creator/verification" element={<WorkspaceRoute workspaceId="creator"><OperationsStatusPage title="Creator verification" /></WorkspaceRoute>} />
        <Route path="moderation" element={<WorkspaceRoute workspaceId="moderation"><WorkspaceHomePage workspaceId="moderation" /></WorkspaceRoute>} />
        <Route path="moderation/reports" element={<WorkspaceRoute workspaceId="moderation"><OperationsStatusPage title="Reports" /></WorkspaceRoute>} />

        <Route path="admin" element={<ProtectedRoute permission="cms.view"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="admin/analytics" element={<ProtectedRoute permission="cms.view"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="admin/content-studio" element={<ProtectedRoute permission="cms.view"><ForgeContentStudioPage /></ProtectedRoute>} />
        <Route path="admin/datasets" element={<ProtectedRoute permission="cms.view"><AdminDatasetsPage /></ProtectedRoute>} />
        <Route path="admin/data/:datasetId" element={<ProtectedRoute permission="cms.view"><AdminDatasetDetailPage /></ProtectedRoute>} />
        <Route path="admin/feedback" element={<ProtectedRoute permission="cms.view"><FeedbackAdminPage /></ProtectedRoute>} />
        <Route path="admin/community-art" element={<ProtectedRoute permission="moderation.manage"><CommunityArtModerationPage /></ProtectedRoute>} />
        <Route path="admin/data-engine" element={<ProtectedRoute permission="cms.view"><DataEngineDiagnosticsPage /></ProtectedRoute>} />
        <Route path="admin/verification" element={<ProtectedRoute permission="cms.view"><VerificationCentrePage /></ProtectedRoute>} />
        <Route path="admin/verification/runs/:runId" element={<ProtectedRoute permission="cms.view"><VerificationRunPage /></ProtectedRoute>} />
        <Route path="admin/verification/:datasetId" element={<ProtectedRoute permission="cms.view"><DatasetVerificationPage /></ProtectedRoute>} />
        <Route path="admin/player-identity" element={<ProtectedRoute permission="platform.users.manage"><PlayerSupportWorkspacePage /></ProtectedRoute>} />
        <Route path="admin/player-identity/:caseId" element={<ProtectedRoute permission="platform.users.manage"><PlayerSupportWorkspacePage /></ProtectedRoute>} />
        <Route path="admin/gift-redemption" element={<ProtectedRoute permission="cms.view"><GiftRedemptionOperationsPage /></ProtectedRoute>} />
        <Route path="admin/render-engine" element={<ProtectedRoute permission="render_engine.view"><RenderEngineCalibrationPage /></ProtectedRoute>} />
        <Route path="admin/vision-studio" element={<ProtectedRoute permission="cms.view"><VisionStudioPage /></ProtectedRoute>} />
        <Route path="admin/vision/account-linking-acceptance" element={<ProtectedRoute permission="vision.scan.create"><VisionAccountLinkingAcceptancePage /></ProtectedRoute>} />
        <Route path="admin/imports" element={<ProtectedRoute permission="cms.import.run"><EditorialImportManagerPage /></ProtectedRoute>} />
        <Route path="admin/history" element={<ProtectedRoute permission="cms.history.view"><EditorialOperationsPage mode="history" /></ProtectedRoute>} />
        <Route path="admin/search" element={<ProtectedRoute permission="cms.view"><SearchExplorerPage /></ProtectedRoute>} />
        <Route path="admin/publish" element={<ProtectedRoute permission="cms.publish"><EditorialOperationsPage mode="publish" /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
