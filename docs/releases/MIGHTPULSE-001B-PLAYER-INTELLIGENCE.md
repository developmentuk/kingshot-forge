# MIGHTPULSE-001B — Player Intelligence Foundation

**Issue:** #110
**Parent:** #109
**Baseline:** `main` at `3663ec8378d8c57d95fb7c756e3c6c6e39dab7b0`
**Final production main:** `ab0140ce755e78714b541d2b50fcfe282a86a73d`
**Branch:** `feature/mightpulse-001b-player-intelligence`
**Status:** Closed — production accepted 31 August 2026

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


## Formal production closure — 31 August 2026

MIGHTPULSE-001B is formally complete and accepted in production.

### Delivered production capability

- governed rich Player Intelligence through the server-only MightPulse boundary;
- persistent provider quota reservation/attempt accounting across Vercel instances;
- immutable, source-attributed Player Intelligence observations;
- safe normalisation for Player base, heroes, ranks and Governor Gear;
- one automatic rich refresh for a genuine authenticated sign-in;
- authentication remains successful when the provider is unavailable;
- authoritative current Alliance membership/rank synchronisation from accepted fresh Player observations;
- canonical R1→`member`, R2→`recruiter`, R3→`officer`, R4→`r4`, R5→`leader` mapping;
- Alliance-scoped R4/R5 management authority only, never Forge-global admin/owner;
- manual/emergency Alliance authority suspension remains a higher-priority safety ceiling;
- provider-owned observations do not silently overwrite user-authored biography, transfer notes, play style, Hero ownership claims or other editorial state.

### Production schema and hardening

The owner-approved MIGHTPULSE-001B migration chain was applied and validated before runtime activation:

1. `20260830224442_mightpulse_001b_player_intelligence_foundation.sql`
2. `20260830224458_mightpulse_001b_stale_identity_guard.sql`
3. `20260830224502_mightpulse_001b_provider_request_status.sql`
4. `20260830224507_mightpulse_001b_incomplete_rank_watermark.sql`
5. `20260830224520_mightpulse_001b_first_authority_watermark_guard.sql`
6. `20260830224526_mightpulse_001b_expired_provider_status.sql`
7. `20260830225343_mightpulse_001b_service_role_table_privilege_hardening.sql`

A later narrow corrective migration for the generated Kingdom display-name contract was also owner-approved, applied and accepted before final runtime acceptance.

### Final release chain

Primary feature PR: #115.

Production follow-up/hotfix chain: #116, #117, #118, #119, #120 and #121.

Final exact production commit:

`ab0140ce755e78714b541d2b50fcfe282a86a73d`

Final production deployment:

`dpl_5XTaZRBpXo7QimMeb4szk9uSRzaW` — `READY`, target `production`, serving `ksforge.app`.

PR #121 exact head `19dc6a26ba61bbef3920074d367c43b48ecebd99` received a fresh Codex review with no major issues before merge.

### Final controlled sign-in acceptance

The owner-approved controlled production sign-in acceptance was observed at approximately 14:21 UTC on 31 August 2026.

The accepted sign-in produced:

- one `player_sign_in` quota reservation;
- reservation status `completed`;
- exactly one provider attempt for that reservation;
- one immutable Player Intelligence observation with `request_reason = 'sign-in'`;
- one Player Alliance provider-state update;
- zero Alliance provider authority-override changes.

The accepted sign-in window contained no duplicate `player_automatic` provider request tied to that genuine sign-in. This satisfies the final PR #121 quota-deduplication acceptance requirement: one genuine login consumes one governed MightPulse provider request.

### Runtime posture at closure

- `MIGHTPULSE_PROVIDER_QUOTA_ENABLED` — ON;
- `MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED` — ON;
- provider quota governance remains mandatory;
- Player Intelligence remains failure-isolated from authentication;
- no raw provider payload logging is permitted;
- no ownership/verification upgrade is inferred from MightPulse.

### Closure boundary

001B does not implement the full Alliance roster intelligence surface, Kingdom intelligence, Transfer intelligence or KvK opponent intelligence. Those remain governed by MIGHTPULSE-001C through 001F.

Issue #110 may therefore be closed as completed. The next governed workstream is #111 / MIGHTPULSE-001C.

No merge, migration application, deployment or runtime change is authorised by this closure documentation.
