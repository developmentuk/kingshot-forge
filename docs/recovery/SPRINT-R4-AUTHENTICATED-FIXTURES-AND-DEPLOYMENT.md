# Sprint R4 — Authenticated Fixtures and Deployment Stabilisation

Status: validated locally; exact candidate redeploy pending

Branch: `recovery/0.9.0-rc3-feature-reconciliation`

Starting HEAD: `c404f0ac5d418dbc43dced6512a7c358d6837fbc`

Supabase project: `hrvdhjscwitqpwjhnjkm`

## Scope and constraints

R4 validates the recovered Workspace and Operations platform using isolated, temporary Auth identities. It does not redesign authentication, roles, workspaces, Operations, RLS, Render Engine, or Creative Platform functionality.

The fixture utility is outside the production runtime. It requires an explicit Supabase URL, server-only service-role credential, preview redirect URL, and temporary fixture password. It refuses any Supabase project other than `hrvdhjscwitqpwjhnjkm`, records action links only in the ignored local state file, does not log credentials or links, and supports cleanup. No authentication bypass or RLS change is used.

Usage, without placing secrets in this document:

```text
node --env-file=.env.local scripts/manage-forge-r4-fixtures.mjs provision
node --env-file=.env.local scripts/manage-forge-r4-fixtures.mjs cleanup
```

Required process variables are `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FORGE_R4_FIXTURE_PASSWORD`, and `FORGE_R4_REDIRECT_URL`. The generated `.r4-fixtures.local.json` is private, ignored, and temporary.

## Fixture plan

| Fixture | Identity and roles | Expected workspaces | Protected route/API focus | Expected rejection | Lifecycle |
| --- | --- | --- | --- | --- | --- |
| Player | `forge-r4-player`, canonical `viewer` only | Player | authenticated profile/session and player-owned reads | Operations, moderation, user management, reviewer APIs | Temporary |
| Contributor + Content Creator | `forge-r4-contributor-creator`, `contributor` + `content_creator` | Player, Contributor, Creator | contributor application ownership, creator shell, community-art submitter visibility | Operations review, user management, moderation queue | Temporary; multi-role |
| Moderator | `forge-r4-moderator`, `moderator` | Player, Contributor, Creator, Moderation | Community Art queue and moderation API | Operations user/application management | Temporary |
| Admin + Operations | `forge-r4-admin-operations`, `admin` | Player, Contributor, Creator, Moderation, Operations | Operations dashboard, status, User Management, Applications, protected APIs | Owner-only role assignment | Temporary |

The Player fixture is also the authenticated user with no elevated capability. The Contributor + Content Creator fixture is the minimum deterministic multi-role case. The role-to-workspace result is resolved by `get_my_forge_access`, `forge_role_permissions`, and the existing `workspaceIdsForCapabilities` logic; no client-side role override is permitted.

## Expected route matrix

The canonical route paths are taken from `src/App.tsx` and `src/navigation/workspaceRegistry.ts`. `/operations/status` is represented by the existing Operations status route(s), and `/operations/audit` and `/operations/flags` are represented by `/operations/audit-log` and `/operations/feature-flags`.

| Surface | Player | Contributor/Creator | Moderator | Admin/Operations |
| --- | --- | --- | --- | --- |
| `/operations`, `/operations/users` | reject | reject | reject | allow |
| `/operations/applications`, detail | reject | reject | reject | allow |
| `/operations/roles`, audit, flags | reject | reject | reject | allow where existing permission is required |
| `/contributor`, `/join/my-application` | authenticated shell / own data | allow | allow through current capability model | allow |
| `/creator` | reject | allow | allow through current capability model | allow |
| `/moderation`, `/admin/community-art` | reject | reject queue | allow | allow |
| `/settings` and player routes | allow | allow | allow | allow |

Exact observed results, direct API results, RLS evidence, responsive checks, and deviations from this expected matrix are recorded below.

## Validation evidence

The isolated fixture set was provisioned on 19 July 2026 and identified by `forge_fixture: r4` metadata. The deployed R3 preview was accessed through a temporary Vercel share session; no share token is retained in this document.

| Check | Result | Evidence |
| --- | --- | --- |
| Player / no elevated capability | Pass | Player View loaded; direct `/operations/users` rendered the fail-closed “Workspace unavailable” state. |
| Contributor + Content Creator | Pass | The multi-role session rendered `/join/my-application` with the submitted fixture application and its `r4 fixture created` event; Contributor and Creator workspaces were visible. |
| Moderator | Pass | The moderator session rendered the Moderation Centre and Community Art queue entry. |
| Admin / Operations | Pass | The admin session rendered the Operations Centre with User Management, Contributor Applications and Community Art destinations. |
| Session switching | Pass | Sign-out followed by a fresh fixture action link changed the visible authenticated identity without stale role navigation. |
| Responsive layout | Pass | Operations at 390px, 768px and 1280px reported no horizontal overflow (`scrollWidth <= innerWidth`). |
| Local TypeScript / build | Pass | `npx tsc -p tsconfig.server.json --noEmit` and `npm run check` pass; only existing lint and bundle-size warnings remain. |

Supabase inspection confirmed canonical role assignments, capability permissions, forced RLS on identity/application tables, owner/moderator Community Art policies, and the fixture application/art records. No migration or policy change was required. Direct unauthenticated API access returned the expected bearer-token error; authenticated API behavior was exercised by the deployed UI sessions.

## Provisioned writes and cleanup

The planned writes are limited to four Auth users with fixture metadata, their canonical role assignments, one submitted contributor application plus its fixture event, and one pending Community Art record. All records are labelled or keyed as R4 fixtures and cascade from the fixture users where applicable. No existing user, role, RLS policy, migration, or production submission is modified. Cleanup deletes the labelled application and art record and then the four Auth users; cleanup is run after browser sign-out and is recorded with verification counts.

## Deployment diagnostics and evidence

R3 recorded Vercel diagnostics in Record Editor relative imports and Player Identity server/type paths. R4 repaired only those reported paths: explicit Record Editor `.js` imports, Player Identity result-union and timestamp narrowing, the own-property check, and support-result typing. The local NodeNext server check and full validation suite pass after the repair. A clean exact-commit Vercel redeploy is the final deployment gate.

## Validation log

## Provisioning and cleanup

Provisioning created four temporary Auth users, canonical role assignments, one submitted contributor application with one fixture event, and one pending Community Art submission. The first partial attempt was cleaned up before successful provisioning. Cleanup is required after final browser sign-out; expected post-cleanup counts are zero R4 users, applications, art records and local state file.

## Remaining risks and Version 1.0 readiness

R4 closes the authenticated Workspace/Operations evidence gate, subject to the exact clean redeploy and cleanup. Render Engine and Creative Platform recovery remain outside R4. Unified audit-log completion, production-scale API observability, and secondary planned routes remain future recovery work.
