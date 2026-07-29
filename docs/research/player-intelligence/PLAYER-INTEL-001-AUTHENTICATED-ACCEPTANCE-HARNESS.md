# PLAYER-INTEL-001 — Authenticated read-only acceptance harness

**Status:** Implemented and deterministically tested; live execution pending  
**Branch:** `research/player-intelligence-discovery`  
**Supabase project:** `hrvdhjscwitqpwjhnjkm`  
**Production data writes:** Prohibited

## Purpose

Provide one tightly controlled way to test the existing JWT-protected `kingshot-player` Edge Function without using the write-capable `/api/player/account` route and without changing `player_accounts`, Player Intelligence tables, migrations, Edge Functions or Vercel deployments.

The harness is an acceptance tool, not a product endpoint. It is not callable from the Forge browser UI and must not be used for public search, Player ID enumeration, bulk collection or scheduled refreshes.

## Files

- `scripts/player-intelligence-acceptance-controls.mjs`
- `scripts/run-player-intelligence-authenticated-acceptance.mjs`
- `scripts/test-player-intelligence-authenticated-acceptance.mjs`
- `package.json`

## Operating boundary

A successful execute run:

1. requires the exact branch `research/player-intelligence-discovery`;
2. requires a clean working tree and an explicitly approved 40-character commit SHA;
3. targets only `https://hrvdhjscwitqpwjhnjkm.supabase.co/`;
4. requires a short-lived JWT whose local claims identify an `authenticated` user;
5. requires a separate Supabase publishable key;
6. refuses `sb_secret_`, service-role and same-token-as-key configurations;
7. accepts exactly one numeric Kingshot Player ID;
8. performs exactly one `GET` request and no retries;
9. uses a 15-second timeout and 64 KiB payload limit;
10. refuses redirects, unsupported content types, invalid JSON, mismatched Player IDs and invalid basic records;
11. makes no database connection and performs no persistence action;
12. records only redacted local technical evidence.

The Supabase gateway remains responsible for cryptographic JWT verification. Local JWT decoding is an additional preflight guard only and is not treated as authentication proof.

## Evidence policy

The harness never writes the requested Player ID, returned Player ID, player name, kingdom, level, profile image, raw response body, JWT, publishable key or actor subject to the evidence file.

Permitted evidence is restricted to:

- run and correlation IDs;
- approved repository SHA and branch state;
- project and source identifiers;
- start/completion timestamps and measured duration;
- request count;
- HTTP status;
- JSON content type;
- payload byte length and SHA-256 fingerprint;
- exact-ID-match boolean;
- names of validated allowlisted fields;
- selected non-personal cache/rate headers;
- explicit no-database, no-persistence and no-raw-payload attestations.

Evidence is written outside the repository to a local temporary directory with restrictive file permissions. The evidence file must not be committed.

## Commands

### Deterministic tests

```bash
npm run test:player-intelligence-acceptance
```

The test suite uses synthetic responses only. It validates:

- plan mode performs no external request;
- execute mode performs exactly one request;
- authenticated access-token and publishable-key separation;
- secret/service-role key refusal;
- exact project, branch and SHA gates;
- safe success evidence;
- safe mismatched-ID failure evidence;
- `429` handling with `Retry-After` capture;
- expired-token refusal;
- no Player values, token values or raw payload in returned/evidence objects.

### Plan mode

Plan mode validates the non-secret command shape and performs no HTTP request:

```bash
npm run accept:player-intelligence-authenticated -- \
  --plan \
  --player-id <PLAYER_ID> \
  --approved-sha <EXACT_40_CHARACTER_SHA>
```

### Execute mode

Execution additionally requires environment variables supplied only to the operator's local process:

```text
PLAYER_INTEL_ACCEPTANCE_APPROVED=YES
PLAYER_INTEL_ACCEPTANCE_ACCESS_TOKEN=<SHORT_LIVED_AUTHENTICATED_USER_JWT>
SUPABASE_PUBLISHABLE_KEY=<PUBLIC_OR_LEGACY_ANON_KEY>
```

Then run:

```bash
npm run accept:player-intelligence-authenticated -- \
  --execute \
  --player-id <PLAYER_ID> \
  --approved-sha <EXACT_40_CHARACTER_SHA>
```

No access token, key or Player value may be pasted into GitHub, documentation, issue comments, PR comments or chat transcripts.

## Current result

The harness code and synthetic test suite are complete. No live execute run has been performed by this implementation commit because no short-lived authenticated-user JWT was supplied to the controlled local process.

Therefore the current-connectivity gate remains pending. No claim is made yet about live latency, current upstream availability, current cache status, response byte size or current provider throttling.

## Exit criteria for the one-call acceptance

The live gate may be marked complete only when one owner-approved execute run:

- passes every repository and authentication guard;
- performs exactly one request;
- receives a structurally valid exact-ID response or a safely classified failure;
- produces a redacted evidence file containing no Player values or credentials;
- causes no database write, migration, deployment or linked-account revalidation;
- is recorded in PLAYER-INTEL-001 documentation using technical metadata only.

A successful one-call result does not approve public search, bulk lookup, scheduled collection, persistence migration or detailed hero/loadout research.
