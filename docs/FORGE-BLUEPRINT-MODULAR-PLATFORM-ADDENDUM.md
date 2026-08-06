# Kingshot Forge Blueprint — Modular Platform Addendum

**Status:** Proposed product-architecture companion  
**Parent blueprint:** `docs/FORGE_BLUEPRINT.md`  
**Decision record:** `docs/ADR/ADR-014-modular-platform-architecture.md`

## Product architecture direction

Kingshot Forge remains one connected companion platform, not a collection of unrelated websites. The modular platform approach changes how Forge capabilities are assembled and owned; it does not fragment the player experience or canonical data model.

Forge will evolve as:

```text
One Forge experience
  → one trusted platform shell
  → shared platform capabilities
  → statically installed product applications
  → specialist engines and operational services
```

## Platform shell

The Forge shell owns:

- application bootstrap and recovery;
- global layout and workspace switching;
- trusted module registration;
- top-level route composition;
- global navigation composition;
- shared unavailable and failure states;
- platform version and release identity.

The shell does not own product-domain business logic.

## Shared platform capabilities

Shared capabilities are implemented once and consumed consistently:

- authentication and Forge access;
- roles, permissions and account status;
- UI system and accessibility;
- canonical data, editorial workflow and publication;
- entity identity, relationships and Search;
- analytics, Sentry and operational observability;
- notifications and future channel delivery;
- audit, release and rollback controls.

A product application may extend a platform capability through a supported contract. It may not duplicate or bypass it.

## Product application families

### Reference and Library

Owns compatibility guidance, character references, Codex, Roadmap and Release Notes. This is the first low-risk static-registration proof.

### Player

Owns My Forge, Player Passport, profile, progression, Hero collection and public player presentation. It consumes the platform Auth and identity contract and published Companion data.

### Companion

Owns trusted public game knowledge, entity experiences, Buildings and planning tools. It consumes canonical published projections and does not own the editorial engine that publishes them.

### Community

Owns Kingdom, Alliance, Transfer and KvK community experiences. It uses shared Player Identity, permissions and provider contracts.

### Creative

Owns Name Studio, Chat Studio, Art Studio, compatibility-aware creation and Community Art journeys. Render Engine remains a reusable engine rather than an Art Studio-only implementation detail.

### Gift Centre

Owns gift-code discovery, eligibility, consent and user-facing redemption state. Provider transport, queue execution and throttling remain protected service responsibilities.

### Contributor and Creator

Own voluntary contributor applications, contribution journeys, creator profiles, verification and content workflows. They consume shared identity, moderation, publication and Search capabilities.

### Moderation

Owns community review queues, reports, feedback triage and moderation decisions. It consumes platform permissions and append-only audit.

### Operations

Owns operational administration, users, diagnostics, roles, audit views, feature flags and cross-platform health. It composes platform operational surfaces but does not absorb product-domain ownership.

## Engines and operational services

Render Engine, Forge Vision, data/publication jobs and external provider workers are modelled separately from applications because they have different processing, scaling, security and failure characteristics.

They remain part of the Forge monorepo and release governance initially. Independent deployment is considered only where operational evidence and cost approval justify it.

## Installation experience

A trusted Forge application is installed by:

1. adding or updating its repository-local module implementation;
2. validating its module definition and dependencies;
3. registering it in the trusted static registry;
4. resolving capabilities and feature flags;
5. passing focused and full-platform checks;
6. deploying the assembled Forge shell through the normal release process.

This model allows application ownership and rollback without presenting users with separate websites or accounts.

## Product experience requirements

Modularisation must remain invisible in the best sense:

- one account and session;
- consistent navigation and visual language;
- stable URLs;
- coherent Search and entity links;
- shared notification and feedback patterns;
- no repeated profile or permission setup;
- no conflicting copies of game facts;
- no module-specific security shortcuts.

A module that feels like an unrelated embedded site has failed the Forge product model.

## Roadmap insertion

The modular platform programme is a platform-enablement epic that runs through deliberately bounded sprints rather than displacing active accepted product work.

Recommended sequence:

1. architecture audit and decision;
2. module contract and trusted registry;
3. Reference and Library registration proof;
4. Companion application pilot;
5. Contributor and Creator workspace modules;
6. internal workspace packages where proven;
7. Player and Community extraction after Auth/provider stabilisation;
8. Creative, Render and Vision extraction after active acceptance work;
9. Operations consolidation last;
10. selective worker isolation from operational evidence.

## Success measures

The modular platform programme succeeds when:

- a trusted application can be registered without editing unrelated product modules;
- route, navigation and permission ownership have one source of truth;
- focused module checks provide materially faster feedback;
- the full release gate remains intact;
- modules can be disabled and rolled back safely;
- canonical data and shared identity remain singular;
- parallel workstreams have enforceable ownership boundaries;
- deployment and infrastructure cost do not increase without justified value.

## Product constraints

The following require a separate future decision:

- third-party runtime plugins;
- a public module marketplace;
- microfrontend or remote-module architecture;
- separate accounts or authentication per application;
- separate canonical databases;
- separate user-facing domains or deployments;
- paid recurring infrastructure introduced only for development convenience.
