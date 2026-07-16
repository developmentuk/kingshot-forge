# Kingshot Forge Blueprint

## Product Vision

Kingshot Forge is the trusted, connected companion platform for Kingshot players, alliances and kingdoms. It turns reliable game knowledge, community workflows and player identity into practical tools that are easy to use, safe to operate and available wherever the community needs them.

Forge is not a collection of disconnected calculators. It is one coherent platform in which canonical content is created once, governed carefully and consumed consistently across public pages, administration tools, profiles, planners, APIs and future integrations.

## Product Principles

1. **Players first.** Every capability must solve a clear player, alliance, kingdom or editorial need.
2. **Trust through provenance.** Facts, estimates and editorial judgement must be distinguishable and traceable.
3. **Publish once, consume everywhere.** Canonical content is published through the platform and reused by every consumer.
4. **Complete vertical slices.** A capability is delivered end to end, not as disconnected layers or unfinished scaffolding.
5. **Simple before clever.** Challenge complexity that does not improve safety, maintainability or user value.
6. **Secure by design.** Authentication, authorisation and mutation enforcement belong on the server.
7. **History is immutable.** Editorial changes create new versions and auditable events rather than rewriting the past.
8. **Mobile is a first-class surface.** Core workflows must work on supported desktop and mobile layouts.
9. **Production is the proof.** Local success is insufficient until the deployed runtime and data path are verified.

## Product Pillars

### 1. Canonical Game Knowledge

Structured Kingshot datasets with provenance, confidence, validation, version history and controlled publishing.

### 2. Player Identity and Progression

Verified player profiles, hero collections, progression records, favourites and personalised planning.

### 3. Alliance and Kingdom Operations

Recruitment, transfers, communities, event coordination, permissions and shared operational tools.

### 4. Planning and Decision Support

Calculators, event preparation, progression forecasts and recommendations powered by canonical data.

### 5. Community Creation

Compatible names, banners, artwork, chat content, submissions and reusable community resources.

### 6. Editorial Governance

A complete content lifecycle from draft through review, approval, publication, archive, restore and rollback.

## Domain Model

Forge is organised around explicit domains rather than pages.

### Core platform domains

- **Identity:** users, authentication, Forge roles and linked Kingshot accounts.
- **Editorial:** records, immutable versions, workflow state, audit events and concurrency.
- **Publishing:** publication queue, schedules, retries, cancellation and live projection.
- **Datasets:** contracts, adapters, validation, provenance, confidence and canonical record keys.
- **Permissions:** platform roles, dataset policies and server-side capability checks.
- **Feedback:** issue reports, feature suggestions and triage metadata.

### Product domains

- **Hero Domain:** heroes, skills, progression, gear, exclusive gear, shards and player collections.
- **Player Domain:** public profiles, game identity, kingdom history and preferences.
- **Alliance Domain:** alliances, membership, leadership, recruitment and shared resources.
- **Kingdom Domain:** kingdoms, administration, KvK history and community information.
- **Transfer Domain:** eligibility, applications, invitations, passes and movement history.
- **Event Domain:** event definitions, schedules, scoring, planning and live coordination.
- **Progression Domain:** buildings, troops, research, gear, charms, VIP and resource planning.
- **Creative Domain:** names, chat, banners, artwork and compatibility rules.

The **Hero Domain is the reference implementation** for proving how canonical data, editorial workflows, public consumption and personalised player data work together.

## Capability Matrix

| Capability | Platform owner | First reference domain | Required outcome |
|---|---|---|---|
| Canonical records | Dataset platform | Heroes | One governed live record per canonical key |
| Structured editing | Editorial platform | Heroes | Schema-driven editing with validation |
| Draft and review | Editorial platform | Heroes | Controlled workflow with role enforcement |
| Version history | Editorial platform | Heroes | Immutable versions, comparison and rollback |
| Publication | Publishing platform | Heroes | Queue-backed publication to the live dataset |
| Public consumption | Product domain | Heroes | Public pages read the published canonical record |
| Personalisation | Player platform | Hero collection | User-owned progression separate from canonical facts |
| Provenance | Dataset platform | Heroes | Source, confidence and verification metadata |
| Search and discovery | Shared platform | Heroes | Consistent filtering, sorting and record lookup |
| Media | Shared platform | Hero images | Managed assets with permissioned uploads |
| Audit and operations | Shared platform | Heroes | Traceable actions and operable failure states |

A shared capability must be implemented once at platform level and adopted by domains. Domain-specific behaviour may extend the platform but must not duplicate or bypass it.

## Forge Values

- **Clarity:** understandable code, documentation and user journeys.
- **Integrity:** honest data quality, visible uncertainty and auditable decisions.
- **Craft:** production-quality implementation and thoughtful user experience.
- **Stewardship:** protect the platform from shortcuts that create future instability.
- **Momentum:** finish the current slice before expanding scope.
- **Community:** build with and for the people who use Forge.

## Definition of Done

A capability is done only when all applicable conditions are met:

- the user outcome works end to end;
- architecture and domain boundaries are respected;
- server-side authentication and permissions are enforced;
- data contracts, validation and error states are complete;
- persistence and migrations are verified where required;
- automated checks pass without new blocking warnings;
- desktop and mobile behaviour is validated;
- the Vercel runtime compiles and deploys the exact commit;
- production or preview smoke testing passes as defined by the sprint;
- operational failure, retry and recovery paths are addressed;
- documentation, roadmap and release notes are updated;
- the work is committed to GitHub with a clear message.

No capability is declared complete because its UI exists, its database table exists or its happy path works in isolation.

## Epic Roadmap

### Foundation Phase — Complete

Established the application shell, authentication, Supabase integration, Data Engine, dataset contracts, permissions, editorial workflow, immutable history, publication operations, governance and the Hero reference path.

### Epic 2 — Hero Domain Complete

Complete the canonical Hero Domain as the reference implementation:

1. Hero Skills
2. Hero progression and star-up
3. Hero gear and exclusive gear
4. Hero collection and player-owned progression
5. Public Hero experience
6. Domain-wide validation, documentation and release hardening

### Epic 3 — Player Domain Complete

Complete verified player identity, public profiles, linked game data and personalisation.

### Epic 4 — Alliance and Kingdom Domains

Complete communities, roles, membership, administration and shared operational surfaces.

### Epic 5 — Transfer Hub

Complete recruitment, applications, eligibility, invitations, passes and transfer history.

### Epic 6 — KvK and Event Operations

Complete preparation planning, scoring, live coordination, reminders and historical analysis.

### Epic 7 — Progression and Planning

Complete building, troop, research, gear, charm, VIP and resource planning tools.

### Epic 8 — Community Creation

Complete the creative studios, submissions, moderation and reusable community library.

The order may change through evidence and community priorities, but only one active epic is developed at a time.

## Release Methodology

Forge uses an **Epic → Sprint → Release** model.

- An **Epic** delivers a complete product domain or major platform outcome.
- A **Sprint** delivers one production-quality vertical slice within that epic.
- A **Release** packages tested sprint outcomes into a deployable, documented version.

Working rules:

1. One epic, one sprint and one release are active at a time.
2. Each sprint begins with a defined user outcome, scope, acceptance criteria and affected contracts.
3. Each sprint reuses existing platform capabilities before introducing new abstractions.
4. Every release ends with end-to-end testing, documentation updates, a GitHub commit, Vercel deployment, smoke testing and Release Notes updates.
5. Release candidates remain on a focused branch until validation is complete.
6. `main` represents the accepted production line.
7. Tags identify completed releases using semantic versioning.
8. Deferred work is documented explicitly; it is never silently treated as complete.

## Blueprint Protection

Changes that alter product pillars, domain boundaries, canonical publishing, security principles, release methodology or the Definition of Done require an Architecture Decision Record and an update to this blueprint.

The blueprint should evolve deliberately, not drift through implementation convenience.
