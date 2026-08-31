# MIGHTPULSE-001C — Alliance Intelligence & Roster Sync

**Issue:** #111  
**Parent:** #109  
**Baseline:** production `main` at `ab0140ce755e78714b541d2b50fcfe282a86a73d`  
**Branch:** `feature/mightpulse-001c-alliance-intelligence`  
**Status:** Foundation prepared; implementation not started  
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

Implementation is blocked until the Alliance identity rule is made internally
consistent.

Current production 001B canonicalises provider Alliance tags to uppercase
before Alliance lookup, creation and provider-state storage. Issue #111
currently says the Forge Alliance should bind to a case-sensitive tag.

001C must preserve exactly one logical Alliance identity per governed
`kingdom_number + canonical_tag`. Tag case variants must not create duplicate
Alliance records.

The default foundation position is therefore:

- Kingdom number remains part of the Alliance identity boundary;
- provider tags are normalised through the existing 001B canonicalisation
  contract before lookup/match;
- display casing, if required later, is presentation metadata rather than an
  identity key;
- changing this behaviour requires explicit owner approval because it would
  alter an already accepted production identity contract.

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
