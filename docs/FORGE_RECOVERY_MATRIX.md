# Forge Recovery Matrix — Sprints R1–R4

Status: **R7 Search & Knowledge acceptance complete; exact preview verified**
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
R4 validation head: `bfbd89ec5a230ab50c01dedd3134201d2ab759bc`
Scope: recover completed Forge workspace functionality into the RC3 platform without introducing a second architecture.

Readiness uses evidence, not estimates. “Not ready” means a release gate remains; it does not mean the recovered code is absent.

| Subsystem | Purpose | Current implementation status | Recovery status | Validation status | Source branch(es) | Dependencies | Documentation status | Version 1.0 readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Workspace Engine | Select the current Forge workspace from the URL and expose its navigation contract | Implemented in `workspaceRegistry.ts`, `WorkspaceSwitcher` and `WorkspaceRoute` | Recovered from completed 0.8.0 workspace commit and reconciled with RC3 shell/search | Workspace architecture test and production build pass | `release/0.8.0-operations-centre`, `recovery/0.9.0-rc3-feature-reconciliation` | React Router, `RoleContext`, shared layout | Release 0.8.0 operations documentation and this matrix | **Not ready** — authenticated responsive and deployed smoke evidence remain |
| Workspace Registry | Own workspace labels, routes, groups, capability gates and honest planned/partial labels | Implemented as the single navigation registry | Recovered; duplicate hand-authored admin navigation removed from the active shell | Workspace architecture test passes; direct route guards remain in place | Same as above | Forge permissions and route declarations | `docs/releases/0.8.0-forge-operations-centre.md`, this matrix | **Not ready** — final role-fixture validation remains |
| Workspace Switcher | Let an authorised user move between Player, Contributor, Creator, Moderation and Operations surfaces | Implemented; local preference is convenience only | Recovered and retained | Build passes; browser keyboard/mobile validation pending | `release/0.8.0-operations-centre` | Registry, Auth, Role Context, local storage | Release 0.8.0 operations documentation | **Not ready** |
| Workspace Home | Provide honest workspace landing states and links | Implemented for Operations, Contributor, Creator and Moderation shells | Recovered; links are capability-filtered and planned destinations are non-clickable | Build and workspace checks pass | `release/0.8.0-operations-centre` | Registry, shared Forge styles | Release 0.8.0 release notes | **Not ready** |
| Operations Centre | Group platform, content, player, community and governance operations | Implemented dashboard and grouped navigation | Recovered and connected to existing Admin compatibility routes | Build passes; authenticated end-to-end validation pending | `release/0.8.0-operations-centre` | Registry, existing Admin slices, server permissions | `docs/admin/admin-feature-inventory.md`, release notes | **Not ready** |
| Operations Status | Make deferred capabilities explicit without placeholder links pretending to be live | Implemented status page and disabled planned navigation treatment | Recovered; no new operational feature added | Build passes | `release/0.8.0-operations-centre` | Shared layout and status styling | Release 0.8.0 operations documentation | **Not ready** |
| Forge Identity / User Management | Safely list and inspect Forge users, roles, statuses, linked players and audit history | Implemented server projections, APIs, list/detail UI and guarded mutations | Recovered from completed identity foundation | Identity contract test and build pass; live authenticated validation pending | `release/0.8.0-operations-centre` | Supabase identity tables/RPCs, service-role Auth reads, server actor authorization | `docs/admin/user-management.md`, identity/security docs | **Not ready** — production and responsive evidence remain |
| Contributor Catalogue | Explain voluntary contributor roles and access boundaries | Implemented public `/join` and `/join/:roleSlug` catalogue | Recovered | Build passes; public route smoke pending | `release/0.8.0-operations-centre` | Contributor role data, shared styles | `docs/community/*`, release notes | **Not ready** |
| Contributor Applications | Save, submit and review contributor applications with capability-gated APIs and audit boundaries | Implemented draft/submit, applicant status and Operations review/detail surfaces | Recovered from completed application workflow commits | Contributor architecture test and build pass; authenticated Supabase/RLS validation pending | `release/0.8.0-operations-centre` | Contributor migration, Auth, recruitment service, role capabilities | `docs/community/contributor-application-architecture.md`, privacy/security docs | **Not ready** |
| Creator Workflows | Provide the recovered creator workspace boundary without inventing unfinished content tooling | Creator shell and planned status routes exist; no new creator feature introduced | Recovered shell only; planned work remains explicitly deferred | Build and workspace checks pass | `release/0.8.0-operations-centre` | Registry and role/capability checks | Release 0.8.0 operations documentation | **Not ready** |
| Community Art Moderation | Review, approve, reject and publish community artwork | Existing moderation page/API remains source of truth under Moderation and Operations | Reconciled into registry; no duplicate moderation system created | Existing Art Studio tests plus build are the local evidence; authenticated moderator validation pending | RC3 platform plus `release/0.7.4-community-art-studio` | Art Studio persistence, moderation permission, published projection | Art Studio release/architecture docs and admin inventory | **Not ready** |
| Settings | Give Player View a safe account/settings destination | Implemented Settings surface | Recovered with Identity foundation | Build passes; authenticated UI validation pending | `release/0.8.0-operations-centre` | Auth, workspace registry | Identity release documentation | **Not ready** |
| Role-aware navigation and permissions | Ensure visibility is not treated as authorization and direct routes remain guarded | Registry filters links; `WorkspaceRoute` and `ProtectedRoute` enforce access boundaries | Reconciled; existing server authority preserved | Workspace/Identity tests and build pass; role fixture/browser checks pending | RC3 plus `release/0.8.0-operations-centre` | Role Context, server actor resolution, Supabase RLS | `docs/security/role-capability-matrix.md`, `docs/AEGIS.md` | **Not ready** |
| RC3 Search and Render platform | Preserve the current canonical platform while recovering Workspace functionality | Existing search, relationship and calibration surfaces remain present | Preserved; recovery commits were integrated without restoring their superseded deletions | Full `npm run check` passes; existing lint and bundle-size warnings remain | `recovery/0.9.0-rc3-feature-reconciliation` | Existing services and shared styles | Current RC3 docs | **Not ready** |

## Sprint R5 render and creative inventory baseline

Inventory performed at starting HEAD `b6196010c1bfbaaa828cadeff57a0873362dec3f` on
`recovery/0.9.0-rc3-feature-reconciliation`, before R5 edits.

| Area | Baseline finding | R5 action/status |
| --- | --- | --- |
| Canonical Render Engine | `src/render-engine/` already contains parser, fixed-cell grid, analyser, configuration, device profiles, benchmarks, persistence, simulator and shared types. The public barrel omitted the simulator export. | Reconciled by exporting the simulator from `src/render-engine/index.ts`. |
| Kingshot artwork renderer | `src/components/art/KingshotArtRenderer.tsx` is the active Art Studio adapter and consumes the Render Engine parser, analyser and grid. No competing active artwork renderer was found. | Preserved as the canonical renderer. |
| Calibration Lab | `src/features/admin/RenderEngineCalibrationPage.tsx` and `renderEngineCalibration.css` are present, route-protected at `/admin/render-engine` by `cms.view`, and linked through the existing operations registry. | Preserved; focused and full validation required. |
| Community Art moderation | Moderation was capability-protected but rendered a raw `<pre>` instead of the canonical renderer. | Migrated moderation preview to `KingshotArtRenderer`; retained exact source text for copy and validation. |
| Persistence | Browser-local schema key `forge.renderEngine.calibrationProfiles.v1` and schema filtering are present; no server persistence path exists. | Preserved; focused save/load/reset and malformed-profile validation required. |
| Creative surfaces | Art Studio library, modal and submission previews use `KingshotArtRenderer`; Chat Studio and Name/Banner surfaces have no completed R5 integration to force. | Preserved applicable integrations; no unrelated surface redesign. |
| Route/navigation gaps | Calibration route and capability guard exist; Community Art queue route remains independently protected by `moderation.manage`. | No new permission system or route required. |
| Duplicate/obsolete implementations | No duplicate active Render Engine or Art Studio renderer file found. Legacy moderation CSS targeted the removed raw preview shape. | Legacy selector removed; no renderer file deleted. |

## Sprint R2 runtime validation and hardening

| Area | Evidence | Recovery status | Version 1.0 readiness |
| --- | --- | --- | --- |
| Direct route reconciliation | Duplicate declarations were removed from `src/App.tsx`; User Management, Contributor Applications, roles/audit/flags and Community Art retain explicit capability guards. | Hardened | **Ready for the next authenticated gate** |
| Navigation integrity | `WorkspaceHomePage` renders only active destinations as links; planned and unavailable destinations are disabled presentation states. Operations dashboard links are capability-aware. | Hardened | **Ready for the next authenticated gate** |
| Applicant state handling | Applicant status page now avoids API calls while signed out and exposes loading, signed-out, unavailable and empty states. Recruitment mutations remain server-capability checked per action. | Hardened | **Not ready** — authenticated role fixture still required |
| Operations state handling | User Management, Contributor Applications and application detail preserve loading, empty, error and mutation feedback states; direct routes fail closed. | Validated locally | **Not ready** — authenticated end-to-end evidence still required |
| Community Art moderation | Existing moderation implementation and API remain the source of truth; `moderation.manage` is enforced in the route, registry and server endpoint. | Reconciled and preserved | **Not ready** — authenticated moderator evidence still required |
| Responsive runtime | Local unauthenticated route state was checked at 390, 768 and 1280px. The 390px header overflow was corrected in the canonical shell CSS; all three widths now fit the viewport on the updated local server. | Hardened and locally checked | **Not ready** — authenticated content-density review remains |
| Supabase / RLS | Project `hrvdhjscwitqpwjhnjkm` was inspected read-only. Recovered identity and contributor-application tables have RLS enabled; server-only tables are forced where expected. Policy catalog access returned `451 no_biscuit_no_service`, so policy text was not independently enumerated. | No migration or write required | **Not ready** — live authenticated API/RLS checks remain |
| Role matrix | Static contracts cover Player, Contributor, Content Creator, Moderator, Operations, Admin, multi-role and no-elevated-role capability boundaries. | Contract coverage present | **Not ready** — signed-in runtime fixtures remain |

R2 architectural decision: route visibility and direct-route authorization are separate concerns. The workspace registry remains the navigation contract, while `WorkspaceRoute`, `ProtectedRoute`, server actor capability checks and Supabase RLS remain authoritative. R2 added only boundary/state hardening around recovered functionality; it did not add a second permission model or new workspace feature.

## Sprint R3 authenticated runtime and deployment validation

| Area | Evidence | Recovery status | Version 1.0 readiness |
| --- | --- | --- | --- |
| Safe role fixtures | Read-only inspection found four Auth users, three active role-assignment rows (`owner`, `content_creator`, `beta_tester`) and no contributor applications. No repository-documented test credentials or disposable fixture procedure was present. | Inventory complete; no fixture writes made | **Blocked** — required role coverage still needs approved credentials/fixtures |
| Signed-in runtime | Preview was reachable only through Vercel Authentication; the connected browser had no existing signed-in session. No login, session restoration, capability, workspace switcher or account-isolation claim was made. | Not executable in this environment | **Blocked** |
| Live APIs and RLS | Static server boundaries remain capability-gated. Supabase RLS remains enabled on the recovered Identity, Contributor Application and Community Art tables. No authenticated request or mutation was executed. | Read-only evidence only | **Blocked** — authenticated API/RLS proof remains required |
| Exact-commit deployment | READY previews were created from the R3 documentation candidates: `https://kingshot-forge-1huohvzaw-clarksim-7474s-projects.vercel.app` (`dpl_4FcyuXe1VKXFKHjUVrCTNmFjvyMz`, `f6d85aa...`) and the follow-up `https://kingshot-forge-2az6nyatx-clarksim-7474s-projects.vercel.app` (`dpl_7jEHc5Prj3aBwjgAVYomAw8zsUy8`, current docs candidate `7ed8542...`). Vercel build logs also report pre-existing TypeScript diagnostics outside the recovered Workspace surfaces. | Deployed for controlled smoke; build-risk recorded | **Blocked** — clean Vercel type-check evidence remains required |
| Browser smoke / responsive | Signed-out `/operations`, `/operations/users`, `/operations/applications` and `/admin/community-art` rendered non-blank, guarded states. Exact preview width checks were non-overflowing at 390, 768 and 1280px. No signed-in route state could be rendered. | Deployed signed-out smoke complete | **Blocked** — authenticated content and role checks remain |
| Runtime observability | Exact preview had no runtime logs during the smoke window. Existing project-wide warning: Node `DEP0169` on an older `/api/search` deployment; not attributable to this preview. | Reviewed | **Blocked** — authenticated traffic and broader build diagnostics remain |
| Full validation | `npm run check` passed on the R3 starting head. Existing lint warnings and the Vite >500 kB chunk warning remain unchanged. | Validated locally | **Ready as a local gate; not a release gate** |

R3 outcome: the recovered Workspace platform remained locally buildable but was blocked on authenticated access and clean Vercel diagnostics. Sprint R4 carries that gate forward with isolated temporary fixtures.

## Sprint R4 authenticated fixtures and deployment

| Subsystem | Purpose | Current implementation | Recovery status | Validation status | Source branches | Dependencies | Documentation | Version 1.0 readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Authenticated fixture management | Provision reversible role fixtures without changing production auth design | `scripts/manage-forge-r4-fixtures.mjs` with service-role-only provisioning and cleanup | Implemented for R4 validation | Four fixtures provisioned and cleaned up; zero residual records verified | Current RC3 branch | Supabase Auth, canonical role assignments, preview redirect | `docs/recovery/SPRINT-R4-AUTHENTICATED-FIXTURES-AND-DEPLOYMENT.md` | Ready for next recovery sprint |
| Workspace runtime validation | Prove role-aware shells, direct-route guards and session switching | Existing registry, route guards and workspace shells | Recovered and validated | Player, contributor/content creator, moderator and admin sessions passed targeted checks; session switching and responsive checks passed | RC3 plus recovered Operations history | AuthContext, RoleContext, server actor resolution | R4 recovery document | Ready for next recovery sprint |
| Operations Centre | Provide dashboard, User Management, Applications and Community Art entry points | Existing Operations implementation | Recovered and validated | Admin authenticated preview rendered dashboard and capability-filtered navigation; final exact commit deployed Ready | `release/0.8.0-operations-centre`, current RC3 branch | Operations APIs, Supabase RLS | R2/R3 docs and R4 recovery document | Ready for next recovery sprint |
| Community Art moderation | Review controlled pending submission through moderator capability | Existing Moderation Centre and Community Art queue | Preserved and validated | Moderator authenticated preview rendered moderation workspace and queue entry; fixture was removed after validation | RC3 plus Art Studio foundation | Art Studio persistence, moderation capability, RLS | Art Studio docs and R4 recovery document | Ready for next recovery sprint |
| Vercel TypeScript diagnostics | Keep exact preview candidate deployable | Narrow NodeNext import/result/type-target repairs | Repaired and deployed | Final commit `bfbd89e...` deployed Ready with no TypeScript errors in build logs | Current RC3 branch | Vercel function compiler, NodeNext | R4 recovery document | Ready for next recovery sprint |

R4 performed no migration, RLS change, push, merge, tag or promotion. Temporary fixture records were cleaned up after final browser sign-out. The exact deployed candidate was `bfbd89ec5a230ab50c01dedd3134201d2ab759bc` (`dpl_EVSjynszfzGF9C5T2Pc1j2KLKtAo`).

## Sprint R7 Search & Knowledge Platform recovery

| Subsystem | Current implementation | Recovery status | Validation status | Version 1.0 readiness |
| --- | --- | --- | --- | --- |
| Canonical search API and projections | `/api/search`, shared search contracts, persistent published projections and permission-aware ranking | Recovered and deployed; missing persistent schema was applied through the checked-in migration | Owner-authenticated public search returned published Sophia; Vercel logs recorded 200 responses; index version 4 contains 554 projections | **Accepted for R7 preview** |
| Search Explorer | `/admin/search` with query, dataset, relationship, depth, role simulation and refresh controls | Preserved; refresh request now falls back to the authenticated same-origin cookie when the client has no bearer token | Owner preview rendered persisted rows, successful refresh metadata and `truegold` war-academy matches | **Accepted for R7 preview** |
| Relationship navigation | Hero Companion `ForgeConnections` relationship region and canonical relationship search route | Preserved as the relationship-engine consumer boundary | Sophia detail rendered Forge Connections, related content and Explore all navigation | **Accepted for R7 preview** |
| Public visibility boundary | Published/public result filtering separate from internal Search Explorer visibility | Preserved; no synthetic creator/editorial data added | Public `truegold` query exposed no internal rows while admin showed published war-academy rows; Sophia remained publicly searchable | **Accepted for R7 preview** |
| Responsive and runtime evidence | Search and Explorer surfaces in the deployed RC3 shell | Validated without new UI redesign | Search checked at 390/768/1280 explicit viewport overrides; no horizontal overflow; browser console clean | **Accepted for R7 preview** |

R7 evidence is recorded in `docs/recovery/SPRINT-R7-SEARCH-KNOWLEDGE-RECOVERY.md`. The only deployment after the starting preview was required by the Search Explorer cookie fallback fix. The Supabase migration was limited to the missing search projection schema; no fixture, provider transport, production promotion, push or merge was performed.

## Sprint R5 render and creative recovery

| Subsystem | Current implementation | Recovery status | Validation status | Version 1.0 readiness |
| --- | --- | --- | --- | --- |
| Canonical Render Engine | `src/render-engine/` parser, fixed-cell grid, analyser, configuration, device profiles, benchmarks, persistence, simulator and shared types; public barrel exports all foundations. | Reconciled from existing Render Engine history; simulator export restored. | Focused tests, `npm run check`, server TypeScript, NodeNext and build pass; exact preview accepted in R6. | **Ready for R6 acceptance** |
| Kingshot artwork renderer | `src/components/art/KingshotArtRenderer.tsx` is the sole active artwork renderer and consumes the canonical engine. | Preserved and validated. | Deterministic fixed-cell and persistence tests pass; deployed Art Studio responsive smoke passes at 390/768/1280. | **Accepted in R6** |
| Admin Calibration Lab | `/admin/render-engine`, `RenderEngineCalibrationPage.tsx`, browser-local profiles and existing `cms.view` guard. | Preserved; no new permission system. | Owner-authenticated route, saved-profile restoration, working-default reset, browser-local persistence and malformed-value fallback accepted in R6. | **Accepted in R6** |
| Creative integrations | Art Studio uses the renderer; Community Art moderation migrated from raw `<pre>` to the renderer; attribution and text-art validation remain separate. | Unified applicable previews; no unrelated Chat/Name/Banner redesign. | Owner-authenticated Art Studio, submission preview, Community Art moderation and protected-route smoke accepted in R6. | **Accepted in R6** |
| Exact-commit preview | Clean R6 HEAD `6c106ea8c68a6cdf1cb1b2059536a08a4bede10a` deployed as Ready deployment `dpl_DDeK6neMfJNqmFrzTLaAXN7q4Msj` at `https://kingshot-forge-dr8uqyraz-clarksim-7474s-projects.vercel.app`. | Deployed to preview only. | Owner-authenticated route, permission, responsive, console and loaded-asset checks passed; no replacement deployment required. | **Accepted in R6** |

## Sprint R6 Creative Platform acceptance

The exact preview deployment above was accepted from the clean branch at HEAD
`6c106ea8c68a6cdf1cb1b2059536a08a4bede10a`.

Evidence is recorded in
`docs/recovery/SPRINT-R6-CREATIVE-PLATFORM-ACCEPTANCE.md`. R6 closed the
remaining authenticated Render Engine and Creative Platform evidence gate:
owner permissions, Art Studio and moderation route smoke, submission preview,
browser-local profile restoration/default recovery, malformed-value fallback,
responsive checks at 390/768/1280, and console/network inspection.

R5 performed no Supabase migration, storage change, production write, push,
merge, tag or production promotion. Existing lint warnings, Vite bundle-size
warning and Vercel npm audit notice were not introduced by this sprint.

## Sprint R8B Player Platform completion and preview acceptance

| Subsystem | Current implementation | Recovery status | Validation status | Version 1.0 readiness |
| --- | --- | --- | --- | --- |
| Player Identity and Profiles | Canonical linked-player context, private profile editor and public profile projection/routes | Preserved; no duplicate identity system introduced | Player Identity contracts, focused tests and build pass; public visibility boundary confirmed in code and RLS | **Ready for owner preview evidence** |
| Hero Collection and Showcase | Player-owned hero state, widget/gear fields, showcase selection and public showcase projection | Preserved on existing `player_heroes` path | Hero governance and identity tests pass; owner-authenticated runtime evidence remains pending | **Not ready** |
| Progression snapshots | Immutable `player_progression_snapshots` with owner/private and public/shared policies | Preserved; no mutable plan model introduced | Progression service/page audited; RLS and build pass | **Not ready** |
| Transfer, Kingdom and Alliance | Public Transfer Hub, private Transfer Profile, Kingdom/Alliance directory and membership routes | Preserved; existing permission boundaries retained | Read-only RLS inspection confirms owner/public predicates | **Ready for owner preview evidence** |
| Persistent favourites | Existing zero-row `public.favourites` table reconciled as the one shared contract for typed entity references; Kingdom, Alliance and Hero surfaces consume it | **Implemented; partial preview acceptance evidenced** | Exact owner session passed reversible Hero add/remove, My Forge rendering, refresh/session persistence, supported entity controls, cleanup, console inspection and live schema/RLS checks; User B isolation, signed-out app rejection and authenticated responsive/network instrumentation remain blocked by session/protection/tooling constraints | **Blocked on remaining owner-session evidence** |
| Saved Progression Plans | Explicitly removed from R8/R8B acceptance; no plan entity, service, API, route, migration or RLS contract is permitted | **Deferred by decision** — separate post-v1.0 epic under ADR-0114 | Absence is intentional and documented; future-facing ADR/roadmap references remain | **Not an R8 defect** |
| R8B deployed preview | Exact validated candidate and authenticated responsive preview acceptance are required | **Deployed; partial authenticated acceptance evidenced** | `dpl_8tmBUZpNxRmk4HkGW3dGPkTcpNdd` is READY; exact preview owner session passed the reversible favourite and persistence path; second-user, signed-out app, authenticated responsive and network gates remain open | **Blocked on remaining owner-session evidence** |

R8 evidence is recorded in `docs/recovery/SPRINT-R8-PLAYER-PLATFORM-RECOVERY.md`.
  The approved favourites migration, exact preview deployment and partial owner
  acceptance are complete. No fixture, push, merge, tag or promotion was
  performed. R8B remains open pending the explicitly listed owner-session
  gates.

## Recovery decisions

- `src/navigation/workspaceRegistry.ts` remains the single navigation contract. The shell consumes it; it does not create a second menu model.
- Existing `/admin/*` routes remain compatibility aliases for recovered operational slices. Workspace routing is additive and does not bypass server permissions.
- Workspace preferences are presentation state only. `WorkspaceRoute`, `ProtectedRoute`, API capability checks and Supabase RLS remain authoritative.
- Completed functionality was recovered from the Operations Centre history. Planned Creator, Audit Log, Roles and Feature Flags surfaces remain labelled planned and were not implemented in R1/R2.
- R8B owner decisions approve one canonical persistent favourites contract and defer Saved Progression Plans to a separate post-v1.0 epic. ADR-0114 remains in force; no planning product, API, schema or migration is part of this sprint.
- The connected Supabase project `hrvdhjscwitqpwjhnjkm` was initially inspected read-only. The approved R8B migration is limited to reconciling the existing zero-row `public.favourites` table, its constraints, indexes and own-row RLS. No unrelated policy or production data is in scope.

## Remaining release evidence

Version 1.0 still requires the remaining platform recovery items listed above, including Render Engine and Creative Platform recovery, broader runtime observability and any secondary planned routes. R4 authenticated Workspace/Operations validation and the exact candidate deployment are complete.
