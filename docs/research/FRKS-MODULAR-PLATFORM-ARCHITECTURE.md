# FRKS — Forge Modular Platform Architecture

**FRKS record date:** 5 August 2026  
**Knowledge status:** Proposed, pending owner acceptance and documentation merge  
**Source programme:** `MOD-DOC-001`

## Permanent knowledge summary

Kingshot Forge should evolve through a statically composed modular monorepo rather than continuing indefinitely with one central route/package boundary or moving prematurely to runtime plugins and independently deployed applications.

The architecture preserves:

- one canonical GitHub repository;
- one Forge production shell;
- one governed Supabase project;
- one canonical identity, permission, editorial, Search and publication authority;
- one release line and full integration gate.

It introduces:

- trusted module definitions;
- static module registration;
- explicit public entry points;
- module ownership of routes, navigation, capabilities, data objects and tests;
- inward dependency enforcement;
- focused validation;
- feature disablement and rollback contracts.

## Verified audit baseline

Repository baseline audited:

`fe66d98a0685abc7e03e38d0ef0771dae3d4447a`

The current source has:

- one Vite application build;
- one TypeScript application scope covering `src`;
- one root package manifest;
- central route composition in `src/App.tsx`;
- conceptual Player, Contributor, Creator, Moderation and Operations workspaces;
- focused tests plus one large all-platform `npm run check` chain.

The connected Supabase project was read in read-only mode and recorded:

- 103 public tables;
- 15 public views;
- 52 public functions;
- 34 `SECURITY DEFINER` functions;
- 191 public-schema foreign keys;
- four active JWT-protected Edge Functions.

The database contains mature functional clusters but substantial shared authority and cross-domain relationships. This is evidence for logical ownership, not for immediate database separation.

## Core decision

The initial module model is trusted and static:

```text
Platform Shell
  + Platform Modules
  + Product Application Modules
  + Engines and Services
  = One assembled Kingshot Forge release
```

Runtime-loaded remote JavaScript, microfrontends, external plugin marketplaces and separate product databases are explicitly not part of the initial architecture.

## Module map

### Platform

- `platform.shell`
- `platform.auth-access`
- `platform.ui`
- `platform.data-editorial`
- `platform.search-entity`
- `platform.observability`
- `platform.notifications`

### Product applications

- `app.reference`
- `app.player`
- `app.companion`
- `app.community`
- `app.creative`
- `app.gift-centre`
- `app.contributor`
- `app.creator`
- `app.moderation`
- `app.operations`

### Engines and services

- `engine.render`
- `engine.vision`
- `service.data-jobs`
- `service.redemption`
- `service.player-provider`

## Authentication dependency knowledge

Authentication is platform core and is not a product module.

`AUTH-EXP-001` Phase 1B is independently verifying live PKCE/implicit behaviour, callback posture, Supabase Auth configuration, SMTP, providers and identity linking. Source inspection alone did not prove the live flow.

No modular implementation may edit auth behaviour or configuration until that report is accepted. Product modules should later consume a stable Auth/access facade and capability contract, never provider-specific subjects, tokens or metadata as Forge identity.

## Sequencing knowledge

The agreed safe sequence is:

1. documentation and architecture gate;
2. `AUTH-EXP-001` evidence and owner decision;
3. `MOD-FOUND-001` contract/registry foundation with no feature moves;
4. `app.reference` low-risk registration proof;
5. Companion as the first substantial application pilot after active gates stabilise;
6. internal workspace packages only after at least two modules are proven;
7. Player, Community, Creative, Render and Vision moves only after their protected workstreams close;
8. Operations last;
9. separate workers only where operational evidence and cost approval justify them.

## Rejected approaches

- One central application forever: insufficient long-term ownership and collision control.
- Separate repository per application now: too much coordination and contract fragmentation.
- Runtime microfrontends: unjustified complexity, availability and security risk.
- External plugin marketplace: not appropriate for the initial trust model.
- Separate Supabase project per module: would fragment canonical authority and multiply cost/operations.
- Immediate broad file movement: architecture theatre without proven contracts.

## Acceptance rules

A module is complete only when its public contract, dependencies, route/navigation/capability ownership, data ownership, focused checks, full integration gate, observability, disablement and rollback are proven.

Module boundaries never replace server-side RLS, API authentication, RPC grants, audit or publication controls.

## Canonical supporting records

- `docs/ADR/ADR-014-modular-platform-architecture.md`
- `docs/audits/PLATFORM-MODULARITY-AUDIT-2026-08-05.md`
- `docs/architecture/FORGE-MODULE-CATALOGUE.md`
- `docs/plans/MODULAR-PLATFORM-WORKING-PLAN.md`
- `docs/AEGIS-MODULAR-PLATFORM-ADDENDUM.md`
- `docs/FORGE-BLUEPRINT-MODULAR-PLATFORM-ADDENDUM.md`

Future FRKS updates must record superseding decisions rather than silently replacing this history.
