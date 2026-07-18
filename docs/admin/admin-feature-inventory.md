# Admin feature inventory — Release 0.8.0

This inventory records implementation evidence from the 0.8.0 starting point.
It does not infer production readiness from a route existing.

| Route | Feature | Implementation evidence | Status | Required next action |
| --- | --- | --- | --- | --- |
| `/admin` | Admin Dashboard | `AdminDashboardPage` renders role, dataset and operational cards | Functional but incomplete | Move into Operations and replace unsupported metrics with safe states |
| `/admin/datasets` | Dataset catalogue | `AdminDatasetsPage` and dataset registry load real registrations | Functional but incomplete | Keep as Operations content domain; test all dataset states |
| `/admin/data/:datasetId` | Dataset editor | Connected editorial record editor, permissions and workflow actions exist | Functional but incomplete | Complete route-by-route mutation and mobile validation |
| `/admin/verification` | Verification Centre | Verification page, dataset links and run views exist | Functional but incomplete | Validate authenticated API and editorial permissions |
| `/admin/verification/:datasetId` | Dataset verification | Dataset-specific verification page exists | Functional but incomplete | Add focused runtime/error tests |
| `/admin/verification/runs/:runId` | Verification run | Run detail page exists | Functional but incomplete | Add empty/not-found and mobile validation |
| `/admin/feedback` | Feedback Queue | `FeedbackAdminPage` loads and mutates feedback | Functional but incomplete | Move capability-appropriate actions into Moderation |
| `/admin/community-art` | Community Art moderation | Queue, filters, approve/reject/publish and notes exist | Functional but incomplete | Validate moderator-only access and audit coverage |
| `/admin/data-engine` | Data Engine diagnostics | `DataEngineDiagnosticsPage`/panel provides diagnostics | Functional but incomplete | Operations shell and safe unavailable states |
| `/admin/player-identity` | Player support | `PlayerSupportWorkspacePage` exists | Partial, protected | Complete authenticated runtime and audit review |
| `/operations/users` | Forge User Management | `UserManagementPage`, server projection and paginated API | Partial, implemented | Run authenticated role/security and scale validation |
| `/operations/users/:userId` | Forge Identity detail | `UserDetailPage`, linked-player safe summary and audit history | Partial, implemented | Run authenticated mutation and responsive validation |
| `/admin/gift-redemption` | Gift Redemption operations | Provider health, metrics, catalogue and safe response handling exist | Functional but incomplete | Operations placement; validate all server permissions |
| `/admin/imports` | Import Manager | Placeholder route says Sprint 6 | UI shell only | Mark planned or implement a bounded vertical slice |
| `/admin/history` | Version History | Placeholder route says Sprint 6 | UI shell only | Mark planned or implement a bounded vertical slice |
| `/admin/search` | Global Search | Placeholder route with no search behavior | UI shell only | Mark planned; do not show as operational |
| `/admin/publish` | Publish Centre | Placeholder route says Sprint 6 | UI shell only | Mark planned or consolidate with editorial workflow |

## Cross-cutting checks

- Route declaration: all entries above exist in `src/App.tsx`.
- Browser rendering: static component evidence exists for real pages; an
  authenticated browser run is still required for API success and RLS claims.
- Authorization: direct routes and the User Management API use explicit
  capability checks; browser workspace visibility remains presentation only.
- Mutations: real editorial, moderation and Gift operations have mutation code;
  placeholder routes have none.
- Empty/error states: present in the real feature slices to varying degrees;
  each route needs focused validation rather than a blanket claim.
- Documentation/tests: existing repository validators cover several domains;
  no single Admin feature contract currently covers every route.
- Responsive behavior: legacy Admin CSS contains narrow-screen rules, but the
  full route set has not yet been validated at all four release widths.

## Classification policy

“Functional but incomplete” means the route has meaningful implementation but
still lacks one or more release gates. “UI shell only” means the page is a
placeholder and must not be presented as an operational tool. “Broken security
boundary” is used for Player Identity because the route declaration does not
apply the same explicit permission guard as neighboring Admin routes.
