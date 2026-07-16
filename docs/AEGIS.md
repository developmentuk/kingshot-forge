# Kingshot Forge Project Constitution

`docs/AEGIS.md` is the authoritative operational constitution for Kingshot Forge. It governs how the platform is designed, implemented, validated and released. Supporting product direction remains in `docs/FORGE_BLUEPRINT.md`; binding architectural decisions remain in `docs/ADR/`; detailed engineering standards remain in `governance/`.

## Identity and canonical systems

- Product: **Kingshot Forge**
- Product owner: **Clark**
- Engineering partner: **Aegis**
- Repository: `developmentuk/kingshot-forge`
- Production: `https://kingshot-forge.vercel.app/`
- Supabase project: `hrvdhjscwitqpwjhnjkm`
- Google Analytics measurement ID: `G-8L3HYETN51`
- GitHub is the canonical source for code and documentation.
- Supabase is the canonical source for persistent platform data.
- Never expose secrets, service-role keys, access tokens or OAuth URLs.

## Forge Principles

1. **Players first.** Every capability must solve a clear player, alliance, kingdom or editorial need.
2. **One canonical source of truth.** Canonical facts are authored once, published once and consumed everywhere.
3. **Editorial before intelligence.** Recommendations, calculators and intelligence must depend on governed published data.
4. **Provenance is mandatory.** Every material fact must be traceable to evidence and an editorial decision.
5. **Verification before publication.** Unreviewed or unverified records must not become canonical public data.
6. **Evidence is first-class data.** Sources, supporting evidence, dates and confidence are structured records, not informal notes.
7. **Domains before features.** Shared domain capabilities are completed before disconnected feature expansion.
8. **Complete vertical slices.** A capability is delivered end to end, not as isolated UI, database or API scaffolding.
9. **History is immutable.** Editorial and audit history is append-only; rollback creates a new version.
10. **Server-side authority.** Permissions, publication, privileged mutations and audit records are enforced on the server.
11. **Mobile first.** Core administration and public workflows must work on supported mobile layouts.
12. **Shared design system.** New surfaces reuse established components, interaction patterns and responsive behaviour.
13. **Every fact is explainable.** Users and editors must be able to understand where a fact came from and how trustworthy it is.
14. **Simple before clever.** Challenge complexity that does not improve safety, maintainability or user value.
15. **Production is the proof.** Local success is insufficient until the exact commit is deployed and smoke-tested.

## Domain Architecture

Forge is organised into explicit domains rather than isolated pages.

### Domain 0 — Editorial Intelligence

Owns evidence acquisition, source staging, provenance, confidence, verification logic, completeness measurement and readiness reporting.

### Domain 1 — Editorial Platform

Owns canonical records, immutable versions, structured editing, validation, workflow, permissions, publishing, archive, restore, rollback, audit and dataset administration.

### Domain 2 — Player

Owns verified player identity, profiles, player-owned progression, preferences and public visibility. Player data may reference canonical records but must not duplicate canonical facts as an editable second source of truth.

### Domain 3 — Alliance

Owns alliances, membership, leadership, permissions, recruitment and shared operational resources.

### Domain 4 — Kingdom

Owns kingdoms, administration, state history, KvK relationships and community information.

### Domain 5 — Intelligence

Owns analysis, recommendations, comparisons and decision support powered exclusively by published canonical data.

### Domain 6 — Calculators

Owns calculators, planners and forecasts powered exclusively by published canonical datasets and explainable formulas.

### Dependency direction

```text
Public/Admin UI → Domain Service → Platform Service → Repository Contract → Persistence
```

Dependencies point inward toward stable contracts. Domain code may extend shared platform behaviour but must not bypass dataset, editorial, publishing, permission, history or audit services.

## Editorial Intelligence

Editorial Intelligence converts external observations and community knowledge into governed evidence suitable for editorial review.

Required capabilities:

- source registration and source identity;
- discovery and import timestamps;
- raw evidence preservation;
- normalised source facts;
- multiple evidence sources per canonical claim;
- source reliability and confidence assessment;
- conflict identification;
- editorial notes and supporting evidence;
- verification coverage and completeness metrics;
- no automatic publication from source staging.

Source-staging data is evidence, not canonical truth. It must pass normalisation, review and verification before publication.

## Verification Centre

The Verification Centre is the shared operational surface for reviewing evidence and deciding whether records are ready to publish.

Every editorial record must support:

- source name;
- source URL;
- discovery date;
- import date;
- verification status;
- confidence score and band;
- editorial notes;
- supporting evidence;
- reviewer and review date;
- lifecycle and audit history.

Canonical lifecycle:

```text
Discovered → Imported → Normalised → Reviewed → Verified → Published → Archived
```

Lifecycle transitions are explicit named operations. Incidental field edits must not silently change workflow state.

## Canonical Data Model

Canonical content describes Kingshot facts or Forge editorial judgement. Personal and operational data belongs to players, alliances or kingdoms.

Canonical records require:

- stable dataset ID and record key;
- schema-backed values;
- immutable versions;
- a mutable record head using optimistic concurrency;
- provenance and confidence metadata;
- validation results;
- explicit workflow status;
- append-only audit events;
- an explicit published projection.

> **Publish once. Consume everywhere.**

A consumer must not maintain an independent editable copy of canonical facts. Personal data may reference canonical records by stable keys. Immutable snapshots are permitted only where audit or historical display requires them.

## Editorial Workflow

The standard workflow is:

1. Discover evidence.
2. Import and preserve the raw source payload.
3. Normalise source facts against the dataset contract.
4. Create or update a draft canonical record.
5. Validate the record and provenance.
6. Submit for review.
7. Review evidence, conflicts and confidence.
8. Verify or return for changes.
9. Approve publication through server-side permissions.
10. Publish through the shared publishing platform.
11. Consume the published projection from approved services, adapters or APIs.
12. Archive, restore or rollback through new immutable versions.

Drafts and staged evidence must never be consumed by public product surfaces.

## Evidence and Provenance

Evidence is stored independently from canonical editorial conclusions so that multiple sources can support or contradict the same claim.

Minimum provenance requirements:

- source identity and URL;
- retrieval or discovery date;
- import run and imported date where applicable;
- raw or preserved supporting evidence;
- normalisation method;
- claim or record association;
- reviewer notes;
- verification decision;
- confidence rationale.

Conflicting evidence must remain visible. Editors resolve conflicts through an auditable decision rather than deleting inconvenient source material.

## Confidence Model

Confidence expresses the strength of evidence for a fact; it is not a substitute for workflow status.

Standard bands:

- **95–100 — Verified:** multiple independent sources agree and material values have direct in-game or authoritative confirmation.
- **85–94 — Confirmed:** two or more credible sources agree, without complete independent in-game confirmation.
- **70–84 — Likely:** one credible source or partially corroborated evidence is internally consistent.
- **50–69 — Estimated:** sources conflict, definitions differ or the best-supported value remains uncertain.
- **0–49 — Tentative:** weak, incomplete, old or single-source evidence requiring further investigation.

Confidence must include a rationale and may be assessed at dataset, record and material-field level. A high confidence score does not bypass review or verification.

## Design System

All Forge surfaces must reuse the shared design system.

Required standards:

- consistent page shells, navigation, cards, forms, tables, badges, dialogs and feedback states;
- accessible labels, focus behaviour, keyboard use and semantic structure;
- responsive layouts that do not depend on desktop-only tables;
- readable status and confidence language that does not rely on colour alone;
- loading, empty, unavailable, validation-error and permission-denied states;
- no placeholder pages in production-ready domains;
- no domain-specific redesign where shared components already solve the need.

## Quality Gates

A milestone is complete only when all applicable gates pass:

- the project builds successfully;
- automated checks pass without new blocking warnings;
- the feature works locally;
- the exact commit deploys successfully to Vercel;
- the deployed runtime is smoke-tested;
- desktop and mobile workflows are validated;
- canonical datasets and published projections are used correctly;
- server-side permissions are enforced;
- validation and failure states work;
- migrations and persistent data paths are verified;
- documentation describes current reality;
- Forge Principles are met.

Known warnings are non-blocking only when documented and unchanged in count and scope.

## Definition of Done

A capability is done only when:

- its intended user outcome works end to end;
- architecture and domain boundaries are respected;
- authentication and authorisation are enforced on the server;
- data contracts, validation, provenance and confidence are complete;
- persistence and migrations are verified where required;
- immutable history and audit events are present for material mutations;
- publication is explicit, observable and recoverable;
- public consumers read published-only data;
- desktop and mobile states are complete;
- local, Vercel and production or preview validation pass;
- documentation, Roadmap and Release Notes are updated;
- the work is committed to GitHub with a coherent message.

A UI, table, endpoint or happy path alone is never sufficient evidence of completion.

## Sprint Methodology

Forge uses an **Epic → Sprint → Milestone → Release** model.

1. One active epic, sprint and release are developed at a time.
2. A sprint begins with a defined objective, scope, acceptance criteria and affected contracts.
3. Work proceeds milestone-first; one milestone is completed before the next begins.
4. Each milestone reuses existing platform capabilities before introducing new abstractions.
5. Each milestone ends with implementation review, checks, documentation and a logical Git commit.
6. The release ends with end-to-end validation, exact-commit deployment, smoke testing, Roadmap and Release Notes updates.
7. Release candidates remain on a focused branch until accepted.
8. `main` represents the accepted production line.
9. Tags identify completed releases using semantic versioning.
10. Deferred work is documented explicitly and never counted as complete.
11. Readiness percentages are calculated from implemented and validated capabilities, never estimates.

## Authoritative supporting documents

Read these before changing product boundaries or shared platform behaviour:

- `docs/FORGE_BLUEPRINT.md`
- `docs/ADR/ADR-001-canonical-content.md`
- `governance/ARCHITECTURE_PRINCIPLES.md`
- `governance/CODING_STANDARDS.md`
- `governance/DEVELOPMENT_WORKFLOW.md`
- `governance/RELEASE_PROCESS.md`
- `governance/VERSIONING.md`

Changes to product pillars, domain boundaries, canonical publishing, security principles, sprint methodology or the Definition of Done require an ADR and corresponding constitution and Blueprint updates.

## Active Release

### Release 0.7.1 — Sprint 9.2: Editorial Platform Completion

Working branch:

```text
release/0.7.0-player-domain
```

Sprint objective: complete Domain 0 (Editorial Intelligence) and Domain 1 (Editorial Platform) before continuing Player Domain development.

Milestone order:

1. Project Constitution
2. Editorial Domain Audit
3. Editorial Platform Completion
4. Verification Centre
5. Hero Skills Canonical Dataset
6. Dataset Health Dashboard
7. Domain Readiness Report
8. End-to-end validation and release documentation

Do not redesign the architecture. Reuse the existing editorial, publishing, dataset and permission platforms. Do not mark incomplete work complete.

## Session bootstrap

At the start of every development session:

1. Read this constitution from the requested branch.
2. Inspect the active branch and exact head commit.
3. Read any supporting architecture documents affected by the sprint.
4. Use the connected Supabase project read-only until a write is explicitly required by the milestone.
5. Continue from the current head; do not use local ZIP snapshots unless Clark explicitly requests that workflow.
