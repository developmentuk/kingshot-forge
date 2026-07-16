# ADR-001: Canonical Content — Publish Once, Consume Everywhere

- **Status:** Accepted
- **Date:** 2026-07-16
- **Decision owners:** Product Owner and Aegis
- **Scope:** Kingshot Forge content, datasets and product consumers

## Context

Kingshot Forge serves the same game knowledge through multiple surfaces: administration tools, public dataset pages, hero pages, player tools, planners, APIs and future integrations. Allowing each surface to maintain its own copy of a hero, skill or progression fact would create drift, contradictory values, duplicated fixes and unclear ownership.

The Foundation Phase introduced dataset contracts, structured editorial records, immutable version history, workflow controls and publication operations. A formal decision is required so future domains use that platform rather than creating parallel content stores.

## Decision

Kingshot Forge will follow this rule:

> **Publish once. Consume everywhere.**

Canonical content is authored and governed through the editorial platform. Publication creates or advances the live canonical projection. Every product surface that needs that content consumes the published projection through an approved shared service, dataset adapter or API.

A consumer must not maintain an independent editable copy of canonical facts.

## Canonical and Personal Data

This decision distinguishes two kinds of data:

- **Canonical content** describes the game or Forge editorial judgement: hero identity, skills, generation, troop type, progression costs, event scoring, provenance and confidence.
- **Personal or operational data** belongs to a user, alliance or kingdom: a player's hero level, owned shards, collection state, notes, membership or transfer application.

Personal data may reference canonical records by stable keys, but it must not duplicate canonical fields as a second source of truth unless an explicit immutable snapshot is required for audit or historical display.

## Required Flow

1. A canonical record is created or changed as a draft.
2. Validation and role-governed workflow are applied.
3. Approval authorises publication.
4. Publication advances the live projection through the publishing platform.
5. Consumers read the live projection.
6. Archive, restore and rollback create new immutable versions and republish deliberately.

## Consequences

### Positive

- one correction reaches every consumer;
- provenance and confidence remain consistent;
- editorial history and accountability are preserved;
- public pages and tools cannot silently diverge;
- domains share infrastructure instead of rebuilding it;
- API consumers receive the same content as the web application.

### Costs

- consumers depend on stable contracts and canonical keys;
- schema changes require compatibility planning;
- publication availability and failure handling become platform responsibilities;
- migrations from hard-coded or duplicated content may be required.

## Guardrails

- Server-side permissions protect every canonical mutation.
- Editorial versions are immutable.
- Record heads use optimistic concurrency.
- Every mutation appends an audit event.
- Publication is explicit and observable.
- Consumers must handle unavailable, incomplete and superseded records safely.
- Shared platform capabilities are preferred over domain-specific duplication.
- A bypass requires a new ADR with a defined migration back to canonical consumption.

## Reference Implementation

The Hero Domain is the first complete reference implementation. Hero Skills in Release 0.6.0 must prove the full path from structured canonical editing through publication to public and administrative consumption.

## Rejected Alternatives

### Hard-code content in each UI

Rejected because corrections require multiple code releases and values drift between surfaces.

### Let every domain own an independent content table

Rejected because shared provenance, workflow, history and publication rules would be duplicated.

### Read unapproved drafts directly in product surfaces

Rejected because draft state is not canonical and may be incomplete, invalid or unauthorised.

## Compliance

Sprint planning and review must identify the canonical source and every consuming surface. A slice is not complete until the published record is consumed end to end without a parallel editable source.
