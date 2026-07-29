# PLAYER-INTEL-001 — Live Player Data Feasibility

**Status:** Active discovery sprint  
**Branch:** `research/player-intelligence-discovery`  
**Base:** accepted `main` at `b481495454b121630f8a7177c1e92f70448d227a`  
**Product owner:** Clark  
**Engineering partner:** Aegis  
**Started:** 29 July 2026  
**Tracked by:** GitHub issue #26 and draft PR #27

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

Read-only operational inspection confirmed that the active version 6 `kingshot-player` Edge Function is JWT-protected and proxies `https://kingshot.net/api/player-info`. Existing verified `player_accounts` rows show previous successful use of this source. No production revalidation or new live lookup was performed during this sprint stage.

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
6. Define and test a read-only source-adapter proof against the existing Forge player-service contract.
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

Evidence: `docs/research/player-intelligence/PLAYER-INTEL-001-JEABSLIST-HAR-ANALYSIS.md`.

### M1 — Source and contract design

**Status:** Complete for discovery review

Deliverables:

- Player Snapshot Service architecture;
- source-risk register;
- canonical terminology;
- freshness, confidence and provenance rules;
- separation between Player Identity verification and Player Intelligence observations;
- read-only inspection of the currently active Forge source.

Evidence:

- `docs/architecture/PLAYER-SNAPSHOT-SERVICE.md`;
- `docs/research/player-intelligence/PLAYER-INTEL-001-FORGE-SOURCE-INSPECTION.md`.

### M2 — Read-only adapter proof

**Status:** Contract proof complete; current-connectivity probe deferred

Deliverables completed:

- source-neutral adapter for the configured Forge `kingshot-player` service;
- exact current basic response-contract validation;
- deterministic normalisation and SHA-256 fingerprint tests;
- timeout, unavailable, rate-limit, invalid JSON/content type, oversized payload, unsafe image and mismatched-ID tests;
- safe projection tests proving raw payload, actor and unknown source fields are excluded;
- no route integration and no persistent write;
- Player Identity CI step, lint and build passed.

Files:

- `server/player-intelligence/basicPlayerSourceAdapter.ts`;
- `scripts/test-player-intelligence-source-adapter.mjs`;
- `package.json`.

A controlled current-connectivity call was not made because the available production route would revalidate/write `player_accounts`, while the Edge Function requires a JWT. A future probe must be explicitly read-only and must not change production Player state.

### M3 — Additive persistence proposal

**Status:** Logical and SQL proposal complete; unapplied

Deliverables completed:

- immutable source observation and distinct normalised state model;
- payload fingerprint storage without raw payload bodies in the first slice;
- request idempotency key;
- repeated unchanged observations linked to one deduplicated state;
- append-only database triggers;
- field allowlist and server-only latest projection;
- retention classification still awaiting owner/privacy approval;
- no migration application.

Evidence: `docs/reference/player-intelligence-snapshot-schema-proposal.sql`.

The proposal deliberately depends on the separately proposed `player_identity_private.game_characters` model. It does not reference legacy `player_accounts` and does not reuse the user-authored/publicly shareable `player_progression_snapshots` table.

### M4 — Feasibility decision

**Status:** In progress

Completed findings:

- basic source adapter is technically feasible;
- existing Forge source and historic successful records are confirmed;
- deterministic contract, lint and build validation passed;
- browser/public exposure, persistence and scheduled collection remain unapproved;
- public Kingshot.net source terms and sustained rate posture were not found in the public site search and remain a decision blocker for automation.

Remaining deliverables:

- controlled current-connectivity result;
- operating-cost and rate-limit estimate based on measured calls and confirmed provider policy;
- final privacy/security review;
- go/no-go for an authenticated user-facing snapshot vertical slice;
- separate go/no-go for deeper loadout research.

## Proposed vertical-slice boundary after discovery

The first implementation candidate is intentionally narrow:

1. An authenticated Forge user submits a Player ID.
2. A server API validates and resolves it through an approved source adapter.
3. Forge records an immutable source observation.
4. Forge creates or reuses a normalised immutable state only when the payload is valid.
5. Forge links each accepted observation to the state so freshness advances even when values do not change.
6. The API returns an allowlisted basic projection with source and freshness.
7. Repeated lookup is bounded by cache and rate policy.
8. Any detected name, kingdom or Town Centre change is derived from snapshot comparison.
9. The result does not prove ownership and grants no Alliance, Kingdom or operational authority.

## Candidate basic fields

Only fields already supported by the current Forge lookup contract are candidates for the first slice:

- external Player ID through private game-character identity;
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

Completed:

- TypeScript and NodeNext compatibility for proof code;
- invalid/missing/mismatched Player ID cases;
- upstream timeout, rate-limit and non-JSON response cases;
- payload-size boundary;
- payload-hash determinism;
- no raw Player payload in the safe projection;
- no direct browser integration;
- no ownership, membership or authority inference.

Pending an approved non-production schema rehearsal:

- duplicate request idempotency under concurrent inserts;
- repeated unchanged observation/state reuse;
- append-only trigger enforcement;
- service-role grants and client denial;
- account closure/export/deletion behaviour;
- recovery and rollback receipt.

## Deferred decisions

The following require explicit later approval:

- retention duration for observation metadata and normalised states;
- whether raw source payload evidence is ever stored;
- whether historical public profiles are permitted;
- whether external Player IDs may appear in public routes;
- refresh quotas and who may trigger them;
- scheduled collection;
- alliance/kingdom roster collection;
- detailed hero/loadout source research;
- any paid infrastructure or recurring provider cost.

## Current recommendation

The basic Player Intelligence adapter and persistence design are feasible, but no production vertical slice should begin yet. First confirm provider terms/rate posture, design a genuinely read-only current-connectivity probe, and resolve the Player Identity replacement dependency. Jeabs-style detailed loadouts remain out of scope until those gates pass.
