# Technical Debt Register

Severity: P0 blocker, P1 high, P2 medium, P3 low.

| ID | Severity | Area | Debt / Risk | Evidence | Required action | Target |
|---|---:|---|---|---|---|---|
| TD-001 | P0 | Build | Canonical snapshot fails TypeScript build | `buildingsDatasetAdapter.ts` and `recordEditorSchema.ts` type incompatibilities | Restore green build before feature work | Milestone 2.0 |
| TD-002 | P0 | Security | Snapshot contains `.env.local` with privileged secret names/values | Canonical ZIP includes local environment file | Rotate exposed server credentials if this archive left trusted storage; remove from all future packs | Immediate |
| TD-003 | P1 | Quality | No automated test framework or tests | No test scripts or test directories | Add Vitest, React Testing Library and API/use-case tests | Milestone 2.0 |
| TD-004 | P1 | CI | No repository CI configuration | No `.github/workflows` | Add mandatory quality-gate workflow | Milestone 2.0 |
| TD-005 | P1 | Styling | Global stylesheet is approximately 14,893 lines | `src/App.css` | Introduce tokens, primitives and feature-local styles; migrate incrementally | Milestones 2–3 |
| TD-006 | P1 | Modularity | Multiple UI files exceed 600–1,200 lines | Transfer Profile, Name Studio, profile/editor pages | Decompose by use-case and view responsibility | Milestones 2–4 |
| TD-007 | P1 | Security | CMS protection is visibly client-side; server publication/mutation policy is incomplete | `ProtectedRoute`, direct Supabase role reads | Enforce permissions in server use-cases and RLS | Milestone 2 |
| TD-008 | P1 | CMS | Current editor is source-data browsing plus local record forms, not a persistent publication workflow | Admin adapter/record-editor structure and placeholders | Implement draft/version/review/publication model | Milestone 2 |
| TD-009 | P1 | Contracts | Dataset keys and response contracts are duplicated | shared types, API client, supported sets | Create a single contracts package and generated/derived registries | Milestone 2.0 |
| TD-010 | P1 | Data engine | `unknown` is used through central registry/load paths | `DatasetImporter<unknown, unknown>`, `records: unknown[]` | Preserve dataset-specific generic types and schema validation | Milestone 2 |
| TD-011 | P1 | API | Handler error responses expose raw internal messages | dataset/preview/import handlers | Add typed safe errors and server logging | Milestone 2.0 |
| TD-012 | P2 | API | Static supported-dataset lists repeat registry data | dataset and preview handlers | Derive validation from one registry contract | Milestone 2.0 |
| TD-013 | P2 | Import auth | Heroes import uses a shared header secret | `x-data-engine-secret` | Use authenticated admin command and signed scheduler identity | Milestone 2 |
| TD-014 | P2 | Routing | Route catalogue and placeholder implementation live in one app file | `src/App.tsx` | Introduce route modules and lazy loading | Milestone 2.0 |
| TD-015 | P2 | Dependencies | `react-router` and `react-router-dom` major versions are misaligned | package manifest | Align and validate router dependencies | Milestone 2.0 |
| TD-016 | P2 | Docs | README remains Vite starter content | root README | Replace with platform onboarding and operations guide | Milestone 2.0 |
| TD-017 | P2 | Database | No migrations are included in the snapshot | repository tree | Establish checked-in migration source of truth | Milestone 2.0 |
| TD-018 | P2 | Observability | No shared structured logging/correlation model | handlers use direct errors/console | Add operational event and log conventions | Milestone 2 |
| TD-019 | P2 | Accessibility | No automated accessibility checks or component standard | repository scripts | Add standards, tests and review checklist | Milestone 2 |
| TD-020 | P3 | Formatting | Mixed quote/semicolon/formatting styles | files across client/server | Add formatter and enforce in CI | Milestone 2.0 |

## Debt management rules

- New P0/P1 debt blocks milestone completion unless explicitly accepted by an ADR.
- Every accepted debt item has an owner and target milestone.
- Debt is reviewed at each milestone gate.
