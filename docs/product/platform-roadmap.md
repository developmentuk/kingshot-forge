# Forge Platform Roadmap

Roadmap status is governed by milestone exit criteria, not elapsed time.

## Milestone 1 — Foundation — Complete

Established the initial public product, authentication, profiles, community foundations, admin access, dataset registry and data-engine preview/load capability.

## Milestone 2 — CMS & Publishing — Current

Release 0.7.1 Sprint 9.3 has established the local Hero Skills source-governance, canonical-contract and schema-proposal foundation. Approved source coverage, migration application, compatible atomic publication and public consumption remain blockers; Hero Skills is not yet a canonical dataset.

### 2.0 Platform hardening

- restore green build/lint
- secure repository snapshot process
- CI quality gates
- checked-in database migrations
- shared contracts and server errors
- initial design tokens/primitives

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

## Milestone 4 — Player & Community Platform

- Player Identity disabled vertical slice completed locally in Sprint 9.4; migration recovery, non-production rehearsal and explicit approval remain before enablement
- mature player profiles
- alliance administration
- kingdom and transfer workflows
- notification foundations
- moderation tools

## Release 0.7.3 — Forge UX Polish — In development

The accepted player-facing journeys are being refined through a focused shared UX pass. This work keeps the existing architecture and data boundaries intact while standardising visual tokens, navigation, cards, forms, responsive behaviour, keyboard focus and reduced-motion support.

- shared visual tokens and surface patterns;
- responsive desktop and mobile navigation;
- consistent page headers, buttons and controls;
- loading, empty, error and success state polish;
- My Forge, Player Passport and public-page refinement;
- no new domains, product features, tables or schema changes.

## Milestone 5 — Intelligence & Automation

- calculators and planning tools from published data
- scheduled data refresh
- confidence/provenance surfaces
- search and recommendations
- event automation

Release 0.7.4 Community Art Studio remains a completed, separate contribution workflow. Release 0.7.5 Auto Redeem is ready for Clark's final production validation: it adds explicit consent, verified linked-player eligibility, server-only provider transport, user-triggered sequential processing, safe outcomes and private history while preserving manual Gift Code copying. It is not live and production provider access remains disabled until the final checks pass.

### Future platform initiative — Forge Screenshot Intelligence Engine

Future work only; explicitly out of scope for Release 0.7.0 Sprint 9.2. This proposed capability may eventually support Kingshot screenshot classification, OCR-assisted data extraction, player-stat import, hero and progression import, artwork extraction, automatic image alignment, renderer comparison, and human review with confidence scoring. No OCR, computer-vision dependency, automatic matching or scoring is introduced by the current Render Engine work.

## Milestone 6 — Ecosystem & Scale

- stable public APIs
- integrations
- contribution workflows
- operational scaling and service extraction only where evidence requires it
