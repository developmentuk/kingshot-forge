# MIGHTPULSE-001A Player Provider Recovery

**Status:** Implemented; full local gate passes; not deployed or production-accepted

**Branch:** `feature/mightpulse-001a-provider-recovery`

**Starting SHA:** `239262ecc689097307e6cf76c5269d4247de3d59`

## Objective

Restore dependable Player ID lookup, linking, linked-player revalidation and
State validation by replacing the failed `kingshot.net` runtime dependency with
a server-side MightPulse adapter. The milestone keeps the current
`player_accounts` persistence contract and does not introduce a migration,
Player Intelligence datasets or ownership verification.

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
integer from 1 through 30. Unsafe, malformed or non-HTTPS avatar URLs are
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
  performs zero provider calls while fresh;
- stale or malformed refresh timestamps cause one provider lookup;
- an explicit manual refresh may bypass the 60-minute TTL only after a
  server-authoritative five-minute minimum interval, also persisted through
  `last_refreshed_at`;
- browser mutation events use automatic refresh, so profile/progression saves
  do not force provider calls;
- every authenticated `/api/player/account` attempt is additionally protected
  by a simple per-instance 20-request/five-minute throttle, covering failed and
  unlinked lookups without relying on browser state;
- both Forge and provider 429 responses join the browser transient-failure
  cooldown;
- concurrent lookups for the same Player ID and expected State share one
  in-flight request within a warm Vercel instance.

The in-memory single-flight and attempt throttle are deliberately best-effort
per-instance controls, not a distributed cache. Persisted database freshness is
the cross-instance successful-refresh quota boundary. A distributed failed-
attempt limiter remains deferred because 001A permits neither a migration nor a
new cache service.

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
longer call it. No MightPulse key is copied into Supabase, no migration is
created or applied, and no Supabase configuration is changed.

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

## Rollback

Revert the MIGHTPULSE-001A implementation and correction commits. That restores
the former Supabase Edge Function call path and removes the new
environment/configuration entries. No database rollback is necessary because
the milestone adds no migration and does not rewrite legacy data.

## Deferred MIGHTPULSE-001B+

Power, VIP, kills, Alliance details, Heroes, Governor Gear, rankings,
historical observations, activity/online status, coordinates, shields,
Alliance rosters and Kingdom intelligence remain deferred. A later approved
milestone must define canonical ownership, retention, quota and publication
contracts before persisting those fields.
