# PLAYER-INTEL-001 — Authenticated read-only acceptance harness

**Status:** Core one-request runner retained; manual operator-token execution retired  
**Branch:** `research/player-intelligence-discovery`  
**Supabase project:** `hrvdhjscwitqpwjhnjkm`  
**Production data writes:** Prohibited

## Important operator notice

The original operator procedure required a short-lived authenticated JWT to be supplied manually to the local process. That procedure is retired and must not be used.

During the first operator attempt, Chrome DevTools displayed the full Supabase browser session object, including access, refresh and provider tokens. The operator immediately signed out, removed the Google connection, allowed the exposed access token to expire and stopped before any live Player request occurred.

For all future live acceptance work:

- do not inspect Supabase Local Storage;
- do not copy session JSON;
- do not paste tokens into PowerShell;
- do not use the browser Console or DevTools to extract credentials;
- do not place credentials in `.env`, screenshots, chat, GitHub, documentation or evidence.

The only approved operator path is the memory-only PKCE wrapper documented in:

`docs/research/player-intelligence/PLAYER-INTEL-001-LOCAL-PKCE-ACCEPTANCE.md`

## Purpose of the retained core runner

The core runner provides one tightly controlled way to call the existing JWT-protected `kingshot-player` Edge Function without using the write-capable `/api/player/account` route and without changing `player_accounts`, Player Intelligence tables, migrations, Edge Functions or Vercel deployments.

It remains an internal implementation primitive used by:

- deterministic synthetic tests;
- the approved local PKCE wrapper;
- future controlled server-authoritative acceptance tooling.

It is not a product endpoint and must not be called directly by an operator with manually obtained credentials.

## Files

- `scripts/player-intelligence-acceptance-controls.mjs`
- `scripts/run-player-intelligence-authenticated-acceptance.mjs`
- `scripts/test-player-intelligence-authenticated-acceptance.mjs`
- `scripts/run-player-intelligence-local-auth-acceptance.mjs`
- `scripts/test-player-intelligence-local-auth-acceptance.mjs`
- `package.json`

## Core operating boundary

A successful core execution:

1. requires the exact branch `research/player-intelligence-discovery`;
2. requires a clean working tree and an explicitly approved 40-character commit SHA;
3. targets only `https://hrvdhjscwitqpwjhnjkm.supabase.co/`;
4. requires an authenticated-user Supabase JWT supplied by an approved wrapper;
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

The runner never writes the requested Player ID, returned Player ID, player name, kingdom, level, profile image, raw response body, JWT, publishable key or actor subject to the evidence file.

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

Evidence is written outside the repository to a local temporary directory with restrictive file permissions. It must not be committed.

## Approved commands

### Deterministic core tests

```bash
npm run test:player-intelligence-acceptance
```

The synthetic suite validates:

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

### Live operator execution

Use only:

```bash
npm run accept:player-intelligence-local-auth -- \
  --execute \
  --player-id <PLAYER_ID> \
  --approved-sha <EXACT_40_CHARACTER_SHA>
```

That wrapper performs normal Google/Supabase PKCE authentication, retains the session in memory, calls this core runner once, revokes the temporary session and clears the memory store.

Direct live execution of `accept:player-intelligence-authenticated` with manually supplied environment tokens is prohibited.

## Current result

The core runner and both synthetic acceptance suites are implemented. The safe no-request plan mode has passed on the operator's isolated local worktree.

No live execute run has yet completed, so current connectivity, latency, upstream availability, cache status, response byte size and provider throttling remain unproven.

## Exit criteria for the one-call acceptance

The live gate may be marked complete only when one owner-approved local PKCE run:

- passes every repository and authentication guard;
- performs exactly one Player request;
- receives a structurally valid exact-ID response or a safely classified failure;
- produces a redacted evidence file containing no Player values or credentials;
- revokes the temporary authentication session;
- clears all in-memory authentication material;
- causes no database write, migration, deployment or linked-account revalidation;
- is recorded in PLAYER-INTEL-001 documentation using technical metadata only.

A successful one-call result does not approve public search, bulk lookup, scheduled collection, persistence migration or detailed hero/loadout research.
