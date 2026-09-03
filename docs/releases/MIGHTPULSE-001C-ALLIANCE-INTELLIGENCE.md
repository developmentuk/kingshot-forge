# MIGHTPULSE-001C — Alliance Intelligence & Roster Sync

**Issue:** #111
**Parent:** #109
**Baseline:** production `main` at `ab0140ce755e78714b541d2b50fcfe282a86a73d`
**Branch:** `feature/mightpulse-001c-alliance-intelligence`
**Status:** 001C-A provider-contract implementation complete on feature branch; persistence/runtime not started
**Production changes authorised by this foundation:** none

## Objective

Extend the accepted MIGHTPULSE-001B Player Intelligence foundation into a
governed own-Alliance intelligence and roster surface without weakening
privacy, quota, freshness, Player ownership or Forge authority boundaries.

001C must reuse the existing server-only MightPulse boundary, shared quota
ledger, freshness semantics, Player identity contracts, Alliance authority
mapping and audit model. It must not create a second provider client, quota
system or Alliance source of truth.

## Foundation inherited from 001B

001C begins with these production capabilities already present:

- MightPulse server-only transport and provider error handling;
- persistent provider quota reservation/attempt ledger;
- `alliance_roster` request category already reserved in quota governance;
- immutable Player Intelligence observations;
- Player provider freshness ordering and stale-safe writes;
- current Player Alliance membership/rank synchronisation;
- R1→`member`, R2→`recruiter`, R3→`officer`, R4→`r4`, R5→`leader`;
- Alliance-scoped R4/R5 management authority only;
- manual/emergency authority suspension ceiling;
- authentication-triggered Player sync and sign-in request deduplication.

001C should consume these contracts rather than duplicate them.

## Gate 0 — canonical Alliance identity contract

Gate 0 is resolved for the provider boundary.

MightPulse documents Alliance lookup as
`GET /v1/alliances/{kid}/{tag}?include=info,roster`, where `kid` is
required because the same tag may exist in multiple Kingdoms and `tag` is
case-sensitive.

001B's Player-derived Alliance synchronisation currently uppercases the
observed tag before resolving the Forge Alliance row. That behaviour remains
an accepted 001B compatibility contract and is not rewritten by 001C-A.

001C therefore separates two identities:

- the **Forge canonical Alliance identity**, which remains the existing Forge
  Alliance record and must remain unique for the logical Alliance; and
- the **MightPulse provider binding**, which must preserve the exact provider
  `kid + tag` spelling used for Alliance API requests and should additionally
  retain the returned provider `aid` once persistence is designed.

Rules:

- outbound MightPulse Alliance requests preserve tag case exactly;
- returned `kid` and `abbr` must match the requested provider binding
  exactly before the response is accepted;
- a provider tag is never uppercased merely to construct the provider URL;
- provider tag case is presentation/provider identity, not permission;
- later persistence must prevent case variants from creating duplicate logical
  Forge Alliances;
- any migration that introduces the provider binding remains separately
  owner-gated.

Read-only production inspection on 31 August 2026 found zero existing
case-insensitive Alliance collision groups, so no production identity repair is
required before 001C-A.

Provider contract source verified 31 August 2026:
`https://api.mightpulse.com/`.

## Scope

### 1. Provider Alliance contract

Add a strict server-side MightPulse Alliance adapter for the provider's
Alliance info/roster response.

Required behaviour:

- validate requested Kingdom and canonical Alliance tag;
- reject wrong-Kingdom and wrong-Alliance responses;
- strictly validate roster member identifiers and allowlisted fields;
- preserve provider fetch/cache/freshness metadata;
- do not log raw provider payloads;
- request the roster through the shared governed quota layer;
- prefer a whole-roster provider request instead of per-member polling.

### 2. Source-attributed Alliance observations

Introduce a governed Alliance observation/read model that can represent:

Alliance-level data:

- canonical Alliance identity;
- Alliance name/tag;
- Kingdom;
- power;
- member count;
- leader;
- flag/visual identifier where safely supported;
- Alliance rank where provided;
- source and freshness.

Roster-member data:

- Governor / Player ID;
- name;
- avatar;
- power;
- Town Center;
- kills;
- in-game Alliance rank;
- online;
- last-active;
- source and freshness.

Operational fields remain non-public.

### 3. Forge Player matching

Roster Governor IDs may be matched to existing Forge Player Accounts.

Rules:

- never create a Forge Player Account merely because a roster member exists;
- expose a safe linked/not-on-Forge state;
- never infer ownership/verification from a roster match;
- use existing Player identity records as the match authority;
- never overwrite user-authored Player/profile fields with roster data unless an
  explicit existing merge rule allows it.

### 4. Own-Alliance access model

Current authenticated members of the canonical Forge Alliance may read the
own-Alliance operational intelligence view.

The view may include:

- roster power / TC / kills / rank / avatar;
- online and last-active;
- source/freshness;
- linked/not-on-Forge state.

It must not expose those operational fields through global/public Player search,
public Passport projection or unrelated Alliance views.

Refresh, deep-scout and management actions may remain more tightly capability-
gated than read access.

### 5. Authority reconciliation

Player-level Alliance rank authority already exists in 001B.

001C roster observations must not independently race or overwrite the existing
Player authority path without a single defined reconciliation rule.

Required design before writes are added:

- identify which observation timestamp is authoritative when Player and roster
  sources disagree;
- preserve stale-safe ordering;
- ensure departed-member and Alliance-change states cannot be rolled backward
  by stale roster snapshots;
- preserve manual/emergency authority suspension;
- never grant Forge-global admin/owner.

### 6. Castle Command integration boundary

Castle Command may consume an Alliance roster projection through a Forge
adapter.

Castle Command must not:

- call MightPulse directly from the browser;
- own the canonical Alliance roster store;
- bypass quota/freshness governance;
- expose restricted operational fields outside authorised Alliance context.

## Explicit non-goals

001C does not:

- build Kingdom-wide intelligence/leaderboards;
- build Transfer Intelligence;
- activate opponent-KvK intelligence;
- expose x/y, shield, burn or last-login as routine public/Alliance roster
  fields;
- poll entire Kingdoms Player-by-Player;
- create unlinked Forge Player Accounts from provider roster members;
- change Player ownership/verification;
- grant Forge-global admin/owner from game rank.

Those capabilities remain governed by later MIGHTPULSE workstreams.

## Proposed persistence posture

Any new Alliance observation schema must be authored as reviewable migration
files only.

Before any production migration is considered, the schema must demonstrate:

- immutable/source-attributed observation history where practical;
- a bounded current read projection;
- RLS and server-only mutation boundaries;
- no direct authenticated/anonymous writes;
- minimum service-role privileges;
- idempotent or atomic roster ingestion;
- no destructive rewrite of existing Alliance membership/history;
- compatibility with the existing 001B provider quota ledger.

No production migration application is authorised at foundation stage.

## Quota posture

The provider key remains governed by the accepted shared limits:

- 60 requests/minute;
- 5,000 requests/day;
- protected capacity for Player linking/sign-in;
- normal/nonessential work must not consume the full emergency/high-priority
  reserve.

001C should target one provider request per roster refresh and then perform
local matching/projection. Per-member provider calls are prohibited for normal
roster refresh.

## Acceptance gates

Before merge can be considered:

- Gate 0 canonical Alliance identity contract resolved;
- valid Alliance info/roster fixtures;
- wrong Kingdom rejection;
- wrong tag / tag-case-variant tests against the canonical identity rule;
- malformed member and duplicate-member handling;
- departed-member handling;
- stale/fresh roster ordering;
- cross-Alliance access denial;
- public-field canaries for online/last-active and other operational data;
- existing Forge Player match vs not-on-Forge behaviour;
- no account creation from roster ingestion;
- no ownership/verification upgrade;
- Player-vs-roster Alliance authority reconciliation tests;
- manual/emergency authority suspension preservation;
- quota minute/day/reserve behaviour;
- one-request roster refresh economics;
- Castle Command adapter boundary tests;
- TypeScript/build/lint/`git diff --check`;
- relevant Player Identity and Alliance regression suites;
- Final AEGIS exact-head audit;
- fresh exact-head Codex review;
- explicit owner approval for any later merge;
- separate explicit owner approval for any production migration;
- separate explicit owner approval for deployment/runtime activation where
  applicable.

## Foundation stop point

This document, the 001B closure record and the new branch are foundation-only.

No application source, Supabase schema, provider runtime, environment flag,
production deployment or live Alliance data has been changed by MIGHTPULSE-001C
foundation preparation.

## MIGHTPULSE-001C-B — Alliance persistence foundation

001C-B is a review-only persistence foundation from production `main`
`9836657f7da3f147944119bc5c235f1db2326589`. It adds no runtime call, route,
quota reservation, roster polling, membership mutation, authority mutation,
ownership/verification change, public projection, or environment flag.

The unapplied migration adds separate server-only tables for exact-case
MightPulse bindings, immutable Alliance observations, and immutable whole-roster
member observations. A binding preserves provider Kingdom, raw case-sensitive
tag, returned `aid`, status, source, and confirmation timestamps. A provider/aid
lookup index supports efficient lookup but is not itself the collision
constraint: transaction-scoped advisory locking serializes the same logical
provider identity, and collision validation prevents the same MightPulse aid
from binding different Forge Alliances. Same-aid historical bindings are
allowed when they belong to the same Forge Alliance; exact-case provider tag
history remains immutable, and active lookup uniqueness is enforced separately.
Historical identity changes use a new binding rather than overwriting identity.

`content_sha256` records canonical provider-fact equivalence and is not the
retry-idempotency key. `(binding_id, refresh_id)` provides retry idempotency,
while `refresh_envelope_sha256` detects conflicting replay under the same
refresh identity. Later refreshes with unchanged provider facts therefore
remain distinct immutable observations even when they have the same
`content_sha256`.
Both persistence fingerprints are database-owned: the private RPC accepts no
caller hash candidates. It hashes explicit governed JSONB v1 objects, orders
roster members by Governor ID using deterministic `C` collation, and keeps
refresh-local timestamps and ages out of content identity. The refresh envelope
uses a separate database-owned JSONB v1 object containing the computed content
hash and governed freshness/timing evidence.
Roster rows are attached to one parent observation, reject duplicate Governor,
provider UID, and provider FID identities within that snapshot, and can only
reference an existing `player_accounts` row. Missing matches remain unmatched;
no account creation path exists, and provider fields do not write Player
profile, membership, rank, admin, authority, verification, or ownership data.

Immutable roster rows retain `roster_fresh` as the section-specific freshness
evidence and `provider_fresh` separately as aggregate/scalar provider evidence.
Sectioned roster consumers use `roster_fresh`; scalar responses retain null
roster-specific freshness rather than fabricating it. No public exposure is
created by this persistence shape.

Freshness records sectioned `info` and `roster` evidence, scalar provider
freshness, or explicit unknown. Missing evidence remains nullable; timestamps
and ages are stored only when supplied. No public Alliance view or authenticated
read policy is created. Browser roles are revoked, writes are service-only, and
observation tables use forced RLS plus mutation-rejecting triggers.

**MIGHTPULSE-001C-B migration created but NOT applied to production.** The
rollback strategy is documented in the migration as an owner-gated reverse
dependency drop and has not been executed. 001C-C and runtime activation remain
separately owner-gated.


## 001C-A — shared transport and Alliance provider contract

001C-A is implemented on the feature branch only.

Delivered:

- extracted the fixed-origin MightPulse HTTP transport into
  `server/mightpulse/mightPulseTransport.ts`;
- retained the production origin at exactly
  `https://api.mightpulse.com/v1`;
- retained Bearer authentication, timeout handling, JSON content validation
  and safe HTTP failure isolation in the server-only transport;
- refactored the existing Player provider to consume that shared transport
  without changing its domain error contract;
- added a provider-neutral Alliance Intelligence contract;
- added a strict MightPulse Alliance `info,roster` provider;
- outbound Alliance lookup preserves the exact case-sensitive tag;
- response acceptance proves exact requested Kingdom and tag;
- roster validation rejects malformed ranks, wrong-Kingdom members and
  duplicate Governor/internal identifiers;
- operational roster fields are normalised but are not exposed to any browser
  or public projection;
- unsafe provider avatar/flag URLs are dropped rather than trusted;
- synthetic tests cover success, case mismatch, wrong Kingdom, malformed and
  duplicate members, provider HTTP failures, timeout, unreachable provider,
  fixed production origin and absence of Supabase/quota writes;
- a dedicated pull-request CI gate is authored for the 001C provider slice.

### Explicit 001C-A non-effects

001C-A does not:

- create or alter a Supabase table, view, function, RLS policy or migration;
- reserve provider quota;
- call the Alliance provider from any production route;
- add a runtime feature flag;
- expose Alliance roster intelligence in the UI;
- mutate Alliance membership, rank or authority;
- connect Castle Command;
- deploy anything.

The Alliance provider is therefore inert production code until a later,
separately reviewed and owner-approved slice wires it behind quota,
authentication, persistence and access control.
