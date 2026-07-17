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

- mature player profiles
- alliance administration
- kingdom and transfer workflows
- notification foundations
- moderation tools

## Milestone 5 — Intelligence & Automation

- calculators and planning tools from published data
- scheduled data refresh
- confidence/provenance surfaces
- search and recommendations
- event automation

## Milestone 6 — Ecosystem & Scale

- stable public APIs
- integrations
- contribution workflows
- operational scaling and service extraction only where evidence requires it
