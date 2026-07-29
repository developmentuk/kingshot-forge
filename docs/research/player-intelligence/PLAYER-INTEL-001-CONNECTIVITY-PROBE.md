# PLAYER-INTEL-001 — Controlled Connectivity Probe

**Status:** Safely blocked at the existing authentication boundary  
**Date:** 29 July 2026  
**Local review window:** approximately 18:02–18:15 Europe/London  
**Branch:** `research/player-intelligence-discovery`  
**Issue:** #26  
**Draft PR:** #27

## Purpose

Attempt one bounded, read-only request through Forge's existing basic-player source path and review the source's rate posture without changing a Player account, deploying a new route, weakening authentication, reusing captured credentials, or exposing Player data.

## Approved probe boundary

The probe was restricted to:

- one known-valid Player ID already present in Forge;
- no Player ID discovery or enumeration;
- no Jeabs List request or captured token;
- no `player_accounts` link, revalidation, update or insert;
- no Supabase migration or database write;
- no Edge Function or Vercel deployment;
- no service-role key;
- no raw Player values in logs or documentation;
- no deliberate rate-limit triggering.

## Existing path inspected

The active Supabase Edge Function is:

- function: `kingshot-player`;
- active version observed: 6;
- authentication: `verify_jwt=true`;
- request: bounded `GET` with `playerId`;
- upstream: Kingshot.net `api/player-info`;
- response cache emitted by the function: `public, max-age=300, s-maxage=300`;
- expected normalised fields: Player ID, player name, kingdom, numeric level, rendered level labels, level image and profile image.

The production `/api/player/account` route was not used because a successful request is a link/revalidation command that writes the current `player_accounts` projection. That route is not a read-only probe.

## Probe attempts

### 1. Direct upstream request from the analysis runner

**Result:** no request reached the upstream service.

The isolated runner could not resolve/reach the Kingshot.net host. This is an execution-environment network constraint and is not evidence that the upstream is unavailable to Supabase or Vercel.

### 2. Existing JWT-protected Edge Function as a normal public client

**Result:** stopped before invocation.

The function correctly requires a valid JWT. No authenticated Forge-user access token was available through the approved tooling boundary. A service-role credential was neither requested nor used. The public production account route was not substituted because it would mutate Player state.

### 3. Supabase database HTTP extension

**Result:** unavailable and no extension was installed.

Read-only extension inspection found neither a usable synchronous `http` path nor an approved database network mechanism for this one-off request. No extension or database object was installed.

### 4. Temporary Vercel/server route

**Result:** deliberately not created.

Creating and deploying a route solely to perform the probe would have changed infrastructure and exceeded the discovery sprint's no-deployment boundary.

## Final connectivity result

**Current connectivity is not disproved, but it was not freshly demonstrated during this probe.**

The safe result is:

- the configured source path is active and its code is inspectable;
- historic Forge records demonstrate previous successful use;
- the source-neutral adapter contract and negative tests pass;
- a fresh read-only invocation requires either an authenticated user session exposed to an approved test harness or a separately approved non-production probe route;
- no unauthorised workaround is justified.

No upstream Player response was received during this probe. Therefore no current latency, response byte count, payload hash, response headers or live field-presence claims are recorded.

## Rate-posture review

### Confirmed from Forge's active function

- The function emits a five-minute cache policy.
- The current implementation does not itself enforce an application-level per-user quota.
- The function forwards upstream response status but does not currently expose or normalise an explicit retry contract.
- No live `RateLimit`, `Retry-After` or equivalent headers were measured because no current request reached the upstream.

### Previously supplied API contract

The project-supplied Kingshot.net OpenAPI material described the `player-info` endpoint as limited to six requests per minute. This was not independently reconfirmed from a current public Kingshot.net documentation page on 29 July 2026 and must be treated as a provisional ceiling rather than a guaranteed allowance.

### Recommended Forge limits

Until the provider publishes or directly confirms a current policy, Forge should remain materially below the provisional ceiling:

1. **Cache/coalescing:** at most one fresh upstream request for the same Player ID in any five-minute window across Forge.
2. **Per authenticated actor:** no more than three fresh unique-Player requests per minute.
3. **Daily safety cap:** initially no more than 30 fresh requests per authenticated actor per rolling 24 hours.
4. **Anonymous access:** no anonymous fresh refresh operation.
5. **No automation:** no bulk enumeration, alliance scanning, kingdom scanning or scheduled collection.
6. **429 behaviour:** honour `Retry-After` when present; otherwise use bounded exponential backoff and do not retry immediately.
7. **Stale fallback:** return the most recent safe snapshot with an explicit stale status when refresh is unavailable or cooling down.
8. **Timeout:** 10–15 seconds maximum for the upstream request.
9. **Payload controls:** retain the existing content-type, maximum-size, exact-ID and safe-URL validation.
10. **Logging:** log correlation ID, source outcome, latency band and status only; never log raw payloads, Player names, image URLs, keys or tokens.
11. **Circuit breaker:** pause fresh requests after repeated provider failures or rate responses.
12. **Cost control:** use existing Supabase/Vercel capacity and avoid paid queues or schedulers unless measured demand justifies them and Clark approves.

These are Forge safety limits, not claims about what Kingshot.net permits.

## Security findings

- JWT protection worked as intended and prevented an unauthenticated probe.
- The existing browser/public account command is unsuitable for diagnostics because it can write.
- The active Edge Function currently returns permissive CORS (`Access-Control-Allow-Origin: *`). If all future privileged calls are server-to-server, this should be tightened or its necessity explicitly documented.
- A publishable client key is not equivalent to an authenticated user session and must not be treated as authority.
- No service-role, captured HAR token, signing secret or private credential was used or recorded.

## Decision

### Basic Player Intelligence

**Conditional GO for continued non-production engineering.**

The adapter, validation, provenance and persistence design are technically feasible. Production implementation remains blocked by:

- a reproducible authenticated read-only acceptance harness;
- current provider terms/rate confirmation;
- approval of retention and refresh policy;
- resolution of the Player Identity replacement-schema dependency;
- non-production persistence rehearsal.

### Detailed Jeabs-style loadouts

**NO-GO.**

The connectivity probe adds no evidence supporting hero/loadout collection. Detailed loadouts remain a separate, higher-risk research question and must not be inferred from the basic player-info source.

## Next permitted step

Create a test-only authenticated acceptance harness that uses a real owner session against a protected preview or approved local environment, invokes the source adapter once, records only redacted response metadata, and performs no database write. This requires a deliberate test session supplied through the normal Forge authentication flow; it must not collect or persist the session token.

## Change record

- No upstream response obtained.
- No Player record read into documentation.
- No Player record written.
- No Supabase schema change.
- No function deployment.
- No Vercel production deployment.
- No credential preserved.
