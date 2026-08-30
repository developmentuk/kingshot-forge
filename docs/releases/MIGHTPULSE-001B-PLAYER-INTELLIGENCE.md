# MIGHTPULSE-001B — Player Intelligence Foundation

**Issue:** #110  
**Parent:** #109  
**Baseline:** `main` at `3663ec8378d8c57d95fb7c756e3c6c6e39dab7b0`  
**Branch:** `feature/mightpulse-001b-player-intelligence`  
**Status:** Implementation started; production schema unchanged

## Objective

Extend the working MightPulse Player provider from identity refresh into a
governed Player Intelligence source while preserving Player Identity,
verification, privacy, quota and user-owned editorial boundaries.

## Milestones

### 1. Provider contracts and quota foundation

- typed safe contracts for `base`, `heroes`, `ranks`, `gov_gear`;
- section-aware include validation;
- durable shared-key quota ledger;
- cache/freshness policy;
- safe provider error mapping;
- no raw payload logging.

### 2. Source-attributed Player observations

- immutable observation metadata;
- allowlisted normalised Player snapshot;
- explicit provider/fetched/cached/freshness fields;
- linked Player relation without ownership upgrade;
- latest safe read projection.

### 3. Linked Player Intelligence UI

Private owner view for:

- power / VIP / kills / language;
- Alliance summary;
- Kingdom ranks;
- Arena defence team;
- Governor Gear;
- freshness and source attribution.

### 4. Login and Alliance-position synchronisation

- linked users refresh from MightPulse once at genuine sign-in;
- authentication success is not blocked by a provider outage;
- latest successful Alliance membership/rank is synchronised automatically;
- R1→member, R2→recruiter, R3→officer, R4→r4, R5→leader;
- failed refresh preserves the last successfully confirmed Alliance state;
- a newer successful provider observation promotes, demotes, moves or removes the
  membership as required;
- R4/R5 authority is scoped only to the reported canonical Alliance.

### 5. Existing Forge integrations

- Passport may consume approved/opt-in public-safe fields;
- Personal Progression may offer provider-backed values as evidence, not silently
  overwrite user-authored snapshots;
- Arena defence heroes may update a source-attributed detected-team layer, not
  claim a complete Hero Collection;
- Governor Gear hidden state is shown honestly.

## Explicit non-goals

001B does not:

- activate Alliance roster sync;
- create Kingdom dashboards;
- change Transfer Hub recommendations;
- expose operational x/y/online/shield/burn data publicly;
- activate opponent KvK intelligence;
- grant Forge authority from MightPulse Alliance rank;
- upgrade Player ownership/verification.

Those are governed in 001C–001F.

## Migration posture

Any new schema is committed as migration files only until the owner explicitly
approves production application.

No destructive rewrite of existing Player/Progression/Hero data is allowed.

## Validation

Required before merge:

- synthetic valid/invalid provider fixtures;
- section-shape validation;
- wrong Player ID and wrong State;
- hidden Governor Gear;
- Arena defence semantics;
- quota/minute/day exhaustion;
- stale/fresh fallback;
- concurrent request safety;
- private/public field canaries;
- no verification upgrade;
- login refresh deduplication and provider-outage fallback;
- Alliance rank promotion/demotion/move/removal mapping;
- no Forge-global role escalation from provider rank;
- no user-authored field overwrite;
- lint, build, `git diff --check`, Player Identity suite and Final AEGIS;
- fresh exact-head Codex review;
- owner-controlled merge.

## Production acceptance

After any approved migration and production deployment:

1. sync one linked Player;
2. confirm source/freshness;
3. confirm rich private fields;
4. confirm no public restricted-field leakage;
5. confirm quota accounting;
6. confirm no verification/ownership changes;
7. record acceptance in this document and FRKS.
