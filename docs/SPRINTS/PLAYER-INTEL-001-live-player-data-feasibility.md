# PLAYER-INTEL-001 — Live Player Data Feasibility

**Status:** Active discovery sprint  
**Branch:** `research/player-intelligence-discovery`  
**Base:** accepted `main` at `b481495454b121630f8a7177c1e92f70448d227a`  
**Product owner:** Clark  
**Engineering partner:** Aegis  
**Started:** 29 July 2026

## Sprint objective

Determine what Kingshot player information Forge can retrieve, preserve and use reliably, safely and independently. Deliver a governed foundation for immutable player observations and snapshots without copying Jeabs List, exposing private upstream payloads, or claiming deeper game access that has not been verified.

## Player outcome

A future Forge user should be able to enter a Kingshot Player ID and receive a clearly sourced, freshness-labelled basic profile. Forge should retain immutable observations so later changes in name, kingdom and Town Centre can be detected without rewriting history.

This sprint does not enable that public workflow. It establishes whether and how it can be implemented safely.

## Existing Forge baseline

Forge already has a server-authoritative linked-player workflow:

- `/api/player/account` accepts authenticated link or revalidation commands;
- `server/player-identity/linkedPlayerService.ts` validates the Player ID;
- the service calls the Supabase Edge Function `kingshot-player`;
- the response is normalised to Player ID, name, kingdom, level, rendered level data, level image and profile image;
- successful results update or insert the current `player_accounts` row;
- verification means the Player ID resolved successfully and was deliberately linked by the authenticated Forge user;
- this is not official Century Games authentication or proof of exclusive account ownership.

The current path stores the latest account projection but does not provide a dedicated immutable observation/snapshot history for independent player intelligence.

## Governing constraints

The sprint must comply with:

- `docs/AEGIS.md`;
- `docs/FORGE_BLUEPRINT.md`;
- the Kingshot Forge Design Bible;
- `docs/PLAYER_DOMAIN_ARCHITECTURE.md`;
- `docs/player-identity/VERTICAL_SLICE.md`;
- ADR-0109 server-authoritative player operations;
- ADR-0116 Player data classification and retention;
- ADR-0117 safe public Player projections.

The Player ADRs remain Proposed. Owner approval to begin this sprint authorises controlled discovery only; it does not approve a public Player API, new retention periods, a live schema migration, broad indexing or deep-loadout collection.

## Scope

### Included

1. Preserve a redacted, source-grounded HAR analysis.
2. Inventory observed third-party endpoint shapes without copying implementation.
3. Classify candidate sources by trust, privacy, legal and operational risk.
4. Define a source-neutral Player Observation and Snapshot contract.
5. Inspect the existing Forge lookup path and identify the smallest additive integration.
6. Define a read-only proof-of-concept test against the already configured Forge player service.
7. Produce a migration proposal, but do not apply it.
8. Produce a go/no-go recommendation for deeper loadout research.

### Excluded

- Calling Jeabs List from Forge.
- Reusing captured tokens or credentials.
- Committing the raw HAR.
- Bulk scanning Player IDs.
- Public search or enumeration.
- Scheduled production refreshes.
- Public profile history.
- Alliance or kingdom leaderboards.
- Detailed hero/loadout ingestion.
- Defeating authentication, certificate pinning or access controls.
- Supabase schema or data writes.
- Vercel production deployment.

## Milestones

### M0 — Evidence and boundaries

**Status:** Complete

Deliverables:

- redacted HAR analysis;
- evidence fingerprint and custody rule;
- explicit supported inferences and unknowns;
- prohibition on Jeabs API dependency and token reuse.

### M1 — Source and contract design

**Status:** In progress

Deliverables:

- Player Snapshot Service architecture;
- source-risk register;
- canonical terminology;
- freshness, confidence and provenance rules;
- separation between Player Identity verification and Player Intelligence observations.

### M2 — Read-only adapter proof

**Status:** Not started

Deliverables:

- test-only adapter invoking the existing configured Forge `kingshot-player` service;
- validation of the current response contract;
- deterministic normalisation tests;
- timeout, unavailable, invalid and mismatched-ID tests;
- no persistent write.

### M3 — Additive persistence proposal

**Status:** Not started

Deliverables:

- reviewed SQL migration file or schema proposal;
- immutable observation and snapshot model;
- source and payload fingerprint storage;
- duplicate/idempotency policy;
- field allowlist and raw-payload access boundary;
- retention classification awaiting owner/privacy approval;
- no migration application.

### M4 — Feasibility decision

**Status:** Not started

Deliverables:

- basic lookup feasibility result;
- operating cost and rate-limit estimate;
- privacy/security review;
- go/no-go for an authenticated user-facing snapshot vertical slice;
- separate go/no-go for deeper loadout research.

## Proposed vertical-slice boundary after discovery

The first implementation candidate is intentionally narrow:

1. An authenticated Forge user submits a Player ID.
2. A server API validates and resolves it through an approved source adapter.
3. Forge records an immutable source observation.
4. Forge creates a normalised immutable snapshot only when the payload is valid.
5. The API returns an allowlisted basic projection with source and freshness.
6. Repeated lookup is bounded by cache and rate policy.
7. Any detected name, kingdom or Town Centre change is derived from snapshot comparison.
8. The result does not prove ownership and grants no Alliance, Kingdom or operational authority.

## Candidate basic fields

Only fields already supported by the current Forge lookup contract are candidates for the first slice:

- external Player ID;
- player name;
- kingdom ID;
- game/account level;
- rendered level labels;
- level image;
- profile image;
- observed time;
- source ID and source version;
- payload fingerprint;
- freshness and confidence.

Town Centre interpretation must remain consistent with the existing trusted player-service contract. Decorative OCR suggestions from Forge Vision remain supporting information only unless manually confirmed under the Vision trust boundary.

## Acceptance criteria

The sprint is complete only when:

- the HAR findings are preserved without secrets or direct identifiers;
- every candidate source has an explicit trust/risk classification;
- the snapshot contract is source-neutral and server-authoritative;
- identity verification and player observation are not conflated;
- the read-only adapter proof passes deterministic tests;
- the proposed persistence model is immutable and idempotent;
- raw payloads cannot become public projections;
- retention and public API decisions remain visibly gated;
- no production data, migration or deployment is changed;
- a documented go/no-go decision is ready for Clark.

## Required validation

- TypeScript and NodeNext compatibility for any proof code;
- invalid/missing/mismatched Player ID cases;
- upstream timeout and non-JSON response cases;
- payload-size boundary;
- payload-hash determinism;
- duplicate observation idempotency;
- no secret in client bundle or logs;
- no direct browser access to privileged Supabase data;
- no raw Player payload in public projection;
- negative tests for ownership, membership and authority inference.

## Deferred decisions

The following require explicit later approval:

- retention duration for raw observations and normalised snapshots;
- whether historical public profiles are permitted;
- whether external Player IDs may appear in public routes;
- refresh quotas and who may trigger them;
- scheduled collection;
- alliance/kingdom roster collection;
- detailed hero/loadout source research;
- any paid infrastructure or recurring provider cost.

## Current recommendation

Continue through M1 and M2 using the existing Forge player service. Do not investigate or implement Jeabs-style detailed loadouts until the basic read-only adapter, provenance model and source-risk review are complete.
