# FRKS Preservation — PLAYER-INTEL-001

- **Preserved:** 13 August 2026
- **Source pull request:** #27
- **Original research date:** 29 July 2026
- **Current baseline:** Version 1.1.0 at `c524c08`
- **Classification:** Historical, redacted research; no implementation authority

## Preservation decision

This record retains the durable findings from PLAYER-INTEL-001 while excluding
its stale executable adapter, local authentication harness and unapplied schema
proposal. Nothing here approves a provider, migration, public Player API,
scheduled collection or detailed loadout ingestion.

Current Player Identity architecture and release records take precedence.

## Research objective

The investigation asked whether Forge could safely represent live Kingshot
player information as source-attributed, immutable observations and normalised
snapshots. It deliberately separated three concepts:

- **identity/linking:** a Forge user deliberately associates a Player ID;
- **observation:** Forge receives data from a named source at a recorded time;
- **ownership proof:** stronger evidence that a person controls a game account.

A successful lookup can support the first two concepts under an approved policy.
It does not prove exclusive ownership or grant alliance, kingdom or operational
authority.

## Redacted third-party HAR findings

A user-supplied Jeabs List HAR was reviewed locally. The raw file was excluded
from Git because it contained authentication material, Player data, comments and
redemption activity.

The capture showed a private, token-protected browser API offering player search,
stored summaries, history, detailed loadouts, kingdom views, leaderboards,
transfers and derived statistics. Paired cached and uncached loadout requests
supported an inference that Jeabs List refreshed a machine-readable upstream
source and persisted its own projections.

The HAR did **not** reveal or prove the hidden upstream host, protocol,
credentials, permission model or contractual right to collect the data. It did
not establish that equivalent Kingshot endpoints exist for every Jeabs feature.

Consequently Forge must not:

- reuse captured tokens or depend on Jeabs List's private API;
- commit or redistribute the raw HAR;
- copy private response contracts as canonical Forge models;
- present inferred upstream behaviour as confirmed fact;
- expose raw upstream payloads to browsers;
- perform bulk Player ID enumeration or public history collection without new
  privacy, abuse, retention and source decisions.

## Existing Forge source evidence at the time

Read-only inspection in July 2026 found an active, JWT-protected Supabase Edge
Function named `kingshot-player`. It proxied a bounded Player ID request to the
Kingshot.net player-info service and historically populated basic linked-account
fields including name, kingdom, level labels and profile imagery.

That evidence demonstrated historical operation, not guaranteed current
availability or provider permission. Subsequent Forge work recorded provider
outages and replacement activity; this record must not be used to re-enable an
old source blindly.

## Controlled connectivity result

The original unauthenticated probe correctly stopped at the JWT boundary. A later
owner-approved, memory-only PKCE acceptance performed exactly one request through
the existing Edge Function and returned:

- Forge classification: `source_unavailable`;
- HTTP status: 503;
- request count: one;
- database connection or persistence: none;
- temporary authentication session: revoked.

No Player identifiers, returned Player values or credentials were retained in
the repository record. The result validated the authentication, redaction and
no-write boundary; it did not validate upstream availability.

## Durable snapshot architecture principles

If a future approved source is introduced, the safe design should retain:

- a governed source registry with source owner, contract version, approval,
  operational status, trust rationale, rate policy and review dates;
- immutable observations containing retrieval metadata, validation outcome and
  a deterministic payload fingerprint;
- immutable, allowlisted normalised snapshots linked to valid observations;
- derived change events that reference their source snapshots;
- separate freshness, confidence and verification states;
- cache reads, bounded refresh, explicit stale fallback and circuit breaking;
- per-Player and per-actor controls that prevent enumeration and amplification;
- server-only raw evidence and explicit browser/public projections;
- corrections through supersession rather than rewriting evidence.

Candidate failure categories included invalid ID, not found, source unavailable,
timeout, rate limited, invalid content type, oversized payload, invalid payload,
mismatched returned ID, stale fallback and refresh not permitted.

## Decisions still required before revival

Any new Player Intelligence implementation requires fresh approval and evidence
for:

- provider identity, terms, reliability and rate posture;
- data classification and retention;
- whether raw source evidence is stored at all;
- public visibility and use of external Player IDs;
- refresh permissions, quotas and scheduled collection;
- schema design against the current Player Identity model;
- non-production rehearsal and rollback;
- detailed hero/loadout research as a separate higher-risk scope.

## Historical artefacts intentionally not restored

- source-adapter and acceptance-harness scripts;
- package scripts tied to the stale branch;
- the unapplied snapshot SQL proposal;
- manual token-extraction instructions, which were retired;
- the raw HAR or any secret, Player identifier or captured response.

PR #27 remains the immutable Git history for those exact branch artefacts. This
document is the safe current-repository summary.
