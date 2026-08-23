# OPS-URL-001 — WHATWG Request Query Parsing

## Objective

Close GitHub issue #35 by removing Kingshot Forge's reliance on the legacy Vercel request-query getter that can enter Node's deprecated `url.parse()` path and emit `[DEP0169]` warnings in production.

## Canonical base

`b2e89a6fcb2b120f0a5876ddb426079ed461dd09`

## Production evidence

The warning has repeatedly appeared on successful `GET /api/data-engine/dataset` requests in Vercel production runtime logs. The affected requests still return HTTP 200, so this is operational/security-hygiene debt rather than a current availability failure.

Forge first-party source contains no direct `url.parse()` call. Investigation instead identified first-party request handlers that read `VercelRequest.query`. Vercel's own serverless-function query parser historically used `url.parse(request.url, true)` and was later migrated upstream to the WHATWG `URL` API to silence DEP0169 on cold starts.

Forge's lockfile already resolves `@vercel/node` newer than that upstream correction. OPS-URL-001 therefore removes the application dependency on the request-query getter itself rather than performing an unsupported runtime downgrade or meaningless dependency bump.

## Correction

A shared server helper parses a single named query parameter from `request.url` using the WHATWG `URL` and `URLSearchParams` APIs.

The helper:

- accepts relative or absolute request URLs;
- performs standard URL percent-decoding;
- returns `null` when the named parameter is absent;
- returns `null` when the named parameter occurs more than once;
- preserves an explicitly empty parameter as an empty string;
- performs no network access.

All first-party request-query consumers discovered by the repository-wide scan are migrated from `request.query` to the shared helper, including:

- Data Engine dataset and preview;
- Search and Admin Search;
- Art Studio;
- Buildings Data Studio and Buildings publication;
- Editorial record;
- Entity resolve and validate;
- Giftcodes;
- Operations applications and users;
- Contributor applications;
- Vision evidence;
- public Player Identity lookup and Player Support lookup through `server/player-identity/http.ts`.

The final Player Identity correction followed an exact-head Codex P1 finding which identified `request.query.alias` and `request.query.caseId` outside the original `api/`-only guard.

## Behaviour preservation

Dataset endpoints continue to reject missing, unsupported or duplicated `dataset` parameters with their existing HTTP 400 response.

Art Studio continues to default to the `gallery` action when `action` is absent or duplicated. An explicitly empty `action` remains an unsupported action and therefore follows the existing method-not-allowed path.

Public Player Identity continues to reject an absent or unusable alias. Duplicated aliases now fail closed through the shared single-value parser instead of entering the Vercel request-query getter.

Player Support continues to inspect a supplied single case ID and list support cases when no single case ID is available. Duplicated case IDs therefore behave as absent rather than selecting an arbitrary duplicate value.

No route names, response shapes, data contracts, authentication rules or publication behaviour are changed.

## Regression boundary

`scripts/test-ops-url-001.mjs` verifies:

- relative and absolute WHATWG URL parsing;
- encoded values;
- duplicate fail-closed semantics;
- empty-value behaviour;
- the dataset, preview, Art Studio and Player Identity integrations;
- every TypeScript file below both `api/` and `server/` is free of `request.query` / `req.query` access;
- first-party TypeScript below `api/` and `server/` contains no legacy `url.parse()` call/import pattern.

The focused OPS workflow is triggered by changes anywhere below `api/` or `server/`, preventing server-side request-query consumers from bypassing the guard.

## Release gate

Before merge, the final exact head must pass:

1. `node --experimental-strip-types scripts/test-ops-url-001.mjs`
2. repository integration checks
3. `git diff --check`
4. one full `npm run check` on the final exact head
5. review-thread closure
6. explicit owner merge authorisation

The focused OPS workflow runs cheaply while the pull request is draft. The full Final AEGIS job runs only after ready-for-review.

## Production acceptance

After an owner-authorised merge and the automatic production deployment, acceptance requires all of the following on the exact merge SHA:

- Vercel deployment is `READY`, production-targeted and assigned to `ksforge.app` without alias error;
- `/api/data-engine/dataset?dataset=buildings` remains HTTP 200;
- `/api/data-engine/dataset?dataset=vip` remains HTTP 200;
- the public `/api/art-studio` gallery path returns its expected successful response;
- the public Player Identity and Player Support request paths do not re-enter `VercelRequest.query`;
- after fresh requests, exact-deployment runtime logs contain no new `[DEP0169]` / `url.parse()` warning.

If the warning persists after Forge no longer accesses `VercelRequest.query`, the release must not claim the issue fixed. The residual warning must instead be classified as platform/transitive and investigated separately.

## Non-goals

- Supabase migrations or data changes
- Vercel configuration changes
- authentication changes
- route changes
- API response-shape changes
- Node runtime downgrades
- unrelated dependency upgrades
