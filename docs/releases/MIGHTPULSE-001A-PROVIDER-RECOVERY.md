# MIGHTPULSE-001A Player Provider Recovery

**Status:** Merged and deployed; both production Town Center schema hotfixes applied; source hotfix validated and pending PR #100 merge

**Branch:** `feature/mightpulse-001a-provider-recovery`

**Starting SHA:** `239262ecc689097307e6cf76c5269d4247de3d59`

## Objective

Restore dependable Player ID lookup, linking, linked-player revalidation and
State validation by replacing the failed `kingshot.net` runtime dependency with
a server-side MightPulse adapter. The milestone keeps the current
`player_accounts` persistence contract and originally introduced no migration,
Player Intelligence datasets or ownership verification. Production acceptance
later required two explicitly approved Town Center schema hotfix migrations;
those are recorded below as part of the final 001A production state.

## Architecture

Before:

```text
Forge UI
  -> /api/player/account
  -> linkedPlayerService
  -> Supabase Edge Function kingshot-player
  -> kingshot.net/api/player-info
```

After:

```text
Forge UI
  -> /api/player/account
  -> linkedPlayerService
  -> PlayerProvider boundary
  -> MightPulsePlayerProvider in the Forge Vercel runtime
  -> https://api.mightpulse.com/v1
  -> existing player_accounts persistence
```

`server/player-identity/providers/playerProvider.ts` owns the provider-neutral
model and error boundary. `mightPulsePlayerProvider.ts` alone owns MightPulse
transport, authentication and payload normalization. Browser code receives
only the existing safe account projection or the normalized administrator
lookup projection; it never receives provider credentials or raw responses.

## Secret boundary

`MIGHTPULSE_API_KEY` is read only in the server provider adapter and is sent as
`Authorization: Bearer ...` to MightPulse. It is not a `VITE_*` variable and is
not written to logs, API responses, fixtures, database rows, documentation
examples or Supabase. `.env.example` contains only
`MIGHTPULSE_API_KEY=server-only-placeholder`. The runtime destination is fixed
to the exact `https://api.mightpulse.com/v1` origin; environment configuration
cannot redirect the bearer credential. A `baseUrl` dependency may be injected
only by synthetic tests.

## Provider contract

Forge performs:

```text
GET https://api.mightpulse.com/v1/players/{governor_id}?include=base
Authorization: Bearer ${MIGHTPULSE_API_KEY}
Accept: application/json
```

Normal Player ID lookup uses the Governor ID path and does not request
`id_type=uid`. Responses are treated as untrusted. The adapter requires a plain
object wrapper, `ok === true`, an exact requested Governor ID, an optional
`id_type` of `governor_id`, a plain-object `player`, a non-empty primitive
`nick_name`, and an integer `kid` from 1 through 9999. A supplied expected State
must match exactly. Town Center is optional, but when present it must be an
integer raw Kingshot Town Center code from 1 through 84. Raw values 31–34
represent the four TC30 sub-stages; 35–84 represent TG1 through TG10 and their
four sub-stages. Unsafe, malformed or non-HTTPS avatar URLs are
ignored. Raw provider payloads are neither logged nor persisted.

## Field mapping

| MightPulse | Normalized provider model | Forge persistence |
| --- | --- | --- |
| `governor_id` | `playerId` | `player_id` |
| `nick_name` | `name` | `player_name` |
| `kid` | `kingdomId` | `kingdom_id` |
| valid `town_center_level` | `townCenterLevel` | `town_center_level` when present |
| safe `avatar_url` | `avatarUrl` | `profile_photo` when present |
| successful Forge fetch time | `providerFetchedAt` | `last_refreshed_at`, `updated_at` |

MightPulse `town_center_level` is never written to generic `player_level`.
Revalidation updates only the provider-owned mapping above. An absent or unsafe
avatar or Town Center is ignored during revalidation rather than clearing a
useful stored value. The update therefore preserves legacy `player_level`,
`level_rendered`, `level_rendered_detailed`, `level_image`, link visibility and every existing
verification/ownership field when MightPulse has no equivalent. A new link
stores unsupported legacy presentation fields as null.

The legacy administrator RPC has no `town_center_level` argument and always
rewrites legacy verification actor/time columns. Operations therefore keeps
MightPulse **Lookup details** read-only and disables provider-backed
administrator apply. The server rejects `mode=lookup` before any target or
Player Account database access. The intentional manual/community-verification
administrator path remains permission-gated, reason-gated and atomically
audited by the existing RPC. A future owner-approved schema/RPC milestone may
add an atomic provider-link contract with Town Center and provenance semantics;
001A does not create or apply that migration.

## Ownership and verification

A MightPulse lookup proves only that a public player record exists. New links
through `/api/player/account` use `verification_status=linked`,
`verification_method=none`, and null verification actor/time fields.
Revalidation never changes existing verification state. A new or replaced
provider-backed administrator link is not available in 001A because the legacy
RPC cannot represent it without contradictory verification provenance.
MightPulse administrator lookup is read-only and cannot change `verified_by`,
`verified_at`, `officially_verified` provenance or any Player Account field.
UI verification-date presentation remains gated on a positive verification
status, so `linked`/`none` is never presented as verified. Resolving the legacy
RPC ambiguity requires a separately approved governed contract update.
AUTO-REDEEM continues to require its separate ownership-verified state and is
otherwise unchanged.

## Freshness and quota policy

The server is authoritative for a 60-minute freshness TTL based on
`player_accounts.last_refreshed_at`:

- automatic revalidation inside the TTL returns the existing safe account and
  performs zero MightPulse calls;
- an idempotent same-player `action=link` follows the same freshness policy and
  performs zero provider calls while fresh, but only after the requested State
  exactly matches the stored linked State; a mismatch returns deterministic
  `409 STATE_MISMATCH` without consuming provider quota;
- stale or malformed refresh timestamps cause one provider lookup;
- an explicit manual refresh may bypass the 60-minute TTL only after a
  server-authoritative five-minute minimum interval, also persisted through
  `last_refreshed_at`;
- browser mutation events use automatic refresh, so profile/progression saves
  do not force provider calls;
- every authenticated `/api/player/account` attempt is additionally protected
  by a simple per-instance 20-request/five-minute throttle, covering failed and
  unlinked lookups without relying on browser state; expired throttle entries
  are opportunistically swept at most once per throttle window without timers;
- both Forge and provider 429 responses join the browser transient-failure
  cooldown;
- concurrent lookups for the same Player ID and expected State share one
  in-flight request within a warm Vercel instance.

The in-memory single-flight and attempt throttle are deliberately best-effort
per-instance controls, not a distributed cache. Persisted database freshness is
the cross-instance successful-refresh quota boundary. A distributed failed-attempt limiter remains deferred. The two production
acceptance migrations are limited to the Town Center persistence/range contract
and do not add a cache service, limiter table or other quota infrastructure.

## Timeout policy

The old 12–15 second lookup timeout is retired for the live path. MightPulse
may synchronously refresh stale base data, so the adapter defaults to a bounded
45-second timeout. `MIGHTPULSE_TIMEOUT_MS` may be configured from 1,000 through
55,000 milliseconds. `api/player/account.ts` has a 60-second Vercel
`maxDuration`, leaving time for authentication, persistence and a safe error
response after provider abort. The request is never unbounded.

## Error mapping

| MightPulse/provider outcome | Forge HTTP | Safe code |
| --- | ---: | --- |
| `404` unknown player | 404 | `PLAYER_NOT_FOUND` |
| `429` quota/rate limit | 429 | `PLAYER_LOOKUP_RATE_LIMITED` |
| Forge authenticated attempt limit | 429 | `PLAYER_ACCOUNT_RATE_LIMITED` |
| `401` missing/invalid provider authentication | 503 | `PLAYER_PROVIDER_UNAVAILABLE` |
| `400` rejected integration request | 502 | `PLAYER_PROVIDER_INVALID_REQUEST` |
| malformed/non-JSON `2xx` | 502 | `PLAYER_PROVIDER_INVALID_RESPONSE` |
| provider `5xx` | 503 | `PLAYER_PROVIDER_UNAVAILABLE` |
| network failure | 502 | `PLAYER_PROVIDER_UNREACHABLE` |
| bounded timeout | 504 | `PLAYER_PROVIDER_TIMEOUT` |
| expected State mismatch | 409 | `STATE_MISMATCH` |

Provider response bodies, authentication details and exception bodies never
cross the Forge API boundary.

## Supabase Edge Function status

`supabase/functions/kingshot-player/index.ts` remains unchanged as historical
recovery context. The live `/api/player/account` and Operations lookup paths no
longer call it. No MightPulse key is copied into Supabase and no Supabase Edge
Function or configuration change is required. Production acceptance did apply
exactly two approved schema migrations:

- `20260829212144_mightpulse_player_account_town_center_level` adds nullable
  `public.player_accounts.town_center_level` with the initial range guard;
- `20260829213913_mightpulse_town_center_raw_level_range` widens the Town Center
  CHECK constraints on `public.player_accounts` and
  `public.player_progression_snapshots` to the verified raw range `1..84`.

Neither migration backfills rows or changes verification/ownership state.

## Tests and validation

Synthetic tests cover valid normalization, ID and State mismatch, invalid
State, malformed wrappers, missing nickname, Town Center validation, missing
or unsafe avatars, provider 400/401/404/429/5xx outcomes, timeout, network
failure, secret redaction, server freshness, stale refresh, manual bypass,
manual minimum interval, same-player link idempotency, authenticated attempt
throttling, fixed runtime credential destination, legacy-field preservation,
Town Center/player-level separation and the non-verifying link boundary.
Operations tests prove provider apply is rejected before database access,
cross-player legacy fields cannot be carried through that path, lookup cannot
restamp verification provenance, and the manual community-verification RPC
contract remains unchanged. Existing Player Identity tests retain duplicate
account and primary-player protections.

Required validation commands:

```text
npm run test:player-identity
npm run test:player-identity-resilience
npm run test:ux003-contracts
npm run lint
npm run build
git diff --check
npm run check
```

Local result on 29 August 2026:

- `npm run check` passes end to end, including the pinned Sharp production
  dependency, the new synthetic provider/freshness/ownership suite, Player link
  service, Player State linking, Auto Redeem ownership gates, security checks,
  lint and the production build;
- the focused resilience and UX-003 contract commands pass;
- lint completes with the same 11 existing warnings and no errors;
- TypeScript/Vite production build and `git diff --check` pass;
- one earlier standalone `npm run test:player-identity` invocation reached and
  passed every new MIGHTPULSE test before Windows Application Control blocked
  the pinned Sharp ARM64 binary; the subsequent canonical full check loaded the
  same dependency and passed without a dependency, policy or test bypass.

## Production acceptance incident — 29 August 2026

The first production acceptance pass exposed a schema mismatch before any
MightPulse call occurred. The deployed Player Passport and linked-player service
select `player_accounts.town_center_level`, but production `player_accounts`
did not yet contain that column. The browser therefore failed closed while
loading the linked account.

The corrective hotfix adds a nullable integer `town_center_level` column with
an initial 1–30 range constraint and no backfill. Live provider acceptance then
proved that the upstream/game raw Town Center code continues beyond 30 for
TC30 sub-stages and Truegold progression. A follow-up correction widens the
raw-level constraint to 1–84 on both `player_accounts` and
`player_progression_snapshots`, without changing any row values. Existing generic
`player_level` and legacy rendered-level fields remain untouched and are not
reinterpreted as Town Center. The Player Passport summary is also corrected to
show the explicit `town_center_level` value only, or an honest
`Town Center not recorded` state.

The two Town Center migrations were explicitly owner-approved and applied during
production acceptance. Production verification confirmed both affected CHECK
constraints allow `NULL` or raw Town Center values `1..84`; no existing
`player_accounts.town_center_level` values were backfilled or rewritten. A subsequent exact-head Codex review identified two UI
semantics defects: the identity context could still infer a Passport Town Center
from legacy rendered text, and several views displayed raw 35–84 codes as literal
Town Center levels. The hotfix now preserves the persisted explicit field in the
identity context and routes raw-value presentation through the shared formatter.
The profile service also no longer falls back from Town Center to generic
`player_level`.

## Rollback

Revert the MIGHTPULSE-001A implementation and correction commits to restore the
former application call path if an application rollback is required. The two
Town Center production migrations are backward-compatible schema changes and do
not need to be reversed merely to roll back application code. Any schema
reversal must be a separate, explicitly approved migration; do not delete the
column or tighten the range ad hoc. No migration performed a data backfill or
rewrote verification/ownership state.

## Deferred MIGHTPULSE-001B+

Power, VIP, kills, Alliance details, Heroes, Governor Gear, rankings,
historical observations, activity/online status, coordinates, shields,
Alliance rosters and Kingdom intelligence remain deferred. A later approved
milestone must define canonical ownership, retention, quota and publication
contracts before persisting those fields.
