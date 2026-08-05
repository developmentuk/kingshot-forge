# ADR-014 — Modular Platform Architecture

- **Status:** Proposed
- **Date:** 5 August 2026
- **Decision owner:** Clark
- **Engineering partner:** Aegis
- **Related workstreams:** `MOD-DOC-001`, `MOD-FOUND-001`, `AUTH-EXP-001`

## Context

Kingshot Forge began as one Vite and React application and has evolved into a broad platform containing player identity and progression, canonical game data, Companion experiences, creative tools, editorial workflows, Search, contributor and creator workspaces, moderation, Operations, Gift Centre, Render Engine and Forge Vision.

Logical boundaries already exist through:

- AEGIS domains;
- Blueprint platform and product domains;
- workspace-aware navigation;
- capability-based access;
- focused tests;
- domain services and governed Supabase data.

Physical composition has not kept pace. Most routes remain declared in one `src/App.tsx`, all source compiles through one application TypeScript boundary, one root package owns dependencies and scripts, and the canonical check chain runs almost the entire platform.

This creates increasing collision risk between parallel workstreams and makes small changes pay the validation cost of unrelated capabilities.

At the same time, Forge's data, identity, editorial, publication, Search and audit guarantees depend on shared authority. A premature move to independently deployed applications or databases would introduce duplication, drift and additional cost.

## Decision

Kingshot Forge will evolve through a **statically composed modular monorepo**.

The initial architecture will retain:

- one canonical GitHub repository;
- one trusted production shell;
- one production Vercel application for the user-facing platform;
- one governed production Supabase project;
- one canonical release line and lockfile;
- one full platform integration gate.

Forge will introduce:

- typed module definitions;
- a trusted static module registry;
- explicit public entry points;
- route, navigation, capability and feature metadata owned together;
- logical database-object ownership;
- dependency-direction enforcement;
- module-focused validation;
- compatibility and rollback contracts.

Modules will be installed at build time from trusted repository source. Forge will not initially load arbitrary or remotely hosted JavaScript at runtime.

## Module classes

### Platform modules

Own shared authority such as:

- application shell;
- authentication and access;
- UI and navigation;
- data, editorial and publication;
- Search and entity identity;
- analytics and observability;
- notifications.

### Product application modules

Own coherent user-facing outcomes such as:

- Reference and Library;
- Player;
- Companion;
- Community;
- Creative;
- Gift Centre;
- Contributor;
- Creator;
- Moderation;
- Operations.

### Engines and services

Own specialist processing or provider operations such as:

- Render Engine;
- Forge Vision;
- data and publication jobs;
- redemption provider processing;
- player-provider adapters.

## Authentication decision boundary

Authentication is a protected platform-core capability, not an installable product application.

`AUTH-EXP-001` Phase 1B currently owns verification of:

- the live OAuth flow classification;
- PKCE versus implicit behaviour;
- callback and return-destination design;
- Supabase Auth configuration;
- SMTP and Auth email readiness;
- provider readiness;
- identity-linking behaviour;
- duplicate-account and metadata risks.

ADR-014 does not decide or alter those matters.

No modular implementation may modify the Supabase client, Auth context, callback behaviour, provider settings, Auth configuration or identity-linking path until the Phase 1B evidence report and explicit owner gate are complete.

Product modules will consume an accepted authentication/access facade and capability contract. They will not implement provider-specific login behaviour or depend directly on provider subject identifiers.

## Persistence decision

The production Supabase project remains one governed data authority.

Database separation is rejected for the initial programme because:

- canonical content, publication, Search and entity identity are shared platform concerns;
- player, alliance, kingdom, transfer and operations records have legitimate relationships;
- central roles, permissions and audit are security controls;
- the current schema contains substantial foreign-key and function coupling;
- separate projects would create migration, authentication, observability and cost overhead.

Instead, every database object will receive a logical owner and supported consumer contract.

## Deployment decision

User-facing applications remain statically composed into one shell initially.

Engines and workers may later become independently deployable only when evidence shows a concrete need such as:

- timeout or memory pressure;
- independent scaling;
- provider failure isolation;
- queue or scheduled workload characteristics;
- materially different release or security requirements.

Separate deployment is an operational decision, not an automatic consequence of modular source structure.

## Compatibility requirements

Module extraction must preserve:

- all accepted public and internal routes;
- compatibility aliases;
- permission and capability guards;
- published-only data consumption;
- existing authenticated and anonymous behaviour;
- responsive and accessible states;
- observability and privacy controls;
- release and rollback procedures.

A module conversion is not permitted to bundle an unrelated redesign or data migration.

## Alternatives considered

### Continue with one central application indefinitely

Rejected as the long-term direction because central route composition and whole-platform validation increasingly conflict with parallel work and independent ownership.

Retained temporarily as the runtime baseline while modular contracts are introduced incrementally.

### Separate repository for each application

Rejected for the initial programme because it would fragment shared contracts, complicate atomic changes, increase release coordination and conflict with the current small-team and cost-conscious operating model.

This may be reconsidered only if independently staffed teams and release lines emerge.

### Runtime microfrontends or remote module federation

Rejected because current needs do not justify:

- runtime dependency/version conflicts;
- duplicate framework code;
- remote module availability risks;
- more complex authentication and styling boundaries;
- greater supply-chain and observability complexity;
- additional deployments and cost.

### External plugin marketplace

Rejected for the foreseeable initial architecture. Forge modules are trusted first-party or explicitly reviewed repository code, not arbitrary third-party execution.

### Separate Supabase project per module

Rejected because it would split canonical authority and multiply Auth, RLS, migration, backup, monitoring and cost responsibilities.

## Consequences

### Positive

- parallel work can own clearer path and contract boundaries;
- routes, navigation and permissions can share one source of truth;
- focused checks can reduce feedback time and unnecessary CI use;
- modules can be enabled, upgraded or rolled back more predictably;
- shared platform authority remains intact;
- future worker isolation remains possible without forcing microfrontends;
- architecture aligns with existing AEGIS and Blueprint principles.

### Negative

- the foundation introduces contract and registry work before visible product features;
- the monorepo still requires a full integration gate;
- temporary duplication may exist during compatibility transitions;
- ownership classification across more than 100 tables and many APIs/functions requires deliberate work;
- poorly chosen package boundaries could create ceremony or circular dependencies;
- active-workstream coordination remains necessary during migration.

## Implementation order

1. Approve documentation and architecture decision.
2. Complete `AUTH-EXP-001` Phase 1B and record the accepted Auth contract.
3. Deliver `MOD-FOUND-001` as contract and registry scaffolding only.
4. Prove static registration with the low-risk `app.reference` module.
5. Pilot a substantial product boundary with Companion after its active gates stabilise.
6. Introduce internal workspace packages only after at least two module boundaries are proven.
7. Consider worker/service deployment separation only from operational evidence.

## Implementation gates

Before each module migration:

- start from latest clean `origin/main`;
- audit branches, pull requests and worktrees;
- publish an exact ownership and protected-path map;
- preserve route and permission parity;
- prove focused and full integration checks;
- validate exact-head preview behaviour;
- document disablement and rollback;
- avoid destructive or unnecessary data changes;
- update AEGIS, Blueprint, catalogue, ADR and FRKS records.

## Security consequences

The module registry is trusted code and must fail closed for:

- duplicate IDs or routes;
- missing dependency declarations;
- unknown capabilities;
- dependency cycles;
- invalid feature flags;
- ambiguous data ownership;
- unregistered privileged operations.

Module boundaries do not replace server-side enforcement. RLS, RPC permissions, API authentication and audit remain authoritative regardless of UI composition.

## Review and acceptance

This ADR becomes accepted only when the owner approves and merges the documentation change. Implementation remains separately gated.

Any future move to runtime plugins, microfrontends, separate product repositories, separate product databases or independently deployed user-facing applications requires a new ADR.
