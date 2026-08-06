# Kingshot Forge Modular Platform Working Plan

**Programme:** Forge Modular Platform  
**Current phase:** Architecture review and foundation readiness  
**Canonical repository:** `developmentuk/kingshot-forge`  
**Architecture decision:** `ADR-014`  
**Audit:** `docs/audits/PLATFORM-MODULARITY-AUDIT-2026-08-05.md`  
**Current canonical baseline:** `065b34e6079bed2f40e44105ef7184c13c8067c6`

## Programme objective

Evolve Kingshot Forge from a logically separated single application into a statically composed modular platform that allows different applications and engines to be developed in parallel, validated independently and installed through trusted module registration.

The programme must preserve:

- one coherent player experience;
- one canonical repository and production line;
- one governed Supabase data authority;
- existing routes and permissions;
- AEGIS security, publication and release controls;
- active workstream isolation;
- cost-conscious development and deployment.

## Non-objectives

The programme does not initially deliver:

- an external plugin marketplace;
- runtime-loaded remote modules;
- microfrontends;
- separate Supabase projects for each application;
- independent public deployments for every UI module;
- broad source movement solely for visual directory tidiness;
- authentication redesign outside authorised Auth workstreams;
- database adviser remediation bundled into structural moves.

## Workstream sequence

### MOD-DOC-001 — Platform audit and architecture record

**Status:** Delivered on the documentation branch; pending owner review and merge.

Deliverables:

- platform modularity audit;
- module catalogue and ownership model;
- ADR-014;
- AEGIS and Blueprint modular-platform addenda;
- implementation working plan;
- FRKS programme record.

Gate:

- documentation-only diff;
- no production, Supabase, Auth or source changes;
- owner accepts or amends the proposed architecture.

### AUTH-EXP-001 coordination gate

**Status:** Closed on 6 August 2026 through the released Phase 2A production foundation.

The accepted Auth contract now provides:

- explicit PKCE configuration;
- route-owned callback exchange at `/auth/callback`;
- URL scrubbing and safe callback states;
- same-origin internal redirect validation;
- provider-neutral authentication boundaries;
- production Google OAuth;
- session restoration after redirect and refresh;
- production Site URL `https://ksforge.app/`;
- production callback `https://ksforge.app/auth/callback`.

Canonical Auth closeout:

- `origin/main`: `065b34e6079bed2f40e44105ef7184c13c8067c6`;
- production deployment: `dpl_Ca2dAnBNLsgtQff3d8bGuvyRraLE` — READY;
- rollback baseline: `12b9f14011280c7d54e94962a69520dc3ddd625a`.

The exact completed OAuth exchange was not instrumented before it occurred. This exact-once live-counting limitation is accepted and remains recorded in the release and FRKS evidence. Modularisation must preserve, not reinterpret, that evidence boundary.

`MOD-FOUND-001` may now begin after ADR-014 and the modular documentation are accepted. It must consume the existing Auth facade and must not independently choose or alter OAuth flow, callback design, redirect validation, provider metadata mapping, account linking or session policy.

The following remain protected unless a separately authorised Auth workstream owns them:

- `src/lib/supabase.ts` and the explicit PKCE client configuration;
- Auth context and provider-neutral Auth services;
- `/auth/callback` and route-owned code exchange;
- callback URL scrubbing and redirect validation;
- Supabase Auth settings;
- provider console settings and secrets;
- `handle_new_user()` behaviour;
- identity linking and duplicate-account recovery.

### MOD-FOUND-001 — Module contract and registry foundation

**Status:** Ready to begin after MOD-DOC-001 owner acceptance.

**Purpose:** Establish enforceable module boundaries without moving product implementation.

Scope:

1. Define a typed `ForgeModuleDefinition` contract.
2. Add a trusted static module registry.
3. Define public module entry points and dependency declarations.
4. Add ownership metadata for routes, navigation, permissions, APIs, tables and tests.
5. Add deterministic registry validation:
   - unique module IDs;
   - unique route ownership;
   - unique navigation identity;
   - valid dependencies;
   - no dependency cycles;
   - valid permissions and feature flags;
   - no duplicate analytics namespaces.
6. Add path-boundary tests that identify prohibited cross-module imports.
7. Add route, navigation and permission parity snapshots against the existing shell.
8. Add focused validation commands without removing the full `npm run check` gate.

Explicit exclusions:

- no feature directory moves;
- no Auth edits;
- no Supabase migration;
- no route changes;
- no deployment topology changes;
- no user-visible redesign;
- no active-workstream implementation edits.

Acceptance criteria:

- existing route paths and guards are byte-for-byte or semantically equivalent;
- current workspace switching remains unchanged;
- production build output remains functionally equivalent;
- registry validation fails closed;
- a module can be disabled in a test fixture without editing unrelated module definitions;
- all current focused tests and full integration checks pass;
- no protected path changes are present in the diff.

### MOD-REF-001 — Reference module proof

**Purpose:** Prove static installation using a low-risk, mostly read-only group.

Candidate ownership:

- `/characters`;
- `/compatibility`;
- `/codex`;
- `/roadmap`;
- `/release-notes`.

Steps:

1. Create the `app.reference` public entry point.
2. Move only route and navigation registration into the module definition.
3. Preserve page implementations and URLs initially.
4. Add focused Reference module checks.
5. Validate desktop/mobile routing and Search links.
6. Prove enable/disable behaviour in preview or test composition only.
7. Record rollback to direct shell registration.

Acceptance criteria:

- no content or route regression;
- no change to Auth, player state or database access;
- no new Vercel project or production deployment;
- module-focused checks run without invoking unrelated OCR/render/provider suites;
- the full integration gate still passes before merge.

### MOD-COMP-001 — Companion application pilot

**Purpose:** Prove a substantial application module with public routes, canonical data and administration dependencies.

Entry gate:

- current Companion provider recovery and Stage acceptance state is stable;
- no active Companion branch owns files proposed for movement;
- module registry and Reference pilot are accepted;
- exact latest `main` baseline is recorded.

Candidate scope:

- Companion Index and item routes;
- Hero Companion;
- Buildings browser and planner;
- Companion navigation contributions;
- Companion-focused tests;
- published-data client adapters.

Remain platform-owned:

- editorial versioning and publication;
- Verification Centre;
- Search projection engine;
- entity identity registry;
- global permissions;
- shared media governance.

Acceptance criteria:

- Companion public routes remain stable;
- published-only data boundary remains unchanged;
- Companion Admin retains existing capability enforcement;
- focused Companion checks and full integration checks pass;
- module disablement produces an honest unavailable state, not broken routes;
- rollback does not require data rollback.

### MOD-PKG-001 — Internal workspace packages

**Purpose:** Convert proven logical modules and shared contracts into internal workspace packages.

Entry gate:

- at least two application modules use the registry successfully;
- circular dependency and public-entry-point rules are proven;
- CI cost and build evidence justify physical package boundaries.

Candidate structure:

```text
apps/
  forge-shell/
  reference/
  companion/
packages/
  module-sdk/
  ui/
  auth-access/
  data-editorial/
  search-entity/
  observability/
engines/
  render/
  vision/
services/
  data-jobs/
  redemption/
```

Rules:

- use repository-local workspace versions first;
- do not publish private Forge packages to a public registry;
- preserve one lockfile and one release line;
- introduce package boundaries only where a public contract exists;
- consume the released Auth facade without moving or redesigning its implementation.

### MOD-SVC-001 — Operational service isolation

**Purpose:** Separate resource-heavy or provider-sensitive workers only when justified.

Candidates:

- Forge Vision worker;
- render processing jobs;
- import/publication/Search refresh jobs;
- gift redemption provider worker.

Evidence required before separation:

- measurable runtime, timeout, memory, deployment or availability pressure;
- explicit authentication and service-to-service contract;
- independent observability and redaction;
- retry, idempotency and dead-letter behaviour;
- deployment and rollback ownership;
- cost impact approved by the owner.

A separate service deployment must solve an observed operational problem. It must not be introduced merely because the source is modular.

## Branch and worktree protocol

Every modular implementation workstream must:

1. begin from the latest clean `origin/main`;
2. record the exact base SHA;
3. inspect open pull requests, branches and worktrees before editing;
4. publish a protected-path list in its sprint prompt;
5. own a narrow path set;
6. avoid unrelated cleanup;
7. keep generated, temporary and `.codex/` content untouched unless explicitly in scope;
8. stop if another active branch owns the same implementation surface;
9. use a draft PR until exact-head validation and owner acceptance are complete.

## Proposed ownership zones

### Foundation workstream

May own:

- new module contract and registry files;
- new module-validation scripts;
- documentation and tests for route parity;
- minimal shell composition changes required to consume the registry.

Must not own:

- authentication source, callback or configuration;
- Art Studio and Render Engine internals;
- Forge Vision internals;
- Player provider adapters;
- Companion feature implementation during an active Companion workstream;
- database migrations.

### Application extraction workstreams

May own:

- one module's public entry point;
- its route/navigation contribution;
- its feature directory after explicit ownership is granted;
- module-focused tests and docs.

Must not change shared platform contracts without a separate foundation review.

## Validation model

### Fast affected-module gate

Runs when a branch changes one module or platform contract:

- module schema validation;
- dependency and boundary checks;
- module-focused unit/contract tests;
- TypeScript checks for affected packages;
- focused lint;
- route/navigation/permission parity checks.

### Platform integration gate

Runs for pull-request readiness and every `main` promotion:

- complete module registry validation;
- full cross-module contract suite;
- existing `npm run check` equivalent;
- production build;
- security-sensitive tests;
- exact-head Vercel preview;
- owner-defined responsive and authenticated acceptance.

The fast gate reduces feedback and CI cost. It does not replace the release gate.

## Rollback model

Every module conversion must retain a bounded rollback path:

- restore the previous shell registration;
- disable the module through trusted composition or a platform-owned feature flag;
- preserve existing database projections and routes;
- avoid irreversible data migration during initial extraction;
- document any compatibility alias and removal gate.

A module cannot be accepted if rollback requires deleting user or canonical data.

## Risks and controls

| Risk | Control |
|---|---|
| Modularisation becomes a rewrite | Contract-first, no-move foundation sprint |
| Active branch collisions | Protected ownership map and exact-base audit |
| Auth behaviour changes accidentally | Released Phase 2A facade is protected and consumed unchanged |
| Duplicate canonical data | One Supabase project and platform-owned publication |
| Routes or permissions drift | Single module definition plus parity tests |
| CI remains expensive | Affected-module gate plus full release gate |
| Circular dependencies | Registry validation and public entry points |
| Runtime supply-chain risk | No remote plugin loading |
| Too many tiny packages | Package extraction only after proven logical boundaries |
| Worker separation increases cost | Operational-evidence and owner cost gate |

## First authorised implementation prompt

After MOD-DOC-001 is accepted, the next Codex workstream should be:

```text
Continue Kingshot Forge.

Workstream:
MOD-FOUND-001 — Forge Module Contract and Registry Foundation

Repository:
developmentuk/kingshot-forge

Canonical starting baseline:
latest clean origin/main

Minimum accepted baseline at authorisation:
065b34e6079bed2f40e44105ef7184c13c8067c6

Production:
https://ksforge.app/

Supabase project:
hrvdhjscwitqpwjhnjkm

Begin in read-only mode.

Before changing anything:

1. Read `docs/AEGIS.md`.
2. Read `docs/AEGIS-MODULAR-PLATFORM-ADDENDUM.md`.
3. Read `docs/FORGE_BLUEPRINT.md`.
4. Read `docs/FORGE-BLUEPRINT-MODULAR-PLATFORM-ADDENDUM.md`.
5. Read `docs/ADR/ADR-014-modular-platform-architecture.md`.
6. Read `docs/audits/PLATFORM-MODULARITY-AUDIT-2026-08-05.md`.
7. Read `docs/architecture/FORGE-MODULE-CATALOGUE.md`.
8. Read `docs/plans/MODULAR-PLATFORM-WORKING-PLAN.md`.
9. Read `docs/releases/AUTH-EXP-001-PHASE-2A.md`.
10. Read `docs/research/FRKS-AUTH-EXP-001.md`.
11. Inspect current branches, pull requests and worktrees.
12. Confirm the exact current `origin/main` SHA and do not use a stale local checkout.

Accepted Auth contract:

- explicit PKCE configuration;
- route-owned callback exchange at `/auth/callback`;
- callback URL scrubbing;
- same-origin redirect validation;
- provider-neutral Auth services;
- production Site URL `https://ksforge.app/`;
- exact production callback `https://ksforge.app/auth/callback`.

The exact-once live request count was not instrumented before the completed production exchange. Preserve this recorded evidence limitation; do not reopen or overstate it.

Phase 1 objective:

Perform a read-only collision and dependency audit for `MOD-FOUND-001` and propose the exact implementation file ownership map.

Do not modify:

- Auth client, Auth context, Auth services or `/auth/callback`;
- Supabase Auth or database configuration;
- Art Studio or Render Engine implementation;
- Forge Vision implementation;
- Player provider adapters;
- active Companion implementation;
- migrations, deployments, production data or user accounts;
- unrelated `.codex/` content.

The proposed foundation may include only:

- a typed module contract;
- a trusted static registry;
- registry validation;
- dependency-boundary checks;
- route/navigation/permission parity checks;
- focused module validation commands;
- the smallest shell composition seam needed later.

Do not move feature implementation, alter routes or permissions, create migrations, split deployments, introduce runtime plugins or redesign user-facing pages.

Return:

1. exact baseline and repository state;
2. active collision and protected-path assessment;
3. current composition and dependency findings;
4. proposed module contract shape;
5. proposed registry location;
6. exact files to create or modify;
7. validation and rollback plan;
8. security risks;
9. explicit go/no-go recommendation for implementation.

Stop after the read-only report. Await explicit implementation authorisation.
```

## Programme completion condition

The programme is successful when Forge can add, upgrade, disable and roll back a trusted application module through a stable contract and static registry, while preserving one secure platform, one canonical data authority and one controlled release line.
