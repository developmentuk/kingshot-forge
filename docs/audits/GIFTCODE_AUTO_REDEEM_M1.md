# Gift-code auto-redemption audit and Milestone 1 decision

**Status:** safe foundation implemented; live provider disabled pending Forge integration approval

**Workstream:** `feature/giftcode-auto-redeem`

**Base:** `release/0.7.0-player-domain` at `1aca694ebe2e57339e17ab85ab190ad762620b8b`

**Audit date:** 17 July 2026

**Supabase activity:** read-only inspection; no migrations, writes, or deployments

## Decision

Clark has confirmed as an authoritative project fact that the supplied Kingshot
auto-redemption script is working, official, and an authoritative technical
reference for the Kingshot redemption flow. This audit adopts that
classification. The script is not unofficial, unsupported, reverse-engineered,
untrusted contributed code, or a behavioural reference only.

The official script demonstrates a concrete provider flow: submit a signed
player lookup, retain the short-lived same-session state, then submit a signed
gift-code request and map the response. It does not require a game password or
CAPTCHA in the supplied implementation.

The audit did not locate separate public API documentation covering a Forge
integration contract, credential classification, rate limits, service levels,
or change policy. That documentation gap is distinct from the official script's
provenance and is not evidence that the script is invalid or unauthorized. It
is discovery work for Forge's production integration design.

Century Games also publicly directs players to a
[manual Kingshot redemption page](https://www.centurygames.com/kingshot-thursday-madness/).
The current
[Century Games Terms of Service](https://www.centurygames.com/terms-of-service/)
restrict ordinary reverse engineering of the Services. That restriction must
not be conflated with technical assessment or use of an official supplied
script. Legal, privacy, security, product, and operational review still apply to
Forge's own implementation and production use; they do not call the official
script's status or authorization into question.

Milestone 1 therefore provides only:

- a manual, user-controlled redemption journey;
- provider-neutral domain types and safety gates;
- a disabled-by-default server feature flag;
- a simulation-only provider that never returns success;
- bounded retry and idempotency policy primitives;
- this audit, target architecture, and contribution matrix.

It does not contain a live provider, request signing, a session flow, an API
mutation route, persistence, a background job, or a Supabase migration.

## Material audited

The archives were hashed, checked for unsafe traversal paths, and extracted
outside the Forge worktree. No external source was copied into Forge.

| Archive | Classification | SHA-256 | Audit copy |
| --- | --- | --- | --- |
| `Kingshot-Discord-Bot-2.0.3.zip` | Contains the supplied working official auto-redemption script and its surrounding bot implementation. | `CF96B52D4E055A1A1D51C374DD71EA4B46425BF55BD1C70EE20583634BD770E0` | `C:\Users\clark\Projects\kingshot-contributed-references\discord-bot\Kingshot-Discord-Bot-2.0.3` |
| `Kingshot-kvk-planner-master.zip` | Adjacent player/planning reference with a corroborating redemption implementation; not the authority for the official-script classification. | `8104BDFFA685E50AC594E6CC7CA3E3546B3DF228CDC7D6E917B7EC08985B71B1` | `C:\Users\clark\Projects\kingshot-contributed-references\kvk-planner\kingshot-kvk-planner` |

The official classification applies to the supplied redemption script and flow.
It does not require Forge to import the surrounding Discord, SQLite, Next.js,
Drizzle, or process-daemon architecture.

The Forge review covered governance, AEGIS, blueprint and release documents;
the current Gift Codes page and edge function; authentication and player
contexts; server authentication and Supabase access; and the live player schema
and RLS policies.

## Current Forge baseline

### Gift codes

- `/gift-codes` invokes the `kingshot-gift-codes` Supabase Edge Function.
- The deployed function is a five-minute cached GET proxy for the community-run
  `kingshot.net` gift-code feed. It has no checked-in source on this branch and
  performs no strict response schema validation.
- Forge displays active codes and supports copying. It has no gift-code table,
  administration, redemption, consent, history, or provider abstraction.
- Code provenance is currently a runtime dependency on a fan-operated service,
  not a Forge canonical dataset.

### Authentication and linked players

- Forge authenticates with Supabase Auth and Google OAuth.
- The live `player_accounts` table has RLS enabled and unique constraints on
  both `user_id` and `player_id`. The current product therefore supports one
  linked character per Forge user, even though the row also has `is_primary`.
- A user can link a character after a public player lookup, but `linked` is not
  proof that the Forge user owns that character.
- `community_verified` and `officially_verified` are the only current statuses
  suitable as a future redemption prerequisite.
- The player tables exist in the live project without equivalent checked-in
  migrations on this branch. That schema drift must be resolved before adding
  gift-code persistence.

### Field visibility

Safe owner-facing redemption context is limited to player name, Player ID,
kingdom, display level/avatar, verification status, and refresh time.

The following must remain server-only: Supabase user identifiers, verifier
identifiers, consent evidence, idempotency hashes, attempt diagnostics, provider
references, rate-limit state, raw upstream responses, server errors, and any
future provider credential. A provider cookie must be ephemeral in process and
must never be persisted or returned to a browser.

The existing public-select policy on `player_accounts` exposes the whole row
when `is_public` is true. A future implementation should use a safe view or
narrow server projection rather than extending that row with operational or
consent data.

## Redemption feasibility assessment

| Question | Finding | Decision |
| --- | --- | --- |
| Is manual redemption official? | Yes. Century Games links its redemption website from official gift-code announcements. | Supported as an external, user-controlled journey. |
| Is an official provider reference available? | Yes. The supplied working official script maps player lookup, request signing, same-session state, redemption, and provider outcomes. | Use it as the authoritative technical reference for the Forge integration design. |
| Is separate public API documentation available? | The audit did not locate public documentation for credentials, scope, rate limits, service levels, or change policy. | Record the missing operational detail for design review; do not use it to invalidate or de-authorize the official script. |
| Can the official flow redeem without a game password? | Yes. The script uses Player ID, a request signature, and short-lived same-session state. | Forge must never request a game password; confirm the exact signing and credential boundary before implementation. |
| Is the flow technically established? | Yes. The supplied script is working and official. The two inspected implementations differ in some request timing and surrounding operational choices. | Map the official script exactly, then define Forge-owned error, rate-limit, and change-handling policy. |
| Is CAPTCHA required? | The supplied official script explicitly reports no CAPTCHA requirement. | Do not add bypass logic; stop and review if the provider flow changes. |
| Can Forge support auto-redemption with its current player link? | Not safely. A linked Player ID is not ownership-verified and there is no consent record. | Require verified ownership and versioned consent first. |
| Can Forge implement the official flow behind the provider contract? | Yes, after Forge's product, privacy, security, data, and operational gates are approved. | Keep the provider server-only, isolated, disabled by default, consent-gated, verified-character-gated, idempotent, rate-limited, retry-bounded, and auditable. |

## Security review

| Risk | Evidence from source material | Forge requirement |
| --- | --- | --- |
| Signing and credential boundary | The official script includes request signing material and a concrete request contract. | Confirm the exact Forge credential classification and signing requirements. Keep all signing material server-only, environment-scoped, rotatable where applicable, access-audited, and absent from client bundles. |
| TLS bypass in adjacent bot paths | The surrounding Discord bot disables certificate and hostname verification in login-related paths outside the official redemption request sequence. | Do not carry this behaviour into Forge. TLS verification is mandatory and not configurable off. |
| Variable browser-style headers | The surrounding bot generates browser-like request headers. | Map only the header set required by the official flow. Do not add client impersonation, CAPTCHA bypass, or access-control bypass logic. |
| Separate shared feed | Both projects also contain a plaintext HTTP community gift-code service and an embedded access key; this is separate from the official provider flow. | Reject the service, key, and two-way synchronization. Use reviewed Forge provenance for the code registry. |
| Redemption without individual consent | Alliance-wide and proxy-account flows can redeem for many Player IDs. | Consent must be per verified player, explicit, versioned, revocable, and recorded before every job. |
| Wrong-character action | Forge currently accepts an unverified public lookup as a linked player. | Resolve the player server-side from the authenticated actor; show a character snapshot; require verified ownership for automation. |
| Replay and duplicate jobs | Planner history lacks a user/code uniqueness constraint; process queues are not durable. | Unique hashed idempotency key for player account + published gift-code version + purpose; transactional claim. |
| Retry implementation mismatch | A surrounding Discord batch retry tuple does not increment its cycle count consistently. | At most two retries after the first attempt, only for classified transient or rate-limit failures. |
| Lost or rewritten history | Some failures are not persisted; invalid-code cleanup and rechecks delete history. | Append-only events and immutable terminal attempts. Corrections add events rather than delete evidence. |
| Sensitive logs | Implementations log Player IDs, nicknames, and full upstream payloads. | Structured, redacted logging; no raw response bodies or cookies; access-controlled operational metrics. |
| Serverless duplication | Planner starts process-global daemons; bot state is held in memory/SQLite. | Durable queue or scheduled worker with leases, idempotency, bounded concurrency, and crash recovery. |
| Proxy adoption/takeover | Planner mutates proxy identifiers during an unauthenticated adoption flow. | Reject proxy accounts. Identity claims require authenticated proof and an auditable support path. |

### Abuse and rate-limit model

A future authorized implementation needs layered limits:

- per authenticated Forge user;
- per verified player account;
- per code and published code version;
- per source IP for request creation;
- global and per-provider concurrency;
- bounded batch size for “all eligible codes”;
- provider `Retry-After` compliance and a circuit breaker.

Permanent outcomes such as expired, invalid, already claimed, ineligible, or
authorization failure must not retry. Only explicitly classified transient and
rate-limit outcomes may retry, with durable attempt counts and jittered backoff.

### Consent, deletion, and retention

Consent should state the exact character, action scope (single or automatic),
consent document version, code-selection policy, provider, data sent, retention,
and how to opt out. Disabling auto-redemption or unlinking a character must stop
new jobs immediately.

Preference data can be deleted after opt-out. Security and redemption history
should be retained for an approved, documented period, then pseudonymized or
deleted according to policy. Unlinking must not silently destroy audit evidence.
No retention period is selected in this milestone; product/privacy approval is
required.

### Credential handling

The supplied official flow does not require a game password, and Forge must
never ask for or store one. It does use request-signing material and short-lived
same-session state. The Official Provider Integration Design must confirm
whether the signing value is public protocol material or a production secret
and define its storage, rotation, and audit boundary accordingly. Any secret
must be server-only, environment-scoped, access-audited, and stored in the
deployment secret manager. Session state must exist only for the request
sequence and then be discarded. This is a review gate for Forge's
implementation, not a question about the official script's authorization.

## Contribution matrix

`Reuse` means the Forge implementation can use the source as-is after satisfying
the stated conditions. `Adapt` means implement the official flow or concept
inside Forge's existing architecture. `Reference` means useful for requirements
or comparison without source incorporation. `Reject` means the surrounding
behaviour or dependency must not enter Forge. A `Reject` decision for adjacent
bot infrastructure does not question the official redemption script.

### Kingshot Discord Bot 2.0.3

| Area | Decision | Reason and Forge target |
| --- | --- | --- |
| Official player/signature/session flow | Adapt | Working official and authoritative technical reference. Map it into a server-only Forge provider adapter after the Forge approval gates; do not expose signing or session state to React or the browser. |
| Browser-header generation | Reject for direct reuse | Use only the exact reviewed headers required by the official flow; do not import adaptive client impersonation behaviour. |
| Plaintext shared gift-code API and embedded key | Reject | Separate from the official provider. It introduces untrusted transport, secret distribution, and third-party mutation dependencies. |
| Redemption response taxonomy | Adapt | Map the official provider outcomes into stable Forge states: pending, succeeded, already claimed, expired, failed, not supported, and simulation only. Preserve unknown-response handling. |
| Transient retry/backoff concept | Adapt | Use a durable queue, bounded attempts, jitter, provider rate headers, and circuit breaking. Do not reuse the unbounded tuple logic. |
| Per-player redemption history and summaries | Adapt | Append-only attempt/event data with safe owner and operator projections. |
| Alliance-wide enablement | Reject | Alliance administrators cannot consent on behalf of individual players. |
| Test redemption against random member IDs | Reject | No individual consent and creates unwanted account actions. |
| Invalid-code validation queue | Adapt after approval | The official flow supports validation, but Forge requires consent-aware non-production tests, withdrawn-code handling, bounded calls, and immutable history before invoking it. |
| Alliance member CSV import/filter/export | Adapt | Potential future alliance tooling using Forge player/alliance models, strict CSV validation, authorization, and audit. |
| Discord cogs, views, embeds, and SQLite storage | Reject | Runtime and UI are incompatible with Vite/Vercel/Supabase; state is not durable enough. |
| Python dependency set | Reject for this feature | Includes Discord, HTTP, OCR, image, proxy, and plotting packages not needed by Forge. Do not add them. |

The archive's custom usage licence governs copying, modifying, and distributing
the surrounding bot source. It permits personal, educational, and open-source
use; requires written permission for commercial use; requires attribution and
licence preservation for derivative source; and restricts sale and paid
distribution. This milestone copies no source. Those exact terms would require
review only if Forge later incorporates or distributes source from the archive.
They are not a blocker to recognizing the official script, technically mapping
the official flow, or designing an independently implemented Forge provider.

### Kingshot KvK Planner

| Area | Decision | Reason and Forge target |
| --- | --- | --- |
| Redemption-flow corroboration | Reference | It aligns with the supplied official flow, but the authoritative implementation for the Forge design is the working official script. |
| Process-global gift-code/profile daemons | Reject | Unsafe under Vercel scaling and can run concurrently in multiple instances. |
| Plaintext shared gift-code feed | Reject | Same untrusted service and embedded key as the bot. |
| Gift-code registry, attempt history, and admin monitoring | Adapt | Useful domain concept; implement with Forge canonical records, immutable attempts/events, consent, and safe projections. |
| `user_gift_codes` design | Reference | Highlights required fields, but lacks a composite uniqueness guarantee and consent snapshot. |
| Better Auth roles and user model | Reject | Forge uses Supabase Auth, Forge roles, and the player domain. |
| Proxy users and adoption flow | Reject | Creates consent and account-takeover risks; one unauthenticated flow mutates identity data. |
| Campaign lifecycle and locked/read-only state | Adapt | Useful event-domain concept. Reads must not cause writes or seed defaults. |
| Requisition bulk upsert | Adapt | Preserve transactional batching concept, add strict types, authorization, unique constraints, and audit. |
| Battle availability segments and leader skills | Adapt | Useful scheduling model, with kingdom/campaign authorization and minimal personal-data projections. |
| Rally ownership, travel-time maximum, and timer state | Adapt | Useful algorithms; implement independently with server-authoritative timestamps and scope checks. |
| Scheduler, war-room, rally, campaign and history UI concepts | Reference | Product-flow inspiration only; rebuild in Forge design system and routing. |
| Scoring/configuration numbers | Reject pending provenance | Do not treat unexplained values as canonical Forge data. Require editorial evidence and review. |
| Next.js, Better Auth, Drizzle, Bun and Postgres stack | Reject for import | Forge already uses Vite, React, Vercel Functions, and Supabase. No parallel app or second auth/database layer. |

No licence file was present in the planner archive. This milestone copies no
planner source, and the future official provider does not need planner source.
If Forge later proposes incorporating planner source, that separate,
source-specific redistribution question must be resolved at that time. It is
not a live auto-redemption blocker and does not affect the official script's
status.

## Target Forge architecture

### Boundary

The browser may read published codes, safe player context, consent state, and
safe redemption results. It may request a redemption by stable Forge record ID.
It may not supply the authoritative Player ID, call a provider, build a
signature, receive a provider cookie, or write attempt status directly.

An authenticated Vercel Function should resolve the actor and player account,
evaluate eligibility, create an idempotent pending attempt, and enqueue work.
A durable worker should re-check consent and eligibility before making an
approved official-provider call. Provider results should be normalized and written as
append-only events.

The future adapter should map the supplied official script's player lookup,
signing, same-session request sequence, response states, and error handling. The
mapping remains isolated in the server-only provider implementation; React,
browser code, and shared domain policy must not import provider credentials,
signing logic, or transport details.

### Proposed persistence (not applied)

| Record | Purpose | Essential constraints |
| --- | --- | --- |
| `gift_codes` | Canonical code and publication provenance | Unique normalized code/version; active/expired/withdrawn state; source and evidence; published timestamps. |
| `player_giftcode_preferences` | Per-player automatic-redemption consent | Unique player account; mode; consent version/time; disabled time; actor; no provider cookie. |
| `giftcode_redemption_attempts` | Immutable request and current safe outcome | Unique hashed idempotency key; player and published-code FKs; consent and character snapshots; bounded attempt count; no raw provider body. |
| `giftcode_redemption_events` | Append-only state transitions and operator evidence | Attempt FK; event type; safe failure code; actor/service; timestamp; insert-only. |

Direct browser mutation of these tables should be denied. Server code using the
service role performs validated writes. Owners receive a safe view that omits
user IDs, consent evidence, idempotency values, provider references, rate-limit
state, and internal diagnostics. Operator access should use explicit Forge
roles, reason capture, and audit events.

### Proposed API contract (not exposed)

| Method and route | Purpose | Contract notes |
| --- | --- | --- |
| `GET /api/giftcodes` | Published active/expired registry | Server-validated schema and provenance; replace raw feed pass-through. |
| `GET /api/giftcodes/redemption-context` | Safe player, consent, and eligibility view | Identity resolved from bearer token; no operational fields. |
| `PUT /api/giftcodes/preferences` | Explicit enable/disable and consent version | Requires verified player and exact consent payload; disabling is immediate. |
| `POST /api/giftcodes/redemptions` | Request one code | Body uses stable Forge record IDs and mode; the server resolves Player ID and derives deterministic idempotency from the verified player, published code version, and purpose; returns `202`. |
| `POST /api/giftcodes/redemptions/batch` | Request bounded eligible codes | Explicit reviewed list, fixed maximum, one attempt identity per code. |
| `GET /api/giftcodes/redemptions` | Owner-safe history | Paginated, redacted projection. |
| `GET /api/giftcodes/redemptions/:id` | Poll one attempt | Owner/operator authorization; normalized state only. |

Request creation must re-check the current verified player, consent version,
published code status, idempotency record, and rate limits in one transaction.
The worker must repeat the mutable checks before external activity.

### User journey

1. A player signs in to Forge and links a Player ID through the existing lookup.
2. Manual mode shows the exact character, kingdom, Player ID, and verification
   state before the player leaves Forge.
3. The player copies one active code and opens the official Century Games page.
4. Forge does not populate, transmit, or submit the Player ID or code.
5. A future automatic mode remains unavailable until the Forge adapter design,
   ownership verification, versioned consent, persistence, security controls,
   and audit model are approved.
6. When approved, single-code and “all eligible” requests show the exact
   character and codes, require confirmation, expose pending/terminal states,
   and provide immutable history and an immediate opt-out.

## Milestone 1 implementation map

| File | Change |
| --- | --- |
| `shared/domains/giftcodes/redemption.ts` | Eligibility, verification, consent version, status, input validation, idempotency material, and bounded retry policy. |
| `shared/domains/giftcodes/redemption.test.ts` | Focused safety-policy tests. |
| `server/giftcodes/provider.ts` | Provider-neutral server contract. |
| `server/giftcodes/mockProvider.ts` | Simulation-only provider; always reports no external request and never success. |
| `server/giftcodes/config.ts` | Exact-match environment flag, disabled by default, and production-provider assertion. |
| `server/giftcodes/provider.test.ts` | Flag and mock safety tests. |
| `src/features/giftcodes/GiftRedemptionFoundationPanel.tsx` | Manual journey, linked-character confirmation, official external link, and explicit auto-redemption stop state. |
| `src/pages/GiftCodesPage.tsx` | Integrates the panel and distinguishes the community code feed from official redemption. |
| `src/styles/legacy/03-public-pages.css` | Responsive desktop/mobile panel styles. |

No API route imports the provider contract, so the mock cannot be invoked from a
browser or deployed endpoint. No sample redemption rows or fake success history
are generated.

## Dependencies and overlap

Milestone 1 adds no package dependency. The official script is now the
authoritative provider-flow reference, while the Discord bot's Python runtime
and the planner's Next.js/Better Auth/Drizzle/Bun stack remain outside Forge.

The active Editorial Platform branch was compared before implementation. This
work intentionally avoids its known overlap files, including `src/App.tsx`,
`src/components/AppLayout.tsx`, `package.json`, and core blueprint/governance
documents. It reuses the existing `/gift-codes` route, adds a feature-local
component, and limits shared changes to the existing public-page stylesheet.

## Required approvals before a live milestone

These gates approve Forge's production integration. They do not seek to
re-authorize or reclassify the supplied official script.

1. Product approval for the Official Provider Integration Design, user journey,
   single-code and automatic modes, support ownership, and rollout criteria.
2. Technical approval of the official flow mapping, exact credential and
   signing requirements, provider response/error mapping, rate limits, change
   handling, and server-only adapter boundary.
3. Player-domain approval for verified-character ownership and the exact safe
   identity projection used before every request.
4. Privacy approval for explicit consent and revocation, data minimization,
   retention, deletion or pseudonymization, and player-facing history.
5. Security approval for server-side secret storage, TLS verification, access
   controls, redacted logging, abuse controls, replay protection, and incident
   response.
6. Database approval for checked-in Supabase migrations, RLS, grants, safe
   views, indexes, rollback steps, immutable audit events, and schema-drift
   reconciliation. No migration is applied by this milestone.
7. Operational approval for durable idempotency, bounded retry, rate limiting,
   code expiry and withdrawal handling, observability, alerting, runbooks, and
   support procedures.
8. Release approval after controlled non-production validation demonstrates no
   duplicate or wrong-character redemption and confirms feature-flag rollback,
   monitoring, and production rollout readiness.

## Revised live integration blockers

The remaining blockers are Forge implementation and release controls:

- approved Forge integration design for the official script;
- exact credential and signing requirements;
- secure server-side secret storage for any value classified as secret;
- a verified Player Character foundation;
- explicit, versioned user consent and immediate revocation;
- database schema, RLS, grants, safe projections, and audit model;
- durable idempotency, duplicate prevention, and redemption history;
- bounded retry, rate-limit handling, concurrency limits, and circuit breaking;
- code expiry, invalidation, and withdrawn-code handling;
- observability without sensitive logging;
- controlled non-production validation;
- legal, privacy, security, product, and operational review of Forge's
  implementation; and
- a production rollout, monitoring, incident-response, and support plan.

The blocker list does not include unofficial source, an unsupported or
reverse-engineered flow, absence of official authorization, lack of separate
public API documentation, or an incompatible contributed-code licence.

Until the gates above are complete, the supported Forge experience remains
manual redemption on the official Century Games page. The feature flag stays
disabled and no live provider route exists.

## Recommended next milestone

### Gift Centre Official Provider Integration Design

This architecture milestone should produce an approved, implementation-ready
design without enabling or invoking the live provider. It should cover:

- line-by-line mapping of the official script's player lookup, signing,
  same-session redemption flow, responses, and failure modes;
- the server-only provider adapter and credential boundary;
- request signing and secret classification where applicable;
- provider response and error normalization;
- provider rate limits, bounded retry, concurrency, and circuit breaking;
- deterministic idempotency and duplicate-redemption protection;
- explicit consent, revocation, and verified-character eligibility;
- canonical code expiry and withdrawal handling;
- redemption attempts, immutable history, and audit events;
- safe owner/operator projections and sensitive-log redaction;
- a controlled non-production test strategy; and
- the product, privacy, legal, security, operational, database, and production
  approval gates listed above.
