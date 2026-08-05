# Kingshot Forge Platform Modularity Audit

**Audit date:** 5 August 2026  
**Repository:** `developmentuk/kingshot-forge`  
**Audited baseline:** `fe66d98a0685abc7e03e38d0ef0771dae3d4447a`  
**Production:** `https://ksforge.app/`  
**Supabase project:** `hrvdhjscwitqpwjhnjkm`  
**Audit mode:** Read-only repository and Supabase inspection

## Executive judgement

Kingshot Forge has reached the point where a modular platform architecture is justified.

Forge already has strong logical boundaries: explicit product and platform domains, workspace-aware navigation, capability checks, separate feature areas, focused test commands, server-authoritative services and governed persistent data. The principal weakness is that these boundaries are not yet enforceable at composition level. One Vite application, one TypeScript application boundary, one central route file, one package manifest and one all-platform validation chain still assemble almost the entire platform together.

The recommended posture is:

- **Conditional GO** for documentation, module contracts, ownership rules, static module registration and dependency validation.
- **NO-GO** for runtime-loaded plugins, remote JavaScript modules, microfrontends, separate product databases or broad physical code moves at this stage.
- **NO-GO** for any modularisation change that overlaps the active `AUTH-EXP-001`, Art Studio, Forge Vision, Player Intelligence or blocked Player API workstreams.
- Keep one canonical repository, one production shell and one governed Supabase project during the first modularisation programme.

Modularisation should reduce integration risk without creating a distributed system prematurely.

## Scope and evidence

The audit inspected:

- the current GitHub `main` baseline and active pull-request landscape;
- `docs/AEGIS.md`, `docs/FORGE_BLUEPRINT.md` and architecture principles;
- application composition in `src/App.tsx`;
- workspace composition in `src/navigation/workspaceRegistry.ts`;
- the root `package.json`, TypeScript and Vite configuration;
- the current Supabase project, public schema, migrations, views, functions, Edge Functions and advisor findings;
- current authentication source boundaries relevant to `AUTH-EXP-001`.

No source file, Supabase setting, database object, user account, provider configuration, deployment or production record was changed by this audit.

## Current platform inventory

### Repository and application composition

The current application is a single private package named `kingshot-forge`. It uses one Vite build and one TypeScript application configuration covering all of `src`.

`src/App.tsx` centrally imports and registers nearly every public, player, creative, Companion, community, contributor, creator, moderation and Operations surface. Workspace navigation is separately modelled, but route composition remains central.

The root validation chain provides strong regression protection, but `npm run check` executes almost every domain and engine suite before lint and build. This creates a large validation blast radius for small changes and prevents modules from proving independent health efficiently.

### Supabase estate

Read-only inspection recorded:

- 103 public tables;
- 15 public views;
- 52 public functions;
- 34 `SECURITY DEFINER` functions;
- 191 public-schema foreign keys;
- four active JWT-protected Edge Functions:
  - `kingshot-gift-codes`;
  - `kingshot-player`;
  - `kingshot-kingdom`;
  - `kingshot-kvk`.

The database already contains clear functional clusters for:

- Forge identity, roles, permissions and preferences;
- Player Identity, profiles, progression and hero ownership;
- Alliance, Kingdom and Transfer operations;
- canonical Heroes and Buildings;
- editorial records, immutable versions, audit and publication;
- imports, verification and warning decisions;
- persistent Search projections and refresh operations;
- Community Art and Render Engine evidence;
- Forge Vision mappings, evidence, scans and audit;
- Gift Centre consent, queue, attempts, health and history;
- contributor applications and onboarding;
- notifications, analytics and entity identity.

This supports logical module ownership, but the 191 foreign keys and shared platform tables show that immediate database separation would be unsafe and unnecessary.

## Findings

### F-01 — Central application composition is the main coupling hotspot

**Severity:** High

Routes, top-level imports and global feature styles are composed in `src/App.tsx`. A change to one application area can therefore collide with unrelated workstreams even where the underlying feature code is reasonably isolated.

**Required response:** Introduce a typed, static module registry that supplies route and navigation contributions to the shell. Preserve all existing URLs and guards during migration.

### F-02 — Workspace separation is conceptual rather than complete

**Severity:** Medium

Player, Contributor, Creator, Moderation and Operations workspaces exist and are capability-aware. This is a strong foundation. However, workspace navigation and route declarations are maintained through separate central structures, so drift is controlled by tests rather than prevented by one module contract.

**Required response:** A module definition should own its routes, navigation entries, access requirements and status metadata together.

### F-03 — Validation has a whole-platform blast radius

**Severity:** High

Focused validation commands exist, but the canonical `check` command remains one long serial chain across almost every domain and engine.

**Required response:** Create module-level validation commands and an affected-module gate. Retain a full integration gate for release candidates and `main` promotion.

### F-04 — Shared database authority must remain central

**Severity:** High

The persistent model has mature cross-domain relationships, shared identity, shared permissions, shared editorial publication, Search and audit. Splitting databases or creating module-owned Supabase projects would duplicate authority and weaken canonical-data guarantees.

**Required response:** Keep one production Supabase project. Record table, view, function, storage and migration ownership by module while preserving platform-owned cross-cutting services.

### F-05 — Authentication is a protected, unresolved platform boundary

**Severity:** Critical

The current source uses a shared Supabase client, session restoration, auth-state subscription, Google OAuth and sign-out. The client does not explicitly configure `flowType: 'pkce'`, and the Google redirect returns to the initiating pathname rather than a visibly dedicated callback route.

This source evidence does not prove whether production currently uses PKCE or implicit flow. `AUTH-EXP-001` Phase 1B owns the live classification, redirect assessment, provider configuration, SMTP readiness and identity-linking gate.

**Required response:** Treat authentication as platform core, not as an installable application. No modularisation work may edit auth source, callback behaviour, provider settings, Supabase Auth configuration or identity-linking behaviour until the Phase 1B evidence report and owner decision are complete.

### F-06 — Active workstreams create a high collision risk

**Severity:** High

Open work exists across Art Studio rendering, Player Intelligence, blocked Player API research, Operations and historical FRKS branches. Sentry observability has also just merged into `main`.

**Required response:** Begin with documentation, contracts and non-invasive registry scaffolding only. Do not physically move active-workstream code. Establish protected ownership zones before extraction.

### F-07 — Engines and workers have different deployment characteristics

**Severity:** Medium

Forge Vision, OCR, rendering, imports, Search refresh and Gift Centre provider operations may benefit from independent operational scaling or failure isolation. They are not equivalent to user-facing application modules.

**Required response:** Model these as engines or services. Keep their contracts in the monorepo; consider separate deployments only after operational evidence proves a need.

### F-08 — Security and performance findings must be assigned, not hidden

**Severity:** High

Supabase advisors currently identify:

- API/service-oriented tables with RLS enabled but no browser policy;
- authenticated access to a number of `SECURITY DEFINER` functions;
- leaked-password protection disabled;
- unindexed foreign keys;
- RLS init-plan inefficiencies;
- multiple permissive policies;
- unused indexes.

Some findings may be intentional contracts, but modularisation must not silently inherit them without ownership.

**Required response:** The module catalogue must assign every database object and advisor finding to a platform or product owner. Remediation remains a separately reviewed security/performance programme and must not be bundled into structural moves.

### F-09 — Existing architecture principles support incremental modularisation

**Severity:** Positive

AEGIS and the Blueprint already require domains before features, inward dependency direction, server-side authority, replaceable infrastructure, shared capabilities and incremental evolution. A modular monorepo is an implementation of those principles rather than a replacement for them.

## Target architecture

The safe target is a **statically composed modular monorepo**:

```text
Forge Shell
  ├─ Platform modules
  │    ├─ Authentication and access
  │    ├─ UI and navigation
  │    ├─ Data, editorial and publication
  │    ├─ Entity identity and Search
  │    └─ Observability
  ├─ Product application modules
  │    ├─ Player
  │    ├─ Companion
  │    ├─ Community
  │    ├─ Creative
  │    ├─ Gift Centre
  │    ├─ Contributor
  │    ├─ Creator
  │    ├─ Moderation
  │    └─ Operations
  └─ Engines and services
       ├─ Render Engine
       ├─ Forge Vision
       ├─ Data and publication jobs
       └─ Redemption provider service
```

Modules are installed at build time through a trusted registry. They do not download or execute third-party code at runtime.

## Readiness decision

| Area | Decision | Reason |
|---|---|---|
| Architecture documentation | GO | Required by AEGIS for domain-boundary changes |
| Module catalogue and ownership | GO | Low risk and immediately useful |
| Typed static module contract | Conditional GO | Must preserve route, permission and output parity |
| Reference-module registry pilot | Conditional GO | Use a low-risk, inactive area |
| Companion extraction | Later GO gate | Wait for current Companion/provider recovery state to stabilise |
| Authentication extraction or edits | NO-GO | `AUTH-EXP-001` Phase 1B owns the unresolved boundary |
| Art Studio or Vision movement | NO-GO | Active protected workstreams |
| Runtime plugin loading | NO-GO | Security and operational complexity is not justified |
| Separate product databases | NO-GO | Would fragment canonical authority |
| Independent worker deployment | Future evidence gate | Consider only after contracts and operational need are proven |

## Immediate recommendation

Authorise `MOD-FOUND-001 — Forge Module Contract and Registry Foundation` after:

1. `AUTH-EXP-001` Phase 1B delivers its evidence report and explicit Phase 2 recommendation;
2. the implementation branch starts from the latest accepted `origin/main`;
3. active worktrees and protected paths are recorded;
4. the first sprint is limited to contracts, registry scaffolding, dependency tests and route parity;
5. no physical feature relocation, database migration or deployment split occurs in the foundation sprint.

The first proof module should be a low-risk Reference and Library group. Companion should be the first substantial product-module pilot after current Companion and provider gates are stable.
