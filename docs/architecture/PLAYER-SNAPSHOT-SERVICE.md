# Player Snapshot Service

**Status:** Proposed for PLAYER-INTEL-001 discovery  
**Implementation authority:** None until the sprint gates and relevant Player ADR approvals pass  
**Owner:** Player Domain  
**Depends on:** server authentication, approved player-source adapters, provenance, immutable history and safe projection policies

## 1. Purpose

The Player Snapshot Service preserves what Forge observed about a Kingshot character at a specific time. It supports freshness, change detection and later derived intelligence without rewriting history or treating a player lookup as ownership proof.

The service is not the Player Identity verifier. It does not grant membership, rank, Alliance authority, Kingdom authority, Transfer eligibility or access to another player's private Forge data.

## 2. Boundary with existing Player Identity

The current linked-player service resolves a Player ID through the configured `kingshot-player` Edge Function and updates the latest `player_accounts` projection for an authenticated user.

The proposed Snapshot Service is additive:

```text
Authenticated or authorised server command
        ↓
Approved player-source adapter
        ↓
Raw observation validation and fingerprint
        ↓
Immutable observation
        ↓
Normalised immutable snapshot
        ↓
Derived change events
        ↓
Allowlisted private/public projections
```

A successful observation may support revalidation of an existing link under the current trust model, but the Snapshot Service must not silently create or strengthen an ownership claim.

## 3. Canonical terminology

### Player source

A registered machine-readable or user-provided origin from which Forge receives player information. Each source has an owner, source type, contract version, approval status, trust rationale, rate policy and operational status.

### Observation

The exact server-received payload plus retrieval metadata, validation result and fingerprint. Observations are evidence and are immutable.

### Snapshot

An allowlisted, normalised interpretation of one valid observation. A snapshot is immutable and source-attributed.

### Change event

A derived comparison between two accepted snapshots, such as name, kingdom or Town Centre change. The event is reproducible from its source snapshots and does not replace them.

### Freshness

The elapsed time since the source reported or Forge retrieved the observation. Freshness is separate from confidence and verification.

### Confidence

The strength of evidence that a material field reflects the live game. Confidence does not convert a player observation into proof of ownership.

### Stale

A source- or policy-defined freshness state. Stale data may be displayed with warning language but must not be represented as current.

## 4. Source-risk register

| Source | Classification | Permitted PLAYER-INTEL-001 use | Prohibited use | Initial trust position |
| --- | --- | --- | --- | --- |
| Existing Forge `kingshot-player` service | Existing server-controlled adapter | Read-only contract validation and basic Player ID lookup | Bulk enumeration, client-direct calls, expanded fields without review | Approved only for the existing bounded basic lookup trust signal |
| Century Games gift-code player endpoint | External game service underlying known community integrations | Research and existing approved provider path only | Publishing signing material, abusive request volume, claiming official account authentication | Basic identity fields appear reliable; contractual and rate posture requires review |
| Jeabs List browser API | Third-party private application API | Architecture observation from supplied HAR | Production dependency, scraping, token reuse, copying response contracts as Forge's canonical model | Not an approved Forge data source |
| Jeabs List raw HAR | User-supplied restricted evidence | Local analysis and redacted findings | Repository commit, redistribution, retaining live token or direct identifiers | Restricted evidence; raw file remains off-repo |
| Forge Vision screenshot | User-provided evidence | Supporting Player ID/kingdom extraction under Vision policy | Automatic ownership proof; automatic Alliance rank or Town Centre verification | Governed supporting evidence with confidence and manual review |
| Manual user submission | User assertion | Draft/supporting profile information with provenance | Treating an assertion as observed game truth | Unverified until corroborated |
| Alliance roster import | Alliance-scoped operational evidence | Future reviewed import design | Global public indexing or authority inference | Requires Alliance-domain permission and provenance decisions |
| Direct mobile traffic research | Unapproved research source | None in this sprint | Authentication bypass, certificate-control defeat, secret extraction or production use | Separate legal, security and account-risk decision required |

## 5. Candidate source contract

```ts
export type PlayerSourceId = string

export interface PlayerLookupRequest {
  playerId: string
  purpose: 'link_revalidation' | 'private_profile_refresh' | 'support_review'
  actorId: string
  requestedAt: string
}

export interface PlayerSourceObservation {
  sourceId: PlayerSourceId
  sourceContractVersion: string
  playerId: string
  retrievedAt: string
  sourceReportedAt?: string
  httpStatus?: number
  payloadContentType: string
  payloadByteLength: number
  payloadSha256: string
  rawPayload: unknown
}
```

The concrete implementation may use different TypeScript names, but it must preserve these semantics.

## 6. Candidate normalised basic snapshot

```ts
export interface BasicPlayerSnapshot {
  snapshotId: string
  observationId: string
  playerId: string
  playerName: string
  kingdomId: number
  playerLevel: number
  levelRendered?: string
  levelRenderedDetailed?: string
  levelImageUrl?: string
  profileImageUrl?: string
  observedAt: string
  sourceId: string
  sourceContractVersion: string
  payloadSha256: string
  freshnessStatus: 'fresh' | 'stale' | 'unknown'
  confidenceScore: number
  confidenceRationale: string
}
```

Only fields supported and validated by the approved basic lookup contract belong in the first slice.

## 7. Proposed persistence model

No migration is approved by this document. The eventual migration should represent these logical records.

### `player_data_sources`

Purpose: governed registry of source adapters.

Candidate fields:

- immutable source ID;
- name and source type;
- owner/operator;
- contract version;
- approval and operational status;
- trust and risk rationale;
- rate and cache policy references;
- created, reviewed and retired timestamps.

### `player_source_observations`

Purpose: immutable evidence received from one source request.

Candidate fields:

- observation UUID;
- source ID and contract version;
- normalised external Player ID;
- actor and purpose, stored with least privilege;
- retrieval and optional source-report timestamps;
- status and validation result;
- content type and byte length;
- SHA-256 payload fingerprint;
- protected raw payload or protected evidence reference;
- request correlation ID;
- created timestamp.

Uniqueness should prevent duplicate persistence of the same source, Player ID, source contract and payload fingerprint within the approved idempotency scope.

### `player_profile_snapshots`

Purpose: immutable normalised values accepted from a valid observation.

Candidate fields:

- snapshot UUID;
- observation UUID;
- Player ID;
- allowlisted basic values;
- observed timestamp;
- freshness state;
- confidence score and rationale;
- normaliser version;
- created timestamp.

### `player_snapshot_changes`

Purpose: reproducible changes between two snapshots.

Candidate fields:

- change UUID;
- Player ID;
- previous and current snapshot UUIDs;
- field key;
- protected previous/current values or safe typed columns;
- detected timestamp;
- classification and confidence;
- derivation version.

## 8. Immutability and idempotency

1. Observations and snapshots are append-only.
2. A refresh never updates an old snapshot.
3. Identical payload fingerprints should not create unbounded duplicate snapshots.
4. A new source contract or normaliser version may create a new snapshot even when values match, when required for auditability.
5. Derived change events reference both snapshots.
6. Corrections create new records and supersession metadata; they do not rewrite evidence.

## 9. Raw payload boundary

Raw payloads may contain undocumented identifiers, internal UIDs or fields that Forge has not approved for use.

Therefore:

- raw payloads are server-only;
- browser responses never echo them;
- logs contain correlation IDs and safe error codes, not payload bodies;
- public projections use explicit field allowlists;
- raw retention is separately approved by source/data class;
- exports, deletion and pseudonymisation follow ADR-0116 decisions;
- a source adapter must reject unexpectedly large or wrong-content-type payloads.

## 10. Freshness and refresh policy

The service must distinguish:

- **cache read:** returns the latest accepted snapshot without an upstream call;
- **refresh request:** attempts an upstream call subject to actor, purpose, quota and source health;
- **stale fallback:** returns the latest snapshot with explicit stale state when refresh is unavailable;
- **unavailable:** returns no fabricated values when no accepted snapshot exists.

Refresh controls should include:

- per-player cooldown;
- per-actor quota;
- source-global rate and concurrency limit;
- timeout and circuit breaker;
- bounded retries with jitter;
- idempotency key;
- source-health state;
- abuse and enumeration monitoring.

Exact limits are deferred until the approved source is measured.

## 11. Projection policy

### Authenticated owner/private projection

May include the approved basic snapshot, exact freshness, source label and change summary for a linked character, subject to Player-domain permissions.

### Public projection

Not approved by this sprint. Any future public projection must:

- use an opaque public identifier rather than an unreviewed raw Player ID route;
- be versioned and allowlisted;
- respect explicit visibility;
- hide internal UIDs, Forge user relationships, raw observations and verification evidence;
- have rate, cache and revocation behaviour tested.

### Operations/support projection

May expose additional evidence metadata only through capability-gated server APIs with access audit.

## 12. Change detection rules

The first candidate changes are:

- player-name change;
- kingdom change;
- game/account-level change;
- rendered Town Centre/level change;
- profile-image change.

A kingdom change observed from two snapshots is a detected value change, not automatically a confirmed Transfer-domain event. Transfer confirmation may require persistence, timing and corroboration rules owned by the Transfer and Kingdom domains.

## 13. Failure contract

Adapters and APIs should use stable, safe result categories:

- invalid_player_id;
- player_not_found;
- source_not_configured;
- source_unavailable;
- source_timeout;
- source_rate_limited;
- invalid_content_type;
- payload_too_large;
- invalid_source_payload;
- mismatched_player_id;
- stale_snapshot_returned;
- refresh_not_permitted;
- internal_error.

Browser messages should not reveal provider credentials, internal hosts, raw responses or whether another Forge user has linked the Player ID.

## 14. Validation requirements

- deterministic Player ID validation;
- exact returned-ID match;
- required-field validation;
- kingdom bounds and numeric safety;
- URL allowlisting/sanitisation for images;
- content-type and payload-size limits;
- deterministic SHA-256 fingerprint;
- duplicate/idempotency tests;
- wrong-source and wrong-contract rejection;
- timeout/rate/unavailable tests;
- no public raw payload;
- no ownership, Alliance membership or authority inference;
- server-only source credentials;
- NodeNext and Vercel runtime compatibility.

## 15. Source-adapter sequence

1. Validate the existing Forge basic lookup adapter in read-only tests.
2. Introduce a source-neutral interface without changing production behaviour.
3. Propose additive observation/snapshot persistence.
4. Obtain retention, privacy and migration approval.
5. Implement one authenticated private snapshot vertical slice.
6. Measure cost, rate and reliability.
7. Consider scheduled refresh or deeper sources only through a new decision.

## 16. Deeper loadout research gate

Research into heroes, equipment, skins or internal stats may begin only when:

- the basic source-neutral adapter is working;
- observation and provenance contracts are approved;
- the candidate upstream source is independently identified;
- access does not depend on Jeabs List credentials;
- legal/terms, security and account-ban risks are reviewed;
- a field-level data classification exists;
- a separate sprint and owner approval define the scope.

Until then, detailed loadout remains an observed third-party capability, not a Forge implementation target.
