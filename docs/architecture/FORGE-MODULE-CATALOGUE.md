# Forge Module Catalogue

**Status:** Proposed architecture baseline  
**Parent governance:** `docs/AEGIS.md`  
**Decision record:** `docs/ADR/ADR-014-modular-platform-architecture.md`

## Purpose

This catalogue maps Kingshot Forge into explicit modules without changing current production behaviour. It defines ownership, dependency direction, installation contracts and extraction risk.

A Forge module is a trusted, versioned unit of platform or product capability. During the first programme, modules remain in one repository and are statically composed into one production application.

## Module classes

### Platform modules

Platform modules provide shared authority and contracts. Product modules depend on them; platform modules must not depend on product presentation.

### Product application modules

Application modules own coherent user outcomes, routes, navigation, feature orchestration and domain-specific presentation. They consume platform services and published contracts.

### Engines and services

Engines and services perform specialised processing, background work or external-provider operations. They expose explicit contracts and may become independently deployable later, but are not runtime UI plugins.

## Proposed module contract

Every statically installed module must eventually provide a typed definition equivalent to:

```ts
export type ForgeModuleDefinition = {
  id: string
  version: string
  kind: 'platform' | 'application' | 'engine' | 'service'
  routes: readonly ForgeRouteDefinition[]
  navigation: readonly ForgeNavigationContribution[]
  requiredCapabilities: readonly ForgePermission[]
  featureFlags: readonly string[]
  analyticsNamespace: string
  dataOwnership: ForgeDataOwnership
  dependencies: readonly string[]
  validationCommands: readonly string[]
  rollback: ForgeRollbackContract
}
```

The final implementation contract may use different names, but it must preserve these responsibilities.

## Platform modules

| Module ID | Responsibilities | Current evidence/areas | Risk | Priority |
|---|---|---|---|---|
| `platform.shell` | Application bootstrap, layout, static module composition, route assembly, workspace switching, global recovery states | `src/main.tsx`, `src/App.tsx`, `AppLayout`, workspace registry | High because all modules enter here | Foundation |
| `platform.auth-access` | Supabase client, session lifecycle, sign-in/out, callback handling, roles, permissions, account status, identity-linking boundary | `src/lib/supabase.ts`, `AuthContext`, `RoleContext`, identity RPCs/tables | Critical; protected by `AUTH-EXP-001` | Protected dependency |
| `platform.ui` | Shared components, design tokens, accessibility, responsive shells, form/table/dialog patterns | `src/components`, shared styles | Medium | Foundation |
| `platform.data-editorial` | Dataset contracts, import staging, validation, versions, audit, verification, publication, rollback | Data Engine, Content Studio, Verification Centre, publication tables | High and cross-domain | Foundation |
| `platform.search-entity` | Stable Forge IDs, entity registry, Search projection, relationship projection, discovery contracts | entity registry, Search APIs/pages/tables | High and cross-domain | Foundation |
| `platform.observability` | Analytics, Sentry, safe error capture, audit telemetry and privacy redaction | analytics platform, Sentry integration, analytics tables | Medium | Foundation |
| `platform.notifications` | In-app notifications, delivery state and future channel contracts | notification tables and UX-004 | Medium | Later foundation |

### Platform rules

- Authentication and permissions are never reimplemented inside a product module.
- Product modules request capabilities through platform contracts and do not inspect provider-specific identity metadata directly.
- Canonical publication, Search projection and entity identity remain shared platform authority.
- Platform modules may expose adapters, hooks or services, but product modules may not import platform internals outside supported entry points.

## Product application modules

| Module ID | Primary user outcome | Current routes/surfaces | Primary persistent ownership | Dependencies | Extraction risk |
|---|---|---|---|---|---|
| `app.reference` | Public Forge guidance, compatibility and platform information | `/characters`, `/compatibility`, `/codex`, `/roadmap`, `/release-notes` | Mainly static/document-backed | shell, UI, observability | Low |
| `app.player` | Player Headquarters, Passport, profile, progression, Hero collection/showcase and settings | `/my-forge/**`, `/player/:forgeId`, `/players/:forgeId`, `/settings` | player accounts/profiles/progression, player hero state, preferences | auth-access, UI, search-entity, Companion contracts | High |
| `app.companion` | Trusted game knowledge and planning | `/companion/**`, `/buildings/**`, `/calculators/buildings` | published canonical projections, Buildings publication | data-editorial, search-entity, UI | Medium/High |
| `app.community` | Kingdom, Alliance, Transfer and KvK discovery/operations | `/kingdom-*`, `/alliance-*`, `/alliances/**`, `/transfer-*`, `/kvk-tracker` | kingdoms, alliances, memberships, transfer records | auth-access, UI, search-entity, provider adapters | High |
| `app.creative` | Kingshot-compatible names, chat and artwork creation plus community art | `/name-studio`, `/chat-studio`, `/art-studio`, community art surfaces | community art submissions, payload versions and reactions | UI, render engine, auth-access, moderation | Critical while ART work is active |
| `app.gift-centre` | Gift-code discovery, consent and redemption status | `/gift-codes`, player Auto Redeem surfaces | gift consent, requests, attempts, runs, provider health | auth-access, data-editorial, redemption service | High/provider-dependent |
| `app.contributor` | Joining Forge, applications, drafts and contribution history | `/join/**`, `/contributor/**` | contributor applications, answers, messages, events, onboarding | auth-access, UI, notifications | Medium |
| `app.creator` | Creator profile, verification and content workflow | `/creator/**` | Future creator records and content relationships | auth-access, UI, search-entity, moderation | Medium; incomplete |
| `app.moderation` | Community review, feedback and reports | `/moderation/**`, `/admin/community-art`, `/admin/feedback` | moderation decisions and audit events | auth-access, UI, creative, notifications | High |
| `app.operations` | Platform operations, users, diagnostics, roles, feature flags and administrative composition | `/operations/**`, remaining `/admin/**` | identity operations, audit, platform controls | all platform modules | High |

## Engines and services

| Module ID | Responsibility | Current form | Deployment posture |
|---|---|---|---|
| `engine.render` | Text analysis, layout, calibration, render evidence and repair | shared render code, Art Studio adapters, calibration operations | In-process initially; separate jobs only if evidence supports it |
| `engine.vision` | OCR/extraction, mapping, evidence, scans, corrections and authoring | Vision platform, worker scripts, Vision tables and storage | Candidate for isolated worker deployment after activation acceptance |
| `service.data-jobs` | Imports, verification runs, publication, Search refresh and scheduled processing | Vercel APIs/scripts/database operations | Keep statically owned; extract jobs incrementally |
| `service.redemption` | External gift-code provider transport, queue processing, throttling and health | Vercel/Supabase service paths and Edge Function | Candidate for operational isolation; preserve user-facing app separately |
| `service.player-provider` | Source-neutral player snapshot and provider-resilience boundary | current Player service, Edge Function and blocked research branches | Provider-dependent; no expansion while source contract is unavailable |

## Data ownership model

Database ownership is logical, not physical, during the first programme.

Each table, view, function, policy, storage bucket, Edge Function and migration must be classified as one of:

- **Platform-owned:** shared identity, permissions, editorial, publication, Search, analytics, notifications or entity identity.
- **Module-owned:** used authoritatively by one product or engine module.
- **Shared contract:** owned by one module or platform service but consumed by named dependants through a stable projection/API.
- **Legacy/unassigned:** requires explicit classification before structural work.

Rules:

1. One object has one accountable owner.
2. Read access by another module does not transfer ownership.
3. Cross-module writes require an owning service or reviewed database operation.
4. Product modules must not create duplicate canonical data stores.
5. Migrations remain in the central migration chain until a later governance decision.
6. A module extraction must not rename or relocate live database objects merely to match a directory structure.

## Installation model

During the first programme, installation means:

1. the module exists in the trusted repository;
2. its definition passes schema and dependency validation;
3. the static registry includes it;
4. feature flags and capability requirements are resolved;
5. route and navigation parity tests pass;
6. module-focused checks pass;
7. the full integration gate passes before release.

Installation does **not** mean downloading arbitrary packages or code from an external marketplace.

## Dependency rules

Allowed direction:

```text
Product App → Platform Contract → Platform Service → Repository/Persistence
Engine/Service → Platform Contract → Repository/Persistence
Shell → Module Definitions and public entry points
```

Forbidden patterns:

- product-to-product imports of internal implementation files;
- direct access to another module's private tables or privileged RPCs;
- provider-specific auth logic inside product modules;
- module-specific copies of shared permissions, Search or publication logic;
- circular dependencies;
- importing a module through its filesystem internals instead of its public entry point;
- runtime loading of untrusted or remotely hosted JavaScript;
- moving active-workstream code without owner-approved coordination.

## Protected ownership zones

Until explicitly released by their workstream owners:

- `platform.auth-access` is protected by `AUTH-EXP-001`.
- `app.creative` and `engine.render` are protected by the active Art Studio fidelity workstream.
- `engine.vision` and Player account-linking boundaries are protected by Forge Vision work.
- `service.player-provider` is protected by Player Intelligence and blocked Player API research.
- Companion Admin paths remain protected while provider recovery and Stage acceptance gates remain open.

A modularisation branch may document these zones and consume their published contracts. It must not modify their implementation.

## Pilot order

1. `app.reference` — proves registry, route parity and ownership with minimal persistent risk.
2. `app.companion` — first substantial product module after current Companion gates stabilise.
3. `app.contributor` and `app.creator` — naturally workspace-aligned and lower cross-domain load than Player/Operations.
4. `app.community` — after stable provider and identity contracts.
5. `app.player` — only after `AUTH-EXP-001` and Player provider boundaries are accepted.
6. `app.creative`, `engine.render` and `engine.vision` — only after active acceptance/recovery work closes.
7. `app.operations` and core platform packages — last, because they integrate most capabilities.

## Module Definition of Done

A module is not complete merely because files were moved. It is complete only when:

- its public entry point and dependency contract are explicit;
- all existing URLs and authorised behaviours remain compatible;
- route, navigation and permission metadata have one source of truth;
- data ownership and cross-module contracts are documented;
- focused validation can run independently;
- the full integration gate passes;
- preview and responsive acceptance pass where applicable;
- feature disablement and rollback are proven;
- observability identifies the module without exposing protected data;
- AEGIS, Blueprint, ADR, module catalogue and FRKS records describe current reality.
