# Forge Platform Roadmap

Roadmap status is governed by milestone exit criteria, not elapsed time.

## Current release control — Version 1.1.0 candidate

OPS-REBASE-001 is the active release-control sprint. It reconciles security dependencies, documentation, semantic versioning and legacy pull requests after the accepted Companion, Forge Vision, authentication, observability, Player resilience, Island Route and Oasis foundation deliveries. No new product-domain expansion begins until this candidate passes the full gate and exact-head production acceptance.

**OASIS-001A-PUB Phase 1 is implemented for review but not activated**: it proposes the governed publication schema, strict public projection, optimised public media, published-only loader, inactive Search adapter and a development-only acceptance harness. Phase 2 remains responsible for applying and accepting the migration, creating the first approved publication, registering published-only APIs and Search, exposing public routes/navigation, and repeating authenticated desktop/mobile acceptance. My Island, profile buffs and calculator injection remain later slices.

## Milestone 1 — Foundation — Complete

Established the initial public product, authentication, profiles, community foundations, admin access, dataset registry and data-engine preview/load capability.

## Milestone 2 — CMS & Publishing — Current

The shared Editorial, Data Studio, publication, version, rollback and Verification foundations are implemented. Buildings is the accepted complete vertical slice. Most other standard datasets remain partial at live publication/rollback acceptance, and Items Admin remains read-only Stage 1A. Milestone 2 therefore remains current.

### 2.0 Platform hardening — Implemented, ongoing maintenance

- green full repository gate and production build;
- CI quality workflows and focused module gates;
- checked-in Supabase migrations;
- shared contracts, safe errors and design primitives;
- dependency and release reconciliation through OPS-REBASE-001.

### 2.1 CMS core

- persistent dataset/record/version model
- generic record editor lifecycle
- server-side permissions
- validation framework
- audit events

### 2.2 Import management

- import run catalogue
- stage/diff workflow
- typed dataset definitions
- retries, errors and diagnostics

### 2.3 Review and publishing

- review/approval flow
- publish centre
- atomic publication
- history and rollback
- cache invalidation

### Milestone 2 exit criteria

At least Heroes, Events and Buildings complete the full import → draft → validate → approve → publish → history journey with automated tests and operational records.

## Milestone 3 — Platform Experience & Design System

- route architecture and code splitting
- design-system migration
- accessibility baseline
- global navigation and information architecture
- performance budgets

## Milestone 4 — Player & Community Platform — Partial

- Player Identity, screenshot/OCR-assisted linking and hybrid claim review are integrated;
- live external Player lookup remains disabled because the upstream read-only route was retired;
- mature player profiles
- alliance administration
- kingdom and transfer workflows
- notification foundations
- moderation tools

## Historical release line — integrated

The 0.7.x UX, Community Art, Auto Redeem foundation and Operations work were integrated into the later Version 1 production line. Their old branch labels are historical records, not current release candidates.

- shared visual tokens and surface patterns;
- responsive desktop and mobile navigation;
- consistent page headers, buttons and controls;
- loading, empty, error and success state polish;
- My Forge, Player Passport and public-page refinement;
- no new domains, product features, tables or schema changes.

## Forge Operations Centre — Partial platform capability

Sprint 8.0A established separated Player, Contributor, Creator, Moderation and
Operations workspaces. Sprint 8.0B adds the Forge Identity/User Management
foundation: safe server projections, multi-role capability resolution,
audited role/status mutations, masked Player Account summaries and Player View
Settings. Authenticated runtime, responsive and scale validation remain release
gates; unified audit, standalone role administration and feature flags are
deferred follow-up work.

### Workspace UX and Forge Contributors — Partial

- shared dark workspace surfaces, switcher and sidebar correction;
- typed Forge Contributor role catalogue and public `/join` experience;
- contributor programme and governance policy drafts;
- secure application workflow, Operations review, onboarding and contributor profile persistence foundation;
- final authenticated browser validation and release hardening remain in development.

## Milestone 5 — Intelligence & Automation

- calculators and planning tools from published data
- scheduled data refresh
- confidence/provenance surfaces
- search and recommendations
- event automation

Community Art Studio remains a completed contribution workflow. Auto Redeem preserves explicit consent, server-only provider transport, safe outcomes and private history, but provider-dependent operation remains unavailable while the required verified external Player contract is unavailable.

### Forge Vision and Screenshot Intelligence — Foundation integrated

Forge Vision now provides governed screenshot/OCR foundations and Player linking assistance. Wider player-stat, hero, progression and artwork ingestion remain separate review-gated extensions; OCR evidence does not bypass human review or canonical publication.

## Milestone 6 — Ecosystem & Scale

- stable public APIs
- integrations
- contribution workflows
- operational scaling and service extraction only where evidence requires it
