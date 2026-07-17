# Gift-code auto-redemption audit and Milestone 1 decision

**Status:** safe foundation implemented; live redemption blocked

**Workstream:** `feature/giftcode-auto-redeem`

**Base:** `release/0.7.0-player-domain` at `1aca694ebe2e57339e17ab85ab190ad762620b8b`

**Audit date:** 17 July 2026

**Supabase activity:** read-only inspection; no migrations, writes, or deployments

## Decision

Automatic redemption is technically reproducible from the two contributed
projects, but it is not appropriate to ship from Forge.

Both projects use the same inferred browser flow: submit a signed player lookup,
retain a short-lived session cookie, then submit a signed code request. The
signing material and request contract were recovered from client behaviour, not
from a documented partner API. One implementation also attempts to look like a
changing browser client, and both depend on operational assumptions that could
change without notice.

Century Games does publicly direct players to a
[manual Kingshot redemption page](https://www.centurygames.com/kingshot-thursday-madness/),
but the audit found no official third-party API documentation, credentials
programme, automation permission, schema, rate limits, service level, or change
policy. The current
[Century Games Terms of Service](https://www.centurygames.com/terms-of-service/)
grant personal, non-commercial access and prohibit reverse engineering. This is
an additional legal and operational stop condition, not a legal conclusion.

Milestone 1 therefore provides only:

- a manual, user-controlled redemption journey;
- provider-neutral domain types and safety gates;
- a disabled-by-default server feature flag;
- a simulation-only provider that never returns success;
- bounded retry and idempotency policy primitives;
- this audit, target architecture, and contribution matrix.

It does not contain a live provider, request signing, a cookie flow, an API
mutation route, persistence, a background job, or a Supabase migration.

## Material audited

The archives were hashed, checked for unsafe traversal paths, and extracted
outside the Forge worktree. No contributed source was copied into Forge.

| Archive | SHA-256 | Audit copy |
| --- | --- | --- |
| `Kingshot-Discord-Bot-2.0.3.zip` | `CF96B52D4E055A1A1D51C374DD71EA4B46425BF55BD1C70EE20583634BD770E0` | `C:\Users\clark\Projects\kingshot-contributed-references\discord-bot\Kingshot-Discord-Bot-2.0.3` |
| `Kingshot-kvk-planner-master.zip` | `8104BDFFA685E50AC594E6CC7CA3E3546B3DF228CDC7D6E917B7EC08985B71B1` | `C:\Users\clark\Projects\kingshot-contributed-references\kvk-planner\kingshot-kvk-planner` |

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
| Is a documented third-party API available? | No documentation, partner credentials, scope, rate contract, or stability statement was found. | Do not integrate. |
| Can the contributed flow redeem without a game password? | The projects use Player ID, a derived request signature, and a short-lived cookie. | Technical feasibility does not establish permission or safety. |
| Is the flow stable? | No. It is an inferred website contract with inconsistent timestamp handling across implementations. | Treat as unsupported and change-prone. |
| Is CAPTCHA required? | The contributed projects currently report none. | Absence of a control is not authorization to automate. |
| Can Forge support auto-redemption with its current player link? | Not safely. A linked Player ID is not ownership-verified and there is no consent record. | Require verified ownership and versioned consent first. |
| Can the contributed provider be wrapped behind a feature flag? | A flag would reduce exposure but would not resolve authorization, licensing, or security concerns. | Keep only a provider interface and non-successful mock. |

## Security review

| Risk | Evidence from contributed code | Forge requirement |
| --- | --- | --- |
| Undocumented signing contract | Both projects reproduce a client-derived signature using embedded material. | No signing implementation until Century Games supplies an authorized contract and credentials. |
| TLS bypass | Discord bot code disables certificate and hostname verification in some request paths. | Reject. TLS verification is mandatory and not configurable off. |
| Bot-control evasion | Discord bot rotates browser-like headers and describes the goal as bypassing detection. | Reject. Do not imitate clients or bypass CAPTCHA, bot controls, or access controls. |
| Untrusted shared feed | Both projects contain a plaintext HTTP gift-code service and embedded access key. | Reject the service, key, and two-way synchronization. Use reviewed Forge provenance. |
| Redemption without individual consent | Alliance-wide and proxy-account flows can redeem for many Player IDs. | Consent must be per verified player, explicit, versioned, revocable, and recorded before every job. |
| Wrong-character action | Forge currently accepts an unverified public lookup as a linked player. | Resolve the player server-side from the authenticated actor; show a character snapshot; require verified ownership for automation. |
| Replay and duplicate jobs | Planner history lacks a user/code uniqueness constraint; process queues are not durable. | Unique hashed idempotency key for player account + published gift-code version + purpose; transactional claim. |
| Unbounded retry | A Discord retry tuple fails to increment its cycle count. | At most two retries after the first attempt, only for classified transient/rate-limit failures. |
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

The audited browser flow does not require a game password, and Forge must never
ask for or store one. If Century Games later provides an official API token, it
must be server-only, environment-scoped, rotatable, access-audited, and stored in
the deployment secret manager. If a short-lived session cookie remains part of
an authorized contract, it must exist only for the request sequence and then be
discarded.

## Contribution matrix

`Reuse` means the Forge implementation can use the source as-is after satisfying
the stated conditions. `Adapt` means independently re-implement the concept in
Forge architecture. `Reference` means useful for requirements only. `Reject`
means the behaviour or dependency must not enter Forge.

### Kingshot Discord Bot 2.0.3

| Area | Decision | Reason and Forge target |
| --- | --- | --- |
| Live player/signature/cookie client | Reject | Undocumented client-derived contract; includes TLS bypass in request paths. No Forge provider until written authorization. |
| Browser-header randomisation | Reject | Explicit bot-detection evasion. |
| Plaintext shared gift-code API and embedded key | Reject | Untrusted transport, secret distribution, and third-party mutation dependency. |
| Redemption status taxonomy | Adapt | Independently define stable Forge states: pending, succeeded, already claimed, expired, failed, not supported, simulation only. Do not copy numeric/provider mappings until officially documented. |
| Transient retry/backoff concept | Adapt | Use a durable queue, bounded attempts, jitter, provider rate headers, and circuit breaking. Do not reuse the unbounded tuple logic. |
| Per-player redemption history and summaries | Adapt | Append-only attempt/event data with safe owner and operator projections. |
| Alliance-wide enablement | Reject | Alliance administrators cannot consent on behalf of individual players. |
| Test redemption against random member IDs | Reject | No individual consent and creates unwanted account actions. |
| Invalid-code validation queue | Reference | Useful workflow concept only; validation cannot call an undocumented mutation endpoint. |
| Alliance member CSV import/filter/export | Adapt | Potential future alliance tooling using Forge player/alliance models, strict CSV validation, authorization, and audit. |
| Discord cogs, views, embeds, and SQLite storage | Reject | Runtime and UI are incompatible with Vite/Vercel/Supabase; state is not durable enough. |
| Python dependency set | Reject for this feature | Includes Discord, HTTP, OCR, image, proxy, and plotting packages not needed by Forge. Do not add them. |

The archive contains a custom usage licence. It permits personal, educational,
and open-source use but requires written permission for commercial use, requires
attribution/licence preservation for derivatives, and restricts sale. Clark must
confirm the Forge use case and obtain permission where necessary before any
source-level reuse. This milestone copies no source.

### Kingshot KvK Planner

| Area | Decision | Reason and Forge target |
| --- | --- | --- |
| Live signed redemption client | Reject | Same undocumented browser contract and embedded signing material. |
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

No licence file was present in the planner archive. Forge's existing Sir Flux
review authorizes reuse and expansion of contributed concepts, workflows, and
algorithms with attribution, but it is not evidence that the archived source
code itself has a compatible licence. Source-level reuse requires explicit
licence, assignment, or written permission. This milestone copies no source.

## Target Forge architecture

### Boundary

The browser may read published codes, safe player context, consent state, and
safe redemption results. It may request a redemption by stable Forge record ID.
It may not supply the authoritative Player ID, call a provider, build a
signature, receive a provider cookie, or write attempt status directly.

An authenticated Vercel Function should resolve the actor and player account,
evaluate eligibility, create an idempotent pending attempt, and enqueue work.
A durable worker should re-check consent and eligibility before making an
authorized provider call. Provider results should be normalized and written as
append-only events.

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
| `POST /api/giftcodes/redemptions` | Request one code | Body uses `playerAccountId`, `giftCodeId`, mode, and client idempotency token; server resolves Player ID; returns `202`. |
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
5. A future automatic mode remains unavailable until ownership verification,
   versioned consent, authorized provider access, persistence, and audit are all
   approved.
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

Milestone 1 adds no package dependency. The Discord bot's Python stack and the
planner's Next.js/Better Auth/Drizzle/Bun stack remain external references.

The active Editorial Platform branch was compared before implementation. This
work intentionally avoids its known overlap files, including `src/App.tsx`,
`src/components/AppLayout.tsx`, `package.json`, and core blueprint/governance
documents. It reuses the existing `/gift-codes` route, adds a feature-local
component, and limits shared changes to the existing public-page stylesheet.

## Required approvals before a live milestone

1. Written Century Games permission for third-party redemption automation and
   an official technical contract, credential model, rate limits, security
   controls, acceptable use, and change policy.
2. Clark product/privacy decisions for verified ownership, consent wording and
   version, single versus automatic scope, retention, deletion/pseudonymization,
   support access, and incident response.
3. A licence decision for the Discord bot and source-code licence/assignment
   evidence for the planner.
4. A reviewed Forge migration set that first reconciles the checked-in player
   schema with production, then adds gift-code records, constraints, RLS, safe
   views, grants, indexes, and rollback steps.
5. A durable job platform compatible with Forge deployment, plus observable
   rate limiting, idempotency, circuit breaking, replay tests, and provider
   sandbox certification.
6. Security and legal review of the final provider implementation before the
   feature flag can be enabled in any non-local environment.

Until all six are complete, the supported Forge experience is manual redemption
on the official Century Games page.
