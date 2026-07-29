# PLAYER-INTEL-001 — Local PKCE acceptance flow

**Status:** Implemented; deterministic validation pending on the operator worktree; live execution pending  
**Branch:** `research/player-intelligence-discovery`  
**Supabase project:** `hrvdhjscwitqpwjhnjkm`  
**Production data writes:** Prohibited

## Purpose

Replace manual browser-token extraction with a local, operator-approved authentication flow that never displays, copies or persists Supabase session credentials.

This is an acceptance harness only. It is not a Forge product route and does not authorise public Player search, bulk lookup, scheduled collection, persistence, detailed loadouts or production deployment.

## Why the previous operator procedure was retired

The earlier procedure required inspecting the signed-in browser session. During the first operator attempt, Chrome DevTools displayed the full Supabase session object, including access, refresh and provider tokens.

The operator immediately:

- signed out of Forge;
- removed the Google third-party connection;
- allowed the exposed access-token lifetime to expire;
- stopped the acceptance test before any live Player request was made.

Manual DevTools, Local Storage, clipboard and pasted-token procedures are now prohibited for PLAYER-INTEL-001.

## Files

- `scripts/run-player-intelligence-local-auth-acceptance.mjs`
- `scripts/test-player-intelligence-local-auth-acceptance.mjs`
- `package.json`

## Security boundary

The replacement harness:

1. requires the exact discovery branch, a clean tree and an explicitly approved commit SHA;
2. reads only the existing publishable Supabase configuration from the operator's local environment files;
3. starts a temporary loopback HTTP callback on `127.0.0.1`;
4. initiates normal Google authentication through Supabase Auth using PKCE;
5. opens the provider sign-in URL without printing it;
6. receives only the single-use Auth Code at the local callback;
7. stores the PKCE verifier and temporary Supabase session in an in-memory storage adapter;
8. never writes access, refresh or provider tokens to Local Storage, disk, clipboard, terminal output or evidence;
9. calls the existing one-request Player acceptance runner once;
10. revokes the temporary Supabase session using local-scope sign-out;
11. refuses to report success when temporary-session revocation fails;
12. clears all in-memory authentication material;
13. closes the loopback server;
14. records only redacted technical evidence.

The local callback page uses no-store headers, a restrictive Content Security Policy and no external assets.

## Configuration

The harness uses the existing local Forge environment configuration:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

No service-role key, secret key, manually copied JWT or browser session value is accepted or required.

The redirect target is:

```text
http://localhost:5173/player-intelligence-acceptance/callback
```

It must already be permitted by the Supabase Auth redirect allow list. The harness does not change Auth configuration automatically.

## Commands

### Deterministic tests

```bash
npm run test:player-intelligence-local-auth
```

The synthetic suite verifies:

- PKCE/session storage is memory-only;
- the browser receives no credentials or Player values;
- exactly one Auth Code exchange occurs;
- the Player acceptance runner is called once;
- the temporary session is signed out with local scope;
- failed temporary-session revocation is classified as a failed acceptance;
- in-memory auth material is cleared;
- cancellation performs no Player acceptance request;
- evidence contains no Player ID, access token or refresh token;
- execution requires the explicit `--execute` flag.

### Live one-call acceptance

```bash
npm run accept:player-intelligence-local-auth -- \
  --execute \
  --player-id <PLAYER_ID> \
  --approved-sha <EXACT_40_CHARACTER_SHA>
```

The command opens the normal Google sign-in page. Credentials remain between the operator, Google and Supabase Auth. No token must be copied, displayed or shared.

## Evidence policy

The wrapper retains the original acceptance evidence allow list and adds only:

- `authenticationFlow: pkce_loopback_memory_only`;
- `browserSessionPersisted: false`;
- `credentialsDisplayed: false`;
- `temporarySessionRevoked: true|false`.

Player values, actor identity, access tokens, refresh tokens, provider tokens, Auth Codes, PKCE verifiers and raw source payloads remain prohibited.

## Exit criteria

The live gate is complete only when one operator-approved run:

- completes normal Google/Supabase PKCE authentication;
- performs exactly one Player lookup;
- returns a structurally valid exact-ID result or a safely classified failure;
- writes redacted evidence only;
- revokes the temporary local Auth session;
- clears in-memory storage;
- causes no database write, migration, deployment or linked-account revalidation.

A successful result does not approve production rollout, persistence, public search, enumeration, scheduled collection or detailed hero/loadout ingestion.
